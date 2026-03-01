/**
 * SidebarMiniChart.tsx — サイドバー内ミニチャートコンポーネント
 *
 * 金利実績比較チャートと教育投資GDP比チャートの2つのミニチャートを提供する。
 * Sidebar.tsxから外部化されたコンポーネント。
 */

import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts'
import { ACTUAL_MACRO } from '../../data'

interface InterestRateMiniChartProps {
  foreignInterestRate: number;
  inflationRate: number;
  riskPremium: number;
}

export function InterestRateMiniChart({ foreignInterestRate, inflationRate, riskPremium }: InterestRateMiniChartProps) {
  return (
    <div style={{ margin: '8px 0 4px 0' }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>▼ 金利実績と設定値の比較</div>
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={ACTUAL_MACRO} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#94a3b8' }} />
          <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} domain={[-0.5, 5]} />
          <Tooltip contentStyle={{ fontSize: 11, background: '#1e293b', border: '1px solid #334155' }} labelStyle={{ color: '#e2e8f0' }} />
          <Line type="monotone" dataKey="ust10y" name="UST10Y" stroke="#60a5fa" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
          <Line type="monotone" dataKey="jgb10y" name="JGB10Y" stroke="#f87171" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
          <ReferenceLine y={foreignInterestRate} stroke="#60a5fa" strokeDasharray="6 3" strokeWidth={2} label={{ value: `海外${foreignInterestRate}%`, position: 'right', fontSize: 9, fill: '#60a5fa' }} />
          <ReferenceLine y={inflationRate + riskPremium} stroke="#f87171" strokeDasharray="6 3" strokeWidth={2} label={{ value: `国内${(inflationRate + riskPremium).toFixed(1)}%`, position: 'right', fontSize: 9, fill: '#f87171' }} />
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
  )
}

interface EducationMiniChartProps {
  educationGDPRatio: number;
}

export function EducationMiniChart({ educationGDPRatio }: EducationMiniChartProps) {
  return (
    <div style={{ margin: '8px 0 4px 0' }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>▼ 教育投資GDP比の実績と設定値</div>
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={ACTUAL_MACRO} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#94a3b8' }} />
          <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} domain={[2.0, 6.0]} />
          <Tooltip contentStyle={{ fontSize: 11, background: '#1e293b', border: '1px solid #334155' }} labelStyle={{ color: '#e2e8f0' }} />
          <Line type="monotone" dataKey="educationGDPRatio" name="教育投資GDP比" stroke="#34d399" strokeWidth={1.5} dot={{ r: 2 }} />
          <ReferenceLine y={educationGDPRatio} stroke="#34d399" strokeDasharray="6 3" strokeWidth={2} label={{ value: `設定${educationGDPRatio}%`, position: 'right', fontSize: 9, fill: '#34d399' }} />
          <ReferenceLine y={4.9} stroke="#fbbf24" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: 'OECD平均4.9%', position: 'right', fontSize: 9, fill: '#fbbf24' }} />
          <Legend wrapperStyle={{ fontSize: 9 }} />
        </LineChart>
      </ResponsiveContainer>
      <p style={{ fontSize: 10, color: '#64748b', margin: '2px 0 0 0' }}>
        日本の公教育支出GDP比: 3.1〜3.5% / OECD平均: 約4.9%
      </p>
    </div>
  )
}
