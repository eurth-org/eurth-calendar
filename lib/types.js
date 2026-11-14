/**
 * The shapes @eurth/calendar works with.
 *
 * A calendar is data: a CalendarDefinition is plain JSON, small enough to live in a link and in
 * the "calendar" section of an Eurth profile. Everything a person counts from is 1-based in it:
 * month 1 is the first month, weekday 1 the first day of the week, moon 1 the first moon.
 */
/** The version of the definition format this package reads and writes. */
export const DEFINITION_VERSION = 1;
