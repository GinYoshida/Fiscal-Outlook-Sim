"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ScenarioParams,
  SCENARIOS,
  ACTUAL_DATA,
  DATA_SOURCES,
  runSimulation,
  YearData,
} from "@/lib/simulation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

const SUMMARY_YEARS = [2026, 2030, 2035, 2040, 2045, 2050, 2055];
const ACTUAL_SUMMARY_YEARS = [2015, 2018, 2021, 2024];

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="slider-container">
      <label>
        <span>{label}</span>
        <span style={{ color: "var(--primary)", fontWeight: 600 }}>
          {value.toFixed(step < 1 ? 1 : 0)}{unit}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="slider-container">
      <label>
        <span>{label}</span>
        <span style={{ color: "var(--muted)", fontSize: 11 }}>{unit}</span>
      </label>
      <input
        type="number"
        className="number-input"
        value={value}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}

function SummaryTable({ data }: { data: YearData[] }) {
  const summaryData = data.filter((d) => SUMMARY_YEARS.includes(d.year));
  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>年度</th>
            <th>税収</th>
            <th>歳入計</th>
            <th>政策経費</th>
            <th>利払い</th>
            <th>債務残高</th>
            <th>収支</th>
            <th>負担率</th>
          </tr>
        </thead>
        <tbody>
          {summaryData.map((d) => (
            <tr key={d.year}>
              <td style={{ fontWeight: 600 }}>{d.year}</td>
              <td>{d.tax.toFixed(1)}</td>
              <td>{d.totalRevenue.toFixed(1)}</td>
              <td>{d.policyExp.toFixed(1)}</td>
              <td>{d.interest.toFixed(1)}</td>
              <td>{d.debt.toFixed(0)}</td>
              <td style={{ color: d.fiscalBalance >= 0 ? "#16a34a" : "#dc2626" }}>
                {d.fiscalBalance.toFixed(1)}
              </td>
              <td
                style={{
                  color: d.interestBurden > 30 ? "#dc2626" : "inherit",
                  fontWeight: d.interestBurden > 30 ? 700 : 400,
                }}
              >
                {d.interestBurden.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActualSummaryTable() {
  const summaryData = ACTUAL_DATA.filter((d) =>
    ACTUAL_SUMMARY_YEARS.includes(d.year)
  );
  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>年度</th>
            <th>税収</th>
            <th>利払い</th>
            <th>債務残高</th>
            <th>負担率</th>
          </tr>
        </thead>
        <tbody>
          {summaryData.map((d) => (
            <tr key={d.year}>
              <td style={{ fontWeight: 600 }}>{d.year}</td>
              <td>{d.tax.toFixed(1)}</td>
              <td>{d.interest.toFixed(1)}</td>
              <td>{d.debt.toFixed(0)}</td>
              <td>{d.interestBurden.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WaterfallChart({
  data,
  selectedYear,
  otherRevenue,
}: {
  data: YearData[];
  selectedYear: number;
  otherRevenue: number;
}) {
  const d = data.find((item) => item.year === selectedYear);
  if (!d) return null;

  const items = [
    { name: "税収", value: d.tax, type: "income" as const },
    { name: "日銀納付金", value: d.bojPayment, type: "income" as const },
    { name: "その他", value: otherRevenue, type: "income" as const },
    { name: "歳入合計", value: d.totalRevenue, type: "total" as const },
    { name: "政策経費", value: -d.policyExp, type: "expense" as const },
    { name: "利払い費", value: -d.interest, type: "expense" as const },
    { name: "歳出合計", value: -d.totalCost, type: "total" as const },
    { name: "財政収支", value: d.fiscalBalance, type: "result" as const },
  ];

  let running = 0;
  const waterfallData = items.map((item) => {
    if (item.type === "total") {
      const val = item.name === "歳入合計" ? d.totalRevenue : d.totalCost;
      const result = {
        name: item.name,
        base: 0,
        value: item.name === "歳入合計" ? val : -val,
        display: val,
        color: "#334155",
      };
      running = item.name === "歳入合計" ? val : val - d.totalRevenue;
      return result;
    }
    if (item.type === "result") {
      return {
        name: item.name,
        base: 0,
        value: d.fiscalBalance,
        display: d.fiscalBalance,
        color: d.fiscalBalance >= 0 ? "#22c55e" : "#ef4444",
      };
    }
    const base = running;
    running += item.value;
    return {
      name: item.name,
      base: item.type === "expense" ? running : base,
      value: Math.abs(item.value),
      display: item.value,
      color: item.type === "income" ? "#3b82f6" : "#ef4444",
    };
  });

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`} />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "base") return [null, null];
              return [`${value.toFixed(1)} 兆円`, ""];
            }}
          />
          <Bar dataKey="base" stackId="stack" fill="transparent" />
          <Bar dataKey="value" stackId="stack">
            {waterfallData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          marginTop: 12,
        }}
      >
        <div className="metric-card">
          <div className="value" style={{ color: "#3b82f6" }}>
            {d.totalRevenue.toFixed(1)}
          </div>
          <div className="label">歳入合計 (兆円)</div>
        </div>
        <div className="metric-card">
          <div className="value" style={{ color: "#ef4444" }}>
            {d.totalCost.toFixed(1)}
          </div>
          <div className="label">歳出合計 (兆円)</div>
        </div>
        <div className="metric-card">
          <div
            className="value"
            style={{ color: d.fiscalBalance >= 0 ? "#22c55e" : "#ef4444" }}
          >
            {d.fiscalBalance.toFixed(1)}
          </div>
          <div className="label">財政収支 (兆円)</div>
        </div>
      </div>
    </div>
  );
}

function GuideTab() {
  return (
    <div style={{ maxWidth: 800 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        変数・計算ロジック説明
      </h2>

      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "var(--primary)" }}>
          マクロ環境
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>列</th><th>変数名</th><th style={{ textAlign: "left" }}>説明</th></tr>
            </thead>
            <tbody>
              <tr><td>[A]</td><td>年度</td><td style={{ textAlign: "left", whiteSpace: "normal" }}>シミュレーション対象年度（2026〜2055年）</td></tr>
              <tr><td>[B]</td><td>インフレ率</td><td style={{ textAlign: "left", whiteSpace: "normal" }}>年間の消費者物価上昇率。政策経費や金利に影響</td></tr>
              <tr><td>[C]</td><td>実質成長率</td><td style={{ textAlign: "left", whiteSpace: "normal" }}>物価変動を除いた実質GDP成長率</td></tr>
              <tr><td>[D]</td><td>名目成長率</td><td style={{ textAlign: "left", whiteSpace: "normal" }}>[B]+[C]。税収の伸びに直結</td></tr>
              <tr><td>[E]</td><td>市場長期金利</td><td style={{ textAlign: "left", whiteSpace: "normal" }}>[D]+リスクプレミアム。国債の新規発行利率に影響</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#22c55e" }}>
          歳入（収入）
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>列</th><th>変数名</th><th style={{ textAlign: "left" }}>計算式と説明</th></tr>
            </thead>
            <tbody>
              <tr><td>[F]</td><td>税収</td><td style={{ textAlign: "left", whiteSpace: "normal" }}>前年税収×(1+名目成長率×弾性値1.2)。GDP1%増→税収1.2%増</td></tr>
              <tr><td>[G]</td><td>日銀納付金</td><td style={{ textAlign: "left", whiteSpace: "normal" }}>max(保有国債×利回り−当座預金×政策金利, 0)</td></tr>
              <tr><td>[H]</td><td>合計収益</td><td style={{ textAlign: "left", whiteSpace: "normal" }}>税収+日銀納付金+その他収入(15兆円)</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#ef4444" }}>
          歳出（支出）
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>列</th><th>変数名</th><th style={{ textAlign: "left" }}>計算式と説明</th></tr>
            </thead>
            <tbody>
              <tr><td>[I]</td><td>政策経費</td><td style={{ textAlign: "left", whiteSpace: "normal" }}>前年×(1+インフレ率)+自然増0.5兆円。社会保障費等</td></tr>
              <tr><td>[J]</td><td>平均クーポン</td><td style={{ textAlign: "left", whiteSpace: "normal" }}>(前年×8/9)+(市場金利×1/9)。9年借換ロジック</td></tr>
              <tr><td>[K]</td><td>利払い費</td><td style={{ textAlign: "left", whiteSpace: "normal" }}>債務残高×平均クーポン</td></tr>
              <tr><td>[L]</td><td>合計費用</td><td style={{ textAlign: "left", whiteSpace: "normal" }}>政策経費+利払い費</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#f59e0b" }}>
          収支・残高
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>列</th><th>変数名</th><th style={{ textAlign: "left" }}>計算式と説明</th></tr>
            </thead>
            <tbody>
              <tr><td>[M]</td><td>債務残高</td><td style={{ textAlign: "left", whiteSpace: "normal" }}>前年残高+(合計費用−合計収益)。赤字で雪だるま式に増加</td></tr>
              <tr><td>[N]</td><td>財政収支</td><td style={{ textAlign: "left", whiteSpace: "normal" }}>合計収益−合計費用。＋黒字/−赤字</td></tr>
              <tr><td>[O]</td><td>利払負担率</td><td style={{ textAlign: "left", whiteSpace: "normal" }}>(利払い費/税収)×100。30%超で危険水準</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          主要パラメータの補足
        </h3>
        <ul style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
          <li><strong>リスクプレミアム</strong>：国債の信用リスクに対する上乗せ金利。財政悪化で上昇傾向</li>
          <li><strong>税収弾性値</strong>：GDP成長率に対する税収の感応度。1.2＝GDP1%増で税収1.2%増</li>
          <li><strong>政策金利スプレッド</strong>：日銀の政策金利と市場金利の差。通常1%程度</li>
          <li><strong>日銀当座預金</strong>：金融機関が日銀に預ける預金。利上げ時のコスト負担要因</li>
          <li><strong>9年借換ロジック</strong>：国債の平均残存期間（約9年）に基づき毎年約1/9が新金利で借換</li>
        </ul>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          シナリオ一覧
        </h3>
        {SCENARIOS.map((s) => (
          <div key={s.name} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              インフレ{s.params.inflationRate}% / 成長{s.params.realGrowth}% / リスクP {s.params.riskPremium}% / 税収{s.params.initTax}兆円
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          実績データ出典
        </h3>
        <ul style={{ fontSize: 13, lineHeight: 2, paddingLeft: 20, margin: 0 }}>
          {DATA_SOURCES.map((src) => (
            <li key={src.url}>
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--primary)", textDecoration: "underline" }}
              >
                {src.name}
              </a>
              <span style={{ color: "var(--muted)", marginLeft: 8 }}>({src.description})</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Home() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [params, setParams] = useState<ScenarioParams>(SCENARIOS[0].params);
  const [activeTab, setActiveTab] = useState<"sim" | "waterfall" | "guide">("sim");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [waterfallYear, setWaterfallYear] = useState(2035);
  const [showAllData, setShowAllData] = useState(false);

  const simData = useMemo(() => runSimulation(params), [params]);

  const warningYear = useMemo(() => {
    const found = simData.find((d) => d.interestBurden > 30);
    return found || null;
  }, [simData]);

  const combinedBurdenData = useMemo(() => {
    const actual = ACTUAL_DATA.map((d) => ({
      year: d.year,
      実績: d.interestBurden,
      シミュレーション: null as number | null,
    }));
    const sim = simData.map((d) => ({
      year: d.year,
      実績: null as number | null,
      シミュレーション: d.interestBurden,
    }));
    return [...actual, ...sim];
  }, [simData]);

  const combinedDebtData = useMemo(() => {
    const actual = ACTUAL_DATA.map((d) => ({
      year: d.year,
      実績: d.debt,
      シミュレーション: null as number | null,
    }));
    const sim = simData.map((d) => ({
      year: d.year,
      実績: null as number | null,
      シミュレーション: d.debt,
    }));
    return [...actual, ...sim];
  }, [simData]);

  const combinedBalanceData = useMemo(() => {
    const actual = ACTUAL_DATA.map((d) => ({
      year: d.year,
      実績: d.fiscalBalance,
      シミュレーション: null as number | null,
    }));
    const sim = simData.map((d) => ({
      year: d.year,
      実績: null as number | null,
      シミュレーション: d.fiscalBalance,
    }));
    return [...actual, ...sim];
  }, [simData]);

  const combinedTaxInterestData = useMemo(() => {
    const actual = ACTUAL_DATA.map((d) => ({
      year: d.year,
      "税収(実績)": d.tax,
      "利払い(実績)": d.interest,
      "税収(予測)": null as number | null,
      "利払い(予測)": null as number | null,
    }));
    const sim = simData.map((d) => ({
      year: d.year,
      "税収(実績)": null as number | null,
      "利払い(実績)": null as number | null,
      "税収(予測)": d.tax,
      "利払い(予測)": d.interest,
    }));
    return [...actual, ...sim];
  }, [simData]);

  const handleScenarioChange = useCallback((index: number) => {
    setScenarioIndex(index);
    setParams({ ...SCENARIOS[index].params });
  }, []);

  const updateParam = useCallback(
    (key: keyof ScenarioParams, value: number) => {
      setParams((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        style={{
          width: 300,
          minWidth: 300,
          background: "white",
          borderRight: "1px solid var(--border)",
          padding: 16,
          overflowY: "auto",
          height: "100vh",
          position: "sticky",
          top: 0,
          ...(typeof window !== "undefined" && window.innerWidth <= 768
            ? {}
            : {}),
        }}
        className={`${sidebarOpen ? "sidebar-mobile-open" : "sidebar-mobile-closed"}`}
      >
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>シナリオ選択</h3>
          <select
            value={scenarioIndex}
            onChange={(e) => handleScenarioChange(parseInt(e.target.value))}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              fontSize: 13,
              background: "white",
            }}
          >
            {SCENARIOS.map((s, i) => (
              <option key={i} value={i}>{s.name}</option>
            ))}
          </select>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            {SCENARIOS[scenarioIndex].label}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            マクロ経済
          </h4>
          <Slider label="インフレ率" value={params.inflationRate} min={0} max={10} step={0.1} unit="%" onChange={(v) => updateParam("inflationRate", v)} />
          <Slider label="実質成長率" value={params.realGrowth} min={-2} max={5} step={0.1} unit="%" onChange={(v) => updateParam("realGrowth", v)} />
          <Slider label="リスクプレミアム" value={params.riskPremium} min={0} max={3} step={0.1} unit="%" onChange={(v) => updateParam("riskPremium", v)} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            初期値（2026年）
          </h4>
          <NumberInput label="債務残高" value={params.initDebt} step={50} unit="兆円" onChange={(v) => updateParam("initDebt", v)} />
          <NumberInput label="税収" value={params.initTax} step={5} unit="兆円" onChange={(v) => updateParam("initTax", v)} />
          <NumberInput label="政策的経費" value={params.initPolicyExp} step={5} unit="兆円" onChange={(v) => updateParam("initPolicyExp", v)} />
          <Slider label="平均クーポン" value={params.initAvgCoupon} min={0} max={5} step={0.1} unit="%" onChange={(v) => updateParam("initAvgCoupon", v)} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            日銀パラメータ
          </h4>
          <NumberInput label="当座預金" value={params.bojCurrentAccount} step={50} unit="兆円" onChange={(v) => updateParam("bojCurrentAccount", v)} />
          <Slider label="保有国債利回り" value={params.bojBondYield} min={0} max={2} step={0.05} unit="%" onChange={(v) => updateParam("bojBondYield", v)} />
        </div>

        <div>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            その他
          </h4>
          <Slider label="税収弾性値" value={params.taxElasticity} min={0.5} max={2} step={0.1} unit="" onChange={(v) => updateParam("taxElasticity", v)} />
          <NumberInput label="その他収入" value={params.otherRevenue} step={1} unit="兆円/年" onChange={(v) => updateParam("otherRevenue", v)} />
          <NumberInput label="自然増" value={params.naturalIncrease} step={0.1} unit="兆円/年" onChange={(v) => updateParam("naturalIncrease", v)} />
          <Slider label="政策金利スプレッド" value={params.policyRateSpread} min={0} max={3} step={0.1} unit="%" onChange={(v) => updateParam("policyRateSpread", v)} />
        </div>
      </aside>

      <main style={{ flex: 1, padding: "16px 20px", maxWidth: 1000, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              🏛️ 統合政府 30年財政シミュレーター
            </h1>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>
              2026〜2055年：日本政府＋日銀の財政推移シミュレーション
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              display: "none",
              padding: "8px 12px",
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "white",
              cursor: "pointer",
              fontSize: 14,
            }}
            className="mobile-menu-btn"
          >
            ☰ 設定
          </button>
        </div>

        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            marginBottom: 16,
            overflowX: "auto",
            gap: 0,
          }}
        >
          <button
            className={`tab-button ${activeTab === "sim" ? "active" : ""}`}
            onClick={() => setActiveTab("sim")}
          >
            📊 シミュレーション
          </button>
          <button
            className={`tab-button ${activeTab === "waterfall" ? "active" : ""}`}
            onClick={() => setActiveTab("waterfall")}
          >
            📉 ウォーターフォール
          </button>
          <button
            className={`tab-button ${activeTab === "guide" ? "active" : ""}`}
            onClick={() => setActiveTab("guide")}
          >
            📖 変数説明
          </button>
        </div>

        {activeTab === "sim" && (
          <div>
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                シミュレーション結果（5年おき）
              </h2>
              <SummaryTable data={simData} />
            </div>

            {warningYear ? (
              <div className="warning-box">
                ⚠️ {warningYear.year}年に利払い負担率が {warningYear.interestBurden.toFixed(1)}%
                に達し、30%の警戒ラインを超えます。政策予算が利払いに圧迫される危険水準です。
              </div>
            ) : (
              <div className="success-box">
                ✅ シミュレーション期間中、利払い負担率は30%を超えませんでした。
              </div>
            )}

            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                実績データ（2015〜2024年度）
              </h2>
              <ActualSummaryTable />
              <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted)" }}>
                出典：
                {DATA_SOURCES.slice(0, 3).map((src, i) => (
                  <span key={src.url}>
                    {i > 0 && " / "}
                    <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>
                      {src.name}
                    </a>
                  </span>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                利払い負担率の推移（実績＋シミュレーション）
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={combinedBurdenData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => v ? `${v.toFixed(1)}%` : "-"} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "30%", position: "right", fontSize: 10, fill: "#ef4444" }} />
                  <Bar dataKey="実績" fill="#94a3b8" />
                  <Bar dataKey="シミュレーション">
                    {combinedBurdenData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={(entry.シミュレーション ?? 0) > 30 ? "#ef4444" : "#ff8c8c"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  債務残高の推移
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={combinedDebtData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => v ? `${v.toFixed(0)} 兆円` : "-"} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="実績" fill="#94a3b8" />
                    <Bar dataKey="シミュレーション" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  財政収支の推移
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={combinedBalanceData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => v ? `${v.toFixed(1)} 兆円` : "-"} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine y={0} stroke="#94a3b8" />
                    <Bar dataKey="実績" fill="#94a3b8" />
                    <Bar dataKey="シミュレーション">
                      {combinedBalanceData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={(entry.シミュレーション ?? 0) >= 0 ? "#22c55e" : "#ef4444"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                税収 vs 利払い費
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={combinedTaxInterestData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => v ? `${v.toFixed(1)} 兆円` : "-"} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="税収(実績)" fill="#94a3b8" />
                  <Bar dataKey="利払い(実績)" fill="#d1d5db" />
                  <Bar dataKey="税収(予測)" fill="#3b82f6" />
                  <Bar dataKey="利払い(予測)" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <button
                onClick={() => setShowAllData(!showAllData)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--primary)",
                  padding: 0,
                }}
              >
                {showAllData ? "▼" : "▶"} 全年度データを表示
              </button>
              {showAllData && (
                <div style={{ overflowX: "auto", marginTop: 12 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>年度</th>
                        <th>税収</th>
                        <th>日銀</th>
                        <th>歳入計</th>
                        <th>政策費</th>
                        <th>ｸｰﾎﾟﾝ%</th>
                        <th>利払い</th>
                        <th>歳出計</th>
                        <th>債務</th>
                        <th>収支</th>
                        <th>負担率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simData.map((d) => (
                        <tr key={d.year}>
                          <td style={{ fontWeight: 600 }}>{d.year}</td>
                          <td>{d.tax.toFixed(1)}</td>
                          <td>{d.bojPayment.toFixed(1)}</td>
                          <td>{d.totalRevenue.toFixed(1)}</td>
                          <td>{d.policyExp.toFixed(1)}</td>
                          <td>{d.avgCoupon.toFixed(2)}</td>
                          <td>{d.interest.toFixed(1)}</td>
                          <td>{d.totalCost.toFixed(1)}</td>
                          <td>{d.debt.toFixed(0)}</td>
                          <td style={{ color: d.fiscalBalance >= 0 ? "#16a34a" : "#dc2626" }}>
                            {d.fiscalBalance.toFixed(1)}
                          </td>
                          <td style={{ color: d.interestBurden > 30 ? "#dc2626" : "inherit", fontWeight: d.interestBurden > 30 ? 700 : 400 }}>
                            {d.interestBurden.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "waterfall" && (
          <div>
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                単年度 収支ウォーターフォール
              </h2>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>
                  分析する年度: <strong>{waterfallYear}年</strong>
                </label>
                <input
                  type="range"
                  min={2026}
                  max={2055}
                  value={waterfallYear}
                  onChange={(e) => setWaterfallYear(parseInt(e.target.value))}
                  style={{ width: "100%", height: 6, borderRadius: 3, appearance: "none", background: "var(--border)", cursor: "pointer" }}
                />
              </div>
              <WaterfallChart data={simData} selectedYear={waterfallYear} otherRevenue={params.otherRevenue} />
            </div>

            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                {waterfallYear}年度 詳細
              </h3>
              {(() => {
                const d = simData.find((item) => item.year === waterfallYear);
                if (!d) return null;
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    <div className="metric-card">
                      <div className="value">{d.tax.toFixed(1)}</div>
                      <div className="label">税収 (兆円)</div>
                    </div>
                    <div className="metric-card">
                      <div className="value">{d.bojPayment.toFixed(1)}</div>
                      <div className="label">日銀納付金</div>
                    </div>
                    <div className="metric-card">
                      <div className="value">{d.policyExp.toFixed(1)}</div>
                      <div className="label">政策経費</div>
                    </div>
                    <div className="metric-card">
                      <div className="value">{d.interest.toFixed(1)}</div>
                      <div className="label">利払い費</div>
                    </div>
                    <div className="metric-card">
                      <div className="value">{d.debt.toFixed(0)}</div>
                      <div className="label">債務残高</div>
                    </div>
                    <div className="metric-card">
                      <div className="value" style={{ color: d.interestBurden > 30 ? "#ef4444" : "var(--foreground)" }}>
                        {d.interestBurden.toFixed(1)}%
                      </div>
                      <div className="label">利払負担率</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === "guide" && <GuideTab />}

        <div style={{ borderTop: "1px solid var(--border)", marginTop: 20, paddingTop: 12, fontSize: 11, color: "var(--muted)" }}>
          ※ このシミュレーターは簡易モデルです。実際の財政運営はより複雑な要因に影響されます。パラメータを変更して様々なシナリオを検討してください。
        </div>
      </main>

      <style jsx>{`
        @media (max-width: 768px) {
          aside {
            position: fixed !important;
            left: 0;
            top: 0;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
          }
          aside.sidebar-mobile-open {
            transform: translateX(0) !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          main {
            padding: 12px !important;
          }
          div[style*="gridTemplateColumns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
