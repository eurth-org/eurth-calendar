import type { GregorianDate } from './types.js';
/** Whether a Gregorian year has a 29 February. */
export declare function isGregorianLeapYear(year: number): boolean;
/** The number of days in a Gregorian month. */
export declare function gregorianMonthLength(year: number, month: number): number;
/** Whether a Gregorian date exists. */
export declare function isValidGregorian(date: GregorianDate): boolean;
/** The rata die of a Gregorian date: 1 for 1 January of year 1. The date is not checked. */
export declare function gregorianToRataDie(date: GregorianDate): number;
/** The Gregorian date of a rata die. */
export declare function rataDieToGregorian(rataDie: number): GregorianDate;
/** The day of the week of a rata die, from 1 (Monday) to 7 (Sunday), as ISO 8601 counts. */
export declare function rataDieWeekday(rataDie: number): number;
/**
 * A Gregorian date as text: "2026-11-12". Years before 1 CE are written "-0043-03-15", and
 * years past 9999 with as many digits as they need.
 */
export declare function formatIsoDate(date: GregorianDate): string;
/** Reads "2026-11-12" or "-0043-03-15" (a leading + is allowed). Null for anything that is not a real date. */
export declare function parseIsoDate(text: unknown): GregorianDate | null;
/**
 * The Gregorian date a JavaScript Date shows on the device (or in UTC, when asked). The one
 * place a clock comes in: a converter's "today".
 */
export declare function gregorianFromJsDate(date: Date, options?: {
    utc?: boolean;
}): GregorianDate;
