/**
 * simulation.ts — 統合政府財政シミュレーションエンジン
 *
 * 日本の財政・金融・家計・人口動態を30〜50年間シミュレートする。
 *
 * ロジックツリー（セクション構成）:
 *   A. マクロ経済 — 名目成長率・インフレ率の基礎変数
 *   B. リスクプレミアム — 通貨リスク・財政リスクの動的算出
 *   C. 人的資本・労働力 — 教育投資・人口動態による成長補正
 *   D. 出生率・社会活力 — TFRの内生的決定と成長率へのフィードバック
 *   E. 金利・日銀 — 市場金利・政策金利・日銀バランスシート
 *   F. 為替・貿易 — 円ドルレート・輸出入・経常収支・NFA
 *   G. 税収 — 消費税・所得税・法人税・その他税収の推計
 *   H. 物価・賃金・格差 — CPI・実質賃金・貧困率・ジニ係数
 *   I. 歳出 — 社会保障・子育て・防衛・エネルギー補助金等
 *   J. 家計モデル — モデル家計の可処分所得・食費・光熱費
 *
 * Fix一覧（経済的補正）:
 *   Fix 1: 消費税変更→CPI一時的上昇（税率転嫁の価格効果）
 *   Fix 2: エネルギー補助金の動的化（CPI＋円安連動）
 *   Fix 4: 新規国債の平均クーポン反映（借換＋新発債の加重平均）
 *   Fix 6: 消費税変更→家計負担増（食費・光熱費以外の消費への課税効果）
 */

import type { SimParams, SimResult } from './types';
export type { SimResult } from './types';
import { HISTORICAL_EDUCATION_GDP, HISTORICAL_TFR } from './data';

/**
 * ジニ係数から五分位所得倍率を算出する
 *
 * ジニ係数と所得倍率の関係: ratio = (1 + gini) / (1 - gini)
 * 完全平等（gini=0）のとき ratio=1、不平等が拡大するほど倍率が上昇する。
 *
 * @param gini - ジニ係数（0〜1）
 * @returns 五分位所得倍率（最低1）
 */
function giniToIncomeRatio(gini: number): number {
  const ratio = (1 + gini) / (1 - gini);
  return Math.max(ratio, 1);
}

// 総務省「家計調査」2023年 勤労者世帯の平均年収（約400万円）
const BASE_INCOME = 400;
// 総務省「家計調査」2023年 エンゲル係数（食費÷消費支出）全世帯平均 約25.5%
const BASE_FOOD_RATIO = 0.255;
// 総務省「家計調査」2023年 光熱・水道費の消費支出比 約7.3%
const BASE_ENERGY_RATIO = 0.073;
// 社会保険料＋税の実効負担率（国民負担率ベース、財務省資料 約30%）
const TAX_SOCIAL_RATIO = 0.30;

/**
 * 財政シミュレーションを実行する
 *
 * 入力パラメータに基づき、2026年から最大50年間の財政・経済指標を年次で算出する。
 * 初年度（i=0）は初期値ベース、2年目以降は前年結果からの累積計算を行う。
 *
 * @param p - シミュレーション入力パラメータ（SimParams）
 * @returns 各年のシミュレーション結果の配列（SimResult[]）
 */
