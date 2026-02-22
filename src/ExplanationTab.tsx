import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell
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

  const bojRevVal = p.initDebt * (p.bojYield / 100)
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
      const bojP = p.initDebt * (p.bojYield / 100) - p.bojCA * pr
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
      <h2 className="section-title">統合政府の仕組み</h2>

      <Expander title="統合政府の資金フロー図（家計・為替影響を含む）" defaultOpen={true}>
        <svg viewBox="0 0 800 750" style={{ width: '100%', maxWidth: 800, display: 'block', margin: '0 auto' }}>
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
            <marker id="ah-pink" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#ec4899" />
            </marker>
            <filter id="shadow" x="-4%" y="-4%" width="108%" height="108%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
            </filter>
          </defs>

          {/* === Outer frame + title === */}
          <rect x="5" y="5" width="790" height="740" rx="12" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
          <text x="400" y="28" textAnchor="middle" fontSize="14" fill="#64748b" fontWeight="700">統合政府の資金フロー（家計・為替影響を含む）</text>

          {/* === Zone: 国内 frame === */}
          <rect x="12" y="38" width="555" height="540" rx="10" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="16" y="38" width="40" height="18" rx="3" fill="#94a3b8" />
          <text x="36" y="51" textAnchor="middle" fontSize="10" fill="white" fontWeight="600">国内</text>

          {/* === Zone: 海外 (right column) === */}
          <rect x="575" y="38" width="215" height="540" rx="10" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
          <rect x="579" y="38" width="40" height="18" rx="3" fill="#d97706" />
          <text x="599" y="51" textAnchor="middle" fontSize="10" fill="white" fontWeight="600">海外</text>

          {/* === Sub-zone: 公的セクター === */}
          <rect x="20" y="62" width="540" height="220" rx="8" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
          <text x="32" y="78" fontSize="11" fill="#3b82f6" fontWeight="700">公的セクター</text>

          {/* === 統合政府 frame === */}
          <rect x="30" y="85" width="520" height="185" rx="8" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5" />
          <text x="290" y="102" textAnchor="middle" fontSize="10" fill="#3b82f6" fontWeight="600">統合政府</text>

          {/* 政府 box */}
          <rect x="60" y="110" width="210" height="56" rx="10" fill="#3b82f6" filter="url(#shadow)" />
          <text x="165" y="135" textAnchor="middle" fontSize="14" fill="white" fontWeight="700">日本政府（財務省）</text>
          <text x="165" y="153" textAnchor="middle" fontSize="10" fill="white" opacity="0.9">税収・歳出・国債発行を管理</text>

          {/* 日銀 box */}
          <rect x="310" y="110" width="210" height="56" rx="10" fill="#8b5cf6" filter="url(#shadow)" />
          <text x="415" y="135" textAnchor="middle" fontSize="14" fill="white" fontWeight="700">日本銀行（BOJ）</text>
          <text x="415" y="153" textAnchor="middle" fontSize="10" fill="white" opacity="0.9">金融政策・国債保有・当座預金</text>

          {/* 政府→日銀: 国庫納付金 */}
          <line x1="415" y1="110" x2="270" y2="110" stroke="#22c55e" strokeWidth="2.5" markerEnd="url(#ah-green)" />
          <rect x="295" y="95" width="80" height="18" rx="3" fill="white" stroke="#22c55e" strokeWidth="1" />
          <text x="335" y="108" textAnchor="middle" fontSize="9" fill="#22c55e" fontWeight="600">国庫納付金</text>

          {/* 政府→日銀 下矢印: 政策金利 */}
          <line x1="270" y1="166" x2="310" y2="166" stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#ah-purple)" />

          {/* === Sub-zone: 民間セクター === */}
          <rect x="20" y="290" width="540" height="282" rx="8" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" opacity="0.5" />
          <text x="32" y="306" fontSize="11" fill="#16a34a" fontWeight="700">民間セクター</text>

          {/* 金融機関 box */}
          <rect x="40" y="315" width="220" height="50" rx="10" fill="#059669" filter="url(#shadow)" />
          <text x="150" y="337" textAnchor="middle" fontSize="13" fill="white" fontWeight="700">金融機関</text>
          <text x="150" y="354" textAnchor="middle" fontSize="9" fill="white" opacity="0.9">国債購入・当座預金</text>

          {/* 非金融機関企業 box */}
          <rect x="40" y="380" width="220" height="50" rx="10" fill="#475569" filter="url(#shadow)" />
          <text x="150" y="402" textAnchor="middle" fontSize="13" fill="white" fontWeight="700">非金融機関企業</text>
          <text x="150" y="419" textAnchor="middle" fontSize="9" fill="white" opacity="0.9">生産・輸出入・賃金支払</text>

          {/* 家計 box */}
          <rect x="40" y="445" width="220" height="65" rx="10" fill="#ec4899" filter="url(#shadow)" />
          <text x="150" y="465" textAnchor="middle" fontSize="13" fill="white" fontWeight="700">🏠 家計（モデル年収400万円）</text>
          <text x="150" y="481" textAnchor="middle" fontSize="9" fill="white" opacity="0.9">賃金収入 → 税・社保30% → 可処分所得</text>
          <text x="150" y="497" textAnchor="middle" fontSize="9" fill="white" opacity="0.9">食費(25.5%) + 光熱費(7.3%) = 生活コスト</text>

          {/* === 海外 boxes === */}
          <rect x="595" y="70" width="180" height="100" rx="10" fill="#b45309" filter="url(#shadow)" />
          <text x="685" y="100" textAnchor="middle" fontSize="13" fill="white" fontWeight="700">貿易相手国</text>
          <text x="685" y="118" textAnchor="middle" fontSize="9" fill="white" opacity="0.9">輸出入取引</text>
          <text x="685" y="135" textAnchor="middle" fontSize="9" fill="white" opacity="0.9">世界経済成長率の影響</text>
          <text x="685" y="155" textAnchor="middle" fontSize="9" fill="white" opacity="0.9">円安→輸出増・輸入高</text>

          <rect x="595" y="185" width="180" height="55" rx="10" fill="#7c3aed" filter="url(#shadow)" />
          <text x="685" y="210" textAnchor="middle" fontSize="13" fill="white" fontWeight="700">海外投資家</text>
          <text x="685" y="228" textAnchor="middle" fontSize="9" fill="white" opacity="0.9">国債保有・対外純資産</text>

          {/* 外貨準備・経常収支 annotation */}
          <rect x="595" y="255" width="180" height="55" rx="8" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
          <text x="685" y="275" textAnchor="middle" fontSize="10" fill="#92400e" fontWeight="600">外貨準備 ≈ 180兆円</text>
          <text x="685" y="293" textAnchor="middle" fontSize="9" fill="#92400e">円安時に評価益が発生</text>

          {/* === Arrows: 公的 ↔ 民間 === */}

          {/* 政府→金融機関: 国債発行 */}
          <line x1="165" y1="166" x2="150" y2="313" stroke="#f97316" strokeWidth="2.5" markerEnd="url(#ah-orange)" />
          <rect x="90" y="225" width="80" height="18" rx="3" fill="white" stroke="#f97316" strokeWidth="1" />
          <text x="130" y="238" textAnchor="middle" fontSize="9" fill="#f97316" fontWeight="600">国債発行💴</text>

          {/* 金融機関→日銀: 国債売却 */}
          <line x1="260" y1="330" x2="415" y2="168" stroke="#14b8a6" strokeWidth="2.5" markerEnd="url(#ah-teal)" />
          <rect x="300" y="235" width="80" height="18" rx="3" fill="white" stroke="#14b8a6" strokeWidth="1" />
          <text x="340" y="248" textAnchor="middle" fontSize="9" fill="#14b8a6" fontWeight="600">国債売却📉</text>

          {/* 日銀→金融機関: 当座預金 */}
          <line x1="415" y1="168" x2="260" y2="340" stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#ah-purple)" />
          <rect x="375" y="238" width="78" height="18" rx="3" fill="white" stroke="#8b5cf6" strokeWidth="1" />
          <text x="414" y="251" textAnchor="middle" fontSize="9" fill="#8b5cf6" fontWeight="600">当座預金💰</text>

          {/* 政府←企業+家計: 税金納付 */}
          <line x1="100" y1="380" x2="100" y2="168" stroke="#3b82f6" strokeWidth="2.5" markerEnd="url(#ah-blue)" />
          <rect x="32" y="255" width="70" height="18" rx="3" fill="white" stroke="#3b82f6" strokeWidth="1" />
          <text x="67" y="268" textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="600">税金納付</text>

          {/* 政府→企業+家計: 公共サービス */}
          <line x1="130" y1="168" x2="130" y2="378" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#ah-red)" />
          <rect x="132" y="255" width="78" height="18" rx="3" fill="white" stroke="#ef4444" strokeWidth="1" />
          <text x="171" y="268" textAnchor="middle" fontSize="9" fill="#ef4444" fontWeight="600">公共サービス</text>

          {/* 家計→政府: 税・社保30% */}
          <line x1="80" y1="445" x2="80" y2="168" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#ah-blue)" />
          <rect x="15" y="370" width="62" height="18" rx="3" fill="white" stroke="#3b82f6" strokeWidth="1" />
          <text x="46" y="383" textAnchor="middle" fontSize="8" fill="#3b82f6" fontWeight="600">税・社保30%</text>

          {/* 企業→家計: 賃金支払 */}
          <line x1="180" y1="430" x2="180" y2="443" stroke="#22c55e" strokeWidth="2.5" markerEnd="url(#ah-green)" />
          <rect x="195" y="428" width="60" height="18" rx="3" fill="white" stroke="#22c55e" strokeWidth="1" />
          <text x="225" y="441" textAnchor="middle" fontSize="9" fill="#22c55e" fontWeight="600">賃金支払</text>

          {/* === Arrows: 国内 ↔ 海外 === */}

          {/* 企業→海外: 輸出 */}
          <line x1="260" y1="390" x2="593" y2="110" stroke="#d97706" strokeWidth="2.5" markerEnd="url(#ah-amber)" />
          <rect x="400" y="240" width="56" height="18" rx="3" fill="white" stroke="#d97706" strokeWidth="1" />
          <text x="428" y="253" textAnchor="middle" fontSize="9" fill="#d97706" fontWeight="600">輸出📦</text>

          {/* 海外→企業: 輸入 */}
          <line x1="593" y1="130" x2="260" y2="405" stroke="#e11d48" strokeWidth="2.5" markerEnd="url(#ah-rose)" />
          <rect x="460" y="255" width="60" height="18" rx="3" fill="white" stroke="#e11d48" strokeWidth="1" />
          <text x="490" y="268" textAnchor="middle" fontSize="9" fill="#e11d48" fontWeight="600">輸入🛢️</text>

          {/* 海外→政府: 外貨準備評価益 */}
          <path d="M 595 275 C 540 275 400 240 270 166" fill="none" stroke="#d97706" strokeWidth="2" markerEnd="url(#ah-amber)" />
          <rect x="405" y="195" width="120" height="18" rx="3" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
          <text x="465" y="208" textAnchor="middle" fontSize="8" fill="#92400e" fontWeight="600">外貨準備評価益→歳入</text>

          {/* 円安→法人税↑・補助金↑ */}
          <path d="M 595 155 C 520 200 360 210 220 168" fill="none" stroke="#e11d48" strokeWidth="2" markerEnd="url(#ah-rose)" />
          <rect x="390" y="174" width="120" height="18" rx="3" fill="#fff1f2" stroke="#e11d48" strokeWidth="1" />
          <text x="450" y="187" textAnchor="middle" fontSize="8" fill="#e11d48" fontWeight="600">円安→法人税↑・補助金↑</text>

          {/* 海外→家計: 円安→物価↑→生活費↑ */}
          <path d="M 595 160 C 520 320 400 400 262 470" fill="none" stroke="#ec4899" strokeWidth="2" markerEnd="url(#ah-pink)" />
          <rect x="355" y="355" width="120" height="18" rx="3" fill="#fdf2f8" stroke="#ec4899" strokeWidth="1" />
          <text x="415" y="368" textAnchor="middle" fontSize="8" fill="#ec4899" fontWeight="600">円安→物価↑→生活費↑</text>

          {/* 家計→海外: 食費・光熱費支出(輸入) */}
          <path d="M 260 480 C 400 510 550 400 593 150" fill="none" stroke="#e11d48" strokeWidth="2" markerEnd="url(#ah-rose)" />
          <rect x="395" y="430" width="100" height="18" rx="3" fill="#fff1f2" stroke="#e11d48" strokeWidth="1" />
          <text x="445" y="443" textAnchor="middle" fontSize="8" fill="#e11d48" fontWeight="600">食費・光熱費支出</text>

          {/* === Zone: 市場 (bottom bar) === */}
          <rect x="12" y="585" width="778" height="55" rx="8" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
          <rect x="16" y="585" width="40" height="18" rx="3" fill="#94a3b8" />
          <text x="36" y="598" textAnchor="middle" fontSize="10" fill="white" fontWeight="600">市場</text>

          <rect x="60" y="595" width="160" height="36" rx="8" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5" />
          <text x="140" y="613" textAnchor="middle" fontSize="11" fill="#92400e" fontWeight="700">💱 為替市場</text>
          <text x="140" y="626" textAnchor="middle" fontSize="9" fill="#92400e">円安↑ / 円高↓</text>

          <rect x="240" y="595" width="160" height="36" rx="8" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
          <text x="320" y="613" textAnchor="middle" fontSize="11" fill="#1e40af" fontWeight="700">📊 国債市場</text>
          <text x="320" y="626" textAnchor="middle" fontSize="9" fill="#1e40af">金利形成</text>

          <rect x="420" y="595" width="160" height="36" rx="8" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1.5" />
          <text x="500" y="613" textAnchor="middle" fontSize="11" fill="#166534" fontWeight="700">📈 資産市場</text>
          <text x="500" y="626" textAnchor="middle" fontSize="9" fill="#166534">資産価格→格差</text>

          {/* === Summary box === */}
          <rect x="12" y="648" width="778" height="42" rx="6" fill="#fdf2f8" stroke="#ec4899" strokeWidth="1" opacity="0.8" />
          <text x="30" y="664" fontSize="9" fill="#92400e" fontWeight="600">家計への影響まとめ：</text>
          <text x="30" y="678" fontSize="8.5" fill="#64748b">賃金収入 − 税・社保(30%) − 食費(CPI連動) − 光熱費(円安連動) = 可処分所得 → 貧困率・格差に影響　|　円安 → 輸入物価↑ → CPI↑ → 実質賃金↓ → 貧困率↑</text>

          {/* === Legend === */}
          <g transform="translate(20, 700)">
            <circle cx="8" cy="8" r="4" fill="#3b82f6" /><text x="16" y="12" fontSize="9" fill="#475569">税金</text>
            <circle cx="52" cy="8" r="4" fill="#ef4444" /><text x="60" y="12" fontSize="9" fill="#475569">公共サービス</text>
            <circle cx="140" cy="8" r="4" fill="#f97316" /><text x="148" y="12" fontSize="9" fill="#475569">国債発行</text>
            <circle cx="212" cy="8" r="4" fill="#14b8a6" /><text x="220" y="12" fontSize="9" fill="#475569">国債売却</text>
            <circle cx="280" cy="8" r="4" fill="#22c55e" /><text x="288" y="12" fontSize="9" fill="#475569">賃金・納付金</text>
            <circle cx="370" cy="8" r="4" fill="#8b5cf6" /><text x="378" y="12" fontSize="9" fill="#475569">当座預金</text>
            <circle cx="432" cy="8" r="4" fill="#d97706" /><text x="440" y="12" fontSize="9" fill="#475569">輸出</text>
            <circle cx="472" cy="8" r="4" fill="#e11d48" /><text x="480" y="12" fontSize="9" fill="#475569">輸入・生活費</text>
            <circle cx="558" cy="8" r="4" fill="#ec4899" /><text x="566" y="12" fontSize="9" fill="#475569">家計</text>
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
          <p>一見すると、金利が上がれば政府の利払い費は増加しますが、日銀の保有国債からの利息収入も増えるため、統合政府としては相殺されるように見えます。しかし実際には：</p>
          <ol style={{ paddingLeft: 20, marginTop: 8 }}>
            <li><strong>タイムラグ</strong>：利払い費は9年借換ロジックで徐々に上昇するが、日銀の保有国債利回りはさらに遅れて上昇</li>
            <li><strong>逆ざや問題</strong>：金利上昇初期は当座預金への付利コストが先に増え、日銀が赤字に陥る</li>
            <li><strong>国債保有比率</strong>：日銀が全国債を保有しているわけではないため、完全な相殺にはならない</li>
            <li><strong>信認リスク</strong>：金利が急騰する場合、国債市場の信認低下が同時に発生し、さらなる金利上昇を招く悪循環</li>
          </ol>
        </div>
      </Expander>

      <h2 className="section-title" style={{ marginTop: 24 }}>シミュレーターの目的</h2>
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

      <h2 className="section-title" style={{ marginTop: 24 }}>計算ロジックの全体像</h2>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>各セクションをクリックすると詳細な解説が展開されます。</p>

      <TreeSection title="A：歳入合計 = 税収合計 + 日銀納付金 + その他収入" tree={`├── 税収合計 = 消費税 + 所得税 + 法人税 + その他税
│   ├── 消費税 = 前年消費税 × (1 + インフレ率 × 1.0)
│   │   └── ※税率変更年度に (新税率/10) を乗じて水準調整
│   ├── 所得税 = 前年所得税 × (1 + 名目成長率 × 1.4)
│   │   └── 名目成長率 = インフレ率 + 実質成長率
│   ├── 法人税 = 前年法人税 × (1 + 実質成長率×2.0 + インフレ率×0.5)
│   │   └── ※円安効果: × (1 + 輸出利益 − 輸入コスト)
│   └── その他税 = 前年その他税 × (1 + 名目成長率 × 0.8)
│
├── 日銀納付金（統合政府への反映額）
│   ├── 日銀純利益 = 国債利息収入 − 当座預金付利コスト
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
        <p><strong>日銀納付金（逆ザヤ対応）</strong></p>
        <p>日銀純利益 = 保有国債 × 利回り − 当座預金 × 政策金利</p>
        <p>純利益がマイナス（逆ザヤ）の場合、損失は累積されます。累積損失が自己資本バッファ（引当金・準備金 約{p.bojCapitalBuffer}兆円）を超えると、マイナスの納付金が統合政府の歳入を直接減少させます。バッファ内であれば損失は吸収され、納付金はゼロで下げ止まります。</p>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>その他収入：基本その他収入 + 外貨準備評価益×0.1</strong></p>
        <p>円安が進行すると、政府が保有する外貨準備（約1.3兆ドル ≒ 180兆円）のドル建て資産の円換算額が増加し、評価益が発生します。この評価益の一部（10%）を歳入に計上しています。</p>
      </TreeSection>

      <TreeSection title="B：支出合計 = 政策経費 + 利払い費" tree={`├── 政策経費 = 前年政策経費 × (1 + インフレ率) + 自然増 + エネルギー補助金
│   └── エネルギー補助金 = インフレ率 × 補助金率 × 10
│
└── 利払い費 = 前年債務残高 × 平均クーポン
    └── 平均クーポン = 前年クーポン × 8/9 + 市場金利 × 1/9`}>
        <p><strong>政策経費：前年 × (1 + インフレ率) + 自然増{p.naturalIncrease.toFixed(1)}兆円 + エネルギー補助金</strong></p>
        <p>社会保障・公共事業・教育・防衛等の歳出は、物価上昇に伴い名目額が膨らみます。さらに高齢化により年金・医療・介護の給付が毎年構造的に増加するため、自然増を加算しています。</p>
        <p style={{ marginTop: 8 }}><strong>エネルギー補助金</strong>：インフレ率に比例して自動的に増加する政策コスト。高インフレ時（特に円安による輸入物価高騰時）に燃料・電気代の家計負担を軽減する補助金として歳出を押し上げます。家計への波及効果として、補助金率に応じて家計の実効CPI（体感物価）が低下し、光熱費負担が軽減されます。これにより実質賃金・貧困率・可処分所得にも影響します。</p>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>平均クーポン：前年 × 8/9 + 市場金利 × 1/9（9年借換ロジック）</strong></p>
        <p>日本国債の平均残存期間は約9年です。毎年およそ全体の1/9が満期を迎え、その時点の市場金利で借り換えられます。残りの8/9は既発債のため金利は変わりません。</p>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>利払い費：債務残高 × 平均クーポン</strong></p>
        <p>国が発行している国債の元本（債務残高）に対して、加重平均の利率（平均クーポン）を掛けた金額が年間の利息支払い額です。</p>
      </TreeSection>

      <TreeSection title="C：収支・残高" tree={`├── 財政収支 = 歳入合計 − 支出合計
├── 債務残高 = 前年債務残高 + (支出合計 − 歳入合計)
├── 国債発行額 = max(支出合計 − 歳入合計, 0)
└── 利払負担率 = (利払い費 ÷ 税収合計) × 100`}>
        <p><strong>利払負担率：(利払い費 / 税収) × 100</strong></p>
        <p>税収に対する利払い費の比率を見ることで、「稼ぎのうちどれだけが借金の利息に消えるか」を示します。30%を警戒ラインとしているのは、過去に財政危機に陥った国々（ギリシャ、イタリア等）がこの水準前後で市場の信認を失った事例があるためです。</p>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>債務残高：前年残高 + (歳出 − 歳入)</strong></p>
        <p>財政赤字（歳出 {'>'} 歳入）が発生すると、その分だけ新たに国債を発行して資金を調達するため、債務残高が積み上がります。</p>
      </TreeSection>

      <TreeSection title="D：貿易収支" tree={`├── 為替レート = 前年レート × (1 + 円安進行率)
├── 輸入額 = 前年 × (1 + 実質成長率) × (1 + インフレ × 円安係数)
├── 輸出額 = 前年 × (1 + 世界成長率) × (1 + 円安メリット)
└── 貿易収支 = 輸出 − 輸入`}>
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
        <p><strong>主要パラメータ</strong></p>
        <table>
          <thead>
            <tr><th>内部パラメータ</th><th>値</th><th>設定根拠</th></tr>
          </thead>
          <tbody>
            <tr><td>円安メリット係数（輸出）</td><td>0.5</td><td>JETRO推計の中央値</td></tr>
            <tr><td>法人税への輸出利益効果</td><td>0.3</td><td>上場企業の海外売上比率と為替感応度から推計</td></tr>
            <tr><td>法人税への輸入コスト効果</td><td>0.2</td><td>輸入依存度の高い企業割合がやや少ないため</td></tr>
            <tr><td>外貨準備評価益の歳入計上率</td><td>10%</td><td>実現益として計上可能な割合を保守的に設定</td></tr>
            <tr><td>エネルギー補助金</td><td>インフレ率 × 補助金率 × 10</td><td>2022〜2023年の激変緩和対策を参考</td></tr>
          </tbody>
        </table>
      </TreeSection>

      <TreeSection title="E：家計インパクト" tree={`├── CPI上昇 = インフレ率 + 円安コストプッシュ×0.3
├── 実効CPI = CPI上昇 − CPI上昇×補助金率×0.5
├── 実質賃金伸び率 = 名目賃金上昇率 − 実効CPI
├── 貧困率 = 前年 × (1 + (実効CPI-賃金)差 × 感応度)
├── ジニ係数 = 前年 + (資産成長率 − 実質賃金伸び率) × 0.01
├── 所得格差倍率 = (1+ジニ) ÷ (1−ジニ)
└── モデル家計（年収400万円）
　　├── 名目年収 = 400万 × 累積賃金上昇率
　　├── 食費 = 102万 × 累積CPI上昇率
　　├── 光熱費 = 29万 × 累積CPI × 円安係数 × (1−補助金率×0.5)
　　└── 可処分所得 = 年収×0.7 − 食費 − 光熱費`}>
        <p><strong>実質賃金伸び率</strong></p>
        <p>実質賃金伸び率 = 名目賃金上昇率 − 実効CPI</p>
        <p>実効CPI = (インフレ率 + 円安コストプッシュ) × (1 − 補助金率 × 0.5)</p>
        <p>エネルギー補助金により家計が体感する物価上昇（実効CPI）が軽減されます。補助金率が高いほど実効CPIが低下し、実質賃金が改善します。</p>
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr><th>パラメータ</th><th>値</th><th>意味</th><th>設定根拠</th></tr>
          </thead>
          <tbody>
            <tr><td>円安コストプッシュ係数</td><td>0.3</td><td>円安率のうち30%がCPIに転嫁</td><td>日銀「経済・物価情勢の展望」の為替パススルー率推計中央値</td></tr>
            <tr><td>名目賃金上昇率</td><td>サイドバーで設定</td><td>春闘・労働市場の賃上げ率</td><td>厚労省「毎月勤労統計」実績を参考</td></tr>
          </tbody>
        </table>
        <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
        <p><strong>貧困率モデル</strong></p>
        <p>貧困率 = 前年貧困率 × (1 + (実効CPI − 賃金上昇率) × 感応度)</p>
        <p>エネルギー補助金で軽減された実効CPIを用いて計算されます。補助金が手厚いほど実効CPIが下がり、貧困率の悪化が抑制されます。</p>
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr><th>パラメータ</th><th>値</th><th>設定根拠</th></tr>
          </thead>
          <tbody>
            <tr><td>感応度（悪化方向）</td><td>0.5</td><td>OECD諸国の実証研究の中央値</td></tr>
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
        <p style={{ marginTop: 8 }}>トリガー発動時：実効市場金利 = ベース金利 + 通貨リスクプレミアム</p>
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
