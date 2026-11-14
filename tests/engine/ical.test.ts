import { describe, expect, it } from 'vitest';
import { createCalendar, GREGORIAN, holidaysToICal, SELUNNAN, TIDEWATCH } from '../../src/engine/index.js';

const stamp = new Date('2026-11-14T21:30:00Z');

describe('holidays as an iCalendar file', () => {
  it('lists each holiday as an all-day event on its Earth date', () => {
    const calendar = createCalendar(SELUNNAN);
    const layout = calendar.year(1022);
    const text = holidaysToICal(calendar, layout.start, layout.start + layout.days - 1, { stamp })!;
    expect(text.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Eurth//Calendar//EN\r\n')).toBe(true);
    expect(text.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(text).toContain('X-WR-CALNAME:Selunnan Reckoning: holidays\r\n');
    const founders = calendar.toDays({ year: 1022, month: 9, day: 21 });
    expect(text).toContain(
      [
        'BEGIN:VEVENT',
        `UID:h5-d${founders}@cal.eurth.org`,
        'DTSTAMP:20261114T213000Z',
        'DTSTART;VALUE=DATE:20261116',
        'DTEND;VALUE=DATE:20261117',
        "SUMMARY:Founders' Day",
        'DESCRIPTION:Restday\\, 21 Harvestmoon 1022 FS (Selunnan Reckoning)',
        'TRANSP:TRANSPARENT',
        'END:VEVENT',
      ].join('\r\n'),
    );
    expect(text.match(/BEGIN:VEVENT/g)!.length).toBe(calendar.holidays(1022).length);
    expect(text.match(/BEGIN:VEVENT/g)!.length).toBe(text.match(/END:VEVENT/g)!.length);
    // Every line break is a CRLF.
    expect(text.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
  });

  it('gives nothing for a calendar with no link to Earth', () => {
    expect(holidaysToICal(createCalendar(TIDEWATCH), 0, 400, { stamp })).toBeNull();
  });

  it('folds long lines and escapes text', () => {
    const calendar = createCalendar({
      ...GREGORIAN,
      name: 'Long; and, awkward \\ name',
      holidays: [{ type: 'date', name: `Feast ${'é'.repeat(58)} \u{1F319}; yes, really`, month: 3, day: 3 }],
    });
    const from = calendar.toDays({ year: 2026, month: 1, day: 1 });
    const text = holidaysToICal(calendar, from, from + 364, { stamp, domain: 'example.org' })!;
    const encoder = new TextEncoder();
    for (const line of text.split('\r\n')) expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    const unfolded = text.replace(/\r\n /g, '');
    const semicolon = String.raw`\;`;
    expect(unfolded).toContain(`X-WR-CALNAME:Long${semicolon} and\\, awkward \\\\ name: holidays`);
    expect(unfolded).toContain(`SUMMARY:Feast ${'é'.repeat(58)} \u{1F319}${semicolon} yes\\, really`);
    expect(unfolded).toContain('@example.org');
    expect(unfolded).toContain('DTSTART;VALUE=DATE:20260303');
  });

  it('leaves out years a calendar app cannot show', () => {
    const calendar = createCalendar(GREGORIAN);
    const early = holidaysToICal(calendar, calendar.toDays({ year: -1, month: 1, day: 1 }), calendar.toDays({ year: 1, month: 12, day: 31 }), { stamp })!;
    expect(early.match(/DTSTART;VALUE=DATE:(\d+)/g)).toEqual(['DTSTART;VALUE=DATE:00010101', 'DTSTART;VALUE=DATE:00010331', 'DTSTART;VALUE=DATE:00011231']);
    const late = holidaysToICal(calendar, calendar.toDays({ year: 9999, month: 12, day: 1 }), calendar.toDays({ year: 10000, month: 1, day: 5 }), { stamp })!;
    expect(late).not.toContain('BEGIN:VEVENT');
    const empty = holidaysToICal(createCalendar({ ...GREGORIAN, holidays: [] }), 0, 365, { stamp })!;
    expect(empty).toBe('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Eurth//Calendar//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:Gregorian calendar: holidays\r\nEND:VCALENDAR\r\n');
  });
});
