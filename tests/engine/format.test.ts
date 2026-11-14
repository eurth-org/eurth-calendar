import { describe, expect, it } from 'vitest';
import {
  createCalendar,
  dateToString,
  describeCalendar,
  describeDay,
  formatGregorian,
  formatYear,
  GREGORIAN,
  KHARAN,
  MERIDIAN,
  ordinal,
  parseDate,
  PRESETS,
  SELUNNAN,
  shortName,
  summarizeCalendar,
  TIDEWATCH,
} from '../../src/engine/index.js';
import { between, randomDefinition, seeded } from './helpers.js';

const MINUS = String.fromCharCode(0x2212);

describe('dates as words', () => {
  const selunnan = createCalendar(SELUNNAN);
  const day = selunnan.toDays({ year: 1022, month: 9, day: 17 });

  it('come in four styles', () => {
    expect(selunnan.format(day)).toBe('17 Harvestmoon 1022 FS');
    expect(selunnan.format(day, 'long')).toBe('17 Harvestmoon 1022 FS');
    expect(selunnan.format(day, 'full')).toBe('Tideday, 17 Harvestmoon 1022 FS');
    expect(selunnan.format(day, 'short')).toBe('17 Har 1022 FS');
    expect(selunnan.format(day, 'numeric')).toBe('1022-09-17');
    expect(selunnan.format({ year: 1022, month: 9, day: 17 }, 'full')).toBe('Tideday, 17 Harvestmoon 1022 FS');
    expect(() => selunnan.format({ year: 1022, month: 9, day: 29 })).toThrow(RangeError);
  });

  it('use a month\'s own short form when it has one', () => {
    const calendar = createCalendar({ ...GREGORIAN, months: GREGORIAN.months.map((m, i) => (i === 8 ? { ...m, short: 'Sept' } : m)) });
    expect(calendar.format({ year: 2026, month: 9, day: 1 }, 'short')).toBe('1 Sept 2026 CE');
    expect(calendar.format({ year: 2026, month: 10, day: 1 }, 'short')).toBe('1 Oct 2026 CE');
    expect(shortName('Harvestmoon')).toBe('Har');
    expect(shortName('Harvestmoon', 'Hv')).toBe('Hv');
    expect(shortName('\u{1F319}\u{1F31E}\u{2B50}\u{1F30D}')).toBe('\u{1F319}\u{1F31E}\u{2B50}');
  });

  it('name intercalary days', () => {
    const midyear = selunnan.toDays({ year: 1020, intercalary: 1, day: 1 });
    expect(selunnan.format(midyear, 'full')).toBe('Midyear Day 1020 FS');
    expect(selunnan.format(midyear, 'short')).toBe('Midyear Day 1020 FS');
    expect(selunnan.format(midyear, 'numeric')).toBe('1020-i1-01');
    const meridian = createCalendar(MERIDIAN);
    expect(meridian.format({ year: 12, intercalary: 1, day: 3 }, 'full')).toBe('3 Festival 12 YR');
    const kharan = createCalendar(KHARAN);
    // Dawnturn counts in the week, so it has a weekday.
    expect(kharan.format(0, 'full')).toBe('Onesun, Dawnturn 1 KY');
  });

  it('count the years before year 1 backwards, with no year zero', () => {
    expect(selunnan.format(-1)).toBe('28 Darkmoon 1 Before the Founding');
    expect(selunnan.format(selunnan.yearStart(-2))).toBe('1 Frostmoon 3 Before the Founding');
    expect(formatYear(SELUNNAN, 1)).toBe('1 FS');
    expect(formatYear(SELUNNAN, 0)).toBe('1 Before the Founding');
    expect(formatYear(GREGORIAN, -43)).toBe('44 BCE');
    expect(formatYear(GREGORIAN, 2026)).toBe('2026 CE');
  });

  it('show them as zero and below when the time before has no name', () => {
    expect(formatYear(KHARAN, 0)).toBe('0 KY');
    expect(formatYear(KHARAN, -12)).toBe(`${MINUS}12 KY`);
    expect(formatYear({ era: '', eraBefore: '' }, 7)).toBe('7');
    expect(formatYear({ era: '', eraBefore: '' }, -7)).toBe(`${MINUS}7`);
    expect(formatYear({ era: '', eraBefore: 'before' }, 0)).toBe('1 before');
  });
});

