/**
 * Holidays as an iCalendar file (RFC 5545), for calendar apps.
 *
 * Calendar apps only know Earth's dates, so this works for calendars with a link to Earth:
 * each holiday becomes an all-day event on its Gregorian date, with the calendar's own date
 * in the description.
 */
import type { Calendar } from './calendar.js';
/**
 * The holidays from day `from` to day `to` inclusive, as the text of an .ics file. Null when
 * the calendar has no link to Earth. Holidays outside the Gregorian years 1 to 9999 are left
 * out: calendar apps cannot show them.
 *
 * @param options.stamp the time the file was made (default: now); it goes into every event
 * @param options.domain the domain for the events' ids (default: cal.eurth.org)
 */
export declare function holidaysToICal(calendar: Calendar, from: number, to: number, options?: {
    stamp?: Date;
    domain?: string;
}): string | null;
