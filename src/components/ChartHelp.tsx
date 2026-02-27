/**
 * ChartHelp.tsx — チャートヘルプ関連コンポーネント群
 *
 * チャートタイトルに付随するヘルプアイコン・ツールチップを提供する。
 * 各チャートの説明と感度の高いパラメータを表示する。
 *
 * 含まれるコンポーネント:
 * - HelpIcon: ヘルプアイコン（?マーク）とツールチップ
 * - ChartTitleWithHelp: チャートメインタイトル＋ヘルプアイコン
 * - ChartSubtitle: チャートサブタイトル＋ヘルプアイコン
 * - NoDataTooltip: データなし期間を含むカスタムツールチップ
 */

import { useState, useRef } from 'react'
import ReactDOM from 'react-dom'

/** チャートヘルプ情報の型定義 */
export interface ChartHelpInfo {
  description: string;
  sensitiveParams: string[];
}

/** 全チャートのヘルプ情報定数 */
export const CHART_HELP: Record<string, ChartHelpInfo> = {
  '利払い負担率の推移 （税収に対する利払い費の割合）': {
    description: '税収のうち何%が借金の利息返済に消えるかを示します。30%を超えると教育・医療などの予算が圧迫されます。',
    sensitiveParams: ['ベースリスクプレミアム', '平均クーポン', 'インフレ率'],
  },
  '財政収支の推移 （歳入 − 歳出）': {
    description: '政府の収入と支出の差額です。マイナスなら赤字で国債発行が必要に、プラスなら黒字です。',
    sensitiveParams: ['実質成長率', 'インフレ率', '政策的経費'],
  },
  '債務残高の推移': {
    description: '国の借金（国債残高）の推移です。財政赤字が続くと増加し、金利上昇で利払いが膨らむ悪循環に陥ります。',
    sensitiveParams: ['実質成長率', 'ベースリスクプレミアム', '政策的経費'],
  },
  '貧困率の推移（%）': {
    description: '相対的貧困率の推移。実質賃金が低下する（物価上昇＞賃金上昇）と悪化します。',
    sensitiveParams: ['生産性分配率', 'インフレ転嫁率', '貧困率感応度'],
  },
  'ジニ係数の推移（x100）': {
    description: '所得格差の大きさ。資産価格上昇が実質賃金を上回ると格差が拡大します。',
    sensitiveParams: ['生産性分配率', '内部留保還元率', '為替バイアス'],
  },
  '実質賃金伸び率（%）': {
    description: 'インフレ調整後の賃金の伸び。マイナスなら実質的な賃金カットで生活水準が低下します。',
    sensitiveParams: ['生産性分配率', 'インフレ転嫁率', 'インフレ率'],
  },
  '可処分所得の変化（万円/年）': {
    description: '年収400万円世帯の可処分所得（税・社保・食費・光熱費控除後）の2026年からの変化額です。',
    sensitiveParams: ['インフレ率', '生産性分配率', 'インフレ転嫁率'],
  },
  '生活費の増加（万円/年）': {
    description: '食費・光熱費の2026年からの増加額。CPIと円安が反映されます。エネルギー補助金で光熱費増が軽減されます。',
    sensitiveParams: ['インフレ率', '為替バイアス', 'エネルギー補助金率'],
  },
  '所得格差倍率（上位20%÷下位20%）': {
    description: '上位20%の所得が下位20%の何倍かを示す五分位倍率。ジニ係数から変換しています。',
    sensitiveParams: ['生産性分配率', '内部留保還元率', '実質成長率'],
  },
  '貿易収支の推移': {
    description: '輸出と輸入の差額。円安は輸出に有利ですが輸入コストも増加します。',
    sensitiveParams: ['為替バイアス', '世界経済成長率', '実質成長率'],
  },
  '為替レートの推移': {
    description: '円/ドルの為替レート推移。円安が進むと輸入物価が上昇し家計を圧迫します。',
    sensitiveParams: ['為替バイアス', 'ベースリスクプレミアム', '通貨リスクプレミアム'],
  },
  '対外純資産の推移': {
    description: '日本が海外に持つ資産から負債を引いた純額。経常赤字が続くと減少します。',
    sensitiveParams: ['為替バイアス', '世界経済成長率', '実質成長率'],
  },
  '経常収支の推移（兆円）': {
    description: '貿易収支＋所得収支。赤字転落すると通貨リスクプレミアムが発動し金利上昇につながります。',
    sensitiveParams: ['為替バイアス', '世界経済成長率', 'NFA防衛ライン'],
  },
  '通貨リスクプレミアム加算（%）': {
    description: '経常赤字＋NFA低下時に市場金利に自動加算されるペナルティ。通貨の信認低下を表します。',
    sensitiveParams: ['通貨リスクプレミアム', 'NFA防衛ライン', '為替バイアス'],
  },
  '名目GDP（兆円）': {
    description: '日本の名目GDP推移。インフレ率＋実質成長率で毎年成長します。',
    sensitiveParams: ['実質成長率', 'インフレ率', '為替バイアス'],
  },
  '債務残高GDP比・内部留保GDP比（%）': {
    description: '政府債務と企業内部留保のGDP比。内部留保比率が高いと企業が賃金に分配していない状態です。',
    sensitiveParams: ['生産性分配率', '内部留保還元率', '実質成長率'],
  },
  '税収内訳・歳入（兆円）': {
    description: '消費税・所得税・法人税・その他税の内訳推移。利払い費がマイナスの年は「利息純収入」として歳入に加算されます。',
    sensitiveParams: ['実質成長率', 'インフレ率', '為替バイアス'],
  },
  '歳入の財源構成（%）': {
    description: '歳入全体に占める税収・公債金・その他の比率。公債金依存度が高いほど財政リスクが大きいです。',
    sensitiveParams: ['実質成長率', '政策的経費', 'ベースリスクプレミアム'],
  },
  '歳出分野別内訳（兆円）': {
    description: '社会保障・子育て・地方交付税・防衛・利払い等の分野別歳出。高齢化で社会保障が膨らみます。利払い費がマイナスの場合は歳入側に「利息純収入」として振り替えます。',
    sensitiveParams: ['インフレ率', '社会保障費', '自然増'],
  },
  '日銀純利益（兆円）': {
    description: '日銀の収入（保有国債利息）と支出（当座預金の付利）の差額。金利上昇で逆ザヤのリスクがあります。',
    sensitiveParams: ['ベースリスクプレミアム', '保有国債利回り', 'QT縮小額'],
  },
  '統合政府への反映額（兆円）': {
    description: '日銀利益のうち国庫に納付される金額。逆ザヤが累積するとマイナスになり歳入を減少させます。',
    sensitiveParams: ['ベースリスクプレミアム', '日銀自己資本バッファ', 'QT縮小額'],
  },
  '累積損失（兆円）': {
    description: '日銀の逆ザヤ（金利コスト＞国債利息）の累積。自己資本バッファを超過すると歳入に直接影響します。',
    sensitiveParams: ['ベースリスクプレミアム', '日銀自己資本バッファ', '政策金利スプレッド'],
  },
  '日銀バランスシート（兆円）': {
    description: '日銀の保有国債と当座預金の残高推移。QT（量的引き締め）で両方が縮小していきます。',
    sensitiveParams: ['QT縮小額', '当座預金下限', '保有国債'],
  },
  '金利比較（%）': {
    description: '実効市場金利・平均クーポン・日銀保有利回り・名目成長率の比較。金利＞成長率だと債務が発散しやすいです。',
    sensitiveParams: ['ベースリスクプレミアム', '財政リスク感応度', 'インフレ率'],
  },
  '財政リスクプレミアム加算（%）': {
    description: '利払負担率が閾値を超えた場合に市場金利に加算されるペナルティ。市場の財政不信を表します。',
    sensitiveParams: ['財政リスク感応度', '利払負担率閾値', 'ベースリスクプレミアム'],
  },
  '税収構成比（%）': {
    description: '消費税・所得税・法人税・その他税が税収全体に占める割合。構造変化を可視化します。',
    sensitiveParams: ['実質成長率', 'インフレ率', '消費税率'],
  },
  '支出構成比（%）': {
    description: '歳出に占める政策経費と利払い費の割合。利払い比率が増えると政策の自由度が低下します。',
    sensitiveParams: ['ベースリスクプレミアム', '政策的経費', 'インフレ率'],
  },
  '人的資本指数・労働力指数': {
    description: '人的資本指数は教育投資・技術進歩・人口動態から算出。労働力指数は人口成長率と労働参加率変化で変動します。100を基準とし、上回れば改善、下回れば悪化。',
    sensitiveParams: ['人口成長率', '教育投資GDP比', 'テクノロジー効果'],
  },
  '合計特殊出生率（TFR）の推移': {
    description: '内生的に計算される合計特殊出生率。賃金・格差・子育て支援の3要因で変動します。2.07は人口置換水準、1.20は現在の日本の水準。',
    sensitiveParams: ['ベースTFR', '出生率感応度', '人口成長率'],
  },
  '社会活力指数': {
    description: 'TFR・人的資本成長率・実質賃金変化率から算出する総合指標。120以上で好循環、80以下で悪循環を示します。',
    sensitiveParams: ['人口成長率', '教育投資GDP比', 'テクノロジー効果'],
  },
}

