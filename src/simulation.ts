import type { SimParams } from './data';

export interface SimResult {
  year: number;
  tax: number;
  bojPayment: number;
  totalRevenue: number;
  policyExp: number;
  avgCoupon: number;
  interest: number;
  totalCost: number;
  debt: number;
  fiscalBalance: number;
  interestBurden: number;
  bojRev: number;
  bojCost: number;
  policyRate: number;
  taxConsumption: number;
  taxIncome: number;
  taxCorporate: number;
  taxOther: number;
  bondIssuance: number;
  otherRevStamp: number;
  otherRevGov: number;
  otherRevAsset: number;
  otherRevMisc: number;
}

export function runSimulation(p: SimParams): SimResult[] {
  const B = p.inflationRate / 100;
  const C = p.realGrowth / 100;
  const D = B + C;
  const E = D + p.riskPremium / 100;
  const changeYear = p.taxRateChangeYear !== "なし" ? parseInt(p.taxRateChangeYear) : null;

  const results: SimResult[] = [];

  for (let i = 0; i < 30; i++) {
    const year = 2026 + i;

    if (i === 0) {
      const policyRate = Math.max(E - p.policyRateSpread / 100, 0);
      const bojRev = p.initDebt * (p.bojYield / 100);
      const bojCost = p.bojCA * policyRate;
      const bojPayment = Math.max(bojRev - bojCost, 0);
      let taxConsumption = p.initTaxConsumption;
      if (changeYear !== null && year >= changeYear) {
        taxConsumption = taxConsumption * (p.taxRateNew / 10.0);
      }
      const taxIncome = p.initTaxIncome;
      const taxCorporate = p.initTaxCorporate;
      const taxOther = p.initTaxOther;
      const tax = taxConsumption + taxIncome + taxCorporate + taxOther;
      const totalRevenue = tax + bojPayment + p.otherRevenue;
      const avgCoupon = p.initAvgCoupon / 100;
      const interest = p.initDebt * avgCoupon;
      const policyExp = p.initPolicyExp;
      const totalCost = policyExp + interest;
      const fiscalBalance = totalRevenue - totalCost;
      const debt = p.initDebt + (totalCost - totalRevenue);
      const interestBurden = tax !== 0 ? (interest / tax) * 100 : 0;
      const bondIssuance = Math.max(totalCost - totalRevenue, 0);

      results.push({
        year, tax, bojPayment, totalRevenue, policyExp,
        avgCoupon: avgCoupon * 100, interest, totalCost, debt,
        fiscalBalance, interestBurden, bojRev, bojCost,
        policyRate: policyRate * 100,
        taxConsumption, taxIncome, taxCorporate, taxOther,
        bondIssuance,
        otherRevStamp: p.otherRevenue * 0.30,
        otherRevGov: p.otherRevenue * 0.20,
        otherRevAsset: p.otherRevenue * 0.25,
        otherRevMisc: p.otherRevenue * 0.25,
      });
    } else {
      const prev = results[i - 1];
      let taxConsumption = prev.taxConsumption * (1 + B * 1.0);
      if (changeYear !== null && year === changeYear) {
        taxConsumption = prev.taxConsumption * (1 + B * 1.0) * (p.taxRateNew / 10.0);
      }
      const taxIncome = prev.taxIncome * (1 + D * 1.4);
      const taxCorporate = prev.taxCorporate * (1 + C * 2.0 + B * 0.5);
      const taxOther = prev.taxOther * (1 + D * 0.8);
      const tax = taxConsumption + taxIncome + taxCorporate + taxOther;
      const policyRate = Math.max(E - p.policyRateSpread / 100, 0);
      const bojRev = prev.debt * (p.bojYield / 100);
      const bojCost = p.bojCA * policyRate;
      const bojPayment = Math.max(bojRev - bojCost, 0);
      const totalRevenue = tax + bojPayment + p.otherRevenue;
      const policyExp = prev.policyExp * (1 + B) + p.naturalIncrease;
      const avgCouponDec = (prev.avgCoupon / 100 * 8 / 9) + (E * 1 / 9);
      const interest = prev.debt * avgCouponDec;
      const totalCost = policyExp + interest;
      const fiscalBalance = totalRevenue - totalCost;
      const debt = prev.debt + (totalCost - totalRevenue);
      const interestBurden = tax !== 0 ? (interest / tax) * 100 : 0;
      const bondIssuance = Math.max(totalCost - totalRevenue, 0);

      results.push({
        year, tax, bojPayment, totalRevenue, policyExp,
        avgCoupon: avgCouponDec * 100, interest, totalCost, debt,
        fiscalBalance, interestBurden, bojRev, bojCost,
        policyRate: policyRate * 100,
        taxConsumption, taxIncome, taxCorporate, taxOther,
        bondIssuance,
        otherRevStamp: p.otherRevenue * 0.30,
        otherRevGov: p.otherRevenue * 0.20,
        otherRevAsset: p.otherRevenue * 0.25,
        otherRevMisc: p.otherRevenue * 0.25,
      });
    }
  }

  return results;
}
