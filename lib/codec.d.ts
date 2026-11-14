/**
 * A calendar as a piece of a link.
 *
 * Nothing is stored anywhere: a calendar lives in its address. encodeCalendar packs the
 * definition tightly (short keys, lists instead of objects, nothing that is at its default)
 * and writes it as "<version>.<base64url>", the same form @eurth/style's links use.
 * decodeCalendar reads it back, and never trusts it: whatever arrives is cleaned by
 * normalizeCalendar, so a mangled or hostile link gives a tidy calendar or null, never an error.
 *
 * Calendar hands a calendar to Time the same way: time.eurth.org/?cal=<this text>.
 */
import { type Issue } from './normalize.js';
import { type CalendarDefinition } from './types.js';
/** The query parameter that carries a calendar from one Eurth tool to another. */
export declare const CALENDAR_PARAM = "cal";
/** The longest encoded calendar that will be read. A full calendar is a few thousand characters. */
export declare const MAX_ENCODED_LENGTH = 60000;
/** A calendar as link text: "1.eyJtIjpb…". The definition is cleaned first. */
export declare function encodeCalendar(definition: unknown): string;
/**
 * Reads link text back into a calendar definition. Null when the text is not a calendar at
 * all (too long, malformed, from a version this package does not know); otherwise a clean
 * definition and a list of whatever had to be put right.
 */
export declare function decodeCalendar(text: unknown): {
    calendar: CalendarDefinition;
    issues: Issue[];
} | null;
/**
 * A link that carries a calendar: the address given, with the calendar as its only query
 * parameter. calendarLink('https://time.eurth.org/', definition) is what "Use in a timeline" opens.
 */
export declare function calendarLink(base: string, definition: unknown, param?: string): string;
/** The calendar a link carries, if it carries one. Takes a whole address or just its query string. */
export declare function calendarFromLink(link: string, param?: string): {
    calendar: CalendarDefinition;
    issues: Issue[];
} | null;
