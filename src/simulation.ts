import type { SimParams } from './data';

export interface SimResult {
  year: number;
  tax: number;
  bojPayment: number;
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
  const E = D + p.riskPremium / 100;
  const changeYear = p.taxRateChangeYear !== "なし" ? parseInt(p.taxRateChangeYear) : null;

  const yenDep = p.yenDepreciation / 100;
  const nomWageG = p.nominalWageGrowth / 100;
  const globalG = p.globalGrowth / 100;

  const results: SimResult[] = [];

  for (let i = 0; i < 30; i++) {
    const year = 2026 + i;

    if (i === 0) {
      const policyRate = Math.max(E - p.policyRateSpread / 100, 0);
      const bojRev = p.initDebt * (p.bojYield / 100);
      const bojCost = p.bojCA * policyRate;
      const bojPayment = Math.max(bojRev - bojCost, 0);
      let taxConsumption = p.initTaxConsumption;
      if (changeYear !== null && year >= changeYear) {
        taxConsumption = taxConsumption * (p.taxRateNew / 10.0);
      }
      const taxIncome = p.initTaxIncome;
      const taxCorporate = p.initTaxCorporate;
      const taxOther = p.initTaxOther;
      const tax = taxConsumption + taxIncome + taxCorporate + taxOther;

      const exchangeRate = p.initExchangeRate * (1 + yenDep);
      const yenFactor = (exchangeRate / p.initExchangeRate - 1);
      const yenBenefit = yenFactor * 0.5;

      const importAmount = p.initImport * (1 + C) * (1 + B * (1 + yenFactor));
      const exportAmount = p.initExport * (1 + globalG) * (1 + yenBenefit);
      const tradeBalance = exportAmount - importAmount;

      const fxValuationGain = p.fxReserves * yenFactor;

      const yenCostPush = Math.max(yenFactor, 0) * 0.3;
      const cpiIncrease = B + yenCostPush;
      const wageIncrease = nomWageG;
      const realWageGrowth = wageIncrease - cpiIncrease;

      const povertyRate = cpiIncrease > wageIncrease
        ? p.initPovertyRate * (1 + (cpiIncrease - wageIncrease) * p.povertySensitivity)
        : p.initPovertyRate * (1 - (wageIncrease - cpiIncrease) * p.povertySensitivity * 0.3);

      const assetGrowth = yenFactor * 0.5 + C;
      const giniIndex = p.initGini + (assetGrowth - realWageGrowth) * 0.01;

      const exportProfit = Math.max(yenFactor, 0) * 0.3;
      const importCost = Math.max(yenFactor, 0) * 0.2;
      const taxCorporateAdj = taxCorporate * (1 + exportProfit - importCost);

      const energySubsidy = B * p.energySubsidyRate * 10;

      const otherRevWithFx = p.otherRevenue + Math.max(fxValuationGain * 0.1, 0);

      const totalRevenue = taxConsumption + taxIncome + taxCorporateAdj + taxOther + bojPayment + otherRevWithFx;
      const avgCoupon = p.initAvgCoupon / 100;
      const interest = p.initDebt * avgCoupon;
      const policyExp = p.initPolicyExp + energySubsidy;
      const totalCost = policyExp + interest;
      const fiscalBalance = totalRevenue - totalCost;
      const debt = p.initDebt + (totalCost - totalRevenue);
      const taxTotal = taxConsumption + taxIncome + taxCorporateAdj + taxOther;
      const interestBurden = taxTotal !== 0 ? (interest / taxTotal) * 100 : 0;
      const bondIssuance = Math.max(totalCost - totalRevenue, 0);

      const modelIncome = BASE_INCOME * (1 + nomWageG);
      const modelFoodCost = BASE_INCOME * BASE_FOOD_RATIO * (1 + cpiIncrease);
      const modelEnergyCost = BASE_INCOME * BASE_ENERGY_RATIO * (1 + cpiIncrease) * (1 + Math.max(yenFactor, 0) * 0.5);
      const modelDisposable = modelIncome * (1 - TAX_SOCIAL_RATIO) - modelFoodCost - modelEnergyCost;
      const baseDisposable = BASE_INCOME * (1 - TAX_SOCIAL_RATIO) - BASE_INCOME * BASE_FOOD_RATIO - BASE_INCOME * BASE_ENERGY_RATIO;

      results.push({
        year, tax: taxTotal, bojPayment, totalRevenue, policyExp,
        avgCoupon: avgCoupon * 100, interest, totalCost, debt,
        fiscalBalance, interestBurden, bojRev, bojCost,
        policyRate: policyRate * 100,
        taxConsumption, taxIncome, taxCorporate: taxCorporateAdj, taxOther,
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
      });
    } else {
      const prev = results[i - 1];

      const exchangeRate = prev.exchangeRate * (1 + yenDep);
      const yenFactor = (exchangeRate / p.initExchangeRate - 1);
      const yenBenefit = yenFactor * 0.5;

      const importAmount = prev.importAmount * (1 + C) * (1 + B * (1 + Math.max(yenDep, 0)));
      const exportAmount = prev.exportAmount * (1 + globalG) * (1 + Math.max(yenDep, 0) * 0.5);
      const tradeBalance = exportAmount - importAmount;

      const fxValuationGain = p.fxReserves * yenDep;

      const yenCostPush = Math.max(yenDep, 0) * 0.3;
      const cpiIncrease = B + yenCostPush;
      const wageIncrease = nomWageG;
      const realWageGrowth = wageIncrease - cpiIncrease;

      const povertyRate = cpiIncrease > wageIncrease
        ? prev.povertyRate * (1 + (cpiIncrease - wageIncrease) * p.povertySensitivity)
        : prev.povertyRate * (1 - (wageIncrease - cpiIncrease) * p.povertySensitivity * 0.3);

      const assetGrowth = Math.max(yenDep, 0) * 0.5 + C;
      const giniIndex = prev.giniIndex + (assetGrowth - realWageGrowth) * 0.01;

      let taxConsumption = prev.taxConsumption * (1 + B * 1.0);
      if (changeYear !== null && year === changeYear) {
        taxConsumption = prev.taxConsumption * (1 + B * 1.0) * (p.taxRateNew / 10.0);
      }
      const taxIncome = prev.taxIncome * (1 + D * 1.4);

      const exportProfit = Math.max(yenDep, 0) * 0.3;
      const importCost = Math.max(yenDep, 0) * 0.2;
      const taxCorporate = prev.taxCorporate * (1 + C * 2.0 + B * 0.5) * (1 + exportProfit - importCost);
      const taxOther = prev.taxOther * (1 + D * 0.8);
      const tax = taxConsumption + taxIncome + taxCorporate + taxOther;

      const policyRate = Math.max(E - p.policyRateSpread / 100, 0);
      const bojRev = prev.debt * (p.bojYield / 100);
      const bojCost = p.bojCA * policyRate;
      const bojPayment = Math.max(bojRev - bojCost, 0);

      const otherRevWithFx = p.otherRevenue + Math.max(fxValuationGain * 0.1, 0);
      const totalRevenue = tax + bojPayment + otherRevWithFx;

      const energySubsidy = B * p.energySubsidyRate * 10;
      const policyExpBase = prev.policyExp - (results.length > 0 ? prev.energySubsidy : 0);
      const policyExp = policyExpBase * (1 + B) + p.naturalIncrease + energySubsidy;
      const avgCouponDec = (prev.avgCoupon / 100 * 8 / 9) + (E * 1 / 9);
      const interest = prev.debt * avgCouponDec;
      const totalCost = policyExp + interest;
      const fiscalBalance = totalRevenue - totalCost;
      const debt = prev.debt + (totalCost - totalRevenue);
      const interestBurden = tax !== 0 ? (interest / tax) * 100 : 0;
      const bondIssuance = Math.max(totalCost - totalRevenue, 0);

      const cumulativeCpi = results.reduce((acc, r) => acc * (1 + r.cpiIncrease / 100), 1) * (1 + cpiIncrease);
      const cumulativeWage = results.reduce((acc, r) => acc * (1 + r.wageIncrease / 100), 1) * (1 + wageIncrease);
      const cumulativeYenDep = exchangeRate / p.initExchangeRate - 1;
      const modelIncome = BASE_INCOME * cumulativeWage;
      const modelFoodCost = BASE_INCOME * BASE_FOOD_RATIO * cumulativeCpi;
      const modelEnergyCost = BASE_INCOME * BASE_ENERGY_RATIO * cumulativeCpi * (1 + Math.max(cumulativeYenDep, 0) * 0.5);
      const modelDisposable = modelIncome * (1 - TAX_SOCIAL_RATIO) - modelFoodCost - modelEnergyCost;
      const baseDisposable = BASE_INCOME * (1 - TAX_SOCIAL_RATIO) - BASE_INCOME * BASE_FOOD_RATIO - BASE_INCOME * BASE_ENERGY_RATIO;

      results.push({
        year, tax, bojPayment, totalRevenue, policyExp,
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
      });
    }
  }

  return results;
}
