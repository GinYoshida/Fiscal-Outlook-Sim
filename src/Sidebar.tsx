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

export function Sidebar({ params, scenarioIndex, onScenarioChange, onParamChange, isOpen, onClose }: SidebarProps & { onClose?: () => void }) {
  const p = params;
  const taxTotal = p.initTaxConsumption + p.initTaxIncome + p.initTaxCorporate + p.initTaxOther;

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

      <h4>外部環境・家計</h4>
      <Slider label="円安進行率 (%/年)" value={p.yenDepreciation} min={-3} max={10} step={0.5}
        tooltip="為替レートの年間変化率。プラスで円安、マイナスで円高。円安は輸入物価を押し上げ家計を圧迫する一方、輸出企業の利益を増やします。"
        onChange={v => onParamChange('yenDepreciation', v)} />
      <Slider label="名目賃金上昇率 (%/年)" value={p.nominalWageGrowth} min={0} max={5} step={0.1}
        tooltip="労働者の名目賃金の年間上昇率。インフレ率を下回ると実質賃金が低下し、貧困率の上昇・消費の停滞を招きます。"
        onChange={v => onParamChange('nominalWageGrowth', v)} />
      <Slider label="世界経済成長率 (%)" value={p.globalGrowth} min={0} max={5} step={0.1}
        tooltip="世界経済全体の成長率。日本の輸出額に直接影響します。先進国中心に2〜3%が一般的です。"
        onChange={v => onParamChange('globalGrowth', v)} />
      <Slider label="貧困率感応度" value={p.povertySensitivity} min={0.1} max={1.0} step={0.1}
        tooltip="物価上昇と賃金の乖離が貧困率にどれだけ影響するかの感応度パラメータ。値が大きいほどインフレが家計に打撃を与えます。"
        onChange={v => onParamChange('povertySensitivity', v)} />
      <Slider label="エネルギー補助金率" value={p.energySubsidyRate} min={0} max={1.0} step={0.1}
        tooltip="インフレに応じて政府が投入するエネルギー補助金の比率。高インフレ時に燃料・電気代への補助金が歳出を押し上げます。"
        onChange={v => onParamChange('energySubsidyRate', v)} />

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
      <NumberInput label="日銀自己資本バッファ (兆円)" value={p.bojCapitalBuffer} step={1}
        tooltip="日銀の引当金・準備金（約12兆円）。逆ザヤの累積損失がこのバッファを超えると、マイナスの日銀純利益が統合政府の歳入を直接減少させます。"
        onChange={v => onParamChange('bojCapitalBuffer', v)} />

      <h4>貿易・為替初期値</h4>
      <NumberInput label="為替レート (円/ドル)" value={p.initExchangeRate} step={5}
        tooltip="初期の為替レート（円/ドル）。2024年は約150円/ドルです。円安進行率で毎年変動します。"
        onChange={v => onParamChange('initExchangeRate', v)} />
      <NumberInput label="輸出額 (兆円)" value={p.initExport} step={5}
        tooltip="初期の年間輸出額。2024年度は約100兆円です。世界経済成長率と円安による価格競争力で変動します。"
        onChange={v => onParamChange('initExport', v)} />
      <NumberInput label="輸入額 (兆円)" value={p.initImport} step={5}
        tooltip="初期の年間輸入額。2024年度は約110兆円です。国内成長率とインフレ、円安による輸入物価上昇で変動します。"
        onChange={v => onParamChange('initImport', v)} />
      <NumberInput label="外貨準備 (兆円)" value={p.fxReserves} step={10}
        tooltip="政府の外貨準備高。約1.3兆ドル（約180兆円）。円安時にはドル建て資産の円換算が増加し、評価益が発生します。"
        onChange={v => onParamChange('fxReserves', v)} />

      <h4>対外資産・経常収支</h4>
      <NumberInput label="対外純資産 (兆円)" value={p.initNFA} step={10}
        tooltip="日本の対外純資産。約420兆円（2024年）で世界最大の債権国です。経常収支が赤字になると減少し、一定水準以下で通貨信任リスクが発生します。"
        onChange={v => onParamChange('initNFA', v)} />
      <NumberInput label="NFA防衛ライン (兆円)" value={p.nfaThreshold} step={10}
        tooltip="対外純資産がこの水準を下回り、かつ経常収支が赤字の場合、通貨信任リスクプレミアムが市場金利に自動加算されます。"
        onChange={v => onParamChange('nfaThreshold', v)} />
      <Slider label="通貨リスクプレミアム (%)" value={p.currencyRiskPremium} min={0} max={5} step={0.5}
        tooltip="経常赤字＋NFA低下時に自動で市場金利に上乗せされるリスクプレミアム。通貨の信認低下による国債金利の跳ね上がりを表現します。"
        onChange={v => onParamChange('currencyRiskPremium', v)} />

      <h4>家計初期値</h4>
      <NumberInput label="貧困率 (%)" value={p.initPovertyRate} step={0.1}
        tooltip="相対的貧困率の初期値。2021年の厚労省調査では15.4%です。実質賃金の低下（インフレ＞賃金上昇）で悪化します。"
        onChange={v => onParamChange('initPovertyRate', v)} />
      <NumberInput label="ジニ係数" value={p.initGini} step={0.001}
        tooltip="所得格差を示す指標（0=完全平等、1=完全不平等）。日本は約0.334（2021年）。資産価格上昇と実質賃金低下の差で拡大します。"
        onChange={v => onParamChange('initGini', v)} />

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
