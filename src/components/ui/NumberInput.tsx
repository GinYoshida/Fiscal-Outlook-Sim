/**
 * NumberInput.tsx — 数値入力コンポーネント
 *
 * ラベル付きの数値入力フィールドを提供する。
 * Sidebar.tsxから外部化されたコンポーネント。
 */

export interface NumberInputProps {
  label: string;
  value: number;
  step: number;
  tooltip?: string;
  onChange: (v: number) => void;
  searchHidden?: boolean;
}

export function NumberInput({ label, value, step, tooltip, onChange, searchHidden }: NumberInputProps) {
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
