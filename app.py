import streamlit as st
import pandas as pd

st.set_page_config(
    page_title="統合政府 財政シミュレーター",
    page_icon="🏛️",
    layout="wide",
)

st.title("🏛️ 統合政府 30年財政シミュレーター")
st.caption("2026〜2055年：日本政府＋日銀の財政推移シミュレーション")

with st.sidebar:
    st.header("マクロ経済パラメータ")

    inflation_rate = st.slider(
        "インフレ率 (%)", 0.0, 10.0, 2.0, 0.1, help="年間インフレ率"
    )
    real_growth = st.slider(
        "実質成長率 (%)", -2.0, 5.0, 0.5, 0.1, help="実質GDP成長率"
    )
    risk_premium = st.slider(
        "リスクプレミアム (%)", 0.0, 3.0, 0.5, 0.1, help="長期金利に加算されるリスクプレミアム"
    )

    st.header("初期値（2026年）")

    init_debt = st.number_input(
        "債務残高 (兆円)", value=1100.0, step=50.0
    )
    init_tax = st.number_input(
        "税収 (兆円)", value=75.0, step=5.0
    )
    init_policy_exp = st.number_input(
        "政策的経費 (兆円)", value=80.0, step=5.0
    )
    init_avg_coupon = st.slider(
        "平均クーポン (%)", 0.0, 5.0, 0.8, 0.1
    )

    st.header("日銀パラメータ")

    boj_current_account = st.number_input(
        "日銀当座預金 (兆円)", value=550.0, step=50.0
    )
    boj_bond_yield = st.slider(
        "日銀保有国債利回り (%)", 0.0, 2.0, 0.2, 0.05,
        help="日銀収益 = 保有国債 × この利回り"
    )

    st.header("その他")

    tax_elasticity = st.slider(
        "税収弾性値", 0.5, 2.0, 1.2, 0.1
    )
    other_revenue = st.number_input(
        "その他収入 (兆円/年)", value=15.0, step=1.0
    )
    natural_increase = st.number_input(
        "政策経費の自然増 (兆円/年)", value=0.5, step=0.1
    )
    policy_rate_spread = st.slider(
        "政策金利スプレッド (%)", 0.0, 3.0, 1.0, 0.1,
        help="政策金利 = 市場金利 - このスプレッド（最低0%）"
    )

B = inflation_rate / 100
C = real_growth / 100
D = B + C
E = D + risk_premium / 100

years = list(range(2026, 2056))
n = len(years)

col_year = years
col_inflation = [B] * n
col_real_growth = [C] * n
col_nominal_growth = [D] * n
col_market_rate = [E] * n

col_tax = [0.0] * n
col_boj_payment = [0.0] * n
col_total_revenue = [0.0] * n

col_policy_exp = [0.0] * n
col_avg_coupon = [0.0] * n
col_interest = [0.0] * n
col_total_cost = [0.0] * n

col_debt = [0.0] * n
col_fiscal_balance = [0.0] * n
col_interest_burden = [0.0] * n

col_tax[0] = init_tax
col_policy_exp[0] = init_policy_exp
col_avg_coupon[0] = init_avg_coupon / 100
col_debt[0] = init_debt

policy_rate_0 = max(E - policy_rate_spread / 100, 0)
boj_revenue_0 = init_debt * (boj_bond_yield / 100)
boj_cost_0 = boj_current_account * policy_rate_0
col_boj_payment[0] = max(boj_revenue_0 - boj_cost_0, 0)

col_total_revenue[0] = col_tax[0] + col_boj_payment[0] + other_revenue

col_interest[0] = col_debt[0] * col_avg_coupon[0]
col_total_cost[0] = col_policy_exp[0] + col_interest[0]

col_fiscal_balance[0] = col_total_revenue[0] - col_total_cost[0]
col_debt[0] = init_debt + (col_total_cost[0] - col_total_revenue[0])
col_interest_burden[0] = (col_interest[0] / col_tax[0]) * 100 if col_tax[0] != 0 else 0

for i in range(1, n):
    col_tax[i] = col_tax[i - 1] * (1 + D * tax_elasticity)

    policy_rate = max(E - policy_rate_spread / 100, 0)
    boj_revenue = col_debt[i - 1] * (boj_bond_yield / 100)
    boj_cost = boj_current_account * policy_rate
    col_boj_payment[i] = max(boj_revenue - boj_cost, 0)

    col_total_revenue[i] = col_tax[i] + col_boj_payment[i] + other_revenue

    col_policy_exp[i] = col_policy_exp[i - 1] * (1 + B) + natural_increase

    col_avg_coupon[i] = (col_avg_coupon[i - 1] * 8 / 9) + (E * 1 / 9)

    col_interest[i] = col_debt[i - 1] * col_avg_coupon[i]
    col_total_cost[i] = col_policy_exp[i] + col_interest[i]

    col_fiscal_balance[i] = col_total_revenue[i] - col_total_cost[i]
    col_debt[i] = col_debt[i - 1] + (col_total_cost[i] - col_total_revenue[i])
    col_interest_burden[i] = (col_interest[i] / col_tax[i]) * 100 if col_tax[i] != 0 else 0

