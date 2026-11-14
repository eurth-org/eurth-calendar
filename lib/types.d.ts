/**
 * The shapes @eurth/calendar works with.
 *
 * A calendar is data: a CalendarDefinition is plain JSON, small enough to live in a link and in
 * the "calendar" section of an Eurth profile. Everything a person counts from is 1-based in it:
 * month 1 is the first month, weekday 1 the first day of the week, moon 1 the first moon.
 */
/** The version of the definition format this package reads and writes. */
export declare const DEFINITION_VERSION = 1;
/** A month of the year. */
export interface Month {
    /** The month's name, for example "Harvestmoon". */
    name: string;
    /** A short form for tight spaces. Without one, the first three letters of the name are used. */
    short?: string;
    /** Days in the month in an ordinary year, before any leap rule adds to it. */
    days: number;
}
/**
 * Days that belong to no month: a midyear day, festival days at the year's end.
 * A block may hold no days in an ordinary year (days: 0) and gain them from a leap rule.
 */
export interface Intercalary {
    /** The name of the day or the block, for example "Midyear Day" or "Festival". */
    name: string;
    /** How many months come before it: 0 puts it at the start of the year, months.length at the end. */
    after: number;
    /** Days in the block in an ordinary year. May be 0. */
    days: number;
    /** Whether these days are days of the week. False means the week pauses, as it does for Worldsday in the World Calendar. */
    inWeek: boolean;
}
/**
 * A leap rule. A year is a leap year for this rule when it divides by `every`, except when it
 * also divides by the first number in `except`, unless it divides by the second as well, and so
 * on. The Gregorian rule is { every: 4, except: [100, 400] }.
 *
 * Years before year 1 count on backwards through zero: the year before year 1 is year 0 for
 * this arithmetic, as astronomers count, whatever the era label says.
 */
