/**
 * utils.ts — 汎用ユーティリティ関数
 *
 * シミュレーション表示で共通的に使用されるフォーマット関数やデータ補完関数を提供する。
 */

/**
 * 数値を固定小数点文字列にフォーマットする
 * @param v フォーマット対象の数値
 * @param decimals 小数点以下の桁数（デフォルト: 1）
 * @returns フォーマット済み文字列
 */
export function fmt(v: number, decimals = 1): string {
  return v.toFixed(decimals)
}

/**
 * シミュレーション期間の全年度配列を生成する（2015年〜シミュレーション終了年）
 * @param simYears シミュレーション年数
 * @returns 2015年から終了年までの年度配列
 */
export function getAllYears(simYears: number) {
  const endYear = 2025 + simYears;
  return Array.from({ length: endYear - 2015 + 1 }, (_, i) => 2015 + i);
}

/**
 * 実績データとシミュレーションデータの年度ギャップを埋める
 *
 * 2015年〜シミュレーション終了年の全年度を網羅し、
 * データが存在しない年度にはnull値と_noData=trueフラグを設定する。
 * チャート表示でデータなし期間を正しく表現するために使用。
 *
 * @param data 元データ配列（yearフィールドを持つオブジェクト）
 * @param simYears シミュレーション年数（デフォルト: 30）
 * @returns 年度ギャップが埋められたデータ配列
 */
export function fillYearGaps<T extends Record<string, unknown>>(data: T[], simYears: number = 30): (T & { _noData?: boolean })[] {
  const allYears = getAllYears(simYears)
  const dataMap = new Map<number, T>()
  data.forEach(d => dataMap.set(d.year as number, d))
  return allYears.map(year => {
    if (dataMap.has(year)) return { ...dataMap.get(year)!, _noData: false }
    const entry: Record<string, unknown> = { year, _noData: true }
    if (data.length > 0) {
      Object.keys(data[0]).forEach(key => {
        if (key !== 'year' && key !== '_noData' && key !== 'type') entry[key] = null
      })
    }
    return entry as T & { _noData?: boolean }
  })
}
