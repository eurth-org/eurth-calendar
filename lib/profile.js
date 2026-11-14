/**
 * The "calendar" section of an Eurth profile (<nation>.eurth.json).
 *
 * Calendar owns this section and Time reads it. It holds two things: the handful of plain
 * fields the profile's schema describes (name, days per year, months, weekdays, era), so any
 * tool can show a line about the calendar without this package, and under `definition` the
 * whole calendar, which is what Time runs on.
 *
 * Use @eurth/profile to read and write the file itself; this module only makes and reads the
 * one section.
 */
import { createCalendar } from './calendar.js';
import { summarizeCalendar } from './describe.js';
import { normalizeCalendar } from './normalize.js';
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
/**
 * The profile section for a calendar.
 * @param options.link the calendar's share link; kept only if it is an https link of at most 4000 characters
 * @param options.updated when it was written (default: now)
 */
export function toProfileSection(definition, options = {}) {
    const calendar = createCalendar(definition);
    const d = calendar.definition;
    const section = {
        summary: summarizeCalendar(calendar),
        updated: (options.updated ?? new Date()).toISOString().replace(/\.\d+Z$/, 'Z'),
        name: d.name,
        months: d.months.map((month) => ({ name: month.name, days: month.days })),
        weekdays: [...d.weekdays],
        era: d.era,
        definition: JSON.parse(JSON.stringify(d)),
    };
    if (calendar.daysPerYear <= 100_000)
        section.daysPerYear = calendar.daysPerYear;
    if (options.link !== undefined && /^https:\/\/[!-~]+$/.test(options.link) && options.link.length <= 4000) {
        return { link: options.link, ...section };
    }
    return section;
}
/**
 * The calendar in a profile's "calendar" section. Reads the full definition when it is there;
 * otherwise builds a plain calendar from the section's simple fields (months, weekdays, era),
 * so a section written by hand or by another tool still works. Null when there is nothing to
 * build from.
 */
export function fromProfileSection(section) {
    if (!isRecord(section))
        return null;
    if (isRecord(section.definition))
        return normalizeCalendar(section.definition);
    if (!Array.isArray(section.months) || section.months.length === 0)
        return null;
    return normalizeCalendar({
        name: section.name,
        era: section.era,
        months: section.months,
        weekdays: Array.isArray(section.weekdays) && section.weekdays.length > 0 ? section.weekdays : undefined,
    });
}
