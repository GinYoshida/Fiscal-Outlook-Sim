import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts'
import type { SimResult } from './simulation'
import type { ActualDataPoint, SimParams, DataSource } from './data'
import { ACTUAL_DATA } from './data'
import FlowDiagram from './svg/FlowDiagram'

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

function TreeSection({ title, tree, children }: { title: string; tree: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: 2 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0' }}
      >
        <span style={{ fontSize: 13, color: '#3b82f6', fontWeight: 700, transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{title}</span>
      </div>
      <div className="code-block" style={{ marginLeft: 20, marginBottom: open ? 0 : 8, fontSize: 12.5 }}>{tree}</div>
      {open && (
        <div style={{ marginLeft: 20, marginTop: 8, marginBottom: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export function ExplanationTab({ params, simData, actualData, dataSources }: Props) {
  const p = params
  const nominalG = p.inflationRate + p.realGrowth
  const marketRate = nominalG + p.riskPremium
  const policyRate = Math.max(marketRate / 100 - p.policyRateSpread / 100, 0) * 100

  const bojRevVal = p.initBojJGB * (p.bojYield / 100)
  const bojCostVal = p.bojCA * (policyRate / 100)
  const bojNetIncome = bojRevVal - bojCostVal
  const bojProfit = bojNetIncome

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
      const bojP = p.initBojJGB * (p.bojYield / 100) - p.bojCA * pr
      const intC = p.initDebt * rate / 100
      return {
        市場金利: rate,
        '日銀純利益': parseFloat(bojP.toFixed(1)),
        利払い費: parseFloat(intC.toFixed(1)),
        'ネット効果': parseFloat((bojP - intC).toFixed(1)),
      }
    })
  }, [p])

  return (
    <div>
      <div className="sidebar-guide">
        <h3 className="sidebar-guide-title">サイドバーの使い方</h3>
        <div className="sidebar-guide-content">
          <div className="sidebar-guide-item">
            <span className="sidebar-guide-icon">📊</span>
            <div>
              <strong>シナリオ選択</strong> — 10種類のプリセットシナリオから選択できます。パラメータが自動で切り替わります。
            </div>
          </div>
          <div className="sidebar-guide-item">
            <span className="sidebar-guide-icon">🎚️</span>
            <div>
              <strong>パラメータ調整</strong> — スライダーまたは数値入力欄で値を変更できます。各パラメータの[?]マークで詳しい説明を確認できます。
            </div>
          </div>
          <div className="sidebar-guide-item">
            <span className="sidebar-guide-icon">📐</span>
            <div>
              <strong>構成</strong> — 上段に調整パラメータ、下段に2026年の初期値、最後に最適化ツールが配置されています。
            </div>
          </div>
          <div className="sidebar-guide-item">
            <span className="sidebar-guide-icon">🔍</span>
            <div>
              <strong>検索</strong> — 検索ボックスでパラメータ名をフィルタリングして素早く見つけられます。
            </div>
          </div>
        </div>
      </div>

      <h2 className="section-title">統合政府の仕組み</h2>

      <Expander title="統合政府の資金フロー図（家計・為替影響を含む）" defaultOpen={true}>
        <FlowDiagram />
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
                <span>保有国債</span>
                <span>{p.initBojJGB.toFixed(0)} 兆円</span>
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
                <span>日銀純利益</span>
                <span style={{ color: bojNetIncome >= 0 ? '#22c55e' : '#ef4444' }}><strong>{bojNetIncome.toFixed(1)} 兆円</strong></span>
              </div>
              {bojNetIncome < 0 && (
                <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
                  逆ザヤ：累積損失が自己資本バッファ（{p.bojCapitalBuffer}兆円）を超えると歳入を減少させます
                </div>
              )}
            </div>
          </div>
        </div>
      </Expander>

      <Expander title="金利感応度分析">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={sensitivityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="市場金利" tick={{ fontSize: 11 }} unit="%" />
            <YAxis tick={{ fontSize: 11 }} unit="兆円" />
            <Tooltip />
            <Legend />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Bar dataKey="日銀純利益" fill="#22c55e" />
            <Bar dataKey="利払い費" fill="#ef4444" />
            <Bar dataKey="ネット効果" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
        <div className="prose" style={{ marginTop: 12 }}>
          <p><strong>ポイント：統合政府で見ると金利上昇の影響は相殺される？</strong></p>
          <p>上図は各金利水準での日銀純利益（逆ザヤ時はマイナス）を示しています。累積損失が自己資本バッファ（{p.bojCapitalBuffer}兆円）を超えた場合、マイナスの純利益が統合政府の歳入を直接減少させます。</p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '8px 0' }}>
            自己資本バッファ {p.bojCapitalBuffer}兆円の根拠（2024年度決算ベース）：資本金 0.001兆円 + 法定準備金 約3.5兆円 + 債券取引損失引当金 約8.6兆円 ≒ 約12兆円。この範囲内であれば逆ザヤの損失を吸収でき、納付金はゼロで下げ止まります。バッファを超過した損失は統合政府の歳入を直接圧迫します。
          </p>
          <p>一見すると、金利が上がれば政府の利払い費は増加しますが、日銀の保有国債からの利息収入も増えるため、統合政府としては相殺されるように見えます。しかし実際には：</p>
          <ol style={{ paddingLeft: 20, marginTop: 8 }}>
            <li><strong>タイムラグ</strong>：利払い費は9年借換ロジックで徐々に上昇するが、日銀の保有国債利回りはさらに遅れて上昇</li>
            <li><strong>逆ざや問題</strong>：金利上昇初期は当座預金への付利コストが先に増え、日銀が赤字に陥る</li>
            <li><strong>国債保有比率</strong>：日銀が全国債を保有しているわけではないため、完全な相殺にはならない</li>
            <li><strong>信認リスク</strong>：金利が急騰する場合、国債市場の信認低下が同時に発生し、さらなる金利上昇を招く悪循環</li>
          </ol>
        </div>
      </Expander>

      <h2 className="section-title" style={{ marginTop: 24 }}>シミュレーション最終年、私たちの子供たちが生きる「残り香」を計算する</h2>
      <div className="prose">
        <p>
          「借金はいくらでもできる」「過去が大丈夫だったから次も大丈夫」――。
          こうした原則を無視した楽観論の陰で、いま7歳の子供が社会の中核を担うシミュレーション最終年、
          彼らが受け取るバトンはどれほど重くなっているでしょうか？
        </p>
        <p style={{ marginTop: 12 }}>
          財政赤字が膨らみ、利払い費が予算を侵食していくとき、真っ先に削られるのは
          <strong>「教育費」や「社会保障」といった未来への投資</strong>です。
          このシミュレーターは、親としての切実な危機感に基づき、感情論を排して
          「統合政府PL」と「家計の貧困率」という冷徹な数値で、
          次世代の選択肢がどれほど奪われるのかを可視化します。
        </p>
        <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 8, padding: '12px 16px', marginTop: 16 }}>
          <p style={{ fontWeight: 700, color: '#92400e', marginBottom: 6 }}>原則への回帰</p>
          <p style={{ fontSize: 13, color: '#78350f' }}>
            低金利は「砂時計の砂」であり、経常収支は「国家の防衛ライン」です。
            例外論に逃げず、数学的な原則に基づいたシミュレーションを行うことが、
            子供たちの未来を直視する第一歩になると信じています。
          </p>
        </div>
        <p style={{ marginTop: 16 }}>
          <strong>なぜ統合政府で見るのか？</strong>
        </p>
        <p>
          日銀は国債を大量に保有しており、政府が支払う利息の一部は日銀を通じて国庫に戻ります。
          この「日銀納付金」の存在を無視すると、政府の財政負担を過大に見積もることになります。
          統合政府として分析することで、より現実的な財政の姿を把握できます。
        </p>
        <p style={{ marginTop: 12 }}>
          <strong>このシミュレーターでわかること</strong>
        </p>
        <ul style={{ paddingLeft: 20, marginTop: 4 }}>
          <li>金利上昇が財政に与える影響と日銀納付金による相殺効果</li>
          <li>税収構造の変化（消費税・所得税・法人税・その他の連動）</li>
          <li>円安が法人税・輸入コスト・エネルギー補助金に与える波及効果</li>
          <li>為替変動 → 貿易収支 → 家計（実質賃金・CPI）への影響チェーン</li>
          <li>利払い費が教育・社会保障を圧迫する過程の可視化</li>
          <li>貧困率・ジニ係数の長期推移（格差拡大リスクの可視化）</li>
          <li>子供の年齢に連動した「いつ何が起きるか」のタイムライン</li>
        </ul>
      </div>

      <h2 className="section-title" style={{ marginTop: 24 }}>計算ロジックの全体像</h2>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>各セクションをクリックすると詳細な解説が展開されます。</p>

      <TreeSection title="A：歳入合計 = 税収合計 + 日銀納付金 + その他収入" tree={`├── 税収合計 = 消費税 + 所得税 + 法人税 + その他税
│   ├── 消費税 = 前年消費税 × (1 + インフレ率 × 1.0)
│   │   ├── ※税率変更年度に (新税率/10) を乗じて水準調整
│   │   └── ※税率変更→CPI上昇: (新税率-10)/110 × 40%パススルー
│   ├── 所得税 = 前年 × (1 + (名目成長率×0.5 + 賃金上昇率×0.5) × 1.4)
│   │   └── 内生賃金モデルの結果を50%反映（ブラケットクリープ）
│   ├── 法人税 = 前年法人税 × (1 + 実質成長率×2.0 + インフレ率×0.5)
│   │   └── ※円安効果: × (1 + 輸出利益 − 輸入コスト)
│   └── その他税 = 前年その他税 × (1 + 名目成長率 × 0.8)
│
├── 日銀納付金（統合政府への反映額）
│   ├── 日銀純利益 = 保有国債×保有利回り − 当座預金×政策金利
│   ├── 保有利回り = (前年×8/9) + (市場金利×1/9)  ← 9年借換ロジック
│   ├── QT: 保有国債・当座預金が毎年QT縮小額ずつ減少（下限あり）
│   ├── 累積損失 > 自己資本バッファ → マイナスが歳入を直接減少
│   └── 累積損失 ≤ バッファ → max(純利益, 0)で損失を吸収
│
└── その他収入 = 基本その他収入 + 外貨準備評価益×0.1`}>
        <p><strong>税収：4区分に分解して個別の弾性値で推計</strong></p>
        <p>税目ごとに経済変数への感応度が異なるため、以下のように分解してシミュレーションしています：</p>
        <table>
          <thead>
            <tr><th>税目</th><th>計算式</th><th>弾性値</th><th>連動する経済変数</th></tr>
          </thead>
          <tbody>
            <tr><td>消費税</td><td>前年 × (1 + インフレ率 × 1.0)</td><td>1.0</td><td>物価上昇で消費税額が自動増加</td></tr>
            <tr><td>所得税</td><td>前年 × (1 + (名目成長×0.5+賃金×0.5) × 1.4)</td><td>1.4</td><td>内生賃金＋累進課税で税収増</td></tr>
            <tr><td>法人税</td><td>前年 × (1 + 実質成長率×2.0 + インフレ率×0.5) × 円安効果</td><td>≈2.0</td><td>企業利益は景気変動に敏感＋円安効果</td></tr>
            <tr><td>その他税</td><td>前年 × (1 + 名目成長率 × 0.8)</td><td>0.8</td><td>相続税・酒税等は比較的安定</td></tr>
          </tbody>
        </table>
        <ul style={{ marginTop: 8 }}>
          <li><strong>消費税</strong>：税率10%（軽減8%）が一定なので、消費額（≒物価水準）に比例。インフレ率に1:1で連動。<strong>税率変更時はCPIにも約40%パススルー（5%増税→約1.8%CPI上昇）</strong>し、家計負担・貧困率・エネルギー補助金に波及します。</li>
          <li><strong>所得税</strong>：内生賃金モデル（生産性分配率×実質成長 + インフレ転嫁率×インフレ）の結果を50%反映し、残り50%を名目成長率で補完。累進課税による弾性値1.4で、賃金の伸び以上に税収が増加します。生産性分配率が低いと賃金が抑制され、所得税の伸びも鈍化します。</li>
          <li><strong>法人税</strong>：企業利益は実質GDPの変動に大きく左右される（弾性値2.0）。インフレによる名目利益増の効果は限定的（0.5）。<strong>円安時は輸出企業利益増（+30%×円安率）と輸入企業コスト増（−20%×円安率）のネットで調整。</strong></li>
          <li><strong>その他税</strong>：相続税・酒税・たばこ税・関税等。名目GDPに緩やかに連動（弾性値0.8）。</li>
        </ul>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>日銀納付金（QT・利回り追随対応）</strong></p>
        <p>日銀純利益 = 保有国債 × 保有利回り − 当座預金 × 政策金利</p>
        <p><strong>保有利回りの追随</strong>：日銀保有国債の利回りは政府債務と同様に9年借換ロジックで市場金利に追随します（毎年1/9ずつ新金利に置換）。金利上昇局面では徐々に収入が改善されます。</p>
        <p><strong>量的引き締め（QT）</strong>：保有国債と当座預金が毎年{p.bojQTRate}兆円ずつ減少します（当座預金下限: {p.bojCAFloor}兆円）。QTにより逆ザヤのスケールが縮小し、日銀損失リスクが軽減されます。</p>
        <p>純利益がマイナス（逆ザヤ）の場合、損失は累積されます。累積損失が自己資本バッファ（引当金・準備金 約{p.bojCapitalBuffer}兆円）を超えると、マイナスの納付金が統合政府の歳入を直接減少させます。バッファ内であれば損失は吸収され、納付金はゼロで下げ止まります。</p>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>その他収入：基本その他収入 + 外貨準備評価益×0.1</strong></p>
        <p>円安が進行すると、政府が保有する外貨準備（約1.3兆ドル ≒ 180兆円）のドル建て資産の円換算額が増加し、評価益が発生します。この評価益の一部（10%）を歳入に計上しています。</p>
      </TreeSection>

      <TreeSection title="B：支出合計 = 政策経費 + 利払い費" tree={`├── 政策経費 = 各分野別歳出合計 + エネルギー補助金
│   └── エネルギー補助金 = ベース額 × 補助金率 × エネルギーコスト指数
│       └── エネルギーコスト指数 = (1+CPI上昇率) × (1+max(円安率,0)×0.5)
│
└── 利払い費 = 前年債務残高 × 平均クーポン
    └── 平均クーポン = 前年クーポン × (1-新発比率) + 市場金利 × 新発比率
        └── 新発比率 = min(1/9 + 前年赤字国債/前年残高, 0.3)`}>
        <p><strong>政策経費：各分野別歳出の合計 + エネルギー補助金</strong></p>
        <p>社会保障・公共事業・教育・防衛等の歳出は、物価上昇に伴い名目額が膨らみます。さらに高齢化により年金・医療・介護の給付が毎年構造的に増加するため、自然増を加算しています。</p>
        <p style={{ marginTop: 8 }}><strong>エネルギー補助金（動的モデル）</strong>：CPI上昇率と為替変動率に連動して動的に変化します。エネルギーコスト指数 = (1 + CPI上昇率) × (1 + max(円安率, 0) × 0.5) で計算され、物価上昇や円安が進むほど補助金額が自動的に増加します。これにより、スタグフレーションや急激円安シナリオでは歳出を大きく押し上げる一方、家計の実効CPI（体感物価）と光熱費負担を軽減します。</p>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>平均クーポン：前年 × (1-新発比率) + 市場金利 × 新発比率</strong></p>
        <p>日本国債の平均残存期間は約9年です。毎年およそ全体の1/9が満期を迎え、その時点の市場金利で借り換えられます。<strong>さらに、財政赤字による新規国債発行分も市場金利で発行されるため</strong>、新発比率 = 借換分(1/9) + 赤字国債分(前年発行額/前年残高) となります（上限30%）。財政赤字が大きいほど平均クーポンが早く市場金利に収束し、利払い費の上昇を加速させます。</p>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>利払い費：債務残高 × 平均クーポン</strong></p>
        <p>国が発行している国債の元本（債務残高）に対して、加重平均の利率（平均クーポン）を掛けた金額が年間の利息支払い額です。</p>
      </TreeSection>

      <TreeSection title="C：収支・残高・内生金利" tree={`├── 実効市場金利 = 名目成長率 + ベースリスクP + 財政リスクP + 通貨リスクP
│   ├── 財政リスクP = max(0, (利払負担率 − 閾値) × 感応度 / 100)
│   │   └── 前年の利払負担率を使用（循環依存回避）
│   └── 通貨リスクP = 経常赤字・NFA悪化時に自動加算 × 加速係数(悪化連続で増大)
├── 平均クーポン = 前年×(1-新発比率) + 市場金利×新発比率
│   └── 新発比率 = min(1/9 + 赤字国債/残高, 0.3) ← 借換+新発
├── 利払い費 = 債務残高 × 平均クーポン
├── 財政収支 = 歳入合計 − 支出合計
├── 債務残高 = 前年債務残高 + (支出合計 − 歳入合計)
├── 国債発行額 = max(支出合計 − 歳入合計, 0)
└── 利払負担率 = (利払い費 ÷ 税収合計) × 100`}>
        <p><strong>内生的金利メカニズム</strong></p>
        <p>市場金利は外生パラメータ（ベースリスクプレミアム）に加え、前年の財政状態に応じて自動加算される「財政リスクプレミアム」を含みます。利払負担率が閾値（{p.interestBurdenThreshold}%）を超えると、超過分に感応度（{p.fiscalRiskSensitivity}）を乗じたプレミアムが金利に上乗せされます。前年の値を使用することで循環依存を回避しています。</p>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>利払負担率：(利払い費 / 税収) × 100</strong></p>
        <p>税収に対する利払い費の比率を見ることで、「稼ぎのうちどれだけが借金の利息に消えるか」を示します。30%を警戒ラインとしているのは、過去に財政危機に陥った国々（ギリシャ、イタリア等）がこの水準前後で市場の信認を失った事例があるためです。</p>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>債務残高：前年残高 + (歳出 − 歳入)</strong></p>
        <p>財政赤字（歳出 {'>'} 歳入）が発生すると、その分だけ新たに国債を発行して資金を調達するため、債務残高が積み上がります。</p>
      </TreeSection>

      <TreeSection title="D：貿易収支・内生為替モデル" tree={`├── 内生為替変動率 = バイアス + α×(海外金利−国内金利) + β×(国内CPI−海外CPI) + γ×リスクP
│   ├── α = 0.5（金利差感応度：金利差→資本フロー→為替）
│   ├── β = 0.3（購買力平価感応度：インフレ差→実質為替）
│   └── γ = 0.5（リスクプレミアム感応度：信認低下→円安）
├── 為替レート = 前年レート × (1 + 内生変動率)
├── 輸入額 = 前年 × (1+実質成長率) × (1+インフレ率) × (1+為替パススルー70%)
├── 輸出額 = 前年 × (1+世界成長率) × (1+円安弾性値15%)
├── 所得収支 = 実質NFA × 3% × (1+円安×0.5)
└── 経常収支 = 貿易収支 + 所得収支`}>
        <p><strong>内生的為替決定モデル</strong></p>
        <p>為替レートは金利差・インフレ差・リスクプレミアムの3要因から内生的に決定されます：</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li><strong>金利差チャネル（α=0.5）</strong>：海外金利が日本の実効金利を上回ると、資本が海外に流出し円安圧力が発生。逆に日本が高金利なら円高方向に作用します。</li>
          <li><strong>購買力平価チャネル（β=0.3）</strong>：日本のインフレ率が海外を上回ると、購買力平価の調整メカニズムにより円安方向に動きます。</li>
          <li><strong>リスクプレミアムチャネル（γ=0.5）</strong>：経常赤字の累積やNFA悪化で通貨リスクプレミアムが発生すると、追加的な円安圧力が加わります。</li>
          <li><strong>為替バイアス</strong>：上記3要因では説明できない構造的な円安・円高傾向（資本流出入の慣性など）を表します。</li>
        </ul>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>為替変動の影響</strong></p>
        <p>円安が進行すると：</p>
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
        <p><strong>主要パラメータ</strong></p>
        <table>
          <thead>
            <tr><th>内部パラメータ</th><th>値</th><th>設定根拠</th></tr>
          </thead>
          <tbody>
            <tr><td>輸入為替パススルー率</td><td>0.7 (70%)</td><td>エネルギー100%・原材料75%・工業品50%の加重平均</td></tr>
            <tr><td>輸出円安弾性値</td><td>0.15</td><td>海外生産移転後の実証値（2010年代以降）</td></tr>
            <tr><td>法人税への輸出利益効果</td><td>0.3</td><td>上場企業の海外売上比率と為替感応度から推計</td></tr>
            <tr><td>法人税への輸入コスト効果</td><td>0.2</td><td>輸入依存度の高い企業割合がやや少ないため</td></tr>
            <tr><td>外貨準備評価益の歳入計上率</td><td>10%</td><td>実現益として計上可能な割合を保守的に設定</td></tr>
            <tr><td>エネルギー補助金</td><td>ベース額 × 補助金率 × (1+CPI)×(1+円安×0.5)</td><td>CPI・円安連動の動的モデル</td></tr>
          </tbody>
        </table>
      </TreeSection>

      <TreeSection title="E：家計インパクト" tree={`├── CPI上昇 = インフレ率 + 円安コストプッシュ×0.3 + 消費税CPI効果
│   └── 消費税CPI効果 = (新税率-10)/110 × 40%パススルー（変更年度のみ）
├── 実効CPI = CPI上昇 − CPI上昇×補助金率×0.5
├── 内部留保還元ブースト = 還元額 ÷ 名目GDP
├── 実効賃金上昇率 = 内生賃金 + 還元ブースト
├── 実質賃金伸び率 = 実効賃金上昇率 − 実効CPI
├── 実効感応度 = 基本感応度 × (1 + (1−分配率)×0.5)
├── 貧困率 = 前年 × (1 + (実効CPI−賃金)差 × 実効感応度)
├── ジニ係数 = 前年 + (資産成長率 − 実質賃金伸び率) × 0.01
├── 所得格差倍率 = (1+ジニ) ÷ (1−ジニ)
└── モデル家計（年収400万円）
　　├── 名目年収 = 400万 × 累積賃金上昇率
　　├── 食費 = 102万 × 累積CPI上昇率
　　├── 光熱費 = 29万 × 累積CPI × 円安係数 × (1−補助金率×0.5)
　　├── 可処分所得 = 年収×0.7 − 食費 − 光熱費
　　└── ※消費税増税時: 残余消費に (新税率-10)/(100+新税率) の追加負担`}>
        <p><strong>実質賃金伸び率</strong></p>
        <p>実効賃金上昇率 = 内生賃金 + 内部留保還元ブースト</p>
        <p>実質賃金伸び率 = 実効賃金上昇率 − 実効CPI</p>
        <p>実効CPI = (インフレ率 + 円安コストプッシュ + 消費税CPI効果) × (1 − 補助金率 × 0.5)</p>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>消費税率変更年度には (新税率-10)/110 × 40% のCPI上昇が加算されます（例：15%への増税で約1.8%のCPI上昇）。</p>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginTop: 8 }}>
          <p style={{ fontSize: 13 }}>
            <strong>内部留保還元ブースト</strong> = 内部留保残高 × 還元率 ÷ 名目GDP
          </p>
          <p style={{ fontSize: 12, marginTop: 6, color: '#64748b' }}>
            企業が内部留保を賃金・設備投資として還元する効果を実質賃金に反映。還元率が高いほど家計の実質賃金が改善し、貧困率・ジニ係数にも好影響します。
          </p>
        </div>
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr><th>パラメータ</th><th>値</th><th>意味</th><th>設定根拠</th></tr>
          </thead>
          <tbody>
            <tr><td>円安コストプッシュ係数</td><td>0.3</td><td>円安率のうち30%がCPIに転嫁</td><td>日銀「経済・物価情勢の展望」の為替パススルー率推計中央値</td></tr>
            <tr><td>名目賃金上昇率</td><td>サイドバーで設定</td><td>春闘・労働市場の賃上げ率</td><td>厚労省「毎月勤労統計」実績を参考</td></tr>
            <tr><td>内部留保還元率</td><td>2%/年（デフォルト）</td><td>内部留保の年間還元割合</td><td>企業の設備投資・賃上げへの配分率を想定</td></tr>
          </tbody>
        </table>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>貧困率モデル</strong></p>
        <p>貧困率 = 前年貧困率 × (1 + (実効CPI − 賃金上昇率) × <em>実効感応度</em>)</p>
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '12px 16px', marginTop: 8 }}>
          <p style={{ fontSize: 13 }}>
            <strong>実効感応度</strong> = 基本感応度 × (1 + (1 − 生産性分配率) × 0.5)
          </p>
          <p style={{ fontSize: 12, marginTop: 6, color: '#64748b' }}>
            生産性分配率が低い（企業に利益が偏る）ほど、同じ物価上昇に対する貧困率の悪化が大きくなります。分配率0.3→実効感応度1.35倍、分配率0.7→1.15倍。
          </p>
        </div>
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr><th>パラメータ</th><th>値</th><th>設定根拠</th></tr>
          </thead>
          <tbody>
            <tr><td>基本感応度（悪化方向）</td><td>0.5</td><td>OECD諸国の実証研究の中央値</td></tr>
            <tr><td>分配率連動係数</td><td>(1−分配率)×0.5</td><td>低分配率で脆弱性が増幅</td></tr>
            <tr><td>改善速度</td><td>悪化の30%</td><td>ラチェット効果（下方硬直性）</td></tr>
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
            参考：OECD "Under Pressure: The Squeezed Middle Class" (2019)、世界銀行 "Poverty and Shared Prosperity" (2022)、Friedman (恒常所得仮説)
          </p>
        </div>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>ジニ係数モデル</strong></p>
        <p>ジニ係数 = 前年ジニ + (資産成長率 − 実質賃金伸び率) × 0.01</p>
        <p>「資産価格の伸び」と「労働所得の伸び」の差が格差を拡大させるモデルです（Piketty「r {'>'} g」論に基づく）。</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>円安時は株式・不動産・外貨資産が増加するが、恩恵は資産を持つ高所得者に偏る</li>
          <li>一方、実質賃金の低下は低〜中所得者の生活を直撃する</li>
          <li>この「資産インフレ」と「賃金デフレ」の二極化が格差を構造的に拡大させる</li>
        </ul>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>モデル家計（年収中央値400万円）</strong></p>
        <p>マクロ指標を「暮らしの実感」に換算するため、年収400万円（中央値）のモデル家計で可処分所得・食費・光熱費の変化を計算します。</p>
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr><th>項目</th><th>計算式</th><th>初期値</th><th>根拠</th></tr>
          </thead>
          <tbody>
            <tr><td>名目年収</td><td>400万円 × 累積賃金上昇率</td><td>400万円</td><td>厚労省「賃金構造基本統計調査」中央値</td></tr>
            <tr><td>税・社会保険料</td><td>名目年収 × 30%</td><td>120万円</td><td>国民負担率約30%（財務省）</td></tr>
            <tr><td>食費</td><td>400万円 × 25.5% × 累積CPI上昇率</td><td>102万円</td><td>エンゲル係数25.5%（総務省「家計調査」2023）</td></tr>
            <tr><td>光熱費</td><td>400万円 × 7.3% × 累積CPI × 円安係数</td><td>29.2万円</td><td>総務省「家計調査」光熱費比率</td></tr>
            <tr><td>可処分所得</td><td>名目年収 − 税社保 − 食費 − 光熱費</td><td>148.8万円</td><td>上記の残余</td></tr>
          </tbody>
        </table>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>所得格差倍率（ジニ係数→五分位倍率）</strong></p>
        <p>所得格差倍率 = (1 + ジニ) ÷ (1 − ジニ)</p>
        <p>ジニ係数を直感的に理解するため、上位20%と下位20%の所得比率に変換します。</p>
        <ul style={{ paddingLeft: 20, marginTop: 8, fontSize: 13 }}>
          <li>ジニ係数0.30 → 格差倍率1.86倍</li>
          <li>ジニ係数0.35 → 格差倍率2.08倍</li>
          <li>ジニ係数0.40 → 格差倍率2.33倍</li>
          <li>ジニ係数0.45 → 格差倍率2.64倍</li>
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
      </TreeSection>

      <TreeSection title="F：対外純資産（NFA）と通貨信任" tree={`├── 所得収支 = NFA × 3%（投資リターン）
├── 経常収支 = 貿易収支 + 所得収支
├── NFA = 前年NFA + 経常収支
└── 通貨リスクプレミアム
　　├── 条件：経常赤字 AND NFA < 防衛ライン
　　└── 実効金利 = ベース金利 + リスクプレミアム`}>
        <p><strong>経常収支と対外純資産の追跡</strong></p>
        <p>日本は世界最大の対外純資産国（約420兆円）ですが、経常収支が赤字に転落しNFAが減少すると、通貨の信認低下→金利上昇という危機メカニズムが発動する可能性があります。</p>
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr><th>項目</th><th>計算式</th><th>説明</th></tr>
          </thead>
          <tbody>
            <tr><td>貿易収支</td><td>輸出 − 輸入</td><td>Dで計算された値</td></tr>
            <tr><td>所得収支</td><td>NFA × 3%</td><td>対外純資産からの投資リターン</td></tr>
            <tr><td>経常収支</td><td>貿易収支 + 所得収支</td><td>国全体の対外的な稼ぎ</td></tr>
            <tr><td>対外純資産</td><td>前年NFA + 経常収支</td><td>経常黒字なら積み上がり、赤字なら取り崩し</td></tr>
          </tbody>
        </table>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>通貨信任リスクプレミアム（動的トリガー）</strong></p>
        <p>以下の2条件が同時に成立すると、市場金利にリスクプレミアムが自動加算されます：</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li><strong>条件1</strong>：経常収支が赤字（前年の経常収支 {'<'} 0）</li>
          <li><strong>条件2</strong>：対外純資産がNFA防衛ライン以下（前年のNFA {'<'} 閾値）</li>
        </ul>
        <p style={{ marginTop: 8 }}>トリガー発動時：実効市場金利 = ベース金利 + 通貨リスクプレミアム × 加速係数</p>

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginTop: 12 }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>非線形加速メカニズム（悪化傾向の反映）</p>
          <p style={{ fontSize: 13 }}>
            経常収支の年度差が悪化方向（マイナス拡大）に連続している場合、リスクプレミアムは加速度的に増加します。
            これはイギリス（Brexit後のポンド急落）やトルコ（リラ危機）で観測された「回復見通しが立たない」場合の
            投資家心理の非連続的な変化を反映しています。
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 8, fontSize: 13 }}>
            <li>経常収支が赤字かつ、前年差（delta）が悪化方向に連続すると「悪化連続カウンター」が増加</li>
            <li>加速係数 = 1 + カウンター × 0.3（例：3年連続悪化で1.9倍）</li>
            <li>改善に転じるとカウンターが段階的に減少（急回復はしない設計）</li>
          </ul>
        </div>

        <div style={{ background: '#450a0a', border: '1px solid #991b1b', borderRadius: 8, padding: '12px 16px', marginTop: 12, color: '#fecaca' }}>
          <p style={{ fontWeight: 600, marginBottom: 6, color: '#fca5a5' }}>🚨 最上級アラート：通貨信認リスク</p>
          <p style={{ fontSize: 13 }}>
            シミュレーション最終5年間で経常収支が連続マイナスかつNFAが継続的に減少している場合、
            「通貨信認リスク（最上級）」アラートが発生します。これは通貨の信認が根本的に損なわれ、
            サドンストップ（資本流入の急停止）が起きうる状態を示しています。
            最適化機能の制約条件「経常赤字連続年数」を活用して、この状態を回避するパラメータ探索が可能です。
          </p>
        </div>

        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginTop: 12 }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>なぜ対外純資産の減少が金利を押し上げるのか？</p>
          <p style={{ fontSize: 13 }}>
            対外純資産が大幅に減少し経常赤字が定着すると、海外投資家は日本円建て資産のリスクを再評価します。
            国債の円安ヘッジコスト増大、外貨建て調達の必要性、財政ファイナンスの持続可能性への疑念が重なり、
            国債金利にリスクプレミアムが上乗せされます。これは英国（2022年ポンド危機）やアルゼンチン等で実際に観測されたメカニズムです。
          </p>
        </div>
        <table style={{ marginTop: 12 }}>
          <thead>
            <tr><th>パラメータ</th><th>デフォルト値</th><th>設定根拠</th></tr>
          </thead>
          <tbody>
            <tr><td>初期NFA</td><td>420兆円</td><td>財務省「本邦対外資産負債残高」2024年末</td></tr>
            <tr><td>NFA防衛ライン</td><td>200兆円</td><td>対外純資産の半減を危機シグナルとする保守的な設定</td></tr>
            <tr><td>通貨リスクプレミアム</td><td>2.0%</td><td>新興国通貨危機時の金利上乗せ幅の中央値</td></tr>
            <tr><td>所得収支利回り</td><td>3%</td><td>日銀「国際収支統計」の加重平均リターン</td></tr>
          </tbody>
        </table>
      </TreeSection>

      <TreeSection title="G：予算構成と歳出内訳" tree={`├── 歳入構成（財源別）
│　├── 税収比率 = 税収合計 ÷ (税収+公債金+その他)
│　├── 公債金依存度 = 国債発行額 ÷ 歳出合計
│　└── その他収入比率 = その他収入 ÷ 全体
└── 歳出内訳（分野別）
　　├── 社会保障 ← 前年 × (1+インフレ) + 自然増
　　├── 子育て支援 ← 前年 × (1+成長率)
　　├── 地方交付税 ← 前年 × (1+税収伸び×0.5)
　　├── 防衛 ← 前年 × (1+成長率)
　　├── その他政策 ← 残余（合計との差額）
　　└── エネルギー補助金 ← 円安連動`}>
        <p><strong>予算の財源構成（歳入サイド）</strong></p>
        <p>政府予算の歳入は「税収」「公債金（国債発行）」「その他収入（日銀納付金等）」の3つの財源で構成されます。公債金依存度が高いほど、将来の利払い負担が増大し財政の持続可能性が低下します。</p>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>歳出の分野別内訳（支出サイド）</strong></p>
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr><th>分野</th><th>初期値</th><th>成長モデル</th></tr>
          </thead>
          <tbody>
            <tr><td>社会保障</td><td>37兆円</td><td>前年×(1+インフレ率) + 自然増0.35兆円</td></tr>
            <tr><td>子育て支援</td><td>5兆円</td><td>前年×(1+政策成長率)</td></tr>
            <tr><td>地方交付税</td><td>17兆円</td><td>前年×(1+税収伸び率×50%)</td></tr>
            <tr><td>防衛</td><td>7兆円</td><td>前年×(1+政策成長率)</td></tr>
            <tr><td>その他政策</td><td>残余</td><td>政策経費合計からの差額</td></tr>
            <tr><td>エネルギー補助金</td><td>0</td><td>円安・インフレ進行時に自動発生</td></tr>
          </tbody>
        </table>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', marginTop: 12 }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>社会保障費の自然増について</p>
          <p style={{ fontSize: 13 }}>
            高齢化に伴う社会保障費の自然増は年間約0.5兆円（2024年度概算要求ベース）です。
            このうち約70%（0.35兆円）が予算に反映されると想定しています。
            これはインフレ率とは別の構造的な増加要因で、高齢者人口の増加に連動します。
          </p>
        </div>
      </TreeSection>

      <TreeSection title="H：制約条件と実質政策的経費指数" tree={`├── 制約条件（レッドライン）
│　├── 貧困率 ≤ 閾値（デフォルト20%）
│　├── ジニ係数 ≤ 閾値（デフォルト0.45）
│　├── 利払負担率 ≤ 閾値（デフォルト30%）
│　└── 実質政策経費指数 ≥ 閾値（デフォルト70）
└── 実質政策経費指数
　　├── = 当年政策経費 ÷ 累積インフレ ÷ 初年度政策経費 × 100
　　└── 初年度=100、低下＝実質的な行政サービス削減`}>
        <p><strong>制約条件（レッドライン）</strong></p>
        <p>「起きてはいけない状態」を定義し、最適化探索時にペナルティとして組み込みます。30年のシミュレーション期間中、いずれかの年度で制約を違反するとペナルティが加算されます。</p>
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr><th>制約</th><th>デフォルト閾値</th><th>意味</th></tr>
          </thead>
          <tbody>
            <tr><td>貧困率</td><td>≤ 20%</td><td>社会的危機水準を超えない</td></tr>
            <tr><td>ジニ係数</td><td>≤ 0.45</td><td>OECD基準「高度格差社会」に達しない</td></tr>
            <tr><td>利払負担率</td><td>≤ 30%</td><td>税収の3割以上が利払いに消えない</td></tr>
            <tr><td>実質政策経費指数</td><td>≥ 70</td><td>実質的に使える予算が初年度から3割以上減らない</td></tr>
          </tbody>
        </table>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>実質政策的経費指数の計算式</strong></p>
        <p>利払い費を除いた「実際に政策に使える予算」がインフレ調整後にどれだけ維持されているかを示す指標です。</p>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginTop: 8 }}>
          <p style={{ fontSize: 13 }}>
            <strong>実質政策経費指数</strong> = 当年の政策的経費 ÷ (1+インフレ率)<sup>年数</sup> ÷ 初年度の政策的経費 × 100
          </p>
          <p style={{ fontSize: 12, marginTop: 6, color: '#64748b' }}>
            初年度（2026年）= 100。例えば指数70は「インフレを考慮すると、実質的に使える予算が初年度の7割に減った」ことを意味します。
          </p>
        </div>
      </TreeSection>

      <TreeSection title="I：内生賃金モデルと企業セクター" tree={`├── 名目GDP
│　└── 当年GDP = 前年GDP × (1 + 名目成長率)
├── 内生的賃金モデル
│　├── 内生賃金 = 実質成長率 × 生産性分配率 + インフレ率 × 転嫁率
│　├── 名目賃金上昇率 = max(内生賃金, 下限値)
│　└── 実質賃金 = 名目賃金上昇率 − 実効CPI上昇率
├── 企業セクター
│　├── 企業利益 = 法人税収 ÷ 実効税率(23%)
│　├── 労働コスト圧力 = GDP × 生産性分配率 × 名目賃金上昇率
│　├── 純企業所得 = 企業利益 − 労働コスト圧力
│　├── 還元額 = 内部留保残高 × 還元率
│　└── 内部留保累計 = 前年 + 純企業所得 − 還元額
└── 債務GDP比
　　└── = 政府債務残高 ÷ 名目GDP × 100`}>
        <p><strong>内生的賃金決定メカニズム</strong></p>
        <p>従来の固定パラメータ方式を改め、賃金上昇率を経済成長とインフレの関数として内生的に決定します。</p>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginTop: 8 }}>
          <p style={{ fontSize: 13 }}>
            <strong>内生賃金</strong> = 実質成長率 × 生産性分配率 + インフレ率 × 転嫁率
          </p>
          <p style={{ fontSize: 12, marginTop: 6, color: '#64748b' }}>
            生産性分配率（デフォルト0.5）：GDP成長の何%が労働者に分配されるか。日本は先進国最低水準（0.3〜0.5）。<br/>
            インフレ転嫁率（デフォルト0.3）：物価上昇の何%が春闘等で賃金に反映されるか。完全転嫁=1.0。
          </p>
        </div>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>企業セクターの追跡</strong></p>
        <p>法人税収から逆算した企業利益と、賃金に分配されなかった部分が内部留保として蓄積される過程を追跡します。</p>
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '12px 16px', marginTop: 8 }}>
          <p style={{ fontSize: 13 }}>
            <strong>企業利益</strong> = 法人税収 ÷ 実効法人税率（23%）<br/>
            <strong>労働コスト圧力</strong> = 名目GDP × 生産性分配率 × 名目賃金上昇率<br/>
            <strong>純企業所得</strong> = 企業利益 − 労働コスト圧力<br/>
            <strong>還元額</strong> = 内部留保残高 × 還元率（デフォルト2%/年）<br/>
            <strong>内部留保</strong> = 前年 + 純企業所得 − 還元額<br/>
            <strong>内部留保GDP比</strong> = 累積内部留保 ÷ 名目GDP × 100
          </p>
          <p style={{ fontSize: 12, marginTop: 6, color: '#64748b' }}>
            初期値：550兆円（2024年推計）。内部留保還元率が低いと内部留保GDP比が上昇し続け、企業が利益を賃金に還元していないことを示します。還元率を上げると内部留保が縮小し、家計への分配が改善されます。
          </p>
        </div>
      </TreeSection>

      <TreeSection title="J：人的資本・人口動態モデル" tree={`├── 労働力指数 = 前年 × (1 + 人口成長率 + 労働参加率変化)
├── 教育効果 = 弾性値 × (15年前の教育投資GDP比 − 基準) / 基準
├── 老化減耗 = |人口成長率| × 0.3
├── 人的資本成長率 = 教育効果 + テクノロジー効果 − 老化減耗
├── 人的資本指数 = 前年 × (1 + 人的資本成長率)
├── 内生TFR = ベースTFR + 賃金効果 + 格差効果 + 子育て支援効果
│   ├── 賃金効果 = 0.08 × 累積実質賃金変化率（3年平均）× 感応度
│   ├── 格差効果 = 1.5 × (基準ジニ − 現在ジニ) × 感応度
│   └── 子育て支援効果 = 0.15 × (子育て支援GDP比 − 基準) × 感応度
└── 社会活力指数 = 100 × (TFR/ベースTFR) × (1+人的資本成長率) × (1+実質賃金変化率)`}>
        <p><strong>労働力指数と人口動態</strong></p>
        <p>労働力指数は人口成長率と労働参加率の変化を組み合わせて、利用可能な労働力の推移を追跡します。日本は人口減少局面にあるため、労働参加率の向上（女性・高齢者の活躍推進）が人口減を部分的に相殺する重要な要素となります。</p>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>教育投資パイプライン（15年ラグ）</strong></p>
        <p>教育投資の効果は即座には現れず、約15年のタイムラグを伴って労働市場に反映されます。これは教育を受けた世代が労働力の中核となるまでの期間に対応しています。</p>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginTop: 8 }}>
          <p style={{ fontSize: 13 }}>
            <strong>教育効果</strong> = γ × (15年前の教育投資GDP比 − 基準3.0%) / 基準3.0%
          </p>
          <p style={{ fontSize: 12, marginTop: 6, color: '#64748b' }}>
            γ（弾性値）= 0.5。OECD平均の公教育支出GDP比は約4.9%で、日本の3.5%は先進国最低水準です。
            シミュレーション開始から15年間は過去の教育投資実績（2011〜2025年推計）を使用し、
            それ以降はパラメータで設定した教育投資GDP比が効果を発揮し始めます。
          </p>
        </div>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>人的資本成長率と人的資本指数</strong></p>
        <p>人的資本成長率 = 教育効果 + テクノロジー効果 − 老化減耗</p>
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr><th>要素</th><th>計算式</th><th>説明</th></tr>
          </thead>
          <tbody>
            <tr><td>教育効果</td><td>γ × (laggedEdu − 3.0) / 3.0</td><td>15年前の教育投資水準が人的資本の質を決定</td></tr>
            <tr><td>テクノロジー効果</td><td>パラメータ設定値</td><td>AI・DX等の技術革新による生産性向上</td></tr>
            <tr><td>老化減耗</td><td>|人口成長率| × 0.3</td><td>人口減少率が大きいほど経験・知識の喪失が加速</td></tr>
          </tbody>
        </table>
        <p style={{ marginTop: 8 }}>人的資本指数は初年度100を基準とし、毎年の人的資本成長率で複利的に変動します。この指数は実質成長率（寄与度0.4）、所得税収（乗数効果）、賃金（寄与度0.3）に影響を与えます。</p>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>内生的出生率（TFR）モデル</strong></p>
        <p>合計特殊出生率（TFR）を経済状況の関数として内生的に決定します。</p>
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '12px 16px', marginTop: 8 }}>
          <p style={{ fontSize: 13 }}>
            <strong>TFR</strong> = clamp(ベースTFR + 賃金効果 + 格差効果 + 子育て支援効果, 0.8, 2.07)
          </p>
        </div>
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr><th>効果</th><th>計算式</th><th>根拠</th></tr>
          </thead>
          <tbody>
            <tr><td>賃金効果</td><td>0.08 × 直近3年累積実質賃金変化率 × 感応度</td><td>実質賃金の上昇は出産意欲を高める（厚労省「出生動向基本調査」）</td></tr>
            <tr><td>格差効果</td><td>1.5 × (基準ジニ − 現在ジニ) × 感応度</td><td>格差縮小は将来への安心感を高め出生率を改善（OECD実証研究）</td></tr>
            <tr><td>子育て支援効果</td><td>0.15 × (子育て支援GDP比 − 0.81%) × 感応度</td><td>子育て支援の充実がTFRを押し上げる（北欧モデルの実証）</td></tr>
          </tbody>
        </table>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>上限2.07は人口置換水準、下限0.80は韓国の実績最低水準を参考に設定。感応度パラメータ（0〜1）で経済要因への反応の強さを調整可能です。</p>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>出生率→人口フィードバック（20年ラグ）</strong></p>
        <p>TFRの変化は20年後に新たな労働力として人口成長率にフィードバックされます。</p>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', marginTop: 8 }}>
          <p style={{ fontSize: 13 }}>
            t ≥ 20年目: tfrFeedback = (TFR(t-20) − ベースTFR) × 0.005
          </p>
          <p style={{ fontSize: 12, marginTop: 6, color: '#64748b' }}>
            20年前にTFRが改善していれば現在の人口成長率にプラスのフィードバック、悪化していればマイナスのフィードバックが発生します。この効果を確認するにはシミュレーション期間を40〜50年に設定する必要があります。
          </p>
        </div>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>社会活力指数</strong></p>
        <p>社会活力指数 = 100 × (TFR / ベースTFR) × (1 + 人的資本成長率) × (1 + 実質賃金変化率)</p>
        <p>出生率・人的資本・賃金の3要素を統合した複合指標で、社会の持続可能性を総合的に評価します。</p>
        <ul style={{ paddingLeft: 20, marginTop: 8, fontSize: 13 }}>
          <li><strong>120以上</strong>：好循環（出生率改善・人的資本蓄積・賃金上昇の正のスパイラル）</li>
          <li><strong>80〜120</strong>：中立（現状維持から緩やかな変動）</li>
          <li><strong>80以下</strong>：悪循環（少子化加速・人的資本流出・賃金停滞の負のスパイラル）</li>
        </ul>
        <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginTop: 12 }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>社会活力指数の意味と限界</p>
          <p style={{ fontSize: 13 }}>
            この指数は出生率・人的資本・賃金という3つの相互連関する要素を1つの数値に集約したものです。好循環（出生率改善→将来の労働力確保→人的資本投資の効率化→賃金上昇→さらなる出生率改善）と悪循環（逆方向）のダイナミクスを捉えることを目的としていますが、移民政策・技術革新の非連続的変化・社会制度改革などの効果は十分に反映されていません。
          </p>
        </div>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>人的資本の財政モデルへの接続</strong></p>
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr><th>接続先</th><th>影響</th><th>メカニズム</th></tr>
          </thead>
          <tbody>
            <tr><td>実質成長率</td><td>hcGrowth × 0.4 を名目成長率に加算</td><td>人的資本の蓄積が生産性を通じてGDP成長に寄与</td></tr>
            <tr><td>所得税収</td><td>humanCapitalIndex/100 を乗算</td><td>人的資本が高いほど高スキル労働者が増え所得税収が増加</td></tr>
            <tr><td>賃金</td><td>hcGrowth × 0.3 を内生賃金に加算</td><td>人的資本の質的向上が賃金上昇圧力を生む</td></tr>
            <tr><td>社会保障費</td><td>|popGrowth| × 従属比率係数 を自然増に加算</td><td>人口減少率が大きいほど高齢者扶養負担が増大</td></tr>
          </tbody>
        </table>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>データ出典</strong></p>
        <ul style={{ paddingLeft: 20, fontSize: 12, color: '#64748b' }}>
          <li>教育投資GDP比：OECD「Education at a Glance」各年版、日本の公教育支出GDP比実績（2015〜2024年）</li>
          <li>出生率データ：厚生労働省「人口動態統計」、国立社会保障・人口問題研究所「日本の将来推計人口」</li>
          <li>出生率の経済弾性値：厚生労働省「出生動向基本調査」、OECD「Society at a Glance」における各国比較分析</li>
          <li>教育投資のリターン（15年ラグ）：Hanushek & Woessmann (2015) "The Knowledge Capital of Nations"</li>
          <li>人口置換水準（2.07）：国連人口部の標準定義</li>
        </ul>
      </TreeSection>

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
    const isBold = type === 'subtotal' || type === 'total' || type === 'exptotal' || type === 'result';
    if (rawValue >= 0) {
      return isBold ? '#16a34a' : '#86efac';
    } else {
      return isBold ? '#dc2626' : '#fca5a5';
    }
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
