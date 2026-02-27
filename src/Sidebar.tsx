import { useState, useRef, useCallback, useMemo } from 'react'
import { SCENARIOS, ACTUAL_MACRO, type SimParams, type Constraints, type Constraint } from './data'
import { OPTIMIZABLE_PARAMS, runOptimizer, countWarnings, type OptimizerProgress } from './optimizer'
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts'

interface SidebarProps {
  params: SimParams;
  scenarioIndex: number;
  onScenarioChange: (index: number) => void;
  onParamChange: <K extends keyof SimParams>(key: K, value: SimParams[K]) => void;
  onParamsReplace: (params: SimParams) => void;
  isOpen: boolean;
  constraints: Constraints;
  onConstraintsChange: (c: Constraints) => void;
  childAge2026: number;
  onChildAgeChange: (age: number) => void;
}

function Slider({ label, value, min, max, step, tooltip, onChange, searchHidden }: {
  label: string; value: number; min: number; max: number; step: number;
  tooltip?: string; onChange: (v: number) => void; searchHidden?: boolean;
}) {
  const decimals = step < 0.01 ? 3 : step < 0.1 ? 2 : step < 1 ? 1 : 0

  if (searchHidden) return null

  return (
    <div className="slider-group">
      <div className="slider-label-row">
        <label>
          {label}
          {tooltip && (
            <span className="tooltip-icon">
              ?<span className="tooltip-text">{tooltip}</span>
            </span>
          )}
        </label>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
      <input
        type="number"
        className="slider-number-input"
        value={parseFloat(value.toFixed(decimals))}
        step={step}
        min={min}
        max={max}
        onChange={e => {
          const v = parseFloat(e.target.value)
          if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
        }}
      />
    </div>
  )
}

function NumberInput({ label, value, step, tooltip, onChange, searchHidden }: {
  label: string; value: number; step: number;
  tooltip?: string; onChange: (v: number) => void; searchHidden?: boolean;
}) {
  if (searchHidden) return null
  return (
    <div className="number-input-group">
      <label>
        {label}
        {tooltip && (
          <span className="tooltip-icon">
            ?<span className="tooltip-text">{tooltip}</span>
          </span>
        )}
      </label>
      <input
        type="number"
        value={value}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  )
}

function SidebarSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <span className={`collapsible-arrow ${open ? 'open' : ''}`}>▼</span>
      </div>
      {open && <div className="sidebar-section-content">{children}</div>}
    </div>
  )
}

