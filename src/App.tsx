import { useState, useMemo, useCallback } from 'react'
import { SCENARIOS, ACTUAL_DATA, DATA_SOURCES, type SimParams } from './data'
import { runSimulation } from './simulation'
import { Sidebar } from './Sidebar'
import { SimulationTab } from './SimulationTab'
import { ExplanationTab } from './ExplanationTab'

function App() {
  const [params, setParams] = useState<SimParams>({ ...SCENARIOS[0].params })
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [activeTab, setActiveTab] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className={`main-content ${sidebarOpen ? 'sidebar-is-open' : ''}`}>
        <h1 className="app-title">🏛️ 統合政府 30年財政シミュレーター</h1>
        <p className="app-subtitle">2026〜2055年：日本政府＋日銀の財政推移シミュレーション</p>

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
          />
        )}
      </main>
    </div>
  )
}

export default App