df = pd.DataFrame({
    "[A] 年度": col_year,
    "[B] インフレ率%": [x * 100 for x in col_inflation],
    "[C] 実質成長率%": [x * 100 for x in col_real_growth],
    "[D] 名目成長率%": [x * 100 for x in col_nominal_growth],
    "[E] 市場金利%": [x * 100 for x in col_market_rate],
    "[F] 税収": col_tax,
    "[G] 日銀納付金": col_boj_payment,
    "[H] 合計収益": col_total_revenue,
    "[I] 政策経費": col_policy_exp,
    "[J] 平均ｸｰﾎﾟﾝ%": [x * 100 for x in col_avg_coupon],
    "[K] 利払い費": col_interest,
    "[L] 合計費用": col_total_cost,
    "[M] 債務残高": col_debt,
    "[N] 財政収支": col_fiscal_balance,
    "[O] 利払負担率%": col_interest_burden,
})

st.subheader("主要年度サマリー（5年おき）")

summary_years = [2026, 2030, 2035, 2040, 2045, 2050, 2055]
df_summary = df[df["[A] 年度"].isin(summary_years)].copy()

display_cols = [
    "[A] 年度", "[F] 税収", "[H] 合計収益", "[I] 政策経費",
    "[K] 利払い費", "[M] 債務残高", "[N] 財政収支", "[O] 利払負担率%"
]
df_display = df_summary[display_cols].copy()

for c in display_cols[1:]:
    if c == "[O] 利払負担率%":
        df_display[c] = df_display[c].apply(lambda x: f"{x:.1f}%")
    else:
        df_display[c] = df_display[c].apply(lambda x: f"{x:.1f}")

df_display["[A] 年度"] = df_display["[A] 年度"].astype(int)

from tabulate import tabulate

table_str = tabulate(
    df_display.values.tolist(),
    headers=df_display.columns.tolist(),
    tablefmt="simple",
    stralign="right",
    numalign="right",
)
st.code(table_str, language=None)

warning_years = df[df["[O] 利払負担率%"] > 30]["[A] 年度"].tolist()
if warning_years:
    first_year = int(warning_years[0])
    burden_at_year = df[df["[A] 年度"] == first_year]["[O] 利払負担率%"].values[0]
    st.error(
        f"⚠️ 警告：{first_year}年に利払い負担率が {burden_at_year:.1f}% に達し、"
        f"30%の警戒ラインを超えます。政策予算が利払いに圧迫される危険水準です。"
    )
else:
    st.success("✅ シミュレーション期間中、利払い負担率は30%を超えませんでした。")

st.subheader("利払い負担率の推移")
chart_burden = pd.DataFrame({
    "年度": col_year,
    "利払い負担率 (%)": col_interest_burden,
})
chart_burden = chart_burden.set_index("年度")
st.line_chart(chart_burden, color="#FF4B4B")

col1, col2 = st.columns(2)

with col1:
    st.subheader("債務残高の推移")
    chart_debt = pd.DataFrame({
        "年度": col_year,
        "債務残高 (兆円)": col_debt,
    })
    chart_debt = chart_debt.set_index("年度")
    st.line_chart(chart_debt, color="#FF8C00")

with col2:
    st.subheader("財政収支の推移")
    chart_balance = pd.DataFrame({
        "年度": col_year,
        "財政収支 (兆円)": col_fiscal_balance,
    })
    chart_balance = chart_balance.set_index("年度")
    st.line_chart(chart_balance, color="#1E90FF")

st.subheader("税収 vs 利払い費")
chart_tax_int = pd.DataFrame({
    "年度": col_year,
    "税収": col_tax,
    "利払い費": col_interest,
})
chart_tax_int = chart_tax_int.set_index("年度")
st.line_chart(chart_tax_int)

with st.expander("全年度データを表示"):
    df_full = df.copy()
    df_full["[A] 年度"] = df_full["[A] 年度"].astype(int)
    for c in df_full.columns[1:]:
        df_full[c] = df_full[c].apply(lambda x: f"{x:.2f}")
    st.dataframe(df_full, use_container_width=True, hide_index=True)

st.divider()
st.caption(
    "※ このシミュレーターは簡易モデルです。実際の財政運営はより複雑な要因に影響されます。"
    "パラメータを変更して様々なシナリオを検討してください。"
)
