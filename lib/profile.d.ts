import { type Issue } from './normalize.js';
import type { CalendarDefinition } from './types.js';
/** The section as Calendar writes it. */
export interface CalendarSection {
    /** The calendar's share link on cal.eurth.org. */
    link?: string;
    /** One paragraph about the calendar. */
    summary: string;
    /** When the section was written, as an ISO date and time. */
    updated: string;
    name: string;
    /** Days in an ordinary year. Left out for a year too long for the profile's schema. */
    daysPerYear?: number;
    months: {
        name: string;
        days: number;
    }[];
    weekdays: string[];
    /** The label after a year. */
    era: string;
    /** The whole calendar. */
    definition: CalendarDefinition;
}
/**
 * The profile section for a calendar.
 * @param options.link the calendar's share link; kept only if it is an https link of at most 4000 characters
 * @param options.updated when it was written (default: now)
 */
export declare function toProfileSection(definition: unknown, options?: {
    link?: string;
    updated?: Date;
}): CalendarSection;
/**
 * The calendar in a profile's "calendar" section. Reads the full definition when it is there;
 * otherwise builds a plain calendar from the section's simple fields (months, weekdays, era),
 * so a section written by hand or by another tool still works. Null when there is nothing to
 * build from.
 */
export declare function fromProfileSection(section: unknown): {
    calendar: CalendarDefinition;
    issues: Issue[];
} | null;
