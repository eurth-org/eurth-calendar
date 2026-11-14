/**
 * Holidays as an iCalendar file (RFC 5545), for calendar apps.
 *
 * Calendar apps only know Earth's dates, so this works for calendars with a link to Earth:
 * each holiday becomes an all-day event on its Gregorian date, with the calendar's own date
 * in the description.
 */
import type { Calendar } from './calendar.js';

/** Text made safe for an iCalendar value. */
const escapeText = (text: string): string => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Lines are at most 75 bytes; longer ones continue on the next line after a space. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = '';
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    // Continuation lines start with a space, which counts towards their 75 bytes.
    if (size + bytes > 75) {
      out.push(current);
      current = ' ';
      size = 1;
    }
    current += char;
    size += bytes;
  }
  out.push(current);
  return out.join('\r\n');
}

const pad = (n: number, width = 2): string => String(n).padStart(width, '0');

/**
 * The holidays from day `from` to day `to` inclusive, as the text of an .ics file. Null when
 * the calendar has no link to Earth. Holidays outside the Gregorian years 1 to 9999 are left
 * out: calendar apps cannot show them.
 *
 * @param options.stamp the time the file was made (default: now); it goes into every event
 * @param options.domain the domain for the events' ids (default: cal.eurth.org)
 */
export function holidaysToICal(
  calendar: Calendar,
  from: number,
  to: number,
  options: { stamp?: Date; domain?: string } = {},
): string | null {
  if (!calendar.linked) return null;
  const stamp = (options.stamp ?? new Date()).toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const domain = options.domain ?? 'cal.eurth.org';
  const name = calendar.definition.name === '' ? 'Calendar' : calendar.definition.name;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Eurth//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(`${name}: holidays`)}`,
  ];
  for (const occurrence of calendar.holidaysBetween(from, to)) {
    const start = calendar.toGregorian(occurrence.days);
    const end = occurrence.days < calendar.maxDays ? calendar.toGregorian(occurrence.days + 1) : null;
    if (start === null || end === null || start.year < 1 || end.year > 9999) continue;
    lines.push(
      'BEGIN:VEVENT',
      `UID:h${occurrence.holiday}-d${occurrence.days}@${domain}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${pad(start.year, 4)}${pad(start.month)}${pad(start.day)}`,
      `DTEND;VALUE=DATE:${pad(end.year, 4)}${pad(end.month)}${pad(end.day)}`,
      `SUMMARY:${escapeText(occurrence.name)}`,
      `DESCRIPTION:${escapeText(`${calendar.format(occurrence.days, 'full')} (${name})`)}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
