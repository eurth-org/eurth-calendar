import { type CalendarDefinition, type PrincipalPhase } from './types.js';
/** Something normalizeCalendar had to change or drop. */
export interface Issue {
    /** Where in the definition, for example "months[2].days". */
    path: string;
    /** What was wrong, in a plain sentence. */
    message: string;
}
export declare const PRINCIPAL_PHASES: readonly PrincipalPhase[];
/** Plain text: no control characters, single spaces, trimmed, at most `max` characters. */
export declare function cleanText(value: unknown, max: number): string;
/**
 * Turns anything into a calendar definition the engine can trust, and lists what it changed.
 * A valid definition comes back as an equal copy with no issues; nonsense comes back as a
 * plain one-month calendar with a list of reasons.
 */
export declare function normalizeCalendar(input: unknown): {
    calendar: CalendarDefinition;
    issues: Issue[];
};
/** What is wrong with a definition, as a list. Empty when it is fine as it stands. */
export declare function validateCalendar(input: unknown): Issue[];
