/**
 * data.ts — バレル再エクスポートファイル
 *
 * 後方互換性を維持するため、分離した各モジュールの公開シンボルを
 * 一括で再エクスポートする。既存の `import { ... } from './data'` は
 * 変更なしで動作し続ける。
 *
 * 新規コードでは、より具体的なモジュールから直接インポートすることを推奨:
 *   import type { SimParams } from './types'
 *   import { SCENARIOS } from './scenarios'
 *   import { ACTUAL_DATA } from './historicalData'
 *   import { DEFAULT_CONSTRAINTS } from './constants'
 */

export type {
  ActualDataPoint,
  ActualMacroPoint,
  SimParams,
  Constraint,
  Constraints,
  Scenario,
  DataSource,
} from './types';

export { ACTUAL_DATA, ACTUAL_MACRO, HISTORICAL_EDUCATION_GDP, HISTORICAL_TFR } from './historicalData';
export { DEFAULT_CONSTRAINTS, DATA_SOURCES } from './constants';
export { SCENARIOS } from './scenarios';