describe('dates as compact text', () => {
  it('are written like ISO dates', () => {
    expect(dateToString({ year: 1022, month: 9, day: 17 })).toBe('1022-09-17');
    expect(dateToString({ year: 7, month: 1, day: 1 })).toBe('0007-01-01');
    expect(dateToString({ year: 0, month: 13, day: 28 })).toBe('0000-13-28');
    expect(dateToString({ year: -3, month: 2, day: 11 })).toBe('-0003-02-11');
    expect(dateToString({ year: 1020, intercalary: 1, day: 1 })).toBe('1020-i1-01');
    expect(dateToString({ year: 1234567, month: 100, day: 1000 })).toBe('1234567-100-1000');
  });

  it('are read back', () => {
    expect(parseDate('1022-09-17')).toEqual({ year: 1022, month: 9, day: 17 });
    expect(parseDate(' 1022-9-17 ')).toEqual({ year: 1022, month: 9, day: 17 });
    expect(parseDate('-0003-02-11')).toEqual({ year: -3, month: 2, day: 11 });
    expect(parseDate('1020-i1-01')).toEqual({ year: 1020, intercalary: 1, day: 1 });
    expect(Object.is(parseDate('-0000-01-01')!.year, 0)).toBe(true);
    for (const bad of ['', 'today', '1022-09', '1022-00-17', '1022-09-00', '1022/09/17', '1022-i0-1', '10-x-1', 12, null, undefined, {}]) {
      expect(parseDate(bad)).toBeNull();
    }
  });

  it('round-trip every kind of date in every preset and in random calendars', () => {
    const random = seeded(808);
    const calendars = [...PRESETS.map((p) => createCalendar(p.definition)), ...Array.from({ length: 40 }, () => createCalendar(randomDefinition(random)))];
    for (const calendar of calendars) {
      for (let i = 0; i < 2000; i++) {
        const days = between(random, calendar.yearStart(-12_000), calendar.yearStart(12_000));
        const date = calendar.fromDays(days);
        const text = dateToString(date);
        expect(parseDate(text)).toEqual(date);
        expect(calendar.format(days, 'numeric')).toBe(text);
        // The other styles never throw and never come back empty.
        expect(calendar.format(days, 'full').length).toBeGreaterThan(0);
        expect(calendar.format(days, 'short').length).toBeGreaterThan(0);
      }
    }
  });
});

