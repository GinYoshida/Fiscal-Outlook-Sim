export interface ActualDataPoint {
  year: number;
  tax: number;
  interest: number;
  debt: number;
  policyExp: number;
  totalRevenue: number;
  totalCost: number;
  fiscalBalance: number;
  interestBurden: number;
  avgCoupon: number;
  bojPayment: number;
  taxConsumption: number;
  taxIncome: number;
  taxCorporate: number;
  taxOther: number;
  exchangeRate: number;
  exportAmount: number;
  importAmount: number;
  tradeBalance: number;
  povertyRate: number;
  giniIndex: number;
}

export interface ActualMacroPoint {
  year: number;
  jgb10y: number;
  nominalGrowth: number;
  inflation: number;
  realGrowth: number;
}

export interface SimParams {
  inflationRate: number;
  realGrowth: number;
  riskPremium: number;
  initDebt: number;
  initTaxConsumption: number;
  initTaxIncome: number;
  initTaxCorporate: number;
  initTaxOther: number;
  initPolicyExp: number;
  initAvgCoupon: number;
  bojCA: number;
  bojYield: number;
  bojCapitalBuffer: number;
  otherRevenue: number;
  naturalIncrease: number;
  policyRateSpread: number;
  taxRateChangeYear: string;
  taxRateNew: number;
  yenDepreciation: number;
  nominalWageGrowth: number;
  globalGrowth: number;
  initExport: number;
  initImport: number;
  fxReserves: number;
  initPovertyRate: number;
  initGini: number;
  initExchangeRate: number;
  povertySensitivity: number;
  energySubsidyRate: number;
  initNFA: number;
  nfaThreshold: number;
  currencyRiskPremium: number;
}

export interface Scenario {
  name: string;
  label: string;
  params: SimParams;
}

export interface DataSource {
  name: string;
  url: string;
  desc: string;
}