export interface LeapRule {
    /** Leap when the year divides by this. */
    every: number;
    /** The chain of exceptions, each undoing the one before. */
    except: number[];
    /** How many days a leap year adds. */
    days: number;
    /** Where the days go: a month, or an intercalary block. Both are 1-based. */
    to: {
        month: number;
    } | {
        intercalary: number;
    };
}
/** A moon. */
export interface Moon {
    /** The moon's name. */
    name: string;
    /** Days from one new moon to the next. Fractions are fine: Earth's moon takes 29.530588. */
    period: number;
    /**
     * Where the moon is in its cycle at the start of day 1 of year 1, as a fraction:
     * 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter.
     */
    phase: number;
}
/** The four moments of a moon's cycle that calendars mark. */
export type PrincipalPhase = 'new' | 'first-quarter' | 'full' | 'last-quarter';
/** A moon's phase on a given day: one of the four principal phases, or the stretch between two. */
export type PhaseName = PrincipalPhase | 'waxing-crescent' | 'waxing-gibbous' | 'waning-gibbous' | 'waning-crescent';
/** A holiday on the same date every year. It is skipped in years when that date does not exist. */
export interface DateHoliday {
    type: 'date';
    name: string;
    /** The month (1-based). Leave out for a day in an intercalary block. */
    month?: number;
    /** The intercalary block (1-based). Leave out for a day in a month. */
    intercalary?: number;
    /** The day of the month or of the block. */
    day: number;
}
/** A holiday on the nth weekday of a month: "the second Restday of Bloommoon". */
export interface WeekdayHoliday {
    type: 'weekday';
    name: string;
    month: number;
    /** The day of the week (1-based). */
    weekday: number;
    /** 1 for the first, 2 for the second, and so on; -1 for the last. */
    nth: number;
}
/** A holiday set by a moon: "the first full moon of Selen in Rainmoon", or every full moon. */
export interface MoonHoliday {
    type: 'moon';
    name: string;
    /** Which moon (1-based). */
    moon: number;
    phase: PrincipalPhase;
    /** 1 for the first time in the span, 2 for the second, and so on; -1 for the last; 0 for every time. */
    nth: number;
    /** The month to look in (1-based), or 0 for the whole year. */
    month: number;
}
export type Holiday = DateHoliday | WeekdayHoliday | MoonHoliday;
/** A whole calendar. Plain JSON. */
export interface CalendarDefinition {
    /** The version of this format: 1. */
    v: typeof DEFINITION_VERSION;
    /** What the calendar is called, for example "Selunnan Reckoning". */
    name: string;
    /** The label after a year from year 1 on: "FS" in "1022 FS". May be empty. */
    era: string;
    /**
     * The label for years before year 1: "Before the Founding" in "3 Before the Founding".
     * Those years count backwards with no year zero, as BC does. When empty, earlier years are
     * shown as 0, -1, -2 with the main era's label.
     */
    eraBefore: string;
    /** The months, in order. At least one. */
    months: Month[];
    /** Days and blocks of days outside the months. */
    intercalary: Intercalary[];
    /** The names of the days of the week, in order. At least one. */
    weekdays: string[];
    /** Which day of the week day 1 of year 1 falls on (1-based). */
    firstWeekday: number;
    /** The leap rules. Every rule that matches a year adds its days. */
    leap: LeapRule[];
    /**
     * The Gregorian date of day 1 of year 1, as "YYYY-MM-DD" (years before 1 CE as "-YYYY-MM-DD",
     * counted as astronomers do: 0000 is 1 BCE). Null when the calendar has no link to Earth.
     */
    epoch: string | null;
    moons: Moon[];
    holidays: Holiday[];
}
/** A day inside a month. */
export interface MonthDate {
    /** The year: 1 is the first year, 0 the year before it, -1 the one before that. */
    year: number;
    /** The month (1-based). */
    month: number;
    /** The day of the month (1-based). */
    day: number;
}
/** A day inside an intercalary block. */
export interface IntercalaryDate {
    year: number;
    /** The intercalary block (1-based index into the definition's list). */
    intercalary: number;
    /** The day of the block (1-based). */
    day: number;
}
/** A date in a custom calendar. */
export type CalendarDate = MonthDate | IntercalaryDate;
/** A date in the proleptic Gregorian calendar. Years are counted as astronomers do: 0 is 1 BCE. */
export interface GregorianDate {
    year: number;
    /** 1 to 12. */
    month: number;
    day: number;
}
/** One stretch of a year: a month or an intercalary block, as it is in that particular year. */
export interface YearPart {
    kind: 'month' | 'intercalary';
    /** Which month or block (1-based). */
    index: number;
    name: string;
    /** Its length in this year. May be 0 for an intercalary block that only exists in leap years. */
    days: number;
    /** The day count of its first day. */
    start: number;
    /** Whether its days are days of the week. Months always are. */
    inWeek: boolean;
}
/** A year laid out: its parts in order, its length, and where it starts. */
export interface YearLayout {
    year: number;
    /** The day count of the year's first day. */
    start: number;
    /** The year's length in days. */
    days: number;
    /** Whether any leap rule matches this year. */
    leap: boolean;
    parts: YearPart[];
}
/** A holiday as it falls in a particular year. */
export interface HolidayOccurrence {
    /** Which holiday (1-based index into the definition's list). */
    holiday: number;
    name: string;
    /** The day count it falls on. */
    days: number;
    date: CalendarDate;
}
/** A principal phase of a moon, on the day it happens. */
export interface MoonEvent {
    /** Which moon (1-based). */
    moon: number;
    name: string;
    phase: PrincipalPhase;
    /** The day count of the day it happens on. */
    days: number;
}
/** A moon as it looks on one day. */
export interface MoonState {
    /** Which moon (1-based). */
    moon: number;
    name: string;
    /** The phase to show for the day: a principal phase on the day it happens, otherwise the stretch it is in. */
    phase: PhaseName;
    /** How far through its cycle the moon is at midday, from 0 (new) through 0.5 (full) to just under 1. */
    fraction: number;
    /** How much of the disc is lit at midday, from 0 to 1. */
    lit: number;
}
/** Everything about one day, for a converter or a tooltip. */
export interface DayInfo {
    days: number;
    date: CalendarDate;
    /** The day of the week (1-based), or null on a day outside the week. */
    weekday: number | null;
    /** The day of the year (1-based). */
    dayOfYear: number;
    /** The matching Gregorian date, or null when the calendar has no link to Earth or the date is out of range. */
    gregorian: GregorianDate | null;
    moons: MoonState[];
    holidays: HolidayOccurrence[];
}
/** How a date is written out. */
export type DateStyle = 'full' | 'long' | 'short' | 'numeric';
