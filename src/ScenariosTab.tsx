import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
  LineChart, Line,
} from 'recharts'
import { SCENARIOS } from './data'
import { runSimulation, type SimResult } from './simulation'

const SCENARIO_COLORS = [
  '#6366f1', '#22c55e', '#ef4444', '#f97316', '#3b82f6',
  '#ec4899', '#8b5cf6', '#14b8a6', '#64748b', '#eab308',
]

interface ScenarioSummary {
  name: string;
  shortName: string;
  label: string;
  debt2055: number;
  interestBurden2055: number;
  povertyRate2055: number;
  gini2055: number;
  debtGDPRatio2055: number;
  nfa2055: number;
  realWageAvg: number;
  fiscalBalance2055: number;
  merits: string[];
  demerits: string[];
  policies: string[];
  warningCount: number;
  simData: SimResult[];
}

function getShortName(name: string): string {
  return name.replace(/^[①-⑩]\s*/, '').replace(/（.*）/, '').trim()
}

export function ScenariosTab() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const summaries: ScenarioSummary[] = useMemo(() => {
    return SCENARIOS.map(scenario => {
      const sim = runSimulation(scenario.params)
      const last = sim[sim.length - 1]
      const nominalGDP = scenario.params.initNominalGDP *
        Math.pow(1 + (scenario.params.realGrowth + scenario.params.inflationRate) / 100, 30)

      let warningCount = 0
      sim.forEach(d => {
        if (d.interestBurden > 30) warningCount++
        if (d.povertyRate > 20) warningCount++
        if (d.nfa < scenario.params.nfaThreshold) warningCount++
      })

      const avgRealWage = sim.reduce((s, d) => s + d.realWageGrowth, 0) / sim.length

      return {
        name: scenario.name,
        shortName: getShortName(scenario.name),
        label: scenario.label,
        debt2055: last.debt,
        interestBurden2055: last.interestBurden,
        povertyRate2055: last.povertyRate,
        gini2055: last.giniIndex,
        debtGDPRatio2055: (last.debt / nominalGDP) * 100,
        nfa2055: last.nfa,
        realWageAvg: avgRealWage,
        fiscalBalance2055: last.fiscalBalance,
        merits: scenario.merits,
        demerits: scenario.demerits,
        policies: scenario.policies,
        warningCount,
        simData: sim,
      }
    })
  }, [])

  const comparisonCharts = useMemo(() => {
    const safe = (v: number) => (!isFinite(v) || isNaN(v)) ? 0 : v
    const base = summaries.map((s, i) => ({ name: `${i + 1}`, fullName: s.shortName }))
    return {
      burden: base.map((b, i) => ({ ...b, '利払負担率': parseFloat(safe(summaries[i].interestBurden2055).toFixed(1)) })),
      poverty: base.map((b, i) => ({ ...b, '貧困率': parseFloat(safe(summaries[i].povertyRate2055).toFixed(1)) })),
      gini: base.map((b, i) => ({ ...b, 'ジニ係数': parseFloat(safe(summaries[i].gini2055).toFixed(3)) })),
      debt: base.map((b, i) => ({ ...b, '債務残高': Math.round(safe(summaries[i].debt2055)) })),
      nfa: base.map((b, i) => ({ ...b, '対外純資産': Math.round(safe(summaries[i].nfa2055)) })),
    }
  }, [summaries])

  const evalBarData = useMemo(() => {
    const safe = (v: number) => (!isFinite(v) || isNaN(v)) ? 0 : v
    const vals = summaries.map(s => ({
      debt: safe(s.debt2055),
      burden: safe(s.interestBurden2055),
      poverty: safe(s.povertyRate2055),
      gini: safe(s.gini2055),
      nfa: safe(s.nfa2055),
    }))
    const maxDebt = Math.max(...vals.map(v => v.debt))
    const minDebt = Math.min(...vals.map(v => v.debt))
    const maxBurden = Math.max(...vals.map(v => v.burden))
    const minBurden = Math.min(...vals.map(v => v.burden))
    const maxPoverty = Math.max(...vals.map(v => v.poverty))
    const minPoverty = Math.min(...vals.map(v => v.poverty))
    const maxGini = Math.max(...vals.map(v => v.gini))
    const minGini = Math.min(...vals.map(v => v.gini))
    const maxNFA = Math.max(...vals.map(v => v.nfa))
    const minNFA = Math.min(...vals.map(v => v.nfa))

    const normalize = (val: number, min: number, max: number, invert: boolean) => {
      if (!isFinite(val) || isNaN(val)) return 0
      if (max === min) return 50
      const ratio = (val - min) / (max - min)
      return Math.round((invert ? 1 - ratio : ratio) * 100)
    }

    const metrics: { key: string; label: string; color: string; calc: (s: ScenarioSummary) => number }[] = [
      { key: 'fiscal', label: '財政健全性', color: '#6366f1', calc: s => normalize(safe(s.debt2055), minDebt, maxDebt, true) },
      { key: 'burden', label: '利払負担', color: '#f97316', calc: s => normalize(safe(s.interestBurden2055), minBurden, maxBurden, true) },
      { key: 'household', label: '家計安定', color: '#22c55e', calc: s => normalize(safe(s.povertyRate2055), minPoverty, maxPoverty, true) },
      { key: 'gini', label: '格差抑制', color: '#ec4899', calc: s => normalize(safe(s.gini2055), minGini, maxGini, true) },
      { key: 'nfa', label: '対外資産', color: '#3b82f6', calc: s => normalize(safe(s.nfa2055), minNFA, maxNFA, false) },
    ]

    return { metrics, data: summaries.map((s, i) => {
      const entry: Record<string, string | number> = { name: `${i + 1}`, fullName: s.shortName }
      metrics.forEach(m => { entry[m.label] = m.calc(s) })
      return entry
    })}
  }, [summaries])

  const debtTimeSeriesData = useMemo(() => {
    const years = summaries[0].simData.map(d => d.year)
    return years.map((year, yi) => {
      const entry: Record<string, number> = { year }
      summaries.forEach((s, i) => {
        entry[`s${i}`] = parseFloat(s.simData[yi].interestBurden.toFixed(1))
      })
      return entry
    })
  }, [summaries])

  const getRatingColor = (warnings: number) => {
    if (warnings === 0) return '#22c55e'
    if (warnings <= 5) return '#84cc16'
    if (warnings <= 15) return '#f59e0b'
    return '#ef4444'
  }

  const getRatingLabel = (warnings: number) => {
    if (warnings === 0) return 'A+'
    if (warnings <= 5) return 'A'
    if (warnings <= 10) return 'B+'
    if (warnings <= 15) return 'B'
    if (warnings <= 25) return 'C'
    return 'D'
  }

  return (
    <div>
      <div className="scenarios-overview-header">
        <h2>📊 全シナリオ比較分析</h2>
        <p>10のシナリオを横並びで比較し、それぞれの特徴・リスク・改善策を一覧できます</p>
      </div>

      <div className="scenarios-summary-table">
        <h3>シナリオ別 2055年指標サマリー</h3>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>シナリオ</th>
                <th>評価</th>
                <th>債務残高</th>
                <th>利払負担率</th>
                <th>貧困率</th>
                <th>ジニ係数</th>
                <th>対外純資産</th>
                <th>平均実質賃金</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s, i) => (
                <tr key={i} style={{ cursor: 'pointer', background: expandedIndex === i ? '#f0f9ff' : undefined }} onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}>
                  <td style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.name}</td>
                  <td>
                    <span className="rating-badge" style={{ background: getRatingColor(s.warningCount), color: '#fff' }}>
                      {getRatingLabel(s.warningCount)}
                    </span>
                  </td>
                  <td style={{ color: s.debt2055 > 2000 ? '#ef4444' : undefined }}>{Math.round(s.debt2055).toLocaleString()}兆</td>
                  <td style={{ color: s.interestBurden2055 > 30 ? '#ef4444' : undefined }}>{s.interestBurden2055.toFixed(1)}%</td>
                  <td style={{ color: s.povertyRate2055 > 20 ? '#ef4444' : undefined }}>{s.povertyRate2055.toFixed(1)}%</td>
                  <td style={{ color: s.gini2055 > 0.4 ? '#ef4444' : undefined }}>{s.gini2055.toFixed(3)}</td>
                  <td style={{ color: s.nfa2055 < 200 ? '#ef4444' : undefined }}>{Math.round(s.nfa2055).toLocaleString()}兆</td>
                  <td style={{ color: s.realWageAvg < 0 ? '#ef4444' : '#22c55e' }}>{s.realWageAvg >= 0 ? '+' : ''}{s.realWageAvg.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="scenarios-cards">
        <h3>各シナリオ詳細分析</h3>
        {summaries.map((s, i) => (
          <div key={i} className={`scenario-card ${expandedIndex === i ? 'expanded' : ''}`}>
            <div className="scenario-card-header" onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}>
              <div className="scenario-card-title-row">
                <span className="scenario-card-number" style={{ background: SCENARIO_COLORS[i] }}>{i + 1}</span>
                <div>
                  <div className="scenario-card-name">{s.name}</div>
                  <div className="scenario-card-label">{s.label}</div>
                </div>
              </div>
              <div className="scenario-card-badges">
                <span className="rating-badge" style={{ background: getRatingColor(s.warningCount), color: '#fff' }}>
                  {getRatingLabel(s.warningCount)}
                </span>
                <span className="scenario-card-expand">{expandedIndex === i ? '▲' : '▼'}</span>
              </div>
            </div>
            {expandedIndex === i && (
              <div className="scenario-card-body">
                <div className="scenario-card-metrics">
                  <div className="scenario-metric">
                    <span className="scenario-metric-label">債務残高</span>
                    <span className="scenario-metric-value">{Math.round(s.debt2055).toLocaleString()}兆円</span>
                  </div>
                  <div className="scenario-metric">
                    <span className="scenario-metric-label">利払負担率</span>
                    <span className="scenario-metric-value" style={{ color: s.interestBurden2055 > 30 ? '#ef4444' : '#22c55e' }}>{s.interestBurden2055.toFixed(1)}%</span>
                  </div>
                  <div className="scenario-metric">
                    <span className="scenario-metric-label">貧困率</span>
                    <span className="scenario-metric-value" style={{ color: s.povertyRate2055 > 20 ? '#ef4444' : '#f59e0b' }}>{s.povertyRate2055.toFixed(1)}%</span>
                  </div>
                  <div className="scenario-metric">
                    <span className="scenario-metric-label">対外純資産</span>
                    <span className="scenario-metric-value" style={{ color: s.nfa2055 < 200 ? '#ef4444' : '#22c55e' }}>{Math.round(s.nfa2055).toLocaleString()}兆円</span>
                  </div>
                </div>
                <div className="scenario-analysis-grid">
                  <div className="scenario-analysis-section merits">
                    <div className="scenario-analysis-section-title">✅ メリット</div>
                    <ul>
                      {s.merits.map((m, j) => <li key={j}>{m}</li>)}
                    </ul>
                  </div>
                  <div className="scenario-analysis-section demerits">
                    <div className="scenario-analysis-section-title">⚠️ デメリット</div>
                    <ul>
                      {s.demerits.map((d, j) => <li key={j}>{d}</li>)}
                    </ul>
                  </div>
                </div>
                <div className="scenario-analysis-section policies">
                  <div className="scenario-analysis-section-title">💡 改善に向けた施策</div>
                  <ol>
                    {s.policies.map((p, j) => <li key={j}>{p}</li>)}
                  </ol>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="scenarios-comparison-chart">
        <h3>2055年時点：利払負担率</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={comparisonCharts.burden} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} label={{ value: '%', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip formatter={(value: number) => [`${value}%`]} labelFormatter={(label) => {
              const item = comparisonCharts.burden.find(d => d.name === label)
              return item ? `${label}. ${item.fullName}` : label
            }} />
            <Bar dataKey="利払負担率" fill="#f97316" />
            <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '警告30%', fontSize: 10, fill: '#ef4444' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="scenarios-comparison-chart">
        <h3>2055年時点：貧困率</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={comparisonCharts.poverty} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} label={{ value: '%', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip formatter={(value: number) => [`${value}%`]} labelFormatter={(label) => {
              const item = comparisonCharts.poverty.find(d => d.name === label)
              return item ? `${label}. ${item.fullName}` : label
            }} />
            <Bar dataKey="貧困率" fill="#ef4444" />
            <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '警告20%', fontSize: 10, fill: '#ef4444' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="scenarios-comparison-chart">
        <h3>2055年時点：ジニ係数</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={comparisonCharts.gini} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 'auto']} />
            <Tooltip formatter={(value: number) => [`${value}`]} labelFormatter={(label) => {
              const item = comparisonCharts.gini.find(d => d.name === label)
              return item ? `${label}. ${item.fullName}` : label
            }} />
            <Bar dataKey="ジニ係数" fill="#ec4899" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="scenarios-comparison-chart">
        <h3>2055年時点：債務残高</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={comparisonCharts.debt} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} label={{ value: '兆円', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip formatter={(value: number) => [`${value.toLocaleString()}兆円`]} labelFormatter={(label) => {
              const item = comparisonCharts.debt.find(d => d.name === label)
              return item ? `${label}. ${item.fullName}` : label
            }} />
            <Bar dataKey="債務残高" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="scenarios-comparison-chart">
        <h3>2055年時点：対外純資産</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={comparisonCharts.nfa} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} label={{ value: '兆円', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip formatter={(value: number) => [`${value.toLocaleString()}兆円`]} labelFormatter={(label) => {
              const item = comparisonCharts.nfa.find(d => d.name === label)
              return item ? `${label}. ${item.fullName}` : label
            }} />
            <Bar dataKey="対外純資産" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="scenarios-eval-bars">
        <h3>シナリオ総合評価（0〜100、高いほど良好）</h3>
        {evalBarData.metrics.map(m => (
          <div key={m.key} className="scenarios-comparison-chart" style={{ marginBottom: 8 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 4px 0' }}>{m.label}</h4>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={evalBarData.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => [`${value}点`]} labelFormatter={(label) => {
                  const item = evalBarData.data.find(d => d.name === label)
                  return item ? `${label}. ${item.fullName}` : label
                }} />
                <Bar dataKey={m.label} fill={m.color} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      <div className="scenarios-timeseries-section">
        <h3>利払負担率の推移比較（2026〜2055年）</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={debtTimeSeriesData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} label={{ value: '%', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip formatter={(value: number, name: string) => {
              const idx = parseInt(name.replace('s', ''))
              return [`${value}%`, summaries[idx]?.shortName || name]
            }} />
            <Legend formatter={(value: string) => {
              const idx = parseInt(value.replace('s', ''))
              return summaries[idx]?.shortName || value
            }} wrapperStyle={{ fontSize: 10 }} />
            <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '警告ライン', fontSize: 10, fill: '#ef4444' }} />
            {summaries.map((_, i) => (
              <Line key={i} type="monotone" dataKey={`s${i}`} stroke={SCENARIO_COLORS[i]} strokeWidth={1.5} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
