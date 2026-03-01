/**
 * useUrlParams.ts — URL共有フック
 *
 * シミュレーションパラメータをURLクエリパラメータにシリアライズ・デシリアライズし、
 * 「共有URLをコピー」機能を提供する。
 * デフォルト値と異なるパラメータのみをURLに含めることでURL長を最適化する。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SimParams } from '../types';
import { SCENARIOS } from '../data';

const baseParams = SCENARIOS[0].params;

const PARAM_SHORT_KEYS: Record<string, string> = {
  inflationRate: 'ir',
  realGrowth: 'rg',
  riskPremium: 'rp',
  initDebt: 'id',
  initTaxConsumption: 'tc',
  initTaxIncome: 'ti',
  initTaxCorporate: 'tp',
  initTaxOther: 'to',
  initPolicyExp: 'pe',
  initAvgCoupon: 'ac',
  bojCA: 'bc',
  bojYield: 'by',
  bojCapitalBuffer: 'cb',
  otherRevenue: 'or',
  naturalIncrease: 'ni',
  policyRateSpread: 'ps',
  taxRateChangeYear: 'ty',
  taxRateNew: 'tn',
  yenDepreciation: 'yd',
  nominalWageGrowth: 'nw',
  productivityShareRate: 'pr',
  wagePassThroughRate: 'wp',
  globalGrowth: 'gg',
  initExport: 'ex',
  initImport: 'im',
  fxReserves: 'fx',
  initPovertyRate: 'pv',
  initGini: 'gi',
  initExchangeRate: 'er',
  povertySensitivity: 'ps2',
  energySubsidyRate: 'es',
  initNFA: 'nf',
  nfaThreshold: 'nt',
  currencyRiskPremium: 'cr',
  initBojJGB: 'bj',
  bojQTRate: 'qt',
  bojCAFloor: 'cf',
  fiscalRiskSensitivity: 'fs',
  interestBurdenThreshold: 'ib',
  initSocialSecurity: 'ss',
  initChildcare: 'cc',
  initLocalGovTransfer: 'lg',
  initDefense: 'df',
  childcareGrowth: 'cg',
  defenseGrowth: 'dg',
  initNominalGDP: 'gd',
  initRetainedEarnings: 're',
  effectiveCorporateTaxRate: 'ct',
  retainedEarningsReturnRate: 'rr',
  foreignInterestRate: 'fi',
  foreignInflation: 'fl',
  populationGrowth: 'pg',
  laborParticipationChange: 'lp',
  educationGDPRatio: 'eg',
  techEffect: 'te',
  baseTFR: 'tf',
  tfrSensitivity: 'ts',
  simYears: 'sy',
};

const SHORT_TO_PARAM = Object.fromEntries(
  Object.entries(PARAM_SHORT_KEYS).map(([k, v]) => [v, k])
);

/**
 * URLからパラメータを読み取る
 *
 * URLクエリパラメータに含まれる短縮キーをSimParamsのキーに変換し、
 * ベースラインパラメータに差分を適用して返す。
 *
 * @returns デシリアライズされたパラメータ（URLに含まれない場合はnull）
 */
function parseUrlParams(): Partial<SimParams> | null {
  const search = window.location.search;
  if (!search || search === '?') return null;

  const urlParams = new URLSearchParams(search);
  const diff: Record<string, unknown> = {};
  let found = false;

  for (const [shortKey, value] of urlParams.entries()) {
    const paramKey = SHORT_TO_PARAM[shortKey];
    if (!paramKey) continue;

    if (paramKey === 'taxRateChangeYear') {
      diff[paramKey] = value;
    } else {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        diff[paramKey] = num;
      }
    }
    found = true;
  }

  return found ? diff : null;
}

/**
 * パラメータをURLクエリ文字列に変換する
 *
 * デフォルト値（ベースラインシナリオ）と異なるパラメータのみを含めることで、
 * URL長を最適化する。
 */
function paramsToUrlString(params: SimParams): string {
  const parts: string[] = [];

  for (const [key, shortKey] of Object.entries(PARAM_SHORT_KEYS)) {
    const current = params[key as keyof SimParams];
    const defaultVal = baseParams[key as keyof SimParams];

    if (current !== defaultVal) {
      parts.push(`${shortKey}=${encodeURIComponent(String(current))}`);
    }
  }

  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

/**
 * URL共有機能を提供するカスタムフック
 *
 * @param onRestoreParams - URLからパラメータを復元する際に呼ばれるコールバック
 * @returns copyUrl — 現在のパラメータを含むURLをクリップボードにコピーする関数、
 *          copied — コピー成功状態
 */
export function useUrlParams(
  params: SimParams,
  onRestoreParams: (params: SimParams) => void
) {
  const [copied, setCopied] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const diff = parseUrlParams();
    if (diff) {
      onRestoreParams({ ...baseParams, ...diff } as SimParams);
    }
  }, [onRestoreParams]);

  const copyUrl = useCallback(() => {
    const queryString = paramsToUrlString(params);
    const url = `${window.location.origin}${window.location.pathname}${queryString}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [params]);

  return { copyUrl, copied };
}
