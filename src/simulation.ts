import type { SimParams } from './data';

export interface SimResult {
  year: number;
  tax: number;
  bojPayment: number;
  bojNetIncome: number;
  bojCumulativeLoss: number;
  totalRevenue: number;
  policyExp: number;
  avgCoupon: number;
  interest: number;
  totalCost: number;
  debt: number;
  fiscalBalance: number;
  interestBurden: number;
  bojRev: number;
  bojCost: number;
  policyRate: number;
  taxConsumption: number;
  taxIncome: number;
  taxCorporate: number;
  taxOther: number;
  bondIssuance: number;
  otherRevStamp: number;
  otherRevGov: number;
  otherRevAsset: number;
  otherRevMisc: number;
  exchangeRate: number;
  importAmount: number;
  exportAmount: number;
  tradeBalance: number;
  realWageGrowth: number;
  povertyRate: number;
  giniIndex: number;
  energySubsidy: number;
  fxValuationGain: number;
  cpiIncrease: number;
  wageIncrease: number;
  modelIncome: number;
  modelDisposable: number;
  modelFoodCost: number;
  modelEnergyCost: number;
  modelFoodCostChange: number;
  modelEnergyCostChange: number;
  modelDisposableChange: number;
  incomeRatio: number;
  currentAccount: number;
  nfa: number;
  dynamicRiskPremium: number;
  effectiveMarketRate: number;
  bojJGB: number;
  bojCAActual: number;
  bojYieldActual: number;
  fiscalRiskPremium: number;
  socialSecurity: number;
  childcare: number;
  localGovTransfer: number;
  defense: number;
  otherPolicyExp: number;
  bondRevenue: number;
  revenueTotal: number;
  revenueTaxRatio: number;
  revenueBondRatio: number;
  revenueOtherRatio: number;
  realPolicyExpIndex: number;
  nominalGDP: number;
  debtToGDP: number;
  corporateProfit: number;
  retainedEarnings: number;
  retainedToGDP: number;
  endogenousWage: number;
  nfaDeteriorationStreak: number;
}

function giniToIncomeRatio(gini: number): number {
  const ratio = (1 + gini) / (1 - gini);
  return Math.max(ratio, 1);
}

const BASE_INCOME = 400;
const BASE_FOOD_RATIO = 0.255;
const BASE_ENERGY_RATIO = 0.073;
const TAX_SOCIAL_RATIO = 0.30;

