import { useState, useMemo, useRef } from 'react'
import ReactDOM from 'react-dom'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, ReferenceLine,
  LineChart, Line,
} from 'recharts'
import type { SimResult } from './simulation'
import type { ActualDataPoint, SimParams } from './data'
import { ACTUAL_DATA, SCENARIOS } from './data'
import { computeWarnings } from './warnings'

interface Props {
  params: SimParams;
  simData: SimResult[];
  actualData: ActualDataPoint[];
  childAge2026: number;
  scenarioIndex: number;
}

const WARNING_DETAILS: Record<string, { impact: string[]; options: string[] }> = {
  '利払負担率30%超過': {
    impact: [
      '政府が税収の3割以上を借金の利息に使う状態。教育・医療・インフラへの予算が圧迫され、サービスの質が低下しやすい',
      '社会保障の給付削減や自己負担増加が政治的に議論されやすくなる',
    ],
    options: [
      '増税（消費税・所得税・法人税の引き上げ）',
      '歳出カット（社会保障の自然増抑制、公共事業削減）',
      '名目成長率の引き上げによる税収増（成長戦略・賃上げ促進）',
    ],
  },
  '通貨リスクプレミアム発動': {
    impact: [
      '長期金利が上昇し、住宅ローン・企業借入コストが上がる',
      '円安がさらに進み、食料・エネルギーなど輸入物価が上昇して家計の実質可処分所得が減少する',
      '外貨建て資産（海外旅行・外国製品）のコストが増大する',
    ],
    options: [
      '外貨準備の活用による円買い介入',
      '輸出競争力強化策（産業政策・FTA推進）',
      '財政再建シグナルによる市場信認の回復',
      '観光・デジタルサービス輸出による経常収支改善',
    ],
  },
  '実質賃金3年連続マイナス': {
    impact: [
      '年収400万円世帯では実質的な生活水準が毎年低下し、食費・光熱費の削減を迫られる',
      '貯蓄の取り崩しが進み、老後資産形成が困難になる',
      '貧困率・ジニ係数の悪化が加速する',
    ],
    options: [
      '最低賃金の引き上げ・賃上げ税制',
      'エネルギー補助金の拡充（物価上昇の直接軽減）',
      '給付付き税額控除など低所得層への直接支援',
    ],
  },
  '経常収支の赤字転落': {
    impact: [
      '円の対外信認が中長期的に低下し、じわじわと円安圧力が続く',
      '輸入に頼る食料・エネルギーのコストが構造的に高止まりする',
      '海外からの資本流入に依存する構造になり、金利が海外投資家の意向に左右されやすくなる',
    ],
    options: [
      '再生可能エネルギー投資によるエネルギー輸入の削減',
      'インバウンド観光・コンテンツ輸出などサービス収支の改善',
      '半導体・製造業の国内回帰による輸出回復',
    ],
  },
  '日銀自己資本バッファ超過': {
    impact: [
      '日銀の累積損失が引当金・準備金を超過し、実質的な債務超過状態に',
      '統合政府の歳入が直接減少し、他の政策予算を圧迫する',
      '中央銀行の信認低下が通貨（円）の信認低下につながるリスク',
    ],
    options: [
      '政策金利の据え置き（付利コストの抑制）',
      '国債保有の段階的圧縮（量的引き締め）',
      '政府からの資本注入による自己資本の回復',
    ],
  },
  '財政収支の慢性的赤字': {
    impact: [
      '財政赤字が長期間続くと国債発行残高が雪だるま式に膨らみ、利払い費が加速度的に増加する',
      '市場の財政信認が低下し、国債の金利上昇（リスクプレミアム）につながる可能性がある',
      '将来世代への負担が増大し、社会保障・教育・インフラへの投資余力が失われる',
    ],
    options: [
      '歳入改革（税制の見直し・課税ベースの拡大）',
      '歳出改革（社会保障の効率化・行政のデジタル化によるコスト削減）',
      '経済成長戦略による税収の自然増（名目GDP成長率の引き上げ）',
      'プライマリーバランス黒字化目標の設定と工程表の策定',
    ],
  },
  '前年比100%超の変化': {
    impact: [
      'シミュレーション結果に前年比100%を超える急激な変動が含まれています',
      'パラメータ設定が極端な値になっている可能性があります',
    ],
    options: [
      'パラメータの設定値を確認・調整してください',
      '別のシナリオと比較して妥当性を検証してください',
    ],
  },
}

