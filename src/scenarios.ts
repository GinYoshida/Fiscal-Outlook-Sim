/**
 * scenarios.ts — シナリオ定義
 *
 * ベースラインパラメータ（baseParams）と10種類のプリセットシナリオを定義する。
 *
 * 評価基準（ScenariosTabでの簡易警告カウント）:
 *   A+ = 0件, A = ≤5件, B+ = ≤10件, B = ≤15件, C = ≤25件, D = 26件以上
 *   簡易警告 = 各年の（利払負担率>30% + 貧困率>20% + NFA<閾値）の合計
 *
 * シナリオ分類:
 *   好結果: ② 高成長(B+), ⑤ 財政再建(A+), ⑧ テクノロジー革命(B+), ⑩ 再分配強化(A+)
 *   現状維持: ① ベースライン(D) — 改革なしの厳しさを示す
 *   リスク: ③④⑥⑦⑨(D) — 各種危機シナリオ
 */

import type { SimParams, Scenario } from './types';

/**
 * ベースラインパラメータ
 *
 * 2024年末時点の日本の財政状況を反映した初期値。
 * 各シナリオはこのパラメータをスプレッドし、差分のみ上書きする。
 */
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
  foreignInterestRate: 3.5,
  foreignInflation: 2.0,
  populationGrowth: -0.5,
  laborParticipationChange: 0.1,
  educationGDPRatio: 3.5,
  techEffect: 0.2,
  baseTFR: 1.20,
  tfrSensitivity: 0.5,
  simYears: 30,
};

