/**
 * Calendars to start from: the Gregorian calendar and four invented ones, each showing a
 * different way to build a year. They are data like any other calendar, and the engine's
 * tests run every one of them through millions of days.
 */
import type { CalendarDefinition } from './types.js';
/** A ready-made calendar. */
export interface Preset {
    /** A short id for links and file names. */
    id: string;
    /** One line on what kind of calendar it is and what to notice. */
    pitch: string;
    definition: CalendarDefinition;
}
/**
 * The Gregorian calendar: Earth's civil calendar, run backwards and forwards for ever (the
 * "proleptic" Gregorian calendar). The Moon is the mean Moon: within about half a day of the
 * real one.
 */
export declare const GREGORIAN: CalendarDefinition;
/**
 * The Selunnan Reckoning: thirteen months of twenty-eight days. Every month starts on the
 * same day of the week, and every fifth year a Midyear Day slips in outside the week, so the
 * pattern never breaks.
 */
export declare const SELUNNAN: CalendarDefinition;
/**
 * The Tidewatch Count: a purely lunar calendar. Twelve months of thirty and twenty-nine days
 * follow the moon and nothing else, so the year is eleven days short of the seasons and the
 * months drift through them. Eleven leap days in every thirty years keep each month starting
 * at the new moon.
 */
export declare const TIDEWATCH: CalendarDefinition;
/**
 * The Meridian Republican Calendar: decimal and rational, after the calendar of the French
 * Republic. Twelve months of thirty days in weeks of ten, and five festival days at the end
 * of the year that belong to no month and no week; a sixth in leap years.
 */
export declare const MERIDIAN: CalendarDefinition;
/**
 * The Kharan Long Year: a calendar for another world. A year of 412 days, ten long months, a
 * week of eight days and three moons. Dawnturn opens the year and counts in the week; Duskturn
 * closes it. Leap years add a day to the last month.
 */
export declare const KHARAN: CalendarDefinition;
/** The presets, in the order the maker offers them. */
export declare const PRESETS: readonly Preset[];
/** A fresh copy of a preset's definition, safe to change. Undefined for an id that is not a preset. */
export declare function presetDefinition(id: string): CalendarDefinition | undefined;
