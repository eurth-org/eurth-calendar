// A long soak of the built engine: random day counts through every preset, there and back.
//
//   npm run soak        ten million day counts per preset
//   npm run soak -- 50  fifty million per preset
//
// The test suite does a million per preset on every run; this is for a quiet afternoon.

import { createCalendar, PRESETS } from '../lib/index.js';

const millions = Number(process.argv[2] ?? 10);
if (!Number.isFinite(millions) || millions <= 0) throw new Error('Give a number of millions, for example: npm run soak -- 50');

/** mulberry32: the same seed always gives the same numbers. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let failures = 0;
for (const preset of PRESETS) {
  const calendar = createCalendar(preset.definition);
  const random = seeded(20041225);
  const span = calendar.maxDays - calendar.minDays;
  const count = Math.round(millions * 1_000_000);
  const started = Date.now();
  for (let i = 0; i < count; i++) {
    const days = calendar.minDays + Math.floor(random() * (span + 1));
    const date = calendar.fromDays(days);
    if (calendar.toDays(date) !== days) {
      failures++;
      console.error(`${preset.id}: day ${days} became ${JSON.stringify(date)} and did not come back`);
      if (failures > 20) process.exit(1);
    }
  }
  console.log(`${preset.id}: ${count.toLocaleString('en-GB')} day counts there and back in ${((Date.now() - started) / 1000).toFixed(1)} s`);
}
if (failures > 0) process.exit(1);
console.log('No errors.');