export const SCENARIOS: Scenario[] = [
  // ① ベースライン — 現状維持（評価: D）
  // パラメータ変更なし。低成長・高齢化の現状が続いた場合の帰結を示す。
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

  // ② 高成長 — 構造改革成功（評価: B+）
  // 実質成長2%、教育投資4.5%GDP、労働参加率向上。NFA防衛ラインを-500に緩和（高成長経済は対外赤字を吸収可能）
  {
    name: "② 高成長シナリオ",
    label: "構造改革が奏功し、実質成長率が高まるケース",
    params: { ...baseParams, realGrowth: 2.0, riskPremium: 0.2, otherRevenue: 16, nominalWageGrowth: 3.0, productivityShareRate: 0.7, wagePassThroughRate: 0.5, globalGrowth: 3.0, yenDepreciation: 0.0, retainedEarningsReturnRate: 0.05, foreignInterestRate: 3.0, foreignInflation: 2.0, populationGrowth: -0.3, laborParticipationChange: 0.3, educationGDPRatio: 4.5, techEffect: 0.5, baseTFR: 1.30, tfrSensitivity: 0.6, naturalIncrease: 0.3, initTaxIncome: 24, initTaxCorporate: 18, initPolicyExp: 73, nfaThreshold: -500 },
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

  // ③ スタグフレーション — 高インフレ+低成長（評価: D）
  // インフレ4%で実質成長ゼロ。賃金転嫁が弱く実質賃金が低下し続ける。
  {
    name: "③ スタグフレーション",
    label: "高インフレ＋低成長が長期化するケース",
    params: { ...baseParams, inflationRate: 4.0, realGrowth: 0.0, riskPremium: 1.0, naturalIncrease: 1.0, policyRateSpread: 0.5, yenDepreciation: 1.5, nominalWageGrowth: 1.0, productivityShareRate: 0.3, wagePassThroughRate: 0.2, povertySensitivity: 0.8, energySubsidyRate: 0.5, retainedEarningsReturnRate: 0.01, foreignInterestRate: 3.5, foreignInflation: 2.0, populationGrowth: -0.6, laborParticipationChange: 0.0, educationGDPRatio: 3.0, techEffect: 0.1, baseTFR: 1.10, tfrSensitivity: 0.3 },
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

  // ④ 金利急騰 — 国債信認低下（評価: D）
  // リスクプレミアム2%で利払い費が急増。日銀も逆ザヤで損失拡大。
  {
    name: "④ 金利急騰シナリオ",
    label: "国債の信認低下でリスクプレミアムが上昇するケース",
    params: { ...baseParams, inflationRate: 2.5, realGrowth: 0.3, riskPremium: 2.0, yenDepreciation: -1.0, nominalWageGrowth: 1.0, productivityShareRate: 0.4, wagePassThroughRate: 0.2, foreignInterestRate: 3.0, foreignInflation: 2.0, populationGrowth: -0.5, laborParticipationChange: 0.0, educationGDPRatio: 3.2, techEffect: 0.1, baseTFR: 1.15, tfrSensitivity: 0.4 },
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

  // ⑤ 財政再建 — 増税＋歳出削減（評価: A+）
  // 消費税26兆円、所得税24兆円、法人税18兆円。歳出75兆円に抑制。
  {
    name: "⑤ 財政再建シナリオ",
    label: "歳出削減と増税で財政健全化を目指すケース",
    params: { ...baseParams, inflationRate: 1.5, realGrowth: 1.0, riskPremium: 0.3, initTaxConsumption: 26, initTaxIncome: 24, initTaxCorporate: 18, initPolicyExp: 75, otherRevenue: 17, naturalIncrease: 0.3, yenDepreciation: 0.0, nominalWageGrowth: 2.0, productivityShareRate: 0.6, wagePassThroughRate: 0.4, retainedEarningsReturnRate: 0.03, foreignInterestRate: 3.0, foreignInflation: 2.0, populationGrowth: -0.4, laborParticipationChange: 0.2, educationGDPRatio: 4.0, techEffect: 0.3, baseTFR: 1.25, tfrSensitivity: 0.5 },
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

  // ⑥ 急激円安 — 為替急落（評価: D）
  // 円安バイアス3%/年、海外金利4.5%。輸入物価高騰で家計圧迫。
  {
    name: "⑥ 急激円安シナリオ",
    label: "円安が急激に進行し、輸入物価高騰と家計圧迫が進むケース",
    params: { ...baseParams, inflationRate: 3.5, realGrowth: 0.3, riskPremium: 1.0, yenDepreciation: 3.0, nominalWageGrowth: 1.0, productivityShareRate: 0.3, wagePassThroughRate: 0.2, globalGrowth: 2.0, povertySensitivity: 0.7, energySubsidyRate: 0.6, foreignInterestRate: 4.5, foreignInflation: 2.5, populationGrowth: -0.5, laborParticipationChange: 0.0, educationGDPRatio: 3.0, techEffect: 0.1, baseTFR: 1.10, tfrSensitivity: 0.4 },
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

  // ⑦ 少子化加速 — 出生率急低下（評価: D）
  // TFR=0.90、人口成長-1.0%/年。社会保障費が膨張し労働力が不足。
  {
    name: "⑦ 少子化加速シナリオ",
    label: "出生率がさらに低下し、社会保障費膨張と労働力不足が深刻化するケース",
    params: { ...baseParams, realGrowth: 0.0, naturalIncrease: 1.5, initSocialSecurity: 39, childcareGrowth: 3.0, nominalWageGrowth: 0.8, productivityShareRate: 0.4, wagePassThroughRate: 0.3, povertySensitivity: 0.6, yenDepreciation: 0.5, foreignInterestRate: 3.5, foreignInflation: 2.0, populationGrowth: -1.0, laborParticipationChange: -0.1, educationGDPRatio: 3.0, techEffect: 0.2, baseTFR: 0.90, tfrSensitivity: 0.3 },
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

  // ⑧ テクノロジー革命 — AI・自動化で生産性飛躍（評価: B+）
  // 実質成長2%、テクノロジー効果0.8%、教育投資5%GDP。社会保障費の伸びを抑制。
  {
    name: "⑧ テクノロジー革命シナリオ",
    label: "AI・自動化で生産性が飛躍的に向上するが、格差拡大も伴うケース",
    params: { ...baseParams, realGrowth: 2.0, inflationRate: 1.5, riskPremium: 0.2, nominalWageGrowth: 2.5, productivityShareRate: 0.5, wagePassThroughRate: 0.5, globalGrowth: 3.5, initTaxCorporate: 19, effectiveCorporateTaxRate: 0.25, yenDepreciation: -0.5, retainedEarningsReturnRate: 0.03, foreignInterestRate: 3.0, foreignInflation: 2.0, populationGrowth: -0.3, laborParticipationChange: 0.3, educationGDPRatio: 5.0, techEffect: 0.8, baseTFR: 1.20, tfrSensitivity: 0.5, naturalIncrease: 0.3, initPolicyExp: 73 },
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

  // ⑨ グローバル危機 — 地政学リスク・パンデミック（評価: D）
  // 実質成長-0.5%、防衛費9兆円（成長4%/年）。サプライチェーン断絶でインフレ加速。
  {
    name: "⑨ グローバル危機シナリオ",
    label: "地政学リスク・パンデミック等で世界経済が混乱するケース",
    params: { ...baseParams, realGrowth: -0.5, inflationRate: 3.0, riskPremium: 1.5, yenDepreciation: 1.0, globalGrowth: 0.5, initDefense: 9, defenseGrowth: 4.0, energySubsidyRate: 0.7, nominalWageGrowth: 0.5, productivityShareRate: 0.3, wagePassThroughRate: 0.2, povertySensitivity: 0.8, naturalIncrease: 1.2, foreignInterestRate: 4.0, foreignInflation: 3.0, populationGrowth: -0.6, laborParticipationChange: 0.0, educationGDPRatio: 3.0, techEffect: 0.1, baseTFR: 1.10, tfrSensitivity: 0.3 },
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

  // ⑩ 再分配強化 — 消費税据え置き＋累進強化（評価: A+）
  // 消費税10%維持。所得税28兆円、法人税23兆円に累進強化。内部留保還元率6%。
  {
    name: "⑩ 再分配強化シナリオ",
    label: "消費税10%据え置きのまま、所得税・法人税の累進強化と企業から家計への賃金還流で財政改善を目指すケース",
    params: { ...baseParams, inflationRate: 1.5, realGrowth: 0.8, riskPremium: 0.3, initTaxConsumption: 23.8, taxRateChangeYear: "なし", taxRateNew: 10, initTaxIncome: 28, initTaxCorporate: 23, initPolicyExp: 76, otherRevenue: 18, naturalIncrease: 0.3, nominalWageGrowth: 2.5, productivityShareRate: 0.7, wagePassThroughRate: 0.6, effectiveCorporateTaxRate: 0.26, yenDepreciation: 0.0, retainedEarningsReturnRate: 0.06, foreignInterestRate: 3.0, foreignInflation: 2.0, populationGrowth: -0.3, laborParticipationChange: 0.2, educationGDPRatio: 4.5, techEffect: 0.3, baseTFR: 1.25, tfrSensitivity: 0.6 },
    merits: [
      "消費税10%を据え置き、逆進性の強い間接税に頼らず家計の負担増を回避",
      "所得税累進強化（28兆円）・法人税増（23兆円）で応能負担原則を徹底し、税の公平性を向上",
      "内部留保還元率6%と賃金分配率70%の改善で、企業利益が賃金に還流し実質可処分所得が向上",
      "教育投資GDP比4.5%への引き上げで人的資本を強化し、中長期的な成長基盤を構築",
    ],
    demerits: [
      "法人税引き上げ（実効税率26%）と内部留保還元強化により、企業の設備投資余力・国際競争力が低下するリスク",
      "所得税累進強化で高所得人材・高度専門職の海外流出（頭脳流出）リスク",
      "消費税据え置きにより財源が所得税・法人税に集中し、景気変動による税収の振れ幅が大きくなる",
      "賃金分配率70%・転嫁率60%の達成には労使交渉や制度改革が不可欠で、政策実現の難度が高い",
    ],
    policies: [
      "消費税10%を維持し、低所得層への逆進的負担を抑制",
      "所得税の最高税率引き上げと金融所得課税（配当・譲渡益・暗号資産）の総合課税化",
      "法人税増税と引き換えに賃上げ税制を大幅拡充（賃上げ企業は実質減税、内部留保蓄積企業は増税）",
      "内部留保課税の段階的導入＋従業員への利益分配制度（プロフィットシェアリング）の義務化検討",
      "最低賃金の段階的引き上げ（年率3%以上）と中小企業への賃上げ支援策・生産性向上補助金のセット実施",
    ],
  },
];