function WarningAccordion({ warnings }: { warnings: { year: number; type: string; detail: string }[] }) {
  const [openType, setOpenType] = useState<string | null>(null)
  const warningTypes = new Map<string, number>()
  warnings.forEach(w => {
    if (!warningTypes.has(w.type)) warningTypes.set(w.type, w.year)
  })
  const alerts = Array.from(warningTypes.entries())
  if (alerts.length === 0) {
    return <div className="success-box" style={{ marginTop: 12 }}>✓ シミュレーション期間中、重大な財政リスクイベントは検出されませんでした。</div>
  }
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#ef4444' }}>⚠️ 警告イベント（クリックで詳細を表示）</div>
      <div className="warning-timeline">
        {alerts.map(([type, firstYear]) => {
          const count = warnings.filter(w => w.type === type).length
          const firstDetail = warnings.find(w => w.type === type)!.detail
          const isOpen = openType === type
          const details = WARNING_DETAILS[type]
          return (
            <div key={type}>
              <div
                className="warning-event"
                onClick={() => setOpenType(isOpen ? null : type)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 700, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block', marginRight: 4 }}>▶</span>
                <span className="warning-year">{firstYear}年〜</span>
                <span className="warning-type">{type}</span>
                <span className="warning-detail">{firstDetail}（{count}年間）</span>
              </div>
              {isOpen && details && (
                <div style={{ margin: '4px 0 12px 20px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13 }}>
                  <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>■ 実生活への影響</div>
                  <ul style={{ paddingLeft: 20, marginBottom: 12, color: '#1e293b' }}>
                    {details.impact.map((item, i) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
                  </ul>
                  <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 6 }}>■ 政策オプション</div>
                  <ul style={{ paddingLeft: 20, color: '#1e293b' }}>
                    {details.options.map((item, i) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ALL_YEARS = Array.from({ length: 41 }, (_, i) => 2015 + i)

function fillYearGaps<T extends Record<string, unknown>>(data: T[]): (T & { _noData?: boolean })[] {
  const dataMap = new Map<number, T>()
  data.forEach(d => dataMap.set(d.year as number, d))
  return ALL_YEARS.map(year => {
    if (dataMap.has(year)) return { ...dataMap.get(year)!, _noData: false }
    const entry: Record<string, unknown> = { year, _noData: true }
    if (data.length > 0) {
      Object.keys(data[0]).forEach(key => {
        if (key !== 'year' && key !== '_noData' && key !== 'type') entry[key] = null
      })
    }
    return entry as T & { _noData?: boolean }
  })
}

function NoDataTooltip({ active, payload, label, unit, decimals, childAge2026 }: { active?: boolean; payload?: Array<{ name: string; value: number | null; color: string }>; label?: number; unit?: string; decimals?: number; childAge2026?: number }) {
  if (!active || !payload || !label) return null
  const isNoData = payload.every(p => p.value === null || p.value === undefined)
  const dec = decimals ?? 1
  const u = unit ?? ''
  const childAge = childAge2026 !== undefined ? childAge2026 + (label - 2026) : undefined
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}年度</div>
      {childAge !== undefined && childAge >= 0 && (
        <div style={{ color: '#f59e0b', fontWeight: 600, marginBottom: 4, fontSize: 11 }}>👶 子供の年齢: {childAge}歳</div>
      )}
      {isNoData ? (
        <div style={{ color: '#94a3b8' }}>実績なし</div>
      ) : (
        payload.filter(p => p.value !== null && p.value !== undefined).map((p, i) => (
          <div key={i} style={{ color: p.color, marginBottom: 2 }}>
            {p.name}: {typeof p.value === 'number' ? (dec === 0 ? p.value.toLocaleString() : p.value.toFixed(dec)) : p.value}{u}
          </div>
        ))
      )}
    </div>
  )
}

interface ChartHelpInfo {
  description: string;
  sensitiveParams: string[];
}

const CHART_HELP: Record<string, ChartHelpInfo> = {
  '利払い負担率の推移 （税収に対する利払い費の割合）': {
    description: '税収のうち何%が借金の利息返済に消えるかを示します。30%を超えると教育・医療などの予算が圧迫されます。',
    sensitiveParams: ['ベースリスクプレミアム', '平均クーポン', 'インフレ率'],
  },
  '財政収支の推移 （歳入 − 歳出）': {
    description: '政府の収入と支出の差額です。マイナスなら赤字で国債発行が必要に、プラスなら黒字です。',
    sensitiveParams: ['実質成長率', 'インフレ率', '政策的経費'],
  },
  '債務残高の推移': {
    description: '国の借金（国債残高）の推移です。財政赤字が続くと増加し、金利上昇で利払いが膨らむ悪循環に陥ります。',
    sensitiveParams: ['実質成長率', 'ベースリスクプレミアム', '政策的経費'],
  },
  '貧困率の推移（%）': {
    description: '相対的貧困率の推移。実質賃金が低下する（物価上昇＞賃金上昇）と悪化します。',
    sensitiveParams: ['生産性分配率', 'インフレ転嫁率', '貧困率感応度'],
  },
  'ジニ係数の推移（x100）': {
    description: '所得格差の大きさ。資産価格上昇が実質賃金を上回ると格差が拡大します。',
    sensitiveParams: ['生産性分配率', '内部留保還元率', '円安進行率'],
  },
  '実質賃金伸び率（%）': {
    description: 'インフレ調整後の賃金の伸び。マイナスなら実質的な賃金カットで生活水準が低下します。',
    sensitiveParams: ['生産性分配率', 'インフレ転嫁率', 'インフレ率'],
  },
  '可処分所得と生活費の変化（万円/年）': {
    description: '年収400万円世帯の可処分所得変化と食費・光熱費増加の推移。家計への直接的なインパクトです。',
    sensitiveParams: ['インフレ率', '円安進行率', 'エネルギー補助金率'],
  },
  '所得格差倍率（上位20%÷下位20%）': {
    description: '上位20%の所得が下位20%の何倍かを示す五分位倍率。ジニ係数から変換しています。',
    sensitiveParams: ['生産性分配率', '内部留保還元率', '実質成長率'],
  },
  '貿易収支の推移': {
    description: '輸出と輸入の差額。円安は輸出に有利ですが輸入コストも増加します。',
    sensitiveParams: ['円安進行率', '世界経済成長率', '実質成長率'],
  },
  '為替レートの推移': {
    description: '円/ドルの為替レート推移。円安が進むと輸入物価が上昇し家計を圧迫します。',
    sensitiveParams: ['円安進行率', 'ベースリスクプレミアム', '通貨リスクプレミアム'],
  },
  '対外純資産の推移': {
    description: '日本が海外に持つ資産から負債を引いた純額。経常赤字が続くと減少します。',
    sensitiveParams: ['円安進行率', '世界経済成長率', '実質成長率'],
  },
  '経常収支の推移（兆円）': {
    description: '貿易収支＋所得収支。赤字転落すると通貨リスクプレミアムが発動し金利上昇につながります。',
    sensitiveParams: ['円安進行率', '世界経済成長率', 'NFA防衛ライン'],
  },
  '通貨リスクプレミアム加算（%）': {
    description: '経常赤字＋NFA低下時に市場金利に自動加算されるペナルティ。通貨の信認低下を表します。',
    sensitiveParams: ['通貨リスクプレミアム', 'NFA防衛ライン', '円安進行率'],
  },
  '名目GDP（兆円）': {
    description: '日本の名目GDP推移。インフレ率＋実質成長率で毎年成長します。',
    sensitiveParams: ['実質成長率', 'インフレ率', '円安進行率'],
  },
  '債務残高GDP比・内部留保GDP比（%）': {
    description: '政府債務と企業内部留保のGDP比。内部留保比率が高いと企業が賃金に分配していない状態です。',
    sensitiveParams: ['生産性分配率', '内部留保還元率', '実質成長率'],
  },
  '税収内訳・歳入（兆円）': {
    description: '消費税・所得税・法人税・その他税の内訳推移。利払い費がマイナスの年は「利息純収入」として歳入に加算されます。',
    sensitiveParams: ['実質成長率', 'インフレ率', '円安進行率'],
  },
  '歳入の財源構成（%）': {
    description: '歳入全体に占める税収・公債金・その他の比率。公債金依存度が高いほど財政リスクが大きいです。',
    sensitiveParams: ['実質成長率', '政策的経費', 'ベースリスクプレミアム'],
  },
  '歳出分野別内訳（兆円）': {
    description: '社会保障・子育て・地方交付税・防衛・利払い等の分野別歳出。高齢化で社会保障が膨らみます。利払い費がマイナスの場合は歳入側に「利息純収入」として振り替えます。',
    sensitiveParams: ['インフレ率', '社会保障費', '自然増'],
  },
  '日銀純利益（兆円）': {
    description: '日銀の収入（保有国債利息）と支出（当座預金の付利）の差額。金利上昇で逆ザヤのリスクがあります。',
    sensitiveParams: ['ベースリスクプレミアム', '保有国債利回り', 'QT縮小額'],
  },
  '統合政府への反映額（兆円）': {
    description: '日銀利益のうち国庫に納付される金額。逆ザヤが累積するとマイナスになり歳入を減少させます。',
    sensitiveParams: ['ベースリスクプレミアム', '日銀自己資本バッファ', 'QT縮小額'],
  },
  '累積損失（兆円）': {
    description: '日銀の逆ザヤ（金利コスト＞国債利息）の累積。自己資本バッファを超過すると歳入に直接影響します。',
    sensitiveParams: ['ベースリスクプレミアム', '日銀自己資本バッファ', '政策金利スプレッド'],
  },
  '日銀バランスシート（兆円）': {
    description: '日銀の保有国債と当座預金の残高推移。QT（量的引き締め）で両方が縮小していきます。',
    sensitiveParams: ['QT縮小額', '当座預金下限', '保有国債'],
  },
  '金利比較（%）': {
    description: '実効市場金利・平均クーポン・日銀保有利回り・名目成長率の比較。金利＞成長率だと債務が発散しやすいです。',
    sensitiveParams: ['ベースリスクプレミアム', '財政リスク感応度', 'インフレ率'],
  },
  '財政リスクプレミアム加算（%）': {
    description: '利払負担率が閾値を超えた場合に市場金利に加算されるペナルティ。市場の財政不信を表します。',
    sensitiveParams: ['財政リスク感応度', '利払負担率閾値', 'ベースリスクプレミアム'],
  },
  '税収構成比（%）': {
    description: '消費税・所得税・法人税・その他税が税収全体に占める割合。構造変化を可視化します。',
    sensitiveParams: ['実質成長率', 'インフレ率', '消費税率'],
  },
  '支出構成比（%）': {
    description: '歳出に占める政策経費と利払い費の割合。利払い比率が増えると政策の自由度が低下します。',
    sensitiveParams: ['ベースリスクプレミアム', '政策的経費', 'インフレ率'],
  },
}

function HelpIcon({ help }: { help: ChartHelpInfo }) {
  const [show, setShow] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const iconRef = useRef<HTMLSpanElement>(null);

  const handleEnter = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      const tooltipWidth = 280;
      const tooltipHeight = 120;
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      if (left < 8) left = 8;
      if (left + tooltipWidth > window.innerWidth - 8) left = window.innerWidth - tooltipWidth - 8;
      const showBelow = rect.top < tooltipHeight + 16;
      const top = showBelow ? rect.bottom + 8 : rect.top - tooltipHeight - 8;
      setStyle({ position: 'fixed', top, left, transform: 'none' });
    }
    setShow(true);
  };

  return (
    <>
      <span
        ref={iconRef}
        className="chart-help-icon"
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
      >
        ?
      </span>
      {show && ReactDOM.createPortal(
        <div className="chart-help-tooltip chart-help-tooltip-visible" style={style}>
          <span className="chart-help-desc">{help.description}</span>
          <span className="chart-help-params-label">感度の高いパラメータ:</span>
          {help.sensitiveParams.map((p, i) => (
            <span key={i} className="chart-help-param-tag">{p}</span>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

function ChartSubtitle({ title }: { title: string }) {
  const help = CHART_HELP[title]
  if (!help) return <div className="chart-subtitle">{title}</div>
  return (
    <div className="chart-subtitle">
      {title}
      <HelpIcon help={help} />
    </div>
  )
}

function ChartTitleWithHelp({ title }: { title: string }) {
  const help = CHART_HELP[title]
  if (!help) return <div className="chart-title">{title}</div>
  return (
    <div className="chart-title">
      {title}
      <HelpIcon help={help} />
    </div>
  )
}

function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="collapsible">
      <div className="collapsible-header" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <span className={`collapsible-arrow ${open ? 'open' : ''}`}>▼</span>
      </div>
      {open && <div className="collapsible-content">{children}</div>}
    </div>
  )
}

function fmt(v: number, decimals = 1): string {
  return v.toFixed(decimals)
}

export function SimulationTab({ params, simData, actualData, childAge2026, scenarioIndex }: Props) {
  const [tableView, setTableView] = useState<'5year' | 'full' | 'actual' | 'combined'>('combined')
  const [logScaleHousehold, setLogScaleHousehold] = useState(false)

  const interestBurdenData = useMemo(() => {
    const actual = actualData.map(d => ({ year: d.year, 利払負担率: d.interestBurden }))
    const sim = simData.map(d => ({ year: d.year, 利払負担率: parseFloat(d.interestBurden.toFixed(1)) }))
    return fillYearGaps([...actual, ...sim])
  }, [actualData, simData])

  const fiscalBalanceData = useMemo(() => {
    const actual = actualData.map(d => ({ year: d.year, 財政収支: d.fiscalBalance }))
    const sim = simData.map(d => ({ year: d.year, 財政収支: parseFloat(d.fiscalBalance.toFixed(1)) }))
    return fillYearGaps([...actual, ...sim])
  }, [actualData, simData])

  const debtData = useMemo(() => {
    const actual = actualData.map(d => ({ year: d.year, 債務残高: d.debt }))
    const sim = simData.map(d => ({ year: d.year, 債務残高: Math.round(d.debt) }))
    return fillYearGaps([...actual, ...sim])
  }, [actualData, simData])

  const revenueData = useMemo(() => {
    const actual = actualData.map(d => ({
      year: d.year, 消費税: d.taxConsumption, 所得税: d.taxIncome, 法人税: d.taxCorporate, その他税: d.taxOther,
      利息純収入: d.interest < 0 ? parseFloat(Math.abs(d.interest).toFixed(1)) : 0
    }))
    const sim = simData.map(d => ({
      year: d.year, 消費税: parseFloat(d.taxConsumption.toFixed(1)), 所得税: parseFloat(d.taxIncome.toFixed(1)),
      法人税: parseFloat(d.taxCorporate.toFixed(1)), その他税: parseFloat(d.taxOther.toFixed(1)),
      利息純収入: d.interest < 0 ? parseFloat(Math.abs(d.interest).toFixed(1)) : 0
    }))
    return fillYearGaps([...actual, ...sim])
  }, [actualData, simData])

  const revenueRatioData = useMemo(() => {
    const toRatio = (d: { 消費税: number; 所得税: number; 法人税: number; その他税: number }) => {
      const total = d.消費税 + d.所得税 + d.法人税 + d.その他税
      if (total === 0) return { 消費税: 0, 所得税: 0, 法人税: 0, その他税: 0 }
      return {
        消費税: parseFloat((d.消費税 / total * 100).toFixed(1)),
        所得税: parseFloat((d.所得税 / total * 100).toFixed(1)),
        法人税: parseFloat((d.法人税 / total * 100).toFixed(1)),
        その他税: parseFloat((d.その他税 / total * 100).toFixed(1)),
      }
    }
    const actual = actualData.map(d => ({ year: d.year, ...toRatio({ 消費税: d.taxConsumption, 所得税: d.taxIncome, 法人税: d.taxCorporate, その他税: d.taxOther }) }))
    const sim = simData.map(d => ({ year: d.year, ...toRatio({ 消費税: d.taxConsumption, 所得税: d.taxIncome, 法人税: d.taxCorporate, その他税: d.taxOther }) }))
    return fillYearGaps([...actual, ...sim])
  }, [actualData, simData])

  const expenditureData = useMemo(() => {
    const actual = actualData.map(d => ({ year: d.year, 政策経費: d.policyExp, 利払い費: Math.max(d.interest, 0) }))
    const sim = simData.map(d => ({
      year: d.year, 政策経費: parseFloat(d.policyExp.toFixed(1)), 利払い費: parseFloat(Math.max(d.interest, 0).toFixed(1))
    }))
    return fillYearGaps([...actual, ...sim])
  }, [actualData, simData])

  const expenditureRatioData = useMemo(() => {
    const actual = actualData.map(d => {
      const effectiveInterest = Math.max(d.interest, 0)
      const total = d.policyExp + effectiveInterest
      if (total === 0) return { year: d.year, 政策経費: 0, 利払い費: 0 }
      return { year: d.year, 政策経費: parseFloat((d.policyExp / total * 100).toFixed(1)), 利払い費: parseFloat((effectiveInterest / total * 100).toFixed(1)) }
    })
    const sim = simData.map(d => {
      const effectiveInterest = Math.max(d.interest, 0)
      const total = d.policyExp + effectiveInterest
      if (total === 0) return { year: d.year, 政策経費: 0, 利払い費: 0 }
      return { year: d.year, 政策経費: parseFloat((d.policyExp / total * 100).toFixed(1)), 利払い費: parseFloat((effectiveInterest / total * 100).toFixed(1)) }
    })
    return fillYearGaps([...actual, ...sim])
  }, [actualData, simData])

  const expBreakdownData = useMemo(() => {
    const sim = simData.map(d => ({
      year: d.year,
      社会保障: parseFloat(d.socialSecurity.toFixed(1)),
      子育て支援: parseFloat(d.childcare.toFixed(1)),
      地方交付税: parseFloat(d.localGovTransfer.toFixed(1)),
      防衛: parseFloat(d.defense.toFixed(1)),
      その他政策: parseFloat(d.otherPolicyExp.toFixed(1)),
      エネルギー補助金: parseFloat(d.energySubsidy.toFixed(1)),
      利払い費: parseFloat(Math.max(d.interest, 0).toFixed(1)),
    }))
    return fillYearGaps(sim)
  }, [simData])

  const budgetCompositionData = useMemo(() => {
    const sim = simData.map(d => ({
      year: d.year,
      税収: parseFloat(d.revenueTaxRatio.toFixed(1)),
      公債金: parseFloat(d.revenueBondRatio.toFixed(1)),
      その他収入: parseFloat(d.revenueOtherRatio.toFixed(1)),
    }))
    return fillYearGaps(sim)
  }, [simData])

  const bojData = useMemo(() => {
    const actual = actualData.map(d => ({ year: d.year, '日銀純利益': (d.bojNetIncome !== undefined ? d.bojNetIncome : d.bojPayment) as number | null, '統合政府への反映額': d.bojPayment as number | null, '累積損失': null as number | null }))
    const sim = simData.map(d => ({
      year: d.year,
      '日銀純利益': parseFloat(d.bojNetIncome.toFixed(1)),
      '統合政府への反映額': parseFloat(d.bojPayment.toFixed(1)),
      '累積損失': parseFloat((-d.bojCumulativeLoss).toFixed(1)),
    }))
    return fillYearGaps([...actual, ...sim])
  }, [actualData, simData])

  const bojBSData = useMemo(() => {
    const actual = actualData.filter(d => d.bojJGB !== undefined).map(d => ({
      year: d.year,
      '保有国債': d.bojJGB!,
      '当座預金': d.bojCA!,
      '保有利回り': d.bojYield!,
    }))
    const sim = simData.map(d => ({
      year: d.year,
      '保有国債': parseFloat(d.bojJGB.toFixed(0)),
      '当座預金': parseFloat(d.bojCAActual.toFixed(0)),
      '保有利回り': parseFloat(d.bojYieldActual.toFixed(2)),
    }))
    return fillYearGaps([...actual, ...sim])
  }, [actualData, simData])

  const rateData = useMemo(() => {
    const nominalG = params.inflationRate + params.realGrowth
    const sim = simData.map(d => ({
      year: d.year,
      平均クーポン: parseFloat(d.avgCoupon.toFixed(2)),
      実効市場金利: parseFloat(d.effectiveMarketRate.toFixed(2)),
      名目成長率: parseFloat(nominalG.toFixed(2)),
      財政リスク加算: parseFloat(d.fiscalRiskPremium.toFixed(2)),
      日銀保有利回り: parseFloat(d.bojYieldActual.toFixed(2)),
    }))
    return fillYearGaps(sim)
  }, [params, simData])

  const householdData = useMemo(() => {
    const actual = actualData.map(d => ({
      year: d.year,
      貧困率: parseFloat(d.povertyRate.toFixed(1)),
      ジニ係数: parseFloat((d.giniIndex * 100).toFixed(1)),
      実質賃金伸び率: d.realWageGrowth as number | null,
    }))
    const sim = simData.map(d => ({
      year: d.year,
      貧困率: parseFloat(d.povertyRate.toFixed(1)),
      ジニ係数: parseFloat((d.giniIndex * 100).toFixed(1)),
      実質賃金伸び率: parseFloat(d.realWageGrowth.toFixed(1)) as number | null,
    }))
    return fillYearGaps([...actual, ...sim])
  }, [actualData, simData])

  const modelHouseholdData = useMemo(() => {
    const sim = simData.map(d => ({
      year: d.year,
      可処分所得変化: parseFloat(d.modelDisposableChange.toFixed(1)),
      食費増加: parseFloat(d.modelFoodCostChange.toFixed(1)),
      光熱費増加: parseFloat(d.modelEnergyCostChange.toFixed(1)),
    }))
    return fillYearGaps(sim)
  }, [simData])

  const householdHasNonPositive = useMemo(() => {
    return modelHouseholdData.some(d =>
      (d.可処分所得変化 !== null && d.可処分所得変化 <= 0) ||
      (d.食費増加 !== null && d.食費増加 <= 0) ||
      (d.光熱費増加 !== null && d.光熱費増加 <= 0)
    )
  }, [modelHouseholdData])

  const incomeRatioData = useMemo(() => {
    const actual = actualData.map(d => ({
      year: d.year,
      所得格差倍率: parseFloat(((1 + d.giniIndex) / (1 - d.giniIndex)).toFixed(2)),
      ジニ係数: parseFloat(d.giniIndex.toFixed(3)),
    }))
    const sim = simData.map(d => ({
      year: d.year,
      所得格差倍率: parseFloat(d.incomeRatio.toFixed(2)),
      ジニ係数: parseFloat(d.giniIndex.toFixed(3)),
    }))
    return fillYearGaps([...actual, ...sim])
  }, [actualData, simData])

  const modelSummaryData = useMemo(() => {
    const sim = simData.map(d => ({
      year: d.year,
      名目年収: parseFloat(d.modelIncome.toFixed(0)),
      可処分所得: parseFloat(d.modelDisposable.toFixed(0)),
      食費: parseFloat(d.modelFoodCost.toFixed(0)),
      光熱費: parseFloat(d.modelEnergyCost.toFixed(0)),
    }))
    return fillYearGaps(sim)
  }, [simData])

  const tradeData = useMemo(() => {
    const actual = actualData.map(d => ({
      year: d.year,
      輸出: parseFloat(d.exportAmount.toFixed(1)),
      輸入: parseFloat(d.importAmount.toFixed(1)),
      貿易収支: parseFloat(d.tradeBalance.toFixed(1)),
    }))
    const sim = simData.map(d => ({
      year: d.year,
      輸出: parseFloat(d.exportAmount.toFixed(1)),
      輸入: parseFloat(d.importAmount.toFixed(1)),
      貿易収支: parseFloat(d.tradeBalance.toFixed(1)),
    }))
    return fillYearGaps([...actual, ...sim])
  }, [actualData, simData])

  const fxData = useMemo(() => {
    const actual = actualData.map(d => ({
      year: d.year,
      為替レート: parseFloat(d.exchangeRate.toFixed(0)),
    }))
    const sim = simData.map(d => ({
      year: d.year,
      為替レート: parseFloat(d.exchangeRate.toFixed(0)),
    }))
    return fillYearGaps([...actual, ...sim])
  }, [actualData, simData])

  const nfaData = useMemo(() => {
    const actual = actualData.map(d => ({
      year: d.year,
      対外純資産: d.nfa,
      経常収支: d.currentAccount,
      通貨リスク加算: null as number | null,
    }))
    const sim = simData.map(d => ({
      year: d.year,
      対外純資産: parseFloat(d.nfa.toFixed(0)),
      経常収支: parseFloat(d.currentAccount.toFixed(1)),
      通貨リスク加算: parseFloat(d.dynamicRiskPremium.toFixed(1)),
    }))
    return fillYearGaps([...actual, ...sim])
  }, [actualData, simData])

  const gdpData = useMemo(() => {
    const actual = actualData.filter(d => d.nominalGDP !== undefined).map(d => ({
      year: d.year,
      名目GDP: parseFloat((d.nominalGDP! / 1).toFixed(0)),
      債務GDP比: null as number | null,
      内部留保GDP比: null as number | null,
    }))
    const sim = simData.map(d => ({
      year: d.year,
      名目GDP: parseFloat(d.nominalGDP.toFixed(0)),
      債務GDP比: parseFloat(d.debtToGDP.toFixed(1)),
      内部留保GDP比: parseFloat(d.retainedToGDP.toFixed(1)),
    }))
    return fillYearGaps([...actual, ...sim])
  }, [actualData, simData])

  const summaryWarnings = useMemo(() => computeWarnings(simData, params), [simData, params])

  const summaryStats = useMemo(() => {
    const last = simData[simData.length - 1]
    const first = simData[0]
    const interestBurdenExceedYear = simData.find(d => d.interestBurden > 30)?.year
    const currentAccountDeficitYear = simData.find(d => d.currentAccount < 0)?.year
    const bojInsolvencyYear = simData.find(d => d.bojCumulativeLoss > params.bojCapitalBuffer)?.year
    const currencycrisisYear = simData.find(d => d.dynamicRiskPremium > 0)?.year
    let consecutiveNeg = 0
    let realWage3YearNegYear: number | undefined
    for (const d of simData) {
      if (d.realWageGrowth < 0) { consecutiveNeg++ } else { consecutiveNeg = 0 }
      if (consecutiveNeg >= 3 && !realWage3YearNegYear) { realWage3YearNegYear = d.year; break }
    }

    const initCoupon = params.initAvgCoupon
    const couponDouble = simData.find(d => d.avgCoupon >= initCoupon * 2)?.year
    const couponTriple = simData.find(d => d.avgCoupon >= initCoupon * 3)?.year

    const nfaDepletionYear = simData.find(d => d.nfa <= 0)?.year
    const persistentCADeficit = (() => {
      let count = 0
      for (const d of simData) {
        if (d.currentAccount < 0) { count++ } else { count = 0 }
        if (count >= 3) return d.year
      }
      return undefined
    })()

    let rwConsecutiveNeg = 0
    const realWageLongStag: { start?: number; end?: number } = {}
    for (const d of simData) {
      if (d.realWageGrowth < 0) {
        if (rwConsecutiveNeg === 0) realWageLongStag.start = d.year
        rwConsecutiveNeg++
        realWageLongStag.end = d.year
      } else {
        if (rwConsecutiveNeg >= 3) break
        rwConsecutiveNeg = 0
      }
    }
    if (rwConsecutiveNeg < 3) {
      realWageLongStag.start = undefined
      realWageLongStag.end = undefined
    }

    return {
      last, first,
      interestBurdenExceedYear, currentAccountDeficitYear,
      bojInsolvencyYear, currencycrisisYear, realWage3YearNegYear,
      couponDouble, couponTriple, nfaDepletionYear, persistentCADeficit,
      realWageLongStag,
    }
  }, [simData, params])

  const childAlerts = useMemo(() => {
    if (!simData.length) return null
    const first = simData[0]
    const last = simData[simData.length - 1]
    const initInterestBurden = first.interestBurden
    const finalInterestBurden = last.interestBurden
    const displacementScore = finalInterestBurden - initInterestBurden

    const childAgeAtEnd = childAge2026 + 29
    const childAt20Year = 2026 + (20 - childAge2026)
    const childAt30Year = 2026 + (30 - childAge2026)

    const dataAt20 = childAt20Year >= 2026 && childAt20Year <= 2055 ? simData.find(d => d.year === childAt20Year) : undefined
    const dataAt30 = childAt30Year >= 2026 && childAt30Year <= 2055 ? simData.find(d => d.year === childAt30Year) : undefined

    return { displacementScore, childAgeAtEnd, dataAt20, dataAt30, childAt20Year, childAt30Year, finalInterestBurden, initInterestBurden }
  }, [simData, childAge2026])

  const tableData = useMemo(() => {
    if (tableView === 'actual') {
      return buildActualTable()
    }
    if (tableView === 'combined') {
      return buildCombinedTable(params)
    }
    const years = tableView === '5year'
      ? simData.filter((_, i) => i % 5 === 0 || i === 29)
      : simData
    return buildSimTable(years, params)
  }, [tableView, simData, actualData, params])

  function buildActualTable() {
    const data = ACTUAL_DATA
    const years = data.map(d => d.year)
    const rows: { label: string; values: string[]; indent?: number; isActual?: boolean }[] = [
      { label: '歳入合計', values: data.map(d => fmt(d.totalRevenue)) },
      { label: '├ 税収合計', values: data.map(d => fmt(d.tax)), indent: 1 },
      { label: '│　├ 消費税', values: data.map(d => fmt(d.taxConsumption)), indent: 2 },
      { label: '│　├ 所得税', values: data.map(d => fmt(d.taxIncome)), indent: 2 },
      { label: '│　├ 法人税', values: data.map(d => fmt(d.taxCorporate)), indent: 2 },
      { label: '│　└ その他税', values: data.map(d => fmt(d.taxOther)), indent: 2 },
      { label: '├ 日銀納付金', values: data.map(d => fmt(d.bojPayment)), indent: 1 },
      { label: '│  └ 日銀純利益', values: data.map(d => d.bojNetIncome !== undefined ? fmt(d.bojNetIncome) : '―'), indent: 2 },
      { label: '│  └ 保有国債', values: data.map(d => d.bojJGB !== undefined ? fmt(d.bojJGB, 0) : '―'), indent: 2 },
      { label: '│  └ 当座預金', values: data.map(d => d.bojCA !== undefined ? fmt(d.bojCA, 0) : '―'), indent: 2 },
      { label: '│  └ 保有利回り', values: data.map(d => d.bojYield !== undefined ? fmt(d.bojYield, 2) + '%' : '―'), indent: 2 },
      { label: '└ その他収入', values: data.map(d => d.otherRevenue !== undefined ? fmt(d.otherRevenue) : fmt(d.totalRevenue - d.tax - d.bojPayment)), indent: 1 },
      { label: '─', values: years.map(() => '') },
      { label: '支出合計', values: data.map(d => fmt(d.totalCost)) },
      { label: '├ 政策経費', values: data.map(d => fmt(d.policyExp)), indent: 1 },
      { label: '│　├ 社会保障', values: data.map(d => d.socialSecurity !== undefined ? fmt(d.socialSecurity) : '―'), indent: 2 },
      { label: '│　├ 子育て支援', values: data.map(d => d.childcare !== undefined ? fmt(d.childcare) : '―'), indent: 2 },
      { label: '│　├ 地方交付税', values: data.map(d => d.localGovTransfer !== undefined ? fmt(d.localGovTransfer) : '―'), indent: 2 },
      { label: '│　├ 防衛', values: data.map(d => d.defense !== undefined ? fmt(d.defense) : '―'), indent: 2 },
      { label: '│　└ その他政策', values: data.map(d => d.otherPolicyExp !== undefined ? fmt(d.otherPolicyExp) : '―'), indent: 2 },
      { label: '└ 利払い費', values: data.map(d => fmt(d.interest)), indent: 1 },
      { label: '─', values: years.map(() => '') },
      { label: '財政収支', values: data.map(d => fmt(d.fiscalBalance)) },
      { label: '国債発行額', values: data.map(d => d.bondIssuance !== undefined ? fmt(d.bondIssuance) : '―') },
      { label: '債務残高', values: data.map(d => fmt(d.debt, 0)) },
      { label: '利払負担率 (%)', values: data.map(d => fmt(d.interestBurden)) },
      { label: '平均クーポン (%)', values: data.map(d => fmt(d.avgCoupon)) },
      { label: '─', values: years.map(() => '') },
      { label: '為替レート (円/$)', values: data.map(d => fmt(d.exchangeRate, 0)) },
      { label: '貿易収支 (兆円)', values: data.map(d => fmt(d.tradeBalance)) },
      { label: '├ 輸出', values: data.map(d => fmt(d.exportAmount)), indent: 1 },
      { label: '└ 輸入', values: data.map(d => fmt(d.importAmount)), indent: 1 },
      { label: '経常収支 (兆円)', values: data.map(d => fmt(d.currentAccount)) },
      { label: '対外純資産 (兆円)', values: data.map(d => fmt(d.nfa, 0)) },
      { label: '─', values: years.map(() => '') },
      { label: '貧困率 (%)', values: data.map(d => fmt(d.povertyRate)) },
      { label: 'ジニ係数', values: data.map(d => fmt(d.giniIndex, 3)) },
      { label: '実質賃金伸び率 (%)', values: data.map(d => fmt(d.realWageGrowth)) },
    ]
    return { years, rows, actualYearCount: 0 }
  }

  function buildCombinedTable(p: SimParams) {
    const aData = ACTUAL_DATA
    const sFiltered = simData
    const years = [...aData.map(d => d.year), ...sFiltered.map(d => d.year)]
    const actualCount = aData.length
    const rows: { label: string; values: string[]; indent?: number }[] = [
      { label: '歳入合計', values: [...aData.map(d => fmt(d.totalRevenue)), ...sFiltered.map(d => fmt(d.totalRevenue))] },
      { label: '├ 税収合計', values: [...aData.map(d => fmt(d.tax)), ...sFiltered.map(d => fmt(d.tax))], indent: 1 },
      { label: '│　├ 消費税', values: [...aData.map(d => fmt(d.taxConsumption)), ...sFiltered.map(d => fmt(d.taxConsumption))], indent: 2 },
      { label: '│　├ 所得税', values: [...aData.map(d => fmt(d.taxIncome)), ...sFiltered.map(d => fmt(d.taxIncome))], indent: 2 },
      { label: '│　├ 法人税', values: [...aData.map(d => fmt(d.taxCorporate)), ...sFiltered.map(d => fmt(d.taxCorporate))], indent: 2 },
      { label: '│　└ その他税', values: [...aData.map(d => fmt(d.taxOther)), ...sFiltered.map(d => fmt(d.taxOther))], indent: 2 },
      { label: '├ 日銀納付金', values: [...aData.map(d => fmt(d.bojPayment)), ...sFiltered.map(d => fmt(d.bojPayment))], indent: 1 },
      { label: '│  └ 日銀純利益', values: [...aData.map(d => d.bojNetIncome !== undefined ? fmt(d.bojNetIncome) : '―'), ...sFiltered.map(d => fmt(d.bojNetIncome))], indent: 2 },
      { label: '│  └ 累積損失', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.bojCumulativeLoss))], indent: 2 },
      { label: '│  └ 保有国債', values: [...aData.map(d => d.bojJGB !== undefined ? fmt(d.bojJGB, 0) : '―'), ...sFiltered.map(d => fmt(d.bojJGB, 0))], indent: 2 },
      { label: '│  └ 当座預金', values: [...aData.map(d => d.bojCA !== undefined ? fmt(d.bojCA, 0) : '―'), ...sFiltered.map(d => fmt(d.bojCAActual, 0))], indent: 2 },
      { label: '│  └ 保有利回り', values: [...aData.map(d => d.bojYield !== undefined ? fmt(d.bojYield, 2) + '%' : '―'), ...sFiltered.map(d => fmt(d.bojYieldActual, 2) + '%')], indent: 2 },
      { label: '└ その他収入', values: [...aData.map(d => d.otherRevenue !== undefined ? fmt(d.otherRevenue) : fmt(d.totalRevenue - d.tax - d.bojPayment)), ...sFiltered.map(d => fmt(d.otherRevStamp + d.otherRevGov + d.otherRevAsset + d.otherRevMisc))], indent: 1 },
      { label: '─', values: years.map(() => '') },
      { label: '支出合計', values: [...aData.map(d => fmt(d.totalCost)), ...sFiltered.map(d => fmt(d.totalCost))] },
      { label: '├ 政策経費', values: [...aData.map(d => fmt(d.policyExp)), ...sFiltered.map(d => fmt(d.policyExp))], indent: 1 },
      { label: '│　├ 社会保障', values: [...aData.map(d => d.socialSecurity !== undefined ? fmt(d.socialSecurity) : '―'), ...sFiltered.map(d => fmt(d.socialSecurity))], indent: 2 },
      { label: '│　├ 子育て支援', values: [...aData.map(d => d.childcare !== undefined ? fmt(d.childcare) : '―'), ...sFiltered.map(d => fmt(d.childcare))], indent: 2 },
      { label: '│　├ 地方交付税', values: [...aData.map(d => d.localGovTransfer !== undefined ? fmt(d.localGovTransfer) : '―'), ...sFiltered.map(d => fmt(d.localGovTransfer))], indent: 2 },
      { label: '│　├ 防衛', values: [...aData.map(d => d.defense !== undefined ? fmt(d.defense) : '―'), ...sFiltered.map(d => fmt(d.defense))], indent: 2 },
      { label: '│　├ その他政策', values: [...aData.map(d => d.otherPolicyExp !== undefined ? fmt(d.otherPolicyExp) : '―'), ...sFiltered.map(d => fmt(d.otherPolicyExp))], indent: 2 },
      { label: '│　└ エネルギー補助金', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.energySubsidy))], indent: 2 },
      { label: '└ 利払い費', values: [...aData.map(d => fmt(d.interest)), ...sFiltered.map(d => fmt(d.interest))], indent: 1 },
      { label: '─', values: years.map(() => '') },
      { label: '財政収支', values: [...aData.map(d => fmt(d.fiscalBalance)), ...sFiltered.map(d => fmt(d.fiscalBalance))] },
      { label: '国債発行額（公債金）', values: [...aData.map(d => d.bondIssuance !== undefined ? fmt(d.bondIssuance) : '―'), ...sFiltered.map(d => fmt(d.bondIssuance))] },
      { label: '公債金依存度 (%)', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.revenueBondRatio))] },
      { label: '債務残高', values: [...aData.map(d => fmt(d.debt, 0)), ...sFiltered.map(d => fmt(d.debt, 0))] },
      { label: '利払負担率 (%)', values: [...aData.map(d => fmt(d.interestBurden)), ...sFiltered.map(d => fmt(d.interestBurden))] },
      { label: '実質政策経費指数', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.realPolicyExpIndex))] },
      { label: '財政リスク加算 (%)', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.fiscalRiskPremium))] },
      { label: '─', values: years.map(() => '') },
      { label: '名目GDP (兆円)', values: [...aData.map(d => d.nominalGDP !== undefined ? fmt(d.nominalGDP, 0) : '―'), ...sFiltered.map(d => fmt(d.nominalGDP, 0))] },
      { label: '債務GDP比 (%)', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.debtToGDP))] },
      { label: '内生賃金上昇率 (%)', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.endogenousWage))] },
      { label: '内部留保GDP比 (%)', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.retainedToGDP))] },
      { label: '─', values: years.map(() => '') },
      { label: '為替レート (円/$)', values: [...aData.map(d => fmt(d.exchangeRate, 0)), ...sFiltered.map(d => fmt(d.exchangeRate, 0))] },
      { label: '貿易収支 (兆円)', values: [...aData.map(d => fmt(d.tradeBalance)), ...sFiltered.map(d => fmt(d.tradeBalance))] },
      { label: '├ 輸出', values: [...aData.map(d => fmt(d.exportAmount)), ...sFiltered.map(d => fmt(d.exportAmount))], indent: 1 },
      { label: '└ 輸入', values: [...aData.map(d => fmt(d.importAmount)), ...sFiltered.map(d => fmt(d.importAmount))], indent: 1 },
      { label: '経常収支 (兆円)', values: [...aData.map(d => fmt(d.currentAccount)), ...sFiltered.map(d => fmt(d.currentAccount))] },
      { label: '対外純資産 (兆円)', values: [...aData.map(d => fmt(d.nfa, 0)), ...sFiltered.map(d => fmt(d.nfa, 0))] },
      { label: '通貨リスク加算 (%)', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.dynamicRiskPremium))] },
      { label: '─', values: years.map(() => '') },
      { label: '貧困率 (%)', values: [...aData.map(d => fmt(d.povertyRate)), ...sFiltered.map(d => fmt(d.povertyRate))] },
      { label: 'ジニ係数', values: [...aData.map(d => fmt(d.giniIndex, 3)), ...sFiltered.map(d => fmt(d.giniIndex, 3))] },
      { label: '所得格差倍率', values: [...aData.map(d => fmt(((1+d.giniIndex)/(1-d.giniIndex)), 2) + '倍'), ...sFiltered.map(d => fmt(d.incomeRatio, 2) + '倍')] },
      { label: '実質賃金伸び率 (%)', values: [...aData.map(d => fmt(d.realWageGrowth)), ...sFiltered.map(d => fmt(d.realWageGrowth))] },
      { label: '─', values: years.map(() => '') },
      { label: 'モデル家計 (万円)', values: years.map(() => '') },
      { label: '├ 名目年収', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.modelIncome, 0))] },
      { label: '├ 可処分所得', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.modelDisposable, 0))] },
      { label: '├ 食費', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.modelFoodCost, 0))] },
      { label: '└ 光熱費', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.modelEnergyCost, 0))] },
    ]
    return { years, rows, actualYearCount: actualCount }
  }

  function buildSimTable(data: SimResult[], _p: SimParams) {
    const years = data.map(d => d.year)
    const rows: { label: string; values: string[]; indent?: number }[] = [
      { label: '歳入合計', values: data.map(d => fmt(d.totalRevenue)) },
      { label: '├ 税収合計', values: data.map(d => fmt(d.tax)), indent: 1 },
      { label: '│　├ 消費税', values: data.map(d => fmt(d.taxConsumption)), indent: 2 },
      { label: '│　├ 所得税', values: data.map(d => fmt(d.taxIncome)), indent: 2 },
      { label: '│　├ 法人税', values: data.map(d => fmt(d.taxCorporate)), indent: 2 },
      { label: '│　└ その他税', values: data.map(d => fmt(d.taxOther)), indent: 2 },
      { label: '├ 日銀納付金', values: data.map(d => fmt(d.bojPayment)), indent: 1 },
      { label: '│  └ 日銀純利益', values: data.map(d => fmt(d.bojNetIncome)), indent: 2 },
      { label: '│  └ 累積損失', values: data.map(d => fmt(d.bojCumulativeLoss)), indent: 2 },
      { label: '│  └ 保有国債', values: data.map(d => fmt(d.bojJGB, 0)), indent: 2 },
      { label: '│  └ 当座預金', values: data.map(d => fmt(d.bojCAActual, 0)), indent: 2 },
      { label: '│  └ 保有利回り', values: data.map(d => fmt(d.bojYieldActual, 2) + '%'), indent: 2 },
      { label: '└ その他収入', values: data.map(d => fmt(d.otherRevStamp + d.otherRevGov + d.otherRevAsset + d.otherRevMisc)), indent: 1 },
      { label: '　　├ 印紙収入', values: data.map(d => fmt(d.otherRevStamp)), indent: 2 },
      { label: '　　├ 官業収入', values: data.map(d => fmt(d.otherRevGov)), indent: 2 },
      { label: '　　├ 資産売却', values: data.map(d => fmt(d.otherRevAsset)), indent: 2 },
      { label: '　　└ 雑収入', values: data.map(d => fmt(d.otherRevMisc)), indent: 2 },
      { label: '─', values: years.map(() => '') },
      { label: '支出合計', values: data.map(d => fmt(d.totalCost)) },
      { label: '├ 政策経費', values: data.map(d => fmt(d.policyExp)), indent: 1 },
      { label: '│　├ 社会保障', values: data.map(d => fmt(d.socialSecurity)), indent: 2 },
      { label: '│　├ 子育て支援', values: data.map(d => fmt(d.childcare)), indent: 2 },
      { label: '│　├ 地方交付税', values: data.map(d => fmt(d.localGovTransfer)), indent: 2 },
      { label: '│　├ 防衛', values: data.map(d => fmt(d.defense)), indent: 2 },
      { label: '│　├ その他政策', values: data.map(d => fmt(d.otherPolicyExp)), indent: 2 },
      { label: '│　└ エネルギー補助金', values: data.map(d => fmt(d.energySubsidy)), indent: 2 },
      { label: '└ 利払い費', values: data.map(d => fmt(d.interest)), indent: 1 },
      { label: '　　├ 債務残高', values: data.map(d => fmt(d.debt, 0)), indent: 2 },
      { label: '　　└ 平均クーポン', values: data.map(d => fmt(d.avgCoupon, 2) + '%'), indent: 2 },
      { label: '─', values: years.map(() => '') },
      { label: '財政収支', values: data.map(d => fmt(d.fiscalBalance)) },
      { label: '国債発行額（公債金）', values: data.map(d => fmt(d.bondIssuance)) },
      { label: '公債金依存度 (%)', values: data.map(d => fmt(d.revenueBondRatio)) },
      { label: '債務残高', values: data.map(d => fmt(d.debt, 0)) },
      { label: '利払負担率 (%)', values: data.map(d => fmt(d.interestBurden)) },
      { label: '実質政策経費指数', values: data.map(d => fmt(d.realPolicyExpIndex)) },
      { label: '財政リスク加算 (%)', values: data.map(d => fmt(d.fiscalRiskPremium)) },
      { label: '─', values: years.map(() => '') },
      { label: '名目GDP (兆円)', values: data.map(d => fmt(d.nominalGDP, 0)) },
      { label: '債務GDP比 (%)', values: data.map(d => fmt(d.debtToGDP)) },
      { label: '内生賃金上昇率 (%)', values: data.map(d => fmt(d.endogenousWage)) },
      { label: '企業利益 (兆円)', values: data.map(d => fmt(d.corporateProfit)) },
      { label: '内部留保累計 (兆円)', values: data.map(d => fmt(d.retainedEarnings, 0)) },
      { label: '内部留保GDP比 (%)', values: data.map(d => fmt(d.retainedToGDP)) },
      { label: '─', values: years.map(() => '') },
      { label: '為替レート (円/$)', values: data.map(d => fmt(d.exchangeRate, 0)) },
      { label: '貿易収支 (兆円)', values: data.map(d => fmt(d.tradeBalance)) },
      { label: '├ 輸出', values: data.map(d => fmt(d.exportAmount)), indent: 1 },
      { label: '└ 輸入', values: data.map(d => fmt(d.importAmount)), indent: 1 },
      { label: '経常収支 (兆円)', values: data.map(d => fmt(d.currentAccount)) },
      { label: '対外純資産 (兆円)', values: data.map(d => fmt(d.nfa, 0)) },
      { label: '通貨リスク加算 (%)', values: data.map(d => fmt(d.dynamicRiskPremium)) },
      { label: '実効市場金利 (%)', values: data.map(d => fmt(d.effectiveMarketRate)) },
      { label: '─', values: years.map(() => '') },
      { label: '貧困率 (%)', values: data.map(d => fmt(d.povertyRate)) },
      { label: 'ジニ係数', values: data.map(d => fmt(d.giniIndex, 3)) },
      { label: '所得格差倍率', values: data.map(d => fmt(d.incomeRatio, 2) + '倍') },
      { label: '実質賃金伸び率 (%)', values: data.map(d => fmt(d.realWageGrowth)) },
      { label: '─', values: years.map(() => '') },
      { label: 'モデル家計 (万円)', values: years.map(() => '') },
      { label: '├ 名目年収', values: data.map(d => fmt(d.modelIncome, 0)), indent: 1 },
      { label: '├ 可処分所得', values: data.map(d => fmt(d.modelDisposable, 0)), indent: 1 },
      { label: '├ 食費', values: data.map(d => fmt(d.modelFoodCost, 0)), indent: 1 },
      { label: '└ 光熱費', values: data.map(d => fmt(d.modelEnergyCost, 0)), indent: 1 },
    ]
    return { years, rows, actualYearCount: 0 }
  }

  function escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  function downloadCSV(data: { years: number[]; rows: { label: string; values: string[]; indent?: number }[] }) {
    const header = ['項目', ...data.years.map(String)]
    const csvRows = [header.map(escapeCsvField).join(',')]
    for (const row of data.rows) {
      if (row.label === '─') continue
      const label = row.label.replace(/[├│└─　]/g, '').trim()
      const values = row.values.map(v => escapeCsvField(v))
      csvRows.push([escapeCsvField(label), ...values].join(','))
    }
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const viewLabel = tableView === 'combined' ? '実績予測' : tableView === '5year' ? '予測5年' : tableView === 'full' ? '予測全30年' : '実績'
    a.download = `財政シミュレーション_${viewLabel}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="summary-panel">
        <div className="summary-title">30年シミュレーション・サマリー</div>
        <div className="responsive-grid-4col">
          <div className="metric-card">
            <div className="metric-label">2055年 債務残高</div>
            <div className="metric-value">{summaryStats.last ? `${Math.round(summaryStats.last.debt).toLocaleString()}兆円` : '―'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">2055年 利払負担率</div>
            <div className="metric-value" style={{ color: (summaryStats.last?.interestBurden ?? 0) > 30 ? '#ef4444' : '#22c55e' }}>
              {summaryStats.last ? `${summaryStats.last.interestBurden.toFixed(1)}%` : '―'}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">2055年 対外純資産</div>
            <div className="metric-value" style={{ color: (summaryStats.last?.nfa ?? 0) < params.nfaThreshold ? '#ef4444' : '#22c55e' }}>
              {summaryStats.last ? `${Math.round(summaryStats.last.nfa).toLocaleString()}兆円` : '―'}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">2055年 貧困率</div>
            <div className="metric-value" style={{ color: (summaryStats.last?.povertyRate ?? 0) > 20 ? '#ef4444' : '#f97316' }}>
              {summaryStats.last ? `${summaryStats.last.povertyRate.toFixed(1)}%` : '―'}
            </div>
          </div>
        </div>

        <WarningAccordion warnings={summaryWarnings} />

        <div className="scenario-analysis-panel">
          <div className="scenario-analysis-title">📋 シナリオ分析：{SCENARIOS[scenarioIndex].name}</div>
          <div className="scenario-analysis-desc">{SCENARIOS[scenarioIndex].label}</div>
          <div className="scenario-analysis-grid">
            <div className="scenario-analysis-section merits">
              <div className="scenario-analysis-section-title">✅ メリット</div>
              <ul>
                {SCENARIOS[scenarioIndex].merits.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
            <div className="scenario-analysis-section demerits">
              <div className="scenario-analysis-section-title">⚠️ デメリット</div>
              <ul>
                {SCENARIOS[scenarioIndex].demerits.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          </div>
          <div className="scenario-analysis-section policies">
            <div className="scenario-analysis-section-title">💡 改善に向けた施策</div>
            <ol>
              {SCENARIOS[scenarioIndex].policies.map((p, i) => <li key={i}>{p}</li>)}
            </ol>
          </div>
        </div>

        {childAlerts && (
          <div className="child-alert-panel">
            <div className="child-alert-title">👶 子供の未来レポート（{childAge2026}歳 → {childAlerts.childAgeAtEnd}歳）</div>
            <div className="child-alert-grid">
              {childAlerts.dataAt20 && (
                <div className="child-alert-card">
                  <div className="child-alert-age">20歳（{childAlerts.childAt20Year}年）</div>
                  <div className="child-alert-detail">利払負担率: <strong style={{ color: childAlerts.dataAt20.interestBurden > 30 ? '#ef4444' : '#f59e0b' }}>{childAlerts.dataAt20.interestBurden.toFixed(1)}%</strong></div>
                  <div className="child-alert-detail">実質賃金: <strong style={{ color: childAlerts.dataAt20.realWageGrowth < 0 ? '#ef4444' : '#22c55e' }}>{childAlerts.dataAt20.realWageGrowth >= 0 ? '+' : ''}{childAlerts.dataAt20.realWageGrowth.toFixed(1)}%</strong></div>
                  <div className="child-alert-detail">貧困率: <strong>{childAlerts.dataAt20.povertyRate.toFixed(1)}%</strong></div>
                </div>
              )}
              {childAlerts.dataAt30 && (
                <div className="child-alert-card">
                  <div className="child-alert-age">30歳（{childAlerts.childAt30Year}年）</div>
                  <div className="child-alert-detail">利払負担率: <strong style={{ color: childAlerts.dataAt30.interestBurden > 30 ? '#ef4444' : '#f59e0b' }}>{childAlerts.dataAt30.interestBurden.toFixed(1)}%</strong></div>
                  <div className="child-alert-detail">実質賃金: <strong style={{ color: childAlerts.dataAt30.realWageGrowth < 0 ? '#ef4444' : '#22c55e' }}>{childAlerts.dataAt30.realWageGrowth >= 0 ? '+' : ''}{childAlerts.dataAt30.realWageGrowth.toFixed(1)}%</strong></div>
                  <div className="child-alert-detail">貧困率: <strong>{childAlerts.dataAt30.povertyRate.toFixed(1)}%</strong></div>
                </div>
              )}
              <div className="child-alert-card displacement">
                <div className="child-alert-age">教育・社会保障の圧迫度</div>
                <div className="child-alert-detail" style={{ fontSize: 18, fontWeight: 700, color: childAlerts.displacementScore > 10 ? '#ef4444' : '#f59e0b' }}>
                  +{childAlerts.displacementScore.toFixed(1)}pt
                </div>
                <div className="child-alert-detail" style={{ fontSize: 11, color: '#64748b' }}>
                  利払負担率の増加分（{childAlerts.initInterestBurden.toFixed(1)}% → {childAlerts.finalInterestBurden.toFixed(1)}%）が教育・社会保障を圧迫
                </div>
              </div>
            </div>
          </div>
        )}

        {(summaryStats.couponDouble || summaryStats.nfaDepletionYear || summaryStats.persistentCADeficit || summaryStats.realWageLongStag.start) && (
          <div className="principle-breach-panel">
            <div className="principle-breach-title">⚠️ 原則の崩壊（Principle Breach）</div>
            <div className="principle-breach-list">
              {summaryStats.couponDouble && (
                <div className="principle-breach-item">
                  <span className="breach-icon">📈</span>
                  <div>
                    <strong>低金利神話の崩壊</strong>
                    <p>平均クーポンが初期値（{params.initAvgCoupon.toFixed(1)}%）の2倍に到達: <strong>{summaryStats.couponDouble}年</strong>
                    {summaryStats.couponTriple && <span>、3倍に到達: <strong>{summaryStats.couponTriple}年</strong></span>}</p>
                  </div>
                </div>
              )}
              {(summaryStats.nfaDepletionYear || summaryStats.persistentCADeficit) && (
                <div className="principle-breach-item">
                  <span className="breach-icon">🛡️</span>
                  <div>
                    <strong>対外ポジションの悪化</strong>
                    <p>{summaryStats.nfaDepletionYear && <span>対外純資産が枯渇: <strong>{summaryStats.nfaDepletionYear}年</strong>。</span>}
                    {summaryStats.persistentCADeficit && <span>経常赤字が3年以上定着: <strong>{summaryStats.persistentCADeficit}年</strong></span>}</p>
                  </div>
                </div>
              )}
              {summaryStats.realWageLongStag.start && (
                <div className="principle-breach-item">
                  <span className="breach-icon">💰</span>
                  <div>
                    <strong>実質賃金の長期低迷</strong>
                    <p>実質賃金が3年以上連続マイナス: <strong>{summaryStats.realWageLongStag.start}年 〜 {summaryStats.realWageLongStag.end}年</strong></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="chart-container">
        <ChartTitleWithHelp title="利払い負担率の推移 （税収に対する利払い費の割合）" />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={interestBurdenData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="5 5" label={{ value: '警戒ライン30%', fill: '#ef4444', fontSize: 11 }} />
            <Bar dataKey="利払負担率" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <ChartTitleWithHelp title="財政収支の推移 （歳入 − 歳出）" />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fiscalBalanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Bar dataKey="財政収支" fill={(entry: Record<string, unknown>) => ((entry as {財政収支: number}).財政収支 >= 0 ? '#22c55e' : '#ef4444')} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <ChartTitleWithHelp title="債務残高の推移" />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={debtData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} decimals={0} />} />
            <Bar dataKey="債務残高" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Collapsible title="家計への影響（貧困率・ジニ係数・実質賃金）" defaultOpen={true}>
        <ChartSubtitle title="貧困率の推移（%）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={householdData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <Bar dataKey="貧困率" fill="#ef4444" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="ジニ係数の推移（x100）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={householdData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<NoDataTooltip childAge2026={childAge2026} />} />
            <Bar dataKey="ジニ係数" fill="#8b5cf6"  opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="実質賃金伸び率（%）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={householdData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Bar dataKey="実質賃金伸び率" fill="#22c55e" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </Collapsible>

      <Collapsible title="家計の実感（モデル家計：年収中央値400万円）" defaultOpen={true}>
        <div className="chart-note" style={{ marginBottom: 8, textAlign: 'left', fontSize: 12, color: '#64748b' }}>
          年収400万円（中央値）の家計を想定。税・社会保険料30%、食費25.5%（エンゲル係数）、光熱費7.3%で計算。2026年との差額を表示。
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
          <ChartSubtitle title="可処分所得と生活費の変化（万円/年）" />
          <button
            onClick={() => setLogScaleHousehold(!logScaleHousehold)}
            style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 4,
              border: '1px solid #cbd5e1', cursor: 'pointer',
              background: logScaleHousehold ? '#3b82f6' : '#f1f5f9',
              color: logScaleHousehold ? '#fff' : '#475569',
            }}
          >
            {logScaleHousehold ? '対数' : '線形'}
          </button>
        </div>
        {logScaleHousehold && householdHasNonPositive && (
          <div style={{ fontSize: 11, color: '#dc2626', textAlign: 'center', marginBottom: 4 }}>
            ⚠ 0以下の値を含むため対数スケールを適用できません（線形表示中）
          </div>
        )}
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={modelHouseholdData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              unit="万円"
              scale={(logScaleHousehold && !householdHasNonPositive) ? 'log' : 'auto'}
              domain={(logScaleHousehold && !householdHasNonPositive) ? ['auto', 'auto'] : undefined}
              allowDataOverflow={(logScaleHousehold && !householdHasNonPositive)}
            />
            <Tooltip content={<NoDataTooltip unit=" 万円" childAge2026={childAge2026} />} />
            <Legend />
            {!(logScaleHousehold && !householdHasNonPositive) && <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />}
            <Bar dataKey="食費増加" fill="#f97316" opacity={0.7} stackId="cost" />
            <Bar dataKey="光熱費増加" fill="#ef4444" opacity={0.7} stackId="cost" />
            <Bar dataKey="可処分所得変化" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="所得格差倍率（上位20%÷下位20%）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={incomeRatioData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="倍" />
            <Tooltip content={<NoDataTooltip unit="倍" childAge2026={childAge2026} decimals={2} />} />
            <Bar dataKey="所得格差倍率" fill="#8b5cf6" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
        {simData.length > 0 && (() => {
          const d2035 = simData.find(d => d.year === 2035)
          const d2055 = simData[simData.length - 1]
          const first = simData[0]
          return (
            <div className="responsive-grid-4col">
              <div className="metric-card">
                <div className="metric-label">2035年 可処分所得変化</div>
                <div className="metric-value" style={{ color: (d2035?.modelDisposableChange ?? 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                  {(d2035?.modelDisposableChange ?? 0) >= 0 ? '+' : ''}{(d2035?.modelDisposableChange ?? 0).toFixed(1)}万円
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">{d2055.year}年 可処分所得変化</div>
                <div className="metric-value" style={{ color: d2055.modelDisposableChange >= 0 ? '#22c55e' : '#ef4444' }}>
                  {d2055.modelDisposableChange >= 0 ? '+' : ''}{d2055.modelDisposableChange.toFixed(1)}万円
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">所得格差倍率（初年度）</div>
                <div className="metric-value">{first.incomeRatio.toFixed(2)}倍</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">所得格差倍率（{d2055.year}年）</div>
                <div className="metric-value" style={{ color: d2055.incomeRatio > first.incomeRatio ? '#ef4444' : '#22c55e' }}>
                  {d2055.incomeRatio.toFixed(2)}倍
                </div>
              </div>
            </div>
          )
        })()}
        <Collapsible title="モデル家計の詳細推移（年収・可処分所得・食費・光熱費）">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={modelSummaryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                unit="万円"
                scale={logScaleHousehold ? 'log' : 'auto'}
                domain={logScaleHousehold ? ['auto', 'auto'] : undefined}
                allowDataOverflow={logScaleHousehold}
              />
              <Tooltip content={<NoDataTooltip unit=" 万円" childAge2026={childAge2026} decimals={0} />} />
              <Legend />
              <Bar dataKey="名目年収" fill="#3b82f6" />
              <Bar dataKey="可処分所得" fill="#22c55e" />
              <Bar dataKey="食費" fill="#f97316" />
              <Bar dataKey="光熱費" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </Collapsible>
      </Collapsible>

      <Collapsible title="貿易収支・為替レート" defaultOpen={true}>
        <ChartSubtitle title="貿易収支の推移" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={tradeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <Legend />
            <Bar dataKey="輸出" fill="#22c55e" opacity={0.6} />
            <Bar dataKey="輸入" fill="#ef4444" opacity={0.6} />
            <Bar dataKey="貿易収支" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="為替レートの推移" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={fxData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="円/$" />
            <Tooltip content={<NoDataTooltip unit=" 円/$" childAge2026={childAge2026} decimals={0} />} />
            <Bar dataKey="為替レート" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </Collapsible>

      <Collapsible title="対外純資産・経常収支" defaultOpen={true}>
        <ChartSubtitle title="対外純資産の推移" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={nfaData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} decimals={0} />} />
            <ReferenceLine y={params.nfaThreshold} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `防衛ライン${params.nfaThreshold}兆円`, fill: '#ef4444', fontSize: 10 }} />
            <Bar dataKey="対外純資産" fill="#3b82f6" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="経常収支の推移（兆円）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={nfaData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Bar dataKey="経常収支" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="通貨リスクプレミアム加算（%）" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={nfaData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <Bar dataKey="通貨リスク加算" fill="#ef4444" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-note">
          経常収支 = 貿易収支 + 所得収支（NFA×3%）。経常赤字＋NFA防衛ライン割れで通貨リスクプレミアムが金利に自動加算されます。
        </div>
      </Collapsible>

      <Collapsible title="GDP・企業セクター">
        <ChartSubtitle title="名目GDP（兆円）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={gdpData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <Bar dataKey="名目GDP" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="債務残高GDP比・内部留保GDP比（%）" />
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={gdpData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <Legend />
            <Line type="monotone" dataKey="債務GDP比" stroke="#ef4444" dot={false} strokeWidth={2} connectNulls />
            <Line type="monotone" dataKey="内部留保GDP比" stroke="#f59e0b" dot={false} strokeWidth={2} connectNulls />
          </LineChart>
        </ResponsiveContainer>
        <div className="chart-note">
          債務GDP比は政府債務の対GDP比率。内部留保GDP比は企業の累積内部留保の対GDP比率。内部留保が大きいほど企業が賃金に分配していないことを示します。
        </div>
      </Collapsible>

      <Collapsible title="歳入合計・税収内訳">
        <ChartSubtitle title="税収内訳・歳入（兆円）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <Legend />
            <Bar dataKey="消費税" stackId="a" fill="#3b82f6" />
            <Bar dataKey="所得税" stackId="a" fill="#22c55e" />
            <Bar dataKey="法人税" stackId="a" fill="#f97316" />
            <Bar dataKey="その他税" stackId="a" fill="#8b5cf6" />
            <Bar dataKey="利息純収入" stackId="a" fill="#ec4899" />
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-note">
          利払い費がマイナス（統合政府として利息収入が支出を上回る）の場合、歳出側から除外し「利息純収入」として歳入に計上しています
        </div>
        <ChartSubtitle title="税収構成比（%）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueRatioData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <Legend />
            <Bar dataKey="消費税" stackId="a" fill="#3b82f6" />
            <Bar dataKey="所得税" stackId="a" fill="#22c55e" />
            <Bar dataKey="法人税" stackId="a" fill="#f97316" />
            <Bar dataKey="その他税" stackId="a" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </Collapsible>

      <Collapsible title="予算構成・歳出内訳">
        <ChartSubtitle title="歳入の財源構成（%）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={budgetCompositionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <Legend />
            <Bar dataKey="税収" stackId="a" fill="#22c55e" />
            <Bar dataKey="公債金" stackId="a" fill="#ef4444" />
            <Bar dataKey="その他収入" stackId="a" fill="#94a3b8" />
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-note">
          歳入全体（税収＋公債金＋その他収入）に占める割合。公債金（国債発行）依存度が高いほど財政の持続可能性リスクが高まります
        </div>
        <ChartSubtitle title="歳出分野別内訳（兆円）" />
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={expBreakdownData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <Legend />
            <Bar dataKey="社会保障" stackId="a" fill="#3b82f6" />
            <Bar dataKey="子育て支援" stackId="a" fill="#a855f7" />
            <Bar dataKey="地方交付税" stackId="a" fill="#f59e0b" />
            <Bar dataKey="防衛" stackId="a" fill="#6b7280" />
            <Bar dataKey="その他政策" stackId="a" fill="#06b6d4" />
            <Bar dataKey="エネルギー補助金" stackId="a" fill="#84cc16" />
            <Bar dataKey="利払い費" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="支出構成比（%）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={expenditureRatioData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <Legend />
            <Bar dataKey="政策経費" stackId="a" fill="#3b82f6" />
            <Bar dataKey="利払い費" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </Collapsible>

      <Collapsible title="日銀収支（統合政府への影響）">
        <ChartSubtitle title="日銀純利益（兆円）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bojData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Bar dataKey="日銀純利益" fill="#94a3b8" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="統合政府への反映額（兆円）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bojData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Bar dataKey="統合政府への反映額" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="累積損失（兆円）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bojData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <ReferenceLine y={-params.bojCapitalBuffer} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `バッファ-${params.bojCapitalBuffer}兆`, fill: '#ef4444', fontSize: 9 }} />
            <Bar dataKey="累積損失" fill="#ef4444" opacity={0.6} />
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-note">
          逆ザヤ時（純利益マイナス）の累積損失が自己資本バッファ（{params.bojCapitalBuffer}兆円）を超えると、マイナスが歳入を直接減少させます
        </div>
        <ChartSubtitle title="日銀バランスシート（兆円）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bojBSData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <Bar dataKey="保有国債" fill="#3b82f6" opacity={0.7} />
            <Bar dataKey="当座預金" fill="#f59e0b" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </Collapsible>

      <Collapsible title="金利・成長率・リスクプレミアム">
        <ChartSubtitle title="金利比較（%）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={rateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <Legend />
            <Bar dataKey="実効市場金利" fill="#3b82f6" />
            <Bar dataKey="平均クーポン" fill="#ef4444" />
            <Bar dataKey="日銀保有利回り" fill="#f59e0b" />
            <Bar dataKey="名目成長率" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="財政リスクプレミアム加算（%）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={rateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <Bar dataKey="財政リスク加算" fill="#ef4444" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </Collapsible>

      <h2 className="section-title" style={{ marginTop: 24 }}>データ表</h2>
      <div className="view-toggle">
        <button className={tableView === 'combined' ? 'active' : ''} onClick={() => setTableView('combined')}>実績+予測</button>
        <button className={tableView === '5year' ? 'active' : ''} onClick={() => setTableView('5year')}>予測5年おき</button>
        <button className={tableView === 'full' ? 'active' : ''} onClick={() => setTableView('full')}>予測全30年</button>
        <button className={tableView === 'actual' ? 'active' : ''} onClick={() => setTableView('actual')}>実績のみ</button>
        <button className="csv-download-btn" onClick={() => downloadCSV(tableData)}>📥 CSV</button>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>項目</th>
              {tableData.years.map((y, j) => {
                const isActual = tableData.actualYearCount ? j < tableData.actualYearCount : tableView === 'actual'
                return <th key={`${y}-${j}`} className={isActual ? 'actual-col' : ''}>{y}</th>
              })}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, i) => {
              if (row.label === '─') {
                return <tr key={i} className="separator-row"><td colSpan={tableData.years.length + 1}></td></tr>
              }
              return (
                <tr key={i}>
                  <td className={row.indent === 1 ? 'indent-1' : row.indent === 2 ? 'indent-2' : 'bold-label'}>
                    {row.label}
                  </td>
                  {row.values.map((v, j) => {
                    const isActual = tableData.actualYearCount ? j < tableData.actualYearCount : tableView === 'actual'
                    return <td key={j} className={isActual ? 'actual-col' : ''}>{v}</td>
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {tableView === 'combined' && (
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, textAlign: 'center' }}>
          🔵 水色背景 = 実績データ ／ 白背景 = シミュレーション
        </div>
      )}
    </div>
  )
}
