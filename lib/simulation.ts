export interface ScenarioParams {
  inflationRate: number;
  realGrowth: number;
  riskPremium: number;
  initDebt: number;
  initTax: number;
  initPolicyExp: number;
  initAvgCoupon: number;
  bojCurrentAccount: number;
  bojBondYield: number;
  taxElasticity: number;
  otherRevenue: number;
  naturalIncrease: number;
  policyRateSpread: number;
}

export interface YearData {
  year: number;
  inflationRate: number;
  realGrowth: number;
  nominalGrowth: number;
  marketRate: number;
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
  isActual?: boolean;
}

export interface Scenario {
  name: string;
  label: string;
  params: ScenarioParams;
}

export const SCENARIOS: Scenario[] = [
  {
    name: "① ベースライン（現状維持）",
    label: "現在の政策を維持した場合の標準シナリオ",
    params: {
      inflationRate: 2.0, realGrowth: 0.5, riskPremium: 0.5,
      initDebt: 1100, initTax: 75, initPolicyExp: 80,
      initAvgCoupon: 0.8, bojCurrentAccount: 550, bojBondYield: 0.2,
      taxElasticity: 1.2, otherRevenue: 15, naturalIncrease: 0.5, policyRateSpread: 1.0,
    },
  },
  {
    name: "② 高成長シナリオ",
    label: "構造改革が奏功し、実質成長率が高まるケース",
    params: {
      inflationRate: 2.0, realGrowth: 2.0, riskPremium: 0.3,
      initDebt: 1100, initTax: 75, initPolicyExp: 80,
      initAvgCoupon: 0.8, bojCurrentAccount: 550, bojBondYield: 0.2,
      taxElasticity: 1.3, otherRevenue: 16, naturalIncrease: 0.5, policyRateSpread: 1.0,
    },
  },
  {
    name: "③ スタグフレーション",
    label: "高インフレ＋低成長が長期化するケース",
    params: {
      inflationRate: 4.0, realGrowth: 0.0, riskPremium: 1.0,
      initDebt: 1100, initTax: 75, initPolicyExp: 80,
      initAvgCoupon: 0.8, bojCurrentAccount: 550, bojBondYield: 0.2,
      taxElasticity: 0.8, otherRevenue: 15, naturalIncrease: 1.0, policyRateSpread: 0.5,
    },
  },
  {
    name: "④ 金利急騰シナリオ",
    label: "国債の信認低下でリスクプレミアムが上昇するケース",
    params: {
      inflationRate: 2.5, realGrowth: 0.3, riskPremium: 2.0,
      initDebt: 1100, initTax: 75, initPolicyExp: 80,
      initAvgCoupon: 0.8, bojCurrentAccount: 550, bojBondYield: 0.2,
      taxElasticity: 1.2, otherRevenue: 15, naturalIncrease: 0.5, policyRateSpread: 1.0,
    },
  },
  {
    name: "⑤ 財政再建シナリオ",
    label: "歳出削減と増税で財政健全化を目指すケース",
    params: {
      inflationRate: 1.5, realGrowth: 1.0, riskPremium: 0.3,
      initDebt: 1100, initTax: 80, initPolicyExp: 75,
      initAvgCoupon: 0.8, bojCurrentAccount: 550, bojBondYield: 0.2,
      taxElasticity: 1.2, otherRevenue: 17, naturalIncrease: 0.3, policyRateSpread: 1.0,
    },
  },
];

export const ACTUAL_DATA: YearData[] = [
  { year: 2015, inflationRate: 0.8, realGrowth: 1.6, nominalGrowth: 2.4, marketRate: 0.4, tax: 56.3, bojPayment: 0.7, totalRevenue: 72.0, policyExp: 57.4, avgCoupon: 1.2, interest: 10.0, totalCost: 67.4, debt: 807, fiscalBalance: 4.6, interestBurden: 17.8, isActual: true },
  { year: 2016, inflationRate: -0.1, realGrowth: 0.8, nominalGrowth: 0.7, marketRate: -0.1, tax: 55.5, bojPayment: 0.5, totalRevenue: 71.0, policyExp: 57.8, avgCoupon: 1.1, interest: 9.5, totalCost: 67.3, debt: 838, fiscalBalance: 3.7, interestBurden: 17.1, isActual: true },
  { year: 2017, inflationRate: 0.5, realGrowth: 1.7, nominalGrowth: 2.2, marketRate: 0.1, tax: 58.8, bojPayment: 0.6, totalRevenue: 74.4, policyExp: 58.4, avgCoupon: 1.0, interest: 9.0, totalCost: 67.4, debt: 865, fiscalBalance: 7.0, interestBurden: 15.3, isActual: true },
  { year: 2018, inflationRate: 1.0, realGrowth: 0.6, nominalGrowth: 1.6, marketRate: 0.1, tax: 60.4, bojPayment: 0.6, totalRevenue: 76.0, policyExp: 58.8, avgCoupon: 0.9, interest: 8.8, totalCost: 67.6, debt: 883, fiscalBalance: 8.4, interestBurden: 14.6, isActual: true },
  { year: 2019, inflationRate: 0.5, realGrowth: -0.4, nominalGrowth: 0.1, marketRate: -0.2, tax: 58.4, bojPayment: 0.5, totalRevenue: 73.9, policyExp: 62.0, avgCoupon: 0.9, interest: 8.5, totalCost: 70.5, debt: 897, fiscalBalance: 3.4, interestBurden: 14.6, isActual: true },
  { year: 2020, inflationRate: 0.0, realGrowth: -4.1, nominalGrowth: -4.1, marketRate: 0.0, tax: 60.8, bojPayment: 0.5, totalRevenue: 76.3, policyExp: 77.5, avgCoupon: 0.8, interest: 8.2, totalCost: 85.7, debt: 964, fiscalBalance: -9.4, interestBurden: 13.5, isActual: true },
  { year: 2021, inflationRate: -0.2, realGrowth: 2.6, nominalGrowth: 2.4, marketRate: 0.1, tax: 67.0, bojPayment: 0.6, totalRevenue: 82.6, policyExp: 67.0, avgCoupon: 0.8, interest: 8.0, totalCost: 75.0, debt: 990, fiscalBalance: 7.6, interestBurden: 11.9, isActual: true },
  { year: 2022, inflationRate: 2.5, realGrowth: 1.0, nominalGrowth: 3.5, marketRate: 0.3, tax: 71.1, bojPayment: 0.5, totalRevenue: 86.6, policyExp: 67.4, avgCoupon: 0.8, interest: 8.0, totalCost: 75.4, debt: 1005, fiscalBalance: 11.2, interestBurden: 11.3, isActual: true },
  { year: 2023, inflationRate: 3.3, realGrowth: 1.5, nominalGrowth: 4.8, marketRate: 0.7, tax: 72.1, bojPayment: 0.5, totalRevenue: 87.6, policyExp: 72.7, avgCoupon: 0.8, interest: 8.1, totalCost: 80.8, debt: 1068, fiscalBalance: 6.8, interestBurden: 11.2, isActual: true },
  { year: 2024, inflationRate: 2.8, realGrowth: 0.1, nominalGrowth: 2.9, marketRate: 1.1, tax: 75.2, bojPayment: 0.4, totalRevenue: 90.6, policyExp: 73.5, avgCoupon: 0.9, interest: 9.6, totalCost: 83.1, debt: 1103, fiscalBalance: 7.5, interestBurden: 12.8, isActual: true },
];

