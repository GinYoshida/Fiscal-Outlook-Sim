import type { SimParams } from './data'
import type { SimResult } from './simulation'

export interface Warning {
  year: number
  type: string
  detail: string
  severity?: 'normal' | 'critical'
}

const fmt = (n: number, d = 1) => n.toFixed(d)

const MONITORED_FIELDS: { key: keyof SimResult; label: string }[] = [
  { key: 'tax', label: '税収' },
  { key: 'interest', label: '利払い費' },
  { key: 'fiscalBalance', label: '財政収支' },
  { key: 'bojPayment', label: '日銀納付金' },
  { key: 'tradeBalance', label: '貿易収支' },
  { key: 'policyExp', label: '政策経費' },
  { key: 'energySubsidy', label: 'エネルギー補助金' },
  { key: 'dynamicRiskPremium', label: 'リスクプレミアム' },
]

export function computeWarnings(simData: SimResult[], params: SimParams): Warning[] {
  const warnings: Warning[] = []
  let consecutiveRealWageNeg = 0
  let consecutiveFiscalDeficit = 0
  let consecutiveCurrentAccountDeficit = 0

  simData.forEach((d, i) => {
    if (d.interestBurden > 30) {
      warnings.push({ year: d.year, type: '利払負担率30%超過', detail: `利払負担率 ${fmt(d.interestBurden)}%（税収の${fmt(d.interestBurden)}%が利払いに消費）` })
    }
    if (d.currentAccount < 0) {
      consecutiveCurrentAccountDeficit++
      warnings.push({ year: d.year, type: '経常収支の赤字転落', detail: `貿易・所得収支の合計がマイナスに（経常収支 ${fmt(d.currentAccount)}兆円）` })
    } else {
      consecutiveCurrentAccountDeficit = 0
    }
    if (d.bojCumulativeLoss > params.bojCapitalBuffer) {
      warnings.push({ year: d.year, type: '日銀自己資本バッファ超過', detail: `累積損失 ${fmt(d.bojCumulativeLoss)}兆円 > 自己資本バッファ${params.bojCapitalBuffer}兆円` })
    }
    if (d.dynamicRiskPremium > 0) {
      const streakInfo = d.nfaDeteriorationStreak > 0 ? `、加速係数×${(1 + d.nfaDeteriorationStreak * 0.3).toFixed(1)}` : ''
      warnings.push({ year: d.year, type: '通貨リスクプレミアム発動', detail: `経常赤字＋NFA防衛ライン割れ（リスクプレミアム+${fmt(d.dynamicRiskPremium)}%${streakInfo}）` })
    }
    if (d.realWageGrowth < 0) {
      consecutiveRealWageNeg++
    } else {
      consecutiveRealWageNeg = 0
    }
    if (consecutiveRealWageNeg >= 3) {
      warnings.push({ year: d.year, type: '実質賃金3年連続マイナス', detail: `家計の実質購買力が継続的に低下（実質賃金伸び率 ${fmt(d.realWageGrowth)}%）` })
    }
    if (d.fiscalBalance < 0) {
      consecutiveFiscalDeficit++
    } else {
      consecutiveFiscalDeficit = 0
    }
    if (consecutiveFiscalDeficit >= 5) {
      warnings.push({ year: d.year, type: '財政収支の慢性的赤字', detail: `財政赤字が${consecutiveFiscalDeficit}年連続で継続中（${d.year}年度の財政収支: ${fmt(d.fiscalBalance)}兆円）。回復の兆しが見えません` })
    }

    if (i > 0) {
      const prev = simData[i - 1]
      for (const { key, label } of MONITORED_FIELDS) {
        const currVal = d[key] as number
        const prevVal = prev[key] as number
        if (Math.sign(currVal) === Math.sign(prevVal) && currVal !== 0) {
          if (prevVal === 0) {
            warnings.push({
              year: d.year,
              type: '前年比100%超の変化',
              detail: `${label}の変化が大きいです（${fmt(prevVal)}→${fmt(currVal)}、ゼロから発生）。確認してください`,
            })
          } else {
            const changeRate = Math.abs((currVal - prevVal) / prevVal)
            if (changeRate > 1.0) {
              warnings.push({
                year: d.year,
                type: '前年比100%超の変化',
                detail: `${label}の変化が大きいです（${fmt(prevVal)}→${fmt(currVal)}、前年比${fmt(changeRate * 100, 0)}%増）。確認してください`,
              })
            }
          }
        }
      }
    }
  })

  const lastN = 5
  if (simData.length >= lastN) {
    const tail = simData.slice(-lastN)
    const allDeficit = tail.every(d => d.currentAccount < 0)
    const nfaDeclining = tail.every((d, i) => {
      if (i === 0) return true
      return d.nfa < tail[i - 1].nfa
    })

    if (allDeficit && nfaDeclining) {
      const lastYear = simData[simData.length - 1]
      const totalDeficitYears = simData.filter(d => d.currentAccount < 0).length
      warnings.push({
        year: lastYear.year,
        type: '通貨信認リスク（最上級）',
        detail: `経常収支が最終${lastN}年間連続マイナス（計${totalDeficitYears}年間赤字）かつNFAが継続的に減少。通貨の信認が根本的に損なわれるリスクがあります。NFA: ${fmt(lastYear.nfa)}兆円、経常収支: ${fmt(lastYear.currentAccount)}兆円`,
        severity: 'critical',
      })
    }
  }

  return warnings
}
