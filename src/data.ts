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
  realWageGrowth: number;
  currentAccount: number;
  nfa: number;
  nominalGDP: number;
  bojNetIncome?: number;
  bojJGB?: number;
  bojCA?: number;
  bojYield?: number;
  socialSecurity?: number;
  childcare?: number;
  localGovTransfer?: number;
  defense?: number;
  otherPolicyExp?: number;
  otherRevenue?: number;
  bondIssuance?: number;
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
  productivityShareRate: number;
  wagePassThroughRate: number;
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
  initBojJGB: number;
  bojQTRate: number;
  bojCAFloor: number;
  fiscalRiskSensitivity: number;
  interestBurdenThreshold: number;
  initSocialSecurity: number;
  initChildcare: number;
  initLocalGovTransfer: number;
  initDefense: number;
  childcareGrowth: number;
  defenseGrowth: number;
  initNominalGDP: number;
  initRetainedEarnings: number;
  effectiveCorporateTaxRate: number;
  retainedEarningsReturnRate: number;
}

export interface Constraint {
  enabled: boolean;
  threshold: number;
}

export interface Constraints {
  povertyRate: Constraint;
  giniIndex: Constraint;
  interestBurden: Constraint;
  realPolicyExpIndex: Constraint;
}

export const DEFAULT_CONSTRAINTS: Constraints = {
  povertyRate: { enabled: true, threshold: 20 },
  giniIndex: { enabled: true, threshold: 0.45 },
  interestBurden: { enabled: true, threshold: 30 },
  realPolicyExpIndex: { enabled: true, threshold: 70 },
};

export interface Scenario {
  name: string;
  label: string;
  params: SimParams;
  merits: string[];
  demerits: string[];
  policies: string[];
}

export interface DataSource {
  name: string;
  url: string;
  desc: string;
}

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
  { name: "毎月勤労統計調査", url: "https://www.mhlw.go.jp/toukei/list/30-1a.html", desc: "実質賃金指数" },
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
  productivityShareRate: 0.5,
  wagePassThroughRate: 0.3,
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
  initBojJGB: 590,
  bojQTRate: 30,
  bojCAFloor: 100,
  fiscalRiskSensitivity: 0.1,
  interestBurdenThreshold: 20,
  initSocialSecurity: 37,
  initChildcare: 5,
  initLocalGovTransfer: 17,
  initDefense: 7,
  childcareGrowth: 2.0,
  defenseGrowth: 1.5,
  initNominalGDP: 615,
  initRetainedEarnings: 550,
  effectiveCorporateTaxRate: 0.23,
  retainedEarningsReturnRate: 0.02,
};

