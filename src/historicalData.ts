/**
 * historicalData.ts — 実績データ配列
 *
 * 2015〜2024年の日本の財政・マクロ経済実績データ。
 * シミュレーションチャートで実績線として表示され、
 * シミュレーション結果との比較に使用される。
 *
 * データ出典:
 * - 財務省: 税収、歳出、国債費、利払い費、貿易統計
 * - 総務省統計局: マクロ経済統計
 * - 厚生労働省: 貧困率・所得分布・実質賃金
 * - 日本銀行: 決算データ（国庫納付金、JGB保有高、当座預金）
 * - FRED: 米国10年国債利回り
 * - BLS: 米国消費者物価指数
 * - OECD Education at a Glance: 教育投資GDP比
 * - 国立社会保障・人口問題研究所: 出生率
 */

import type { ActualDataPoint, ActualMacroPoint } from './types';

/** 財政実績データ（2015〜2024年） */
export const ACTUAL_DATA: ActualDataPoint[] = [
  { year: 2015, tax: 56.3, interest: 10.0, debt: 807, policyExp: 57.4, totalRevenue: 72.0, totalCost: 67.4, fiscalBalance: 4.6, interestBurden: 17.8, avgCoupon: 1.2, bojPayment: 0.4, taxConsumption: 17.1, taxIncome: 17.8, taxCorporate: 10.8, taxOther: 10.6, exchangeRate: 121, exportAmount: 75.6, importAmount: 78.4, tradeBalance: -2.8, povertyRate: 15.7, giniIndex: 0.330, realWageGrowth: 0.1, currentAccount: 16.4, nfa: 339, nominalGDP: 538, bojNetIncome: 0.8, bojJGB: 282, bojCA: 253, bojYield: 0.45, socialSecurity: 31.5, childcare: 2.0, localGovTransfer: 15.5, defense: 5.0, otherPolicyExp: 3.4, otherRevenue: 15.3, bondIssuance: 34.9 },
  { year: 2016, tax: 55.5, interest: 9.5, debt: 838, policyExp: 57.8, totalRevenue: 71.0, totalCost: 67.3, fiscalBalance: 3.7, interestBurden: 17.1, avgCoupon: 1.1, bojPayment: 0.4, taxConsumption: 17.2, taxIncome: 17.6, taxCorporate: 10.3, taxOther: 10.4, exchangeRate: 109, exportAmount: 70.0, importAmount: 66.0, tradeBalance: 4.0, povertyRate: 15.6, giniIndex: 0.331, realWageGrowth: 0.7, currentAccount: 20.2, nfa: 349, nominalGDP: 544, bojNetIncome: 0.7, bojJGB: 350, bojCA: 301, bojYield: 0.38, socialSecurity: 32.0, childcare: 2.2, localGovTransfer: 15.3, defense: 5.1, otherPolicyExp: 3.2, otherRevenue: 15.1, bondIssuance: 34.4 },
  { year: 2017, tax: 58.8, interest: 9.0, debt: 865, policyExp: 58.4, totalRevenue: 74.4, totalCost: 67.4, fiscalBalance: 7.0, interestBurden: 15.3, avgCoupon: 1.0, bojPayment: 0.7, taxConsumption: 17.5, taxIncome: 18.9, taxCorporate: 12.0, taxOther: 10.4, exchangeRate: 112, exportAmount: 78.3, importAmount: 75.4, tradeBalance: 2.9, povertyRate: 15.4, giniIndex: 0.332, realWageGrowth: -0.2, currentAccount: 21.8, nfa: 328, nominalGDP: 553, bojNetIncome: 1.0, bojJGB: 417, bojCA: 363, bojYield: 0.32, socialSecurity: 32.5, childcare: 2.4, localGovTransfer: 15.6, defense: 5.1, otherPolicyExp: 2.8, otherRevenue: 14.9, bondIssuance: 33.6 },
  { year: 2018, tax: 60.4, interest: 8.8, debt: 883, policyExp: 58.8, totalRevenue: 76.0, totalCost: 67.6, fiscalBalance: 8.4, interestBurden: 14.6, avgCoupon: 0.9, bojPayment: 0.6, taxConsumption: 17.7, taxIncome: 19.9, taxCorporate: 12.3, taxOther: 10.5, exchangeRate: 110, exportAmount: 81.5, importAmount: 82.7, tradeBalance: -1.2, povertyRate: 15.4, giniIndex: 0.332, realWageGrowth: 0.2, currentAccount: 19.1, nfa: 342, nominalGDP: 556, bojNetIncome: 0.9, bojJGB: 449, bojCA: 394, bojYield: 0.28, socialSecurity: 33.0, childcare: 2.5, localGovTransfer: 15.8, defense: 5.2, otherPolicyExp: 2.3, otherRevenue: 15.0, bondIssuance: 32.7 },
  { year: 2019, tax: 58.4, interest: 8.5, debt: 897, policyExp: 62.0, totalRevenue: 73.9, totalCost: 70.5, fiscalBalance: 3.4, interestBurden: 14.6, avgCoupon: 0.9, bojPayment: 1.2, taxConsumption: 18.4, taxIncome: 19.2, taxCorporate: 10.8, taxOther: 10.0, exchangeRate: 109, exportAmount: 76.9, importAmount: 78.6, tradeBalance: -1.6, povertyRate: 15.4, giniIndex: 0.333, realWageGrowth: -0.9, currentAccount: 18.5, nfa: 365, nominalGDP: 559, bojNetIncome: 1.5, bojJGB: 474, bojCA: 410, bojYield: 0.25, socialSecurity: 34.1, childcare: 2.6, localGovTransfer: 16.0, defense: 5.3, otherPolicyExp: 4.0, otherRevenue: 14.3, bondIssuance: 32.6 },
  { year: 2020, tax: 60.8, interest: 8.2, debt: 964, policyExp: 77.5, totalRevenue: 76.3, totalCost: 85.7, fiscalBalance: -9.4, interestBurden: 13.5, avgCoupon: 0.8, bojPayment: 1.2, taxConsumption: 21.0, taxIncome: 19.2, taxCorporate: 11.2, taxOther: 9.4, exchangeRate: 107, exportAmount: 68.4, importAmount: 68.0, tradeBalance: 0.4, povertyRate: 15.7, giniIndex: 0.334, realWageGrowth: -0.8, currentAccount: 15.8, nfa: 357, nominalGDP: 539, bojNetIncome: 1.4, bojJGB: 489, bojCA: 464, bojYield: 0.22, socialSecurity: 35.8, childcare: 3.0, localGovTransfer: 16.6, defense: 5.3, otherPolicyExp: 16.8, otherRevenue: 14.3, bondIssuance: 108.6 },
  { year: 2021, tax: 67.0, interest: 8.0, debt: 990, policyExp: 67.0, totalRevenue: 82.6, totalCost: 75.0, fiscalBalance: 7.6, interestBurden: 11.9, avgCoupon: 0.8, bojPayment: 1.3, taxConsumption: 21.9, taxIncome: 21.4, taxCorporate: 13.6, taxOther: 10.1, exchangeRate: 110, exportAmount: 83.1, importAmount: 84.8, tradeBalance: -1.7, povertyRate: 15.4, giniIndex: 0.333, realWageGrowth: 0.6, currentAccount: 19.4, nfa: 418, nominalGDP: 550, bojNetIncome: 1.5, bojJGB: 521, bojCA: 493, bojYield: 0.20, socialSecurity: 35.8, childcare: 3.2, localGovTransfer: 15.9, defense: 5.3, otherPolicyExp: 6.8, otherRevenue: 14.3, bondIssuance: 43.6 },
  { year: 2022, tax: 71.1, interest: 8.0, debt: 1005, policyExp: 67.4, totalRevenue: 86.6, totalCost: 75.4, fiscalBalance: 11.2, interestBurden: 11.3, avgCoupon: 0.8, bojPayment: 2.0, taxConsumption: 23.1, taxIncome: 22.5, taxCorporate: 14.9, taxOther: 10.6, exchangeRate: 131, exportAmount: 98.2, importAmount: 118.2, tradeBalance: -20.0, povertyRate: 15.5, giniIndex: 0.335, realWageGrowth: -1.0, currentAccount: 11.5, nfa: 419, nominalGDP: 573, bojNetIncome: 2.3, bojJGB: 564, bojCA: 536, bojYield: 0.18, socialSecurity: 36.3, childcare: 3.5, localGovTransfer: 16.1, defense: 5.4, otherPolicyExp: 6.1, otherRevenue: 13.5, bondIssuance: 35.9 },
  { year: 2023, tax: 72.1, interest: 8.1, debt: 1068, policyExp: 72.7, totalRevenue: 87.6, totalCost: 80.8, fiscalBalance: 6.8, interestBurden: 11.2, avgCoupon: 0.8, bojPayment: 2.2, taxConsumption: 23.2, taxIncome: 22.0, taxCorporate: 14.6, taxOther: 12.3, exchangeRate: 141, exportAmount: 100.9, importAmount: 110.2, tradeBalance: -9.3, povertyRate: 15.4, giniIndex: 0.334, realWageGrowth: -2.5, currentAccount: 22.6, nfa: 471, nominalGDP: 600, bojNetIncome: 2.5, bojJGB: 579, bojCA: 548, bojYield: 0.19, socialSecurity: 36.9, childcare: 4.2, localGovTransfer: 16.4, defense: 5.9, otherPolicyExp: 9.3, otherRevenue: 13.3, bondIssuance: 35.5 },
  { year: 2024, tax: 75.2, interest: 9.6, debt: 1103, policyExp: 73.5, totalRevenue: 90.6, totalCost: 83.1, fiscalBalance: 7.5, interestBurden: 12.8, avgCoupon: 0.9, bojPayment: 2.2, taxConsumption: 23.8, taxIncome: 22.4, taxCorporate: 17.0, taxOther: 12.0, exchangeRate: 150, exportAmount: 104.1, importAmount: 112.6, tradeBalance: -8.5, povertyRate: 15.4, giniIndex: 0.334, realWageGrowth: -0.2, currentAccount: 29.3, nfa: 533, nominalGDP: 615, bojNetIncome: 1.2, bojJGB: 590, bojCA: 550, bojYield: 0.20, socialSecurity: 37.0, childcare: 5.0, localGovTransfer: 17.0, defense: 7.0, otherPolicyExp: 7.5, otherRevenue: 13.2, bondIssuance: 35.4 },
];

