/** Dates as words, and as the compact text a link or a file stores. */
import type { Calendar } from './calendar.js';
import type { CalendarDate, CalendarDefinition, DateStyle } from './types.js';
/** The short form of a name: its own, or its first three letters. */
export declare function shortName(name: string, short?: string): string;
/**
 * A year as it is written: "1022 FS", or "3 Before the Founding" for a year before year 1.
 * Before year 1 the years count backwards with no year zero, as BC does. A calendar with no
 * name for that time shows them as 0, -1, -2 with its usual label.
 */
export declare function formatYear(definition: Pick<CalendarDefinition, 'era' | 'eraBefore'>, year: number): string;
/** Used by Calendar.format; call that instead. `weekday` is the 1-based day of the week, or null. */
export declare function formatDate(calendar: Calendar, date: CalendarDate, style: DateStyle, weekday: number | null): string;
/**
 * A date as compact text, for links and files: "1022-09-17" for a day in a month,
 * "1020-i1-1" for a day in intercalary block 1, "-0003-02-11" for a year before year 0.
 * It sorts and reads like an ISO date, but the months are the calendar's own.
 */
export declare function dateToString(date: CalendarDate): string;
/**
 * Reads the text dateToString writes. Null for anything else. The date is not checked against
 * a calendar: ask calendar.isValidDate for that.
 */
export declare function parseDate(text: unknown): CalendarDate | null;
