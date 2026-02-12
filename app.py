import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from tabulate import tabulate

st.set_page_config(
    page_title="統合政府 財政シミュレーター",
    page_icon="🏛️",
    layout="wide",
)

SCENARIOS = {
    "カスタム（手動設定）": None,
    "① ベースライン（現状維持）": {
        "label": "現在の政策を維持した場合の標準シナリオ",
        "inflation": 2.0, "real_growth": 0.5, "risk_premium": 0.5,
        "debt": 1100.0, "tax": 75.0, "policy_exp": 80.0,
        "avg_coupon": 0.8, "boj_ca": 550.0, "boj_yield": 0.2,
        "elasticity": 1.2, "other_rev": 15.0, "nat_inc": 0.5, "spread": 1.0,
    },
    "② 高成長シナリオ": {
        "label": "構造改革が奏功し、実質成長率が高まるケース",
        "inflation": 2.0, "real_growth": 2.0, "risk_premium": 0.3,
        "debt": 1100.0, "tax": 75.0, "policy_exp": 80.0,
        "avg_coupon": 0.8, "boj_ca": 550.0, "boj_yield": 0.2,
        "elasticity": 1.3, "other_rev": 16.0, "nat_inc": 0.5, "spread": 1.0,
    },
    "③ スタグフレーション": {
        "label": "高インフレ＋低成長が長期化するケース",
        "inflation": 4.0, "real_growth": 0.0, "risk_premium": 1.0,
        "debt": 1100.0, "tax": 75.0, "policy_exp": 80.0,
        "avg_coupon": 0.8, "boj_ca": 550.0, "boj_yield": 0.2,
        "elasticity": 0.8, "other_rev": 15.0, "nat_inc": 1.0, "spread": 0.5,
    },
    "④ 金利急騰シナリオ": {
        "label": "国債の信認低下でリスクプレミアムが上昇するケース",
        "inflation": 2.5, "real_growth": 0.3, "risk_premium": 2.0,
        "debt": 1100.0, "tax": 75.0, "policy_exp": 80.0,
        "avg_coupon": 0.8, "boj_ca": 550.0, "boj_yield": 0.2,
        "elasticity": 1.2, "other_rev": 15.0, "nat_inc": 0.5, "spread": 1.0,
    },
    "⑤ 財政再建シナリオ": {
        "label": "歳出削減と増税で財政健全化を目指すケース",
        "inflation": 1.5, "real_growth": 1.0, "risk_premium": 0.3,
        "debt": 1100.0, "tax": 80.0, "policy_exp": 75.0,
        "avg_coupon": 0.8, "boj_ca": 550.0, "boj_yield": 0.2,
        "elasticity": 1.2, "other_rev": 17.0, "nat_inc": 0.3, "spread": 1.0,
    },
}

with st.sidebar:
    st.header("シナリオ選択")
    scenario_name = st.selectbox(
        "プリセットシナリオ",
        list(SCENARIOS.keys()),
        index=1,
    )
    scenario = SCENARIOS[scenario_name]

    if scenario:
        st.info(f"📖 {scenario['label']}")

    def sv(key, default):
        return scenario[key] if scenario else default

    st.header("マクロ経済パラメータ")
    inflation_rate = st.slider("インフレ率 (%)", 0.0, 10.0, sv("inflation", 2.0), 0.1)
    real_growth = st.slider("実質成長率 (%)", -2.0, 5.0, sv("real_growth", 0.5), 0.1)
    risk_premium = st.slider("リスクプレミアム (%)", 0.0, 3.0, sv("risk_premium", 0.5), 0.1)

    st.header("初期値（2026年）")
    init_debt = st.number_input("債務残高 (兆円)", value=sv("debt", 1100.0), step=50.0)
    init_tax = st.number_input("税収 (兆円)", value=sv("tax", 75.0), step=5.0)
    init_policy_exp = st.number_input("政策的経費 (兆円)", value=sv("policy_exp", 80.0), step=5.0)
    init_avg_coupon = st.slider("平均クーポン (%)", 0.0, 5.0, sv("avg_coupon", 0.8), 0.1)

    st.header("日銀パラメータ")
    boj_current_account = st.number_input("日銀当座預金 (兆円)", value=sv("boj_ca", 550.0), step=50.0)
    boj_bond_yield = st.slider("日銀保有国債利回り (%)", 0.0, 2.0, sv("boj_yield", 0.2), 0.05)

    st.header("その他")
    tax_elasticity = st.slider("税収弾性値", 0.5, 2.0, sv("elasticity", 1.2), 0.1)
    other_revenue = st.number_input("その他収入 (兆円/年)", value=sv("other_rev", 15.0), step=1.0)
    natural_increase = st.number_input("政策経費の自然増 (兆円/年)", value=sv("nat_inc", 0.5), step=0.1)
    policy_rate_spread = st.slider("政策金利スプレッド (%)", 0.0, 3.0, sv("spread", 1.0), 0.1)

