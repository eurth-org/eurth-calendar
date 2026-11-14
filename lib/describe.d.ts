/**
 * A calendar in plain sentences: what "Copy description" copies, what a screen reader is
 * given, and the summary line of the profile.
 */
import type { Calendar } from './calendar.js';
export declare const GREGORIAN_MONTHS: readonly string[];
/** 1st, 2nd, 3rd, 4th, 11th, 21st. */
export declare function ordinal(n: number): string;
/** A Gregorian date in words: "22 September 1792", "15 March 44 BCE". */
export declare function formatGregorian(date: {
    year: number;
    month: number;
    day: number;
}): string;
/**
 * The whole calendar in a few plain sentences, one paragraph per subject, separated by blank
 * lines. Takes a calendar (from createCalendar), so the definition has been cleaned.
 */
export declare function describeCalendar(calendar: Calendar): string;
/** One line about the calendar, at most 600 characters: the profile's summary. */
export declare function summarizeCalendar(calendar: Calendar): string;
/**
 * One day in a sentence or two, for a converter and for screen readers:
 * "Tideday, 17 Harvestmoon 1022 FS. 12 November 2026 on Earth. Selen is waxing gibbous; Kair is full. Holiday: Founders' Day."
 */
export declare function describeDay(calendar: Calendar, days: number): string;
