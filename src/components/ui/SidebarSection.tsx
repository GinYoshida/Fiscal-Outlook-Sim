/**
 * SidebarSection.tsx — サイドバーセクションコンポーネント
 *
 * 折りたたみ可能なセクションヘッダーとコンテンツ領域を提供する。
 * Sidebar.tsxから外部化されたコンポーネント。
 */

import { useState } from 'react'

export interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SidebarSection({ title, children, defaultOpen = true }: SidebarSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <span className={`collapsible-arrow ${open ? 'open' : ''}`}>▼</span>
      </div>
      {open && <div className="sidebar-section-content">{children}</div>}
    </div>
  )
}