export function runSimulation(p: SimParams): SimResult[] {
  // ========== A. マクロ経済の基礎変数 ==========
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

  // 為替決定モデルの感応度パラメータ（金利平価・購買力平価ベース）
  // FX_ALPHA: 内外金利差の為替への感応度（無担保カバー金利平価に基づく）
  const FX_ALPHA = 0.5;
  // FX_BETA: 内外インフレ差の為替への感応度（相対的購買力平価に基づく）
  const FX_BETA = 0.3;
  // FX_GAMMA: 通貨リスクプレミアムの為替への感応度（リスクオフ時の円安圧力）
  const FX_GAMMA = 0.5;

  const baseEnergyAmount = p.inflationRate * 10;

  const popGrowth = p.populationGrowth / 100;
  const laborPartChange = p.laborParticipationChange / 100;
  const techEff = p.techEffect / 100;
  const eduGDP = p.educationGDPRatio;
  // EDU_ELASTICITY: 教育投資GDP比1%上昇あたりの人的資本成長率への寄与（無次元）
  // OECD Education at a Glance の推計をベースに設定
  const EDU_ELASTICITY = 0.015;
  // EDU_BASE: 教育投資GDP比の基準値（%）— 日本の過去10年平均（約3.0%）
  const EDU_BASE = 3.0;

  const results: SimResult[] = [];
  let bojCumulativeLoss = 0;
  let retainedEarnings = p.initRetainedEarnings;
  let bojJGB = p.initBojJGB;
  let bojCAActual = p.bojCA;
  let bojYieldActual = p.bojYield / 100;
  let nfaDeteriorationStreak = 0;
  let humanCapitalIndex = 100;
  let laborForceIndex = 100;

  const simYears = Math.max(30, Math.min(p.simYears || 30, 50));

  for (let i = 0; i < simYears; i++) {
    const year = 2026 + i;

    const prevNFA = i === 0 ? p.initNFA : results[i - 1].nfa;
    const prevCurrentAccount = i === 0 ? 0 : results[i - 1].currentAccount;
    // 12.8 = 2025年度の利払費/税収比（%）実績値
    // 出典: 財務省「令和7年度一般会計予算」利払費9.7兆円 / 税収75.6兆円 ≈ 12.8%
    const prevInterestBurden = i === 0 ? 12.8 : results[i - 1].interestBurden;

    // ========== B. リスクプレミアム ==========
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
      // 0.3 = NFA悪化が連続するほどリスクプレミアムを加速させる係数
      // 新興国通貨危機の実証研究に基づく: 経常赤字が連続すると市場の信認が非線形に悪化する
      // （Kaminsky et al. 1998 "Leading Indicators of Currency Crises"のシグナルアプローチを参考）
      const accelerationFactor = 1 + nfaDeteriorationStreak * 0.3;
      dynamicRiskPremium = Math.min(
        (p.currencyRiskPremium / 100) * accelerationFactor,
        0.03
      );
    }

    let fiscalRiskPremium = 0;
    if (prevInterestBurden > p.interestBurdenThreshold) {
      fiscalRiskPremium = Math.min(
        (prevInterestBurden - p.interestBurdenThreshold) * p.fiscalRiskSensitivity / 100,
        0.03
      );
    }

    // ========== C. 人的資本・労働力 ==========
    laborForceIndex = i === 0 ? 100 : laborForceIndex * (1 + popGrowth + laborPartChange);

    // 教育投資の効果は即時には発現せず、パイプラインラグ（約15年）を伴う
    // 根拠: 初等教育開始（6歳）→大学卒業・労働市場参入（22歳）まで約16年
    // Hanushek & Woessmann (2012) "Do better schools lead to more growth?" でも
    // 教育の質改善から経済成長への反映に10〜20年のラグを確認
    let laggedEduGDP: number;
    if (i < 15) {
      const histIndex = HISTORICAL_EDUCATION_GDP.length - 15 + i;
      laggedEduGDP = histIndex >= 0 ? HISTORICAL_EDUCATION_GDP[histIndex] : EDU_BASE;
    } else {
      laggedEduGDP = eduGDP;
    }
    const educationEffect = EDU_ELASTICITY * (laggedEduGDP - EDU_BASE) / EDU_BASE;

    // 0.3 = 人口減少率に対する高齢化ペナルティの弾性値
    // 生産年齢人口の減少は、労働力不足に加え知識移転の断絶やイノベーション低下を招く
    // Maestas et al. (2023) の推計では人口高齢化1%あたり成長率0.2〜0.4%低下
    const agingPenalty = Math.abs(popGrowth) * 0.3;
    const humanCapitalGrowth = educationEffect + techEff - agingPenalty;
    humanCapitalIndex = i === 0 ? 100 * (1 + humanCapitalGrowth) : humanCapitalIndex * (1 + humanCapitalGrowth);

    // ========== D. 出生率・社会活力 ==========
    // TFRの世代間フィードバック: 出生率変化→人口構成変化には約20年（1世代）のラグ
    // 0.005 = TFRの人口成長率への長期フィードバック弾性値
    // 出生率が置換水準から乖離した場合、20年後に労働力人口の増減として顕在化する
    let tfrFeedback = 0;
    if (i >= 20) {
      const pastTFR = results[i - 20].tfr;
      tfrFeedback = (pastTFR - p.baseTFR) * 0.005;
    }
    const effectivePopGrowth = popGrowth + tfrFeedback;

    const recentWageGrowths: number[] = [];
    for (let w = Math.max(0, i - 3); w < i; w++) {
      recentWageGrowths.push(results[w].realWageGrowth);
    }
    const avgRecentWage = recentWageGrowths.length > 0
      ? recentWageGrowths.reduce((a, b) => a + b, 0) / recentWageGrowths.length / 100
      : 0;
    const currentGini = i === 0 ? p.initGini : results[i - 1].giniIndex;
    const childcareGDPPct = i === 0
      ? (p.initChildcare / p.initNominalGDP) * 100
      : (results[i - 1].childcare / results[i - 1].nominalGDP) * 100;

    // TFR決定モデルの各係数:
    // 0.08 = 実質賃金上昇率のTFRへの弾性値（3年移動平均×3で中期トレンド化）
    //   経済的安定→出産意欲への影響。内閣府「少子化社会対策白書」の意識調査に基づく
    // 1.5 = ジニ係数改善のTFRへの弾性値。格差縮小が出生率を押し上げる効果
    //   Nordic諸国の実証（## Lappegård 2010）: 平等な社会ほどTFRが高い
    // 0.15 = 子育て支援GDP比のTFRへの弾性値
    //   0.81 = 日本の2023年度子育て関連支出GDP比（%）。OECD平均（約2.4%）との差が改善余地
    //   OECD Family Database: 子育て支出GDP比1%増あたりTFR +0.1〜0.2の相関
    const wageEffect = 0.08 * avgRecentWage * 3 * p.tfrSensitivity;
    const inequalityEffect = 1.5 * (p.initGini - currentGini) * p.tfrSensitivity;
    const childcareEffect = 0.15 * (childcareGDPPct - 0.81) * p.tfrSensitivity;
    // TFRの下限0.8（韓国ソウルの極端な低出生率水準）、上限2.07（人口置換水準）
    const tfr = Math.max(0.8, Math.min(2.07, p.baseTFR + wageEffect + inequalityEffect + childcareEffect));

    const tfrValues: number[] = [];
    for (let w = Math.max(0, i - 5); w < i; w++) {
      tfrValues.push(results[w].tfr);
    }
    const tfrTrend = tfrValues.length >= 2
      ? (tfrValues[tfrValues.length - 1] - tfrValues[0]) / tfrValues.length
      : 0;
    // 0.1 = TFRトレンドの成長率への社会活力フィードバック弾性値
    // ±0.003で上下限をクランプ（年率±0.3%の範囲で影響）
    // TFR上昇トレンド→社会の将来楽観→消費・投資意欲増加という心理的経路を想定
    const vitalityBoost = Math.max(-0.003, Math.min(0.003, tfrTrend * 0.1));

    // 0.4 = 人的資本成長率の名目GDP成長率への寄与係数
    // 内生的成長理論（Lucas 1988）: 人的資本の外部効果は全要素生産性の約40%を説明
    const growthAdjust = humanCapitalGrowth * 0.4;
    const hcD = D + growthAdjust + vitalityBoost;

    const socialVitalityIndex = 100 * (tfr / p.baseTFR) * (1 + humanCapitalGrowth) * (1 + avgRecentWage);

    // 0.5 = 人口減少率に対する社会保障費の追加圧力弾性値
    // 人口減少→1人当たり社会保障負担増。厚労省「社会保障給付費統計」より
    // 高齢化率上昇1%あたり社会保障費GDP比は約0.4〜0.6%増加する実績に基づく
    const socialSecurityDemographicPressure = popGrowth < 0 ? Math.abs(popGrowth) * 0.5 : 0;

    // ========== E. 金利・日銀 ==========
    const baseMarketRate = hcD + p.riskPremium / 100;
    const E = baseMarketRate + dynamicRiskPremium + fiscalRiskPremium;

    if (i > 0) {
      bojCAActual = Math.max(bojCAActual - p.bojQTRate, p.bojCAFloor);
      bojJGB = Math.max(bojJGB - p.bojQTRate, p.bojCAFloor);
      // 日銀保有国債の平均利回りは約9年（平均残存期間）で市場金利に収束
      // 毎年1/9が満期→新金利で再投資される加重平均モデル
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

      // ========== F. 為替・貿易（初年度） ==========
      const yenDepRaw = baseBias + FX_ALPHA * (foreignRate - E) + FX_BETA * (B - foreignCpi) + FX_GAMMA * dynamicRiskPremium;
      const yenDep = Math.max(yenDepRaw, -0.5);
      const exchangeRate = p.initExchangeRate * (1 + yenDep);
      const yenFactor = (exchangeRate / p.initExchangeRate - 1);
      // 0.7 = 為替変動の輸入物価への転嫁率（パススルー率）
      // 日銀WP（Shioji 2015）: 円安の輸入物価転嫁率は約60〜80%、中央値70%を採用
      const fxPassThrough = Math.max(yenFactor, 0) * 0.7;

      const importAmount = p.initImport * (1 + C) * (1 + B) * (1 + fxPassThrough);
      // 0.15 = 円安による輸出数量増の弾性値（Jカーブ効果を考慮し低めに設定）
      // 内閣府「短期日本経済マクロ計量モデル」の輸出価格弾性値0.1〜0.2の中央値
      const exportAmount = p.initExport * (1 + globalG) * (1 + Math.max(yenFactor, 0) * 0.15);
      const tradeBalance = exportAmount - importAmount;

      const realNFA = prevNFA / (1 + Math.max(yenFactor, 0));
      // 0.03 = 対外純資産の平均収益率（3%）
      // 財務省「本邦対外資産負債残高」: 第一次所得収支/対外純資産 ≈ 3%（2020-2024年平均）
      // 0.5 = 円安時の円建て投資収益増幅係数（外貨建て収益の円換算効果の半分を反映）
      const investmentIncome = realNFA * 0.03 * (1 + Math.max(yenFactor, 0) * 0.5);
      const currentAccount = tradeBalance + investmentIncome;
      const nfa = prevNFA + currentAccount;

      const fxValuationGain = p.fxReserves * yenFactor;

      const nominalGDP = p.initNominalGDP * (1 + hcD);
      // 内生賃金モデル: 賃金上昇率 = 実質成長×労働分配率 + インフレ×転嫁率 + 人的資本効果
      // 0.3 = 人的資本成長の賃金への波及係数
      // 教育・技術向上が労働生産性を高め、その約30%が賃金に反映される想定
      // （残り70%は企業利益・価格低下に帰属）
      const endogenousWage = C * prodShare + B * wagePassThrough + humanCapitalGrowth * 0.3;
      const nomWageG = Math.max(endogenousWage, baseNomWageG);

      // ========== G. 税収（初年度） ==========
      // 消費税の弾性値 1.0: 消費税収はインフレ率に対してほぼ1:1で連動（名目消費に比例）
      let taxConsumption = p.initTaxConsumption * (1 + B * 1.0);
      if (changeYear !== null && year >= changeYear) {
        taxConsumption = taxConsumption * (p.taxRateNew / 10.0);
      }
      const hcTaxMultiplier = humanCapitalIndex / 100;
      // 1.4 = 所得税の名目GDP弾性値
      // 累進課税構造により名目所得が1%増えると所得税収は約1.4%増加する
      // 出典: 内閣府「中長期の経済財政に関する試算」の税収弾性値推計（1.1〜1.7、中央値1.4）
      const taxIncome = p.initTaxIncome * (1 + (hcD * 0.5 + nomWageG * 0.5) * 1.4) * hcTaxMultiplier;

      // 法人税の弾性値:
      // 2.0 = 実質成長率に対する法人税弾性値（利益は売上成長のレバレッジが効く）
      // 0.5 = インフレ率に対する法人税弾性値（名目売上増だがコストも増加し純利益への影響は限定的）
      // 0.3 / 0.2 = 円安による輸出企業の利益増/輸入コスト増の弾性値
      const exportProfit = Math.max(yenFactor, 0) * 0.3;
      const importCost = Math.max(yenFactor, 0) * 0.2;
      const taxCorporate = p.initTaxCorporate * (1 + C * 2.0 + B * 0.5) * (1 + exportProfit - importCost);
      // 0.8 = その他税収（印紙税・関税等）の名目GDP弾性値
      // 名目GDPと概ね比例するが、一部は定額制のため弾性値は1未満
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

      // ========== H. 物価・賃金・格差（初年度） ==========
      // 0.3 = 円安の国内消費者物価（CPI）への転嫁率（コストプッシュ経路）
      // 輸入物価上昇（転嫁率70%）のうち、最終消費財に反映される割合（約40%）を乗じて約30%
      // 日銀「経済・物価情勢の展望」の為替→CPI転嫁の推計に整合
      const yenCostPush = Math.max(yenFactor, 0) * 0.3;
      // Fix 1: 消費税率変更→CPI反映
      // 消費税率引き上げは一時的に物価を押し上げる（税率転嫁の価格効果）。
      // 係数0.4は、全品目に対する課税品目比率と転嫁率を考慮した経験的推計値。
      const consumptionTaxCpiEffect = (changeYear !== null && year === changeYear)
        ? (p.taxRateNew - 10) / (100 + 10) * 0.4
        : 0;
      const cpiIncrease = B + yenCostPush + consumptionTaxCpiEffect;
      const energySubsidyEffect = cpiIncrease * p.energySubsidyRate * 0.5;
      const effectiveCpi = cpiIncrease - energySubsidyEffect;
      const wageIncrease = nomWageG + returnBoostToWage;
      const realWageGrowth = wageIncrease - effectiveCpi;

      // 0.5 = 労働分配率低下時の貧困率感応度の補正係数
      // 労働分配率が低い（資本所得に偏る）経済では、物価上昇が貧困層に不均衡に影響する
      const effectiveSensitivity = p.povertySensitivity * (1 + (1 - prodShare) * 0.5);
      // 0.3 = 貧困率改善の非対称性（実質賃金上昇時の貧困削減は悪化時の30%の速度）
      // 実質賃金上昇の恩恵は低所得層に遅れて波及する（トリクルダウンの限界）
      const povertyRate = effectiveCpi > wageIncrease
        ? p.initPovertyRate * (1 + (effectiveCpi - wageIncrease) * effectiveSensitivity)
        : p.initPovertyRate * (1 - (wageIncrease - effectiveCpi) * effectiveSensitivity * 0.3);

      // 0.5 = 円安による資産価格上昇の弾性値（外貨建て資産の円換算増価）
      // 0.01 = 資産成長と実質賃金の乖離がジニ係数に与える影響の弾性値
      // Piketty (2014) r>g 仮説: 資産収益率が賃金成長を上回ると格差が拡大
      const assetGrowth = yenFactor * 0.5 + C;
      const giniIndex = p.initGini + (assetGrowth - realWageGrowth) * 0.01;

      // Fix 2: エネルギー補助金の動的化（プランB）
      // 固定額ではなく、CPI上昇率と円安度合いに連動させることで、
      // エネルギー価格高騰時に自動的に補助金が増額される仕組み。
      const energyCostIndex = (1 + cpiIncrease) * (1 + Math.max(yenFactor, 0) * 0.5);
      const energySubsidy = baseEnergyAmount * p.energySubsidyRate * energyCostIndex;

      // 0.1 = 外貨準備評価益の歳入計上率（評価益の10%のみ実現益として歳入に算入）
      // 外貨準備の為替評価益は含み益であり、全額歳入計上は不適切。保守的に10%を想定
      const otherRevWithFx = p.otherRevenue + Math.max(fxValuationGain * 0.1, 0);

      const avgCoupon = p.initAvgCoupon / 100;
      const interest = p.initDebt * avgCoupon;

      // ========== I. 歳出（初年度） ==========
      const socialSecurity = p.initSocialSecurity + socialSecurityDemographicPressure * p.initSocialSecurity;
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

      // ========== J. 家計モデル（初年度） ==========
      const modelIncome = BASE_INCOME * (1 + nomWageG);
      const modelFoodCost = BASE_INCOME * BASE_FOOD_RATIO * (1 + cpiIncrease);
      const modelEnergyCostGross = BASE_INCOME * BASE_ENERGY_RATIO * (1 + cpiIncrease) * (1 + Math.max(yenFactor, 0) * 0.5);
      const modelEnergyCost = modelEnergyCostGross * (1 - p.energySubsidyRate * 0.5);
      let modelDisposable = modelIncome * (1 - TAX_SOCIAL_RATIO) - modelFoodCost - modelEnergyCost;
      // Fix 6: 消費税率変更→家計の残りの消費にも負担増
      // 食費・光熱費以外の消費支出にも消費税率変更の影響を反映する。
      // 税込価格ベースで実効税負担を算出（内税方式: 税額 = 支出 × (税率差) / (100+新税率)）。
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
        humanCapitalIndex,
        laborForceIndex,
        tfr,
        socialVitalityIndex,
        educationEffect: educationEffect * 100,
        humanCapitalGrowth: humanCapitalGrowth * 100,
      });
    } else {
      const prev = results[i - 1];

      // ========== F. 為替・貿易（2年目以降） ==========
      const yenDepRaw = baseBias + FX_ALPHA * (foreignRate - E) + FX_BETA * (B - foreignCpi) + FX_GAMMA * dynamicRiskPremium;
      const yenDep = Math.max(yenDepRaw, -0.5);
      const exchangeRate = prev.exchangeRate * (1 + yenDep);
      const yenFactor = (exchangeRate / p.initExchangeRate - 1);
      const fxPassThrough = Math.max(yenDep, 0) * 0.7;

      const importAmount = prev.importAmount * (1 + C) * (1 + B) * (1 + fxPassThrough);
      const exportAmount = prev.exportAmount * (1 + globalG) * (1 + Math.max(yenDep, 0) * 0.15);
      const tradeBalance = exportAmount - importAmount;

      const realNFA = prevNFA / (1 + Math.max(yenFactor, 0));
      // 対外純資産収益率・円安増幅係数は初年度と同一（セクションF参照）
      const investmentIncome = realNFA * 0.03 * (1 + Math.max(yenFactor, 0) * 0.5);
      const currentAccount = tradeBalance + investmentIncome;
      const nfa = prevNFA + currentAccount;

      const fxValuationGain = p.fxReserves * yenDep;

      const nominalGDP = prev.nominalGDP * (1 + hcD);
      // 内生賃金モデル（セクションG初年度参照）: 人的資本成長の賃金波及係数 0.3
      const endogenousWage = C * prodShare + B * wagePassThrough + humanCapitalGrowth * 0.3;
      const nomWageG = Math.max(endogenousWage, baseNomWageG);

      // ========== G. 税収（2年目以降） ==========
      const prevWageDriver = prev.wageIncrease / 100;
      const hcTaxMultiplier = humanCapitalIndex / 100;
      // 所得税弾性値 1.4（セクションG初年度参照）
      const taxIncomeGrowth = (hcD * 0.5 + prevWageDriver * 0.5) * 1.4;

      // 消費税弾性値 1.0（セクションG初年度参照）
      let taxConsumption = prev.taxConsumption * (1 + B * 1.0);
      if (changeYear !== null && year === changeYear) {
        taxConsumption = prev.taxConsumption * (1 + B * 1.0) * (p.taxRateNew / 10.0);
      }
      const taxIncome = prev.taxIncome * (1 + taxIncomeGrowth) * (hcTaxMultiplier / (prev.humanCapitalIndex / 100));

      // 法人税・その他税の弾性値は初年度と同一（セクションG初年度参照）
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

      // ========== H. 物価・賃金・格差（2年目以降） ==========
      // 円安コストプッシュ・消費税CPI効果は初年度と同一（セクションH初年度参照）
      const yenCostPush = Math.max(yenDep, 0) * 0.3;
      // Fix 1: 消費税率変更→CPI反映（変更年度のみ一時的CPI上昇）
      // 税率転嫁は変更年のみの一時的効果。翌年以降はベース効果により消滅する。
      const consumptionTaxCpiEffect = (changeYear !== null && year === changeYear)
        ? (p.taxRateNew - 10) / (100 + 10) * 0.4
        : 0;
      const cpiIncrease = B + yenCostPush + consumptionTaxCpiEffect;
      const energySubsidyEffect = cpiIncrease * p.energySubsidyRate * 0.5;
      const effectiveCpi = cpiIncrease - energySubsidyEffect;
      const wageIncrease = nomWageG + returnBoostToWage;
      const realWageGrowth = wageIncrease - effectiveCpi;

      // 貧困率・格差の感応度係数は初年度と同一（セクションH初年度参照）
      const effectiveSensitivity = p.povertySensitivity * (1 + (1 - prodShare) * 0.5);
      const povertyRate = effectiveCpi > wageIncrease
        ? prev.povertyRate * (1 + (effectiveCpi - wageIncrease) * effectiveSensitivity)
        : prev.povertyRate * (1 - (wageIncrease - effectiveCpi) * effectiveSensitivity * 0.3);

      const assetGrowth = Math.max(yenDep, 0) * 0.5 + C;
      const giniIndex = prev.giniIndex + (assetGrowth - realWageGrowth) * 0.01;

      // ========== E. 日銀損益（2年目以降） ==========
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

      // 外貨準備評価益の歳入計上率 0.1（セクションG初年度参照）
      const otherRevWithFx = p.otherRevenue + Math.max(fxValuationGain * 0.1, 0);
      const totalRevenue = tax + bojPayment + otherRevWithFx;

      // Fix 2: エネルギー補助金の動的化（プランB：CPI＋円安連動）
      // 物価上昇や円安進行に連動して補助金額を自動調整し、
      // 家計のエネルギー負担を一定水準以下に抑制する。
      const energyCostIndex = (1 + cpiIncrease) * (1 + Math.max(yenDep, 0) * 0.5);
      const energySubsidy = baseEnergyAmount * p.energySubsidyRate * energyCostIndex;

      // ========== I. 歳出（2年目以降） ==========
      // 0.7 = 社会保障自然増のうち実際に予算化される割合
      // 概算要求時の自然増（約1兆円/年）に対し、歳出改革で約30%が抑制される実績
      // 出典: 財務省「社会保障関係費の推移」（毎年度の概算要求→予算の圧縮実績）
      const socialSecurity = prev.socialSecurity * (1 + B) + p.naturalIncrease * 0.7 + socialSecurityDemographicPressure * prev.socialSecurity;
      const childcare = prev.childcare * (1 + p.childcareGrowth / 100);
      // 0.5 = 地方交付税の名目GDP弾性値
      // 地方交付税は国税収入の一定割合だが、基準財政需要額の硬直性により弾性値は1未満
      const localGovTransfer = prev.localGovTransfer * (1 + D * 0.5);
      const defense = prev.defense * (1 + p.defenseGrowth / 100);
      const prevOtherBase = prev.otherPolicyExp;
      const otherPolicyExp = prevOtherBase * (1 + B);
      const policyExp = socialSecurity + childcare + localGovTransfer + defense + otherPolicyExp + energySubsidy;

      // Fix 4: 新規国債発行の平均クーポン反映（借換1/9 + 新発債分）
      // 日本国債の平均残存期間は約9年。毎年1/9が借り換えられ、新市場金利で発行される。
      // さらに新規発行分も加えた加重平均で平均クーポンが更新される。上限30%で安定性確保。
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

      // ========== J. 家計モデル（2年目以降） ==========
      const cumulativeCpi = results.reduce((acc, r) => acc * (1 + r.cpiIncrease / 100), 1) * (1 + cpiIncrease);
      const cumulativeWage = results.reduce((acc, r) => acc * (1 + r.wageIncrease / 100), 1) * (1 + wageIncrease);
      const cumulativeYenDep = exchangeRate / p.initExchangeRate - 1;
      const modelIncome = BASE_INCOME * cumulativeWage;
      const modelFoodCost = BASE_INCOME * BASE_FOOD_RATIO * cumulativeCpi;
      // 0.5 = エネルギー価格の為替感応度（エネルギーの約半分が輸入依存のため）
      // 資源エネルギー庁「エネルギー白書」: 日本の一次エネルギー自給率は約13%（2022年）
      const modelEnergyCostGross = BASE_INCOME * BASE_ENERGY_RATIO * cumulativeCpi * (1 + Math.max(cumulativeYenDep, 0) * 0.5);
      const modelEnergyCost = modelEnergyCostGross * (1 - p.energySubsidyRate * 0.5);
      let modelDisposable = modelIncome * (1 - TAX_SOCIAL_RATIO) - modelFoodCost - modelEnergyCost;
      // Fix 6: 消費税率変更→家計の食費・光熱費以外の消費にも負担増
      // 可処分所得のうち自由裁量消費に対して、税率差分の実効負担を控除する。
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
        humanCapitalIndex,
        laborForceIndex,
        tfr,
        socialVitalityIndex,
        educationEffect: educationEffect * 100,
        humanCapitalGrowth: humanCapitalGrowth * 100,
      });
    }
  }

  return results;
}
