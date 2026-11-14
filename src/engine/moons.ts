/**
 * Moons.
 *
 * A moon runs through its cycle at a steady pace: `period` days from new moon to new moon,
 * starting `phase` of the way through at the start of day 1 of year 1. That is a mean moon,
 * which is all an invented calendar needs, and close to the real one for Earth (within about
 * half a day).
 *
 * The sums are done in whole numbers (BigInt, in units of a four-millionth of a day), so a
 * full moon lands on the same day whether it is asked for in year 3 or year 3,000,000, and a
 * list of phases always agrees with the phase of each single day.
 */
import { ceilDivBig, floorDivBig, modBig } from './math.js';
import type { Moon, PhaseName, PrincipalPhase } from './types.js';

/** Units in a day. A quarter of a cycle is then a whole number of units for any period given to six decimals. */
const DAY = 4_000_000n;

const PRINCIPAL: readonly PrincipalPhase[] = ['new', 'first-quarter', 'full', 'last-quarter'];
const BETWEEN: readonly PhaseName[] = ['waxing-crescent', 'waxing-gibbous', 'waning-gibbous', 'waning-crescent'];

/** The most phases one call will list, so a slip of the hand cannot ask for a billion. */
const MOST_EVENTS = 200_000;

interface Clock {
  /** Units in a quarter of the cycle. */
  quarter: bigint;
  /** How far into its cycle the moon is at the start of day 0, in units. */
  offset: bigint;
}

function clockOf(moon: Moon): Clock {
  const micro = Math.max(1, Math.round(moon.period * 1e6));
  const fraction = moon.phase - Math.floor(moon.phase);
  return { quarter: BigInt(micro), offset: BigInt(Math.round(fraction * 4 * micro)) };
}

/**
 * The phase to show for a day, and how lit the moon is at midday.
 * On the day a new moon, quarter or full moon happens, that is the phase; on other days it is
 * the stretch the moon is in (waxing crescent, waxing gibbous, waning gibbous, waning crescent).
 * If a very fast moon reaches more than one of the four moments in a day, the first one is given.
 */
export function moonOn(moon: Moon, days: number): { phase: PhaseName; fraction: number; lit: number } {
  const { quarter, offset } = clockOf(moon);
  const dayStart = BigInt(days) * DAY + offset;
  const next = ceilDivBig(dayStart, quarter);
  const phase: PhaseName =
    next * quarter < dayStart + DAY
      ? PRINCIPAL[Number(modBig(next, 4n))]!
      : BETWEEN[Number(modBig(floorDivBig(dayStart, quarter), 4n))]!;
  const cycle = 4n * quarter;
  const fraction = Number(modBig(dayStart + DAY / 2n, cycle)) / Number(cycle);
  return { phase, fraction, lit: (1 - Math.cos(2 * Math.PI * fraction)) / 2 };
}

/**
 * The days on which a moon reaches its principal phases, from day `from` to day `to`
 * inclusive, in order. Give `only` to list one phase, for example every full moon.
 */
export function moonPhasesBetween(
  moon: Moon,
  from: number,
  to: number,
  only?: PrincipalPhase,
): { phase: PrincipalPhase; days: number }[] {
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to)) throw new RangeError('Day counts must be whole numbers.');
  const out: { phase: PrincipalPhase; days: number }[] = [];
  if (to < from) return out;
  const { quarter, offset } = clockOf(moon);
  let step = 1n;
  let first = ceilDivBig(BigInt(from) * DAY + offset, quarter);
  const last = ceilDivBig((BigInt(to) + 1n) * DAY + offset, quarter) - 1n;
  if (only !== undefined) {
    step = 4n;
    first += modBig(BigInt(PRINCIPAL.indexOf(only)) - first, 4n);
  }
  if ((last - first) / step >= BigInt(MOST_EVENTS)) {
    throw new RangeError('That is too long a span to list moon phases for; ask for a shorter one.');
  }
  for (let j = first; j <= last; j += step) {
    out.push({
      phase: PRINCIPAL[Number(modBig(j, 4n))]!,
      days: Number(floorDivBig(j * quarter - offset, DAY)),
    });
  }
  return out;
}

/** A phase as people say it: "first quarter", "waxing gibbous". */
export function phaseLabel(phase: PhaseName): string {
  return phase.replace('-', ' ');
}
