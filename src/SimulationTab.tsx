import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, ReferenceLine, AreaChart, Area
} from 'recharts'
import type { SimResult } from './simulation'
import type { ActualDataPoint, SimParams } from './data'
import { ACTUAL_DATA } from './data'

interface Props {
  params: SimParams;
  simData: SimResult[];
  actualData: ActualDataPoint[];
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

export function SimulationTab({ params, simData, actualData }: Props) {
  const [tableView, setTableView] = useState<'5year' | 'full' | 'actual'>('5year')

  const warningData = simData.find(d => d.interestBurden > 30)

  const interestBurdenData = useMemo(() => {
    const actual = actualData.map(d => ({ year: d.year, 利払負担率: d.interestBurden, type: '実績' }))
    const sim = simData.map(d => ({ year: d.year, 利払負担率: parseFloat(d.interestBurden.toFixed(1)), type: 'シミュレーション' }))
    return [...actual, ...sim]
  }, [actualData, simData])

  const fiscalBalanceData = useMemo(() => {
    const actual = actualData.map(d => ({ year: d.year, 財政収支: d.fiscalBalance, type: '実績' }))
    const sim = simData.map(d => ({ year: d.year, 財政収支: parseFloat(d.fiscalBalance.toFixed(1)), type: 'シミュレーション' }))
    return [...actual, ...sim]
  }, [actualData, simData])

  const debtData = useMemo(() => {
    const actual = actualData.map(d => ({ year: d.year, 債務残高: d.debt, type: '実績' }))
    const sim = simData.map(d => ({ year: d.year, 債務残高: Math.round(d.debt), type: 'シミュレーション' }))
    return [...actual, ...sim]
  }, [actualData, simData])

  const revenueData = useMemo(() => {
    const actual = actualData.map(d => ({
      year: d.year, 消費税: d.taxConsumption, 所得税: d.taxIncome, 法人税: d.taxCorporate, その他税: d.taxOther
    }))
    const sim = simData.map(d => ({
      year: d.year, 消費税: parseFloat(d.taxConsumption.toFixed(1)), 所得税: parseFloat(d.taxIncome.toFixed(1)),
      法人税: parseFloat(d.taxCorporate.toFixed(1)), その他税: parseFloat(d.taxOther.toFixed(1))
    }))
    return [...actual, ...sim]
  }, [actualData, simData])

  const expenditureData = useMemo(() => {
    const actual = actualData.map(d => ({ year: d.year, 政策経費: d.policyExp, 利払い費: d.interest }))
    const sim = simData.map(d => ({
      year: d.year, 政策経費: parseFloat(d.policyExp.toFixed(1)), 利払い費: parseFloat(d.interest.toFixed(1))
    }))
    return [...actual, ...sim]
  }, [actualData, simData])

  const bojData = useMemo(() => {
    const actual = actualData.map(d => ({ year: d.year, 日銀納付金: d.bojPayment }))
    const sim = simData.map(d => ({ year: d.year, 日銀納付金: parseFloat(d.bojPayment.toFixed(1)) }))
    return [...actual, ...sim]
  }, [actualData, simData])

  const rateData = useMemo(() => {
    const nominalG = params.inflationRate + params.realGrowth
    const marketRate = nominalG + params.riskPremium
    return simData.map(d => ({
      year: d.year,
      平均クーポン: parseFloat(d.avgCoupon.toFixed(2)),
      市場金利: parseFloat(marketRate.toFixed(2)),
      名目成長率: parseFloat(nominalG.toFixed(2)),
    }))
  }, [params, simData])

  const tableData = useMemo(() => {
    if (tableView === 'actual') {
      return buildActualTable()
    }
    const years = tableView === '5year'
      ? simData.filter((_, i) => i % 5 === 0 || i === 29)
      : simData
    return buildSimTable(years, params)
  }, [tableView, simData, params])

  function buildActualTable() {
    const data = ACTUAL_DATA
    const years = data.map(d => d.year)
    const rows: { label: string; values: string[]; indent?: number }[] = [
      { label: '歳入合計', values: data.map(d => fmt(d.totalRevenue)) },
      { label: '├ 税収合計', values: data.map(d => fmt(d.tax)), indent: 1 },
      { label: '│　├ 消費税', values: data.map(d => fmt(d.taxConsumption)), indent: 2 },
      { label: '│　├ 所得税', values: data.map(d => fmt(d.taxIncome)), indent: 2 },
      { label: '│　├ 法人税', values: data.map(d => fmt(d.taxCorporate)), indent: 2 },
      { label: '│　└ その他税', values: data.map(d => fmt(d.taxOther)), indent: 2 },
      { label: '├ 日銀納付金', values: data.map(d => fmt(d.bojPayment)), indent: 1 },
      { label: '└ その他収入', values: data.map(d => fmt(d.totalRevenue - d.tax - d.bojPayment)), indent: 1 },
      { label: '─', values: years.map(() => '') },
      { label: '支出合計', values: data.map(d => fmt(d.totalCost)) },
      { label: '├ 政策経費', values: data.map(d => fmt(d.policyExp)), indent: 1 },
      { label: '└ 利払い費', values: data.map(d => fmt(d.interest)), indent: 1 },
      { label: '─', values: years.map(() => '') },
      { label: '財政収支', values: data.map(d => fmt(d.fiscalBalance)) },
      { label: '債務残高', values: data.map(d => fmt(d.debt, 0)) },
      { label: '利払負担率 (%)', values: data.map(d => fmt(d.interestBurden)) },
      { label: '平均クーポン (%)', values: data.map(d => fmt(d.avgCoupon)) },
    ]
    return { years, rows }
  }

  function buildSimTable(data: SimResult[], p: SimParams) {
    const years = data.map(d => d.year)
    const rows: { label: string; values: string[]; indent?: number }[] = [
      { label: '歳入合計', values: data.map(d => fmt(d.totalRevenue)) },
      { label: '├ 税収合計', values: data.map(d => fmt(d.tax)), indent: 1 },
      { label: '│　├ 消費税', values: data.map(d => fmt(d.taxConsumption)), indent: 2 },
      { label: '│　├ 所得税', values: data.map(d => fmt(d.taxIncome)), indent: 2 },
      { label: '│　├ 法人税', values: data.map(d => fmt(d.taxCorporate)), indent: 2 },
      { label: '│　└ その他税', values: data.map(d => fmt(d.taxOther)), indent: 2 },
      { label: '├ 日銀納付金', values: data.map(d => fmt(d.bojPayment)), indent: 1 },
      { label: '└ その他収入', values: data.map(() => fmt(p.otherRevenue)), indent: 1 },
      { label: '　　├ 印紙収入', values: data.map(d => fmt(d.otherRevStamp)), indent: 2 },
      { label: '　　├ 官業収入', values: data.map(d => fmt(d.otherRevGov)), indent: 2 },
      { label: '　　├ 資産売却', values: data.map(d => fmt(d.otherRevAsset)), indent: 2 },
      { label: '　　└ 雑収入', values: data.map(d => fmt(d.otherRevMisc)), indent: 2 },
      { label: '─', values: years.map(() => '') },
      { label: '支出合計', values: data.map(d => fmt(d.totalCost)) },
      { label: '├ 政策経費', values: data.map(d => fmt(d.policyExp)), indent: 1 },
      { label: '└ 利払い費', values: data.map(d => fmt(d.interest)), indent: 1 },
      { label: '　　├ 債務残高', values: data.map(d => fmt(d.debt, 0)), indent: 2 },
      { label: '　　└ 平均クーポン', values: data.map(d => fmt(d.avgCoupon, 2) + '%'), indent: 2 },
      { label: '─', values: years.map(() => '') },
      { label: '財政収支', values: data.map(d => fmt(d.fiscalBalance)) },
      { label: '国債発行額', values: data.map(d => fmt(d.bondIssuance)) },
      { label: '債務残高', values: data.map(d => fmt(d.debt, 0)) },
      { label: '利払負担率 (%)', values: data.map(d => fmt(d.interestBurden)) },
    ]
    return { years, rows }
  }

  return (
    <div>
      {warningData ? (
        <div className="warning-box">
          ⚠️ {warningData.year}年に利払い負担率が {warningData.interestBurden.toFixed(1)}%に達し、30%の警戒ラインを超えます。
        </div>
      ) : (
        <div className="success-box">
          ✓ シミュレーション期間中、利払い負担率は30%の警戒ラインを超えません。
        </div>
      )}

      <div className="chart-container">
        <div className="chart-title">利払い負担率の推移 （税収に対する利払い費の割合）</div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={interestBurdenData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
            <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="5 5" label={{ value: '警戒ライン30%', fill: '#ef4444', fontSize: 11 }} />
            <Area type="monotone" dataKey="利払負担率" stroke="#f97316" fill="#fed7aa" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <div className="chart-title">財政収支の推移 （歳入 − 歳出）</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fiscalBalanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="兆円" />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)} 兆円`} />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Bar dataKey="財政収支" fill={(entry: Record<string, unknown>) => ((entry as {財政収支: number}).財政収支 >= 0 ? '#22c55e' : '#ef4444')} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <div className="chart-title">債務残高の推移</div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={debtData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="兆円" />
            <Tooltip formatter={(v: number) => `${v.toLocaleString()} 兆円`} />
            <Area type="monotone" dataKey="債務残高" stroke="#3b82f6" fill="#bfdbfe" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <Collapsible title="歳入合計・税収内訳">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="兆円" />
            <Tooltip />
            <Legend />
            <Bar dataKey="消費税" stackId="a" fill="#3b82f6" />
            <Bar dataKey="所得税" stackId="a" fill="#22c55e" />
            <Bar dataKey="法人税" stackId="a" fill="#f97316" />
            <Bar dataKey="その他税" stackId="a" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </Collapsible>

      <Collapsible title="支出合計">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={expenditureData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="兆円" />
            <Tooltip />
            <Legend />
            <Bar dataKey="政策経費" stackId="a" fill="#3b82f6" />
            <Bar dataKey="利払い費" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </Collapsible>

      <Collapsible title="日銀納付金">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bojData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="兆円" />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)} 兆円`} />
            <Bar dataKey="日銀納付金" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </Collapsible>

      <Collapsible title="金利・成長率・リスクプレミアム">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={rateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="平均クーポン" stroke="#ef4444" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="市場金利" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            <Line type="monotone" dataKey="名目成長率" stroke="#22c55e" strokeWidth={2} dot={false} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </Collapsible>

      <h2 className="section-title" style={{ marginTop: 24 }}>データ表</h2>
      <div className="view-toggle">
        <button className={tableView === '5year' ? 'active' : ''} onClick={() => setTableView('5year')}>5年おき</button>
        <button className={tableView === 'full' ? 'active' : ''} onClick={() => setTableView('full')}>全30年</button>
        <button className={tableView === 'actual' ? 'active' : ''} onClick={() => setTableView('actual')}>実績 2015-2024</button>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>項目</th>
              {tableData.years.map(y => <th key={y}>{y}</th>)}
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
                  {row.values.map((v, j) => <td key={j}>{v}</td>)}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