export function runSimulation(p: SimParams): SimResult[] {
  const B = p.inflationRate / 100;
  const C = p.realGrowth / 100;
  const D = B + C;
  const changeYear = p.taxRateChangeYear !== "なし" ? parseInt(p.taxRateChangeYear) : null;

  const baseBias = p.yenDepreciation / 100;
  const baseNomWageG = p.nominalWageGrowth / 100;
  const globalG = p.globalGrowth / 100;
  const prodShare = p.productivityShareRate;
  const wagePassThrough = p.wagePassThroughRate;
  const foreignRate = p.foreignInterestRate / 100;
  const foreignCpi = p.foreignInflation / 100;

  const FX_ALPHA = 0.5;
  const FX_BETA = 0.3;
  const FX_GAMMA = 0.5;

  const baseEnergyAmount = p.inflationRate * 10;

  const results: SimResult[] = [];
  let bojCumulativeLoss = 0;
  let retainedEarnings = p.initRetainedEarnings;
  let bojJGB = p.initBojJGB;
  let bojCAActual = p.bojCA;
  let bojYieldActual = p.bojYield / 100;
  let nfaDeteriorationStreak = 0;

  for (let i = 0; i < 30; i++) {
    const year = 2026 + i;

    const prevNFA = i === 0 ? p.initNFA : results[i - 1].nfa;
    const prevCurrentAccount = i === 0 ? 0 : results[i - 1].currentAccount;
    const prevInterestBurden = i === 0 ? 12.8 : results[i - 1].interestBurden;

    if (i >= 2) {
      const ca1 = results[i - 1].currentAccount;
      const ca2 = results[i - 2].currentAccount;
      const delta = ca1 - ca2;
      if (delta < 0 && ca1 < 0) {
        nfaDeteriorationStreak++;
      } else {
        nfaDeteriorationStreak = Math.max(nfaDeteriorationStreak - 1, 0);
      }
    }

    let dynamicRiskPremium = 0;
    if (i > 0 && prevCurrentAccount < 0 && prevNFA < p.nfaThreshold) {
      const accelerationFactor = 1 + nfaDeteriorationStreak * 0.3;
      dynamicRiskPremium = (p.currencyRiskPremium / 100) * accelerationFactor;
    }

    let fiscalRiskPremium = 0;
    if (prevInterestBurden > p.interestBurdenThreshold) {
      fiscalRiskPremium = (prevInterestBurden - p.interestBurdenThreshold) * p.fiscalRiskSensitivity / 100;
    }

    const baseMarketRate = D + p.riskPremium / 100;
    const E = baseMarketRate + dynamicRiskPremium + fiscalRiskPremium;

    if (i > 0) {
      bojCAActual = Math.max(bojCAActual - p.bojQTRate, p.bojCAFloor);
      bojJGB = Math.max(bojJGB - p.bojQTRate, p.bojCAFloor);
      bojYieldActual = (bojYieldActual * 8 / 9) + (E * 1 / 9);
    }

    if (i === 0) {
      const policyRate = Math.max(E - p.policyRateSpread / 100, 0);
      const bojRev = bojJGB * bojYieldActual;
      const bojCost = bojCAActual * policyRate;
      const bojNetIncome = bojRev - bojCost;
      if (bojNetIncome < 0) {
        bojCumulativeLoss += Math.abs(bojNetIncome);
      } else {
        bojCumulativeLoss = Math.max(bojCumulativeLoss - bojNetIncome, 0);
      }
      const bojPayment = bojCumulativeLoss > p.bojCapitalBuffer
        ? bojNetIncome
        : Math.max(bojNetIncome, 0);

      const yenDepRaw = baseBias + FX_ALPHA * (foreignRate - E) + FX_BETA * (B - foreignCpi) + FX_GAMMA * dynamicRiskPremium;
      const yenDep = Math.max(yenDepRaw, -0.5);
      const exchangeRate = p.initExchangeRate * (1 + yenDep);
      const yenFactor = (exchangeRate / p.initExchangeRate - 1);
      const fxPassThrough = Math.max(yenFactor, 0) * 0.7;

      const importAmount = p.initImport * (1 + C) * (1 + B) * (1 + fxPassThrough);
      const exportAmount = p.initExport * (1 + globalG) * (1 + Math.max(yenFactor, 0) * 0.15);
      const tradeBalance = exportAmount - importAmount;

      const realNFA = prevNFA / (1 + Math.max(yenFactor, 0));
      const investmentIncome = realNFA * 0.03 * (1 + Math.max(yenFactor, 0) * 0.5);
      const currentAccount = tradeBalance + investmentIncome;
      const nfa = prevNFA + currentAccount;

      const fxValuationGain = p.fxReserves * yenFactor;

      const nominalGDP = p.initNominalGDP * (1 + D);
      const endogenousWage = C * prodShare + B * wagePassThrough;
      const nomWageG = Math.max(endogenousWage, baseNomWageG);

      // Fix 3: 初年度も成長率を適用
      let taxConsumption = p.initTaxConsumption * (1 + B * 1.0);
      if (changeYear !== null && year >= changeYear) {
        taxConsumption = taxConsumption * (p.taxRateNew / 10.0);
      }
      // Fix 5: 所得税に内生賃金を反映（初年度はnomWageGベース）
      const taxIncome = p.initTaxIncome * (1 + (D * 0.5 + nomWageG * 0.5) * 1.4);

      const exportProfit = Math.max(yenFactor, 0) * 0.3;
      const importCost = Math.max(yenFactor, 0) * 0.2;
      const taxCorporate = p.initTaxCorporate * (1 + C * 2.0 + B * 0.5) * (1 + exportProfit - importCost);
      const taxOther = p.initTaxOther * (1 + D * 0.8);
      const tax = taxConsumption + taxIncome + taxCorporate + taxOther;

      const corporateProfit = taxCorporate / p.effectiveCorporateTaxRate;
      const laborCostPressure = nominalGDP * prodShare * nomWageG;
      const netCorporateIncome = corporateProfit - laborCostPressure;
      const returnToWorkers = retainedEarnings * p.retainedEarningsReturnRate;
      retainedEarnings = retainedEarnings + netCorporateIncome - returnToWorkers;
      const retainedToGDP = (retainedEarnings / nominalGDP) * 100;
      const debtToGDP = (p.initDebt / nominalGDP) * 100;

      const returnBoostToWage = nominalGDP > 0 ? (returnToWorkers / nominalGDP) : 0;

      const yenCostPush = Math.max(yenFactor, 0) * 0.3;
      // Fix 1: 消費税率変更→CPI反映（変更年度のみ一時的CPI上昇）
      const consumptionTaxCpiEffect = (changeYear !== null && year === changeYear)
        ? (p.taxRateNew - 10) / (100 + 10) * 0.4
        : 0;
      const cpiIncrease = B + yenCostPush + consumptionTaxCpiEffect;
      const energySubsidyEffect = cpiIncrease * p.energySubsidyRate * 0.5;
      const effectiveCpi = cpiIncrease - energySubsidyEffect;
      const wageIncrease = nomWageG + returnBoostToWage;
      const realWageGrowth = wageIncrease - effectiveCpi;

      const effectiveSensitivity = p.povertySensitivity * (1 + (1 - prodShare) * 0.5);
      const povertyRate = effectiveCpi > wageIncrease
        ? p.initPovertyRate * (1 + (effectiveCpi - wageIncrease) * effectiveSensitivity)
        : p.initPovertyRate * (1 - (wageIncrease - effectiveCpi) * effectiveSensitivity * 0.3);

      const assetGrowth = yenFactor * 0.5 + C;
      const giniIndex = p.initGini + (assetGrowth - realWageGrowth) * 0.01;

      // Fix 2: エネルギー補助金の動的化（プランB）
      const energyCostIndex = (1 + cpiIncrease) * (1 + Math.max(yenFactor, 0) * 0.5);
      const energySubsidy = baseEnergyAmount * p.energySubsidyRate * energyCostIndex;

      const otherRevWithFx = p.otherRevenue + Math.max(fxValuationGain * 0.1, 0);

      const avgCoupon = p.initAvgCoupon / 100;
      const interest = p.initDebt * avgCoupon;

      const socialSecurity = p.initSocialSecurity;
      const childcare = p.initChildcare;
      const localGovTransfer = p.initLocalGovTransfer;
      const defense = p.initDefense;
      const knownExp = socialSecurity + childcare + localGovTransfer + defense + energySubsidy;
      const otherPolicyExp = Math.max(p.initPolicyExp - knownExp + energySubsidy, 0);
      const policyExp = socialSecurity + childcare + localGovTransfer + defense + otherPolicyExp + energySubsidy;

      const taxTotal = taxConsumption + taxIncome + taxCorporate + taxOther;
      const totalRevenue = taxTotal + bojPayment + otherRevWithFx;
      const totalCost = policyExp + interest;
      const fiscalBalance = totalRevenue - totalCost;
      const debt = p.initDebt + (totalCost - totalRevenue);
      const interestBurden = taxTotal !== 0 ? (interest / taxTotal) * 100 : 0;
      const bondIssuance = Math.max(totalCost - totalRevenue, 0);

      const bondRevenue = bondIssuance;
      const revenueTotal = totalRevenue + bondRevenue;
      const revenueTaxRatio = revenueTotal > 0 ? (taxTotal / revenueTotal) * 100 : 0;
      const revenueBondRatio = revenueTotal > 0 ? (bondRevenue / revenueTotal) * 100 : 0;
      const revenueOtherRatio = revenueTotal > 0 ? ((bojPayment + otherRevWithFx) / revenueTotal) * 100 : 0;

      const realPolicyExpIndex = 100;

      const modelIncome = BASE_INCOME * (1 + nomWageG);
      const modelFoodCost = BASE_INCOME * BASE_FOOD_RATIO * (1 + cpiIncrease);
      const modelEnergyCostGross = BASE_INCOME * BASE_ENERGY_RATIO * (1 + cpiIncrease) * (1 + Math.max(yenFactor, 0) * 0.5);
      const modelEnergyCost = modelEnergyCostGross * (1 - p.energySubsidyRate * 0.5);
      let modelDisposable = modelIncome * (1 - TAX_SOCIAL_RATIO) - modelFoodCost - modelEnergyCost;
      // Fix 6: 消費税率変更→家計の残りの消費にも負担増
      if (changeYear !== null && year >= changeYear) {
        const consumptionTaxBurden = Math.max(modelDisposable, 0) * (p.taxRateNew - 10) / (100 + p.taxRateNew);
        modelDisposable -= consumptionTaxBurden;
      }
      const baseDisposable = BASE_INCOME * (1 - TAX_SOCIAL_RATIO) - BASE_INCOME * BASE_FOOD_RATIO - BASE_INCOME * BASE_ENERGY_RATIO;

      results.push({
        year, tax: taxTotal, bojPayment, bojNetIncome, bojCumulativeLoss,
        totalRevenue, policyExp,
        avgCoupon: avgCoupon * 100, interest, totalCost, debt,
        fiscalBalance, interestBurden, bojRev, bojCost,
        policyRate: policyRate * 100,
        taxConsumption, taxIncome, taxCorporate, taxOther,
        bondIssuance,
        otherRevStamp: otherRevWithFx * 0.30,
        otherRevGov: otherRevWithFx * 0.20,
        otherRevAsset: otherRevWithFx * 0.25,
        otherRevMisc: otherRevWithFx * 0.25,
        exchangeRate, importAmount, exportAmount, tradeBalance,
        realWageGrowth: realWageGrowth * 100,
        povertyRate, giniIndex,
        energySubsidy, fxValuationGain,
        cpiIncrease: cpiIncrease * 100,
        wageIncrease: wageIncrease * 100,
        modelIncome, modelDisposable,
        modelFoodCost, modelEnergyCost,
        modelFoodCostChange: modelFoodCost - BASE_INCOME * BASE_FOOD_RATIO,
        modelEnergyCostChange: modelEnergyCost - BASE_INCOME * BASE_ENERGY_RATIO,
        modelDisposableChange: modelDisposable - baseDisposable,
        incomeRatio: giniToIncomeRatio(giniIndex),
        currentAccount, nfa,
        dynamicRiskPremium: dynamicRiskPremium * 100,
        effectiveMarketRate: E * 100,
        bojJGB, bojCAActual, bojYieldActual: bojYieldActual * 100,
        fiscalRiskPremium: fiscalRiskPremium * 100,
        socialSecurity, childcare, localGovTransfer, defense, otherPolicyExp,
        bondRevenue, revenueTotal, revenueTaxRatio, revenueBondRatio, revenueOtherRatio,
        realPolicyExpIndex,
        nominalGDP, debtToGDP, corporateProfit, retainedEarnings, retainedToGDP,
        endogenousWage: endogenousWage * 100,
        nfaDeteriorationStreak,
      });
    } else {
      const prev = results[i - 1];

      const yenDepRaw = baseBias + FX_ALPHA * (foreignRate - E) + FX_BETA * (B - foreignCpi) + FX_GAMMA * dynamicRiskPremium;
      const yenDep = Math.max(yenDepRaw, -0.5);
      const exchangeRate = prev.exchangeRate * (1 + yenDep);
      const yenFactor = (exchangeRate / p.initExchangeRate - 1);
      const fxPassThrough = Math.max(yenDep, 0) * 0.7;

      const importAmount = prev.importAmount * (1 + C) * (1 + B) * (1 + fxPassThrough);
      const exportAmount = prev.exportAmount * (1 + globalG) * (1 + Math.max(yenDep, 0) * 0.15);
      const tradeBalance = exportAmount - importAmount;

      const realNFA = prevNFA / (1 + Math.max(yenFactor, 0));
      const investmentIncome = realNFA * 0.03 * (1 + Math.max(yenFactor, 0) * 0.5);
      const currentAccount = tradeBalance + investmentIncome;
      const nfa = prevNFA + currentAccount;

      const fxValuationGain = p.fxReserves * yenDep;

      const nominalGDP = prev.nominalGDP * (1 + D);
      const endogenousWage = C * prodShare + B * wagePassThrough;
      const nomWageG = Math.max(endogenousWage, baseNomWageG);

      // Fix 5: 所得税に前年の内生賃金を反映（賃金成長50% + 名目成長50%のブレンド）
      const prevWageDriver = prev.wageIncrease / 100;
      const taxIncomeGrowth = (D * 0.5 + prevWageDriver * 0.5) * 1.4;

      let taxConsumption = prev.taxConsumption * (1 + B * 1.0);
      if (changeYear !== null && year === changeYear) {
        taxConsumption = prev.taxConsumption * (1 + B * 1.0) * (p.taxRateNew / 10.0);
      }
      const taxIncome = prev.taxIncome * (1 + taxIncomeGrowth);

      const exportProfit = Math.max(yenDep, 0) * 0.3;
      const importCost = Math.max(yenDep, 0) * 0.2;
      const taxCorporate = prev.taxCorporate * (1 + C * 2.0 + B * 0.5) * (1 + exportProfit - importCost);
      const taxOther = prev.taxOther * (1 + D * 0.8);
      const tax = taxConsumption + taxIncome + taxCorporate + taxOther;

      const corporateProfit = taxCorporate / p.effectiveCorporateTaxRate;
      const laborCostPressure = nominalGDP * prodShare * nomWageG;
      const netCorporateIncome = corporateProfit - laborCostPressure;
      const returnToWorkers = retainedEarnings * p.retainedEarningsReturnRate;
      retainedEarnings = retainedEarnings + netCorporateIncome - returnToWorkers;
      const retainedToGDP = (retainedEarnings / nominalGDP) * 100;

      const returnBoostToWage = nominalGDP > 0 ? (returnToWorkers / nominalGDP) : 0;

      const yenCostPush = Math.max(yenDep, 0) * 0.3;
      // Fix 1: 消費税率変更→CPI反映（変更年度のみ一時的CPI上昇）
      const consumptionTaxCpiEffect = (changeYear !== null && year === changeYear)
        ? (p.taxRateNew - 10) / (100 + 10) * 0.4
        : 0;
      const cpiIncrease = B + yenCostPush + consumptionTaxCpiEffect;
      const energySubsidyEffect = cpiIncrease * p.energySubsidyRate * 0.5;
      const effectiveCpi = cpiIncrease - energySubsidyEffect;
      const wageIncrease = nomWageG + returnBoostToWage;
      const realWageGrowth = wageIncrease - effectiveCpi;

      const effectiveSensitivity = p.povertySensitivity * (1 + (1 - prodShare) * 0.5);
      const povertyRate = effectiveCpi > wageIncrease
        ? prev.povertyRate * (1 + (effectiveCpi - wageIncrease) * effectiveSensitivity)
        : prev.povertyRate * (1 - (wageIncrease - effectiveCpi) * effectiveSensitivity * 0.3);

      const assetGrowth = Math.max(yenDep, 0) * 0.5 + C;
      const giniIndex = prev.giniIndex + (assetGrowth - realWageGrowth) * 0.01;

      const policyRate = Math.max(E - p.policyRateSpread / 100, 0);
      const bojRev = bojJGB * bojYieldActual;
      const bojCost = bojCAActual * policyRate;
      const bojNetIncome = bojRev - bojCost;
      if (bojNetIncome < 0) {
        bojCumulativeLoss += Math.abs(bojNetIncome);
      } else {
        bojCumulativeLoss = Math.max(bojCumulativeLoss - bojNetIncome, 0);
      }
      const bojPayment = bojCumulativeLoss > p.bojCapitalBuffer
        ? bojNetIncome
        : Math.max(bojNetIncome, 0);

      const otherRevWithFx = p.otherRevenue + Math.max(fxValuationGain * 0.1, 0);
      const totalRevenue = tax + bojPayment + otherRevWithFx;

      // Fix 2: エネルギー補助金の動的化（プランB：CPI＋円安連動）
      const energyCostIndex = (1 + cpiIncrease) * (1 + Math.max(yenDep, 0) * 0.5);
      const energySubsidy = baseEnergyAmount * p.energySubsidyRate * energyCostIndex;

      const socialSecurity = prev.socialSecurity * (1 + B) + p.naturalIncrease * 0.7;
      const childcare = prev.childcare * (1 + p.childcareGrowth / 100);
      const localGovTransfer = prev.localGovTransfer * (1 + D * 0.5);
      const defense = prev.defense * (1 + p.defenseGrowth / 100);
      const prevOtherBase = prev.otherPolicyExp;
      const otherPolicyExp = prevOtherBase * (1 + B);
      const policyExp = socialSecurity + childcare + localGovTransfer + defense + otherPolicyExp + energySubsidy;

      // Fix 4: 新規国債発行の平均クーポン反映（借換1/9 + 新発債分）
      const prevBondShare = prev.debt > 0 ? prev.bondIssuance / prev.debt : 0;
      const totalNewShare = Math.min(1 / 9 + prevBondShare, 0.3);
      const avgCouponDec = (prev.avgCoupon / 100 * (1 - totalNewShare)) + (E * totalNewShare);

      const interest = prev.debt * avgCouponDec;
      const totalCost = policyExp + interest;
      const fiscalBalance = totalRevenue - totalCost;
      const debt = prev.debt + (totalCost - totalRevenue);
      const debtToGDP = (debt / nominalGDP) * 100;
      const interestBurden = tax !== 0 ? (interest / tax) * 100 : 0;
      const bondIssuance = Math.max(totalCost - totalRevenue, 0);

      const bondRevenue = bondIssuance;
      const revenueTotal = totalRevenue + bondRevenue;
      const revenueTaxRatio = revenueTotal > 0 ? (tax / revenueTotal) * 100 : 0;
      const revenueBondRatio = revenueTotal > 0 ? (bondRevenue / revenueTotal) * 100 : 0;
      const revenueOtherRatio = revenueTotal > 0 ? ((bojPayment + otherRevWithFx) / revenueTotal) * 100 : 0;

      const cumulativeInflation = Math.pow(1 + B, i);
      const basePolicyExp = results[0].policyExp;
      const realPolicyExpIndex = basePolicyExp > 0 ? (policyExp / cumulativeInflation / basePolicyExp) * 100 : 100;

      const cumulativeCpi = results.reduce((acc, r) => acc * (1 + r.cpiIncrease / 100), 1) * (1 + cpiIncrease);
      const cumulativeWage = results.reduce((acc, r) => acc * (1 + r.wageIncrease / 100), 1) * (1 + wageIncrease);
      const cumulativeYenDep = exchangeRate / p.initExchangeRate - 1;
      const modelIncome = BASE_INCOME * cumulativeWage;
      const modelFoodCost = BASE_INCOME * BASE_FOOD_RATIO * cumulativeCpi;
      const modelEnergyCostGross = BASE_INCOME * BASE_ENERGY_RATIO * cumulativeCpi * (1 + Math.max(cumulativeYenDep, 0) * 0.5);
      const modelEnergyCost = modelEnergyCostGross * (1 - p.energySubsidyRate * 0.5);
      let modelDisposable = modelIncome * (1 - TAX_SOCIAL_RATIO) - modelFoodCost - modelEnergyCost;
      // Fix 6: 消費税率変更→家計の食費・光熱費以外の消費にも負担増
      if (changeYear !== null && year >= changeYear) {
        const consumptionTaxBurden = Math.max(modelDisposable, 0) * (p.taxRateNew - 10) / (100 + p.taxRateNew);
        modelDisposable -= consumptionTaxBurden;
      }
      const baseDisposable = BASE_INCOME * (1 - TAX_SOCIAL_RATIO) - BASE_INCOME * BASE_FOOD_RATIO - BASE_INCOME * BASE_ENERGY_RATIO;

      results.push({
        year, tax, bojPayment, bojNetIncome, bojCumulativeLoss,
        totalRevenue, policyExp,
        avgCoupon: avgCouponDec * 100, interest, totalCost, debt,
        fiscalBalance, interestBurden, bojRev, bojCost,
        policyRate: policyRate * 100,
        taxConsumption, taxIncome, taxCorporate, taxOther,
        bondIssuance,
        otherRevStamp: otherRevWithFx * 0.30,
        otherRevGov: otherRevWithFx * 0.20,
        otherRevAsset: otherRevWithFx * 0.25,
        otherRevMisc: otherRevWithFx * 0.25,
        exchangeRate, importAmount, exportAmount, tradeBalance,
        realWageGrowth: realWageGrowth * 100,
        povertyRate, giniIndex,
        energySubsidy, fxValuationGain,
        cpiIncrease: cpiIncrease * 100,
        wageIncrease: wageIncrease * 100,
        modelIncome, modelDisposable,
        modelFoodCost, modelEnergyCost,
        modelFoodCostChange: modelFoodCost - BASE_INCOME * BASE_FOOD_RATIO,
        modelEnergyCostChange: modelEnergyCost - BASE_INCOME * BASE_ENERGY_RATIO,
        modelDisposableChange: modelDisposable - baseDisposable,
        incomeRatio: giniToIncomeRatio(giniIndex),
        currentAccount, nfa,
        dynamicRiskPremium: dynamicRiskPremium * 100,
        effectiveMarketRate: E * 100,
        bojJGB, bojCAActual, bojYieldActual: bojYieldActual * 100,
        fiscalRiskPremium: fiscalRiskPremium * 100,
        socialSecurity, childcare, localGovTransfer, defense, otherPolicyExp,
        bondRevenue, revenueTotal, revenueTaxRatio, revenueBondRatio, revenueOtherRatio,
        realPolicyExpIndex,
        nominalGDP, debtToGDP, corporateProfit, retainedEarnings, retainedToGDP,
        endogenousWage: endogenousWage * 100,
        nfaDeteriorationStreak,
      });
    }
  }

  return results;
}
