/**
 * WarningAccordion.tsx — 警告イベント表示コンポーネント
 *
 * シミュレーション結果から検出された警告イベントを
 * アコーディオン形式で表示する。各警告タイプごとに
 * 「実生活への影響」と「政策オプション」を展開表示できる。
 */

import { useState } from 'react'
import type { Warning } from '../warnings'

const WARNING_DETAILS: Record<string, { impact: string[]; options: string[] }> = {
  '利払負担率30%超過': {
    impact: [
      '政府が税収の3割以上を借金の利息に使う状態。教育・医療・インフラへの予算が圧迫され、サービスの質が低下しやすい',
      '社会保障の給付削減や自己負担増加が政治的に議論されやすくなる',
    ],
    options: [
      '増税（消費税・所得税・法人税の引き上げ）',
      '歳出カット（社会保障の自然増抑制、公共事業削減）',
      '名目成長率の引き上げによる税収増（成長戦略・賃上げ促進）',
    ],
  },
  '通貨リスクプレミアム発動': {
    impact: [
      '長期金利が上昇し、住宅ローン・企業借入コストが上がる',
      '円安がさらに進み、食料・エネルギーなど輸入物価が上昇して家計の実質可処分所得が減少する',
      '外貨建て資産（海外旅行・外国製品）のコストが増大する',
    ],
    options: [
      '外貨準備の活用による円買い介入',
      '輸出競争力強化策（産業政策・FTA推進）',
      '財政再建シグナルによる市場信認の回復',
      '観光・デジタルサービス輸出による経常収支改善',
    ],
  },
  '実質賃金3年連続マイナス': {
    impact: [
      '年収400万円世帯では実質的な生活水準が毎年低下し、食費・光熱費の削減を迫られる',
      '貯蓄の取り崩しが進み、老後資産形成が困難になる',
      '貧困率・ジニ係数の悪化が加速する',
    ],
    options: [
      '最低賃金の引き上げ・賃上げ税制',
      'エネルギー補助金の拡充（物価上昇の直接軽減）',
      '給付付き税額控除など低所得層への直接支援',
    ],
  },
  '経常収支の赤字転落': {
    impact: [
      '円の対外信認が中長期的に低下し、じわじわと円安圧力が続く',
      '輸入に頼る食料・エネルギーのコストが構造的に高止まりする',
      '海外からの資本流入に依存する構造になり、金利が海外投資家の意向に左右されやすくなる',
    ],
    options: [
      '再生可能エネルギー投資によるエネルギー輸入の削減',
      'インバウンド観光・コンテンツ輸出などサービス収支の改善',
      '半導体・製造業の国内回帰による輸出回復',
    ],
  },
  '日銀自己資本バッファ超過': {
    impact: [
      '日銀の累積損失が引当金・準備金を超過し、実質的な債務超過状態に',
      '統合政府の歳入が直接減少し、他の政策予算を圧迫する',
      '中央銀行の信認低下が通貨（円）の信認低下につながるリスク',
    ],
    options: [
      '政策金利の据え置き（付利コストの抑制）',
      '国債保有の段階的圧縮（量的引き締め）',
      '政府からの資本注入による自己資本の回復',
    ],
  },
  '財政収支の慢性的赤字': {
    impact: [
      '財政赤字が長期間続くと国債発行残高が雪だるま式に膨らみ、利払い費が加速度的に増加する',
      '市場の財政信認が低下し、国債の金利上昇（リスクプレミアム）につながる可能性がある',
      '将来世代への負担が増大し、社会保障・教育・インフラへの投資余力が失われる',
    ],
    options: [
      '歳入改革（税制の見直し・課税ベースの拡大）',
      '歳出改革（社会保障の効率化・行政のデジタル化によるコスト削減）',
      '経済成長戦略による税収の自然増（名目GDP成長率の引き上げ）',
      'プライマリーバランス黒字化目標の設定と工程表の策定',
    ],
  },
  '前年比100%超の変化': {
    impact: [
      'シミュレーション結果に前年比100%を超える急激な変動が含まれています',
      'パラメータ設定が極端な値になっている可能性があります',
    ],
    options: [
      'パラメータの設定値を確認・調整してください',
      '別のシナリオと比較して妥当性を検証してください',
    ],
  },
  '通貨信認リスク（最上級）': {
    impact: [
      '経常収支の赤字が長期化し、対外純資産（NFA）が継続的に減少しており、通貨の信認が根本的に損なわれるリスクが高い',
      'イギリス（Brexit後のポンド急落）やトルコ（リラ危機）のように、経常赤字の回復見通しが立たない場合、投資家心理の急変（サドンストップ）が起きうる',
      '通貨安→輸入コスト増→経常赤字拡大→さらに通貨安という自己強化的な負のスパイラルに陥るリスク',
      '国債金利の急騰により利払い費が跳ね上がり、財政危機との複合リスクに発展しうる',
    ],
    options: [
      '経常収支の構造的改善（エネルギー自給率向上、輸出産業育成）',
      '対外純資産の防衛（外貨準備の戦略的活用）',
      '財政再建による市場信認の回復',
      '資本流入を促進する投資環境の整備',
      '通貨スワップ協定など国際的なセーフティネットの構築',
    ],
  },
}

