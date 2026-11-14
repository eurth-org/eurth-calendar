/** Dates as words, and as the compact text a link or a file stores. */
import type { Calendar } from './calendar.js';
import type { CalendarDate, CalendarDefinition, DateStyle } from './types.js';

/** A true minus sign, for years before year 1 in a calendar with no name for that time. */
const MINUS = String.fromCharCode(0x2212);

/** The short form of a name: its own, or its first three letters. */
export function shortName(name: string, short?: string): string {
  return short !== undefined && short !== '' ? short : Array.from(name).slice(0, 3).join('');
}

/**
 * A year as it is written: "1022 FS", or "3 Before the Founding" for a year before year 1.
 * Before year 1 the years count backwards with no year zero, as BC does. A calendar with no
 * name for that time shows them as 0, -1, -2 with its usual label.
 */
export function formatYear(definition: Pick<CalendarDefinition, 'era' | 'eraBefore'>, year: number): string {
  if (year < 1 && definition.eraBefore !== '') return `${1 - year} ${definition.eraBefore}`;
  const number = year < 0 ? `${MINUS}${-year}` : String(year);
  return definition.era === '' ? number : `${number} ${definition.era}`;
}

/** Used by Calendar.format; call that instead. `weekday` is the 1-based day of the week, or null. */
export function formatDate(calendar: Calendar, date: CalendarDate, style: DateStyle, weekday: number | null): string {
  if (style === 'numeric') return dateToString(date);
  const { definition } = calendar;
  const year = formatYear(definition, date.year);
  let text: string;
  if ('month' in date) {
    const month = definition.months[date.month - 1]!;
    text = `${date.day} ${style === 'short' ? shortName(month.name, month.short) : month.name} ${year}`;
  } else {
    const block = definition.intercalary[date.intercalary - 1]!;
    // A block that is never more than a day long is a named day: "Midyear Day 1020 FS".
    text = calendar.longestIntercalary(date.intercalary) <= 1 ? `${block.name} ${year}` : `${date.day} ${block.name} ${year}`;
  }
  if (style === 'full' && weekday !== null) return `${definition.weekdays[weekday - 1]!}, ${text}`;
  return text;
}

/**
 * A date as compact text, for links and files: "1022-09-17" for a day in a month,
 * "1020-i1-1" for a day in intercalary block 1, "-0003-02-11" for a year before year 0.
 * It sorts and reads like an ISO date, but the months are the calendar's own.
 */
export function dateToString(date: CalendarDate): string {
  const year = `${date.year < 0 ? '-' : ''}${String(Math.abs(date.year)).padStart(4, '0')}`;
  const day = String(date.day).padStart(2, '0');
  return 'month' in date ? `${year}-${String(date.month).padStart(2, '0')}-${day}` : `${year}-i${date.intercalary}-${day}`;
}

/**
 * Reads the text dateToString writes. Null for anything else. The date is not checked against
 * a calendar: ask calendar.isValidDate for that.
 */
export function parseDate(text: unknown): CalendarDate | null {
  if (typeof text !== 'string') return null;
  const found = /^(-?)(\d{1,8})-(i?)(\d{1,3})-(\d{1,4})$/.exec(text.trim());
  if (!found) return null;
  const magnitude = Number(found[2]);
  const year = found[1] === '-' && magnitude !== 0 ? -magnitude : magnitude;
  const index = Number(found[4]);
  const day = Number(found[5]);
  if (index < 1 || day < 1) return null;
  return found[3] === 'i' ? { year, intercalary: index, day } : { year, month: index, day };
}
