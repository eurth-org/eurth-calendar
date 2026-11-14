/**
 * The proleptic Gregorian calendar, as whole-number arithmetic: no Date object, no time zones,
 * no limit at the year 275760. Years are counted as astronomers do, so the year before 1 CE is
 * 0 and the one before that is -1.
 *
 * The day number used here is the rata die: day 1 is 1 January of year 1, a Monday. The
 * formulas are those of Reingold and Dershowitz, "Calendrical Calculations".
 */
import { floorDiv, mod } from './math.js';
/** Whether a Gregorian year has a 29 February. */
export function isGregorianLeapYear(year) {
    return mod(year, 4) === 0 && (mod(year, 100) !== 0 || mod(year, 400) === 0);
}
/** The number of days in a Gregorian month. */
export function gregorianMonthLength(year, month) {
    if (month === 2)
        return isGregorianLeapYear(year) ? 29 : 28;
    return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}
/** Whether a Gregorian date exists. */
export function isValidGregorian(date) {
    const { year, month, day } = date;
    return (Number.isSafeInteger(year) &&
        Number.isInteger(month) &&
        Number.isInteger(day) &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= gregorianMonthLength(year, month));
}
/** The rata die of a Gregorian date: 1 for 1 January of year 1. The date is not checked. */
export function gregorianToRataDie(date) {
    const { year, month, day } = date;
    const before = year - 1;
    return (365 * before +
        floorDiv(before, 4) -
        floorDiv(before, 100) +
        floorDiv(before, 400) +
        floorDiv(367 * month - 362, 12) +
        (month <= 2 ? 0 : isGregorianLeapYear(year) ? -1 : -2) +
        day);
}
/** The Gregorian date of a rata die. */
export function rataDieToGregorian(rataDie) {
    const d0 = rataDie - 1;
    const n400 = floorDiv(d0, 146097);
    const d1 = mod(d0, 146097);
    const n100 = floorDiv(d1, 36524);
    const d2 = mod(d1, 36524);
    const n4 = floorDiv(d2, 1461);
    const d3 = mod(d2, 1461);
    const n1 = floorDiv(d3, 365);
    const counted = 400 * n400 + 100 * n100 + 4 * n4 + n1;
    const year = n100 === 4 || n1 === 4 ? counted : counted + 1;
    const prior = rataDie - gregorianToRataDie({ year, month: 1, day: 1 });
    const correction = rataDie < gregorianToRataDie({ year, month: 3, day: 1 }) ? 0 : isGregorianLeapYear(year) ? 1 : 2;
    const month = floorDiv(12 * (prior + correction) + 373, 367);
    const day = rataDie - gregorianToRataDie({ year, month, day: 1 }) + 1;
    return { year, month, day };
}
/** The day of the week of a rata die, from 1 (Monday) to 7 (Sunday), as ISO 8601 counts. */
export function rataDieWeekday(rataDie) {
    return mod(rataDie - 1, 7) + 1;
}
/**
 * A Gregorian date as text: "2026-11-12". Years before 1 CE are written "-0043-03-15", and
 * years past 9999 with as many digits as they need.
 */
export function formatIsoDate(date) {
    const abs = String(Math.abs(date.year)).padStart(4, '0');
    const mm = String(date.month).padStart(2, '0');
    const dd = String(date.day).padStart(2, '0');
    return `${date.year < 0 ? '-' : ''}${abs}-${mm}-${dd}`;
}
/** Reads "2026-11-12" or "-0043-03-15" (a leading + is allowed). Null for anything that is not a real date. */
export function parseIsoDate(text) {
    if (typeof text !== 'string')
        return null;
    const found = /^([+-]?)(\d{1,8})-(\d{1,2})-(\d{1,2})$/.exec(text.trim());
    if (!found)
        return null;
    const year = Number(found[2]) * (found[1] === '-' ? -1 : 1);
    const date = { year: year === 0 ? 0 : year, month: Number(found[3]), day: Number(found[4]) };
    return isValidGregorian(date) ? date : null;
}
/**
 * The Gregorian date a JavaScript Date shows on the device (or in UTC, when asked). The one
 * place a clock comes in: a converter's "today".
 */
export function gregorianFromJsDate(date, options = {}) {
    return options.utc
        ? { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() }
        : { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}