export const ACTUAL_DATA: ActualDataPoint[] = [
  { year: 2015, tax: 56.3, interest: 10.0, debt: 807, policyExp: 57.4, totalRevenue: 72.0, totalCost: 67.4, fiscalBalance: 4.6, interestBurden: 17.8, avgCoupon: 1.2, bojPayment: 0.4, taxConsumption: 17.1, taxIncome: 17.8, taxCorporate: 10.8, taxOther: 10.6, exchangeRate: 121, exportAmount: 75.6, importAmount: 78.4, tradeBalance: -2.8, povertyRate: 15.7, giniIndex: 0.330 },
  { year: 2016, tax: 55.5, interest: 9.5, debt: 838, policyExp: 57.8, totalRevenue: 71.0, totalCost: 67.3, fiscalBalance: 3.7, interestBurden: 17.1, avgCoupon: 1.1, bojPayment: 0.4, taxConsumption: 17.2, taxIncome: 17.6, taxCorporate: 10.3, taxOther: 10.4, exchangeRate: 109, exportAmount: 70.0, importAmount: 66.0, tradeBalance: 4.0, povertyRate: 15.6, giniIndex: 0.331 },
  { year: 2017, tax: 58.8, interest: 9.0, debt: 865, policyExp: 58.4, totalRevenue: 74.4, totalCost: 67.4, fiscalBalance: 7.0, interestBurden: 15.3, avgCoupon: 1.0, bojPayment: 0.7, taxConsumption: 17.5, taxIncome: 18.9, taxCorporate: 12.0, taxOther: 10.4, exchangeRate: 112, exportAmount: 78.3, importAmount: 75.4, tradeBalance: 2.9, povertyRate: 15.4, giniIndex: 0.332 },
  { year: 2018, tax: 60.4, interest: 8.8, debt: 883, policyExp: 58.8, totalRevenue: 76.0, totalCost: 67.6, fiscalBalance: 8.4, interestBurden: 14.6, avgCoupon: 0.9, bojPayment: 0.6, taxConsumption: 17.7, taxIncome: 19.9, taxCorporate: 12.3, taxOther: 10.5, exchangeRate: 110, exportAmount: 81.5, importAmount: 82.7, tradeBalance: -1.2, povertyRate: 15.4, giniIndex: 0.332 },
  { year: 2019, tax: 58.4, interest: 8.5, debt: 897, policyExp: 62.0, totalRevenue: 73.9, totalCost: 70.5, fiscalBalance: 3.4, interestBurden: 14.6, avgCoupon: 0.9, bojPayment: 1.2, taxConsumption: 18.4, taxIncome: 19.2, taxCorporate: 10.8, taxOther: 10.0, exchangeRate: 109, exportAmount: 76.9, importAmount: 78.6, tradeBalance: -1.6, povertyRate: 15.4, giniIndex: 0.333 },
  { year: 2020, tax: 60.8, interest: 8.2, debt: 964, policyExp: 77.5, totalRevenue: 76.3, totalCost: 85.7, fiscalBalance: -9.4, interestBurden: 13.5, avgCoupon: 0.8, bojPayment: 1.2, taxConsumption: 21.0, taxIncome: 19.2, taxCorporate: 11.2, taxOther: 9.4, exchangeRate: 107, exportAmount: 68.4, importAmount: 68.0, tradeBalance: 0.4, povertyRate: 15.7, giniIndex: 0.334 },
  { year: 2021, tax: 67.0, interest: 8.0, debt: 990, policyExp: 67.0, totalRevenue: 82.6, totalCost: 75.0, fiscalBalance: 7.6, interestBurden: 11.9, avgCoupon: 0.8, bojPayment: 1.3, taxConsumption: 21.9, taxIncome: 21.4, taxCorporate: 13.6, taxOther: 10.1, exchangeRate: 110, exportAmount: 83.1, importAmount: 84.8, tradeBalance: -1.7, povertyRate: 15.4, giniIndex: 0.333 },
  { year: 2022, tax: 71.1, interest: 8.0, debt: 1005, policyExp: 67.4, totalRevenue: 86.6, totalCost: 75.4, fiscalBalance: 11.2, interestBurden: 11.3, avgCoupon: 0.8, bojPayment: 2.0, taxConsumption: 23.1, taxIncome: 22.5, taxCorporate: 14.9, taxOther: 10.6, exchangeRate: 131, exportAmount: 98.2, importAmount: 118.2, tradeBalance: -20.0, povertyRate: 15.5, giniIndex: 0.335 },
  { year: 2023, tax: 72.1, interest: 8.1, debt: 1068, policyExp: 72.7, totalRevenue: 87.6, totalCost: 80.8, fiscalBalance: 6.8, interestBurden: 11.2, avgCoupon: 0.8, bojPayment: 2.2, taxConsumption: 23.2, taxIncome: 22.0, taxCorporate: 14.6, taxOther: 12.3, exchangeRate: 141, exportAmount: 100.9, importAmount: 110.2, tradeBalance: -9.3, povertyRate: 15.4, giniIndex: 0.334 },
  { year: 2024, tax: 75.2, interest: 9.6, debt: 1103, policyExp: 73.5, totalRevenue: 90.6, totalCost: 83.1, fiscalBalance: 7.5, interestBurden: 12.8, avgCoupon: 0.9, bojPayment: 2.2, taxConsumption: 23.8, taxIncome: 22.4, taxCorporate: 17.0, taxOther: 12.0, exchangeRate: 150, exportAmount: 104.1, importAmount: 112.6, tradeBalance: -8.5, povertyRate: 15.4, giniIndex: 0.334 },
];

export const ACTUAL_MACRO: ActualMacroPoint[] = [
  { year: 2015, jgb10y: 0.36, nominalGrowth: 3.5, inflation: 0.8, realGrowth: 2.7 },
  { year: 2016, jgb10y: -0.07, nominalGrowth: 1.1, inflation: -0.1, realGrowth: 1.2 },
  { year: 2017, jgb10y: 0.06, nominalGrowth: 2.0, inflation: 0.5, realGrowth: 1.5 },
  { year: 2018, jgb10y: 0.07, nominalGrowth: 0.3, inflation: 1.0, realGrowth: -0.7 },
  { year: 2019, jgb10y: -0.09, nominalGrowth: 0.8, inflation: 0.5, realGrowth: 0.3 },
  { year: 2020, jgb10y: 0.02, nominalGrowth: -3.9, inflation: 0.0, realGrowth: -3.9 },
  { year: 2021, jgb10y: 0.07, nominalGrowth: 2.4, inflation: -0.2, realGrowth: 2.6 },
  { year: 2022, jgb10y: 0.25, nominalGrowth: 1.6, inflation: 2.5, realGrowth: -0.9 },
  { year: 2023, jgb10y: 0.55, nominalGrowth: 5.7, inflation: 3.2, realGrowth: 2.5 },
  { year: 2024, jgb10y: 1.05, nominalGrowth: 3.2, inflation: 2.7, realGrowth: 0.5 },
];