/**
 * ヘルプアイコン（?マーク）コンポーネント
 * @param help チャートヘルプ情報（説明と感度の高いパラメータ）
 */
function HelpIcon({ help }: { help: ChartHelpInfo }) {
  const [show, setShow] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const iconRef = useRef<HTMLSpanElement>(null);

  const handleEnter = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      const tooltipWidth = 280;
      const tooltipHeight = 120;
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      if (left < 8) left = 8;
      if (left + tooltipWidth > window.innerWidth - 8) left = window.innerWidth - tooltipWidth - 8;
      const showBelow = rect.top < tooltipHeight + 16;
      const top = showBelow ? rect.bottom + 8 : rect.top - tooltipHeight - 8;
      setStyle({ position: 'fixed', top, left, transform: 'none' });
    }
    setShow(true);
  };

  return (
    <>
      <span
        ref={iconRef}
        className="chart-help-icon"
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
      >
        ?
      </span>
      {show && ReactDOM.createPortal(
        <div className="chart-help-tooltip chart-help-tooltip-visible" style={style}>
          <span className="chart-help-desc">{help.description}</span>
          <span className="chart-help-params-label">感度の高いパラメータ:</span>
          {help.sensitiveParams.map((p, i) => (
            <span key={i} className="chart-help-param-tag">{p}</span>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

/**
 * チャートサブタイトル＋ヘルプアイコン
 * @param title チャートのサブタイトル文字列
 */
export function ChartSubtitle({ title }: { title: string }) {
  const help = CHART_HELP[title]
  if (!help) return <div className="chart-subtitle">{title}</div>
  return (
    <div className="chart-subtitle">
      {title}
      <HelpIcon help={help} />
    </div>
  )
}

/**
 * チャートメインタイトル＋ヘルプアイコン
 * @param title チャートのメインタイトル文字列
 */
export function ChartTitleWithHelp({ title }: { title: string }) {
  const help = CHART_HELP[title]
  if (!help) return <div className="chart-title">{title}</div>
  return (
    <div className="chart-title">
      {title}
      <HelpIcon help={help} />
    </div>
  )
}

/**
 * データなし期間を含むカスタムツールチップ
 * @param unit 表示単位（例: "%", " 兆円"）
 * @param decimals 小数点以下の桁数（デフォルト: 1）
 * @param childAge2026 子供の2026年時点の年齢（指定時に年齢表示）
 */
export function NoDataTooltip({ active, payload, label, unit, decimals, childAge2026 }: { active?: boolean; payload?: Array<{ name: string; value: number | null; color: string }>; label?: number; unit?: string; decimals?: number; childAge2026?: number }) {
  if (!active || !payload || !label) return null
  const isNoData = payload.every(p => p.value === null || p.value === undefined)
  const dec = decimals ?? 1
  const u = unit ?? ''
  const childAge = childAge2026 !== undefined ? childAge2026 + (label - 2026) : undefined
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}年度</div>
      {childAge !== undefined && childAge >= 0 && (
        <div style={{ color: '#f59e0b', fontWeight: 600, marginBottom: 4, fontSize: 11 }}>👶 子供の年齢: {childAge}歳</div>
      )}
      {isNoData ? (
        <div style={{ color: '#94a3b8' }}>実績なし</div>
      ) : (
        payload.filter(p => p.value !== null && p.value !== undefined).map((p, i) => (
          <div key={i} style={{ color: p.color, marginBottom: 2 }}>
            {p.name}: {typeof p.value === 'number' ? (dec === 0 ? p.value.toLocaleString() : p.value.toFixed(dec)) : p.value}{u}
          </div>
        ))
      )}
    </div>
  )
}