B = inflation_rate / 100
C = real_growth / 100
D = B + C
E = D + risk_premium / 100

years = list(range(2026, 2056))
n = len(years)

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
    "[A] 年度": years,
    "[B] インフレ率%": [B * 100] * n,
    "[C] 実質成長率%": [C * 100] * n,
    "[D] 名目成長率%": [D * 100] * n,
    "[E] 市場金利%": [E * 100] * n,
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

tab_sim, tab_waterfall, tab_guide = st.tabs(["📊 シミュレーション結果", "📉 ウォーターフォール分析", "📖 変数説明"])

with tab_sim:
    st.title("🏛️ 統合政府 30年財政シミュレーター")
    st.caption(f"2026〜2055年 ─ シナリオ: {scenario_name}")

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

    table_str = tabulate(
        df_display.values.tolist(),
        headers=df_display.columns.tolist(),
        tablefmt="simple", stralign="right", numalign="right",
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

    CHART_HEIGHT = 300

    st.subheader("利払い負担率の推移")
    fig_burden = go.Figure()
    colors_burden = ["#FF4B4B" if v > 30 else "#FF8C8C" for v in col_interest_burden]
    fig_burden.add_trace(go.Bar(x=years, y=col_interest_burden, marker_color=colors_burden))
    fig_burden.add_hline(y=30, line_dash="dash", line_color="red", annotation_text="警戒ライン 30%")
    fig_burden.update_layout(
        yaxis_title="利払い負担率 (%)", xaxis_title="年度",
        height=CHART_HEIGHT, margin=dict(t=30, b=40, l=50, r=20),
    )
    st.plotly_chart(fig_burden, use_container_width=True)

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("債務残高の推移")
        fig_debt = go.Figure()
        fig_debt.add_trace(go.Bar(x=years, y=col_debt, marker_color="#FF8C00"))
        fig_debt.update_layout(
            yaxis_title="兆円", xaxis_title="年度",
            height=CHART_HEIGHT, margin=dict(t=30, b=40, l=50, r=20),
        )
        st.plotly_chart(fig_debt, use_container_width=True)

    with col2:
        st.subheader("財政収支の推移")
        fig_balance = go.Figure()
        colors_bal = ["#2ecc71" if v >= 0 else "#e74c3c" for v in col_fiscal_balance]
        fig_balance.add_trace(go.Bar(x=years, y=col_fiscal_balance, marker_color=colors_bal))
        fig_balance.add_hline(y=0, line_color="gray", line_width=1)
        fig_balance.update_layout(
            yaxis_title="兆円", xaxis_title="年度",
            height=CHART_HEIGHT, margin=dict(t=30, b=40, l=50, r=20),
        )
        st.plotly_chart(fig_balance, use_container_width=True)

    st.subheader("税収 vs 利払い費")
    fig_tax_int = go.Figure()
    fig_tax_int.add_trace(go.Bar(x=years, y=col_tax, name="税収", marker_color="#3498db"))
    fig_tax_int.add_trace(go.Bar(x=years, y=col_interest, name="利払い費", marker_color="#e74c3c"))
    fig_tax_int.update_layout(
        barmode="group", yaxis_title="兆円", xaxis_title="年度",
        height=CHART_HEIGHT, margin=dict(t=30, b=40, l=50, r=20),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    st.plotly_chart(fig_tax_int, use_container_width=True)

    with st.expander("全年度データを表示"):
        df_full = df.copy()
        df_full["[A] 年度"] = df_full["[A] 年度"].astype(int)
        for c in df_full.columns[1:]:
            df_full[c] = df_full[c].apply(lambda x: f"{x:.2f}")
        st.dataframe(df_full, use_container_width=True, hide_index=True)

with tab_waterfall:
    st.title("📉 単年度 収支ウォーターフォール")
    st.caption("選択した年度の歳入・歳出の内訳を可視化します")

    wf_year = st.select_slider("分析する年度を選択", options=years, value=2035)
    idx = years.index(wf_year)

    tax_val = col_tax[idx]
    boj_val = col_boj_payment[idx]
    other_val = other_revenue
    total_rev = col_total_revenue[idx]
    policy_val = col_policy_exp[idx]
    interest_val = col_interest[idx]
    total_exp = col_total_cost[idx]
    balance = col_fiscal_balance[idx]

    fig_wf = go.Figure(go.Waterfall(
        name="収支内訳",
        orientation="v",
        measure=["relative", "relative", "relative", "total",
                 "relative", "relative", "total", "total"],
        x=["税収", "日銀納付金", "その他収入", "歳入合計",
           "政策経費", "利払い費", "歳出合計", "財政収支"],
        y=[tax_val, boj_val, other_val, 0,
           -policy_val, -interest_val, 0, 0],
        text=[f"{tax_val:.1f}", f"{boj_val:.1f}", f"{other_val:.1f}", f"{total_rev:.1f}",
              f"-{policy_val:.1f}", f"-{interest_val:.1f}", f"{total_exp:.1f}", f"{balance:.1f}"],
        textposition="outside",
        connector={"line": {"color": "rgb(63, 63, 63)"}},
        increasing={"marker": {"color": "#3498db"}},
        decreasing={"marker": {"color": "#e74c3c"}},
        totals={"marker": {"color": "#2c3e50"}},
    ))
    fig_wf.update_layout(
        title=f"{wf_year}年度の財政収支ウォーターフォール",
        yaxis_title="兆円",
        height=400,
        margin=dict(t=60, b=40, l=50, r=20),
        showlegend=False,
    )
    st.plotly_chart(fig_wf, use_container_width=True)

    st.subheader(f"{wf_year}年度 詳細データ")
    c1, c2, c3 = st.columns(3)
    with c1:
        st.metric("税収", f"{tax_val:.1f} 兆円")
        st.metric("日銀納付金", f"{boj_val:.1f} 兆円")
        st.metric("その他収入", f"{other_val:.1f} 兆円")
    with c2:
        st.metric("政策経費", f"{policy_val:.1f} 兆円")
        st.metric("利払い費", f"{interest_val:.1f} 兆円")
        st.metric("合計費用", f"{total_exp:.1f} 兆円")
    with c3:
        st.metric("歳入合計", f"{total_rev:.1f} 兆円")
        st.metric("財政収支", f"{balance:.1f} 兆円", delta=f"{balance:.1f}")
        st.metric("利払負担率", f"{col_interest_burden[idx]:.1f}%")

with tab_guide:
    st.title("📖 変数・計算ロジック説明")
    st.caption("シミュレーターで使用される各変数[A]〜[O]の意味と計算方法を解説します")

    st.header("マクロ環境")
    st.markdown("""
| 列 | 変数名 | 説明 |
|---|---|---|
| **[A]** | **年度** | シミュレーション対象年度（2026〜2055年） |
| **[B]** | **インフレ率** | 年間の消費者物価上昇率。初期値2.0%。政策経費や金利に影響します |
| **[C]** | **実質成長率** | 物価変動を除いた実質的なGDP成長率。初期値0.5% |
| **[D]** | **名目成長率** | インフレ率＋実質成長率。税収の伸びに直結します |
| **[E]** | **市場長期金利** | 名目成長率＋リスクプレミアム。国債の新規発行利率に影響します |
""")

    st.header("歳入（収入）")
    st.markdown("""
| 列 | 変数名 | 計算式 | 説明 |
|---|---|---|---|
| **[F]** | **税収** | 前年税収 × (1 + 名目成長率 × 弾性値1.2) | 経済成長に伴い税収が増加。弾性値1.2は、GDP1%増で税収が1.2%増えることを意味します |
| **[G]** | **日銀納付金** | max(保有国債×利回り − 当座預金×政策金利, 0) | 日銀の利益から政府に納付される金額。金利上昇で日銀のコストが増え、納付金が減少します |
| **[H]** | **合計収益** | 税収 + 日銀納付金 + その他収入(15兆円) | 政府の年間総収入 |
""")

    st.header("歳出（支出）")
    st.markdown("""
| 列 | 変数名 | 計算式 | 説明 |
|---|---|---|---|
| **[I]** | **政策的経費** | 前年 × (1 + インフレ率) + 自然増0.5兆円 | 社会保障費・公共事業などの経費。インフレと高齢化で毎年増加します |
| **[J]** | **平均クーポン** | (前年×8/9) + (市場金利×1/9) | 国債の平均利率。国債は約9年で借り換えるため、毎年1/9が新金利に置き換わります |
| **[K]** | **利払い費** | 債務残高 × 平均クーポン | 国債の利子支払額。債務残高と金利の両方が上がると急増します |
| **[L]** | **合計費用** | 政策経費 + 利払い費 | 政府の年間総支出 |
""")

    st.header("収支・残高")
    st.markdown("""
| 列 | 変数名 | 計算式 | 説明 |
|---|---|---|---|
| **[M]** | **債務残高** | 前年残高 + (合計費用 − 合計収益) | 借金の累積額。赤字が続くと雪だるま式に増加します |
| **[N]** | **財政収支** | 合計収益 − 合計費用 | プラスなら黒字、マイナスなら赤字 |
| **[O]** | **利払負担率** | (利払い費 / 税収) × 100 | 税収のうち何%が利子支払いに消えるかの指標。**30%超で危険水準** |
""")

    st.header("主要パラメータの意味")
    st.markdown("""
- **リスクプレミアム**: 国債の信用リスクに対する上乗せ金利。財政悪化で上昇する傾向があります
- **税収弾性値**: GDP成長率に対する税収の感応度。1.2なら、GDP1%増で税収が1.2%増加
- **政策金利スプレッド**: 日銀の政策金利と市場金利の差。通常1%程度
- **日銀当座預金**: 金融機関が日銀に預けている預金。利上げ時にこの付利コストが日銀の負担になります
- **9年借換ロジック**: 日本国債の平均残存期間（約9年）に基づき、毎年約1/9が新金利で借り換えられます
""")

    st.header("シナリオの説明")
    for name, s in SCENARIOS.items():
        if s is None:
            continue
        st.markdown(f"**{name}**")
        st.markdown(f"> {s['label']}")
        st.markdown(
            f"インフレ率 {s['inflation']}% / 実質成長率 {s['real_growth']}% / "
            f"リスクプレミアム {s['risk_premium']}% / 税収 {s['tax']}兆円 / "
            f"政策経費 {s['policy_exp']}兆円"
        )

st.divider()
st.caption(
    "※ このシミュレーターは簡易モデルです。実際の財政運営はより複雑な要因に影響されます。"
    "パラメータを変更して様々なシナリオを検討してください。"
)
