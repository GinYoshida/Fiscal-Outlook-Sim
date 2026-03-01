/**
 * App.tsx — アプリケーションルートコンポーネント
 *
 * 3タブ構成:
 *   1. 解説タブ (ExplanationTab) — ロジックツリーA〜Jの解説
 *   2. シミュレーションタブ (SimulationTab) — インタラクティブなチャート表示
 *   3. シナリオ一覧タブ (ScenariosTab) — 10シナリオの横断比較
 *
 * サイドバーからパラメータを調整し、リアルタイムにシミュレーション結果が更新される。
 */
import { useState, useMemo, useCallback } from 'react'
import type { SimParams, Constraints } from './types'
import { SCENARIOS, ACTUAL_DATA, DATA_SOURCES, DEFAULT_CONSTRAINTS } from './data'
import { runSimulation } from './simulation'
import { Sidebar } from './Sidebar'
import { SimulationTab } from './SimulationTab'
import { ExplanationTab } from './ExplanationTab'
import { ScenariosTab } from './ScenariosTab'
import { useUrlParams } from './hooks/useUrlParams'

function App() {
  const [params, setParams] = useState<SimParams>({ ...SCENARIOS[0].params })
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [activeTab, setActiveTab] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [constraints, setConstraints] = useState<Constraints>({ ...DEFAULT_CONSTRAINTS })
  const [childAge2026, setChildAge2026] = useState(7)

  const restoreParams = useCallback((restored: SimParams) => {
    setParams(restored)
    setScenarioIndex(-1)
  }, [])

  const { copyUrl, copied } = useUrlParams(params, restoreParams)

  const simData = useMemo(() => runSimulation(params), [params])

  const handleScenarioChange = useCallback((index: number) => {
    setScenarioIndex(index)
    setParams({ ...SCENARIOS[index].params })
  }, [])

  const updateParam = useCallback(<K extends keyof SimParams>(key: K, value: SimParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }, [])

  return (
    <div className="app-layout">
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar
        params={params}
        scenarioIndex={scenarioIndex}
        onScenarioChange={handleScenarioChange}
        onParamChange={updateParam}
        onParamsReplace={(newParams: SimParams) => setParams(newParams)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        constraints={constraints}
        onConstraintsChange={setConstraints}
        childAge2026={childAge2026}
        onChildAgeChange={setChildAge2026}
        onCopyUrl={copyUrl}
        urlCopied={copied}
      />
      <main className={`main-content ${sidebarOpen ? 'sidebar-is-open' : ''}`}>
        <h1 className="app-title">🏛️ 統合政府 {params.simYears || 30}年財政シミュレーター</h1>
        <p className="app-subtitle">2026〜{2025 + (params.simYears || 30)}年：日本政府＋日銀の財政推移シミュレーション</p>

        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 0 ? 'active' : ''}`}
            onClick={() => setActiveTab(0)}
          >
            📖 解説
          </button>
          <button
            className={`tab-button ${activeTab === 1 ? 'active' : ''}`}
            onClick={() => setActiveTab(1)}
          >
            📊 シミュレーション
          </button>
          <button
            className={`tab-button ${activeTab === 2 ? 'active' : ''}`}
            onClick={() => setActiveTab(2)}
          >
            🗂️ シナリオ一覧
          </button>
        </div>

        {activeTab === 0 && (
          <ExplanationTab
            params={params}
            simData={simData}
            actualData={ACTUAL_DATA}
            dataSources={DATA_SOURCES}
          />
        )}
        {activeTab === 1 && (
          <SimulationTab
            params={params}
            simData={simData}
            actualData={ACTUAL_DATA}
            childAge2026={childAge2026}
            scenarioIndex={scenarioIndex}
          />
        )}
        {activeTab === 2 && (
          <ScenariosTab />
        )}
      </main>
    </div>
  )
}

export default App