/** マクロ経済実績データ（2015〜2024年） */
export const ACTUAL_MACRO: ActualMacroPoint[] = [
  { year: 2015, jgb10y: 0.36, ust10y: 2.14, usCpi: 0.1, educationGDPRatio: 3.2, nominalGrowth: 3.5, inflation: 0.8, realGrowth: 2.7 },
  { year: 2016, jgb10y: -0.07, ust10y: 1.84, usCpi: 1.3, educationGDPRatio: 3.2, nominalGrowth: 1.1, inflation: -0.1, realGrowth: 1.2 },
  { year: 2017, jgb10y: 0.06, ust10y: 2.33, usCpi: 2.1, educationGDPRatio: 3.1, nominalGrowth: 2.0, inflation: 0.5, realGrowth: 1.5 },
  { year: 2018, jgb10y: 0.07, ust10y: 2.91, usCpi: 2.4, educationGDPRatio: 3.1, nominalGrowth: 0.3, inflation: 1.0, realGrowth: -0.7 },
  { year: 2019, jgb10y: -0.09, ust10y: 2.14, usCpi: 1.8, educationGDPRatio: 3.1, nominalGrowth: 0.8, inflation: 0.5, realGrowth: 0.3 },
  { year: 2020, jgb10y: 0.02, ust10y: 0.89, usCpi: 1.2, educationGDPRatio: 3.4, nominalGrowth: -3.9, inflation: 0.0, realGrowth: -3.9 },
  { year: 2021, jgb10y: 0.07, ust10y: 1.45, usCpi: 4.7, educationGDPRatio: 3.4, nominalGrowth: 2.4, inflation: -0.2, realGrowth: 2.6 },
  { year: 2022, jgb10y: 0.25, ust10y: 2.95, usCpi: 8.0, educationGDPRatio: 3.3, nominalGrowth: 1.6, inflation: 2.5, realGrowth: -0.9 },
  { year: 2023, jgb10y: 0.55, ust10y: 3.96, usCpi: 4.1, educationGDPRatio: 3.4, nominalGrowth: 5.7, inflation: 3.2, realGrowth: 2.5 },
  { year: 2024, jgb10y: 1.05, ust10y: 4.28, usCpi: 2.9, educationGDPRatio: 3.5, nominalGrowth: 3.2, inflation: 2.7, realGrowth: 0.5 },
];

/**
 * 教育投資GDP比の履歴（15年分）
 *
 * 人的資本モデルの15年ラグ計算で使用。
 * シミュレーション初期15年間は、この配列の値が教育投資として参照される。
 * 出典: OECD Education at a Glance
 */
export const HISTORICAL_EDUCATION_GDP: number[] = [3.0, 3.0, 3.0, 3.0, 3.0, 3.2, 3.2, 3.1, 3.1, 3.1, 3.4, 3.4, 3.3, 3.4, 3.5];

/**
 * 合計特殊出生率（TFR）の履歴（15年分）
 *
 * 内生的出生率モデルの20年ラグ計算で使用。
 * 出典: 国立社会保障・人口問題研究所
 */
export const HISTORICAL_TFR: number[] = [1.42, 1.42, 1.44, 1.45, 1.44, 1.43, 1.42, 1.36, 1.34, 1.30, 1.33, 1.30, 1.26, 1.20, 1.20];
