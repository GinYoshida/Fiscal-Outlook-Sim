/**
 * Collapsible.tsx — 折りたたみUIコンポーネント
 *
 * セクションの表示/非表示を切り替える汎用的な折りたたみコンポーネント。
 * SimulationTabの各チャートグループで使用される。
 */

import { useState } from 'react'

/**
 * 折りたたみ可能なセクションコンポーネント
 * @param title セクションタイトル
 * @param children 折りたたみ内に表示するコンテンツ
 * @param defaultOpen 初期状態で開いているかどうか（デフォルト: false）
 */
export function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
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