describe('a calendar in sentences', () => {
  it('describes the Selunnan Reckoning', () => {
    expect(describeCalendar(createCalendar(SELUNNAN))).toBe(
      [
        'Selunnan Reckoning has 13 months of 28 days each, 364 days in an ordinary year. The months are Frostmoon, Thawmoon, Seedmoon, Rainmoon, Bloommoon, Sunmoon, Highmoon, Ripemoon, Harvestmoon, Mistmoon, Leafmoon, Embermoon and Darkmoon.',
        'Outside the months: Midyear Day (in leap years only) follows Highmoon and stands outside the week.',
        'A week has 7 days: Solday, Monday, Tideday, Windday, Hearthday, Fieldday and Restday.',
        'Every 5th year adds a day to Midyear Day. An average year is 364.2 days long.',
        'Years are written like "1 FS"; before that they count back from "1 Before the Founding". Day 1 of year 1 is 15 February 1008 in the Gregorian calendar.',
        'It follows 2 moons: Selen (a cycle of 29.5 days) and Kair (a cycle of 41 days).',
        "Holidays: Firstday (1 Frostmoon), Spring Market (the 2nd Fieldday of Seedmoon), Midyear Day (Midyear Day), Harvest Fair (9 Harvestmoon), Founders' Day (21 Harvestmoon) and Lantern Night (the 1st full moon of Selen in Darkmoon).",
      ].join('\n\n'),
    );
  });

  it('describes the Gregorian calendar and its exceptions', () => {
    const text = describeCalendar(createCalendar(GREGORIAN));
    expect(text).toContain('Gregorian calendar has 12 months, 365 days in an ordinary year.');
    expect(text).toContain('January (31), February (28)');
    expect(text).toContain('Every 4th year adds a day to February, except every 100th, unless it is also a 400th. An average year is 365.2425 days long.');
    expect(text).toContain('Day 1 of year 1 is 1 January 1 in the Gregorian calendar.');
    expect(text).toContain('Earth Hour (the last Saturday of March)');
    expect(text).toContain('It follows 1 moon: Moon (a cycle of 29.530588 days).');
  });

  it('describes the rest', () => {
    const tidewatch = describeCalendar(createCalendar(TIDEWATCH));
    expect(tidewatch).toContain("It has no link to Earth's calendar.");
    expect(tidewatch).toContain('Bright Night (every full moon of Ila)');
    expect(tidewatch).toContain('Every 3rd year adds a day to Lumen. Every 30th year adds a day to Farrow.');
    const meridian = describeCalendar(createCalendar(MERIDIAN));
    expect(meridian).toContain('Outside the months: Festival (5 days) closes the year and stands outside the week.');
    expect(meridian).toContain('Festival of Labour (day 3 of Festival)');
    const kharan = describeCalendar(createCalendar(KHARAN));
    expect(kharan).toContain('Dawnturn opens the year and counts in the week. Duskturn closes the year and counts in the week.');
    expect(kharan).toContain('the year before year 1 is "0 KY".');
    expect(kharan).toContain('Night of Tolu (the last full moon of Tolu in the year)');
    expect(kharan).toContain('Dark of Besh (the 1st new moon of Besh in Hadd)');
    const bare = describeCalendar(createCalendar({}));
    expect(bare).toContain('This calendar has 1 month, 30 days in an ordinary year.');
    expect(bare).toContain('There are no leap years: every year is the same length.');
    expect(bare).toContain('A week has 1 day: Day 1.');
  });

  it('never fails or runs on, whatever the calendar', () => {
    const random = seeded(2);
    for (let i = 0; i < 300; i++) {
      const calendar = createCalendar(randomDefinition(random));
      expect(describeCalendar(calendar)).not.toMatch(/undefined|NaN|\[object/);
      const summary = summarizeCalendar(calendar);
      expect(summary).not.toMatch(/undefined|NaN|\[object/);
      expect(summary.length).toBeLessThanOrEqual(600);
      expect(describeDay(calendar, between(random, -100_000, 100_000))).not.toMatch(/undefined|NaN|\[object/);
    }
  });

  it('sums a calendar up in a line', () => {
    expect(summarizeCalendar(createCalendar(SELUNNAN))).toBe(
      'Selunnan Reckoning: 13 months of 28 days, 364 days a year, weeks of 7 days, leap years, 2 moons and 6 holidays. Years are written like "1 FS".',
    );
    expect(summarizeCalendar(createCalendar({}))).toBe('A calendar: 1 month, 30 days a year and weeks of 1 day. Years are written like "1".');
    const long = createCalendar({ ...SELUNNAN, name: 'N'.repeat(80), era: 'E'.repeat(20) });
    expect(summarizeCalendar(long).length).toBeLessThanOrEqual(600);
  });

  it('describes a day', () => {
    const selunnan = createCalendar(SELUNNAN);
    const founders = selunnan.toDays({ year: 1022, month: 9, day: 21 });
    expect(describeDay(selunnan, founders)).toMatch(/^Restday, 21 Harvestmoon 1022 FS\. 16 November 2026 on Earth\. Selen is [a-z ]+; Kair is [a-z ]+\. Holiday: Founders' Day\.$/);
    const tidewatch = createCalendar(TIDEWATCH);
    expect(describeDay(tidewatch, 0)).toBe('Ebbday, 1 Ashar 1 TC. Ila is new. Holiday: Turning of the Count.');
    expect(describeDay(createCalendar({}), 3)).toBe('Day 1, 4 Month 1 1.');
  });

  it('has its small words right', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 100, 101, 111, 112, 400].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '100th', '101st', '111th', '112th', '400th',
    ]);
    expect(formatGregorian({ year: 1792, month: 9, day: 22 })).toBe('22 September 1792');
    expect(formatGregorian({ year: -43, month: 3, day: 15 })).toBe('15 March 44 BCE');
    expect(formatGregorian({ year: 0, month: 1, day: 1 })).toBe('1 January 1 BCE');
  });
});
