import { SCENARIOS } from './data';
import { runSimulation } from './simulation';
for (let i = 0; i < SCENARIOS.length; i++) {
  const s = SCENARIOS[i];
  const sim = runSimulation({ ...s.params, simYears: 30 });
  const last = sim[sim.length - 1];
  console.log(`${i}|${Math.round(last.debt)}|${last.interestBurden.toFixed(1)}|${last.povertyRate.toFixed(1)}|${Math.round(last.nfa)}|${last.humanCapitalIndex.toFixed(1)}|${last.tfr.toFixed(2)}`);
}
