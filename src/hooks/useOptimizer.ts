/**
 * useOptimizer.ts — 最適化ロジックのカスタムフック
 *
 * パラメータ最適化に関する状態管理とロジックを集約する。
 * selectedOptKeys, optimizerProgress, isOptimizing等の状態と、
 * toggleOptKey, startOptimizer, applyOptResult等の操作関数を提供する。
 */

import { useState, useRef, useCallback, useMemo } from 'react'
import type { SimParams, Constraints } from '../types'
import { OPTIMIZABLE_PARAMS, runOptimizer, countWarnings, type OptimizerProgress } from '../optimizer'

export function useOptimizer(
  params: SimParams,
  onParamsReplace: (params: SimParams) => void,
  constraints: Constraints,
) {
  const [selectedOptKeys, setSelectedOptKeys] = useState<Set<string>>(
    () => new Set(OPTIMIZABLE_PARAMS.slice(0, 5).map(p => p.key))
  )
  const [optimizerProgress, setOptimizerProgress] = useState<OptimizerProgress | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [baselineWarnings, setBaselineWarnings] = useState<number | null>(null)
  const cancelRef = useRef<(() => void) | null>(null)

  const toggleOptKey = useCallback((key: string) => {
    setSelectedOptKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const hasActiveConstraints = useMemo(() =>
    Object.values(constraints).some(c => c.enabled), [constraints])

  const activeConstraints = useMemo(() =>
    hasActiveConstraints ? constraints : undefined, [constraints, hasActiveConstraints])

  const currentWarnings = useMemo(() =>
    countWarnings(params, activeConstraints), [params, activeConstraints])

  const startOptimizer = useCallback(() => {
    if (isOptimizing) {
      cancelRef.current?.()
      setIsOptimizing(false)
      return
    }
    const keys = Array.from(selectedOptKeys) as (keyof SimParams)[]
    if (keys.length === 0) return
    setIsOptimizing(true)
    setOptimizerProgress(null)
    const activeC = hasActiveConstraints ? constraints : undefined
    setBaselineWarnings(countWarnings(params, activeC))
    const { cancel } = runOptimizer(params, keys, (progress) => {
      setOptimizerProgress(progress)
      if (progress.done) {
        setIsOptimizing(false)
      }
    }, activeC)
    cancelRef.current = cancel
  }, [params, selectedOptKeys, isOptimizing, constraints, hasActiveConstraints])

  const applyOptResult = useCallback(() => {
    if (optimizerProgress?.bestParams) {
      onParamsReplace(optimizerProgress.bestParams)
    }
  }, [optimizerProgress, onParamsReplace])

  return {
    selectedOptKeys,
    optimizerProgress,
    isOptimizing,
    baselineWarnings,
    currentWarnings,
    toggleOptKey,
    startOptimizer,
    applyOptResult,
  }
}
