/**
 * types.ts — 統合政府財政シミュレーターの型定義
 *
 * このファイルは、シミュレーション全体で共有される全てのインターフェースを定義する。
 * - SimParams: シミュレーション入力パラメータ（60+フィールド）
 * - SimResult: 各年のシミュレーション出力（80+フィールド）
 * - ActualDataPoint / ActualMacroPoint: 実績データの型
 * - Scenario: プリセットシナリオの定義
 * - Constraints: 最適化の制約条件
 * - DataSource: データ出典情報
 */

/** 実績財政データ（2015〜2024年）の1年分の構造 */
export interface ActualDataPoint {
  year: number;
  /** 税収合計（兆円） */
  tax: number;
  /** 利払い費（兆円） */
  interest: number;
  /** 国債残高（兆円） */
  debt: number;
  /** 政策的経費合計（兆円） */
  policyExp: number;
  /** 歳入合計（兆円） */
  totalRevenue: number;
  /** 歳出合計（兆円） */
  totalCost: number;
  /** 財政収支（兆円、正=黒字） */
  fiscalBalance: number;
  /** 利払負担率（%、利払い費÷税収×100） */
  interestBurden: number;
  /** 平均クーポンレート（%） */
  avgCoupon: number;
  /** 日銀国庫納付金（兆円） */
  bojPayment: number;
  /** 消費税収（兆円） */
  taxConsumption: number;
  /** 所得税収（兆円） */
  taxIncome: number;
  /** 法人税収（兆円） */
  taxCorporate: number;
  /** その他税収（兆円） */
  taxOther: number;
  /** 為替レート（円/ドル） */
  exchangeRate: number;
  /** 輸出額（兆円） */
  exportAmount: number;
  /** 輸入額（兆円） */
  importAmount: number;
  /** 貿易収支（兆円） */
  tradeBalance: number;
  /** 相対的貧困率（%） */
  povertyRate: number;
  /** ジニ係数（0〜1） */
  giniIndex: number;
  /** 実質賃金伸び率（%） */
  realWageGrowth: number;
  /** 経常収支（兆円） */
  currentAccount: number;
  /** 対外純資産（兆円） */
  nfa: number;
  /** 名目GDP（兆円） */
  nominalGDP: number;
  /** 日銀純利益（兆円） */
  bojNetIncome?: number;
  /** 日銀保有JGB残高（兆円） */
  bojJGB?: number;
  /** 日銀当座預金残高（兆円） */
  bojCA?: number;
  /** 日銀保有JGB平均利回り（%） */
  bojYield?: number;
  /** 社会保障費（兆円） */
  socialSecurity?: number;
  /** 子育て支援費（兆円） */
  childcare?: number;
  /** 地方交付税（兆円） */
  localGovTransfer?: number;
  /** 防衛費（兆円） */
  defense?: number;
  /** その他政策経費（兆円） */
  otherPolicyExp?: number;
  /** その他収入（兆円） */
  otherRevenue?: number;
  /** 国債発行額（兆円） */
  bondIssuance?: number;
}

/** 実績マクロ経済データ（2015〜2024年）の1年分の構造 */
export interface ActualMacroPoint {
  year: number;
  /** 日本10年国債利回り（%） */
  jgb10y: number;
  /** 米国10年国債利回り（%） */
  ust10y: number;
  /** 米国CPI上昇率（%） */
  usCpi: number;
  /** 教育投資GDP比（%） */
  educationGDPRatio: number;
  /** 名目成長率（%） */
  nominalGrowth: number;
  /** インフレ率（%） */
  inflation: number;
  /** 実質成長率（%） */
  realGrowth: number;
}

/**
 * シミュレーション入力パラメータ
 *
 * サイドバーから調整可能な全変数を定義する。
 * 各フィールドにはデフォルト値（baseParams）が設定されている。
 */
