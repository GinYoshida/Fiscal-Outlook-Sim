/**
 * constants.ts — 定数定義
 *
 * シミュレーターで使用する制約条件のデフォルト値と、
 * データの出典情報を定義する。
 */

import type { Constraints, DataSource } from './types';

/** 最適化で使用する制約条件のデフォルト値 */
export const DEFAULT_CONSTRAINTS: Constraints = {
  povertyRate: { enabled: true, threshold: 20 },
  giniIndex: { enabled: true, threshold: 0.45 },
  interestBurden: { enabled: true, threshold: 30 },
  realPolicyExpIndex: { enabled: true, threshold: 70 },
  currentAccountDeficit: { enabled: true, threshold: 5 },
};

/**
 * データ出典一覧
 *
 * 実績データの取得元を記載。解説タブで表示される。
 * - 財務省: 税収、歳出、国債費、利払い費、貿易統計
 * - 総務省統計局: マクロ経済統計
 * - 厚生労働省: 貧困率・所得分布・実質賃金
 * - FRED: 米国10年国債利回り
 * - BLS: 米国消費者物価指数
 */
export const DATA_SOURCES: DataSource[] = [
  { name: "一般会計税収の推移", url: "https://www.mof.go.jp/tax_policy/summary/condition/a03.htm", desc: "税収データ" },
  { name: "財政に関する資料", url: "https://www.mof.go.jp/tax_policy/summary/condition/a02.htm", desc: "歳出・国債費" },
  { name: "普通国債残高の累増", url: "https://www.mof.go.jp/tax_policy/summary/condition/004.pdf", desc: "債務残高" },
  { name: "利払費と金利の推移", url: "https://www.mof.go.jp/tax_policy/summary/condition/005.pdf", desc: "利払い費" },
  { name: "日本の統計 2025 第5章", url: "https://www.stat.go.jp/data/nihon/05.html", desc: "統計局" },
  { name: "日本銀行 決算", url: "https://www.boj.or.jp/about/account/index.htm", desc: "国庫納付金" },
  { name: "貿易統計", url: "https://www.customs.go.jp/toukei/info/index.htm", desc: "財務省貿易統計" },
  { name: "国民生活基礎調査", url: "https://www.mhlw.go.jp/toukei/list/20-21.html", desc: "貧困率・所得分布" },
  { name: "毎月勤労統計調査", url: "https://www.mhlw.go.jp/toukei/list/30-1a.html", desc: "実質賃金指数" },
  { name: "US Treasury Yield (FRED)", url: "https://fred.stlouisfed.org/series/DGS10", desc: "米国10年国債利回り" },
  { name: "US CPI (BLS)", url: "https://www.bls.gov/cpi/", desc: "米国消費者物価指数" },
];
