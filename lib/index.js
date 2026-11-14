/**
 * @eurth/calendar: a small date engine for invented calendars.
 *
 *   import { createCalendar, SELUNNAN } from '@eurth/calendar';
 *
 *   const calendar = createCalendar(SELUNNAN);
 *   const days = calendar.fromGregorian({ year: 2026, month: 11, day: 12 });  // 372088
 *   calendar.format(days, 'full');   // "Tideday, 17 Harvestmoon 1022 FS"
 *   calendar.fromDays(days);         // { year: 1022, month: 9, day: 17 }
 *
 * A calendar is plain data (CalendarDefinition). A day count is a whole number: 0 is day 1 of
 * year 1. See README.md for the whole of it.
 */
export { Calendar, createCalendar } from './calendar.js';
export { normalizeCalendar, validateCalendar, cleanText, PRINCIPAL_PHASES } from './normalize.js';
export { LIMITS } from './limits.js';
export { isGregorianLeapYear, gregorianMonthLength, isValidGregorian, gregorianToRataDie, rataDieToGregorian, rataDieWeekday, formatIsoDate, parseIsoDate, gregorianFromJsDate, } from './gregorian.js';
export { moonOn, moonPhasesBetween, phaseLabel } from './moons.js';
export { formatYear, dateToString, parseDate, shortName } from './format.js';
export { describeCalendar, summarizeCalendar, describeDay, formatGregorian, ordinal, GREGORIAN_MONTHS } from './describe.js';
export { encodeCalendar, decodeCalendar, calendarLink, calendarFromLink, CALENDAR_PARAM, MAX_ENCODED_LENGTH } from './codec.js';
export { toProfileSection, fromProfileSection } from './profile.js';
export { holidaysToICal } from './ical.js';
export { PRESETS, GREGORIAN, SELUNNAN, TIDEWATCH, MERIDIAN, KHARAN, presetDefinition } from './presets.js';
export { DEFINITION_VERSION } from './types.js';
/** The version of this package. */
export const VERSION = '1.0.0';
