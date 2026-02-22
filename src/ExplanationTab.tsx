import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, ReferenceLine, Cell
} from 'recharts'
import type { SimResult } from './simulation'
import type { ActualDataPoint, SimParams, DataSource } from './data'
import { ACTUAL_DATA } from './data'

interface Props {
  params: SimParams;
  simData: SimResult[];
  actualData: ActualDataPoint[];
  dataSources: DataSource[];
}

function Expander({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="expander">
      <div className="expander-header" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <span className={`collapsible-arrow ${open ? 'open' : ''}`}>▼</span>
      </div>
      {open && <div className="expander-content">{children}</div>}
    </div>
  )
}

export function ExplanationTab({ params, simData, actualData, dataSources }: Props) {
  const p = params
  const nominalG = p.inflationRate + p.realGrowth
  const marketRate = nominalG + p.riskPremium
  const policyRate = Math.max(marketRate / 100 - p.policyRateSpread / 100, 0) * 100

  const bojRevVal = p.initDebt * (p.bojYield / 100)
  const bojCostVal = p.bojCA * (policyRate / 100)
  const bojProfit = Math.max(bojRevVal - bojCostVal, 0)

  const allYears = useMemo(() => {
    const ay = actualData.map(d => d.year)
    const sy = simData.map(d => d.year)
    return [...ay, ...sy]
  }, [actualData, simData])

  const [wfYear, setWfYear] = useState(2035)

  const wfData = useMemo(() => {
    const isActual = wfYear <= 2024
    if (isActual) {
      const d = ACTUAL_DATA.find(item => item.year === wfYear)
      return d ? { d, isActual: true, otherRev: d.totalRevenue - d.tax - d.bojPayment } : null
    } else {
      const d = simData.find(item => item.year === wfYear)
      return d ? { d, isActual: false, otherRev: d.otherRevStamp + d.otherRevGov + d.otherRevAsset + d.otherRevMisc } : null
    }
  }, [wfYear, simData])

  const sensitivityData = useMemo(() => {
    const rates = [0.0, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0]
    return rates.map(rate => {
      const pr = Math.max(rate / 100 - p.policyRateSpread / 100, 0)
      const bojP = Math.max(p.initDebt * (p.bojYield / 100) - p.bojCA * pr, 0)
      const intC = p.initDebt * rate / 100
      return {
        市場金利: rate,
        日銀納付金: parseFloat(bojP.toFixed(1)),
        利払い費: parseFloat(intC.toFixed(1)),
        ネット効果: parseFloat((bojP - intC).toFixed(1)),
      }
    })
  }, [p])

  return (
    <div>
      <h2 className="section-title">シミュレーターの目的</h2>
      <div className="prose">
        <p>
          財政についての議論では、「国債はいくら刷っても問題ない」「日本は破綻しない」といった極端な主張から、
          「財政破綻は目前」といった悲観論まで、さまざまな意見が飛び交っています。
          しかし、財政の健全性は<strong>国債残高だけ</strong>で判断できるものではありません。
        </p>
        <p style={{ marginTop: 12 }}>
          このシミュレーターは、日本政府と日本銀行を<strong>一体（統合政府）</strong>として捉え、
          国債だけでなく、<strong>円安による貿易収支への影響</strong>、<strong>消費税をはじめとする税収構造の変化</strong>、
          <strong>日銀納付金の財政への還流効果</strong>、そして<strong>家計への波及（実質賃金・貧困率・格差）</strong>まで、
          多角的に統合して30年間の推移をシミュレーションします。
        </p>
        <p style={{ marginTop: 12 }}>
          <strong>なぜ統合政府で見るのか？</strong>
        </p>
        <p>
          日銀は国債を大量に保有しており、政府が支払う利息の一部は日銀を通じて国庫に戻ります。
          この「日銀納付金」の存在を無視すると、政府の財政負担を過大に見積もることになります。
          統合政府として分析することで、より現実的な財政の姿を把握できます。
        </p>
        <p style={{ marginTop: 12 }}>
          <strong>想定する利用シーン</strong>
        </p>
        <p>
          極端な財政論に振り回されず、金利・為替・税制・金融政策といったマクロ経済の各要素が
          どのように連動し、将来の財政や家計に影響するかを俯瞰的に理解することで、
          ビジネスや生活設計の判断材料としてご活用いただけます。
        </p>
        <p style={{ marginTop: 12 }}>
          <strong>このシミュレーターでわかること</strong>
        </p>
        <ul style={{ paddingLeft: 20, marginTop: 4 }}>
          <li>金利上昇が財政に与える影響と日銀納付金による相殺効果</li>
          <li>税収構造の変化（消費税・所得税・法人税・その他の連動）</li>
          <li>円安が法人税・輸入コスト・エネルギー補助金に与える波及効果</li>
          <li>為替変動 → 貿易収支 → 家計（実質賃金・CPI）への影響チェーン</li>
          <li>消費税率変更や国債発行の長期的な効果</li>
          <li>貧困率・ジニ係数の長期推移（格差拡大リスクの可視化）</li>
          <li>外貨準備評価益・エネルギー補助金など政策フィードバック</li>
        </ul>
      </div>

      <h2 className="section-title">計算ロジックの全体像</h2>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>以下のツリー構造で、各年度の財政指標を計算しています。</p>
      <div className="code-block">{`A：歳入合計 = 税収合計 + 日銀納付金 + その他収入
│
├── 税収合計 = 消費税 + 所得税 + 法人税 + その他税
│   ├── 消費税 = 前年消費税 × (1 + インフレ率 × 1.0)
│   │   └── ※税率変更年度に (新税率/10) を乗じて水準調整
│   ├── 所得税 = 前年所得税 × (1 + 名目成長率 × 1.4)
│   │   └── 名目成長率 = インフレ率 + 実質成長率
│   ├── 法人税 = 前年法人税 × (1 + 実質成長率×2.0 + インフレ率×0.5)
│   │   └── ※円安効果: × (1 + 輸出利益 − 輸入コスト)
│   └── その他税 = 前年その他税 × (1 + 名目成長率 × 0.8)
│
├── 日銀納付金 = max(納付可能金額, 0)
│   └── 納付可能金額 = 国債利息収入 − 当座預金付利コスト
│
└── その他収入 = 基本その他収入 + 外貨準備評価益×0.1


B：支出合計 = 政策経費 + 利払い費
│
├── 政策経費 = 前年政策経費 × (1 + インフレ率) + 自然増 + エネルギー補助金
│   └── エネルギー補助金 = インフレ率 × 補助金率 × 10
│
└── 利払い費 = 前年債務残高 × 平均クーポン
    └── 平均クーポン = 前年クーポン × 8/9 + 市場金利 × 1/9


C：収支・残高
├── 財政収支 = 歳入合計 − 支出合計
├── 債務残高 = 前年債務残高 + (支出合計 − 歳入合計)
├── 国債発行額 = max(支出合計 − 歳入合計, 0)
└── 利払負担率 = (利払い費 ÷ 税収合計) × 100


D：貿易収支
├── 為替レート = 前年レート × (1 + 円安進行率)
├── 輸入額 = 前年 × (1 + 実質成長率) × (1 + インフレ × 円安係数)
├── 輸出額 = 前年 × (1 + 世界成長率) × (1 + 円安メリット)
└── 貿易収支 = 輸出 − 輸入


E：家計インパクト
├── CPI上昇 = インフレ率 + 円安コストプッシュ×0.3
├── 実質賃金伸び率 = 名目賃金上昇率 − CPI上昇
├── 貧困率 = 前年 × (1 + (CPI-賃金)差 × 感応度)
└── ジニ係数 = 前年 + (資産成長率 − 実質賃金伸び率) × 0.01`}</div>

      <h2 className="section-title">各変数の解説</h2>

      <Expander title="A：歳入の計算ロジック">
        <p><strong>税収：4区分に分解して個別の弾性値で推計</strong></p>
        <p>税目ごとに経済変数への感応度が異なるため、以下のように分解してシミュレーションしています：</p>
        <table>
          <thead>
            <tr><th>税目</th><th>計算式</th><th>弾性値</th><th>連動する経済変数</th></tr>
          </thead>
          <tbody>
            <tr><td>消費税</td><td>前年 × (1 + インフレ率 × 1.0)</td><td>1.0</td><td>物価上昇で消費税額が自動増加</td></tr>
            <tr><td>所得税</td><td>前年 × (1 + 名目成長率 × 1.4)</td><td>1.4</td><td>累進課税で所得増以上に税収増</td></tr>
            <tr><td>法人税</td><td>前年 × (1 + 実質成長率×2.0 + インフレ率×0.5) × 円安効果</td><td>≈2.0</td><td>企業利益は景気変動に敏感＋円安効果</td></tr>
            <tr><td>その他税</td><td>前年 × (1 + 名目成長率 × 0.8)</td><td>0.8</td><td>相続税・酒税等は比較的安定</td></tr>
          </tbody>
        </table>
        <ul style={{ marginTop: 8 }}>
          <li><strong>消費税</strong>：税率10%（軽減8%）が一定なので、消費額（≒物価水準）に比例。インフレ率に1:1で連動。</li>
          <li><strong>所得税</strong>：累進課税のため名目賃金の伸び以上に税収が増加。弾性値1.4は国際的にも標準的な仮定。</li>
          <li><strong>法人税</strong>：企業利益は実質GDPの変動に大きく左右される（弾性値2.0）。インフレによる名目利益増の効果は限定的（0.5）。<strong>円安時は輸出企業利益増（+30%×円安率）と輸入企業コスト増（−20%×円安率）のネットで調整。</strong></li>
          <li><strong>その他税</strong>：相続税・酒税・たばこ税・関税等。名目GDPに緩やかに連動（弾性値0.8）。</li>
        </ul>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>日銀納付金：max(保有国債 × 利回り − 当座預金 × 政策金利, 0)</strong></p>
        <p>日銀は保有する国債から利息収入を得る一方、金融機関から預かる当座預金に利息を支払います。この差額（利ざや）が日銀の利益となり、国庫に納付されます。</p>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>その他収入：基本その他収入 + 外貨準備評価益×0.1</strong></p>
        <p>円安が進行すると、政府が保有する外貨準備（約1.3兆ドル ≒ 180兆円）のドル建て資産の円換算額が増加し、評価益が発生します。この評価益の一部（10%）を歳入に計上しています。</p>
      </Expander>

      <Expander title="B：支出の計算ロジック">
        <p><strong>政策経費：前年 × (1 + インフレ率) + 自然増{p.naturalIncrease.toFixed(1)}兆円 + エネルギー補助金</strong></p>
        <p>社会保障・公共事業・教育・防衛等の歳出は、物価上昇に伴い名目額が膨らみます。さらに高齢化により年金・医療・介護の給付が毎年構造的に増加するため、自然増を加算しています。</p>
        <p style={{ marginTop: 8 }}><strong>エネルギー補助金</strong>：インフレ率に比例して自動的に増加する政策コスト。高インフレ時（特に円安による輸入物価高騰時）に燃料・電気代の家計負担を軽減する補助金として歳出を押し上げます。</p>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>平均クーポン：前年 × 8/9 + 市場金利 × 1/9（9年借換ロジック）</strong></p>
        <p>日本国債の平均残存期間は約9年です。毎年およそ全体の1/9が満期を迎え、その時点の市場金利で借り換えられます。残りの8/9は既発債のため金利は変わりません。</p>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>利払い費：債務残高 × 平均クーポン</strong></p>
        <p>国が発行している国債の元本（債務残高）に対して、加重平均の利率（平均クーポン）を掛けた金額が年間の利息支払い額です。</p>
      </Expander>

      <Expander title="C：収支・残高の計算ロジック">
        <p><strong>利払負担率：(利払い費 / 税収) × 100</strong></p>
        <p>税収に対する利払い費の比率を見ることで、「稼ぎのうちどれだけが借金の利息に消えるか」を示します。30%を警戒ラインとしているのは、過去に財政危機に陥った国々（ギリシャ、イタリア等）がこの水準前後で市場の信認を失った事例があるためです。</p>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>債務残高：前年残高 + (歳出 − 歳入)</strong></p>
        <p>財政赤字（歳出 {'>'} 歳入）が発生すると、その分だけ新たに国債を発行して資金を調達するため、債務残高が積み上がります。</p>
      </Expander>

      <Expander title="D：貿易収支と為替の影響">
        <p><strong>為替レートの変動メカニズム</strong></p>
        <p>為替レートは「円安進行率」パラメータに基づいて毎年変動します。円安が進行すると：</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li><strong>輸入物価の上昇</strong>：エネルギー・食料品等の輸入コストが増加し、CPIを押し上げます（コストプッシュ・インフレ）</li>
          <li><strong>輸出企業の利益増</strong>：ドル建ての売上が円換算で増加。法人税収にプラスの影響</li>
          <li><strong>貿易赤字の拡大</strong>：日本はエネルギー輸入国のため、円安では輸入額の増加が輸出増を上回りやすい</li>
        </ul>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>貿易の逆累進性</strong></p>
        <p>円安による物価上昇は、低所得者ほど重い負担を強います：</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>食料品・エネルギーなどの必需品は、消費に占める割合が低所得者ほど高い（エンゲル係数の逆累進性）</li>
          <li>円安の恩恵（資産の外貨評価増）は金融資産を持つ高所得者に集中</li>
          <li>結果として、円安は貧困率とジニ係数の両方を押し上げる「格差拡大要因」として機能</li>
        </ul>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>計算式と主要パラメータ</strong></p>
        <table>
          <thead>
            <tr><th>項目</th><th>計算式</th><th>解説</th></tr>
          </thead>
          <tbody>
            <tr><td>輸入額</td><td>前年 × (1+実質成長率) × (1+インフレ×円安係数)</td><td>円安で輸入物価が上昇</td></tr>
            <tr><td>輸出額</td><td>前年 × (1+世界成長率) × (1+円安メリット)</td><td>円安で価格競争力が向上</td></tr>
            <tr><td>貿易収支</td><td>輸出 − 輸入</td><td>マイナスは貿易赤字</td></tr>
            <tr><td>外貨準備評価益</td><td>外貨準備 × 円安進行率</td><td>ドル資産の円換算増</td></tr>
          </tbody>
        </table>
        <table style={{ marginTop: 12 }}>
          <thead>
            <tr><th>内部パラメータ</th><th>値</th><th>設定根拠</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>円安メリット係数（輸出）</td>
              <td>0.5</td>
              <td>円安率の50%が輸出競争力に反映。JETRO「日本の輸出構造分析」等で、為替10%変動に対する輸出数量の弾性値は0.3〜0.7と推計されており中央値を採用</td>
            </tr>
            <tr>
              <td>法人税への輸出利益効果</td>
              <td>0.3</td>
              <td>円安率の30%が輸出企業の利益増 → 法人税収増に貢献。上場企業の海外売上比率（約50〜60%）と為替感応度から推計</td>
            </tr>
            <tr>
              <td>法人税への輸入コスト効果</td>
              <td>0.2</td>
              <td>円安率の20%が輸入コスト増 → 法人税収減に作用。輸出利益（0.3）より小さいのは、全企業のうち輸入依存度の高い企業の割合がやや少ないため</td>
            </tr>
            <tr>
              <td>外貨準備評価益の歳入計上率</td>
              <td>10%</td>
              <td>評価益の全額を歳入に計上することは制度上できないため、実現益として計上可能な割合を保守的に10%と設定</td>
            </tr>
            <tr>
              <td>エネルギー補助金</td>
              <td>インフレ率 × 補助金率 × 10</td>
              <td>2022〜2023年の電気・ガス価格激変緩和対策（年間約3〜4兆円規模）を参考に、インフレ率に比例する構造</td>
            </tr>
          </tbody>
        </table>
      </Expander>

      <Expander title="E：家計インパクトの計算ロジック">
        <p><strong>実質賃金伸び率</strong></p>
        <p>実質賃金伸び率 = 名目賃金上昇率 − (インフレ率 + 円安コストプッシュ)</p>
        <p>インフレ（特に円安起因のコストプッシュ・インフレ）が賃金上昇を上回る場合、実質賃金が低下し、家計の購買力が減少します。</p>
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr><th>パラメータ</th><th>値</th><th>意味</th><th>設定根拠</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>円安コストプッシュ係数</td>
              <td>0.3</td>
              <td>円安率のうち30%がCPIに転嫁</td>
              <td>日銀「経済・物価情勢の展望」の為替パススルー率推計（短期0.1〜0.2、1年後0.2〜0.4）の中央値</td>
            </tr>
            <tr>
              <td>名目賃金上昇率</td>
              <td>サイドバーで設定</td>
              <td>春闘・労働市場の賃上げ率</td>
              <td>厚労省「毎月勤労統計」実績を参考に設定可能</td>
            </tr>
          </tbody>
        </table>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>貧困率モデル</strong></p>
        <p>貧困率 = 前年貧困率 × (1 + (CPI上昇率 − 賃金上昇率) × 感応度)</p>
        <p>CPI上昇がインフレ率 + 円安コストプッシュ（円安率×0.3）で計算されます。物価上昇が賃金を上回るほど、可処分所得が減り貧困層が拡大します。</p>
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr><th>パラメータ</th><th>値</th><th>設定根拠</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>感応度（悪化方向）</td>
              <td>0.5（デフォルト）</td>
              <td>物価と賃金の乖離1%ポイントにつき貧困率が0.5%悪化。OECD諸国の実証研究では、実質所得1%低下で相対的貧困率が0.3〜0.7%上昇とされ、中央値を採用</td>
            </tr>
            <tr>
              <td>改善速度（非対称係数）</td>
              <td>悪化の30%</td>
              <td>賃金が物価を上回っても、貧困率の改善は悪化速度の約30%にとどまる</td>
            </tr>
          </tbody>
        </table>
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 16px', marginTop: 12 }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>なぜ貧困率の改善は悪化より遅いのか？（非対称性の根拠）</p>
          <p style={{ fontSize: 13 }}>
            経済学では「下方硬直性」や「ラチェット効果」として知られる現象です。所得が低下すると家計は貯蓄の取り崩し・借入増加・生活水準の切り下げを余儀なくされますが、所得が回復しても以下の理由で元の水準に戻るには時間がかかります：
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 6, fontSize: 13 }}>
            <li><strong>負債の残存</strong>：所得悪化期に増えた借入金の返済が回復期の可処分所得を圧迫</li>
            <li><strong>人的資本の毀損</strong>：失業・就業時間減少による技能低下、再就職時の賃金ペナルティ</li>
            <li><strong>資産の非可逆的喪失</strong>：生活困窮時に売却した住宅・貯蓄は、所得回復後すぐには再構築できない</li>
            <li><strong>健康・教育への影響</strong>：貧困期に悪化した健康状態や子どもの教育機会損失は長期化</li>
          </ul>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
            参考：OECD "Under Pressure: The Squeezed Middle Class" (2019)、
            世界銀行 "Poverty and Shared Prosperity" (2022)、
            Friedman, M. "A Theory of the Consumption Function" (恒常所得仮説)
          </p>
          <p style={{ fontSize: 12, color: '#64748b' }}>
            厚生労働省「国民生活基礎調査」でも、リーマンショック後の貧困率悪化（15.7%→16.1%）に対し、景気回復後の改善は緩やかであった（16.1%→15.7%に約6年）ことが確認できます。
          </p>
        </div>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>ジニ係数モデル</strong></p>
        <p>ジニ係数 = 前年ジニ + (資産成長率 − 実質賃金伸び率) × 0.01</p>
        <p>「資産価格の伸び」と「労働所得の伸び」の差が格差を拡大させるモデルです。</p>
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr><th>パラメータ</th><th>値</th><th>設定根拠</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>資産成長率の円安係数</td>
              <td>0.5</td>
              <td>円安率の50%が株式・不動産・外貨資産の円建て評価額に反映。日経平均と為替の相関（直近10年で約0.4〜0.6）を参考</td>
            </tr>
            <tr>
              <td>ジニ係数変動係数</td>
              <td>0.01</td>
              <td>資産成長と賃金伸びの差1%ポイントにつき、ジニ係数が0.01変動。Piketty(2014)の「r {'>'} g」論に基づき、資本収益率が成長率を上回る場合に格差が拡大するメカニズムを簡略化</td>
            </tr>
          </tbody>
        </table>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>円安時は株式・不動産・外貨資産が増加するが、恩恵は資産を持つ高所得者に偏る</li>
          <li>一方、実質賃金の低下は低〜中所得者の生活を直撃する</li>
          <li>この「資産インフレ」と「賃金デフレ」の二極化が格差を構造的に拡大させる</li>
        </ul>
        <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginTop: 12 }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>主なパラメータの参考文献・データ出典</p>
          <ul style={{ paddingLeft: 20, fontSize: 12, color: '#64748b' }}>
            <li>為替パススルー率（0.3）：日本銀行「経済・物価情勢の展望」各号、内閣府「世界経済の潮流」</li>
            <li>貧困率感応度（0.5）：OECD "Society at a Glance"、厚生労働省「国民生活基礎調査」</li>
            <li>非対称性（0.3倍）：World Bank "Poverty and Shared Prosperity 2022"、恒常所得仮説（Friedman, 1957）</li>
            <li>資産成長と格差（r {'>'} g）：Thomas Piketty "Capital in the Twenty-First Century" (2014)</li>
            <li>為替と株価の相関（0.4〜0.6）：日本経済新聞「円安と株価の連動性分析」、Bloomberg統計</li>
            <li>ジニ係数推移：厚生労働省「所得再分配調査」、総務省「全国家計構造調査」</li>
          </ul>
        </div>
      </Expander>

      <h2 className="section-title" style={{ marginTop: 24 }}>統合政府の仕組み</h2>

      <Expander title="統合政府の資金フロー図（為替影響を含む）" defaultOpen={true}>
        <svg viewBox="0 0 700 570" style={{ width: '100%', maxWidth: 700, display: 'block', margin: '0 auto' }}>
          <defs>
            <marker id="ah-blue" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#3b82f6" />
            </marker>
            <marker id="ah-red" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#ef4444" />
            </marker>
            <marker id="ah-orange" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#f97316" />
            </marker>
            <marker id="ah-purple" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#8b5cf6" />
            </marker>
            <marker id="ah-green" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#22c55e" />
            </marker>
            <marker id="ah-teal" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#14b8a6" />
            </marker>
            <marker id="ah-amber" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#d97706" />
            </marker>
            <marker id="ah-rose" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#e11d48" />
            </marker>
            <filter id="shadow" x="-4%" y="-4%" width="108%" height="108%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
            </filter>
          </defs>

          <rect x="10" y="5" width="680" height="560" rx="12" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
          <text x="350" y="28" textAnchor="middle" fontSize="13" fill="#64748b" fontWeight="600">統合政府の資金フロー（為替影響を含む）</text>
          <rect x="215" y="15" width="270" height="355" rx="8" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.4" />
          <text x="350" y="50" textAnchor="middle" fontSize="10" fill="#3b82f6" opacity="0.7">統合政府</text>

          <rect x="250" y="60" width="200" height="56" rx="10" fill="#3b82f6" filter="url(#shadow)" />
          <text x="350" y="85" textAnchor="middle" fontSize="14" fill="white" fontWeight="700">日本政府（財務省）</text>
          <text x="350" y="103" textAnchor="middle" fontSize="10" fill="white" opacity="0.9">税収・歳出・国債発行を管理</text>

          <rect x="250" y="300" width="200" height="56" rx="10" fill="#8b5cf6" filter="url(#shadow)" />
          <text x="350" y="325" textAnchor="middle" fontSize="14" fill="white" fontWeight="700">日本銀行（BOJ）</text>
          <text x="350" y="343" textAnchor="middle" fontSize="10" fill="white" opacity="0.9">金融政策・国債保有・当座預金管理</text>

          <rect x="30" y="175" width="160" height="56" rx="10" fill="#475569" filter="url(#shadow)" />
          <text x="110" y="200" textAnchor="middle" fontSize="14" fill="white" fontWeight="700">国民・企業</text>
          <text x="110" y="218" textAnchor="middle" fontSize="10" fill="white" opacity="0.9">納税者・サービス受益者</text>

          <rect x="510" y="175" width="160" height="56" rx="10" fill="#059669" filter="url(#shadow)" />
          <text x="590" y="200" textAnchor="middle" fontSize="14" fill="white" fontWeight="700">金融機関</text>
          <text x="590" y="218" textAnchor="middle" fontSize="10" fill="white" opacity="0.9">国債購入・当座預金</text>

          <rect x="30" y="420" width="180" height="56" rx="10" fill="#b45309" filter="url(#shadow)" />
          <text x="120" y="445" textAnchor="middle" fontSize="14" fill="white" fontWeight="700">海外（世界経済）</text>
          <text x="120" y="463" textAnchor="middle" fontSize="10" fill="white" opacity="0.9">貿易相手国・為替市場</text>

          <rect x="280" y="420" width="120" height="40" rx="8" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5" />
          <text x="340" y="437" textAnchor="middle" fontSize="11" fill="#92400e" fontWeight="700">💱 為替レート</text>
          <text x="340" y="452" textAnchor="middle" fontSize="9" fill="#92400e">円安↑ / 円高↓</text>

          <line x1="180" y1="185" x2="248" y2="110" stroke="#3b82f6" strokeWidth="2.5" markerEnd="url(#ah-blue)" />
          <rect x="170" y="132" width="70" height="22" rx="4" fill="white" stroke="#3b82f6" strokeWidth="1" />
          <text x="205" y="147" textAnchor="middle" fontSize="10" fill="#3b82f6" fontWeight="600">税金納付</text>

          <line x1="248" y1="100" x2="180" y2="195" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#ah-red)" />
          <rect x="160" y="147" width="86" height="22" rx="4" fill="white" stroke="#ef4444" strokeWidth="1" />
          <text x="203" y="162" textAnchor="middle" fontSize="10" fill="#ef4444" fontWeight="600">公共サービス</text>

          <line x1="452" y1="95" x2="518" y2="180" stroke="#f97316" strokeWidth="2.5" markerEnd="url(#ah-orange)" />
          <rect x="455" y="122" width="88" height="22" rx="4" fill="white" stroke="#f97316" strokeWidth="1" />
          <text x="499" y="137" textAnchor="middle" fontSize="10" fill="#f97316" fontWeight="600">国債発行💴</text>

          <line x1="520" y1="230" x2="455" y2="305" stroke="#14b8a6" strokeWidth="2.5" markerEnd="url(#ah-teal)" />
          <rect x="457" y="257" width="90" height="22" rx="4" fill="white" stroke="#14b8a6" strokeWidth="1" />
          <text x="502" y="272" textAnchor="middle" fontSize="10" fill="#14b8a6" fontWeight="600">国債売却📉</text>

          <line x1="455" y1="315" x2="520" y2="220" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5 3" markerEnd="url(#ah-purple)" />

          <line x1="350" y1="298" x2="350" y2="118" stroke="#22c55e" strokeWidth="2.5" markerEnd="url(#ah-green)" />
          <rect x="360" y="195" width="90" height="22" rx="4" fill="white" stroke="#22c55e" strokeWidth="1" />
          <text x="405" y="210" textAnchor="middle" fontSize="10" fill="#22c55e" fontWeight="600">国庫納付金</text>

          <line x1="560" y1="233" x2="490" y2="298" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5 3" />
          <rect x="492" y="242" width="86" height="22" rx="4" fill="white" stroke="#8b5cf6" strokeWidth="1" />
          <text x="535" y="257" textAnchor="middle" fontSize="10" fill="#8b5cf6" fontWeight="600">当座預金💰</text>

          <line x1="70" y1="233" x2="70" y2="418" stroke="#d97706" strokeWidth="2.5" markerEnd="url(#ah-amber)" />
          <rect x="17" y="295" width="56" height="22" rx="4" fill="white" stroke="#d97706" strokeWidth="1" />
          <text x="45" y="310" textAnchor="middle" fontSize="10" fill="#d97706" fontWeight="600">輸出📦</text>

          <line x1="150" y1="418" x2="150" y2="233" stroke="#e11d48" strokeWidth="2.5" markerEnd="url(#ah-rose)" />
          <rect x="120" y="295" width="68" height="22" rx="4" fill="white" stroke="#e11d48" strokeWidth="1" />
          <text x="154" y="310" textAnchor="middle" fontSize="10" fill="#e11d48" fontWeight="600">輸入🛢️</text>

          <text x="35" y="345" fontSize="9" fill="#d97706" fontWeight="600">円安→輸出増</text>
          <text x="120" y="345" fontSize="9" fill="#e11d48" fontWeight="600">円安→輸入高</text>

          <path d="M 212 440 Q 260 410 280 440" fill="none" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4 2" markerEnd="url(#ah-amber)" />

          <path d="M 220 420 C 240 390 248 200 250 116" fill="none" stroke="#e11d48" strokeWidth="2" strokeDasharray="5 3" markerEnd="url(#ah-rose)" />
          <rect x="215" y="375" width="130" height="22" rx="4" fill="#fff1f2" stroke="#e11d48" strokeWidth="1" />
          <text x="280" y="390" textAnchor="middle" fontSize="9" fill="#e11d48" fontWeight="600">円安→法人税↑・補助金↑</text>

          <text x="35" y="360" fontSize="8" fill="#e11d48">コストプッシュ</text>
          <text x="35" y="370" fontSize="8" fill="#e11d48">→CPI↑→実質賃金↓</text>

          <path d="M 450 110 C 490 110 540 300 530 400 C 525 430 480 455 402 448" fill="none" stroke="#d97706" strokeWidth="2" strokeDasharray="5 3" markerEnd="url(#ah-amber)" />
          <rect x="500" y="340" width="130" height="22" rx="4" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
          <text x="565" y="355" textAnchor="middle" fontSize="9" fill="#92400e" fontWeight="600">外貨準備評価益→歳入</text>

          <rect x="250" y="485" width="400" height="36" rx="6" fill="#fffbeb" stroke="#d97706" strokeWidth="1" opacity="0.8" />
          <text x="270" y="500" fontSize="9" fill="#92400e" fontWeight="600">為替影響まとめ：</text>
          <text x="270" y="513" fontSize="8.5" fill="#64748b">円安 → 輸出企業利益↑(法人税↑) / 輸入コスト↑(CPI↑・補助金↑) / 外貨準備評価益↑(歳入↑)</text>

          <g transform="translate(20, 525)">
            <circle cx="8" cy="6" r="4" fill="#3b82f6" /><text x="16" y="10" fontSize="9" fill="#475569">税金</text>
            <circle cx="52" cy="6" r="4" fill="#ef4444" /><text x="60" y="10" fontSize="9" fill="#475569">公共サービス</text>
            <circle cx="134" cy="6" r="4" fill="#f97316" /><text x="142" y="10" fontSize="9" fill="#475569">国債発行</text>
            <circle cx="206" cy="6" r="4" fill="#14b8a6" /><text x="214" y="10" fontSize="9" fill="#475569">国債売却</text>
            <circle cx="268" cy="6" r="4" fill="#22c55e" /><text x="276" y="10" fontSize="9" fill="#475569">納付金</text>
            <circle cx="326" cy="6" r="4" fill="#8b5cf6" /><text x="334" y="10" fontSize="9" fill="#475569">当座預金</text>
            <circle cx="388" cy="6" r="4" fill="#d97706" /><text x="396" y="10" fontSize="9" fill="#475569">輸出</text>
            <circle cx="428" cy="6" r="4" fill="#e11d48" /><text x="436" y="10" fontSize="9" fill="#475569">輸入</text>
            <line x1="470" y1="6" x2="500" y2="6" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="5 3" />
            <text x="505" y="10" fontSize="9" fill="#e11d48">為替フィードバック</text>
            <line x1="596" y1="6" x2="626" y2="6" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6 3" />
            <text x="631" y="10" fontSize="9" fill="#3b82f6">統合政府</text>
          </g>
        </svg>
      </Expander>

      <Expander title="日銀納付金の計算構造">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: '日銀損益', 利息収入: bojRevVal, 付利コスト: -bojCostVal }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="兆円" />
                <Tooltip />
                <Legend />
                <Bar dataKey="利息収入" fill="#22c55e" />
                <Bar dataKey="付利コスト" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div className="boj-calc">
              <p><strong>利息収入（国債保有から）</strong></p>
              <div className="boj-calc-row">
                <span>保有国債（＝債務残高）</span>
                <span>{p.initDebt.toFixed(0)} 兆円</span>
              </div>
              <div className="boj-calc-row">
                <span>保有国債利回り</span>
                <span>{p.bojYield.toFixed(2)}%</span>
              </div>
              <div className="boj-calc-row">
                <span>利息収入</span>
                <span><strong>{bojRevVal.toFixed(1)} 兆円</strong></span>
              </div>
              <hr style={{ margin: '8px 0', borderColor: '#e2e8f0' }} />
              <p><strong>付利コスト（当座預金への利払い）</strong></p>
              <div className="boj-calc-row">
                <span>当座預金残高</span>
                <span>{p.bojCA.toFixed(0)} 兆円</span>
              </div>
              <div className="boj-calc-row">
                <span>政策金利</span>
                <span>{policyRate.toFixed(2)}%</span>
              </div>
              <div className="boj-calc-row">
                <span>付利コスト</span>
                <span><strong>{bojCostVal.toFixed(1)} 兆円</strong></span>
              </div>
              <div className="boj-calc-row total">
                <span>国庫納付金</span>
                <span style={{ color: '#22c55e' }}><strong>{bojProfit.toFixed(1)} 兆円</strong></span>
              </div>
            </div>
          </div>
        </div>
      </Expander>

      <Expander title="金利感応度分析">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={sensitivityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="市場金利" tick={{ fontSize: 11 }} unit="%" />
            <YAxis tick={{ fontSize: 11 }} unit="兆円" />
            <Tooltip />
            <Legend />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="日銀納付金" stroke="#22c55e" strokeWidth={2} />
            <Line type="monotone" dataKey="利払い費" stroke="#ef4444" strokeWidth={2} />
            <Line type="monotone" dataKey="ネット効果" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
        <div className="prose" style={{ marginTop: 12 }}>
          <p><strong>ポイント：統合政府で見ると金利上昇の影響は相殺される？</strong></p>
          <p>一見すると、金利が上がれば政府の利払い費は増加しますが、日銀の保有国債からの利息収入も増えるため、統合政府としては相殺されるように見えます。しかし実際には：</p>
          <ol style={{ paddingLeft: 20, marginTop: 8 }}>
            <li><strong>タイムラグ</strong>：利払い費は9年借換ロジックで徐々に上昇するが、日銀の保有国債利回りはさらに遅れて上昇</li>
            <li><strong>逆ざや問題</strong>：金利上昇初期は当座預金への付利コストが先に増え、日銀が赤字に陥る</li>
            <li><strong>国債保有比率</strong>：日銀が全国債を保有しているわけではないため、完全な相殺にはならない</li>
            <li><strong>信認リスク</strong>：金利が急騰する場合、国債市場の信認低下が同時に発生し、さらなる金利上昇を招く悪循環</li>
          </ol>
        </div>
      </Expander>

      <h2 className="section-title" style={{ marginTop: 24 }}>ウォーターフォール分析</h2>

      <div className="year-slider-container">
        <div className="slider-header">
          <label>分析する年度</label>
          <span className="slider-value">{wfYear}年度</span>
        </div>
        <input
          type="range"
          min={allYears[0]}
          max={allYears[allYears.length - 1]}
          value={wfYear}
          onChange={e => setWfYear(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
        <div className="year-slider-label">
          <span>{allYears[0]}</span>
          <span>{allYears[allYears.length - 1]}</span>
        </div>
      </div>

      {wfData && (
        <>
          {wfData.isActual && (
            <div className="info-box">
              📊 {wfYear}年度は実績データです（出典：財務省・日本銀行）
            </div>
          )}
          <WaterfallChart data={wfData.d} otherRev={wfData.otherRev} isActual={wfData.isActual} year={wfYear} />
          <div className="metrics-row">
            <div className="metric-card">
              <div className="metric-label">歳入合計</div>
              <div className="metric-value">{wfData.d.totalRevenue.toFixed(1)} 兆円</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">歳出合計</div>
              <div className="metric-value">{wfData.d.totalCost.toFixed(1)} 兆円</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">財政収支</div>
              <div className="metric-value">{wfData.d.fiscalBalance.toFixed(1)} 兆円</div>
              <div className={`metric-delta ${wfData.d.fiscalBalance >= 0 ? 'positive' : 'negative'}`}>
                {wfData.d.fiscalBalance >= 0 ? '黒字' : '赤字'}
              </div>
            </div>
          </div>
          <div className="metrics-row">
            <div className="metric-card">
              <div className="metric-label">税収</div>
              <div className="metric-value">{wfData.d.tax.toFixed(1)} 兆円</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">利払い費</div>
              <div className="metric-value">{wfData.d.interest.toFixed(1)} 兆円</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">利払負担率</div>
              <div className="metric-value">{wfData.d.interestBurden.toFixed(1)}%</div>
              <div className={`metric-delta ${wfData.d.interestBurden > 30 ? 'negative' : 'positive'}`}>
                {wfData.d.interestBurden > 30 ? '危険' : '正常'}
              </div>
            </div>
          </div>
        </>
      )}

      <h2 className="section-title" style={{ marginTop: 24 }}>データ出典</h2>
      <ul className="source-list">
        {dataSources.map((src, i) => (
          <li key={i}>
            <a href={src.url} target="_blank" rel="noopener noreferrer">{src.name}</a>
            {' '}({src.desc})
          </li>
        ))}
      </ul>
    </div>
  )
}

function WaterfallChart({ data, otherRev, isActual, year }: {
  data: SimResult | ActualDataPoint;
  otherRev: number;
  isActual: boolean;
  year: number;
}) {
  const items = [
    { label: '消費税', value: data.taxConsumption, type: 'income' as const },
    { label: '所得税', value: data.taxIncome, type: 'income' as const },
    { label: '法人税', value: data.taxCorporate, type: 'income' as const },
    { label: 'その他税', value: data.taxOther, type: 'income' as const },
    { label: '税収計', value: data.tax, type: 'subtotal' as const },
    { label: '日銀納付金', value: data.bojPayment, type: 'income' as const },
    { label: 'その他', value: otherRev, type: 'income' as const },
    { label: '歳入合計', value: data.totalRevenue, type: 'total' as const },
    { label: '政策経費', value: -data.policyExp, type: 'expense' as const },
    { label: '利払い費', value: -data.interest, type: 'expense' as const },
    { label: '歳出合計', value: -data.totalCost, type: 'exptotal' as const },
    { label: '財政収支', value: data.fiscalBalance, type: 'result' as const },
  ]

  const wfChartData = useMemo(() => {
    let runningTotal = 0;
    let expenseStart = 0;
    return items.map((item) => {
      if (item.type === 'subtotal' || item.type === 'total') {
        const val = item.value;
        return {
          name: item.label,
          base: val >= 0 ? 0 : val,
          value: Math.abs(val),
          rawValue: val,
          type: item.type,
        };
      }
      if (item.type === 'result') {
        const val = item.value;
        return {
          name: item.label,
          base: val >= 0 ? 0 : val,
          value: Math.abs(val),
          rawValue: val,
          type: item.type,
        };
      }
      if (item.type === 'exptotal') {
        const val = item.value;
        const absVal = Math.abs(val);
        return {
          name: item.label,
          base: expenseStart - absVal,
          value: absVal,
          rawValue: val,
          type: item.type,
        };
      }
      const start = runningTotal;
      runningTotal += item.value;
      if (item.type === 'expense' && expenseStart === 0) {
        expenseStart = start;
      }
      if (item.value >= 0) {
        return {
          name: item.label,
          base: start,
          value: item.value,
          rawValue: item.value,
          type: item.type,
        };
      } else {
        return {
          name: item.label,
          base: start + item.value,
          value: -item.value,
          rawValue: item.value,
          type: item.type,
        };
      }
    });
  }, [data, otherRev]);

  const wfLabel = isActual ? '実績' : 'シミュレーション'

  const getColor = (type: string, rawValue: number) => {
    if (type === 'total' || type === 'subtotal' || type === 'exptotal') return '#334155';
    if (type === 'result') return rawValue >= 0 ? '#22c55e' : '#ef4444';
    if (type === 'expense') return '#ef4444';
    if (isActual) return '#64748b';
    return '#3b82f6';
  };

  return (
    <div className="chart-container">
      <div className="chart-title">{year}年度 収支ウォーターフォール（{wfLabel}）</div>
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={wfChartData} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10, angle: -30 }} height={50} interval={0} />
          <YAxis tick={{ fontSize: 11 }} unit="兆円" />
          <Tooltip
            formatter={(value: number, name: string, props: { payload: { rawValue: number } }) => {
              if (name === 'base') return [null, null];
              return [`${props.payload.rawValue >= 0 ? '+' : ''}${props.payload.rawValue.toFixed(1)} 兆円`, props.payload.name];
            }}
          />
          <Bar dataKey="base" stackId="a" fill="transparent" />
          <Bar dataKey="value" stackId="a" radius={[2, 2, 0, 0]}>
            {wfChartData.map((entry, index) => (
              <Cell key={index} fill={getColor(entry.type, entry.rawValue)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