export const SCENARIOS: Scenario[] = [
  {
    name: "① ベースライン（現状維持）",
    label: "現在の政策を維持した場合の標準シナリオ",
    params: { ...baseParams },
    merits: [
      "急激な政策変更がないため、短期的な混乱が少ない",
      "既存の制度・仕組みが維持され、予測可能性が高い",
      "国際的な信認が急落するリスクは限定的",
    ],
    demerits: [
      "債務残高が緩やかに増加し続け、将来世代の負担が拡大",
      "社会保障費の自然増に対応できず、給付水準が実質低下",
      "低成長・低賃金が固定化し、格差が徐々に拡大",
    ],
    policies: [
      "段階的な社会保障改革（給付の重点化、自己負担見直し）",
      "成長戦略の強化（規制改革、スタートアップ支援）",
      "財政の中期目標を設定し、PB（基礎的財政収支）黒字化を目指す",
      "人的資本投資の拡充（リスキリング、教育無償化拡大）",
    ],
  },
  {
    name: "② 高成長シナリオ",
    label: "構造改革が奏功し、実質成長率が高まるケース",
    params: { ...baseParams, realGrowth: 2.0, riskPremium: 0.3, otherRevenue: 16, nominalWageGrowth: 3.0, productivityShareRate: 0.7, wagePassThroughRate: 0.5, globalGrowth: 3.0, yenDepreciation: 0.5, retainedEarningsReturnRate: 0.05 },
    merits: [
      "税収の自然増で財政赤字が大幅に改善",
      "実質賃金が上昇し、国民生活が向上",
      "債務GDP比が低下し、財政の持続可能性が回復",
    ],
    demerits: [
      "高成長の実現には大胆な構造改革が必要で、政治的ハードルが高い",
      "成長の恩恵が一部の産業・地域に偏り、格差が拡大する可能性",
      "過熱リスクがあり、バブル的な資産価格上昇の懸念",
    ],
    policies: [
      "労働市場の流動化（解雇規制改革、同一労働同一賃金の徹底）",
      "イノベーション投資の集中（AI・半導体・バイオへの重点投資）",
      "女性・高齢者・外国人材の労働参加率向上",
      "規制のサンドボックス拡充、起業環境の抜本的改善",
      "教育制度改革（STEM教育強化、大学改革）",
    ],
  },
  {
    name: "③ スタグフレーション",
    label: "高インフレ＋低成長が長期化するケース",
    params: { ...baseParams, inflationRate: 4.0, realGrowth: 0.0, riskPremium: 1.0, naturalIncrease: 1.0, policyRateSpread: 0.5, yenDepreciation: 5.0, nominalWageGrowth: 1.0, productivityShareRate: 0.3, wagePassThroughRate: 0.2, povertySensitivity: 0.8, energySubsidyRate: 0.5, retainedEarningsReturnRate: 0.01 },
    merits: [
      "インフレにより名目債務の実質価値が目減りする（インフレ税効果）",
      "名目税収が増加し、見かけ上の財政指標が改善",
      "輸出企業は円安メリットを享受できる可能性",
    ],
    demerits: [
      "実質賃金が大幅に低下し、国民生活が困窮",
      "貧困率が上昇し、生活保護などの社会的コストが増大",
      "金融政策の舵取りが極めて困難（利上げすれば不況深刻化、据え置けばインフレ加速）",
    ],
    policies: [
      "サプライサイド改革（エネルギー自給率向上、食料安全保障強化）",
      "低所得層への重点的支援（給付付き税額控除の導入）",
      "賃上げ促進税制の強化と最低賃金の段階的引き上げ",
      "エネルギー転換の加速（再エネ・原子力の活用拡大）",
      "物価連動型の年金・社会保障給付の維持",
    ],
  },
  {
    name: "④ 金利急騰シナリオ",
    label: "国債の信認低下でリスクプレミアムが上昇するケース",
    params: { ...baseParams, inflationRate: 2.5, realGrowth: 0.3, riskPremium: 2.0, yenDepreciation: 4.0, nominalWageGrowth: 1.0, productivityShareRate: 0.4, wagePassThroughRate: 0.2 },
    merits: [
      "金利上昇が市場規律を働かせ、財政規律への圧力が高まる",
      "預金者や年金基金にとって運用利回りが改善",
      "円安による輸出競争力の一時的な回復",
    ],
    demerits: [
      "利払い費が急増し、政策的経費が圧迫される（クラウディングアウト）",
      "日銀が巨額の評価損・逆ザヤに直面し、中央銀行の信認が毀損",
      "住宅ローン金利上昇で家計負担増、不動産市場が下落",
    ],
    policies: [
      "緊急の財政健全化計画の策定と国際社会への発信",
      "国債の平均償還年限の長期化（短期依存の解消）",
      "日銀のバランスシート正常化を段階的に実施",
      "財政ルールの法制化（債務上限、支出キャップ）",
      "成長と財政のバランスを取る中期財政フレームワークの導入",
    ],
  },
  {
    name: "⑤ 財政再建シナリオ",
    label: "歳出削減と増税で財政健全化を目指すケース",
    params: { ...baseParams, inflationRate: 1.5, realGrowth: 1.0, riskPremium: 0.3, initTaxConsumption: 26, initTaxIncome: 24, initTaxCorporate: 18, initPolicyExp: 75, otherRevenue: 17, naturalIncrease: 0.3, yenDepreciation: 1.0, nominalWageGrowth: 2.0, productivityShareRate: 0.6, wagePassThroughRate: 0.4, retainedEarningsReturnRate: 0.03 },
    merits: [
      "債務残高の対GDP比が安定化・低下し、財政の持続可能性が確保",
      "金利リスクプレミアムが低下し、民間の借入コストも改善",
      "将来世代への負担の先送りが抑制される",
    ],
    demerits: [
      "増税による短期的な景気後退リスク",
      "社会保障削減で弱者への影響が大きい",
      "緊縮財政により公共サービスの質が低下する可能性",
    ],
    policies: [
      "消費税の段階的引き上げ（10%→12%→15%、軽減税率拡充とセット）",
      "社会保障の効率化（ジェネリック医薬品推進、予防医療への転換）",
      "デジタル行政推進による行政コスト削減",
      "所得税の累進性強化と金融所得課税の見直し",
      "歳出レビューの制度化と政策のサンセット条項導入",
    ],
  },
  {
    name: "⑥ 急激円安シナリオ",
    label: "円安が急激に進行し、輸入物価高騰と家計圧迫が進むケース",
    params: { ...baseParams, inflationRate: 3.5, realGrowth: 0.3, riskPremium: 1.0, yenDepreciation: 6.0, nominalWageGrowth: 1.0, productivityShareRate: 0.3, wagePassThroughRate: 0.2, globalGrowth: 2.0, povertySensitivity: 0.7, energySubsidyRate: 0.6 },
    merits: [
      "輸出産業・インバウンド観光の競争力が大幅に向上",
      "海外資産の円換算評価益が増加（NFA評価益）",
      "製造業の国内回帰（リショアリング）が促進される可能性",
    ],
    demerits: [
      "輸入物価高騰で食料・エネルギーコストが急増し、家計を直撃",
      "貧困率が上昇し、特に低所得層の生活が困窮",
      "エネルギー補助金等の財政支出が膨張し、財政を圧迫",
    ],
    policies: [
      "エネルギー自給率の向上（再エネ・原子力・水素）",
      "食料自給率改善と農業の生産性向上",
      "サプライチェーンの多様化と重要物資の国内生産",
      "為替介入と日銀の適切な金融政策運営",
      "低所得世帯への直接給付（物価スライド型）",
    ],
  },
  {
    name: "⑦ 少子化加速シナリオ",
    label: "出生率がさらに低下し、社会保障費膨張と労働力不足が深刻化するケース",
    params: { ...baseParams, realGrowth: 0.0, naturalIncrease: 1.5, initSocialSecurity: 39, childcareGrowth: 3.0, nominalWageGrowth: 0.8, productivityShareRate: 0.4, wagePassThroughRate: 0.3, povertySensitivity: 0.6 },
    merits: [
      "一人当たり資産は維持されやすい（人口減による希薄化が限定的）",
      "住宅・不動産の供給過剰で住居費が低下する可能性",
      "自動化・省力化投資が加速するインセンティブが生まれる",
    ],
    demerits: [
      "社会保障（年金・医療・介護）の現役世代負担が急増",
      "労働力不足で経済成長率が低迷、税収基盤が縮小",
      "地方の過疎化が加速し、行政サービスの維持が困難に",
    ],
    policies: [
      "子育て支援の抜本強化（児童手当増額、保育無償化、育休制度拡充）",
      "社会保障の負担構造改革（高齢者の応能負担、支給開始年齢引き上げ）",
      "外国人材の戦略的受け入れ（高度人材・介護人材）",
      "AI・ロボットによる省力化投資への税制優遇",
      "地方創生2.0（テレワーク推進、地方移住支援、コンパクトシティ化）",
    ],
  },
  {
    name: "⑧ テクノロジー革命シナリオ",
    label: "AI・自動化で生産性が飛躍的に向上するが、格差拡大も伴うケース",
    params: { ...baseParams, realGrowth: 2.5, inflationRate: 1.5, riskPremium: 0.2, nominalWageGrowth: 2.0, productivityShareRate: 0.3, wagePassThroughRate: 0.4, globalGrowth: 3.5, initTaxCorporate: 19, effectiveCorporateTaxRate: 0.25, yenDepreciation: 0.5, retainedEarningsReturnRate: 0.01 },
    merits: [
      "生産性向上で経済成長率が大幅に改善、税収が増加",
      "行政のデジタル化で公共サービスの効率が向上",
      "医療・介護分野のAI活用で社会保障費の伸びを抑制",
    ],
    demerits: [
      "技術革新の恩恵が資本側に偏り、労働分配率が低下",
      "中間層の雇用が減少（技術的失業）、所得格差が拡大",
      "デジタルデバイドにより高齢者・地方が取り残される",
    ],
    policies: [
      "ユニバーサル・ベーシックインカム（UBI）の段階的導入検討",
      "リスキリング政策の大規模展開（デジタル人材育成）",
      "デジタル課税・ロボット税の国際協調による導入",
      "AI倫理ガイドラインと労働者保護制度の整備",
      "技術革新の果実を広く分配する「包摂的成長」戦略",
    ],
  },
  {
    name: "⑨ グローバル危機シナリオ",
    label: "地政学リスク・パンデミック等で世界経済が混乱するケース",
    params: { ...baseParams, realGrowth: -0.5, inflationRate: 3.0, riskPremium: 1.5, yenDepreciation: 4.0, globalGrowth: 0.5, initDefense: 9, defenseGrowth: 4.0, energySubsidyRate: 0.7, nominalWageGrowth: 0.5, productivityShareRate: 0.3, wagePassThroughRate: 0.2, povertySensitivity: 0.8, naturalIncrease: 1.2 },
    merits: [
      "安全保障投資の拡大で防衛産業・技術基盤が強化",
      "サプライチェーン再構築で国内産業の自立性が向上",
      "危機対応を通じた社会の連帯意識の醸成",
    ],
    demerits: [
      "防衛費・危機対応費の急増で他の政策経費が圧迫",
      "サプライチェーン断絶でインフレ・物価高騰が深刻化",
      "世界的な景気後退で輸出が減少し、経常収支が悪化",
    ],
    policies: [
      "経済安全保障法制の強化（重要物資の備蓄、技術流出防止）",
      "防衛費の対GDP比2%以上への段階的引き上げと財源確保",
      "パンデミック対応の制度整備（医療体制、ワクチン開発能力）",
      "食料・エネルギーの戦略的備蓄拡充",
      "同志国との経済連携強化（サプライチェーンの友好国シフト）",
    ],
  },
  {
    name: "⑩ 大増税シナリオ",
    label: "消費税15%＋法人税増で財政安定を図るが、経済停滞リスクを伴うケース",
    params: { ...baseParams, inflationRate: 1.0, realGrowth: 0.3, riskPremium: 0.2, initTaxConsumption: 28, taxRateChangeYear: "2030", taxRateNew: 15, initTaxIncome: 25, initTaxCorporate: 20, initPolicyExp: 78, otherRevenue: 18, naturalIncrease: 0.2, nominalWageGrowth: 1.0, productivityShareRate: 0.5, wagePassThroughRate: 0.3, effectiveCorporateTaxRate: 0.28, yenDepreciation: 1.0 },
    merits: [
      "財政収支が大幅に改善し、債務残高の安定化が実現",
      "財政の持続可能性が確保され、国債の信認が向上",
      "社会保障の安定財源が確保され、給付水準が維持可能",
    ],
    demerits: [
      "増税による消費減退で短期的に景気が悪化",
      "法人税増で企業の国際競争力が低下、海外移転リスク",
      "消費税の逆進性により低所得層の負担が相対的に増大",
    ],
    policies: [
      "消費税率引き上げと同時に食料品等の軽減税率を拡充",
      "法人税増と引き換えに研究開発減税・投資減税を拡大",
      "低所得層への給付金・税額控除で逆進性を緩和",
      "企業の国内投資を促すインセンティブ制度の設計",
      "段階的な増税スケジュールの明示で予見可能性を確保",
    ],
  },
];
