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
    {"year": 2015, "tax": 56.3, "interest": 10.0, "debt": 807, "policyExp": 57.4, "totalRevenue": 72.0, "totalCost": 67.4, "fiscalBalance": 4.6, "interestBurden": 17.8, "avgCoupon": 1.2, "bojPayment": 0.4, "taxConsumption": 17.1, "taxIncome": 17.8, "taxCorporate": 10.8, "taxOther": 10.6},
    {"year": 2016, "tax": 55.5, "interest": 9.5, "debt": 838, "policyExp": 57.8, "totalRevenue": 71.0, "totalCost": 67.3, "fiscalBalance": 3.7, "interestBurden": 17.1, "avgCoupon": 1.1, "bojPayment": 0.4, "taxConsumption": 17.2, "taxIncome": 17.6, "taxCorporate": 10.3, "taxOther": 10.4},
    {"year": 2017, "tax": 58.8, "interest": 9.0, "debt": 865, "policyExp": 58.4, "totalRevenue": 74.4, "totalCost": 67.4, "fiscalBalance": 7.0, "interestBurden": 15.3, "avgCoupon": 1.0, "bojPayment": 0.7, "taxConsumption": 17.5, "taxIncome": 18.9, "taxCorporate": 12.0, "taxOther": 10.4},
    {"year": 2018, "tax": 60.4, "interest": 8.8, "debt": 883, "policyExp": 58.8, "totalRevenue": 76.0, "totalCost": 67.6, "fiscalBalance": 8.4, "interestBurden": 14.6, "avgCoupon": 0.9, "bojPayment": 0.6, "taxConsumption": 17.7, "taxIncome": 19.9, "taxCorporate": 12.3, "taxOther": 10.5},
    {"year": 2019, "tax": 58.4, "interest": 8.5, "debt": 897, "policyExp": 62.0, "totalRevenue": 73.9, "totalCost": 70.5, "fiscalBalance": 3.4, "interestBurden": 14.6, "avgCoupon": 0.9, "bojPayment": 1.2, "taxConsumption": 18.4, "taxIncome": 19.2, "taxCorporate": 10.8, "taxOther": 10.0},
    {"year": 2020, "tax": 60.8, "interest": 8.2, "debt": 964, "policyExp": 77.5, "totalRevenue": 76.3, "totalCost": 85.7, "fiscalBalance": -9.4, "interestBurden": 13.5, "avgCoupon": 0.8, "bojPayment": 1.2, "taxConsumption": 21.0, "taxIncome": 19.2, "taxCorporate": 11.2, "taxOther": 9.4},
    {"year": 2021, "tax": 67.0, "interest": 8.0, "debt": 990, "policyExp": 67.0, "totalRevenue": 82.6, "totalCost": 75.0, "fiscalBalance": 7.6, "interestBurden": 11.9, "avgCoupon": 0.8, "bojPayment": 1.3, "taxConsumption": 21.9, "taxIncome": 21.4, "taxCorporate": 13.6, "taxOther": 10.1},
    {"year": 2022, "tax": 71.1, "interest": 8.0, "debt": 1005, "policyExp": 67.4, "totalRevenue": 86.6, "totalCost": 75.4, "fiscalBalance": 11.2, "interestBurden": 11.3, "avgCoupon": 0.8, "bojPayment": 2.0, "taxConsumption": 23.1, "taxIncome": 22.5, "taxCorporate": 14.9, "taxOther": 10.6},
    {"year": 2023, "tax": 72.1, "interest": 8.1, "debt": 1068, "policyExp": 72.7, "totalRevenue": 87.6, "totalCost": 80.8, "fiscalBalance": 6.8, "interestBurden": 11.2, "avgCoupon": 0.8, "bojPayment": 2.2, "taxConsumption": 23.2, "taxIncome": 22.0, "taxCorporate": 14.6, "taxOther": 12.3},
    {"year": 2024, "tax": 75.2, "interest": 9.6, "debt": 1103, "policyExp": 73.5, "totalRevenue": 90.6, "totalCost": 83.1, "fiscalBalance": 7.5, "interestBurden": 12.8, "avgCoupon": 0.9, "bojPayment": 2.2, "taxConsumption": 23.8, "taxIncome": 22.4, "taxCorporate": 17.0, "taxOther": 12.0},
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
     "params": {"inflationRate": 2.0, "realGrowth": 0.5, "riskPremium": 0.5, "initDebt": 1100, "initTaxConsumption": 24, "initTaxIncome": 22, "initTaxCorporate": 17, "initTaxOther": 12, "initPolicyExp": 80, "initAvgCoupon": 0.8, "bojCA": 550, "bojYield": 0.2, "otherRevenue": 15, "naturalIncrease": 0.5, "policyRateSpread": 1.0, "taxRateChangeYear": "なし", "taxRateNew": 10}},
    {"name": "② 高成長シナリオ", "label": "構造改革が奏功し、実質成長率が高まるケース",
     "params": {"inflationRate": 2.0, "realGrowth": 2.0, "riskPremium": 0.3, "initDebt": 1100, "initTaxConsumption": 24, "initTaxIncome": 22, "initTaxCorporate": 17, "initTaxOther": 12, "initPolicyExp": 80, "initAvgCoupon": 0.8, "bojCA": 550, "bojYield": 0.2, "otherRevenue": 16, "naturalIncrease": 0.5, "policyRateSpread": 1.0, "taxRateChangeYear": "なし", "taxRateNew": 10}},
    {"name": "③ スタグフレーション", "label": "高インフレ＋低成長が長期化するケース",
     "params": {"inflationRate": 4.0, "realGrowth": 0.0, "riskPremium": 1.0, "initDebt": 1100, "initTaxConsumption": 24, "initTaxIncome": 22, "initTaxCorporate": 17, "initTaxOther": 12, "initPolicyExp": 80, "initAvgCoupon": 0.8, "bojCA": 550, "bojYield": 0.2, "otherRevenue": 15, "naturalIncrease": 1.0, "policyRateSpread": 0.5, "taxRateChangeYear": "なし", "taxRateNew": 10}},
    {"name": "④ 金利急騰シナリオ", "label": "国債の信認低下でリスクプレミアムが上昇するケース",
     "params": {"inflationRate": 2.5, "realGrowth": 0.3, "riskPremium": 2.0, "initDebt": 1100, "initTaxConsumption": 24, "initTaxIncome": 22, "initTaxCorporate": 17, "initTaxOther": 12, "initPolicyExp": 80, "initAvgCoupon": 0.8, "bojCA": 550, "bojYield": 0.2, "otherRevenue": 15, "naturalIncrease": 0.5, "policyRateSpread": 1.0, "taxRateChangeYear": "なし", "taxRateNew": 10}},
    {"name": "⑤ 財政再建シナリオ", "label": "歳出削減と増税で財政健全化を目指すケース",
     "params": {"inflationRate": 1.5, "realGrowth": 1.0, "riskPremium": 0.3, "initDebt": 1100, "initTaxConsumption": 26, "initTaxIncome": 24, "initTaxCorporate": 18, "initTaxOther": 12, "initPolicyExp": 75, "initAvgCoupon": 0.8, "bojCA": 550, "bojYield": 0.2, "otherRevenue": 17, "naturalIncrease": 0.3, "policyRateSpread": 1.0, "taxRateChangeYear": "なし", "taxRateNew": 10}},
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
    change_year = None
    if p.get("taxRateChangeYear", "なし") != "なし":
        change_year = int(p["taxRateChangeYear"])
    results = []
    for i in range(30):
        year = 2026 + i
        if i == 0:
            policy_rate = max(E - p["policyRateSpread"] / 100, 0)
            boj_rev = p["initDebt"] * (p["bojYield"] / 100)
            boj_cost = p["bojCA"] * policy_rate
            boj_payment = max(boj_rev - boj_cost, 0)
            tax_consumption = p["initTaxConsumption"]
            if change_year is not None and year >= change_year:
                tax_consumption = tax_consumption * (p["taxRateNew"] / 10.0)
            tax_income = p["initTaxIncome"]
            tax_corporate = p["initTaxCorporate"]
            tax_other = p["initTaxOther"]
            tax = tax_consumption + tax_income + tax_corporate + tax_other
            total_revenue = tax + boj_payment + p["otherRevenue"]
            avg_coupon = p["initAvgCoupon"] / 100
            interest = p["initDebt"] * avg_coupon
            policy_exp = p["initPolicyExp"]
            total_cost = policy_exp + interest
            fiscal_balance = total_revenue - total_cost
            debt = p["initDebt"] + (total_cost - total_revenue)
            interest_burden = (interest / tax) * 100 if tax != 0 else 0
            bond_issuance = max(total_cost - total_revenue, 0)
            other_rev_stamp = p["otherRevenue"] * 0.30
            other_rev_gov = p["otherRevenue"] * 0.20
            other_rev_asset = p["otherRevenue"] * 0.25
            other_rev_misc = p["otherRevenue"] * 0.25
            results.append({
                "year": year, "tax": tax, "bojPayment": boj_payment, "totalRevenue": total_revenue,
                "policyExp": policy_exp, "avgCoupon": avg_coupon * 100, "interest": interest,
                "totalCost": total_cost, "debt": debt, "fiscalBalance": fiscal_balance,
                "interestBurden": interest_burden,
                "bojRev": boj_rev, "bojCost": boj_cost, "policyRate": policy_rate * 100,
                "taxConsumption": tax_consumption, "taxIncome": tax_income,
                "taxCorporate": tax_corporate, "taxOther": tax_other,
                "bondIssuance": bond_issuance,
                "otherRevStamp": other_rev_stamp, "otherRevGov": other_rev_gov,
                "otherRevAsset": other_rev_asset, "otherRevMisc": other_rev_misc,
            })
        else:
            prev = results[i - 1]
            tax_consumption = prev["taxConsumption"] * (1 + B * 1.0)
            if change_year is not None and year == change_year:
                tax_consumption = prev["taxConsumption"] * (1 + B * 1.0) * (p["taxRateNew"] / 10.0)
            tax_income = prev["taxIncome"] * (1 + D * 1.4)
            tax_corporate = prev["taxCorporate"] * (1 + C * 2.0 + B * 0.5)
            tax_other = prev["taxOther"] * (1 + D * 0.8)
            tax = tax_consumption + tax_income + tax_corporate + tax_other
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
            bond_issuance = max(total_cost - total_revenue, 0)
            other_rev_stamp = p["otherRevenue"] * 0.30
            other_rev_gov = p["otherRevenue"] * 0.20
            other_rev_asset = p["otherRevenue"] * 0.25
            other_rev_misc = p["otherRevenue"] * 0.25
            results.append({
                "year": year, "tax": tax, "bojPayment": boj_payment, "totalRevenue": total_revenue,
                "policyExp": policy_exp, "avgCoupon": avg_coupon_dec * 100, "interest": interest,
                "totalCost": total_cost, "debt": debt, "fiscalBalance": fiscal_balance,
                "interestBurden": interest_burden,
                "bojRev": boj_rev, "bojCost": boj_cost, "policyRate": policy_rate * 100,
                "taxConsumption": tax_consumption, "taxIncome": tax_income,
                "taxCorporate": tax_corporate, "taxOther": tax_other,
                "bondIssuance": bond_issuance,
                "otherRevStamp": other_rev_stamp, "otherRevGov": other_rev_gov,
                "otherRevAsset": other_rev_asset, "otherRevMisc": other_rev_misc,
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

    st.markdown("**税収の内訳**")
    p["initTaxConsumption"] = st.number_input("消費税 (兆円)", value=p["initTaxConsumption"], step=1, key="taxc", help="消費税収の初期値。税率10%（軽減8%）。消費額×インフレ率に連動して伸びます。2024年度実績は約24兆円。")
    p["initTaxIncome"] = st.number_input("所得税 (兆円)", value=p["initTaxIncome"], step=1, key="taxi", help="所得税収の初期値。累進課税のため名目賃金の伸び以上に増加します（弾性値1.4）。2024年度実績は約22兆円。")
    p["initTaxCorporate"] = st.number_input("法人税 (兆円)", value=p["initTaxCorporate"], step=1, key="taxp", help="法人税収の初期値。企業利益に連動し景気変動に敏感です（実質成長率×2.0＋インフレ率×0.5）。2024年度実績は約17兆円。")
    p["initTaxOther"] = st.number_input("その他税 (兆円)", value=p["initTaxOther"], step=1, key="taxo", help="相続税・酒税・たばこ税・関税等のその他税収。名目成長率に対して弾性値0.8で緩やかに連動。2024年度実績は約12兆円。")
    init_tax_total = p["initTaxConsumption"] + p["initTaxIncome"] + p["initTaxCorporate"] + p["initTaxOther"]
    st.caption(f"税収合計: **{init_tax_total:.0f} 兆円**")

    st.markdown("#### 消費税率設定")
    p["taxRateChangeYear"] = st.selectbox("消費税率変更年度", ["なし", "2030", "2035", "2040"], index=["なし", "2030", "2035", "2040"].index(p.get("taxRateChangeYear", "なし")), key="trc_year")
    p["taxRateNew"] = st.slider("新消費税率 (%)", 8, 20, p.get("taxRateNew", 10), 1, key="trc_rate")

    p["initPolicyExp"] = st.number_input("政策的経費 (兆円)", value=p["initPolicyExp"], step=5, key="pexp", help="2026年度の政策的経費の初期値。社会保障・公共事業・教育・防衛等の歳出合計（利払い費を除く）です。")
    p["initAvgCoupon"] = st.slider("平均クーポン (%)", 0.0, 5.0, p["initAvgCoupon"], 0.1, key="coup", help="政府債務全体の加重平均利率。既発債の金利が残るため、市場金利が上がってもすぐには上昇しません。9年借換ロジックで毎年1/9ずつ新金利に置き換わります。")

    st.markdown("#### 日銀パラメータ")
    p["bojCA"] = st.number_input("当座預金 (兆円)", value=p["bojCA"], step=50, key="bojca", help="金融機関が日銀に預けている預金の残高。金利上昇時、この預金に付利するコストが日銀の負担になります。量的緩和で約550兆円まで膨張しています。")
    p["bojYield"] = st.slider("保有国債利回り (%)", 0.0, 2.0, p["bojYield"], 0.05, key="bojy", help="日銀が保有する国債の平均利回り。低金利時代に大量購入したため現在は非常に低い水準です。この利回りから得る利息が日銀の主な収入源です。")

    st.markdown("#### その他")
    p["otherRevenue"] = st.number_input("その他収入 (兆円/年)", value=p["otherRevenue"], step=1, key="orev", help="税外収入（印紙収入、官業収入、政府資産整理収入等）の年間合計。シミュレーション期間中は固定値として扱います。")
    p["naturalIncrease"] = st.number_input("自然増 (兆円/年)", value=p["naturalIncrease"], step=0.1, key="ni", help="高齢化に伴う社会保障費（年金・医療・介護）の構造的な年間増加額。財務省の試算では年0.3〜0.7兆円程度とされています。")
    p["policyRateSpread"] = st.slider("政策金利スプレッド (%)", 0.0, 3.0, p["policyRateSpread"], 0.1, key="prs", help="市場金利と日銀の政策金利の差。政策金利＝市場金利−スプレッド（下限0%）。通常1%程度で、日銀は市場金利より低い政策金利を維持します。")

sim_data = run_simulation(p)

st.title("🏛️ 統合政府 30年財政シミュレーター")
st.caption("2026〜2055年：日本政府＋日銀の財政推移シミュレーション")

tab1, tab2 = st.tabs(["📖 解説", "📊 シミュレーション"])

with tab1:
    st.subheader("シミュレーターの目的")
    st.markdown("""
このシミュレーターは、日本政府と日本銀行を**一体（統合政府）**として捉え、
2026年から2055年までの30年間の財政推移を予測するツールです。

**なぜ統合政府で見るのか？**

日銀は国債を大量に保有しており、政府が支払う利息の一部は日銀を通じて国庫に戻ります。
この「日銀納付金」の存在を無視すると、政府の財政負担を過大に見積もることになります。
統合政府として分析することで、より現実的な財政の姿を把握できます。

**このシミュレーターでわかること**
- 金利上昇が財政に与える影響
- 税収構造の変化（消費税・所得税・法人税・その他）
- 債務残高と利払い費の長期トレンド
- 日銀の金融政策が財政に与える影響
- 消費税率変更や国債発行の効果
""")

    st.subheader("計算ロジックの全体像")
    st.markdown("以下のツリー構造で、各年度の財政指標を計算しています。")
    st.code("""
A：歳入合計 = 税収合計 + 日銀納付金 + その他収入
│
├── 税収合計 = 消費税 + 所得税 + 法人税 + その他税
│   ├── 消費税 = 前年消費税 × (1 + インフレ率 × 1.0)
│   │   └── ※税率変更年度に (新税率/10) を乗じて水準調整
│   ├── 所得税 = 前年所得税 × (1 + 名目成長率 × 1.4)
│   │   └── 名目成長率 = インフレ率 + 実質成長率
│   ├── 法人税 = 前年法人税 × (1 + 実質成長率×2.0 + インフレ率×0.5)
│   └── その他税 = 前年その他税 × (1 + 名目成長率 × 0.8)
│
├── 日銀納付金 = max(納付可能金額, 0)
│   └── 納付可能金額 = 国債利息収入 − 当座預金付利コスト
│       ├── 国債利息収入 = 保有国債残高 × 保有国債利回り
│       └── 当座預金付利コスト = 当座預金残高 × 政策金利
│           └── 政策金利 = max(市場金利 − スプレッド, 0)
│               └── 市場金利 = 名目成長率 + リスクプレミアム
│
└── その他収入 = 印紙収入 + 官業収入 + 資産売却収入 + 雑収入


B：支出合計 = 政策経費 + 利払い費
│
├── 政策経費 = 前年政策経費 × (1 + インフレ率) + 自然増
│
└── 利払い費 = 前年債務残高 × 平均クーポン
    └── 平均クーポン = 前年クーポン × 8/9 + 市場金利 × 1/9
        └── 市場金利 = 名目成長率 + リスクプレミアム


C：収支・残高
├── 財政収支 = 歳入合計 − 支出合計
├── 債務残高 = 前年債務残高 + (支出合計 − 歳入合計)
├── 国債発行額 = max(支出合計 − 歳入合計, 0)
└── 利払負担率 = (利払い費 ÷ 税収合計) × 100
""", language=None)

    st.subheader("各変数の解説")

    with st.expander("A：歳入の計算ロジック"):
        st.markdown(f"""
**税収：4区分に分解して個別の弾性値で推計**

税目ごとに経済変数への感応度が異なるため、以下のように分解してシミュレーションしています：

| 税目 | 計算式 | 弾性値 | 連動する経済変数 |
|:--|:--|:--:|:--|
| 消費税 | 前年 × (1 + インフレ率 × 1.0) | 1.0 | 物価上昇で消費税額が自動増加 |
| 所得税 | 前年 × (1 + 名目成長率 × 1.4) | 1.4 | 累進課税で所得増以上に税収増 |
| 法人税 | 前年 × (1 + 実質成長率×2.0 + インフレ率×0.5) | ≈2.0 | 企業利益は景気変動に敏感 |
| その他税 | 前年 × (1 + 名目成長率 × 0.8) | 0.8 | 相続税・酒税等は比較的安定 |

- **消費税**：税率10%（軽減8%）が一定なので、消費額（≒物価水準）に比例。インフレ率に1:1で連動。
- **所得税**：累進課税のため名目賃金の伸び以上に税収が増加。弾性値1.4は国際的にも標準的な仮定。
- **法人税**：企業利益は実質GDPの変動に大きく左右される（弾性値2.0）。インフレによる名目利益増の効果は限定的（0.5）。
- **その他税**：相続税・酒税・たばこ税・関税等。名目GDPに緩やかに連動（弾性値0.8）。

---

**日銀納付金：max(保有国債 × 利回り − 当座預金 × 政策金利, 0)**

日銀は保有する国債から利息収入を得る一方、金融機関から預かる当座預金に利息を支払います。この差額（利ざや）が日銀の利益となり、国庫に納付されます。金利上昇局面では当座預金への付利コストが先に上昇する一方、保有国債の利回りは既発債のため簡単には上がらず、逆ざやで納付金がゼロになるリスクがあります。max関数は、赤字になっても国が日銀に補填する仕組みがないため、下限をゼロとしています。
""")

    with st.expander("B：支出の計算ロジック"):
        st.markdown(f"""
**政策経費：前年 × (1 + インフレ率) + 自然増{p['naturalIncrease']:.1f}兆円**

社会保障・公共事業・教育・防衛等の歳出は、物価上昇に伴い名目額が膨らみます。インフレ率で調整する理由は、公務員給与・調達価格・年金の物価スライドなどが物価に連動するためです。さらに高齢化により年金・医療・介護の給付が毎年構造的に増加するため、自然増（年{p['naturalIncrease']:.1f}兆円）を加算しています。財務省の試算でも社会保障の自然増は年0.3〜0.7兆円とされています。

---

**平均クーポン：前年 × 8/9 + 市場金利 × 1/9（9年借換ロジック）**

日本国債の平均残存期間は約9年です。これは、毎年およそ全体の1/9が満期を迎え、その時点の市場金利で新たに借り換えられることを意味します。残りの8/9は既発債のため金利は変わりません。このモデルにより、金利が急上昇しても利払い負担はすぐには跳ね上がらず、9年かけて徐々に波及する現実の動きを再現しています。

---

**利払い費：債務残高 × 平均クーポン**

国が発行している国債の元本（債務残高）に対して、加重平均の利率（平均クーポン）を掛けた金額が年間の利息支払い額です。債務残高が大きくなるほど、また平均クーポンが上昇するほど、利払い費は加速度的に増大します。
""")

    with st.expander("C：収支・残高の計算ロジック"):
        st.markdown(f"""
**利払負担率：(利払い費 / 税収) × 100**

税収に対する利払い費の比率を見ることで、「稼ぎのうちどれだけが借金の利息に消えるか」を示します。30%を警戒ラインとしているのは、過去に財政危機に陥った国々（ギリシャ、イタリア等）がこの水準前後で市場の信認を失った事例があるためです。日本は現在約{ACTUAL_DATA[-1]['interestBurden']:.0f}%ですが、金利上昇シナリオでは急速に悪化する可能性があります。

---

**債務残高：前年残高 + (歳出 − 歳入)**

財政赤字（歳出 > 歳入）が発生すると、その分だけ新たに国債を発行して資金を調達するため、債務残高が積み上がります。これは会計上の恒等式であり、黒字なら残高は減少します。利払い費が増えると赤字が拡大し、さらに債務が増えて利払い費が増える「債務の雪だるま効果」が発生し得ます。
""")

    st.subheader("統合政府の仕組み")

    nominal_g_tab4 = p["inflationRate"] + p["realGrowth"]
    market_rate_tab4 = nominal_g_tab4 + p["riskPremium"]
    policy_rate_tab4 = max(market_rate_tab4 / 100 - p["policyRateSpread"] / 100, 0) * 100

    with st.expander("統合政府の資金フロー図"):
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

        st.markdown("""
このシミュレーターでは、日本政府と日本銀行を**一体（統合政府）**として捉え、
財政の持続可能性を分析しています。
""")

    with st.expander("日銀納付金の計算構造"):
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

    with st.expander("金利感応度分析"):
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

    st.subheader("ウォーターフォール分析")

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

        categories = ["消費税", "所得税", "法人税", "その他税", "税収計", "日銀納付金", "その他", "歳入合計", "政策経費", "利払い費", "歳出合計", "財政収支"]
        values = [d["taxConsumption"], d["taxIncome"], d["taxCorporate"], d["taxOther"], d["tax"],
                  d["bojPayment"], other_rev, d["totalRevenue"],
                  -d["policyExp"], -d["interest"], -d["totalCost"], d["fiscalBalance"]]

        wf_label = "実績" if is_actual else "シミュレーション"
        inc_color = "#3b82f6" if not is_actual else "#64748b"
        dec_color = "#ef4444" if not is_actual else "#94a3b8"
        fig_wf = go.Figure(go.Waterfall(
            x=categories,
            y=values,
            measure=["relative", "relative", "relative", "relative", "total", "relative", "relative", "total", "relative", "relative", "total", "total"],
            connector=dict(line=dict(color="#e2e8f0")),
            increasing=dict(marker=dict(color=inc_color)),
            decreasing=dict(marker=dict(color=dec_color)),
            totals=dict(marker=dict(color="#334155")),
            textposition="outside",
            text=[f"{v:.1f}" for v in [d["taxConsumption"], d["taxIncome"], d["taxCorporate"], d["taxOther"], d["tax"],
                                        d["bojPayment"], other_rev, d["totalRevenue"],
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
| **消費税** | **{d['taxConsumption']:.1f} 兆円** |
| **所得税** | **{d['taxIncome']:.1f} 兆円** |
| **法人税** | **{d['taxCorporate']:.1f} 兆円** |
| **その他税** | **{d['taxOther']:.1f} 兆円** |
| **税収計** | **{d['tax']:.1f} 兆円** |
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

            inflation_pct = p["inflationRate"]
            real_g_pct = p["realGrowth"]

            st.markdown("##### 歳入の部")
            if wf_year == 2026:
                st.markdown(f"""
| 項目 | 計算式 | 当年度の値 |
|:--|:--|--:|
| **消費税** | 初期値（設定値） | **{d['taxConsumption']:.1f} 兆円** |
| **所得税** | 初期値（設定値） | **{d['taxIncome']:.1f} 兆円** |
| **法人税** | 初期値（設定値） | **{d['taxCorporate']:.1f} 兆円** |
| **その他税** | 初期値（設定値） | **{d['taxOther']:.1f} 兆円** |
| **税収計** | 消費税+所得税+法人税+その他税 | **{d['tax']:.1f} 兆円** |
| **日銀納付金** | max(債務残高 × 利回り − 当座預金 × 政策金利, 0) | **{d['bojPayment']:.1f} 兆円** |
| | = max({p['initDebt']:.0f} × {p['bojYield']:.2f}% − {p['bojCA']:.0f} × {policy_rate_val:.2f}%, 0) | |
| **その他収入** | 固定値 | **{p['otherRevenue']:.1f} 兆円** |
| **歳入合計** | 税収計 + 日銀納付金 + その他 | **{d['totalRevenue']:.1f} 兆円** |
""")
            else:
                st.markdown(f"""
| 項目 | 計算式 | 当年度の値 |
|:--|:--|--:|
| **消費税** | 前年 × (1 + インフレ率×1.0) | **{d['taxConsumption']:.1f} 兆円** |
| | = {prev_d['taxConsumption']:.1f} × (1 + {inflation_pct:.1f}%×1.0) | |
| **所得税** | 前年 × (1 + 名目成長率×1.4) | **{d['taxIncome']:.1f} 兆円** |
| | = {prev_d['taxIncome']:.1f} × (1 + {nominal_g:.1f}%×1.4) | |
| **法人税** | 前年 × (1 + 実質成長率×2.0 + インフレ率×0.5) | **{d['taxCorporate']:.1f} 兆円** |
| | = {prev_d['taxCorporate']:.1f} × (1 + {real_g_pct:.1f}%×2.0 + {inflation_pct:.1f}%×0.5) | |
| **その他税** | 前年 × (1 + 名目成長率×0.8) | **{d['taxOther']:.1f} 兆円** |
| | = {prev_d['taxOther']:.1f} × (1 + {nominal_g:.1f}%×0.8) | |
| **税収計** | 消費税+所得税+法人税+その他税 | **{d['tax']:.1f} 兆円** |
| **日銀納付金** | max(前年債務 × 利回り − 当座預金 × 政策金利, 0) | **{d['bojPayment']:.1f} 兆円** |
| | = max({prev_d['debt']:.0f} × {p['bojYield']:.2f}% − {p['bojCA']:.0f} × {policy_rate_val:.2f}%, 0) | |
| **その他収入** | 固定値 | **{p['otherRevenue']:.1f} 兆円** |
| **歳入合計** | 税収計 + 日銀納付金 + その他 | **{d['totalRevenue']:.1f} 兆円** |
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
**税収：4区分に分解して個別の弾性値で推計**

税目ごとに経済変数への感応度が異なるため、以下のように分解してシミュレーションしています：

| 税目 | 計算式 | 弾性値 | 連動する経済変数 |
|:--|:--|:--:|:--|
| 消費税 | 前年 × (1 + インフレ率 × 1.0) | 1.0 | 物価上昇で消費税額が自動増加 |
| 所得税 | 前年 × (1 + 名目成長率 × 1.4) | 1.4 | 累進課税で所得増以上に税収増 |
| 法人税 | 前年 × (1 + 実質成長率×2.0 + インフレ率×0.5) | ≈2.0 | 企業利益は景気変動に敏感 |
| その他税 | 前年 × (1 + 名目成長率 × 0.8) | 0.8 | 相続税・酒税等は比較的安定 |

- **消費税**：税率10%（軽減8%）が一定なので、消費額（≒物価水準）に比例。インフレ率に1:1で連動。
- **所得税**：累進課税のため名目賃金の伸び以上に税収が増加。弾性値1.4は国際的にも標準的な仮定。
- **法人税**：企業利益は実質GDPの変動に大きく左右される（弾性値2.0）。インフレによる名目利益増の効果は限定的（0.5）。
- **その他税**：相続税・酒税・たばこ税・関税等。名目GDPに緩やかに連動（弾性値0.8）。

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

    st.subheader("データ出典")
    for src in DATA_SOURCES:
        st.markdown(f"- [{src['name']}]({src['url']}) ({src['desc']})")

with tab2:
    actual_years = [d["year"] for d in ACTUAL_DATA]
    sim_years = [d["year"] for d in sim_data]

    warning_data = next((d for d in sim_data if d["interestBurden"] > 30), None)
    if warning_data:
        st.error(f"⚠️ {warning_data['year']}年に利払い負担率が {warning_data['interestBurden']:.1f}%に達し、30%の警戒ラインを超えます。")
    else:
        st.success("✅ シミュレーション期間中、利払い負担率は30%を超えませんでした。")

    st.subheader("利払い負担率の推移")
    fig1 = make_chart("")
    actual_burden = [d["interestBurden"] for d in ACTUAL_DATA]
    sim_burden = [d["interestBurden"] for d in sim_data]
    sim_colors = ["#ef4444" if b > 30 else "#ff8c8c" for b in sim_burden]
    fig1.add_trace(go.Bar(x=actual_years, y=actual_burden, name="実績", marker_color="#94a3b8"))
    fig1.add_trace(go.Bar(x=sim_years, y=sim_burden, name="シミュレーション", marker_color=sim_colors))
    fig1.add_hline(y=30, line_dash="dash", line_color="#ef4444", annotation_text="30%警戒ライン", annotation_position="top right")
    fig1.update_layout(yaxis_title="負担率 (%)", barmode="group")
    st.plotly_chart(fig1, use_container_width=True, config=PLOTLY_CONFIG)

    col1, col2 = st.columns(2)
    with col1:
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

    with col2:
        st.subheader("債務残高の推移")
        fig2 = make_chart("", height=300)
        actual_debt = [d["debt"] for d in ACTUAL_DATA]
        sim_debt = [d["debt"] for d in sim_data]
        fig2.add_trace(go.Bar(x=actual_years, y=actual_debt, name="実績", marker_color="#94a3b8"))
        fig2.add_trace(go.Bar(x=sim_years, y=sim_debt, name="シミュレーション", marker_color="#f97316"))
        fig2.update_layout(yaxis_title="兆円", barmode="group")
        st.plotly_chart(fig2, use_container_width=True, config=PLOTLY_CONFIG)

    with st.expander("歳入合計・税収内訳"):
        fig4 = make_chart("")
        actual_tc = [d["taxConsumption"] for d in ACTUAL_DATA]
        actual_ti = [d["taxIncome"] for d in ACTUAL_DATA]
        actual_tp = [d["taxCorporate"] for d in ACTUAL_DATA]
        actual_to = [d["taxOther"] for d in ACTUAL_DATA]
        actual_int = [d["interest"] for d in ACTUAL_DATA]
        sim_tc = [d["taxConsumption"] for d in sim_data]
        sim_ti = [d["taxIncome"] for d in sim_data]
        sim_tp = [d["taxCorporate"] for d in sim_data]
        sim_to = [d["taxOther"] for d in sim_data]
        sim_int = [d["interest"] for d in sim_data]

        fig4.add_trace(go.Bar(x=actual_years, y=actual_tc, name="消費税(実績)", marker_color="#94a3b8", legendgroup="actual"))
        fig4.add_trace(go.Bar(x=actual_years, y=actual_ti, name="所得税(実績)", marker_color="#b0bec5", legendgroup="actual"))
        fig4.add_trace(go.Bar(x=actual_years, y=actual_tp, name="法人税(実績)", marker_color="#cfd8dc", legendgroup="actual"))
        fig4.add_trace(go.Bar(x=actual_years, y=actual_to, name="その他税(実績)", marker_color="#e0e0e0", legendgroup="actual"))

        fig4.add_trace(go.Bar(x=sim_years, y=sim_tc, name="消費税(予測)", marker_color="#22c55e", legendgroup="sim"))
        fig4.add_trace(go.Bar(x=sim_years, y=sim_ti, name="所得税(予測)", marker_color="#3b82f6", legendgroup="sim"))
        fig4.add_trace(go.Bar(x=sim_years, y=sim_tp, name="法人税(予測)", marker_color="#8b5cf6", legendgroup="sim"))
        fig4.add_trace(go.Bar(x=sim_years, y=sim_to, name="その他税(予測)", marker_color="#f59e0b", legendgroup="sim"))

        fig4.add_trace(go.Scatter(x=actual_years + sim_years, y=actual_int + sim_int, name="利払い費", mode="lines+markers", line=dict(color="#ef4444", width=3), marker=dict(size=5)))

        fig4.update_layout(yaxis_title="兆円", barmode="stack")
        st.plotly_chart(fig4, use_container_width=True, config=PLOTLY_CONFIG)

    with st.expander("支出合計"):
        fig_exp = make_chart("")
        actual_pe = [d["policyExp"] for d in ACTUAL_DATA]
        actual_int_exp = [d["interest"] for d in ACTUAL_DATA]
        sim_pe = [d["policyExp"] for d in sim_data]
        sim_int_exp = [d["interest"] for d in sim_data]

        fig_exp.add_trace(go.Bar(x=actual_years, y=actual_pe, name="政策経費(実績)", marker_color="#94a3b8", legendgroup="actual"))
        fig_exp.add_trace(go.Bar(x=actual_years, y=actual_int_exp, name="利払い費(実績)", marker_color="#b0bec5", legendgroup="actual"))

        fig_exp.add_trace(go.Bar(x=sim_years, y=sim_pe, name="政策経費(予測)", marker_color="#f97316", legendgroup="sim"))
        fig_exp.add_trace(go.Bar(x=sim_years, y=sim_int_exp, name="利払い費(予測)", marker_color="#ef4444", legendgroup="sim"))

        fig_exp.update_layout(yaxis_title="兆円", barmode="stack")
        st.plotly_chart(fig_exp, use_container_width=True, config=PLOTLY_CONFIG)

    with st.expander("日銀納付金"):
        fig5 = make_chart("")
        actual_boj = [d["bojPayment"] for d in ACTUAL_DATA]
        sim_boj = [d["bojPayment"] for d in sim_data]
        fig5.add_trace(go.Bar(x=actual_years, y=actual_boj, name="実績", marker_color="#94a3b8"))
        fig5.add_trace(go.Bar(x=sim_years, y=sim_boj, name="予測", marker_color="#8b5cf6"))
        fig5.update_layout(yaxis_title="兆円", barmode="group")
        st.plotly_chart(fig5, use_container_width=True, config=PLOTLY_CONFIG)

    with st.expander("金利・成長率・リスクプレミアム"):
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

    st.subheader("データ表")

    summary_years = [2026, 2030, 2035, 2040, 2045, 2050, 2055]
    summary_data = [d for d in sim_data if d["year"] in summary_years]

    rows = [
        ("歳入合計", [d["totalRevenue"] for d in summary_data]),
        ("　├ 税収合計", [d["tax"] for d in summary_data]),
        ("　│　├ 消費税", [d["taxConsumption"] for d in summary_data]),
        ("　│　├ 所得税", [d["taxIncome"] for d in summary_data]),
        ("　│　├ 法人税", [d["taxCorporate"] for d in summary_data]),
        ("　│　└ その他税", [d["taxOther"] for d in summary_data]),
        ("　├ 日銀納付金", [d["bojPayment"] for d in summary_data]),
        ("　└ その他収入", [p["otherRevenue"]] * len(summary_data)),
        ("　　　├ 印紙収入", [d["otherRevStamp"] for d in summary_data]),
        ("　　　├ 官業収入", [d["otherRevGov"] for d in summary_data]),
        ("　　　├ 資産売却", [d["otherRevAsset"] for d in summary_data]),
        ("　　　└ 雑収入", [d["otherRevMisc"] for d in summary_data]),
        ("─", [None] * len(summary_data)),
        ("支出合計", [d["totalCost"] for d in summary_data]),
        ("　├ 政策経費", [d["policyExp"] for d in summary_data]),
        ("　└ 利払い費", [d["interest"] for d in summary_data]),
        ("　　　├ 債務残高", [d["debt"] for d in summary_data]),
        ("　　　└ 平均クーポン(%)", [d["avgCoupon"] for d in summary_data]),
        ("──", [None] * len(summary_data)),
        ("財政収支", [d["fiscalBalance"] for d in summary_data]),
        ("国債発行額", [d["bondIssuance"] for d in summary_data]),
        ("利払負担率(%)", [d["interestBurden"] for d in summary_data]),
    ]

    col_names = [str(y) for y in summary_years]
    data_dict = {}
    labels = []
    for label, vals in rows:
        labels.append(label)
        for j, cn in enumerate(col_names):
            if cn not in data_dict:
                data_dict[cn] = []
            if vals[j] is None:
                data_dict[cn].append(np.nan)
            else:
                data_dict[cn].append(round(vals[j], 1))

    df_table = pd.DataFrame(data_dict, index=labels)
    df_table.index.name = "項目"
    st.dataframe(df_table, use_container_width=True, hide_index=False)

    with st.expander("全年度データ（30年分）"):
        all_col_names = [str(d["year"]) for d in sim_data]
        all_rows = [
            ("歳入合計", [d["totalRevenue"] for d in sim_data]),
            ("　├ 税収合計", [d["tax"] for d in sim_data]),
            ("　│　├ 消費税", [d["taxConsumption"] for d in sim_data]),
            ("　│　├ 所得税", [d["taxIncome"] for d in sim_data]),
            ("　│　├ 法人税", [d["taxCorporate"] for d in sim_data]),
            ("　│　└ その他税", [d["taxOther"] for d in sim_data]),
            ("　├ 日銀納付金", [d["bojPayment"] for d in sim_data]),
            ("　└ その他収入", [p["otherRevenue"]] * len(sim_data)),
            ("　　　├ 印紙収入", [d["otherRevStamp"] for d in sim_data]),
            ("　　　├ 官業収入", [d["otherRevGov"] for d in sim_data]),
            ("　　　├ 資産売却", [d["otherRevAsset"] for d in sim_data]),
            ("　　　└ 雑収入", [d["otherRevMisc"] for d in sim_data]),
            ("─", [None] * len(sim_data)),
            ("支出合計", [d["totalCost"] for d in sim_data]),
            ("　├ 政策経費", [d["policyExp"] for d in sim_data]),
            ("　└ 利払い費", [d["interest"] for d in sim_data]),
            ("　　　├ 債務残高", [d["debt"] for d in sim_data]),
            ("　　　└ 平均クーポン(%)", [d["avgCoupon"] for d in sim_data]),
            ("──", [None] * len(sim_data)),
            ("財政収支", [d["fiscalBalance"] for d in sim_data]),
            ("国債発行額", [d["bondIssuance"] for d in sim_data]),
            ("利払負担率(%)", [d["interestBurden"] for d in sim_data]),
        ]
        all_data_dict = {}
        all_labels = []
        for label, vals in all_rows:
            all_labels.append(label)
            for j, cn in enumerate(all_col_names):
                if cn not in all_data_dict:
                    all_data_dict[cn] = []
                if vals[j] is None:
                    all_data_dict[cn].append(np.nan)
                else:
                    all_data_dict[cn].append(round(vals[j], 1))
        df_all = pd.DataFrame(all_data_dict, index=all_labels)
        df_all.index.name = "項目"
        st.dataframe(df_all, use_container_width=True, hide_index=False)

    with st.expander("実績データ（2015〜2024年度）"):
        act_col_names = [str(d["year"]) for d in ACTUAL_DATA]
        act_rows = [
            ("税収合計", [d["tax"] for d in ACTUAL_DATA]),
            ("　├ 消費税", [d["taxConsumption"] for d in ACTUAL_DATA]),
            ("　├ 所得税", [d["taxIncome"] for d in ACTUAL_DATA]),
            ("　├ 法人税", [d["taxCorporate"] for d in ACTUAL_DATA]),
            ("　└ その他税", [d["taxOther"] for d in ACTUAL_DATA]),
            ("日銀納付金", [d["bojPayment"] for d in ACTUAL_DATA]),
            ("歳入合計", [d["totalRevenue"] for d in ACTUAL_DATA]),
            ("─", [None] * len(ACTUAL_DATA)),
            ("政策経費", [d["policyExp"] for d in ACTUAL_DATA]),
            ("利払い費", [d["interest"] for d in ACTUAL_DATA]),
            ("歳出合計", [d["totalCost"] for d in ACTUAL_DATA]),
            ("──", [None] * len(ACTUAL_DATA)),
            ("財政収支", [d["fiscalBalance"] for d in ACTUAL_DATA]),
            ("債務残高", [d["debt"] for d in ACTUAL_DATA]),
            ("利払負担率(%)", [d["interestBurden"] for d in ACTUAL_DATA]),
        ]
        act_data_dict = {}
        act_labels = []
        for label, vals in act_rows:
            act_labels.append(label)
            for j, cn in enumerate(act_col_names):
                if cn not in act_data_dict:
                    act_data_dict[cn] = []
                if vals[j] is None:
                    act_data_dict[cn].append(np.nan)
                else:
                    act_data_dict[cn].append(round(vals[j], 1))
        df_act = pd.DataFrame(act_data_dict, index=act_labels)
        df_act.index.name = "項目"
        st.dataframe(df_act, use_container_width=True, hide_index=False)

st.divider()
st.caption("※ このシミュレーターは簡易モデルです。実際の財政運営はより複雑な要因に影響されます。パラメータを変更して様々なシナリオを検討してください。")
