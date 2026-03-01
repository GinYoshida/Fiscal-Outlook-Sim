/**
 * ConstraintRow.tsx — 制約条件行コンポーネント
 *
 * 最適化の制約条件（レッドライン）の個別行UIを提供する。
 * チェックボックス、ラベル、閾値入力、単位表示を含む。
 * Sidebar.tsxから外部化されたコンポーネント。
 */

export interface ConstraintRowProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  label: string;
  threshold: number;
  onThresholdChange: (value: number) => void;
  step: number;
  min: number;
  max: number;
  defaultValue: number;
  unit?: string;
  note?: string;
}

export function ConstraintRow({ enabled, onEnabledChange, label, threshold, onThresholdChange, step, min, max, defaultValue, unit, note }: ConstraintRowProps) {
  return (
    <>
      <label className="constraint-row">
        <input type="checkbox" checked={enabled}
          onChange={e => onEnabledChange(e.target.checked)} />
        <span>{label}</span>
        <input type="number" className="constraint-threshold" value={threshold}
          step={step} min={min} max={max}
          onChange={e => onThresholdChange(parseFloat(e.target.value) || defaultValue)} />
        {unit && <span>{unit}</span>}
      </label>
      {note && <p className="constraint-note">{note}</p>}
    </>
  )
}
