/**
 * SimulationTab.tsx — シミュレーション結果表示タブ
 *
 * チャート構成概要:
 * - サマリーパネル: 主要指標のメトリクスカード、警告アコーディオン、シナリオ分析、子供の未来レポート
 * - 利払い負担率・財政収支・債務残高: メインの財政指標チャート
 * - 家計への影響: 貧困率・ジニ係数・実質賃金の推移
 * - 家計の実感: モデル家計（年収400万円）の可処分所得・生活費変化
 * - 人的資本・人口動態: 人的資本指数・TFR・社会活力指数
 * - 貿易収支・為替レート: 輸出入・為替の推移
 * - 対外純資産・経常収支: NFA・通貨リスクプレミアム
 * - GDP・企業セクター: 名目GDP・債務GDP比・内部留保
 * - 歳入合計・税収内訳: 税収構成・歳入構成
 * - 予算構成・歳出内訳: 分野別歳出・支出構成比
 * - 日銀収支: 日銀純利益・累積損失・バランスシート
 * - 金利・成長率・リスクプレミアム: 金利比較・財政リスク加算
 * - データ表: 実績+予測の数値テーブル（CSV出力対応）
 */

import { useState, useMemo } from 'react'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, ReferenceLine,
  LineChart, Line, ReferenceArea,
} from 'recharts'
import type { SimResult } from './types'
import type { ActualDataPoint, SimParams } from './types'
import { ACTUAL_DATA, SCENARIOS } from './data'
import { computeWarnings } from './warnings'
import { Collapsible } from './components/Collapsible'
import { ChartTitleWithHelp, ChartSubtitle, NoDataTooltip } from './components/ChartHelp'
import { WarningAccordion } from './components/WarningAccordion'
import { fmt, fillYearGaps } from './utils'

interface Props {
  params: SimParams;
  simData: SimResult[];
  actualData: ActualDataPoint[];
  childAge2026: number;
  scenarioIndex: number;
}

