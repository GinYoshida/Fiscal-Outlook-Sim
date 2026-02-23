export default function FlowDiagram() {
  return (
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

      <rect x="5" y="5" width="790" height="740" rx="12" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
      <text x="400" y="28" textAnchor="middle" fontSize="14" fill="#64748b" fontWeight="700">統合政府の資金フロー（家計・為替影響を含む）</text>

      <rect x="12" y="38" width="555" height="540" rx="10" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
      <rect x="16" y="38" width="40" height="18" rx="3" fill="#94a3b8" />
      <text x="36" y="51" textAnchor="middle" fontSize="10" fill="white" fontWeight="600">国内</text>

      <rect x="575" y="38" width="215" height="540" rx="10" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
      <rect x="579" y="38" width="40" height="18" rx="3" fill="#d97706" />
      <text x="599" y="51" textAnchor="middle" fontSize="10" fill="white" fontWeight="600">海外</text>

      <rect x="20" y="62" width="540" height="220" rx="8" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
      <text x="32" y="78" fontSize="11" fill="#3b82f6" fontWeight="700">公的セクター</text>

      <rect x="30" y="85" width="520" height="185" rx="8" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5" />
      <text x="290" y="102" textAnchor="middle" fontSize="10" fill="#3b82f6" fontWeight="600">統合政府</text>

      <rect x="60" y="110" width="210" height="56" rx="10" fill="#3b82f6" filter="url(#shadow)" />
      <text x="165" y="135" textAnchor="middle" fontSize="14" fill="white" fontWeight="700">日本政府（財務省）</text>
      <text x="165" y="153" textAnchor="middle" fontSize="10" fill="white" opacity="0.9">税収・歳出・国債発行を管理</text>

      <rect x="310" y="110" width="210" height="56" rx="10" fill="#8b5cf6" filter="url(#shadow)" />
      <text x="415" y="135" textAnchor="middle" fontSize="14" fill="white" fontWeight="700">日本銀行（BOJ）</text>
      <text x="415" y="153" textAnchor="middle" fontSize="10" fill="white" opacity="0.9">金融政策・国債保有・当座預金</text>

      <line x1="415" y1="110" x2="270" y2="110" stroke="#22c55e" strokeWidth="2.5" markerEnd="url(#ah-green)" />
      <rect x="295" y="95" width="80" height="18" rx="3" fill="white" stroke="#22c55e" strokeWidth="1" />
      <text x="335" y="108" textAnchor="middle" fontSize="9" fill="#22c55e" fontWeight="600">国庫納付金</text>

      <line x1="270" y1="166" x2="310" y2="166" stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#ah-purple)" />

      <rect x="20" y="290" width="540" height="282" rx="8" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" opacity="0.5" />
      <text x="32" y="306" fontSize="11" fill="#16a34a" fontWeight="700">民間セクター</text>

      <rect x="40" y="315" width="220" height="50" rx="10" fill="#059669" filter="url(#shadow)" />
      <text x="150" y="337" textAnchor="middle" fontSize="13" fill="white" fontWeight="700">金融機関</text>
      <text x="150" y="354" textAnchor="middle" fontSize="9" fill="white" opacity="0.9">国債購入・当座預金</text>

      <rect x="40" y="380" width="220" height="50" rx="10" fill="#475569" filter="url(#shadow)" />
      <text x="150" y="402" textAnchor="middle" fontSize="13" fill="white" fontWeight="700">非金融機関企業</text>
      <text x="150" y="419" textAnchor="middle" fontSize="9" fill="white" opacity="0.9">生産・輸出入・賃金支払</text>

      <rect x="40" y="445" width="220" height="65" rx="10" fill="#ec4899" filter="url(#shadow)" />
      <text x="150" y="465" textAnchor="middle" fontSize="13" fill="white" fontWeight="700">🏠 家計（モデル年収400万円）</text>
      <text x="150" y="481" textAnchor="middle" fontSize="9" fill="white" opacity="0.9">賃金収入 → 税・社保30% → 可処分所得</text>
      <text x="150" y="497" textAnchor="middle" fontSize="9" fill="white" opacity="0.9">食費(25.5%) + 光熱費(7.3%) = 生活コスト</text>

      <rect x="595" y="70" width="180" height="100" rx="10" fill="#b45309" filter="url(#shadow)" />
      <text x="685" y="100" textAnchor="middle" fontSize="13" fill="white" fontWeight="700">貿易相手国</text>
      <text x="685" y="118" textAnchor="middle" fontSize="9" fill="white" opacity="0.9">輸出入取引</text>
      <text x="685" y="135" textAnchor="middle" fontSize="9" fill="white" opacity="0.9">世界経済成長率の影響</text>
      <text x="685" y="155" textAnchor="middle" fontSize="9" fill="white" opacity="0.9">円安→輸出増・輸入高</text>

      <rect x="595" y="185" width="180" height="55" rx="10" fill="#7c3aed" filter="url(#shadow)" />
      <text x="685" y="210" textAnchor="middle" fontSize="13" fill="white" fontWeight="700">海外投資家</text>
      <text x="685" y="228" textAnchor="middle" fontSize="9" fill="white" opacity="0.9">国債保有・対外純資産</text>

      <rect x="595" y="255" width="180" height="55" rx="8" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
      <text x="685" y="275" textAnchor="middle" fontSize="10" fill="#92400e" fontWeight="600">外貨準備 ≈ 180兆円</text>
      <text x="685" y="293" textAnchor="middle" fontSize="9" fill="#92400e">円安時に評価益が発生</text>

      <line x1="165" y1="166" x2="150" y2="313" stroke="#f97316" strokeWidth="2.5" markerEnd="url(#ah-orange)" />
      <rect x="90" y="225" width="80" height="18" rx="3" fill="white" stroke="#f97316" strokeWidth="1" />
      <text x="130" y="238" textAnchor="middle" fontSize="9" fill="#f97316" fontWeight="600">国債発行💴</text>

      <line x1="260" y1="330" x2="415" y2="168" stroke="#14b8a6" strokeWidth="2.5" markerEnd="url(#ah-teal)" />
      <rect x="300" y="235" width="80" height="18" rx="3" fill="white" stroke="#14b8a6" strokeWidth="1" />
      <text x="340" y="248" textAnchor="middle" fontSize="9" fill="#14b8a6" fontWeight="600">国債売却📉</text>

      <line x1="415" y1="168" x2="260" y2="340" stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#ah-purple)" />
      <rect x="375" y="238" width="78" height="18" rx="3" fill="white" stroke="#8b5cf6" strokeWidth="1" />
      <text x="414" y="251" textAnchor="middle" fontSize="9" fill="#8b5cf6" fontWeight="600">当座預金💰</text>

      <line x1="100" y1="380" x2="100" y2="168" stroke="#3b82f6" strokeWidth="2.5" markerEnd="url(#ah-blue)" />
      <rect x="32" y="255" width="70" height="18" rx="3" fill="white" stroke="#3b82f6" strokeWidth="1" />
      <text x="67" y="268" textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="600">税金納付</text>

      <line x1="130" y1="168" x2="130" y2="378" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#ah-red)" />
      <rect x="132" y="255" width="78" height="18" rx="3" fill="white" stroke="#ef4444" strokeWidth="1" />
      <text x="171" y="268" textAnchor="middle" fontSize="9" fill="#ef4444" fontWeight="600">公共サービス</text>

      <line x1="80" y1="445" x2="80" y2="168" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#ah-blue)" />
      <rect x="15" y="370" width="62" height="18" rx="3" fill="white" stroke="#3b82f6" strokeWidth="1" />
      <text x="46" y="383" textAnchor="middle" fontSize="8" fill="#3b82f6" fontWeight="600">税・社保30%</text>

      <line x1="180" y1="430" x2="180" y2="443" stroke="#22c55e" strokeWidth="2.5" markerEnd="url(#ah-green)" />
      <rect x="195" y="428" width="60" height="18" rx="3" fill="white" stroke="#22c55e" strokeWidth="1" />
      <text x="225" y="441" textAnchor="middle" fontSize="9" fill="#22c55e" fontWeight="600">賃金支払</text>

      <line x1="260" y1="390" x2="593" y2="110" stroke="#d97706" strokeWidth="2.5" markerEnd="url(#ah-amber)" />
      <rect x="400" y="240" width="56" height="18" rx="3" fill="white" stroke="#d97706" strokeWidth="1" />
      <text x="428" y="253" textAnchor="middle" fontSize="9" fill="#d97706" fontWeight="600">輸出📦</text>

      <line x1="593" y1="130" x2="260" y2="405" stroke="#e11d48" strokeWidth="2.5" markerEnd="url(#ah-rose)" />
      <rect x="460" y="255" width="60" height="18" rx="3" fill="white" stroke="#e11d48" strokeWidth="1" />
      <text x="490" y="268" textAnchor="middle" fontSize="9" fill="#e11d48" fontWeight="600">輸入🛢️</text>

      <path d="M 595 275 C 540 275 400 240 270 166" fill="none" stroke="#d97706" strokeWidth="2" markerEnd="url(#ah-amber)" />
      <rect x="405" y="195" width="120" height="18" rx="3" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
      <text x="465" y="208" textAnchor="middle" fontSize="8" fill="#92400e" fontWeight="600">外貨準備評価益→歳入</text>

      <path d="M 595 155 C 520 200 360 210 220 168" fill="none" stroke="#e11d48" strokeWidth="2" markerEnd="url(#ah-rose)" />
      <rect x="390" y="174" width="120" height="18" rx="3" fill="#fff1f2" stroke="#e11d48" strokeWidth="1" />
      <text x="450" y="187" textAnchor="middle" fontSize="8" fill="#e11d48" fontWeight="600">円安→法人税↑・補助金↑</text>

      <path d="M 595 160 C 520 320 400 400 262 470" fill="none" stroke="#ec4899" strokeWidth="2" markerEnd="url(#ah-pink)" />
      <rect x="355" y="355" width="120" height="18" rx="3" fill="#fdf2f8" stroke="#ec4899" strokeWidth="1" />
      <text x="415" y="368" textAnchor="middle" fontSize="8" fill="#ec4899" fontWeight="600">円安→物価↑→生活費↑</text>

      <path d="M 260 480 C 400 510 550 400 593 150" fill="none" stroke="#e11d48" strokeWidth="2" markerEnd="url(#ah-rose)" />
      <rect x="395" y="430" width="100" height="18" rx="3" fill="#fff1f2" stroke="#e11d48" strokeWidth="1" />
      <text x="445" y="443" textAnchor="middle" fontSize="8" fill="#e11d48" fontWeight="600">食費・光熱費支出</text>

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

      <rect x="12" y="648" width="778" height="42" rx="6" fill="#fdf2f8" stroke="#ec4899" strokeWidth="1" opacity="0.8" />
      <text x="30" y="664" fontSize="9" fill="#92400e" fontWeight="600">家計への影響まとめ：</text>
      <text x="30" y="678" fontSize="8.5" fill="#64748b">賃金収入 − 税・社保(30%) − 食費(CPI連動) − 光熱費(円安連動) = 可処分所得 → 貧困率・格差に影響　|　円安 → 輸入物価↑ → CPI↑ → 実質賃金↓ → 貧困率↑</text>

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
  )
}
