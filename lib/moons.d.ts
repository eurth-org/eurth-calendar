import type { Moon, PhaseName, PrincipalPhase } from './types.js';
/**
 * The phase to show for a day, and how lit the moon is at midday.
 * On the day a new moon, quarter or full moon happens, that is the phase; on other days it is
 * the stretch the moon is in (waxing crescent, waxing gibbous, waning gibbous, waning crescent).
 * If a very fast moon reaches more than one of the four moments in a day, the first one is given.
 */
export declare function moonOn(moon: Moon, days: number): {
    phase: PhaseName;
    fraction: number;
    lit: number;
};
/**
 * The days on which a moon reaches its principal phases, from day `from` to day `to`
 * inclusive, in order. Give `only` to list one phase, for example every full moon.
 */
export declare function moonPhasesBetween(moon: Moon, from: number, to: number, only?: PrincipalPhase): {
    phase: PrincipalPhase;
    days: number;
}[];
/** A phase as people say it: "first quarter", "waxing gibbous". */
export declare function phaseLabel(phase: PhaseName): string;