export function SimulationTab({ params, simData, actualData, childAge2026, scenarioIndex }: Props) {
  const [tableView, setTableView] = useState<'5year' | 'full' | 'actual' | 'combined'>('combined')
  const [logScaleHousehold, setLogScaleHousehold] = useState(false)

  const interestBurdenData = useMemo(() => {
    const actual = actualData.map(d => ({ year: d.year, 利払負担率: d.interestBurden }))
    const sim = simData.map(d => ({ year: d.year, 利払負担率: parseFloat(d.interestBurden.toFixed(1)) }))
    return fillYearGaps([...actual, ...sim], params.simYears)
  }, [actualData, simData])

  const fiscalBalanceData = useMemo(() => {
    const actual = actualData.map(d => ({ year: d.year, 財政収支: d.fiscalBalance }))
    const sim = simData.map(d => ({ year: d.year, 財政収支: parseFloat(d.fiscalBalance.toFixed(1)) }))
    return fillYearGaps([...actual, ...sim], params.simYears)
  }, [actualData, simData])

  const debtData = useMemo(() => {
    const actual = actualData.map(d => ({ year: d.year, 債務残高: d.debt }))
    const sim = simData.map(d => ({ year: d.year, 債務残高: Math.round(d.debt) }))
    return fillYearGaps([...actual, ...sim], params.simYears)
  }, [actualData, simData])

  const revenueData = useMemo(() => {
    const actual = actualData.map(d => ({
      year: d.year, 消費税: d.taxConsumption, 所得税: d.taxIncome, 法人税: d.taxCorporate, その他税: d.taxOther,
      利息純収入: d.interest < 0 ? parseFloat(Math.abs(d.interest).toFixed(1)) : 0
    }))
    const sim = simData.map(d => ({
      year: d.year, 消費税: parseFloat(d.taxConsumption.toFixed(1)), 所得税: parseFloat(d.taxIncome.toFixed(1)),
      法人税: parseFloat(d.taxCorporate.toFixed(1)), その他税: parseFloat(d.taxOther.toFixed(1)),
      利息純収入: d.interest < 0 ? parseFloat(Math.abs(d.interest).toFixed(1)) : 0
    }))
    return fillYearGaps([...actual, ...sim], params.simYears)
  }, [actualData, simData])

  const revenueRatioData = useMemo(() => {
    const toRatio = (d: { 消費税: number; 所得税: number; 法人税: number; その他税: number }) => {
      const total = d.消費税 + d.所得税 + d.法人税 + d.その他税
      if (total === 0) return { 消費税: 0, 所得税: 0, 法人税: 0, その他税: 0 }
      return {
        消費税: parseFloat((d.消費税 / total * 100).toFixed(1)),
        所得税: parseFloat((d.所得税 / total * 100).toFixed(1)),
        法人税: parseFloat((d.法人税 / total * 100).toFixed(1)),
        その他税: parseFloat((d.その他税 / total * 100).toFixed(1)),
      }
    }
    const actual = actualData.map(d => ({ year: d.year, ...toRatio({ 消費税: d.taxConsumption, 所得税: d.taxIncome, 法人税: d.taxCorporate, その他税: d.taxOther }) }))
    const sim = simData.map(d => ({ year: d.year, ...toRatio({ 消費税: d.taxConsumption, 所得税: d.taxIncome, 法人税: d.taxCorporate, その他税: d.taxOther }) }))
    return fillYearGaps([...actual, ...sim], params.simYears)
  }, [actualData, simData])

  const expenditureData = useMemo(() => {
    const actual = actualData.map(d => ({ year: d.year, 政策経費: d.policyExp, 利払い費: Math.max(d.interest, 0) }))
    const sim = simData.map(d => ({
      year: d.year, 政策経費: parseFloat(d.policyExp.toFixed(1)), 利払い費: parseFloat(Math.max(d.interest, 0).toFixed(1))
    }))
    return fillYearGaps([...actual, ...sim], params.simYears)
  }, [actualData, simData])

  const expenditureRatioData = useMemo(() => {
    const actual = actualData.map(d => {
      const effectiveInterest = Math.max(d.interest, 0)
      const total = d.policyExp + effectiveInterest
      if (total === 0) return { year: d.year, 政策経費: 0, 利払い費: 0 }
      return { year: d.year, 政策経費: parseFloat((d.policyExp / total * 100).toFixed(1)), 利払い費: parseFloat((effectiveInterest / total * 100).toFixed(1)) }
    })
    const sim = simData.map(d => {
      const effectiveInterest = Math.max(d.interest, 0)
      const total = d.policyExp + effectiveInterest
      if (total === 0) return { year: d.year, 政策経費: 0, 利払い費: 0 }
      return { year: d.year, 政策経費: parseFloat((d.policyExp / total * 100).toFixed(1)), 利払い費: parseFloat((effectiveInterest / total * 100).toFixed(1)) }
    })
    return fillYearGaps([...actual, ...sim], params.simYears)
  }, [actualData, simData])

  const expBreakdownData = useMemo(() => {
    const sim = simData.map(d => ({
      year: d.year,
      社会保障: parseFloat(d.socialSecurity.toFixed(1)),
      子育て支援: parseFloat(d.childcare.toFixed(1)),
      地方交付税: parseFloat(d.localGovTransfer.toFixed(1)),
      防衛: parseFloat(d.defense.toFixed(1)),
      その他政策: parseFloat(d.otherPolicyExp.toFixed(1)),
      エネルギー補助金: parseFloat(d.energySubsidy.toFixed(1)),
      利払い費: parseFloat(Math.max(d.interest, 0).toFixed(1)),
    }))
    return fillYearGaps(sim, params.simYears)
  }, [simData])

  const budgetCompositionData = useMemo(() => {
    const sim = simData.map(d => ({
      year: d.year,
      税収: parseFloat(d.revenueTaxRatio.toFixed(1)),
      公債金: parseFloat(d.revenueBondRatio.toFixed(1)),
      その他収入: parseFloat(d.revenueOtherRatio.toFixed(1)),
    }))
    return fillYearGaps(sim, params.simYears)
  }, [simData])

  const bojData = useMemo(() => {
    const actual = actualData.map(d => ({ year: d.year, '日銀純利益': (d.bojNetIncome !== undefined ? d.bojNetIncome : d.bojPayment) as number | null, '統合政府への反映額': d.bojPayment as number | null, '累積損失': null as number | null }))
    const sim = simData.map(d => ({
      year: d.year,
      '日銀純利益': parseFloat(d.bojNetIncome.toFixed(1)),
      '統合政府への反映額': parseFloat(d.bojPayment.toFixed(1)),
      '累積損失': parseFloat((-d.bojCumulativeLoss).toFixed(1)),
    }))
    return fillYearGaps([...actual, ...sim], params.simYears)
  }, [actualData, simData])

  const bojBSData = useMemo(() => {
    const actual = actualData.filter(d => d.bojJGB !== undefined).map(d => ({
      year: d.year,
      '保有国債': d.bojJGB!,
      '当座預金': d.bojCA!,
      '保有利回り': d.bojYield!,
    }))
    const sim = simData.map(d => ({
      year: d.year,
      '保有国債': parseFloat(d.bojJGB.toFixed(0)),
      '当座預金': parseFloat(d.bojCAActual.toFixed(0)),
      '保有利回り': parseFloat(d.bojYieldActual.toFixed(2)),
    }))
    return fillYearGaps([...actual, ...sim], params.simYears)
  }, [actualData, simData])

  const rateData = useMemo(() => {
    const nominalG = params.inflationRate + params.realGrowth
    const sim = simData.map(d => ({
      year: d.year,
      平均クーポン: parseFloat(d.avgCoupon.toFixed(2)),
      実効市場金利: parseFloat(d.effectiveMarketRate.toFixed(2)),
      名目成長率: parseFloat(nominalG.toFixed(2)),
      財政リスク加算: parseFloat(d.fiscalRiskPremium.toFixed(2)),
      日銀保有利回り: parseFloat(d.bojYieldActual.toFixed(2)),
    }))
    return fillYearGaps(sim, params.simYears)
  }, [params, simData])

  const householdData = useMemo(() => {
    const actual = actualData.map(d => ({
      year: d.year,
      貧困率: parseFloat(d.povertyRate.toFixed(1)),
      ジニ係数: parseFloat((d.giniIndex * 100).toFixed(1)),
      実質賃金伸び率: d.realWageGrowth as number | null,
    }))
    const sim = simData.map(d => ({
      year: d.year,
      貧困率: parseFloat(d.povertyRate.toFixed(1)),
      ジニ係数: parseFloat((d.giniIndex * 100).toFixed(1)),
      実質賃金伸び率: parseFloat(d.realWageGrowth.toFixed(1)) as number | null,
    }))
    return fillYearGaps([...actual, ...sim], params.simYears)
  }, [actualData, simData])

  const modelHouseholdData = useMemo(() => {
    const sim = simData.map(d => ({
      year: d.year,
      可処分所得変化: parseFloat(d.modelDisposableChange.toFixed(1)),
      食費増加: parseFloat(d.modelFoodCostChange.toFixed(1)),
      光熱費増加: parseFloat(d.modelEnergyCostChange.toFixed(1)),
    }))
    return fillYearGaps(sim, params.simYears)
  }, [simData])

  const disposableHasNonPositive = useMemo(() => {
    return modelHouseholdData.some(d =>
      (d.可処分所得変化 !== null && d.可処分所得変化 <= 0)
    )
  }, [modelHouseholdData])

  const costHasNonPositive = useMemo(() => {
    return modelHouseholdData.some(d =>
      (d.食費増加 !== null && d.食費増加 <= 0) ||
      (d.光熱費増加 !== null && d.光熱費増加 <= 0)
    )
  }, [modelHouseholdData])

  const incomeRatioData = useMemo(() => {
    const actual = actualData.map(d => ({
      year: d.year,
      所得格差倍率: parseFloat(((1 + d.giniIndex) / (1 - d.giniIndex)).toFixed(2)),
      ジニ係数: parseFloat(d.giniIndex.toFixed(3)),
    }))
    const sim = simData.map(d => ({
      year: d.year,
      所得格差倍率: parseFloat(d.incomeRatio.toFixed(2)),
      ジニ係数: parseFloat(d.giniIndex.toFixed(3)),
    }))
    return fillYearGaps([...actual, ...sim], params.simYears)
  }, [actualData, simData])

  const modelSummaryData = useMemo(() => {
    const sim = simData.map(d => ({
      year: d.year,
      名目年収: parseFloat(d.modelIncome.toFixed(0)),
      可処分所得: parseFloat(d.modelDisposable.toFixed(0)),
      食費: parseFloat(d.modelFoodCost.toFixed(0)),
      光熱費: parseFloat(d.modelEnergyCost.toFixed(0)),
    }))
    return fillYearGaps(sim, params.simYears)
  }, [simData])

  const tradeData = useMemo(() => {
    const actual = actualData.map(d => ({
      year: d.year,
      輸出: parseFloat(d.exportAmount.toFixed(1)),
      輸入: parseFloat(d.importAmount.toFixed(1)),
      貿易収支: parseFloat(d.tradeBalance.toFixed(1)),
    }))
    const sim = simData.map(d => ({
      year: d.year,
      輸出: parseFloat(d.exportAmount.toFixed(1)),
      輸入: parseFloat(d.importAmount.toFixed(1)),
      貿易収支: parseFloat(d.tradeBalance.toFixed(1)),
    }))
    return fillYearGaps([...actual, ...sim], params.simYears)
  }, [actualData, simData])

  const fxData = useMemo(() => {
    const actual = actualData.map(d => ({
      year: d.year,
      為替レート: parseFloat(d.exchangeRate.toFixed(0)),
    }))
    const sim = simData.map(d => ({
      year: d.year,
      為替レート: parseFloat(d.exchangeRate.toFixed(0)),
    }))
    return fillYearGaps([...actual, ...sim], params.simYears)
  }, [actualData, simData])

  const nfaData = useMemo(() => {
    const actual = actualData.map(d => ({
      year: d.year,
      対外純資産: d.nfa,
      経常収支: d.currentAccount,
      通貨リスク加算: null as number | null,
    }))
    const sim = simData.map(d => ({
      year: d.year,
      対外純資産: parseFloat(d.nfa.toFixed(0)),
      経常収支: parseFloat(d.currentAccount.toFixed(1)),
      通貨リスク加算: parseFloat(d.dynamicRiskPremium.toFixed(1)),
    }))
    return fillYearGaps([...actual, ...sim], params.simYears)
  }, [actualData, simData])

  const gdpData = useMemo(() => {
    const actual = actualData.filter(d => d.nominalGDP !== undefined).map(d => ({
      year: d.year,
      名目GDP: parseFloat((d.nominalGDP! / 1).toFixed(0)),
      債務GDP比: null as number | null,
      内部留保GDP比: null as number | null,
    }))
    const sim = simData.map(d => ({
      year: d.year,
      名目GDP: parseFloat(d.nominalGDP.toFixed(0)),
      債務GDP比: parseFloat(d.debtToGDP.toFixed(1)),
      内部留保GDP比: parseFloat(d.retainedToGDP.toFixed(1)),
    }))
    return fillYearGaps([...actual, ...sim], params.simYears)
  }, [actualData, simData])

  const humanCapitalData = useMemo(() => {
    return simData.map(d => ({
      year: d.year,
      人的資本指数: parseFloat(d.humanCapitalIndex.toFixed(1)),
      労働力指数: parseFloat(d.laborForceIndex.toFixed(1)),
    }))
  }, [simData])

  const tfrData = useMemo(() => {
    return simData.map((d, i) => {
      const recentWageGrowths: number[] = []
      for (let w = Math.max(0, i - 3); w < i; w++) {
        recentWageGrowths.push(simData[w].realWageGrowth)
      }
      const avgRecentWage = recentWageGrowths.length > 0
        ? recentWageGrowths.reduce((a, b) => a + b, 0) / recentWageGrowths.length / 100
        : 0
      const currentGini = i === 0 ? params.initGini : simData[i - 1].giniIndex
      const childcareGDPPct = i === 0
        ? (params.initChildcare / params.initNominalGDP) * 100
        : (simData[i - 1].childcare / simData[i - 1].nominalGDP) * 100

      const wageEffect = 0.08 * avgRecentWage * 3 * params.tfrSensitivity
      const inequalityEffect = 1.5 * (params.initGini - currentGini) * params.tfrSensitivity
      const childcareEffect = 0.15 * (childcareGDPPct - 0.81) * params.tfrSensitivity

      return {
        year: d.year,
        TFR: parseFloat(d.tfr.toFixed(3)),
        賃金効果: parseFloat(wageEffect.toFixed(4)),
        格差効果: parseFloat(inequalityEffect.toFixed(4)),
        子育て支援効果: parseFloat(childcareEffect.toFixed(4)),
      }
    })
  }, [simData, params])

  const socialVitalityData = useMemo(() => {
    return simData.map(d => ({
      year: d.year,
      社会活力指数: parseFloat(d.socialVitalityIndex.toFixed(1)),
    }))
  }, [simData])

  const summaryWarnings = useMemo(() => computeWarnings(simData, params), [simData, params])

  const summaryStats = useMemo(() => {
    const last = simData[simData.length - 1]
    const first = simData[0]
    const interestBurdenExceedYear = simData.find(d => d.interestBurden > 30)?.year
    const currentAccountDeficitYear = simData.find(d => d.currentAccount < 0)?.year
    const bojInsolvencyYear = simData.find(d => d.bojCumulativeLoss > params.bojCapitalBuffer)?.year
    const currencycrisisYear = simData.find(d => d.dynamicRiskPremium > 0)?.year
    let consecutiveNeg = 0
    let realWage3YearNegYear: number | undefined
    for (const d of simData) {
      if (d.realWageGrowth < 0) { consecutiveNeg++ } else { consecutiveNeg = 0 }
      if (consecutiveNeg >= 3 && !realWage3YearNegYear) { realWage3YearNegYear = d.year; break }
    }

    const initCoupon = params.initAvgCoupon
    const couponDouble = simData.find(d => d.avgCoupon >= initCoupon * 2)?.year
    const couponTriple = simData.find(d => d.avgCoupon >= initCoupon * 3)?.year

    const nfaDepletionYear = simData.find(d => d.nfa <= 0)?.year
    const persistentCADeficit = (() => {
      let count = 0
      for (const d of simData) {
        if (d.currentAccount < 0) { count++ } else { count = 0 }
        if (count >= 3) return d.year
      }
      return undefined
    })()

    let rwConsecutiveNeg = 0
    const realWageLongStag: { start?: number; end?: number } = {}
    for (const d of simData) {
      if (d.realWageGrowth < 0) {
        if (rwConsecutiveNeg === 0) realWageLongStag.start = d.year
        rwConsecutiveNeg++
        realWageLongStag.end = d.year
      } else {
        if (rwConsecutiveNeg >= 3) break
        rwConsecutiveNeg = 0
      }
    }
    if (rwConsecutiveNeg < 3) {
      realWageLongStag.start = undefined
      realWageLongStag.end = undefined
    }

    return {
      last, first,
      interestBurdenExceedYear, currentAccountDeficitYear,
      bojInsolvencyYear, currencycrisisYear, realWage3YearNegYear,
      couponDouble, couponTriple, nfaDepletionYear, persistentCADeficit,
      realWageLongStag,
    }
  }, [simData, params])

  const childAlerts = useMemo(() => {
    if (!simData.length) return null
    const first = simData[0]
    const last = simData[simData.length - 1]
    const initInterestBurden = first.interestBurden
    const finalInterestBurden = last.interestBurden
    const displacementScore = finalInterestBurden - initInterestBurden

    const simYears = params.simYears || 30
    const lastSimYear = 2026 + simYears - 1
    const childAgeAtEnd = childAge2026 + simYears - 1
    const childAt20Year = 2026 + (20 - childAge2026)
    const childAt30Year = 2026 + (30 - childAge2026)

    const dataAt20 = childAt20Year >= 2026 && childAt20Year <= lastSimYear ? simData.find(d => d.year === childAt20Year) : undefined
    const dataAt30 = childAt30Year >= 2026 && childAt30Year <= lastSimYear ? simData.find(d => d.year === childAt30Year) : undefined

    return { displacementScore, childAgeAtEnd, dataAt20, dataAt30, childAt20Year, childAt30Year, finalInterestBurden, initInterestBurden }
  }, [simData, childAge2026])

  const tableData = useMemo(() => {
    if (tableView === 'actual') {
      return buildActualTable()
    }
    if (tableView === 'combined') {
      return buildCombinedTable(params)
    }
    const years = tableView === '5year'
      ? simData.filter((_, i) => i % 5 === 0 || i === simData.length - 1)
      : simData
    return buildSimTable(years, params)
  }, [tableView, simData, actualData, params])

  function buildActualTable() {
    const data = ACTUAL_DATA
    const years = data.map(d => d.year)
    const rows: { label: string; values: string[]; indent?: number; isActual?: boolean }[] = [
      { label: '歳入合計', values: data.map(d => fmt(d.totalRevenue)) },
      { label: '├ 税収合計', values: data.map(d => fmt(d.tax)), indent: 1 },
      { label: '│　├ 消費税', values: data.map(d => fmt(d.taxConsumption)), indent: 2 },
      { label: '│　├ 所得税', values: data.map(d => fmt(d.taxIncome)), indent: 2 },
      { label: '│　├ 法人税', values: data.map(d => fmt(d.taxCorporate)), indent: 2 },
      { label: '│　└ その他税', values: data.map(d => fmt(d.taxOther)), indent: 2 },
      { label: '├ 日銀納付金', values: data.map(d => fmt(d.bojPayment)), indent: 1 },
      { label: '│  └ 日銀純利益', values: data.map(d => d.bojNetIncome !== undefined ? fmt(d.bojNetIncome) : '―'), indent: 2 },
      { label: '│  └ 保有国債', values: data.map(d => d.bojJGB !== undefined ? fmt(d.bojJGB, 0) : '―'), indent: 2 },
      { label: '│  └ 当座預金', values: data.map(d => d.bojCA !== undefined ? fmt(d.bojCA, 0) : '―'), indent: 2 },
      { label: '│  └ 保有利回り', values: data.map(d => d.bojYield !== undefined ? fmt(d.bojYield, 2) + '%' : '―'), indent: 2 },
      { label: '└ その他収入', values: data.map(d => d.otherRevenue !== undefined ? fmt(d.otherRevenue) : fmt(d.totalRevenue - d.tax - d.bojPayment)), indent: 1 },
      { label: '─', values: years.map(() => '') },
      { label: '支出合計', values: data.map(d => fmt(d.totalCost)) },
      { label: '├ 政策経費', values: data.map(d => fmt(d.policyExp)), indent: 1 },
      { label: '│　├ 社会保障', values: data.map(d => d.socialSecurity !== undefined ? fmt(d.socialSecurity) : '―'), indent: 2 },
      { label: '│　├ 子育て支援', values: data.map(d => d.childcare !== undefined ? fmt(d.childcare) : '―'), indent: 2 },
      { label: '│　├ 地方交付税', values: data.map(d => d.localGovTransfer !== undefined ? fmt(d.localGovTransfer) : '―'), indent: 2 },
      { label: '│　├ 防衛', values: data.map(d => d.defense !== undefined ? fmt(d.defense) : '―'), indent: 2 },
      { label: '│　└ その他政策', values: data.map(d => d.otherPolicyExp !== undefined ? fmt(d.otherPolicyExp) : '―'), indent: 2 },
      { label: '└ 利払い費', values: data.map(d => fmt(d.interest)), indent: 1 },
      { label: '─', values: years.map(() => '') },
      { label: '財政収支', values: data.map(d => fmt(d.fiscalBalance)) },
      { label: '国債発行額', values: data.map(d => d.bondIssuance !== undefined ? fmt(d.bondIssuance) : '―') },
      { label: '債務残高', values: data.map(d => fmt(d.debt, 0)) },
      { label: '利払負担率 (%)', values: data.map(d => fmt(d.interestBurden)) },
      { label: '平均クーポン (%)', values: data.map(d => fmt(d.avgCoupon)) },
      { label: '─', values: years.map(() => '') },
      { label: '為替レート (円/$)', values: data.map(d => fmt(d.exchangeRate, 0)) },
      { label: '貿易収支 (兆円)', values: data.map(d => fmt(d.tradeBalance)) },
      { label: '├ 輸出', values: data.map(d => fmt(d.exportAmount)), indent: 1 },
      { label: '└ 輸入', values: data.map(d => fmt(d.importAmount)), indent: 1 },
      { label: '経常収支 (兆円)', values: data.map(d => fmt(d.currentAccount)) },
      { label: '対外純資産 (兆円)', values: data.map(d => fmt(d.nfa, 0)) },
      { label: '─', values: years.map(() => '') },
      { label: '貧困率 (%)', values: data.map(d => fmt(d.povertyRate)) },
      { label: 'ジニ係数', values: data.map(d => fmt(d.giniIndex, 3)) },
      { label: '実質賃金伸び率 (%)', values: data.map(d => fmt(d.realWageGrowth)) },
    ]
    return { years, rows, actualYearCount: 0 }
  }

  function buildCombinedTable(p: SimParams) {
    const aData = ACTUAL_DATA
    const sFiltered = simData
    const years = [...aData.map(d => d.year), ...sFiltered.map(d => d.year)]
    const actualCount = aData.length
    const rows: { label: string; values: string[]; indent?: number }[] = [
      { label: '歳入合計', values: [...aData.map(d => fmt(d.totalRevenue)), ...sFiltered.map(d => fmt(d.totalRevenue))] },
      { label: '├ 税収合計', values: [...aData.map(d => fmt(d.tax)), ...sFiltered.map(d => fmt(d.tax))], indent: 1 },
      { label: '│　├ 消費税', values: [...aData.map(d => fmt(d.taxConsumption)), ...sFiltered.map(d => fmt(d.taxConsumption))], indent: 2 },
      { label: '│　├ 所得税', values: [...aData.map(d => fmt(d.taxIncome)), ...sFiltered.map(d => fmt(d.taxIncome))], indent: 2 },
      { label: '│　├ 法人税', values: [...aData.map(d => fmt(d.taxCorporate)), ...sFiltered.map(d => fmt(d.taxCorporate))], indent: 2 },
      { label: '│　└ その他税', values: [...aData.map(d => fmt(d.taxOther)), ...sFiltered.map(d => fmt(d.taxOther))], indent: 2 },
      { label: '├ 日銀納付金', values: [...aData.map(d => fmt(d.bojPayment)), ...sFiltered.map(d => fmt(d.bojPayment))], indent: 1 },
      { label: '│  └ 日銀純利益', values: [...aData.map(d => d.bojNetIncome !== undefined ? fmt(d.bojNetIncome) : '―'), ...sFiltered.map(d => fmt(d.bojNetIncome))], indent: 2 },
      { label: '│  └ 累積損失', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.bojCumulativeLoss))], indent: 2 },
      { label: '│  └ 保有国債', values: [...aData.map(d => d.bojJGB !== undefined ? fmt(d.bojJGB, 0) : '―'), ...sFiltered.map(d => fmt(d.bojJGB, 0))], indent: 2 },
      { label: '│  └ 当座預金', values: [...aData.map(d => d.bojCA !== undefined ? fmt(d.bojCA, 0) : '―'), ...sFiltered.map(d => fmt(d.bojCAActual, 0))], indent: 2 },
      { label: '│  └ 保有利回り', values: [...aData.map(d => d.bojYield !== undefined ? fmt(d.bojYield, 2) + '%' : '―'), ...sFiltered.map(d => fmt(d.bojYieldActual, 2) + '%')], indent: 2 },
      { label: '└ その他収入', values: [...aData.map(d => d.otherRevenue !== undefined ? fmt(d.otherRevenue) : fmt(d.totalRevenue - d.tax - d.bojPayment)), ...sFiltered.map(d => fmt(d.otherRevStamp + d.otherRevGov + d.otherRevAsset + d.otherRevMisc))], indent: 1 },
      { label: '─', values: years.map(() => '') },
      { label: '支出合計', values: [...aData.map(d => fmt(d.totalCost)), ...sFiltered.map(d => fmt(d.totalCost))] },
      { label: '├ 政策経費', values: [...aData.map(d => fmt(d.policyExp)), ...sFiltered.map(d => fmt(d.policyExp))], indent: 1 },
      { label: '│　├ 社会保障', values: [...aData.map(d => d.socialSecurity !== undefined ? fmt(d.socialSecurity) : '―'), ...sFiltered.map(d => fmt(d.socialSecurity))], indent: 2 },
      { label: '│　├ 子育て支援', values: [...aData.map(d => d.childcare !== undefined ? fmt(d.childcare) : '―'), ...sFiltered.map(d => fmt(d.childcare))], indent: 2 },
      { label: '│　├ 地方交付税', values: [...aData.map(d => d.localGovTransfer !== undefined ? fmt(d.localGovTransfer) : '―'), ...sFiltered.map(d => fmt(d.localGovTransfer))], indent: 2 },
      { label: '│　├ 防衛', values: [...aData.map(d => d.defense !== undefined ? fmt(d.defense) : '―'), ...sFiltered.map(d => fmt(d.defense))], indent: 2 },
      { label: '│　├ その他政策', values: [...aData.map(d => d.otherPolicyExp !== undefined ? fmt(d.otherPolicyExp) : '―'), ...sFiltered.map(d => fmt(d.otherPolicyExp))], indent: 2 },
      { label: '│　└ エネルギー補助金', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.energySubsidy))], indent: 2 },
      { label: '└ 利払い費', values: [...aData.map(d => fmt(d.interest)), ...sFiltered.map(d => fmt(d.interest))], indent: 1 },
      { label: '─', values: years.map(() => '') },
      { label: '財政収支', values: [...aData.map(d => fmt(d.fiscalBalance)), ...sFiltered.map(d => fmt(d.fiscalBalance))] },
      { label: '国債発行額（公債金）', values: [...aData.map(d => d.bondIssuance !== undefined ? fmt(d.bondIssuance) : '―'), ...sFiltered.map(d => fmt(d.bondIssuance))] },
      { label: '公債金依存度 (%)', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.revenueBondRatio))] },
      { label: '債務残高', values: [...aData.map(d => fmt(d.debt, 0)), ...sFiltered.map(d => fmt(d.debt, 0))] },
      { label: '利払負担率 (%)', values: [...aData.map(d => fmt(d.interestBurden)), ...sFiltered.map(d => fmt(d.interestBurden))] },
      { label: '実質政策経費指数', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.realPolicyExpIndex))] },
      { label: '財政リスク加算 (%)', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.fiscalRiskPremium))] },
      { label: '─', values: years.map(() => '') },
      { label: '名目GDP (兆円)', values: [...aData.map(d => d.nominalGDP !== undefined ? fmt(d.nominalGDP, 0) : '―'), ...sFiltered.map(d => fmt(d.nominalGDP, 0))] },
      { label: '債務GDP比 (%)', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.debtToGDP))] },
      { label: '内生賃金上昇率 (%)', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.endogenousWage))] },
      { label: '内部留保GDP比 (%)', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.retainedToGDP))] },
      { label: '─', values: years.map(() => '') },
      { label: '為替レート (円/$)', values: [...aData.map(d => fmt(d.exchangeRate, 0)), ...sFiltered.map(d => fmt(d.exchangeRate, 0))] },
      { label: '貿易収支 (兆円)', values: [...aData.map(d => fmt(d.tradeBalance)), ...sFiltered.map(d => fmt(d.tradeBalance))] },
      { label: '├ 輸出', values: [...aData.map(d => fmt(d.exportAmount)), ...sFiltered.map(d => fmt(d.exportAmount))], indent: 1 },
      { label: '└ 輸入', values: [...aData.map(d => fmt(d.importAmount)), ...sFiltered.map(d => fmt(d.importAmount))], indent: 1 },
      { label: '経常収支 (兆円)', values: [...aData.map(d => fmt(d.currentAccount)), ...sFiltered.map(d => fmt(d.currentAccount))] },
      { label: '対外純資産 (兆円)', values: [...aData.map(d => fmt(d.nfa, 0)), ...sFiltered.map(d => fmt(d.nfa, 0))] },
      { label: '通貨リスク加算 (%)', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.dynamicRiskPremium))] },
      { label: '─', values: years.map(() => '') },
      { label: '貧困率 (%)', values: [...aData.map(d => fmt(d.povertyRate)), ...sFiltered.map(d => fmt(d.povertyRate))] },
      { label: 'ジニ係数', values: [...aData.map(d => fmt(d.giniIndex, 3)), ...sFiltered.map(d => fmt(d.giniIndex, 3))] },
      { label: '所得格差倍率', values: [...aData.map(d => fmt(((1+d.giniIndex)/(1-d.giniIndex)), 2) + '倍'), ...sFiltered.map(d => fmt(d.incomeRatio, 2) + '倍')] },
      { label: '実質賃金伸び率 (%)', values: [...aData.map(d => fmt(d.realWageGrowth)), ...sFiltered.map(d => fmt(d.realWageGrowth))] },
      { label: '─', values: years.map(() => '') },
      { label: 'モデル家計 (万円)', values: years.map(() => '') },
      { label: '├ 名目年収', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.modelIncome, 0))] },
      { label: '├ 可処分所得', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.modelDisposable, 0))] },
      { label: '├ 食費', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.modelFoodCost, 0))] },
      { label: '└ 光熱費', values: [...aData.map(() => '―'), ...sFiltered.map(d => fmt(d.modelEnergyCost, 0))] },
    ]
    return { years, rows, actualYearCount: actualCount }
  }

  function buildSimTable(data: SimResult[], _p: SimParams) {
    const years = data.map(d => d.year)
    const rows: { label: string; values: string[]; indent?: number }[] = [
      { label: '歳入合計', values: data.map(d => fmt(d.totalRevenue)) },
      { label: '├ 税収合計', values: data.map(d => fmt(d.tax)), indent: 1 },
      { label: '│　├ 消費税', values: data.map(d => fmt(d.taxConsumption)), indent: 2 },
      { label: '│　├ 所得税', values: data.map(d => fmt(d.taxIncome)), indent: 2 },
      { label: '│　├ 法人税', values: data.map(d => fmt(d.taxCorporate)), indent: 2 },
      { label: '│　└ その他税', values: data.map(d => fmt(d.taxOther)), indent: 2 },
      { label: '├ 日銀納付金', values: data.map(d => fmt(d.bojPayment)), indent: 1 },
      { label: '│  └ 日銀純利益', values: data.map(d => fmt(d.bojNetIncome)), indent: 2 },
      { label: '│  └ 累積損失', values: data.map(d => fmt(d.bojCumulativeLoss)), indent: 2 },
      { label: '│  └ 保有国債', values: data.map(d => fmt(d.bojJGB, 0)), indent: 2 },
      { label: '│  └ 当座預金', values: data.map(d => fmt(d.bojCAActual, 0)), indent: 2 },
      { label: '│  └ 保有利回り', values: data.map(d => fmt(d.bojYieldActual, 2) + '%'), indent: 2 },
      { label: '└ その他収入', values: data.map(d => fmt(d.otherRevStamp + d.otherRevGov + d.otherRevAsset + d.otherRevMisc)), indent: 1 },
      { label: '　　├ 印紙収入', values: data.map(d => fmt(d.otherRevStamp)), indent: 2 },
      { label: '　　├ 官業収入', values: data.map(d => fmt(d.otherRevGov)), indent: 2 },
      { label: '　　├ 資産売却', values: data.map(d => fmt(d.otherRevAsset)), indent: 2 },
      { label: '　　└ 雑収入', values: data.map(d => fmt(d.otherRevMisc)), indent: 2 },
      { label: '─', values: years.map(() => '') },
      { label: '支出合計', values: data.map(d => fmt(d.totalCost)) },
      { label: '├ 政策経費', values: data.map(d => fmt(d.policyExp)), indent: 1 },
      { label: '│　├ 社会保障', values: data.map(d => fmt(d.socialSecurity)), indent: 2 },
      { label: '│　├ 子育て支援', values: data.map(d => fmt(d.childcare)), indent: 2 },
      { label: '│　├ 地方交付税', values: data.map(d => fmt(d.localGovTransfer)), indent: 2 },
      { label: '│　├ 防衛', values: data.map(d => fmt(d.defense)), indent: 2 },
      { label: '│　├ その他政策', values: data.map(d => fmt(d.otherPolicyExp)), indent: 2 },
      { label: '│　└ エネルギー補助金', values: data.map(d => fmt(d.energySubsidy)), indent: 2 },
      { label: '└ 利払い費', values: data.map(d => fmt(d.interest)), indent: 1 },
      { label: '　　├ 債務残高', values: data.map(d => fmt(d.debt, 0)), indent: 2 },
      { label: '　　└ 平均クーポン', values: data.map(d => fmt(d.avgCoupon, 2) + '%'), indent: 2 },
      { label: '─', values: years.map(() => '') },
      { label: '財政収支', values: data.map(d => fmt(d.fiscalBalance)) },
      { label: '国債発行額（公債金）', values: data.map(d => fmt(d.bondIssuance)) },
      { label: '公債金依存度 (%)', values: data.map(d => fmt(d.revenueBondRatio)) },
      { label: '債務残高', values: data.map(d => fmt(d.debt, 0)) },
      { label: '利払負担率 (%)', values: data.map(d => fmt(d.interestBurden)) },
      { label: '実質政策経費指数', values: data.map(d => fmt(d.realPolicyExpIndex)) },
      { label: '財政リスク加算 (%)', values: data.map(d => fmt(d.fiscalRiskPremium)) },
      { label: '─', values: years.map(() => '') },
      { label: '名目GDP (兆円)', values: data.map(d => fmt(d.nominalGDP, 0)) },
      { label: '債務GDP比 (%)', values: data.map(d => fmt(d.debtToGDP)) },
      { label: '内生賃金上昇率 (%)', values: data.map(d => fmt(d.endogenousWage)) },
      { label: '企業利益 (兆円)', values: data.map(d => fmt(d.corporateProfit)) },
      { label: '内部留保累計 (兆円)', values: data.map(d => fmt(d.retainedEarnings, 0)) },
      { label: '内部留保GDP比 (%)', values: data.map(d => fmt(d.retainedToGDP)) },
      { label: '─', values: years.map(() => '') },
      { label: '為替レート (円/$)', values: data.map(d => fmt(d.exchangeRate, 0)) },
      { label: '貿易収支 (兆円)', values: data.map(d => fmt(d.tradeBalance)) },
      { label: '├ 輸出', values: data.map(d => fmt(d.exportAmount)), indent: 1 },
      { label: '└ 輸入', values: data.map(d => fmt(d.importAmount)), indent: 1 },
      { label: '経常収支 (兆円)', values: data.map(d => fmt(d.currentAccount)) },
      { label: '対外純資産 (兆円)', values: data.map(d => fmt(d.nfa, 0)) },
      { label: '通貨リスク加算 (%)', values: data.map(d => fmt(d.dynamicRiskPremium)) },
      { label: '実効市場金利 (%)', values: data.map(d => fmt(d.effectiveMarketRate)) },
      { label: '─', values: years.map(() => '') },
      { label: '貧困率 (%)', values: data.map(d => fmt(d.povertyRate)) },
      { label: 'ジニ係数', values: data.map(d => fmt(d.giniIndex, 3)) },
      { label: '所得格差倍率', values: data.map(d => fmt(d.incomeRatio, 2) + '倍') },
      { label: '実質賃金伸び率 (%)', values: data.map(d => fmt(d.realWageGrowth)) },
      { label: '─', values: years.map(() => '') },
      { label: 'モデル家計 (万円)', values: years.map(() => '') },
      { label: '├ 名目年収', values: data.map(d => fmt(d.modelIncome, 0)), indent: 1 },
      { label: '├ 可処分所得', values: data.map(d => fmt(d.modelDisposable, 0)), indent: 1 },
      { label: '├ 食費', values: data.map(d => fmt(d.modelFoodCost, 0)), indent: 1 },
      { label: '└ 光熱費', values: data.map(d => fmt(d.modelEnergyCost, 0)), indent: 1 },
    ]
    return { years, rows, actualYearCount: 0 }
  }

  function escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  function downloadCSV(data: { years: number[]; rows: { label: string; values: string[]; indent?: number }[] }) {
    const header = ['項目', ...data.years.map(String)]
    const csvRows = [header.map(escapeCsvField).join(',')]
    for (const row of data.rows) {
      if (row.label === '─') continue
      const label = row.label.replace(/[├│└─　]/g, '').trim()
      const values = row.values.map(v => escapeCsvField(v))
      csvRows.push([escapeCsvField(label), ...values].join(','))
    }
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const viewLabel = tableView === 'combined' ? '実績予測' : tableView === '5year' ? '予測5年' : tableView === 'full' ? `予測全${params.simYears || 30}年` : '実績'
    a.download = `財政シミュレーション_${viewLabel}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="summary-panel">
        <div className="summary-title">{params.simYears || 30}年シミュレーション・サマリー</div>
        <div className="responsive-grid-4col">
          <div className="metric-card">
            <div className="metric-label">{2025 + (params.simYears || 30)}年 債務残高</div>
            <div className="metric-value">{summaryStats.last ? `${Math.round(summaryStats.last.debt).toLocaleString()}兆円` : '―'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">{2025 + (params.simYears || 30)}年 利払負担率</div>
            <div className="metric-value" style={{ color: (summaryStats.last?.interestBurden ?? 0) > 30 ? '#ef4444' : '#22c55e' }}>
              {summaryStats.last ? `${summaryStats.last.interestBurden.toFixed(1)}%` : '―'}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">{2025 + (params.simYears || 30)}年 対外純資産</div>
            <div className="metric-value" style={{ color: (summaryStats.last?.nfa ?? 0) < params.nfaThreshold ? '#ef4444' : '#22c55e' }}>
              {summaryStats.last ? `${Math.round(summaryStats.last.nfa).toLocaleString()}兆円` : '―'}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">{2025 + (params.simYears || 30)}年 貧困率</div>
            <div className="metric-value" style={{ color: (summaryStats.last?.povertyRate ?? 0) > 20 ? '#ef4444' : '#f97316' }}>
              {summaryStats.last ? `${summaryStats.last.povertyRate.toFixed(1)}%` : '―'}
            </div>
          </div>
        </div>
        <div className="responsive-grid-4col" style={{ marginTop: 8 }}>
          <div className="metric-card">
            <div className="metric-label">最終年 人的資本指数</div>
            <div className="metric-value" style={{ color: (summaryStats.last?.humanCapitalIndex ?? 100) >= 100 ? '#22c55e' : '#ef4444' }}>
              {summaryStats.last ? summaryStats.last.humanCapitalIndex.toFixed(1) : '―'}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">最終年 TFR</div>
            <div className="metric-value" style={{ color: (summaryStats.last?.tfr ?? 1.2) >= 1.5 ? '#22c55e' : (summaryStats.last?.tfr ?? 1.2) >= 1.2 ? '#f59e0b' : '#ef4444' }}>
              {summaryStats.last ? summaryStats.last.tfr.toFixed(2) : '―'}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">最終年 社会活力指数</div>
            <div className="metric-value" style={{ color: (summaryStats.last?.socialVitalityIndex ?? 100) >= 120 ? '#22c55e' : (summaryStats.last?.socialVitalityIndex ?? 100) >= 80 ? '#f59e0b' : '#ef4444' }}>
              {summaryStats.last ? `${summaryStats.last.socialVitalityIndex.toFixed(1)}` : '―'}
              {summaryStats.last && (
                <span style={{ fontSize: 12, marginLeft: 4 }}>
                  {summaryStats.last.socialVitalityIndex >= 120 ? '（好循環）' : summaryStats.last.socialVitalityIndex >= 80 ? '（中立）' : '（悪循環）'}
                </span>
              )}
            </div>
          </div>
        </div>

        <WarningAccordion warnings={summaryWarnings} />

        <div className="scenario-analysis-panel">
          <div className="scenario-analysis-title">📋 シナリオ分析：{SCENARIOS[scenarioIndex].name}</div>
          <div className="scenario-analysis-desc">{SCENARIOS[scenarioIndex].label}</div>
          <div className="scenario-analysis-grid">
            <div className="scenario-analysis-section merits">
              <div className="scenario-analysis-section-title">✅ メリット</div>
              <ul>
                {SCENARIOS[scenarioIndex].merits.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
            <div className="scenario-analysis-section demerits">
              <div className="scenario-analysis-section-title">⚠️ デメリット</div>
              <ul>
                {SCENARIOS[scenarioIndex].demerits.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          </div>
          <div className="scenario-analysis-section policies">
            <div className="scenario-analysis-section-title">💡 改善に向けた施策</div>
            <ol>
              {SCENARIOS[scenarioIndex].policies.map((p, i) => <li key={i}>{p}</li>)}
            </ol>
          </div>
        </div>

        {childAlerts && (
          <div className="child-alert-panel">
            <div className="child-alert-title">👶 子供の未来レポート（{childAge2026}歳 → {childAlerts.childAgeAtEnd}歳）</div>
            <div className="child-alert-grid">
              {childAlerts.dataAt20 && (
                <div className="child-alert-card">
                  <div className="child-alert-age">20歳（{childAlerts.childAt20Year}年）</div>
                  <div className="child-alert-detail">利払負担率: <strong style={{ color: childAlerts.dataAt20.interestBurden > 30 ? '#ef4444' : '#f59e0b' }}>{childAlerts.dataAt20.interestBurden.toFixed(1)}%</strong></div>
                  <div className="child-alert-detail">実質賃金: <strong style={{ color: childAlerts.dataAt20.realWageGrowth < 0 ? '#ef4444' : '#22c55e' }}>{childAlerts.dataAt20.realWageGrowth >= 0 ? '+' : ''}{childAlerts.dataAt20.realWageGrowth.toFixed(1)}%</strong></div>
                  <div className="child-alert-detail">貧困率: <strong>{childAlerts.dataAt20.povertyRate.toFixed(1)}%</strong></div>
                </div>
              )}
              {childAlerts.dataAt30 && (
                <div className="child-alert-card">
                  <div className="child-alert-age">30歳（{childAlerts.childAt30Year}年）</div>
                  <div className="child-alert-detail">利払負担率: <strong style={{ color: childAlerts.dataAt30.interestBurden > 30 ? '#ef4444' : '#f59e0b' }}>{childAlerts.dataAt30.interestBurden.toFixed(1)}%</strong></div>
                  <div className="child-alert-detail">実質賃金: <strong style={{ color: childAlerts.dataAt30.realWageGrowth < 0 ? '#ef4444' : '#22c55e' }}>{childAlerts.dataAt30.realWageGrowth >= 0 ? '+' : ''}{childAlerts.dataAt30.realWageGrowth.toFixed(1)}%</strong></div>
                  <div className="child-alert-detail">貧困率: <strong>{childAlerts.dataAt30.povertyRate.toFixed(1)}%</strong></div>
                </div>
              )}
              <div className="child-alert-card displacement">
                <div className="child-alert-age">教育・社会保障の圧迫度</div>
                <div className="child-alert-detail" style={{ fontSize: 18, fontWeight: 700, color: childAlerts.displacementScore > 10 ? '#ef4444' : '#f59e0b' }}>
                  +{childAlerts.displacementScore.toFixed(1)}pt
                </div>
                <div className="child-alert-detail" style={{ fontSize: 11, color: '#64748b' }}>
                  利払負担率の増加分（{childAlerts.initInterestBurden.toFixed(1)}% → {childAlerts.finalInterestBurden.toFixed(1)}%）が教育・社会保障を圧迫
                </div>
              </div>
            </div>
          </div>
        )}

        {(summaryStats.couponDouble || summaryStats.nfaDepletionYear || summaryStats.persistentCADeficit || summaryStats.realWageLongStag.start) && (
          <div className="principle-breach-panel">
            <div className="principle-breach-title">⚠️ 原則の崩壊（Principle Breach）</div>
            <div className="principle-breach-list">
              {summaryStats.couponDouble && (
                <div className="principle-breach-item">
                  <span className="breach-icon">📈</span>
                  <div>
                    <strong>低金利神話の崩壊</strong>
                    <p>平均クーポンが初期値（{params.initAvgCoupon.toFixed(1)}%）の2倍に到達: <strong>{summaryStats.couponDouble}年</strong>
                    {summaryStats.couponTriple && <span>、3倍に到達: <strong>{summaryStats.couponTriple}年</strong></span>}</p>
                  </div>
                </div>
              )}
              {(summaryStats.nfaDepletionYear || summaryStats.persistentCADeficit) && (
                <div className="principle-breach-item">
                  <span className="breach-icon">🛡️</span>
                  <div>
                    <strong>対外ポジションの悪化</strong>
                    <p>{summaryStats.nfaDepletionYear && <span>対外純資産が枯渇: <strong>{summaryStats.nfaDepletionYear}年</strong>。</span>}
                    {summaryStats.persistentCADeficit && <span>経常赤字が3年以上定着: <strong>{summaryStats.persistentCADeficit}年</strong></span>}</p>
                  </div>
                </div>
              )}
              {summaryStats.realWageLongStag.start && (
                <div className="principle-breach-item">
                  <span className="breach-icon">💰</span>
                  <div>
                    <strong>実質賃金の長期低迷</strong>
                    <p>実質賃金が3年以上連続マイナス: <strong>{summaryStats.realWageLongStag.start}年 〜 {summaryStats.realWageLongStag.end}年</strong></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="chart-container">
        <ChartTitleWithHelp title="利払い負担率の推移 （税収に対する利払い費の割合）" />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={interestBurdenData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="5 5" label={{ value: '警戒ライン30%', fill: '#ef4444', fontSize: 11 }} />
            <Bar dataKey="利払負担率" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <ChartTitleWithHelp title="財政収支の推移 （歳入 − 歳出）" />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fiscalBalanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Bar dataKey="財政収支" fill={(entry: Record<string, unknown>) => ((entry as {財政収支: number}).財政収支 >= 0 ? '#22c55e' : '#ef4444')} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <ChartTitleWithHelp title="債務残高の推移" />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={debtData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} decimals={0} />} />
            <Bar dataKey="債務残高" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Collapsible title="家計への影響（貧困率・ジニ係数・実質賃金）" defaultOpen={true}>
        <ChartSubtitle title="貧困率の推移（%）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={householdData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <Bar dataKey="貧困率" fill="#ef4444" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="ジニ係数の推移（x100）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={householdData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<NoDataTooltip childAge2026={childAge2026} />} />
            <Bar dataKey="ジニ係数" fill="#8b5cf6"  opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="実質賃金伸び率（%）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={householdData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Bar dataKey="実質賃金伸び率" fill="#22c55e" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </Collapsible>

      <Collapsible title="家計の実感（モデル家計：年収中央値400万円）" defaultOpen={true}>
        <div className="chart-note" style={{ marginBottom: 8, textAlign: 'left', fontSize: 12, color: '#64748b' }}>
          年収400万円（中央値）の家計を想定。税・社会保険料30%、食費25.5%（エンゲル係数）、光熱費7.3%で計算。2026年との差額を表示。
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
          <ChartSubtitle title="可処分所得の変化（万円/年）" />
          <button
            onClick={() => setLogScaleHousehold(!logScaleHousehold)}
            style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 4,
              border: '1px solid #cbd5e1', cursor: 'pointer',
              background: logScaleHousehold ? '#3b82f6' : '#f1f5f9',
              color: logScaleHousehold ? '#fff' : '#475569',
            }}
          >
            {logScaleHousehold ? '対数' : '線形'}
          </button>
        </div>
        {logScaleHousehold && disposableHasNonPositive && (
          <div style={{ fontSize: 11, color: '#dc2626', textAlign: 'center', marginBottom: 4 }}>
            ⚠ 0以下の値を含むため対数スケールを適用できません（線形表示中）
          </div>
        )}
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={modelHouseholdData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              unit="万円"
              scale={(logScaleHousehold && !disposableHasNonPositive) ? 'log' : 'auto'}
              domain={(logScaleHousehold && !disposableHasNonPositive) ? ['auto', 'auto'] : undefined}
              allowDataOverflow={(logScaleHousehold && !disposableHasNonPositive)}
            />
            <Tooltip content={<NoDataTooltip unit=" 万円" childAge2026={childAge2026} />} />
            {!(logScaleHousehold && !disposableHasNonPositive) && <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />}
            <Bar dataKey="可処分所得変化" fill="#3b82f6" name="可処分所得変化" />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="生活費の増加（万円/年）" />
        {logScaleHousehold && costHasNonPositive && (
          <div style={{ fontSize: 11, color: '#dc2626', textAlign: 'center', marginBottom: 4 }}>
            ⚠ 0以下の値を含むため対数スケールを適用できません（線形表示中）
          </div>
        )}
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={modelHouseholdData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              unit="万円"
              scale={(logScaleHousehold && !costHasNonPositive) ? 'log' : 'auto'}
              domain={(logScaleHousehold && !costHasNonPositive) ? ['auto', 'auto'] : undefined}
              allowDataOverflow={(logScaleHousehold && !costHasNonPositive)}
            />
            <Tooltip content={<NoDataTooltip unit=" 万円" childAge2026={childAge2026} />} />
            <Legend />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Bar dataKey="食費増加" fill="#f97316" opacity={0.7} stackId="cost" />
            <Bar dataKey="光熱費増加" fill="#ef4444" opacity={0.7} stackId="cost" />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="所得格差倍率（上位20%÷下位20%）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={incomeRatioData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="倍" />
            <Tooltip content={<NoDataTooltip unit="倍" childAge2026={childAge2026} decimals={2} />} />
            <Bar dataKey="所得格差倍率" fill="#8b5cf6" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
        {simData.length > 0 && (() => {
          const d2035 = simData.find(d => d.year === 2035)
          const d2055 = simData[simData.length - 1]
          const first = simData[0]
          return (
            <div className="responsive-grid-4col">
              <div className="metric-card">
                <div className="metric-label">2035年 可処分所得変化</div>
                <div className="metric-value" style={{ color: (d2035?.modelDisposableChange ?? 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                  {(d2035?.modelDisposableChange ?? 0) >= 0 ? '+' : ''}{(d2035?.modelDisposableChange ?? 0).toFixed(1)}万円
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">{d2055.year}年 可処分所得変化</div>
                <div className="metric-value" style={{ color: d2055.modelDisposableChange >= 0 ? '#22c55e' : '#ef4444' }}>
                  {d2055.modelDisposableChange >= 0 ? '+' : ''}{d2055.modelDisposableChange.toFixed(1)}万円
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">所得格差倍率（初年度）</div>
                <div className="metric-value">{first.incomeRatio.toFixed(2)}倍</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">所得格差倍率（{d2055.year}年）</div>
                <div className="metric-value" style={{ color: d2055.incomeRatio > first.incomeRatio ? '#ef4444' : '#22c55e' }}>
                  {d2055.incomeRatio.toFixed(2)}倍
                </div>
              </div>
            </div>
          )
        })()}
        <Collapsible title="モデル家計の詳細推移（年収・可処分所得・食費・光熱費）">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={modelSummaryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                unit="万円"
                scale={logScaleHousehold ? 'log' : 'auto'}
                domain={logScaleHousehold ? ['auto', 'auto'] : undefined}
                allowDataOverflow={logScaleHousehold}
              />
              <Tooltip content={<NoDataTooltip unit=" 万円" childAge2026={childAge2026} decimals={0} />} />
              <Legend />
              <Bar dataKey="名目年収" fill="#3b82f6" />
              <Bar dataKey="可処分所得" fill="#22c55e" />
              <Bar dataKey="食費" fill="#f97316" />
              <Bar dataKey="光熱費" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </Collapsible>
      </Collapsible>

      <Collapsible title="人的資本・人口動態" defaultOpen={true}>
        <ChartSubtitle title="人的資本指数・労働力指数" />
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={humanCapitalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<NoDataTooltip childAge2026={childAge2026} decimals={1} />} />
            <Legend />
            <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="5 5" label={{ value: '基準 100', fill: '#94a3b8', fontSize: 10 }} />
            <Line type="monotone" dataKey="人的資本指数" stroke="#22c55e" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="労働力指数" stroke="#3b82f6" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>

        <ChartSubtitle title="合計特殊出生率（TFR）の推移" />
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={tfrData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={[0.5, 2.5]} />
            <Tooltip content={<NoDataTooltip childAge2026={childAge2026} decimals={3} />} />
            <Legend />
            <ReferenceLine y={2.07} stroke="#22c55e" strokeDasharray="5 5" label={{ value: '人口置換水準 2.07', fill: '#22c55e', fontSize: 10 }} />
            <ReferenceLine y={1.20} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: '現状 1.20', fill: '#f59e0b', fontSize: 10 }} />
            <Line type="monotone" dataKey="TFR" stroke="#8b5cf6" dot={false} strokeWidth={2.5} />
          </LineChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={tfrData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<NoDataTooltip childAge2026={childAge2026} decimals={4} />} />
            <Legend />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Bar dataKey="賃金効果" fill="#3b82f6" opacity={0.7} stackId="tfr" />
            <Bar dataKey="格差効果" fill="#f59e0b" opacity={0.7} stackId="tfr" />
            <Bar dataKey="子育て支援効果" fill="#a855f7" opacity={0.7} stackId="tfr" />
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-note">
          TFR寄与分解: 賃金効果（実質賃金変化率由来）、格差効果（ジニ係数変化由来）、子育て支援効果（子育て支援GDP比由来）
        </div>

        <ChartSubtitle title="社会活力指数" />
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={socialVitalityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip content={<NoDataTooltip childAge2026={childAge2026} decimals={1} />} />
            {socialVitalityData.length > 0 && (
              <ReferenceArea y1={120} y2={Math.max(160, ...socialVitalityData.map(d => d.社会活力指数))} fill="#22c55e" fillOpacity={0.1} />
            )}
            {socialVitalityData.length > 0 && (
              <ReferenceArea y1={Math.min(40, ...socialVitalityData.map(d => d.社会活力指数))} y2={80} fill="#ef4444" fillOpacity={0.1} />
            )}
            <ReferenceLine y={120} stroke="#22c55e" strokeDasharray="5 5" label={{ value: '好循環 120', fill: '#22c55e', fontSize: 10 }} />
            <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="5 5" label={{ value: '基準 100', fill: '#94a3b8', fontSize: 10 }} />
            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="5 5" label={{ value: '悪循環 80', fill: '#ef4444', fontSize: 10 }} />
            <Line type="monotone" dataKey="社会活力指数" stroke="#8b5cf6" dot={false} strokeWidth={2.5} />
          </LineChart>
        </ResponsiveContainer>
        <div className="chart-note">
          社会活力指数 = 100 × (TFR/ベースTFR) × (1+人的資本成長率) × (1+実質賃金変化率)。緑帯(≥120)=好循環、赤帯(≤80)=悪循環
        </div>
      </Collapsible>

      <Collapsible title="貿易収支・為替レート" defaultOpen={true}>
        <ChartSubtitle title="貿易収支の推移" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={tradeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <Legend />
            <Bar dataKey="輸出" fill="#22c55e" opacity={0.6} />
            <Bar dataKey="輸入" fill="#ef4444" opacity={0.6} />
            <Bar dataKey="貿易収支" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="為替レートの推移" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={fxData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="円/$" />
            <Tooltip content={<NoDataTooltip unit=" 円/$" childAge2026={childAge2026} decimals={0} />} />
            <Bar dataKey="為替レート" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </Collapsible>

      <Collapsible title="対外純資産・経常収支" defaultOpen={true}>
        <ChartSubtitle title="対外純資産の推移" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={nfaData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} decimals={0} />} />
            <ReferenceLine y={params.nfaThreshold} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `防衛ライン${params.nfaThreshold}兆円`, fill: '#ef4444', fontSize: 10 }} />
            <Bar dataKey="対外純資産" fill="#3b82f6" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="経常収支の推移（兆円）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={nfaData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Bar dataKey="経常収支" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="通貨リスクプレミアム加算（%）" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={nfaData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <Bar dataKey="通貨リスク加算" fill="#ef4444" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-note">
          経常収支 = 貿易収支 + 所得収支（NFA×3%）。経常赤字＋NFA防衛ライン割れで通貨リスクプレミアムが金利に自動加算されます。
        </div>
      </Collapsible>

      <Collapsible title="GDP・企業セクター">
        <ChartSubtitle title="名目GDP（兆円）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={gdpData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <Bar dataKey="名目GDP" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="債務残高GDP比・内部留保GDP比（%）" />
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={gdpData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <Legend />
            <Line type="monotone" dataKey="債務GDP比" stroke="#ef4444" dot={false} strokeWidth={2} connectNulls />
            <Line type="monotone" dataKey="内部留保GDP比" stroke="#f59e0b" dot={false} strokeWidth={2} connectNulls />
          </LineChart>
        </ResponsiveContainer>
        <div className="chart-note">
          債務GDP比は政府債務の対GDP比率。内部留保GDP比は企業の累積内部留保の対GDP比率。内部留保が大きいほど企業が賃金に分配していないことを示します。
        </div>
      </Collapsible>

      <Collapsible title="歳入合計・税収内訳">
        <ChartSubtitle title="税収内訳・歳入（兆円）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <Legend />
            <Bar dataKey="消費税" stackId="a" fill="#3b82f6" />
            <Bar dataKey="所得税" stackId="a" fill="#22c55e" />
            <Bar dataKey="法人税" stackId="a" fill="#f97316" />
            <Bar dataKey="その他税" stackId="a" fill="#8b5cf6" />
            <Bar dataKey="利息純収入" stackId="a" fill="#ec4899" />
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-note">
          利払い費がマイナス（統合政府として利息収入が支出を上回る）の場合、歳出側から除外し「利息純収入」として歳入に計上しています
        </div>
        <ChartSubtitle title="税収構成比（%）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueRatioData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <Legend />
            <Bar dataKey="消費税" stackId="a" fill="#3b82f6" />
            <Bar dataKey="所得税" stackId="a" fill="#22c55e" />
            <Bar dataKey="法人税" stackId="a" fill="#f97316" />
            <Bar dataKey="その他税" stackId="a" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </Collapsible>

      <Collapsible title="予算構成・歳出内訳">
        <ChartSubtitle title="歳入の財源構成（%）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={budgetCompositionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <Legend />
            <Bar dataKey="税収" stackId="a" fill="#22c55e" />
            <Bar dataKey="公債金" stackId="a" fill="#ef4444" />
            <Bar dataKey="その他収入" stackId="a" fill="#94a3b8" />
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-note">
          歳入全体（税収＋公債金＋その他収入）に占める割合。公債金（国債発行）依存度が高いほど財政の持続可能性リスクが高まります
        </div>
        <ChartSubtitle title="歳出分野別内訳（兆円）" />
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={expBreakdownData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <Legend />
            <Bar dataKey="社会保障" stackId="a" fill="#3b82f6" />
            <Bar dataKey="子育て支援" stackId="a" fill="#a855f7" />
            <Bar dataKey="地方交付税" stackId="a" fill="#f59e0b" />
            <Bar dataKey="防衛" stackId="a" fill="#6b7280" />
            <Bar dataKey="その他政策" stackId="a" fill="#06b6d4" />
            <Bar dataKey="エネルギー補助金" stackId="a" fill="#84cc16" />
            <Bar dataKey="利払い費" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="支出構成比（%）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={expenditureRatioData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <Legend />
            <Bar dataKey="政策経費" stackId="a" fill="#3b82f6" />
            <Bar dataKey="利払い費" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </Collapsible>

      <Collapsible title="日銀収支（統合政府への影響）">
        <ChartSubtitle title="日銀純利益（兆円）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bojData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Bar dataKey="日銀純利益" fill="#94a3b8" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="統合政府への反映額（兆円）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bojData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Bar dataKey="統合政府への反映額" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="累積損失（兆円）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bojData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <ReferenceLine y={-params.bojCapitalBuffer} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `バッファ-${params.bojCapitalBuffer}兆`, fill: '#ef4444', fontSize: 9 }} />
            <Bar dataKey="累積損失" fill="#ef4444" opacity={0.6} />
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-note">
          逆ザヤ時（純利益マイナス）の累積損失が自己資本バッファ（{params.bojCapitalBuffer}兆円）を超えると、マイナスが歳入を直接減少させます
        </div>
        <ChartSubtitle title="日銀バランスシート（兆円）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bojBSData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="兆円" />
            <Tooltip content={<NoDataTooltip unit=" 兆円" childAge2026={childAge2026} />} />
            <Bar dataKey="保有国債" fill="#3b82f6" opacity={0.7} />
            <Bar dataKey="当座預金" fill="#f59e0b" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </Collapsible>

      <Collapsible title="金利・成長率・リスクプレミアム">
        <ChartSubtitle title="金利比較（%）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={rateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <Legend />
            <Bar dataKey="実効市場金利" fill="#3b82f6" />
            <Bar dataKey="平均クーポン" fill="#ef4444" />
            <Bar dataKey="日銀保有利回り" fill="#f59e0b" />
            <Bar dataKey="名目成長率" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
        <ChartSubtitle title="財政リスクプレミアム加算（%）" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={rateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" />
            <Tooltip content={<NoDataTooltip unit="%" childAge2026={childAge2026} />} />
            <Bar dataKey="財政リスク加算" fill="#ef4444" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </Collapsible>

      <h2 className="section-title" style={{ marginTop: 24 }}>データ表</h2>
      <div className="view-toggle">
        <button className={tableView === 'combined' ? 'active' : ''} onClick={() => setTableView('combined')}>実績+予測</button>
        <button className={tableView === '5year' ? 'active' : ''} onClick={() => setTableView('5year')}>予測5年おき</button>
        <button className={tableView === 'full' ? 'active' : ''} onClick={() => setTableView('full')}>予測全30年</button>
        <button className={tableView === 'actual' ? 'active' : ''} onClick={() => setTableView('actual')}>実績のみ</button>
        <button className="csv-download-btn" onClick={() => downloadCSV(tableData)}>📥 CSV</button>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>項目</th>
              {tableData.years.map((y, j) => {
                const isActual = tableData.actualYearCount ? j < tableData.actualYearCount : tableView === 'actual'
                return <th key={`${y}-${j}`} className={isActual ? 'actual-col' : ''}>{y}</th>
              })}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, i) => {
              if (row.label === '─') {
                return <tr key={i} className="separator-row"><td colSpan={tableData.years.length + 1}></td></tr>
              }
              return (
                <tr key={i}>
                  <td className={row.indent === 1 ? 'indent-1' : row.indent === 2 ? 'indent-2' : 'bold-label'}>
                    {row.label}
                  </td>
                  {row.values.map((v, j) => {
                    const isActual = tableData.actualYearCount ? j < tableData.actualYearCount : tableView === 'actual'
                    return <td key={j} className={isActual ? 'actual-col' : ''}>{v}</td>
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {tableView === 'combined' && (
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, textAlign: 'center' }}>
          🔵 水色背景 = 実績データ ／ 白背景 = シミュレーション
        </div>
      )}
    </div>
  )
}
