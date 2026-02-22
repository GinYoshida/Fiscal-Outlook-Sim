import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np

st.set_page_config(
    page_title="統合政府 30年財政シミュレーター",
    page_icon="🏛️",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
    @media (max-width: 768px) {
        .stMainBlockContainer { padding: 0.5rem !important; }
        .block-container { padding: 0.5rem !important; }
        [data-testid="stMetricValue"] { font-size: 1.2rem !important; }
        [data-testid="stMetricLabel"] { font-size: 0.7rem !important; }
    }
    .stTabs [data-baseweb="tab-list"] { gap: 2px; }
    .stTabs [data-baseweb="tab"] { padding: 8px 12px; font-size: 14px; }
    div[data-testid="stExpander"] summary { font-size: 14px; font-weight: 600; }
</style>
""", unsafe_allow_html=True)

ACTUAL_DATA = [
    {"year": 2015, "tax": 56.3, "interest": 10.0, "debt": 807, "policyExp": 57.4, "totalRevenue": 72.0, "totalCost": 67.4, "fiscalBalance": 4.6, "interestBurden": 17.8, "avgCoupon": 1.2, "bojPayment": 0.4},
    {"year": 2016, "tax": 55.5, "interest": 9.5, "debt": 838, "policyExp": 57.8, "totalRevenue": 71.0, "totalCost": 67.3, "fiscalBalance": 3.7, "interestBurden": 17.1, "avgCoupon": 1.1, "bojPayment": 0.4},
    {"year": 2017, "tax": 58.8, "interest": 9.0, "debt": 865, "policyExp": 58.4, "totalRevenue": 74.4, "totalCost": 67.4, "fiscalBalance": 7.0, "interestBurden": 15.3, "avgCoupon": 1.0, "bojPayment": 0.7},
    {"year": 2018, "tax": 60.4, "interest": 8.8, "debt": 883, "policyExp": 58.8, "totalRevenue": 76.0, "totalCost": 67.6, "fiscalBalance": 8.4, "interestBurden": 14.6, "avgCoupon": 0.9, "bojPayment": 0.6},
    {"year": 2019, "tax": 58.4, "interest": 8.5, "debt": 897, "policyExp": 62.0, "totalRevenue": 73.9, "totalCost": 70.5, "fiscalBalance": 3.4, "interestBurden": 14.6, "avgCoupon": 0.9, "bojPayment": 1.2},
    {"year": 2020, "tax": 60.8, "interest": 8.2, "debt": 964, "policyExp": 77.5, "totalRevenue": 76.3, "totalCost": 85.7, "fiscalBalance": -9.4, "interestBurden": 13.5, "avgCoupon": 0.8, "bojPayment": 1.2},
    {"year": 2021, "tax": 67.0, "interest": 8.0, "debt": 990, "policyExp": 67.0, "totalRevenue": 82.6, "totalCost": 75.0, "fiscalBalance": 7.6, "interestBurden": 11.9, "avgCoupon": 0.8, "bojPayment": 1.3},
    {"year": 2022, "tax": 71.1, "interest": 8.0, "debt": 1005, "policyExp": 67.4, "totalRevenue": 86.6, "totalCost": 75.4, "fiscalBalance": 11.2, "interestBurden": 11.3, "avgCoupon": 0.8, "bojPayment": 2.0},
    {"year": 2023, "tax": 72.1, "interest": 8.1, "debt": 1068, "policyExp": 72.7, "totalRevenue": 87.6, "totalCost": 80.8, "fiscalBalance": 6.8, "interestBurden": 11.2, "avgCoupon": 0.8, "bojPayment": 2.2},
    {"year": 2024, "tax": 75.2, "interest": 9.6, "debt": 1103, "policyExp": 73.5, "totalRevenue": 90.6, "totalCost": 83.1, "fiscalBalance": 7.5, "interestBurden": 12.8, "avgCoupon": 0.9, "bojPayment": 2.2},
]

ACTUAL_MACRO = [
    {"year": 2015, "jgb10y": 0.36, "nominalGrowth": 3.5, "inflation": 0.8, "realGrowth": 2.7},
    {"year": 2016, "jgb10y": -0.07, "nominalGrowth": 1.1, "inflation": -0.1, "realGrowth": 1.2},
    {"year": 2017, "jgb10y": 0.06, "nominalGrowth": 2.0, "inflation": 0.5, "realGrowth": 1.5},
    {"year": 2018, "jgb10y": 0.07, "nominalGrowth": 0.3, "inflation": 1.0, "realGrowth": -0.7},
    {"year": 2019, "jgb10y": -0.09, "nominalGrowth": 0.8, "inflation": 0.5, "realGrowth": 0.3},
    {"year": 2020, "jgb10y": 0.02, "nominalGrowth": -3.9, "inflation": 0.0, "realGrowth": -3.9},
    {"year": 2021, "jgb10y": 0.07, "nominalGrowth": 2.4, "inflation": -0.2, "realGrowth": 2.6},
    {"year": 2022, "jgb10y": 0.25, "nominalGrowth": 1.6, "inflation": 2.5, "realGrowth": -0.9},
    {"year": 2023, "jgb10y": 0.55, "nominalGrowth": 5.7, "inflation": 3.2, "realGrowth": 2.5},
    {"year": 2024, "jgb10y": 1.05, "nominalGrowth": 3.2, "inflation": 2.7, "realGrowth": 0.5},
]

DATA_SOURCES = [
    {"name": "一般会計税収の推移", "url": "https://www.mof.go.jp/tax_policy/summary/condition/a03.htm", "desc": "税収データ"},
    {"name": "財政に関する資料", "url": "https://www.mof.go.jp/tax_policy/summary/condition/a02.htm", "desc": "歳出・国債費"},
    {"name": "普通国債残高の累増", "url": "https://www.mof.go.jp/tax_policy/summary/condition/004.pdf", "desc": "債務残高"},
    {"name": "利払費と金利の推移", "url": "https://www.mof.go.jp/tax_policy/summary/condition/005.pdf", "desc": "利払い費"},
    {"name": "日本の統計 2025 第5章", "url": "https://www.stat.go.jp/data/nihon/05.html", "desc": "統計局"},
    {"name": "日本銀行 決算", "url": "https://www.boj.or.jp/about/account/index.htm", "desc": "国庫納付金"},
]

SCENARIOS = [
    {"name": "① ベースライン（現状維持）", "label": "現在の政策を維持した場合の標準シナリオ",
     "params": {"inflationRate": 2.0, "realGrowth": 0.5, "riskPremium": 0.5, "initDebt": 1100, "initTax": 75, "initPolicyExp": 80, "initAvgCoupon": 0.8, "bojCA": 550, "bojYield": 0.2, "taxElasticity": 1.2, "otherRevenue": 15, "naturalIncrease": 0.5, "policyRateSpread": 1.0}},
    {"name": "② 高成長シナリオ", "label": "構造改革が奏功し、実質成長率が高まるケース",
     "params": {"inflationRate": 2.0, "realGrowth": 2.0, "riskPremium": 0.3, "initDebt": 1100, "initTax": 75, "initPolicyExp": 80, "initAvgCoupon": 0.8, "bojCA": 550, "bojYield": 0.2, "taxElasticity": 1.3, "otherRevenue": 16, "naturalIncrease": 0.5, "policyRateSpread": 1.0}},
    {"name": "③ スタグフレーション", "label": "高インフレ＋低成長が長期化するケース",
     "params": {"inflationRate": 4.0, "realGrowth": 0.0, "riskPremium": 1.0, "initDebt": 1100, "initTax": 75, "initPolicyExp": 80, "initAvgCoupon": 0.8, "bojCA": 550, "bojYield": 0.2, "taxElasticity": 0.8, "otherRevenue": 15, "naturalIncrease": 1.0, "policyRateSpread": 0.5}},
    {"name": "④ 金利急騰シナリオ", "label": "国債の信認低下でリスクプレミアムが上昇するケース",
     "params": {"inflationRate": 2.5, "realGrowth": 0.3, "riskPremium": 2.0, "initDebt": 1100, "initTax": 75, "initPolicyExp": 80, "initAvgCoupon": 0.8, "bojCA": 550, "bojYield": 0.2, "taxElasticity": 1.2, "otherRevenue": 15, "naturalIncrease": 0.5, "policyRateSpread": 1.0}},
    {"name": "⑤ 財政再建シナリオ", "label": "歳出削減と増税で財政健全化を目指すケース",
     "params": {"inflationRate": 1.5, "realGrowth": 1.0, "riskPremium": 0.3, "initDebt": 1100, "initTax": 80, "initPolicyExp": 75, "initAvgCoupon": 0.8, "bojCA": 550, "bojYield": 0.2, "taxElasticity": 1.2, "otherRevenue": 17, "naturalIncrease": 0.3, "policyRateSpread": 1.0}},
]

PLOTLY_CONFIG = {
    "displayModeBar": True,
    "modeBarButtonsToRemove": [
        "zoom2d", "pan2d", "select2d", "lasso2d", "zoomIn2d", "zoomOut2d",
        "autoScale2d", "hoverClosestCartesian", "hoverCompareCartesian",
        "toggleSpikelines", "toImage",
    ],
    "modeBarButtonsToAdd": [],
    "displaylogo": False,
}

PLOTLY_LAYOUT = dict(
    margin=dict(l=40, r=20, t=40, b=40),
    font=dict(family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', sans-serif", size=12),
    plot_bgcolor="white",
    paper_bgcolor="white",
    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="left", x=0, font=dict(size=11)),
    xaxis=dict(gridcolor="#e2e8f0", showgrid=True),
    yaxis=dict(gridcolor="#e2e8f0", showgrid=True),
    hovermode="x unified",
)


def run_simulation(p):
    B = p["inflationRate"] / 100
    C = p["realGrowth"] / 100
    D = B + C
    E = D + p["riskPremium"] / 100
    results = []
    for i in range(30):
        year = 2026 + i
        if i == 0:
            policy_rate = max(E - p["policyRateSpread"] / 100, 0)
            boj_rev = p["initDebt"] * (p["bojYield"] / 100)
            boj_cost = p["bojCA"] * policy_rate
            boj_payment = max(boj_rev - boj_cost, 0)
            tax = p["initTax"]
            total_revenue = tax + boj_payment + p["otherRevenue"]
            avg_coupon = p["initAvgCoupon"] / 100
            interest = p["initDebt"] * avg_coupon
            policy_exp = p["initPolicyExp"]
            total_cost = policy_exp + interest
            fiscal_balance = total_revenue - total_cost
            debt = p["initDebt"] + (total_cost - total_revenue)
            interest_burden = (interest / tax) * 100 if tax != 0 else 0
            results.append({
                "year": year, "tax": tax, "bojPayment": boj_payment, "totalRevenue": total_revenue,
                "policyExp": policy_exp, "avgCoupon": avg_coupon * 100, "interest": interest,
                "totalCost": total_cost, "debt": debt, "fiscalBalance": fiscal_balance,
                "interestBurden": interest_burden,
                "bojRev": boj_rev, "bojCost": boj_cost, "policyRate": policy_rate * 100,
            })
        else:
            prev = results[i - 1]
            tax = prev["tax"] * (1 + D * p["taxElasticity"])
            policy_rate = max(E - p["policyRateSpread"] / 100, 0)
            boj_rev = prev["debt"] * (p["bojYield"] / 100)
            boj_cost = p["bojCA"] * policy_rate
            boj_payment = max(boj_rev - boj_cost, 0)
            total_revenue = tax + boj_payment + p["otherRevenue"]
            policy_exp = prev["policyExp"] * (1 + B) + p["naturalIncrease"]
            avg_coupon_dec = (prev["avgCoupon"] / 100 * 8 / 9) + (E * 1 / 9)
            interest = prev["debt"] * avg_coupon_dec
            total_cost = policy_exp + interest
            fiscal_balance = total_revenue - total_cost
            debt = prev["debt"] + (total_cost - total_revenue)
            interest_burden = (interest / tax) * 100 if tax != 0 else 0
            results.append({
                "year": year, "tax": tax, "bojPayment": boj_payment, "totalRevenue": total_revenue,
                "policyExp": policy_exp, "avgCoupon": avg_coupon_dec * 100, "interest": interest,
                "totalCost": total_cost, "debt": debt, "fiscalBalance": fiscal_balance,
                "interestBurden": interest_burden,
                "bojRev": boj_rev, "bojCost": boj_cost, "policyRate": policy_rate * 100,
            })
    return results


def make_chart(title, height=350):
    fig = go.Figure()
    fig.update_layout(**PLOTLY_LAYOUT, title=dict(text=title, font=dict(size=14)), height=height)
    return fig


if "scenario_index" not in st.session_state:
    st.session_state.scenario_index = 0
if "params" not in st.session_state:
    st.session_state.params = {**SCENARIOS[0]["params"]}

with st.sidebar:
    st.markdown("### シナリオ選択")
    scenario_names = [s["name"] for s in SCENARIOS]
    selected = st.selectbox("シナリオ", scenario_names, index=st.session_state.scenario_index, label_visibility="collapsed")
    new_index = scenario_names.index(selected)
    if new_index != st.session_state.scenario_index:
        st.session_state.scenario_index = new_index
        st.session_state.params = {**SCENARIOS[new_index]["params"]}
        st.rerun()

    st.caption(SCENARIOS[st.session_state.scenario_index]["label"])
    p = st.session_state.params

    st.markdown("#### マクロ経済")
    p["inflationRate"] = st.slider("インフレ率 (%)", 0.0, 10.0, p["inflationRate"], 0.1, key="inf", help="消費者物価の年間上昇率。政策経費の伸びと名目成長率に影響します。日銀の目標は2%です。")
    p["realGrowth"] = st.slider("実質成長率 (%)", -2.0, 5.0, p["realGrowth"], 0.1, key="rg", help="物価変動を除いた実質GDPの成長率。インフレ率と合算して名目成長率となり、税収の伸びに直結します。")
    p["riskPremium"] = st.slider("リスクプレミアム (%)", 0.0, 3.0, p["riskPremium"], 0.1, key="rp", help="国債の信用リスクに対する上乗せ金利。財政悪化や市場の不安が高まると上昇し、市場金利＝名目成長率＋リスクプレミアムとなります。")

    st.markdown("#### 初期値（2026年）")
    p["initDebt"] = st.number_input("債務残高 (兆円)", value=p["initDebt"], step=50, key="debt", help="2026年度のスタート時点での国の借金総額。2024年度末で約1,100兆円です。")
    p["initTax"] = st.number_input("税収 (兆円)", value=p["initTax"], step=5, key="tax", help="2026年度の初期税収。所得税・法人税・消費税等の合計です。2024年度実績は約75兆円。")
    p["initPolicyExp"] = st.number_input("政策的経費 (兆円)", value=p["initPolicyExp"], step=5, key="pexp", help="2026年度の政策的経費の初期値。社会保障・公共事業・教育・防衛等の歳出合計（利払い費を除く）です。")
    p["initAvgCoupon"] = st.slider("平均クーポン (%)", 0.0, 5.0, p["initAvgCoupon"], 0.1, key="coup", help="政府債務全体の加重平均利率。既発債の金利が残るため、市場金利が上がってもすぐには上昇しません。9年借換ロジックで毎年1/9ずつ新金利に置き換わります。")

    st.markdown("#### 日銀パラメータ")
    p["bojCA"] = st.number_input("当座預金 (兆円)", value=p["bojCA"], step=50, key="bojca", help="金融機関が日銀に預けている預金の残高。金利上昇時、この預金に付利するコストが日銀の負担になります。量的緩和で約550兆円まで膨張しています。")
    p["bojYield"] = st.slider("保有国債利回り (%)", 0.0, 2.0, p["bojYield"], 0.05, key="bojy", help="日銀が保有する国債の平均利回り。低金利時代に大量購入したため現在は非常に低い水準です。この利回りから得る利息が日銀の主な収入源です。")

    st.markdown("#### その他")
    p["taxElasticity"] = st.slider("税収弾性値", 0.5, 2.0, p["taxElasticity"], 0.1, key="te", help="GDP成長率に対する税収の感応度。1.2＝GDP1%増で税収1.2%増。累進課税の効果で1より大きくなります。日本の実績では1.0〜1.3程度。")
    p["otherRevenue"] = st.number_input("その他収入 (兆円/年)", value=p["otherRevenue"], step=1, key="orev", help="税外収入（印紙収入、官業収入、政府資産整理収入等）の年間合計。シミュレーション期間中は固定値として扱います。")
    p["naturalIncrease"] = st.number_input("自然増 (兆円/年)", value=p["naturalIncrease"], step=0.1, key="ni", help="高齢化に伴う社会保障費（年金・医療・介護）の構造的な年間増加額。財務省の試算では年0.3〜0.7兆円程度とされています。")
    p["policyRateSpread"] = st.slider("政策金利スプレッド (%)", 0.0, 3.0, p["policyRateSpread"], 0.1, key="prs", help="市場金利と日銀の政策金利の差。政策金利＝市場金利−スプレッド（下限0%）。通常1%程度で、日銀は市場金利より低い政策金利を維持します。")

sim_data = run_simulation(p)

st.title("🏛️ 統合政府 30年財政シミュレーター")
st.caption("2026〜2055年：日本政府＋日銀の財政推移シミュレーション")

tab1, tab2, tab4, tab3 = st.tabs(["📊 シミュレーション", "📉 ウォーターフォール", "🏦 統合政府の仕組み", "📖 変数説明"])

with tab1:
    summary_years = [2026, 2030, 2035, 2040, 2045, 2050, 2055]
    summary = [d for d in sim_data if d["year"] in summary_years]
    df_summary = pd.DataFrame(summary)
    df_summary = df_summary[["year", "tax", "totalRevenue", "policyExp", "interest", "debt", "fiscalBalance", "interestBurden"]]
    df_summary.columns = ["年度", "税収", "┗ 歳入計", "政策経費", "利払い", "債務残高", "┗ 収支", "┗ 負担率%"]
    for col in ["税収", "┗ 歳入計", "政策経費", "利払い", "┗ 収支"]:
        df_summary[col] = df_summary[col].round(1)
    df_summary["債務残高"] = df_summary["債務残高"].round(0).astype(int)
    df_summary["┗ 負担率%"] = df_summary["┗ 負担率%"].round(1)

    st.subheader("シミュレーション結果（5年おき）")
    st.dataframe(df_summary, use_container_width=True, hide_index=True)

    warning_data = next((d for d in sim_data if d["interestBurden"] > 30), None)
    if warning_data:
        st.error(f"⚠️ {warning_data['year']}年に利払い負担率が {warning_data['interestBurden']:.1f}%に達し、30%の警戒ラインを超えます。")
    else:
        st.success("✅ シミュレーション期間中、利払い負担率は30%を超えませんでした。")

    st.subheader("実績データ（2015〜2024年度）")
    actual_summary_years = [2015, 2018, 2021, 2024]
    actual_summary = [d for d in ACTUAL_DATA if d["year"] in actual_summary_years]
    df_actual = pd.DataFrame(actual_summary)[["year", "tax", "interest", "debt", "interestBurden"]]
    df_actual.columns = ["年度", "税収", "利払い", "債務残高", "負担率%"]
    st.dataframe(df_actual, use_container_width=True, hide_index=True)

    src_links = " / ".join([f"[{s['name']}]({s['url']})" for s in DATA_SOURCES[:3]])
    st.caption(f"出典：{src_links}")

    st.subheader("利払い負担率の推移")
    fig1 = make_chart("")
    actual_years = [d["year"] for d in ACTUAL_DATA]
    actual_burden = [d["interestBurden"] for d in ACTUAL_DATA]
    sim_years = [d["year"] for d in sim_data]
    sim_burden = [d["interestBurden"] for d in sim_data]
    sim_colors = ["#ef4444" if b > 30 else "#ff8c8c" for b in sim_burden]
    fig1.add_trace(go.Bar(x=actual_years, y=actual_burden, name="実績", marker_color="#94a3b8"))
    fig1.add_trace(go.Bar(x=sim_years, y=sim_burden, name="シミュレーション", marker_color=sim_colors))
    fig1.add_hline(y=30, line_dash="dash", line_color="#ef4444", annotation_text="30%警戒ライン", annotation_position="top right")
    fig1.update_layout(yaxis_title="負担率 (%)", barmode="group")
    st.plotly_chart(fig1, use_container_width=True, config=PLOTLY_CONFIG)

    col1, col2 = st.columns(2)
    with col1:
        st.subheader("債務残高の推移")
        fig2 = make_chart("", height=300)
        actual_debt = [d["debt"] for d in ACTUAL_DATA]
        sim_debt = [d["debt"] for d in sim_data]
        fig2.add_trace(go.Bar(x=actual_years, y=actual_debt, name="実績", marker_color="#94a3b8"))
        fig2.add_trace(go.Bar(x=sim_years, y=sim_debt, name="シミュレーション", marker_color="#f97316"))
        fig2.update_layout(yaxis_title="兆円", barmode="group")
        st.plotly_chart(fig2, use_container_width=True, config=PLOTLY_CONFIG)

    with col2:
        st.subheader("財政収支の推移")
        fig3 = make_chart("", height=300)
        actual_bal = [d["fiscalBalance"] for d in ACTUAL_DATA]
        sim_bal = [d["fiscalBalance"] for d in sim_data]
        sim_bal_colors = ["#22c55e" if b >= 0 else "#ef4444" for b in sim_bal]
        fig3.add_trace(go.Bar(x=actual_years, y=actual_bal, name="実績", marker_color="#94a3b8"))
        fig3.add_trace(go.Bar(x=sim_years, y=sim_bal, name="シミュレーション", marker_color=sim_bal_colors))
        fig3.add_hline(y=0, line_color="#94a3b8")
        fig3.update_layout(yaxis_title="兆円", barmode="group")
        st.plotly_chart(fig3, use_container_width=True, config=PLOTLY_CONFIG)

    st.subheader("税収 vs 利払い費")
    fig4 = make_chart("")
    actual_tax = [d["tax"] for d in ACTUAL_DATA]
    actual_int = [d["interest"] for d in ACTUAL_DATA]
    sim_tax = [d["tax"] for d in sim_data]
    sim_int = [d["interest"] for d in sim_data]
    fig4.add_trace(go.Bar(x=actual_years, y=actual_tax, name="税収(実績)", marker_color="#94a3b8"))
    fig4.add_trace(go.Bar(x=actual_years, y=actual_int, name="利払い(実績)", marker_color="#d1d5db"))
    fig4.add_trace(go.Bar(x=sim_years, y=sim_tax, name="税収(予測)", marker_color="#3b82f6"))
    fig4.add_trace(go.Bar(x=sim_years, y=sim_int, name="利払い(予測)", marker_color="#ef4444"))
    fig4.update_layout(yaxis_title="兆円", barmode="group")
    st.plotly_chart(fig4, use_container_width=True, config=PLOTLY_CONFIG)

    st.subheader("日銀納付金の推移")
    fig5 = make_chart("")
    actual_boj = [d["bojPayment"] for d in ACTUAL_DATA]
    sim_boj = [d["bojPayment"] for d in sim_data]
    fig5.add_trace(go.Bar(x=actual_years, y=actual_boj, name="実績", marker_color="#94a3b8"))
    fig5.add_trace(go.Bar(x=sim_years, y=sim_boj, name="予測", marker_color="#8b5cf6"))
    fig5.update_layout(yaxis_title="兆円", barmode="group")
    st.plotly_chart(fig5, use_container_width=True, config=PLOTLY_CONFIG)

    st.subheader("金利・成長率・リスクプレミアムの推移")

    nominal_g_sim = p["inflationRate"] + p["realGrowth"]
    market_rate_sim = nominal_g_sim + p["riskPremium"]

    actual_macro_years = [d["year"] for d in ACTUAL_MACRO]
    actual_jgb = [d["jgb10y"] for d in ACTUAL_MACRO]
    actual_ng = [d["nominalGrowth"] for d in ACTUAL_MACRO]
    actual_rp = [d["jgb10y"] - d["nominalGrowth"] for d in ACTUAL_MACRO]

    fig6 = make_chart("", height=400)

    fig6.add_trace(go.Scatter(
        x=actual_macro_years, y=actual_jgb, name="10Y国債利回り(実績)",
        mode="lines+markers", line=dict(color="#f97316", width=2),
        marker=dict(size=6),
    ))
    fig6.add_trace(go.Scatter(
        x=actual_macro_years, y=actual_ng, name="名目GDP成長率(実績)",
        mode="lines+markers", line=dict(color="#3b82f6", width=2),
        marker=dict(size=6),
    ))
    fig6.add_trace(go.Bar(
        x=actual_macro_years, y=actual_rp, name="r−g スプレッド(実績)",
        marker_color=["#ef4444" if v > 0 else "#22c55e" for v in actual_rp],
        opacity=0.5,
    ))

    fig6.add_trace(go.Scatter(
        x=sim_years, y=[market_rate_sim] * len(sim_years), name=f"市場金利(設定: {market_rate_sim:.1f}%)",
        mode="lines", line=dict(color="#f97316", width=2, dash="dash"),
    ))
    fig6.add_trace(go.Scatter(
        x=sim_years, y=[nominal_g_sim] * len(sim_years), name=f"名目成長率(設定: {nominal_g_sim:.1f}%)",
        mode="lines", line=dict(color="#3b82f6", width=2, dash="dash"),
    ))

    fig6.add_hline(y=0, line_color="#94a3b8", line_dash="dot", line_width=1)

    fig6.add_annotation(
        x=2040, y=p["riskPremium"],
        text=f"設定リスクプレミアム: {p['riskPremium']:.1f}%",
        showarrow=True, arrowhead=2, font=dict(size=11, color="#ef4444"),
        bgcolor="rgba(255,255,255,0.9)", bordercolor="#ef4444", borderpad=4,
        ax=0, ay=-40,
    )

    fig6.update_layout(
        yaxis_title="%",
        barmode="overlay",
    )
    st.plotly_chart(fig6, use_container_width=True, config=PLOTLY_CONFIG)

    avg_rp = sum(actual_rp) / len(actual_rp)
    recent_rp = sum(actual_rp[-3:]) / 3
    st.caption(f"r−gスプレッド（リスクプレミアムに相当）: 2015〜2024年平均 **{avg_rp:.1f}%** / 直近3年平均 **{recent_rp:.1f}%** / 設定値 **{p['riskPremium']:.1f}%**")
    st.caption("※ 実績のr−gスプレッドはYCC（イールドカーブ・コントロール）により人為的に抑制されていた期間を含むため、将来の正常化後はスプレッドが拡大する可能性があります。")
    st.caption("出典：財務省「国債金利情報」、内閣府「国民経済計算」")

    with st.expander("📋 全年度データを表示"):
        df_all = pd.DataFrame(sim_data)
        df_all = df_all[["year", "tax", "bojPayment", "totalRevenue", "policyExp", "avgCoupon", "interest", "totalCost", "debt", "fiscalBalance", "interestBurden"]]
        df_all.columns = [
            "年度",
            "税収",
            "日銀納付金",
            "┗ 歳入計",
            "政策経費",
            "平均ｸｰﾎﾟﾝ%",
            "利払い",
            "┗ 歳出計",
            "債務残高",
            "┗ 財政収支",
            "┗ 負担率%",
        ]
        for col in ["税収", "日銀納付金", "┗ 歳入計", "政策経費", "利払い", "┗ 歳出計", "┗ 財政収支"]:
            df_all[col] = df_all[col].round(1)
        df_all["平均ｸｰﾎﾟﾝ%"] = df_all["平均ｸｰﾎﾟﾝ%"].round(2)
        df_all["債務残高"] = df_all["債務残高"].round(0).astype(int)
        df_all["┗ 負担率%"] = df_all["┗ 負担率%"].round(1)

        st.caption("┗ は他の列から計算される項目です（歳入計＝税収+日銀納付金+その他、歳出計＝政策経費+利払い、財政収支＝歳入計−歳出計、負担率＝利払い÷税収×100）")
        st.dataframe(df_all, use_container_width=True, hide_index=True, height=800)

    with st.expander("📋 日銀納付金の内訳データ"):
        df_boj = pd.DataFrame(sim_data)
        df_boj = df_boj[["year", "bojRev", "bojCost", "bojPayment", "policyRate"]]
        df_boj.columns = ["年度", "利息収入 (国債)", "付利コスト (当座預金)", "┗ 納付金", "政策金利%"]
        df_boj["利息収入 (国債)"] = df_boj["利息収入 (国債)"].round(2)
        df_boj["付利コスト (当座預金)"] = df_boj["付利コスト (当座預金)"].round(2)
        df_boj["┗ 納付金"] = df_boj["┗ 納付金"].round(2)
        df_boj["政策金利%"] = df_boj["政策金利%"].round(2)
        st.caption(f"利息収入＝債務残高×保有国債利回り({p['bojYield']:.2f}%)、付利コスト＝当座預金({p['bojCA']:.0f}兆円)×政策金利、納付金＝max(利息収入−付利コスト, 0)")
        st.dataframe(df_boj, use_container_width=True, hide_index=True, height=800)

with tab2:
    st.subheader("単年度 収支ウォーターフォール")
    available_years = sorted([d["year"] for d in ACTUAL_DATA] + [d["year"] for d in sim_data])
    wf_year = st.select_slider("分析する年度", options=available_years, value=2035, key="wf_year")

    is_actual = wf_year <= 2024
    if is_actual:
        d = next((item for item in ACTUAL_DATA if item["year"] == wf_year), None)
        st.info(f"{wf_year}年度は実績データです（出典：財務省・日本銀行）")
    else:
        d = next((item for item in sim_data if item["year"] == wf_year), None)

    if d:
        if is_actual:
            other_rev = d["totalRevenue"] - d["tax"] - d["bojPayment"]
        else:
            other_rev = p["otherRevenue"]

        categories = ["税収", "日銀納付金", "その他", "歳入合計", "政策経費", "利払い費", "歳出合計", "財政収支"]
        values = [d["tax"], d["bojPayment"], other_rev, d["totalRevenue"],
                  -d["policyExp"], -d["interest"], -d["totalCost"], d["fiscalBalance"]]

        wf_label = "実績" if is_actual else "シミュレーション"
        fig_wf = go.Figure(go.Waterfall(
            x=categories,
            y=values,
            measure=["relative", "relative", "relative", "total", "relative", "relative", "total", "total"],
            connector=dict(line=dict(color="#e2e8f0")),
            increasing=dict(marker=dict(color="#3b82f6" if not is_actual else "#64748b")),
            decreasing=dict(marker=dict(color="#ef4444" if not is_actual else "#94a3b8")),
            totals=dict(marker=dict(color="#334155")),
            textposition="outside",
            text=[f"{v:.1f}" for v in [d["tax"], d["bojPayment"], other_rev, d["totalRevenue"],
                                        d["policyExp"], d["interest"], d["totalCost"], d["fiscalBalance"]]],
        ))
        fig_wf.update_layout(
            **PLOTLY_LAYOUT,
            title=dict(text=f"{wf_year}年度 収支ウォーターフォール（{wf_label}）", font=dict(size=14)),
            height=400,
            yaxis_title="兆円",
            showlegend=False,
        )
        st.plotly_chart(fig_wf, use_container_width=True, config=PLOTLY_CONFIG)

        c1, c2, c3 = st.columns(3)
        c1.metric("歳入合計", f"{d['totalRevenue']:.1f} 兆円")
        c2.metric("歳出合計", f"{d['totalCost']:.1f} 兆円")
        c3.metric("財政収支", f"{d['fiscalBalance']:.1f} 兆円",
                  delta=f"{'黒字' if d['fiscalBalance'] >= 0 else '赤字'}",
                  delta_color="normal" if d["fiscalBalance"] >= 0 else "inverse")

        c4, c5, c6 = st.columns(3)
        c4.metric("税収", f"{d['tax']:.1f} 兆円")
        c5.metric("利払い費", f"{d['interest']:.1f} 兆円")
        c6.metric("利払負担率", f"{d['interestBurden']:.1f}%",
                  delta="危険" if d["interestBurden"] > 30 else "正常",
                  delta_color="inverse" if d["interestBurden"] > 30 else "normal")

        st.markdown("---")

        if is_actual:
            st.subheader("実績データの内訳")
            st.markdown(f"""
| 項目 | 当年度の値 |
|:--|--:|
| **税収** | **{d['tax']:.1f} 兆円** |
| **日銀納付金** | **{d['bojPayment']:.1f} 兆円** |
| **その他収入** | **{other_rev:.1f} 兆円** |
| **歳入合計** | **{d['totalRevenue']:.1f} 兆円** |
| **政策経費** | **{d['policyExp']:.1f} 兆円** |
| **利払い費** | **{d['interest']:.1f} 兆円** |
| **歳出合計** | **{d['totalCost']:.1f} 兆円** |
| **財政収支** | **{d['fiscalBalance']:.1f} 兆円** |
| **債務残高** | **{d['debt']:.0f} 兆円** |
| **利払負担率** | **{d['interestBurden']:.1f}%** |
""")
            st.caption("出典：財務省「一般会計税収の推移」「財政に関する資料」、日本銀行「決算」")
        else:
            st.subheader("計算式と変数の解説")

            nominal_g = p["inflationRate"] + p["realGrowth"]
            market_rate = nominal_g + p["riskPremium"]
            policy_rate_val = max(market_rate / 100 - p["policyRateSpread"] / 100, 0) * 100

            prev_d = next((item for item in sim_data if item["year"] == wf_year - 1), None)

            st.markdown("##### 歳入の部")
            if wf_year == 2026:
                st.markdown(f"""
| 項目 | 計算式 | 当年度の値 |
|:--|:--|--:|
| **税収** | 初期値（設定値） | **{d['tax']:.1f} 兆円** |
| **日銀納付金** | max(債務残高 × 利回り − 当座預金 × 政策金利, 0) | **{d['bojPayment']:.1f} 兆円** |
| | = max({p['initDebt']:.0f} × {p['bojYield']:.2f}% − {p['bojCA']:.0f} × {policy_rate_val:.2f}%, 0) | |
| **その他収入** | 固定値 | **{p['otherRevenue']:.1f} 兆円** |
| **歳入合計** | 税収 + 日銀納付金 + その他 | **{d['totalRevenue']:.1f} 兆円** |
""")
            else:
                st.markdown(f"""
| 項目 | 計算式 | 当年度の値 |
|:--|:--|--:|
| **税収** | 前年税収 × (1 + 名目成長率 × 弾性値) | **{d['tax']:.1f} 兆円** |
| | = {prev_d['tax']:.1f} × (1 + {nominal_g:.1f}% × {p['taxElasticity']:.1f}) | |
| **日銀納付金** | max(前年債務 × 利回り − 当座預金 × 政策金利, 0) | **{d['bojPayment']:.1f} 兆円** |
| | = max({prev_d['debt']:.0f} × {p['bojYield']:.2f}% − {p['bojCA']:.0f} × {policy_rate_val:.2f}%, 0) | |
| **その他収入** | 固定値 | **{p['otherRevenue']:.1f} 兆円** |
| **歳入合計** | 税収 + 日銀納付金 + その他 | **{d['totalRevenue']:.1f} 兆円** |
""")

            st.markdown("##### 歳出の部")
            if wf_year == 2026:
                st.markdown(f"""
| 項目 | 計算式 | 当年度の値 |
|:--|:--|--:|
| **政策経費** | 初期値（設定値） | **{d['policyExp']:.1f} 兆円** |
| **平均クーポン** | 初期値（設定値） | **{d['avgCoupon']:.2f}%** |
| **利払い費** | 債務残高 × 平均クーポン | **{d['interest']:.1f} 兆円** |
| | = {p['initDebt']:.0f} × {d['avgCoupon']:.2f}% | |
| **歳出合計** | 政策経費 + 利払い費 | **{d['totalCost']:.1f} 兆円** |
""")
            else:
                st.markdown(f"""
| 項目 | 計算式 | 当年度の値 |
|:--|:--|--:|
| **政策経費** | 前年 × (1 + インフレ率) + 自然増 | **{d['policyExp']:.1f} 兆円** |
| | = {prev_d['policyExp']:.1f} × (1 + {p['inflationRate']:.1f}%) + {p['naturalIncrease']:.1f} | |
| **平均クーポン** | 前年 × 8/9 + 市場金利 × 1/9 | **{d['avgCoupon']:.2f}%** |
| | = {prev_d['avgCoupon']:.2f}% × 8/9 + {market_rate:.1f}% × 1/9 | |
| **利払い費** | 前年債務残高 × 平均クーポン | **{d['interest']:.1f} 兆円** |
| | = {prev_d['debt']:.0f} × {d['avgCoupon']:.2f}% | |
| **歳出合計** | 政策経費 + 利払い費 | **{d['totalCost']:.1f} 兆円** |
""")

            st.markdown("##### 収支・残高")
            if wf_year == 2026:
                st.markdown(f"""
| 項目 | 計算式 | 当年度の値 |
|:--|:--|--:|
| **財政収支** | 歳入合計 − 歳出合計 | **{d['fiscalBalance']:.1f} 兆円** |
| | = {d['totalRevenue']:.1f} − {d['totalCost']:.1f} | |
| **債務残高** | 初期値 + (歳出 − 歳入) | **{d['debt']:.0f} 兆円** |
| | = {p['initDebt']:.0f} + ({d['totalCost']:.1f} − {d['totalRevenue']:.1f}) | |
| **利払負担率** | (利払い費 / 税収) × 100 | **{d['interestBurden']:.1f}%** |
| | = ({d['interest']:.1f} / {d['tax']:.1f}) × 100 | |
""")
            else:
                st.markdown(f"""
| 項目 | 計算式 | 当年度の値 |
|:--|:--|--:|
| **財政収支** | 歳入合計 − 歳出合計 | **{d['fiscalBalance']:.1f} 兆円** |
| | = {d['totalRevenue']:.1f} − {d['totalCost']:.1f} | |
| **債務残高** | 前年残高 + (歳出 − 歳入) | **{d['debt']:.0f} 兆円** |
| | = {prev_d['debt']:.0f} + ({d['totalCost']:.1f} − {d['totalRevenue']:.1f}) | |
| **利払負担率** | (利払い費 / 税収) × 100 | **{d['interestBurden']:.1f}%** |
| | = ({d['interest']:.1f} / {d['tax']:.1f}) × 100 | |
""")

        with st.expander("各計算式の根拠と解説"):
            st.markdown(f"""
**税収：前年税収 × (1 + 名目成長率 × 弾性値{p['taxElasticity']:.1f})**

税収はGDPに連動するため、名目GDP成長率を基準に推計します。弾性値{p['taxElasticity']:.1f}を掛けるのは、累進課税の効果で所得が伸びると税率の高い区分に移行する人が増え、GDP以上に税収が伸びる傾向があるためです。日本の過去の実績では弾性値1.0〜1.3程度で推移しており、1.2は標準的な仮定です。

---

**日銀納付金：max(保有国債 × 利回り − 当座預金 × 政策金利, 0)**

日銀は保有する国債から利息収入を得る一方、金融機関から預かる当座預金に利息を支払います。この差額（利ざや）が日銀の利益となり、国庫に納付されます。金利上昇局面では当座預金への付利コストが先に上昇する一方、保有国債の利回りは既発債のため簡単には上がらず、逆ざやで納付金がゼロになるリスクがあります。max関数は、赤字になっても国が日銀に補填する仕組みがないため、下限をゼロとしています。

---

**政策経費：前年 × (1 + インフレ率) + 自然増{p['naturalIncrease']:.1f}兆円**

社会保障・公共事業・教育・防衛等の歳出は、物価上昇に伴い名目額が膨らみます。インフレ率で調整する理由は、公務員給与・調達価格・年金の物価スライドなどが物価に連動するためです。さらに高齢化により年金・医療・介護の給付が毎年構造的に増加するため、自然増（年{p['naturalIncrease']:.1f}兆円）を加算しています。財務省の試算でも社会保障の自然増は年0.3〜0.7兆円とされています。

---

**平均クーポン：前年 × 8/9 + 市場金利 × 1/9（9年借換ロジック）**

日本国債の平均残存期間は約9年です。これは、毎年およそ全体の1/9が満期を迎え、その時点の市場金利で新たに借り換えられることを意味します。残りの8/9は既発債のため金利は変わりません。このモデルにより、金利が急上昇しても利払い負担はすぐには跳ね上がらず、9年かけて徐々に波及する現実の動きを再現しています。

---

**利払い費：債務残高 × 平均クーポン**

国が発行している国債の元本（債務残高）に対して、加重平均の利率（平均クーポン）を掛けた金額が年間の利息支払い額です。債務残高が大きくなるほど、また平均クーポンが上昇するほど、利払い費は加速度的に増大します。

---

**利払負担率：(利払い費 / 税収) × 100**

税収に対する利払い費の比率を見ることで、「稼ぎのうちどれだけが借金の利息に消えるか」を示します。30%を警戒ラインとしているのは、過去に財政危機に陥った国々（ギリシャ、イタリア等）がこの水準前後で市場の信認を失った事例があるためです。日本は現在約{ACTUAL_DATA[-1]['interestBurden']:.0f}%ですが、金利上昇シナリオでは急速に悪化する可能性があります。

---

**債務残高：前年残高 + (歳出 − 歳入)**

財政赤字（歳出 > 歳入）が発生すると、その分だけ新たに国債を発行して資金を調達するため、債務残高が積み上がります。これは会計上の恒等式であり、黒字なら残高は減少します。利払い費が増えると赤字が拡大し、さらに債務が増えて利払い費が増える「債務の雪だるま効果」が発生し得ます。
""")

with tab4:
    st.subheader("統合政府と日銀納付金の仕組み")

    st.markdown("""
このシミュレーターでは、日本政府と日本銀行を**一体（統合政府）**として捉え、
財政の持続可能性を分析しています。以下の図で資金の流れを解説します。
""")

    nominal_g_tab4 = p["inflationRate"] + p["realGrowth"]
    market_rate_tab4 = nominal_g_tab4 + p["riskPremium"]
    policy_rate_tab4 = max(market_rate_tab4 / 100 - p["policyRateSpread"] / 100, 0) * 100

    fig_flow = go.Figure()

    box_colors = {"gov": "#3b82f6", "boj": "#8b5cf6", "market": "#64748b", "bank": "#059669"}

    boxes = [
        (0.5, 0.92, "日本政府（財務省）", box_colors["gov"], "税収・歳出・国債発行を管理"),
        (0.5, 0.08, "日本銀行（BOJ）", box_colors["boj"], "金融政策・国債保有・当座預金管理"),
        (0.05, 0.50, "国民・企業", box_colors["market"], "納税者・サービス受益者"),
        (0.95, 0.50, "金融機関", box_colors["bank"], "国債購入・当座預金"),
    ]

    for x, y, label, color, sub in boxes:
        fig_flow.add_annotation(
            x=x, y=y, text=f"<b>{label}</b><br><span style='font-size:10px'>{sub}</span>",
            showarrow=False, font=dict(size=13, color="white"),
            bgcolor=color, bordercolor=color, borderwidth=2, borderpad=10,
            opacity=0.95, xanchor="center", yanchor="middle",
        )

    arrows = [
        (0.20, 0.55, 0.30, 0.85, "税金", "#3b82f6"),
        (0.30, 0.85, 0.20, 0.55, "公共サービス\n社会保障", "#ef4444"),
        (0.70, 0.85, 0.80, 0.55, "国債発行", "#f97316"),
        (0.80, 0.45, 0.70, 0.15, "国債売却\n(公開市場操作)", "#8b5cf6"),
        (0.50, 0.22, 0.50, 0.78, "国庫納付金", "#22c55e"),
        (0.80, 0.55, 0.80, 0.45, "当座預金\n(付利)", "#94a3b8"),
    ]

    for ax, ay, x, y, text, color in arrows:
        fig_flow.add_annotation(
            x=x, y=y, ax=ax, ay=ay, text=f"<b>{text}</b>",
            showarrow=True, arrowhead=3, arrowsize=1.5, arrowwidth=2.5,
            arrowcolor=color, font=dict(size=10, color=color),
            bgcolor="rgba(255,255,255,0.85)", borderpad=3,
        )

    fig_flow.update_layout(
        xaxis=dict(visible=False, range=[-0.05, 1.05]),
        yaxis=dict(visible=False, range=[-0.05, 1.05]),
        plot_bgcolor="white", paper_bgcolor="white",
        height=500, margin=dict(l=10, r=10, t=10, b=10),
        font=dict(family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', sans-serif"),
    )
    st.plotly_chart(fig_flow, use_container_width=True, config={"displayModeBar": False})

    st.markdown("---")
    st.subheader("日銀納付金の計算構造")

    boj_rev_val = p["initDebt"] * (p["bojYield"] / 100)
    boj_cost_val = p["bojCA"] * (policy_rate_tab4 / 100)
    boj_profit = max(boj_rev_val - boj_cost_val, 0)

    col_boj1, col_boj2 = st.columns(2)
    with col_boj1:
        fig_boj = go.Figure()
        fig_boj.add_trace(go.Bar(
            name="利息収入", x=["日銀損益"], y=[boj_rev_val],
            marker_color="#22c55e", text=[f"{boj_rev_val:.1f}"], textposition="inside",
        ))
        fig_boj.add_trace(go.Bar(
            name="付利コスト", x=["日銀損益"], y=[-boj_cost_val],
            marker_color="#ef4444", text=[f"{boj_cost_val:.1f}"], textposition="inside",
        ))
        fig_boj.update_layout(
            **PLOTLY_LAYOUT, height=300,
            title=dict(text="日銀の収益構造（初年度）", font=dict(size=13)),
            yaxis_title="兆円", barmode="relative", showlegend=True,
        )
        st.plotly_chart(fig_boj, use_container_width=True, config={"displayModeBar": False})

    with col_boj2:
        st.markdown(f"""
**利息収入（国債保有から）**
- 保有国債（＝債務残高）: **{p['initDebt']:.0f} 兆円**
- 保有国債利回り: **{p['bojYield']:.2f}%**
- 利息収入 = {p['initDebt']:.0f} x {p['bojYield']:.2f}% = **{boj_rev_val:.1f} 兆円**

**付利コスト（当座預金への利払い）**
- 当座預金残高: **{p['bojCA']:.0f} 兆円**
- 政策金利: **{policy_rate_tab4:.2f}%**
- 付利コスト = {p['bojCA']:.0f} x {policy_rate_tab4:.2f}% = **{boj_cost_val:.1f} 兆円**

**国庫納付金 = max(利息収入 - 付利コスト, 0)**
= max({boj_rev_val:.1f} - {boj_cost_val:.1f}, 0) = **{boj_profit:.1f} 兆円**
""")

    st.markdown("---")
    st.subheader("金利上昇が統合政府に与える影響")

    test_rates = [0.0, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0]
    boj_payments_test = []
    interest_costs_test = []
    for rate in test_rates:
        pr = max(rate / 100 - p["policyRateSpread"] / 100, 0)
        boj_p = max(p["initDebt"] * (p["bojYield"] / 100) - p["bojCA"] * pr, 0)
        int_c = p["initDebt"] * rate / 100
        boj_payments_test.append(boj_p)
        interest_costs_test.append(int_c)

    fig_sens = go.Figure()
    fig_sens.add_trace(go.Scatter(
        x=test_rates, y=boj_payments_test, name="日銀納付金",
        line=dict(color="#22c55e", width=3), mode="lines+markers",
    ))
    fig_sens.add_trace(go.Scatter(
        x=test_rates, y=interest_costs_test, name="利払い費",
        line=dict(color="#ef4444", width=3), mode="lines+markers",
    ))
    net_effect = [boj_payments_test[i] - interest_costs_test[i] for i in range(len(test_rates))]
    fig_sens.add_trace(go.Scatter(
        x=test_rates, y=net_effect, name="統合政府ネット効果",
        line=dict(color="#3b82f6", width=2, dash="dash"), mode="lines+markers",
    ))
    fig_sens.add_hline(y=0, line_color="#94a3b8", line_dash="dot")
    fig_sens.update_layout(
        **PLOTLY_LAYOUT, height=400,
        title=dict(text="市場金利と統合政府の収支感応度", font=dict(size=14)),
        xaxis_title="市場金利 (%)", yaxis_title="兆円",
    )
    st.plotly_chart(fig_sens, use_container_width=True, config=PLOTLY_CONFIG)

    st.markdown("""
**ポイント：統合政府で見ると金利上昇の影響は相殺される？**

一見すると、金利が上がれば政府の利払い費は増加しますが、日銀の保有国債からの利息収入も増えるため、
統合政府としては相殺されるように見えます。しかし実際には：

1. **タイムラグ**：利払い費は9年借換ロジックで徐々に上昇するが、日銀の保有国債利回りはさらに遅れて上昇
2. **逆ざや問題**：金利上昇初期は当座預金への付利コストが先に増え、日銀が赤字（逆ざや）に陥る
3. **国債保有比率**：日銀が全国債を保有しているわけではないため、完全な相殺にはならない
4. **信認リスク**：金利が急騰する場合、国債市場の信認低下が同時に発生し、さらなる金利上昇を招く悪循環

このシミュレーターでは、これらの動態を簡易的にモデル化して将来の財政リスクを可視化しています。
""")

with tab3:
    st.subheader("変数・計算ロジック説明")

    st.markdown("#### マクロ環境")
    macro_data = pd.DataFrame([
        ["[A]", "年度", "シミュレーション対象年度（2026〜2055年）"],
        ["[B]", "インフレ率", "年間の消費者物価上昇率。政策経費や金利に影響"],
        ["[C]", "実質成長率", "物価変動を除いた実質GDP成長率"],
        ["[D]", "名目成長率", "[B]+[C]。税収の伸びに直結"],
        ["[E]", "市場長期金利", "[D]+リスクプレミアム。国債の新規発行利率に影響"],
    ], columns=["列", "変数名", "説明"])
    st.dataframe(macro_data, use_container_width=True, hide_index=True)

    st.markdown("#### 歳入（収入）")
    revenue_data = pd.DataFrame([
        ["[F]", "税収", "前年税収×(1+名目成長率×弾性値1.2)。GDP1%増→税収1.2%増"],
        ["[G]", "日銀納付金", "max(保有国債×利回り−当座預金×政策金利, 0)"],
        ["[H]", "合計収益", "税収+日銀納付金+その他収入(15兆円)"],
    ], columns=["列", "変数名", "計算式と説明"])
    st.dataframe(revenue_data, use_container_width=True, hide_index=True)

    st.markdown("#### 歳出（支出）")
    expense_data = pd.DataFrame([
        ["[I]", "政策経費", "前年×(1+インフレ率)+自然増0.5兆円。社会保障費等"],
        ["[J]", "平均クーポン", "(前年×8/9)+(市場金利×1/9)。9年借換ロジック"],
        ["[K]", "利払い費", "債務残高×平均クーポン"],
        ["[L]", "合計費用", "政策経費+利払い費"],
    ], columns=["列", "変数名", "計算式と説明"])
    st.dataframe(expense_data, use_container_width=True, hide_index=True)

    st.markdown("#### 収支・残高")
    balance_data = pd.DataFrame([
        ["[M]", "債務残高", "前年残高+(合計費用−合計収益)。赤字で雪だるま式に増加"],
        ["[N]", "財政収支", "合計収益−合計費用。＋黒字/−赤字"],
        ["[O]", "利払負担率", "(利払い費/税収)×100。30%超で危険水準"],
    ], columns=["列", "変数名", "計算式と説明"])
    st.dataframe(balance_data, use_container_width=True, hide_index=True)

    st.markdown("#### 主要パラメータの補足")
    st.markdown("""
- **リスクプレミアム**：国債の信用リスクに対する上乗せ金利。財政悪化で上昇傾向
- **税収弾性値**：GDP成長率に対する税収の感応度。1.2＝GDP1%増で税収1.2%増
- **政策金利スプレッド**：日銀の政策金利と市場金利の差。通常1%程度
- **日銀当座預金**：金融機関が日銀に預ける預金。利上げ時のコスト負担要因
- **9年借換ロジック**：国債の平均残存期間（約9年）に基づき毎年約1/9が新金利で借換
""")

    st.markdown("#### シナリオ一覧")
    for s in SCENARIOS:
        with st.container():
            st.markdown(f"**{s['name']}**")
            st.caption(f"{s['label']} — インフレ{s['params']['inflationRate']}% / 成長{s['params']['realGrowth']}% / リスクP {s['params']['riskPremium']}%")

    st.markdown("#### 実績データ出典")
    for src in DATA_SOURCES:
        st.markdown(f"- [{src['name']}]({src['url']}) ({src['desc']})")

st.divider()
st.caption("※ このシミュレーターは簡易モデルです。実際の財政運営はより複雑な要因に影響されます。パラメータを変更して様々なシナリオを検討してください。")
