import { type Issue } from './normalize.js';
import type { CalendarDate, CalendarDefinition, DateStyle, DayInfo, GregorianDate, HolidayOccurrence, MoonEvent, MoonState, YearLayout } from './types.js';
export declare class Calendar {
    #private;
    /** The definition this calendar runs on: cleaned, complete and frozen. */
    readonly definition: CalendarDefinition;
    /** What had to be changed in the definition it was given. Empty when it was fine. */
    readonly issues: readonly Issue[];
    /** Days in an ordinary year. */
    readonly daysPerYear: number;
    /** The average length of a year, leap years included. */
    readonly meanYear: number;
    /** The first and last year the calendar covers. */
    readonly minYear: number;
    readonly maxYear: 10000000;
    /** The first and last day count the calendar covers. */
    readonly minDays: number;
    readonly maxDays: number;
    constructor(definition: unknown);
    /** Whether the calendar is tied to Earth's: whether day 1 of year 1 has a Gregorian date. */
    get linked(): boolean;
    /** Whether any leap rule matches the year. */
    isLeapYear(year: number): boolean;
    /** The length of a year in days. */
    yearLength(year: number): number;
    /**
     * The day count of the first day of a year. Also answers for the year after the last one,
     * so that the end of the last year can be found.
     */
    yearStart(year: number): number;
    /** A year laid out: its months and intercalary blocks in order, with their lengths that year. */
    year(year: number): YearLayout;
    /** The length of a month in a year. */
    monthLength(year: number, month: number): number;
    /** The length of an intercalary block in a year. 0 when it does not occur that year. */
    intercalaryLength(year: number, intercalary: number): number;
    /** The longest an intercalary block ever is. A block that is never more than a day long is written without a day number. */
    longestIntercalary(intercalary: number): number;
    /** Whether a date exists in this calendar. 30 February does not; nor does Midyear Day in a year without one. */
    isValidDate(date: CalendarDate): boolean;
    /** The day count of a date. Throws a RangeError for a date that does not exist. */
    toDays(date: CalendarDate): number;
    /** The year a day count falls in. */
    yearOf(days: number): number;
    /** The date of a day count. */
    fromDays(days: number): CalendarDate;
    /** The day of the week of a day count (1-based), or null for a day that stands outside the week. */
    weekday(days: number): number | null;
    /** The day of the year of a day count (1-based). */
    dayOfYear(days: number): number;
    /** The Gregorian date of a day count. Null when the calendar has no link to Earth. */
    toGregorian(days: number): GregorianDate | null;
    /**
     * The day count of a Gregorian date. Null when the calendar has no link to Earth; a
     * RangeError for a date that does not exist or lies outside the years the calendar covers.
     */
    fromGregorian(date: GregorianDate): number | null;
    /** Every moon as it looks on a day. */
    moonsOn(days: number): MoonState[];
    /**
     * The new moons, quarters and full moons from day `from` to day `to` inclusive, in order.
     * Give `moon` (1-based) to list one moon only.
     */
    moonEvents(from: number, to: number, moon?: number): MoonEvent[];
    /** The holidays of a year, in order. */
    holidays(year: number): HolidayOccurrence[];
    /** The holidays that fall on a day. */
    holidaysOn(days: number): HolidayOccurrence[];
    /** The holidays from day `from` to day `to` inclusive, in order. At most 1000 years at a time. */
    holidaysBetween(from: number, to: number): HolidayOccurrence[];
    /**
     * A date written out. Styles: "long" (17 Harvestmoon 1022 FS, the default), "full" (with the
     * day of the week in front), "short" (17 Har 1022 FS) and "numeric" (1022-09-17).
     */
    format(date: number | CalendarDate, style?: DateStyle): string;
    /** Everything about one day: its date, weekday, Gregorian date, moons and holidays. */
    day(days: number): DayInfo;
}
/**
 * Makes a calendar ready to use. The definition may come from anywhere: it is cleaned first
 * (see normalizeCalendar), and `issues` on the result lists anything that had to change.
 */
export declare function createCalendar(definition: unknown): Calendar;