export interface SimParams {
  /** インフレ率（%/年） — デフォルト: 2.0 */
  inflationRate: number;
  /** 実質GDP成長率（%/年） — デフォルト: 0.5 */
  realGrowth: number;
  /** リスクプレミアム（%ポイント） — デフォルト: 0.5 */
  riskPremium: number;
  /** 初期国債残高（兆円） — デフォルト: 1100 */
  initDebt: number;
  /** 消費税収の初期値（兆円） — デフォルト: 24 */
  initTaxConsumption: number;
  /** 所得税収の初期値（兆円） — デフォルト: 22 */
  initTaxIncome: number;
  /** 法人税収の初期値（兆円） — デフォルト: 17 */
  initTaxCorporate: number;
  /** その他税収の初期値（兆円） — デフォルト: 12 */
  initTaxOther: number;
  /** 政策的経費の初期値（兆円） — デフォルト: 80 */
  initPolicyExp: number;
  /** 平均クーポンレート初期値（%） — デフォルト: 0.8 */
  initAvgCoupon: number;
  /** 日銀当座預金残高（兆円） — デフォルト: 550 */
  bojCA: number;
  /** 日銀保有JGB平均利回り（%） — デフォルト: 0.2 */
  bojYield: number;
  /** 日銀自己資本バッファ（兆円） — デフォルト: 12 */
  bojCapitalBuffer: number;
  /** その他収入（兆円） — デフォルト: 15 */
  otherRevenue: number;
  /** 社会保障費の自然増率（%/年、インフレ率に上乗せ） — デフォルト: 0.5 */
  naturalIncrease: number;
  /** 政策金利スプレッド（%ポイント） — デフォルト: 1.0 */
  policyRateSpread: number;
  /** 消費税率変更年（"なし"で変更なし） — デフォルト: "なし" */
  taxRateChangeYear: string;
  /** 変更後の消費税率（%） — デフォルト: 10 */
  taxRateNew: number;
  /** 為替バイアス（%/年、正=円安傾向、負=円高傾向） — デフォルト: 2.0 */
  yenDepreciation: number;
  /** 名目賃金上昇率（%/年） — デフォルト: 1.5 */
  nominalWageGrowth: number;
  /** 生産性→賃金分配率（0〜1） — デフォルト: 0.5 */
  productivityShareRate: number;
  /** インフレ→賃金転嫁率（0〜1） — デフォルト: 0.3 */
  wagePassThroughRate: number;
  /** 世界経済成長率（%/年） — デフォルト: 2.5 */
  globalGrowth: number;
  /** 輸出額の初期値（兆円） — デフォルト: 100 */
  initExport: number;
  /** 輸入額の初期値（兆円） — デフォルト: 110 */
  initImport: number;
  /** 外貨準備高（兆円） — デフォルト: 180 */
  fxReserves: number;
  /** 初期貧困率（%） — デフォルト: 15.4 */
  initPovertyRate: number;
  /** 初期ジニ係数（0〜1） — デフォルト: 0.334 */
  initGini: number;
  /** 初期為替レート（円/ドル） — デフォルト: 150 */
  initExchangeRate: number;
  /** 貧困率の感応度（0〜1） — デフォルト: 0.5 */
  povertySensitivity: number;
  /** エネルギー補助金率（0〜1） — デフォルト: 0.3 */
  energySubsidyRate: number;
  /** 初期対外純資産（兆円） — デフォルト: 420 */
  initNFA: number;
  /** NFA防衛ライン（兆円、下回るとリスクプレミアム発動） — デフォルト: 200 */
  nfaThreshold: number;
  /** 通貨リスクプレミアム（%ポイント） — デフォルト: 2.0 */
  currencyRiskPremium: number;
  /** 日銀保有JGB初期残高（兆円） — デフォルト: 590 */
  initBojJGB: number;
  /** 日銀QT（量的引き締め）ペース（兆円/年） — デフォルト: 30 */
  bojQTRate: number;
  /** 日銀当座預金下限（兆円） — デフォルト: 100 */
  bojCAFloor: number;
  /** 財政リスク感応度（利払負担率超過1%あたりのプレミアム加算） — デフォルト: 0.1 */
  fiscalRiskSensitivity: number;
  /** 利払負担率の閾値（%、超過で財政リスクプレミアム発動） — デフォルト: 20 */
  interestBurdenThreshold: number;
  /** 社会保障費の初期値（兆円） — デフォルト: 37 */
  initSocialSecurity: number;
  /** 子育て支援費の初期値（兆円） — デフォルト: 5 */
  initChildcare: number;
  /** 地方交付税の初期値（兆円） — デフォルト: 17 */
  initLocalGovTransfer: number;
  /** 防衛費の初期値（兆円） — デフォルト: 7 */
  initDefense: number;
  /** 子育て支援費の年間成長率（%/年） — デフォルト: 2.0 */
  childcareGrowth: number;
  /** 防衛費の年間成長率（%/年） — デフォルト: 1.5 */
  defenseGrowth: number;
  /** 初期名目GDP（兆円） — デフォルト: 615 */
  initNominalGDP: number;
  /** 企業内部留保の初期値（兆円） — デフォルト: 550 */
  initRetainedEarnings: number;
  /** 実効法人税率（0〜1） — デフォルト: 0.23 */
  effectiveCorporateTaxRate: number;
  /** 内部留保還元率（0〜1、年間で賃金に還元される割合） — デフォルト: 0.02 */
  retainedEarningsReturnRate: number;
  /** 海外金利（%、米国10年国債利回り想定） — デフォルト: 3.5 */
  foreignInterestRate: number;
  /** 海外インフレ率（%/年） — デフォルト: 2.0 */
  foreignInflation: number;
  /** 人口成長率（%/年、負=人口減少） — デフォルト: -0.5 */
  populationGrowth: number;
  /** 労働参加率変化（%/年） — デフォルト: 0.1 */
  laborParticipationChange: number;
  /** 教育投資GDP比（%） — デフォルト: 3.5 */
  educationGDPRatio: number;
  /** テクノロジー効果（%/年、人的資本への寄与） — デフォルト: 0.2 */
  techEffect: number;
  /** 合計特殊出生率の基準値 — デフォルト: 1.20 */
  baseTFR: number;
  /** TFR感応度（賃金・格差・子育て支援への反応度） — デフォルト: 0.5 */
  tfrSensitivity: number;
  /** シミュレーション期間（年数、30/40/50から選択） — デフォルト: 30 */
  simYears: number;
}

