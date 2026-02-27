import type { SimParams, Constraints } from './data'
import { runSimulation, type SimResult } from './simulation'
import { computeWarnings } from './warnings'

export interface OptimizableParam {
  key: keyof SimParams
  label: string
  min: number
  max: number
  step: number
}

export const OPTIMIZABLE_PARAMS: OptimizableParam[] = [
  { key: 'inflationRate', label: 'インフレ率', min: 0, max: 10, step: 0.1 },
  { key: 'realGrowth', label: '実質成長率', min: -2, max: 5, step: 0.1 },
  { key: 'riskPremium', label: 'ベースリスクプレミアム', min: 0, max: 3, step: 0.1 },
  { key: 'yenDepreciation', label: '為替バイアス', min: -3, max: 10, step: 0.5 },
  { key: 'foreignInterestRate', label: '海外金利', min: 0.5, max: 8.0, step: 0.1 },
  { key: 'nominalWageGrowth', label: '名目賃金上昇率下限', min: 0, max: 5, step: 0.1 },
  { key: 'productivityShareRate', label: '生産性分配率', min: 0.1, max: 1.0, step: 0.05 },
  { key: 'wagePassThroughRate', label: 'インフレ転嫁率', min: 0.0, max: 1.0, step: 0.05 },
  { key: 'retainedEarningsReturnRate', label: '内部留保還元率', min: 0.0, max: 0.10, step: 0.005 },
  { key: 'globalGrowth', label: '世界経済成長率', min: 0, max: 5, step: 0.1 },
  { key: 'naturalIncrease', label: '自然増', min: 0, max: 2, step: 0.1 },
  { key: 'energySubsidyRate', label: 'エネルギー補助金率', min: 0, max: 1, step: 0.1 },
  { key: 'bojQTRate', label: 'QT縮小額', min: 0, max: 80, step: 5 },
  { key: 'fiscalRiskSensitivity', label: '財政リスク感応度', min: 0, max: 0.5, step: 0.01 },
]

export function computeConstraintViolations(simData: SimResult[], constraints: Constraints): number {
  let violations = 0
  let consecutiveCADeficit = 0
  for (const d of simData) {
    if (constraints.povertyRate.enabled && d.povertyRate > constraints.povertyRate.threshold) violations++
    if (constraints.giniIndex.enabled && d.giniIndex > constraints.giniIndex.threshold) violations++
    if (constraints.interestBurden.enabled && d.interestBurden > constraints.interestBurden.threshold) violations++
    if (constraints.realPolicyExpIndex.enabled && d.realPolicyExpIndex < constraints.realPolicyExpIndex.threshold) violations++
    if (constraints.currentAccountDeficit.enabled) {
      if (d.currentAccount < 0) {
        consecutiveCADeficit++
      } else {
        consecutiveCADeficit = 0
      }
      if (consecutiveCADeficit > constraints.currentAccountDeficit.threshold) violations++
    }
  }
  return violations
}

export function countWarnings(params: SimParams, constraints?: Constraints): number {
  const simData = runSimulation(params)
  const warnings = computeWarnings(simData, params).length
  if (constraints) {
    return warnings + computeConstraintViolations(simData, constraints)
  }
  return warnings
}

export interface OptimizerProgress {
  iteration: number
  maxIterations: number
  currentWarnings: number
  bestWarnings: number
  done: boolean
  bestParams: SimParams
}

export function runOptimizer(
  baseParams: SimParams,
  selectedKeys: (keyof SimParams)[],
  onProgress: (progress: OptimizerProgress) => void,
  constraints?: Constraints,
): { cancel: () => void } {
  let cancelled = false

  const paramDefs = OPTIMIZABLE_PARAMS.filter(p => selectedKeys.includes(p.key))
  if (paramDefs.length === 0) {
    onProgress({
      iteration: 0, maxIterations: 0,
      currentWarnings: countWarnings(baseParams, constraints),
      bestWarnings: countWarnings(baseParams, constraints),
      done: true, bestParams: { ...baseParams },
    })
    return { cancel: () => {} }
  }

  const maxIterations = 80
  const learningRate = 0.5
  const epsilon = 1e-4

  let current = { ...baseParams }
  let currentCount = countWarnings(current, constraints)
  let bestWarnings = currentCount
  let bestParams = { ...current }
  let noImproveCount = 0
  let iter = 0

  function step() {
    if (cancelled || iter >= maxIterations || bestWarnings === 0 || noImproveCount >= 15) {
      onProgress({
        iteration: iter,
        maxIterations,
        currentWarnings: bestWarnings,
        bestWarnings,
        done: true,
        bestParams: { ...bestParams },
      })
      return
    }

    const batchSize = 4
    for (let b = 0; b < batchSize && iter < maxIterations; b++, iter++) {
      if (cancelled || bestWarnings === 0 || noImproveCount >= 15) break

      const gradient: Record<string, number> = {}

      for (const def of paramDefs) {
        const k = def.key
        const originalVal = current[k] as number
        const h = Math.max(def.step * 0.5, epsilon)
        const pPlus = { ...current, [k]: Math.min(originalVal + h, def.max) }
        const pMinus = { ...current, [k]: Math.max(originalVal - h, def.min) }
        gradient[k] = (countWarnings(pPlus, constraints) - countWarnings(pMinus, constraints)) / (2 * h)
      }

      let moved = false
      const next = { ...current }

      for (const def of paramDefs) {
        const k = def.key
        const grad = gradient[k]
        if (Math.abs(grad) < epsilon) continue
        const oldVal = current[k] as number
        let newVal = oldVal - learningRate * grad * def.step
        newVal = Math.round(newVal / def.step) * def.step
        newVal = Math.max(def.min, Math.min(def.max, newVal))
        if (newVal !== oldVal) {
          (next as Record<string, unknown>)[k] = newVal
          moved = true
        }
      }

      if (moved) {
        const nextCount = countWarnings(next, constraints)
        if (nextCount <= currentCount) {
          current = next
          currentCount = nextCount
          if (nextCount < bestWarnings) {
            bestWarnings = nextCount
            bestParams = { ...current }
            noImproveCount = 0
          } else {
            noImproveCount++
          }
        } else {
          noImproveCount++
          for (const def of paramDefs) {
            const k = def.key
            const grad = gradient[k]
            if (Math.abs(grad) < epsilon) continue
            const testParams = { ...current }
            const oldVal = current[k] as number
            let newVal = oldVal - learningRate * grad * def.step
            newVal = Math.round(newVal / def.step) * def.step
            newVal = Math.max(def.min, Math.min(def.max, newVal))
            ;(testParams as Record<string, unknown>)[k] = newVal
            const testCount = countWarnings(testParams, constraints)
            if (testCount < currentCount) {
              current = testParams
              currentCount = testCount
              if (testCount < bestWarnings) {
                bestWarnings = testCount
                bestParams = { ...current }
                noImproveCount = 0
              }
              break
            }
          }
        }
      } else {
        noImproveCount++
      }
    }

    onProgress({
      iteration: iter,
      maxIterations,
      currentWarnings: currentCount,
      bestWarnings,
      done: false,
      bestParams: { ...bestParams },
    })

    setTimeout(step, 0)
  }

  setTimeout(step, 0)

  return { cancel: () => { cancelled = true } }
}