/**
 * 警告イベントのアコーディオン表示コンポーネント
 * @param warnings computeWarnings() から返された警告配列
 */
export function WarningAccordion({ warnings }: { warnings: Warning[] }) {
  const [openType, setOpenType] = useState<string | null>(null)
  const warningTypes = new Map<string, { firstYear: number; severity: string }>()
  warnings.forEach(w => {
    if (!warningTypes.has(w.type)) warningTypes.set(w.type, { firstYear: w.year, severity: w.severity || 'normal' })
  })
  const alerts = Array.from(warningTypes.entries())
  const criticalAlerts = alerts.filter(([, v]) => v.severity === 'critical')
  const normalAlerts = alerts.filter(([, v]) => v.severity !== 'critical')
  const sortedAlerts = [...criticalAlerts, ...normalAlerts]

  if (sortedAlerts.length === 0) {
    return <div className="success-box" style={{ marginTop: 12 }}>✓ シミュレーション期間中、重大な財政リスクイベントは検出されませんでした。</div>
  }
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#ef4444' }}>⚠️ 警告イベント（クリックで詳細を表示）</div>
      <div className="warning-timeline">
        {sortedAlerts.map(([type, { firstYear, severity }]) => {
          const count = warnings.filter(w => w.type === type).length
          const firstDetail = warnings.find(w => w.type === type)!.detail
          const isOpen = openType === type
          const details = WARNING_DETAILS[type]
          const isCritical = severity === 'critical'
          return (
            <div key={type}>
              <div
                className={`warning-event${isCritical ? ' warning-critical' : ''}`}
                onClick={() => setOpenType(isOpen ? null : type)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ fontSize: 12, color: isCritical ? '#fff' : '#ef4444', fontWeight: 700, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block', marginRight: 4 }}>▶</span>
                <span className="warning-year">{firstYear}年〜</span>
                <span className="warning-type">{isCritical ? '🚨 ' : ''}{type}</span>
                <span className="warning-detail">{firstDetail}{count > 1 ? `（${count}年間）` : ''}</span>
              </div>
              {isOpen && details && (
                <div style={{ margin: '4px 0 12px 20px', padding: '12px 16px', background: isCritical ? '#450a0a' : '#fef2f2', border: `1px solid ${isCritical ? '#991b1b' : '#fecaca'}`, borderRadius: 8, fontSize: 13, color: isCritical ? '#fecaca' : undefined }}>
                  <div style={{ fontWeight: 700, color: isCritical ? '#fca5a5' : '#991b1b', marginBottom: 6 }}>■ 実生活への影響</div>
                  <ul style={{ paddingLeft: 20, marginBottom: 12, color: isCritical ? '#fde2e2' : '#1e293b' }}>
                    {details.impact.map((item, i) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
                  </ul>
                  <div style={{ fontWeight: 700, color: isCritical ? '#93c5fd' : '#1e40af', marginBottom: 6 }}>■ 政策オプション</div>
                  <ul style={{ paddingLeft: 20, color: isCritical ? '#fde2e2' : '#1e293b' }}>
                    {details.options.map((item, i) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