/**
 * シミュレーション出力（1年分）
 *
 * runSimulation() が返す配列の各要素。
 * 財政・金融・家計・人口動態・企業セクターの全指標を含む。
 */
export interface SimResult {
  year: number;
  /** 税収合計（兆円） */
  tax: number;
  /** 日銀国庫納付金（兆円、累積損失がバッファ超過時は0） */
  bojPayment: number;
  /** 日銀純利益（兆円） */
  bojNetIncome: number;
  /** 日銀累積損失（兆円） */
  bojCumulativeLoss: number;
  /** 歳入合計（兆円、税収+その他収入+日銀納付金） */
  totalRevenue: number;
  /** 政策的経費合計（兆円） */
  policyExp: number;
  /** 平均クーポンレート（%） */
  avgCoupon: number;
  /** 利払い費（兆円） */
  interest: number;
  /** 歳出合計（兆円、政策経費+利払い費） */
  totalCost: number;
  /** 国債残高（兆円） */
  debt: number;
  /** 財政収支（兆円、正=黒字） */
  fiscalBalance: number;
  /** 利払負担率（%、利払い費÷税収×100） */
  interestBurden: number;
  /** 日銀収入（JGB利息、兆円） */
  bojRev: number;
  /** 日銀支出（当座預金付利、兆円） */
  bojCost: number;
  /** 政策金利（%） */
  policyRate: number;
  /** 消費税収（兆円） */
  taxConsumption: number;
  /** 所得税収（兆円） */
  taxIncome: number;
  /** 法人税収（兆円） */
  taxCorporate: number;
  /** その他税収（兆円） */
  taxOther: number;
  /** 国債新規発行額（兆円） */
  bondIssuance: number;
  /** その他収入：印紙税（兆円） */
  otherRevStamp: number;
  /** その他収入：政府資産（兆円） */
  otherRevGov: number;
  /** その他収入：運用益（兆円） */
  otherRevAsset: number;
  /** その他収入：雑収入（兆円） */
  otherRevMisc: number;
  /** 為替レート（円/ドル） */
  exchangeRate: number;
  /** 輸入額（兆円） */
  importAmount: number;
  /** 輸出額（兆円） */
  exportAmount: number;
  /** 貿易収支（兆円） */
  tradeBalance: number;
  /** 実質賃金伸び率（%） */
  realWageGrowth: number;
  /** 相対的貧困率（%） */
  povertyRate: number;
  /** ジニ係数（0〜1） */
  giniIndex: number;
  /** エネルギー補助金（兆円） */
  energySubsidy: number;
  /** 外貨準備評価益（兆円） */
  fxValuationGain: number;
  /** CPI上昇率（%） */
  cpiIncrease: number;
  /** 賃金上昇率（%） */
  wageIncrease: number;
  /** モデル家計の年収（万円） */
  modelIncome: number;
  /** モデル家計の可処分所得（万円） */
  modelDisposable: number;
  /** モデル家計の食費（万円） */
  modelFoodCost: number;
  /** モデル家計のエネルギー費（万円） */
  modelEnergyCost: number;
  /** モデル家計の食費変化率（%） */
  modelFoodCostChange: number;
  /** モデル家計のエネルギー費変化率（%） */
  modelEnergyCostChange: number;
  /** モデル家計の可処分所得変化率（%） */
  modelDisposableChange: number;
  /** 五分位所得倍率 */
  incomeRatio: number;
  /** 経常収支（兆円） */
  currentAccount: number;
  /** 対外純資産（兆円） */
  nfa: number;
  /** 動的通貨リスクプレミアム（%ポイント） */
  dynamicRiskPremium: number;
  /** 実効市場金利（%） */
  effectiveMarketRate: number;
  /** 日銀保有JGB残高（兆円） */
  bojJGB: number;
  /** 日銀当座預金実際残高（兆円） */
  bojCAActual: number;
  /** 日銀保有JGB実際利回り（%） */
  bojYieldActual: number;
  /** 財政リスクプレミアム（%ポイント） */
  fiscalRiskPremium: number;
  /** 社会保障費（兆円） */
  socialSecurity: number;
  /** 子育て支援費（兆円） */
  childcare: number;
  /** 地方交付税（兆円） */
  localGovTransfer: number;
  /** 防衛費（兆円） */
  defense: number;
  /** その他政策経費（兆円） */
  otherPolicyExp: number;
  /** 国債収入（兆円） */
  bondRevenue: number;
  /** 歳入総計（税+国債+その他、兆円） */
  revenueTotal: number;
  /** 税収構成比（%） */
  revenueTaxRatio: number;
  /** 国債構成比（%） */
  revenueBondRatio: number;
  /** その他構成比（%） */
  revenueOtherRatio: number;
  /** 実質政策的経費指数（初年度=100） */
  realPolicyExpIndex: number;
  /** 名目GDP（兆円） */
  nominalGDP: number;
  /** 債務GDP比（%） */
  debtToGDP: number;
  /** 企業利益（兆円） */
  corporateProfit: number;
  /** 企業内部留保残高（兆円） */
  retainedEarnings: number;
  /** 内部留保GDP比（%） */
  retainedToGDP: number;
  /** 内生賃金上昇率（%） */
  endogenousWage: number;
  /** NFA悪化連続年数（通貨リスク加速係数に使用） */
  nfaDeteriorationStreak: number;
  /** 人的資本指数（初年度=100） */
  humanCapitalIndex: number;
  /** 労働力指数（初年度=100） */
  laborForceIndex: number;
  /** 合計特殊出生率 */
  tfr: number;
  /** 社会活力指数（0〜1、成長率にブースト） */
  socialVitalityIndex: number;
  /** 教育投資効果（人的資本への寄与率） */
  educationEffect: number;
  /** 人的資本成長率（%/年） */
  humanCapitalGrowth: number;
}