export function Sidebar({ params, scenarioIndex, onScenarioChange, onParamChange, onParamsReplace, isOpen, onClose, constraints, onConstraintsChange, childAge2026, onChildAgeChange }: SidebarProps & { onClose?: () => void }) {
  const p = params;
  const taxTotal = p.initTaxConsumption + p.initTaxIncome + p.initTaxCorporate + p.initTaxOther;
  const [searchQuery, setSearchQuery] = useState('')

  const matchesSearch = useCallback((label: string, tooltip?: string) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return label.toLowerCase().includes(q) || (tooltip?.toLowerCase().includes(q) ?? false)
  }, [searchQuery])

  const sh = useCallback((label: string, tooltip?: string) => {
    if (!searchQuery) return false
    return !matchesSearch(label, tooltip)
  }, [searchQuery, matchesSearch])

  const [sectionParamsOpen, setSectionParamsOpen] = useState(true)
  const [sectionInitOpen, setSectionInitOpen] = useState(true)
  const [sectionOptOpen, setSectionOptOpen] = useState(true)

  const [selectedOptKeys, setSelectedOptKeys] = useState<Set<string>>(
    () => new Set(OPTIMIZABLE_PARAMS.slice(0, 5).map(p => p.key))
  )
  const [optimizerProgress, setOptimizerProgress] = useState<OptimizerProgress | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [baselineWarnings, setBaselineWarnings] = useState<number | null>(null)
  const cancelRef = useRef<(() => void) | null>(null)

  const toggleOptKey = useCallback((key: string) => {
    setSelectedOptKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const updateConstraint = useCallback((key: keyof Constraints, field: keyof Constraint, value: boolean | number) => {
    onConstraintsChange({
      ...constraints,
      [key]: { ...constraints[key], [field]: value },
    })
  }, [constraints, onConstraintsChange])

  const hasActiveConstraints = useMemo(() =>
    Object.values(constraints).some(c => c.enabled), [constraints])

  const startOptimizer = useCallback(() => {
    if (isOptimizing) {
      cancelRef.current?.()
      setIsOptimizing(false)
      return
    }
    const keys = Array.from(selectedOptKeys) as (keyof SimParams)[]
    if (keys.length === 0) return
    setIsOptimizing(true)
    setOptimizerProgress(null)
    const activeConstraints = hasActiveConstraints ? constraints : undefined
    setBaselineWarnings(countWarnings(params, activeConstraints))
    const { cancel } = runOptimizer(params, keys, (progress) => {
      setOptimizerProgress(progress)
      if (progress.done) {
        setIsOptimizing(false)
      }
    }, activeConstraints)
    cancelRef.current = cancel
  }, [params, selectedOptKeys, isOptimizing, constraints, hasActiveConstraints])

  const applyOptResult = useCallback(() => {
    if (optimizerProgress?.bestParams) {
      onParamsReplace(optimizerProgress.bestParams)
    }
  }, [optimizerProgress, onParamsReplace])

  const activeConstraints = useMemo(() => hasActiveConstraints ? constraints : undefined, [constraints, hasActiveConstraints])
  const currentWarnings = useMemo(() => countWarnings(params, activeConstraints), [params, activeConstraints])

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {onClose && (
        <button className="sidebar-close" onClick={onClose}>✕</button>
      )}

      <h3>シナリオ選択</h3>
      <select
        value={scenarioIndex}
        onChange={e => onScenarioChange(parseInt(e.target.value))}
      >
        {SCENARIOS.map((s, i) => (
          <option key={i} value={i}>{s.name}</option>
        ))}
      </select>
      <p className="scenario-caption">{SCENARIOS[scenarioIndex].label}</p>

      <div className="param-search-box">
        <input
          type="text"
          placeholder="🔍 パラメータを検索..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="param-search-input"
        />
        {searchQuery && (
          <button className="param-search-clear" onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      <div className="sidebar-divider-label" onClick={() => setSectionParamsOpen(v => !v)}>
        {sectionParamsOpen ? '▼' : '▶'} パラメータ（調整値）
      </div>

      {sectionParamsOpen && <><div className="child-age-section">
        <h4>👶 子供の年齢トラッカー</h4>
        <Slider label="2026年時点の年齢" value={childAge2026} min={0} max={20} step={1}
          tooltip="お子さんの2026年時点の年齢を入力すると、グラフ上で各年度にお子さんが何歳かを確認できます。"
          onChange={v => onChildAgeChange(v)}
          searchHidden={sh("2026年時点の年齢", "子供")} />
        <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
          → {2025 + (p.simYears || 30)}年に{childAge2026 + (p.simYears || 30) - 1}歳
        </p>
      </div>

      <SidebarSection title="マクロ前提">
        <label>シミュレーション年数</label>
        <select
          value={p.simYears}
          onChange={e => onParamChange('simYears', parseInt(e.target.value))}
        >
          {[30, 40, 50].map(y => (
            <option key={y} value={y}>{y}年（〜{2026 + y - 1}年）</option>
          ))}
        </select>
      </SidebarSection>

      <SidebarSection title="マクロ経済">
        <Slider label="インフレ率 (%)" value={p.inflationRate} min={0} max={10} step={0.1}
          tooltip="消費者物価の年間上昇率。政策経費の伸びと名目成長率に影響します。日銀の目標は2%です。"
          onChange={v => onParamChange('inflationRate', v)} searchHidden={sh("インフレ率 (%)", "消費者物価の年間上昇率")} />
        <Slider label="実質成長率 (%)" value={p.realGrowth} min={-2} max={5} step={0.1}
          tooltip="物価変動を除いた実質GDPの成長率。インフレ率と合算して名目成長率となり、税収の伸びに直結します。"
          onChange={v => onParamChange('realGrowth', v)} searchHidden={sh("実質成長率 (%)", "物価変動を除いた実質GDPの成長率")} />
        <Slider label="ベースリスクプレミアム (%)" value={p.riskPremium} min={0} max={3} step={0.1}
          tooltip="外生的な最低リスクプレミアム（グローバル金利環境）。これに加え、利払負担率が閾値を超えると財政リスクプレミアムが自動加算されます。"
          onChange={v => onParamChange('riskPremium', v)} searchHidden={sh("ベースリスクプレミアム (%)", "外生的な最低リスクプレミアム")} />
      </SidebarSection>

      <SidebarSection title="外部環境・家計">
        <Slider label="為替バイアス (%/年)" value={p.yenDepreciation} min={-3} max={10} step={0.5}
          tooltip="為替レートは金利差・インフレ差から内生的に決定されます。正の値は追加的な円安傾向、負の値は円高傾向を表します。"
          onChange={v => onParamChange('yenDepreciation', v)} searchHidden={sh("為替バイアス (%/年)", "為替レートの追加的な変動バイアス")} />
        <Slider label="海外金利 (%)" value={p.foreignInterestRate} min={0.5} max={8.0} step={0.1}
          tooltip="海外（主に米国）の長期金利。金利差が為替レートに影響します。海外金利が高いほど円安圧力が強まります。"
          onChange={v => onParamChange('foreignInterestRate', v)} searchHidden={sh("海外金利 (%)", "海外の長期金利水準")} />
        <Slider label="海外インフレ率 (%)" value={p.foreignInflation} min={0.0} max={8.0} step={0.1}
          tooltip="海外（主に米国）のインフレ率。日本のインフレ率との差が購買力平価を通じて為替レートに影響します。"
          onChange={v => onParamChange('foreignInflation', v)} searchHidden={sh("海外インフレ率 (%)", "海外のインフレ率")} />
        <div style={{ margin: '8px 0 4px 0' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>▼ 金利実績と設定値の比較</div>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={ACTUAL_MACRO} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} domain={[-0.5, 5]} />
              <Tooltip contentStyle={{ fontSize: 11, background: '#1e293b', border: '1px solid #334155' }} labelStyle={{ color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="ust10y" name="UST10Y" stroke="#60a5fa" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="jgb10y" name="JGB10Y" stroke="#f87171" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
              <ReferenceLine y={p.foreignInterestRate} stroke="#60a5fa" strokeDasharray="6 3" strokeWidth={2} label={{ value: `海外${p.foreignInterestRate}%`, position: 'right', fontSize: 9, fill: '#60a5fa' }} />
              <ReferenceLine y={p.inflationRate + p.riskPremium} stroke="#f87171" strokeDasharray="6 3" strokeWidth={2} label={{ value: `国内${(p.inflationRate + p.riskPremium).toFixed(1)}%`, position: 'right', fontSize: 9, fill: '#f87171' }} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 10, color: '#64748b', margin: '2px 0 0 0' }}>
            過去10年レンジ: UST10Y 0.9%〜4.3% / JGB10Y -0.1%〜1.1%
          </p>
          <p style={{ fontSize: 10, color: '#64748b', margin: '2px 0 8px 0' }}>
            為替 = バイアス + 0.5×(海外金利−国内金利) + 0.3×(国内CPI−海外CPI) + 0.5×リスクP
          </p>
        </div>
        <Slider label="名目賃金上昇率 下限 (%/年)" value={p.nominalWageGrowth} min={0} max={5} step={0.1}
          tooltip="賃金モデルの下限値。内生的に計算される名目賃金上昇率がこの値を下回る場合、この値が適用されます。"
          onChange={v => onParamChange('nominalWageGrowth', v)} searchHidden={sh("名目賃金上昇率 下限 (%/年)", "賃金モデルの下限値")} />
        <Slider label="生産性分配率" value={p.productivityShareRate} min={0.1} max={1.0} step={0.05}
          tooltip="実質GDP成長の何%が賃金に分配されるか。日本は0.3〜0.5（先進国最低水準）。高いほど成長の果実が労働者に回ります。"
          onChange={v => onParamChange('productivityShareRate', v)} searchHidden={sh("生産性分配率", "実質GDP成長の何%が賃金に分配されるか")} />
        <Slider label="インフレ転嫁率" value={p.wagePassThroughRate} min={0.0} max={1.0} step={0.05}
          tooltip="物価上昇の何%が賃金に転嫁されるか。日本は0.2〜0.4（春闘の交渉力に依存）。1.0なら完全にインフレに追随。"
          onChange={v => onParamChange('wagePassThroughRate', v)} searchHidden={sh("インフレ転嫁率", "物価上昇の何%が賃金に転嫁されるか")} />
        <Slider label="内部留保還元率 (%/年)" value={p.retainedEarningsReturnRate} min={0.0} max={0.10} step={0.005}
          tooltip="企業の内部留保のうち毎年何%が賃金・設備投資として還元されるか。高いほど内部留保GDP比が低下し、労働者への分配が増えます。"
          onChange={v => onParamChange('retainedEarningsReturnRate', v)} searchHidden={sh("内部留保還元率 (%/年)", "企業の内部留保のうち毎年何%が賃金・設備投資として還元されるか")} />
        <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
          内生賃金 = 実質成長率×分配率 + インフレ率×転嫁率
        </p>
        <Slider label="世界経済成長率 (%)" value={p.globalGrowth} min={0} max={5} step={0.1}
          tooltip="世界経済全体の成長率。日本の輸出額に直接影響します。先進国中心に2〜3%が一般的です。"
          onChange={v => onParamChange('globalGrowth', v)} searchHidden={sh("世界経済成長率 (%)", "世界経済全体の成長率")} />
        <Slider label="貧困率感応度" value={p.povertySensitivity} min={0.1} max={1.0} step={0.1}
          tooltip="物価上昇と賃金の乖離が貧困率にどれだけ影響するかの感応度パラメータ。値が大きいほどインフレが家計に打撃を与えます。"
          onChange={v => onParamChange('povertySensitivity', v)} searchHidden={sh("貧困率感応度", "物価上昇と賃金の乖離が貧困率にどれだけ影響するか")} />
        <Slider label="エネルギー補助金率" value={p.energySubsidyRate} min={0} max={1.0} step={0.1}
          tooltip="インフレに応じて政府が投入するエネルギー補助金の比率。高インフレ時に燃料・電気代への補助金が歳出を押し上げます。"
          onChange={v => onParamChange('energySubsidyRate', v)} searchHidden={sh("エネルギー補助金率", "インフレに応じて政府が投入するエネルギー補助金の比率")} />
      </SidebarSection>

      <SidebarSection title="消費税率設定">
        <label>消費税率変更年度</label>
        <select
          value={p.taxRateChangeYear}
          onChange={e => onParamChange('taxRateChangeYear', e.target.value)}
        >
          {["なし", "2030", "2035", "2040", "2045", "2050"].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <Slider label="新消費税率 (%)" value={p.taxRateNew} min={8} max={20} step={1}
          onChange={v => onParamChange('taxRateNew', v)} searchHidden={sh("新消費税率 (%)", "新消費税率")} />
      </SidebarSection>

      <SidebarSection title="金利の内生化">
        <Slider label="財政リスク感応度" value={p.fiscalRiskSensitivity} min={0} max={0.5} step={0.01}
          tooltip="利払負担率が閾値を超えた場合のリスクプレミアム加算の感応度。値×（利払負担率−閾値）%が市場金利に上乗せされます。"
          onChange={v => onParamChange('fiscalRiskSensitivity', v)} searchHidden={sh("財政リスク感応度", "利払負担率が閾値を超えた場合のリスクプレミアム加算の感応度")} />
        <Slider label="利払負担率閾値 (%)" value={p.interestBurdenThreshold} min={10} max={40} step={1}
          tooltip="利払負担率がこの水準を超えると、超過分に比例して財政リスクプレミアムが市場金利に自動加算されます。"
          onChange={v => onParamChange('interestBurdenThreshold', v)} searchHidden={sh("利払負担率閾値 (%)", "利払負担率がこの水準を超えると")} />
        <Slider label="通貨リスクプレミアム (%)" value={p.currencyRiskPremium} min={0} max={5} step={0.5}
          tooltip="経常赤字＋NFA低下時に自動で市場金利に上乗せされるリスクプレミアム。通貨の信認低下による国債金利の跳ね上がりを表現します。"
          onChange={v => onParamChange('currencyRiskPremium', v)} searchHidden={sh("通貨リスクプレミアム (%)", "経常赤字＋NFA低下時に自動で市場金利に上乗せされるリスクプレミアム")} />
      </SidebarSection>

      <SidebarSection title="歳出増加率">
        <Slider label="子育て支援 増加率 (%/年)" value={p.childcareGrowth} min={0} max={10} step={0.5}
          tooltip="子育て支援予算の年間増加率。少子化対策強化で高く設定すると予算が急増します。"
          onChange={v => onParamChange('childcareGrowth', v)} searchHidden={sh("子育て支援 増加率 (%/年)", "子育て支援予算の年間増加率")} />
        <Slider label="防衛費 増加率 (%/年)" value={p.defenseGrowth} min={0} max={5} step={0.5}
          tooltip="防衛費の年間増加率。安全保障環境の変化に応じた防衛力強化の度合いです。"
          onChange={v => onParamChange('defenseGrowth', v)} searchHidden={sh("防衛費 増加率 (%/年)", "防衛費の年間増加率")} />
      </SidebarSection>

      <SidebarSection title="人的資本・人口動態">
        <Slider label="人口成長率 (%/年)" value={p.populationGrowth} min={-2.0} max={1.0} step={0.1}
          tooltip="総人口の年間変化率。日本は現在約-0.5%/年。移民政策や出生率により変動します。"
          onChange={v => onParamChange('populationGrowth', v)} searchHidden={sh("人口成長率 (%/年)", "総人口の年間変化率")} />
        <Slider label="労働参加率変化 (%/年)" value={p.laborParticipationChange} min={-0.5} max={1.0} step={0.1}
          tooltip="労働参加率の年間変化。女性・高齢者の労働参加拡大でプラス、高齢化進行でマイナスに。"
          onChange={v => onParamChange('laborParticipationChange', v)} searchHidden={sh("労働参加率変化 (%/年)", "労働参加率の年間変化")} />
        <Slider label="教育投資対GDP比 (%)" value={p.educationGDPRatio} min={2.0} max={7.0} step={0.1}
          tooltip="公教育支出のGDP比。日本は約3.5%でOECD平均（約4.9%）を下回ります。15年ラグで人的資本に影響。"
          onChange={v => onParamChange('educationGDPRatio', v)} searchHidden={sh("教育投資対GDP比 (%)", "公教育支出のGDP比")} />
        <Slider label="テクノロジー効果 (%/年)" value={p.techEffect} min={0.0} max={2.0} step={0.1}
          tooltip="AI・デジタル化等の技術進歩が人的資本成長率に与える効果。高いほど生産性向上に寄与。"
          onChange={v => onParamChange('techEffect', v)} searchHidden={sh("テクノロジー効果 (%/年)", "技術進歩が人的資本成長率に与える効果")} />
        <Slider label="ベースTFR" value={p.baseTFR} min={0.8} max={2.1} step={0.05}
          tooltip="合計特殊出生率のベースライン。日本の2024年実績は約1.20。経済環境により内生的に変動します。"
          onChange={v => onParamChange('baseTFR', v)} searchHidden={sh("ベースTFR", "合計特殊出生率のベースライン")} />
        <Slider label="出生率感応度" value={p.tfrSensitivity} min={0.0} max={1.0} step={0.1}
          tooltip="出生率が経済環境（賃金・格差・子育て支援）にどれだけ反応するかの感応度。0=固定、1=最大反応。"
          onChange={v => onParamChange('tfrSensitivity', v)} searchHidden={sh("出生率感応度", "出生率が経済環境にどれだけ反応するか")} />

        <div style={{ margin: '8px 0 4px 0' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>▼ 教育投資GDP比の実績と設定値</div>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={ACTUAL_MACRO} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} domain={[2.0, 6.0]} />
              <Tooltip contentStyle={{ fontSize: 11, background: '#1e293b', border: '1px solid #334155' }} labelStyle={{ color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="educationGDPRatio" name="教育投資GDP比" stroke="#34d399" strokeWidth={1.5} dot={{ r: 2 }} />
              <ReferenceLine y={p.educationGDPRatio} stroke="#34d399" strokeDasharray="6 3" strokeWidth={2} label={{ value: `設定${p.educationGDPRatio}%`, position: 'right', fontSize: 9, fill: '#34d399' }} />
              <ReferenceLine y={4.9} stroke="#fbbf24" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: 'OECD平均4.9%', position: 'right', fontSize: 9, fill: '#fbbf24' }} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 10, color: '#64748b', margin: '2px 0 0 0' }}>
            日本の公教育支出GDP比: 3.1〜3.5% / OECD平均: 約4.9%
          </p>
        </div>

        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8, padding: '6px 8px', background: '#0f172a', borderRadius: 4, lineHeight: 1.6 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 2 }}>人的資本モデル概要:</div>
          <div>人的資本成長 = 教育効果(15年ラグ) + テクノロジー効果 − 老化減耗</div>
          <div>内生TFR = ベースTFR + 賃金効果 + 格差効果 + 子育て支援効果</div>
          <div>社会活力 = f(TFR, 人的資本, 実質賃金)</div>
        </div>
      </SidebarSection></>}

      <div className="sidebar-divider-label" onClick={() => setSectionInitOpen(v => !v)}>
        {sectionInitOpen ? '▼' : '▶'} 初期値（2026年）
      </div>

      {sectionInitOpen && <><SidebarSection title="財政初期値">
        <NumberInput label="債務残高 (兆円)" value={p.initDebt} step={50}
          tooltip="2026年度のスタート時点での国の借金総額。2024年度末で約1,100兆円です。"
          onChange={v => onParamChange('initDebt', v)} searchHidden={sh("債務残高 (兆円)", "2026年度のスタート時点での国の借金総額")} />
        <NumberInput label="政策的経費 (兆円)" value={p.initPolicyExp} step={5}
          tooltip="2026年度の政策的経費の初期値（合計値）。下の歳出内訳で分野別に設定できます。"
          onChange={v => onParamChange('initPolicyExp', v)} searchHidden={sh("政策的経費 (兆円)", "2026年度の政策的経費の初期値")} />
        <Slider label="平均クーポン (%)" value={p.initAvgCoupon} min={0} max={5} step={0.1}
          tooltip="政府債務全体の加重平均利率。既発債の金利が残るため、市場金利が上がってもすぐには上昇しません。9年借換ロジックで毎年1/9ずつ新金利に置き換わります。"
          onChange={v => onParamChange('initAvgCoupon', v)} searchHidden={sh("平均クーポン (%)", "政府債務全体の加重平均利率")} />
        <NumberInput label="その他収入 (兆円/年)" value={p.otherRevenue} step={1}
          tooltip="税外収入（印紙収入、官業収入、政府資産整理収入等）の年間合計。シミュレーション期間中は固定値として扱います。"
          onChange={v => onParamChange('otherRevenue', v)} searchHidden={sh("その他収入 (兆円/年)", "税外収入")} />
        <NumberInput label="自然増 (兆円/年)" value={p.naturalIncrease} step={0.1}
          tooltip="高齢化に伴う社会保障費（年金・医療・介護）の構造的な年間増加額。財務省の試算では年0.3〜0.7兆円程度とされています。"
          onChange={v => onParamChange('naturalIncrease', v)} searchHidden={sh("自然増 (兆円/年)", "高齢化に伴う社会保障費の構造的な年間増加額")} />
        <Slider label="政策金利スプレッド (%)" value={p.policyRateSpread} min={0} max={3} step={0.1}
          tooltip="市場金利と日銀の政策金利の差。政策金利＝市場金利−スプレッド（下限0%）。通常1%程度で、日銀は市場金利より低い政策金利を維持します。"
          onChange={v => onParamChange('policyRateSpread', v)} searchHidden={sh("政策金利スプレッド (%)", "市場金利と日銀の政策金利の差")} />
      </SidebarSection>

      <SidebarSection title="税収内訳（初期値）" defaultOpen={false}>
        <NumberInput label="消費税 (兆円)" value={p.initTaxConsumption} step={1}
          tooltip="消費税収の初期値。税率10%（軽減8%）。消費額×インフレ率に連動して伸びます。2024年度実績は約24兆円。"
          onChange={v => onParamChange('initTaxConsumption', v)} searchHidden={sh("消費税 (兆円)", "消費税収の初期値")} />
        <NumberInput label="所得税 (兆円)" value={p.initTaxIncome} step={1}
          tooltip="所得税収の初期値。累進課税のため名目賃金の伸び以上に増加します（弾性値1.4）。2024年度実績は約22兆円。"
          onChange={v => onParamChange('initTaxIncome', v)} searchHidden={sh("所得税 (兆円)", "所得税収の初期値")} />
        <NumberInput label="法人税 (兆円)" value={p.initTaxCorporate} step={1}
          tooltip="法人税収の初期値。企業利益に連動し景気変動に敏感です（実質成長率×2.0＋インフレ率×0.5）。2024年度実績は約17兆円。"
          onChange={v => onParamChange('initTaxCorporate', v)} searchHidden={sh("法人税 (兆円)", "法人税収の初期値")} />
        <NumberInput label="その他税 (兆円)" value={p.initTaxOther} step={1}
          tooltip="相続税・酒税・たばこ税・関税等のその他税収。名目成長率に対して弾性値0.8で緩やかに連動。2024年度実績は約12兆円。"
          onChange={v => onParamChange('initTaxOther', v)} searchHidden={sh("その他税 (兆円)", "相続税・酒税・たばこ税・関税等のその他税収")} />
        <p className="tax-total">税収合計: <strong>{taxTotal.toFixed(0)} 兆円</strong></p>
      </SidebarSection>

      <SidebarSection title="歳出内訳（初期値）" defaultOpen={false}>
        <NumberInput label="社会保障費 (兆円)" value={p.initSocialSecurity} step={1}
          tooltip="年金・医療・介護等の社会保障給付（約37兆円）。高齢化による自然増（年0.5兆円の約70%）とインフレ連動で増加します。"
          onChange={v => onParamChange('initSocialSecurity', v)} searchHidden={sh("社会保障費 (兆円)", "年金・医療・介護等の社会保障給付")} />
        <NumberInput label="子ども・子育て支援 (兆円)" value={p.initChildcare} step={0.5}
          tooltip="こども家庭庁予算・児童手当等（約5兆円）。少子化対策の政策優先度に応じて成長率を設定できます。"
          onChange={v => onParamChange('initChildcare', v)} searchHidden={sh("子ども・子育て支援 (兆円)", "こども家庭庁予算・児童手当等")} />
        <NumberInput label="地方交付税 (兆円)" value={p.initLocalGovTransfer} step={1}
          tooltip="地方自治体への財源移転（約17兆円）。税収の名目成長率の50%に連動して増加します。"
          onChange={v => onParamChange('initLocalGovTransfer', v)} searchHidden={sh("地方交付税 (兆円)", "地方自治体への財源移転")} />
        <NumberInput label="防衛費 (兆円)" value={p.initDefense} step={0.5}
          tooltip="防衛省予算（約7兆円）。2023年度から5年間で43兆円規模への増額が決定されています。"
          onChange={v => onParamChange('initDefense', v)} searchHidden={sh("防衛費 (兆円)", "防衛省予算")} />
      </SidebarSection>

      <SidebarSection title="日銀パラメータ（初期値）" defaultOpen={false}>
        <NumberInput label="保有国債 (兆円)" value={p.initBojJGB} step={10}
          tooltip="日銀が保有する国債の残高（約590兆円）。QT（量的引き締め）で毎年減少します。この残高×利回りが日銀の収入源です。"
          onChange={v => onParamChange('initBojJGB', v)} searchHidden={sh("保有国債 (兆円)", "日銀が保有する国債の残高")} />
        <NumberInput label="当座預金 (兆円)" value={p.bojCA} step={50}
          tooltip="金融機関が日銀に預けている預金の残高（約550兆円）。QTで保有国債と連動して減少します。"
          onChange={v => onParamChange('bojCA', v)} searchHidden={sh("当座預金 (兆円)", "金融機関が日銀に預けている預金の残高")} />
        <Slider label="保有国債利回り (%)" value={p.bojYield} min={0} max={2} step={0.05}
          tooltip="日銀保有国債の初期平均利回り。毎年1/9ずつ市場金利に追随します（9年借換ロジック）。"
          onChange={v => onParamChange('bojYield', v)} searchHidden={sh("保有国債利回り (%)", "日銀保有国債の初期平均利回り")} />
        <NumberInput label="日銀自己資本バッファ (兆円)" value={p.bojCapitalBuffer} step={1}
          tooltip="日銀の引当金・準備金（約12兆円）。逆ザヤの累積損失がこのバッファを超えると歳入を直接減少させます。"
          onChange={v => onParamChange('bojCapitalBuffer', v)} searchHidden={sh("日銀自己資本バッファ (兆円)", "日銀の引当金・準備金")} />
        <NumberInput label="QT縮小額 (兆円/年)" value={p.bojQTRate} step={5}
          tooltip="日銀の年間バランスシート縮小額。保有国債と当座預金が毎年この金額ずつ減少します。"
          onChange={v => onParamChange('bojQTRate', v)} searchHidden={sh("QT縮小額 (兆円/年)", "日銀の年間バランスシート縮小額")} />
        <NumberInput label="当座預金下限 (兆円)" value={p.bojCAFloor} step={10}
          tooltip="QTによる当座預金の縮小下限。金融システム安定のために最低限必要な水準です。"
          onChange={v => onParamChange('bojCAFloor', v)} searchHidden={sh("当座預金下限 (兆円)", "QTによる当座預金の縮小下限")} />
      </SidebarSection>

      <SidebarSection title="貿易・為替（初期値）" defaultOpen={false}>
        <NumberInput label="為替レート (円/ドル)" value={p.initExchangeRate} step={5}
          tooltip="初期の為替レート（円/ドル）。2024年は約150円/ドルです。内生為替モデルにより毎年変動します。"
          onChange={v => onParamChange('initExchangeRate', v)} searchHidden={sh("為替レート (円/ドル)", "初期の為替レート")} />
        <NumberInput label="輸出額 (兆円)" value={p.initExport} step={5}
          tooltip="初期の年間輸出額。2024年度は約100兆円です。世界経済成長率と円安による価格競争力で変動します。"
          onChange={v => onParamChange('initExport', v)} searchHidden={sh("輸出額 (兆円)", "初期の年間輸出額")} />
        <NumberInput label="輸入額 (兆円)" value={p.initImport} step={5}
          tooltip="初期の年間輸入額。2024年度は約110兆円です。国内成長率とインフレ、円安による輸入物価上昇で変動します。"
          onChange={v => onParamChange('initImport', v)} searchHidden={sh("輸入額 (兆円)", "初期の年間輸入額")} />
        <NumberInput label="外貨準備 (兆円)" value={p.fxReserves} step={10}
          tooltip="政府の外貨準備高。約1.3兆ドル（約180兆円）。円安時にはドル建て資産の円換算が増加し評価益が発生します。"
          onChange={v => onParamChange('fxReserves', v)} searchHidden={sh("外貨準備 (兆円)", "政府の外貨準備高")} />
      </SidebarSection>

      <SidebarSection title="対外資産・経常収支（初期値）" defaultOpen={false}>
        <NumberInput label="対外純資産 (兆円)" value={p.initNFA} step={10}
          tooltip="日本の対外純資産。約420兆円（2024年）で世界最大の債権国です。経常収支が赤字になると減少します。"
          onChange={v => onParamChange('initNFA', v)} searchHidden={sh("対外純資産 (兆円)", "日本の対外純資産")} />
        <NumberInput label="NFA防衛ライン (兆円)" value={p.nfaThreshold} step={10}
          tooltip="対外純資産がこの水準を下回り、かつ経常収支が赤字の場合、通貨信任リスクプレミアムが市場金利に自動加算されます。"
          onChange={v => onParamChange('nfaThreshold', v)} searchHidden={sh("NFA防衛ライン (兆円)", "対外純資産がこの水準を下回り")} />
      </SidebarSection>

      <SidebarSection title="家計（初期値）" defaultOpen={false}>
        <NumberInput label="貧困率 (%)" value={p.initPovertyRate} step={0.1}
          tooltip="相対的貧困率の初期値。2021年の厚労省調査では15.4%です。実質賃金の低下で悪化します。"
          onChange={v => onParamChange('initPovertyRate', v)} searchHidden={sh("貧困率 (%)", "相対的貧困率の初期値")} />
        <NumberInput label="ジニ係数" value={p.initGini} step={0.001}
          tooltip="所得格差を示す指標（0=完全平等、1=完全不平等）。日本は約0.334（2021年）。"
          onChange={v => onParamChange('initGini', v)} searchHidden={sh("ジニ係数", "所得格差を示す指標")} />
      </SidebarSection></>}

      <div className="sidebar-divider-label" onClick={() => setSectionOptOpen(v => !v)}>
        {sectionOptOpen ? '▼' : '▶'} 最適化
      </div>

      {sectionOptOpen && <><div className="constraints-section">
        <h3>制約条件（レッドライン）</h3>
        <p className="optimizer-desc">
          最適化探索時に「起きてはいけない状態」を制約条件として設定します。
        </p>
        <label className="constraint-row">
          <input type="checkbox" checked={constraints.povertyRate.enabled}
            onChange={e => updateConstraint('povertyRate', 'enabled', e.target.checked)} />
          <span>貧困率 ≤</span>
          <input type="number" className="constraint-threshold" value={constraints.povertyRate.threshold}
            step={1} min={10} max={40}
            onChange={e => updateConstraint('povertyRate', 'threshold', parseFloat(e.target.value) || 20)} />
          <span>%</span>
        </label>
        <label className="constraint-row">
          <input type="checkbox" checked={constraints.giniIndex.enabled}
            onChange={e => updateConstraint('giniIndex', 'enabled', e.target.checked)} />
          <span>ジニ係数 ≤</span>
          <input type="number" className="constraint-threshold" value={constraints.giniIndex.threshold}
            step={0.01} min={0.3} max={0.6}
            onChange={e => updateConstraint('giniIndex', 'threshold', parseFloat(e.target.value) || 0.45)} />
        </label>
        <label className="constraint-row">
          <input type="checkbox" checked={constraints.interestBurden.enabled}
            onChange={e => updateConstraint('interestBurden', 'enabled', e.target.checked)} />
          <span>利払負担率 ≤</span>
          <input type="number" className="constraint-threshold" value={constraints.interestBurden.threshold}
            step={1} min={10} max={60}
            onChange={e => updateConstraint('interestBurden', 'threshold', parseFloat(e.target.value) || 30)} />
          <span>%</span>
        </label>
        <label className="constraint-row">
          <input type="checkbox" checked={constraints.realPolicyExpIndex.enabled}
            onChange={e => updateConstraint('realPolicyExpIndex', 'enabled', e.target.checked)} />
          <span>実質政策経費指数 ≥</span>
          <input type="number" className="constraint-threshold" value={constraints.realPolicyExpIndex.threshold}
            step={5} min={30} max={100}
            onChange={e => updateConstraint('realPolicyExpIndex', 'threshold', parseFloat(e.target.value) || 70)} />
        </label>
        <p className="constraint-note">
          実質政策経費指数：初年度=100。インフレ調整後の政策的経費（利払除く）が初年度から何%の水準か
        </p>
        <label className="constraint-row">
          <input type="checkbox" checked={constraints.currentAccountDeficit.enabled}
            onChange={e => updateConstraint('currentAccountDeficit', 'enabled', e.target.checked)} />
          <span>経常赤字連続年数 ≤</span>
          <input type="number" className="constraint-threshold" value={constraints.currentAccountDeficit.threshold}
            step={1} min={1} max={30}
            onChange={e => updateConstraint('currentAccountDeficit', 'threshold', parseFloat(e.target.value) || 5)} />
          <span>年</span>
        </label>
        <p className="constraint-note">
          経常収支が連続して赤字となる年数の上限。超過すると通貨リスクプレミアムが加速的に上昇します
        </p>
      </div>

      <div className="optimizer-section">
        <h3>警告ゼロ探索</h3>
        <p className="optimizer-current-warnings">
          現在の警告数: <strong className={currentWarnings === 0 ? 'warn-zero' : 'warn-nonzero'}>{currentWarnings}</strong>
        </p>
        <p className="optimizer-desc">
          勾配降下法で警告が最小になるパラメータを探索します。調整対象を選んでください。
        </p>
        <div className="optimizer-checkboxes">
          {OPTIMIZABLE_PARAMS.map(op => (
            <label key={op.key} className="optimizer-checkbox">
              <input
                type="checkbox"
                checked={selectedOptKeys.has(op.key)}
                onChange={() => toggleOptKey(op.key)}
                disabled={isOptimizing}
              />
              <span>{op.label}</span>
            </label>
          ))}
        </div>
        <button
          className={`optimizer-btn ${isOptimizing ? 'cancel' : ''}`}
          onClick={startOptimizer}
          disabled={selectedOptKeys.size === 0 && !isOptimizing}
        >
          {isOptimizing ? '中止' : '探索開始'}
        </button>

        {optimizerProgress && (
          <div className="optimizer-progress">
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${optimizerProgress.done ? 100 : (optimizerProgress.iteration / optimizerProgress.maxIterations) * 100}%` }}
              />
            </div>
            <p className="progress-text">
              {optimizerProgress.done ? '完了' : `探索中... (${optimizerProgress.iteration}/${optimizerProgress.maxIterations})`}
            </p>
            <p className="progress-result">
              最小警告数: <strong className={optimizerProgress.bestWarnings === 0 ? 'warn-zero' : 'warn-nonzero'}>
                {optimizerProgress.bestWarnings}
              </strong>
              {optimizerProgress.bestWarnings === 0 && ' ✓'}
            </p>
            {optimizerProgress.done && optimizerProgress.bestWarnings < (baselineWarnings ?? currentWarnings) && (
              <div className="optimizer-result-detail">
                <p className="optimizer-changes-title">変更されるパラメータ:</p>
                <ul className="optimizer-changes">
                  {OPTIMIZABLE_PARAMS
                    .filter(op => selectedOptKeys.has(op.key))
                    .filter(op => {
                      const before = params[op.key] as number
                      const after = optimizerProgress.bestParams[op.key] as number
                      return Math.abs(before - after) > 1e-6
                    })
                    .map(op => {
                      const before = params[op.key] as number
                      const after = optimizerProgress.bestParams[op.key] as number
                      return (
                        <li key={op.key}>
                          {op.label}: {before.toFixed(1)} → <strong>{after.toFixed(1)}</strong>
                        </li>
                      )
                    })}
                </ul>
                <button className="optimizer-apply-btn" onClick={applyOptResult}>
                  結果を適用
                </button>
              </div>
            )}
            {optimizerProgress.done && optimizerProgress.bestWarnings >= (baselineWarnings ?? currentWarnings) && (
              <p className="optimizer-no-improve">現在のパラメータが既に最適、または改善が見つかりませんでした。</p>
            )}
          </div>
        )}
      </div></>}
    </aside>
  )
}
