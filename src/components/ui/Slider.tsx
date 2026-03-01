/**
 * Slider.tsx — スライダー入力コンポーネント
 *
 * レンジスライダーと数値入力を組み合わせたパラメータ調整UIを提供する。
 * Sidebar.tsxから外部化されたコンポーネント。
 */

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  tooltip?: string;
  onChange: (v: number) => void;
  searchHidden?: boolean;
}

export function Slider({ label, value, min, max, step, tooltip, onChange, searchHidden }: SliderProps) {
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