/** 制約条件の個別設定 */
export interface Constraint {
  /** 制約の有効/無効 */
  enabled: boolean;
  /** 閾値 */
  threshold: number;
}

/** 最適化で使用する制約条件セット */
export interface Constraints {
  /** 貧困率の上限（デフォルト: 20%） */
  povertyRate: Constraint;
  /** ジニ係数の上限（デフォルト: 0.45） */
  giniIndex: Constraint;
  /** 利払負担率の上限（デフォルト: 30%） */
  interestBurden: Constraint;
  /** 実質政策的経費指数の下限（デフォルト: 70） */
  realPolicyExpIndex: Constraint;
  /** 経常赤字連続年数の上限（デフォルト: 5年） */
  currentAccountDeficit: Constraint;
}

/** プリセットシナリオの定義構造 */
export interface Scenario {
  /** シナリオ名（例: "① ベースライン（現状維持）"） */
  name: string;
  /** シナリオの概要説明 */
  label: string;
  /** シミュレーションパラメータ（baseParamsからの差分上書き） */
  params: SimParams;
  /** メリット（3〜4項目） */
  merits: string[];
  /** デメリット（3〜4項目） */
  demerits: string[];
  /** 推奨政策（4〜5項目） */
  policies: string[];
}

/** データ出典情報 */
export interface DataSource {
  /** データソース名 */
  name: string;
  /** URL */
  url: string;
  /** 説明 */
  desc: string;
}