export const DATA_SOURCES: DataSource[] = [
  { name: "一般会計税収の推移", url: "https://www.mof.go.jp/tax_policy/summary/condition/a03.htm", desc: "税収データ" },
  { name: "財政に関する資料", url: "https://www.mof.go.jp/tax_policy/summary/condition/a02.htm", desc: "歳出・国債費" },
  { name: "普通国債残高の累増", url: "https://www.mof.go.jp/tax_policy/summary/condition/004.pdf", desc: "債務残高" },
  { name: "利払費と金利の推移", url: "https://www.mof.go.jp/tax_policy/summary/condition/005.pdf", desc: "利払い費" },
  { name: "日本の統計 2025 第5章", url: "https://www.stat.go.jp/data/nihon/05.html", desc: "統計局" },
  { name: "日本銀行 決算", url: "https://www.boj.or.jp/about/account/index.htm", desc: "国庫納付金" },
  { name: "貿易統計", url: "https://www.customs.go.jp/toukei/info/index.htm", desc: "財務省貿易統計" },
  { name: "国民生活基礎調査", url: "https://www.mhlw.go.jp/toukei/list/20-21.html", desc: "貧困率・所得分布" },
];

const baseParams: SimParams = {
  inflationRate: 2.0,
  realGrowth: 0.5,
  riskPremium: 0.5,
  initDebt: 1100,
  initTaxConsumption: 24,
  initTaxIncome: 22,
  initTaxCorporate: 17,
  initTaxOther: 12,
  initPolicyExp: 80,
  initAvgCoupon: 0.8,
  bojCA: 550,
  bojYield: 0.2,
  bojCapitalBuffer: 12,
  otherRevenue: 15,
  naturalIncrease: 0.5,
  policyRateSpread: 1.0,
  taxRateChangeYear: "なし",
  taxRateNew: 10,
  yenDepreciation: 2.0,
  nominalWageGrowth: 1.5,
  globalGrowth: 2.5,
  initExport: 100,
  initImport: 110,
  fxReserves: 180,
  initPovertyRate: 15.4,
  initGini: 0.334,
  initExchangeRate: 150,
  povertySensitivity: 0.5,
  energySubsidyRate: 0.3,
  initNFA: 420,
  nfaThreshold: 200,
  currencyRiskPremium: 2.0,
};

export const SCENARIOS: Scenario[] = [
  {
    name: "① ベースライン（現状維持）",
    label: "現在の政策を維持した場合の標準シナリオ",
    params: { ...baseParams },
  },
  {
    name: "② 高成長シナリオ",
    label: "構造改革が奏功し、実質成長率が高まるケース",
    params: { ...baseParams, realGrowth: 2.0, riskPremium: 0.3, otherRevenue: 16, nominalWageGrowth: 3.0, globalGrowth: 3.0, yenDepreciation: 0.5 },
  },
  {
    name: "③ スタグフレーション",
    label: "高インフレ＋低成長が長期化するケース",
    params: { ...baseParams, inflationRate: 4.0, realGrowth: 0.0, riskPremium: 1.0, naturalIncrease: 1.0, policyRateSpread: 0.5, yenDepreciation: 5.0, nominalWageGrowth: 1.0, povertySensitivity: 0.8, energySubsidyRate: 0.5 },
  },
  {
    name: "④ 金利急騰シナリオ",
    label: "国債の信認低下でリスクプレミアムが上昇するケース",
    params: { ...baseParams, inflationRate: 2.5, realGrowth: 0.3, riskPremium: 2.0, yenDepreciation: 4.0, nominalWageGrowth: 1.0 },
  },
  {
    name: "⑤ 財政再建シナリオ",
    label: "歳出削減と増税で財政健全化を目指すケース",
    params: { ...baseParams, inflationRate: 1.5, realGrowth: 1.0, riskPremium: 0.3, initTaxConsumption: 26, initTaxIncome: 24, initTaxCorporate: 18, initPolicyExp: 75, otherRevenue: 17, naturalIncrease: 0.3, yenDepreciation: 1.0, nominalWageGrowth: 2.0 },
  },
  {
    name: "⑥ 急激円安シナリオ",
    label: "円安が急激に進行し、輸入物価高騰と家計圧迫が進むケース",
    params: { ...baseParams, inflationRate: 3.5, realGrowth: 0.3, riskPremium: 1.0, yenDepreciation: 6.0, nominalWageGrowth: 1.0, globalGrowth: 2.0, povertySensitivity: 0.7, energySubsidyRate: 0.6 },
  },
];