export const DATA_SOURCES = [
  { name: "一般会計税収の推移", url: "https://www.mof.go.jp/tax_policy/summary/condition/a03.htm", description: "税収データ" },
  { name: "財政に関する資料", url: "https://www.mof.go.jp/tax_policy/summary/condition/a02.htm", description: "歳出・国債費データ" },
  { name: "普通国債残高の累増", url: "https://www.mof.go.jp/tax_policy/summary/condition/004.pdf", description: "債務残高データ" },
  { name: "利払費と金利の推移", url: "https://www.mof.go.jp/tax_policy/summary/condition/005.pdf", description: "利払い費データ" },
  { name: "日本の統計 2025 第5章 財政", url: "https://www.stat.go.jp/data/nihon/05.html", description: "統計局財政データ" },
];

export function runSimulation(params: ScenarioParams): YearData[] {
  const B = params.inflationRate / 100;
  const C = params.realGrowth / 100;
  const D = B + C;
  const E = D + params.riskPremium / 100;

  const years: YearData[] = [];
  const n = 30;

  for (let i = 0; i < n; i++) {
    const year = 2026 + i;

    if (i === 0) {
      const policyRate = Math.max(E - params.policyRateSpread / 100, 0);
      const bojRevenue = params.initDebt * (params.bojBondYield / 100);
      const bojCost = params.bojCurrentAccount * policyRate;
      const bojPayment = Math.max(bojRevenue - bojCost, 0);
      const tax = params.initTax;
      const totalRevenue = tax + bojPayment + params.otherRevenue;
      const avgCoupon = params.initAvgCoupon / 100;
      const interest = params.initDebt * avgCoupon;
      const policyExp = params.initPolicyExp;
      const totalCost = policyExp + interest;
      const fiscalBalance = totalRevenue - totalCost;
      const debt = params.initDebt + (totalCost - totalRevenue);
      const interestBurden = tax !== 0 ? (interest / tax) * 100 : 0;

      years.push({
        year, inflationRate: B * 100, realGrowth: C * 100,
        nominalGrowth: D * 100, marketRate: E * 100,
        tax, bojPayment, totalRevenue, policyExp, avgCoupon: avgCoupon * 100,
        interest, totalCost, debt, fiscalBalance, interestBurden,
      });
    } else {
      const prev = years[i - 1];
      const tax = prev.tax * (1 + D * params.taxElasticity);
      const policyRate = Math.max(E - params.policyRateSpread / 100, 0);
      const bojRevenue = prev.debt * (params.bojBondYield / 100);
      const bojCost = params.bojCurrentAccount * policyRate;
      const bojPayment = Math.max(bojRevenue - bojCost, 0);
      const totalRevenue = tax + bojPayment + params.otherRevenue;
      const policyExp = prev.policyExp * (1 + B) + params.naturalIncrease;
      const avgCouponDecimal = (prev.avgCoupon / 100 * 8 / 9) + (E * 1 / 9);
      const interest = prev.debt * avgCouponDecimal;
      const totalCost = policyExp + interest;
      const fiscalBalance = totalRevenue - totalCost;
      const debt = prev.debt + (totalCost - totalRevenue);
      const interestBurden = tax !== 0 ? (interest / tax) * 100 : 0;

      years.push({
        year, inflationRate: B * 100, realGrowth: C * 100,
        nominalGrowth: D * 100, marketRate: E * 100,
        tax, bojPayment, totalRevenue, policyExp, avgCoupon: avgCouponDecimal * 100,
        interest, totalCost, debt, fiscalBalance, interestBurden,
      });
    }
  }

  return years;
}
