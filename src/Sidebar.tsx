import { SCENARIOS, type SimParams } from './data'

interface SidebarProps {
  params: SimParams;
  scenarioIndex: number;
  onScenarioChange: (index: number) => void;
  onParamChange: <K extends keyof SimParams>(key: K, value: SimParams[K]) => void;
  isOpen: boolean;
}

function Slider({ label, value, min, max, step, tooltip, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  tooltip?: string; onChange: (v: number) => void;
}) {
  return (
    <div className="slider-group">
      <div className="slider-header">
        <label>
          {label}
          {tooltip && (
            <span className="tooltip-icon">
              ?<span className="tooltip-text">{tooltip}</span>
            </span>
          )}
        </label>
        <span className="slider-value">{value.toFixed(step < 1 ? 1 : 0)}{label.includes('%') ? '' : ''}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
    </div>
  )
}

function NumberInput({ label, value, step, tooltip, onChange }: {
  label: string; value: number; step: number;
  tooltip?: string; onChange: (v: number) => void;
}) {
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

export function Sidebar({ params, scenarioIndex, onScenarioChange, onParamChange, isOpen }: SidebarProps) {
  const p = params;
  const taxTotal = p.initTaxConsumption + p.initTaxIncome + p.initTaxCorporate + p.initTaxOther;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
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

      <h4>マクロ経済</h4>
      <Slider label="インフレ率 (%)" value={p.inflationRate} min={0} max={10} step={0.1}
        tooltip="消費者物価の年間上昇率。政策経費の伸びと名目成長率に影響します。日銀の目標は2%です。"
        onChange={v => onParamChange('inflationRate', v)} />
      <Slider label="実質成長率 (%)" value={p.realGrowth} min={-2} max={5} step={0.1}
        tooltip="物価変動を除いた実質GDPの成長率。インフレ率と合算して名目成長率となり、税収の伸びに直結します。"
        onChange={v => onParamChange('realGrowth', v)} />
      <Slider label="リスクプレミアム (%)" value={p.riskPremium} min={0} max={3} step={0.1}
        tooltip="国債の信用リスクに対する上乗せ金利。財政悪化や市場の不安が高まると上昇し、市場金利＝名目成長率＋リスクプレミアムとなります。"
        onChange={v => onParamChange('riskPremium', v)} />

      <h4>初期値（2026年）</h4>
      <NumberInput label="債務残高 (兆円)" value={p.initDebt} step={50}
        tooltip="2026年度のスタート時点での国の借金総額。2024年度末で約1,100兆円です。"
        onChange={v => onParamChange('initDebt', v)} />

      <label style={{ fontWeight: 600, marginTop: 8, marginBottom: 4 }}>税収の内訳</label>
      <NumberInput label="消費税 (兆円)" value={p.initTaxConsumption} step={1}
        tooltip="消費税収の初期値。税率10%（軽減8%）。消費額×インフレ率に連動して伸びます。2024年度実績は約24兆円。"
        onChange={v => onParamChange('initTaxConsumption', v)} />
      <NumberInput label="所得税 (兆円)" value={p.initTaxIncome} step={1}
        tooltip="所得税収の初期値。累進課税のため名目賃金の伸び以上に増加します（弾性値1.4）。2024年度実績は約22兆円。"
        onChange={v => onParamChange('initTaxIncome', v)} />
      <NumberInput label="法人税 (兆円)" value={p.initTaxCorporate} step={1}
        tooltip="法人税収の初期値。企業利益に連動し景気変動に敏感です（実質成長率×2.0＋インフレ率×0.5）。2024年度実績は約17兆円。"
        onChange={v => onParamChange('initTaxCorporate', v)} />
      <NumberInput label="その他税 (兆円)" value={p.initTaxOther} step={1}
        tooltip="相続税・酒税・たばこ税・関税等のその他税収。名目成長率に対して弾性値0.8で緩やかに連動。2024年度実績は約12兆円。"
        onChange={v => onParamChange('initTaxOther', v)} />
      <p className="tax-total">税収合計: <strong>{taxTotal.toFixed(0)} 兆円</strong></p>

      <h4>消費税率設定</h4>
      <label>消費税率変更年度</label>
      <select
        value={p.taxRateChangeYear}
        onChange={e => onParamChange('taxRateChangeYear', e.target.value)}
      >
        {["なし", "2030", "2035", "2040"].map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <Slider label="新消費税率 (%)" value={p.taxRateNew} min={8} max={20} step={1}
        onChange={v => onParamChange('taxRateNew', v)} />

      <NumberInput label="政策的経費 (兆円)" value={p.initPolicyExp} step={5}
        tooltip="2026年度の政策的経費の初期値。社会保障・公共事業・教育・防衛等の歳出合計（利払い費を除く）です。"
        onChange={v => onParamChange('initPolicyExp', v)} />
      <Slider label="平均クーポン (%)" value={p.initAvgCoupon} min={0} max={5} step={0.1}
        tooltip="政府債務全体の加重平均利率。既発債の金利が残るため、市場金利が上がってもすぐには上昇しません。9年借換ロジックで毎年1/9ずつ新金利に置き換わります。"
        onChange={v => onParamChange('initAvgCoupon', v)} />

      <h4>日銀パラメータ</h4>
      <NumberInput label="当座預金 (兆円)" value={p.bojCA} step={50}
        tooltip="金融機関が日銀に預けている預金の残高。金利上昇時、この預金に付利するコストが日銀の負担になります。量的緩和で約550兆円まで膨張しています。"
        onChange={v => onParamChange('bojCA', v)} />
      <Slider label="保有国債利回り (%)" value={p.bojYield} min={0} max={2} step={0.05}
        tooltip="日銀が保有する国債の平均利回り。低金利時代に大量購入したため現在は非常に低い水準です。この利回りから得る利息が日銀の主な収入源です。"
        onChange={v => onParamChange('bojYield', v)} />

      <h4>その他</h4>
      <NumberInput label="その他収入 (兆円/年)" value={p.otherRevenue} step={1}
        tooltip="税外収入（印紙収入、官業収入、政府資産整理収入等）の年間合計。シミュレーション期間中は固定値として扱います。"
        onChange={v => onParamChange('otherRevenue', v)} />
      <NumberInput label="自然増 (兆円/年)" value={p.naturalIncrease} step={0.1}
        tooltip="高齢化に伴う社会保障費（年金・医療・介護）の構造的な年間増加額。財務省の試算では年0.3〜0.7兆円程度とされています。"
        onChange={v => onParamChange('naturalIncrease', v)} />
      <Slider label="政策金利スプレッド (%)" value={p.policyRateSpread} min={0} max={3} step={0.1}
        tooltip="市場金利と日銀の政策金利の差。政策金利＝市場金利−スプレッド（下限0%）。通常1%程度で、日銀は市場金利より低い政策金利を維持します。"
        onChange={v => onParamChange('policyRateSpread', v)} />
    </aside>
  )
}
