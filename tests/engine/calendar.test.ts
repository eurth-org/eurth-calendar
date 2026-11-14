import { describe, expect, it } from 'vitest';
import {
  createCalendar,
  GREGORIAN,
  gregorianToRataDie,
  isGregorianLeapYear,
  KHARAN,
  LIMITS,
  MERIDIAN,
  PRESETS,
  rataDieToGregorian,
  rataDieWeekday,
  SELUNNAN,
  TIDEWATCH,
  type CalendarDate,
} from '../../src/engine/index.js';
import { between, naiveRuleMatches, naiveWalk, naiveYear, randomDefinition, seeded } from './helpers.js';

const same = (a: CalendarDate, b: CalendarDate): boolean => JSON.stringify(a) === JSON.stringify(b);

describe('every preset', () => {
  for (const preset of PRESETS) {
    const calendar = createCalendar(preset.definition);

    it(`${preset.id}: is a clean definition`, () => {
      expect(calendar.issues).toEqual([]);
      expect(calendar.definition).toEqual(preset.definition);
    });

    it(`${preset.id}: round-trips a million random day counts across twenty million years`, () => {
      const random = seeded(preset.id.length * 7919);
      const span = calendar.maxDays - calendar.minDays;
      for (let i = 0; i < 1_000_000; i++) {
        const days = calendar.minDays + Math.floor(random() * (span + 1));
        const date = calendar.fromDays(days);
        const back = calendar.toDays(date);
        if (back !== days) throw new Error(`Day ${days} became ${JSON.stringify(date)} and came back as ${back}`);
      }
    });

    it(`${preset.id}: agrees with counting every day of 4000 years, one by one`, () => {
      const walk = naiveWalk(calendar.definition, -1999, 2000);
      expect(walk[0]!.days).toBe(calendar.yearStart(-1999));
      expect(walk[walk.length - 1]!.days).toBe(calendar.yearStart(2001) - 1);
      for (const expected of walk) {
        const date = calendar.fromDays(expected.days);
        if (!same(date, expected.date)) {
          throw new Error(`Day ${expected.days}: the engine says ${JSON.stringify(date)}, counting says ${JSON.stringify(expected.date)}`);
        }
        if (calendar.toDays(expected.date) !== expected.days) throw new Error(`${JSON.stringify(expected.date)} is not day ${expected.days}`);
        if (calendar.weekday(expected.days) !== expected.weekday) {
          throw new Error(`Day ${expected.days}: weekday ${String(calendar.weekday(expected.days))}, counting says ${String(expected.weekday)}`);
        }
      }
    });

    it(`${preset.id}: years follow one another without a gap, near and far`, () => {
      const random = seeded(31);
      const years = [calendar.minYear, calendar.minYear + 1, -1, 0, 1, 2, calendar.maxYear - 1, calendar.maxYear];
      for (let i = 0; i < 20_000; i++) years.push(between(random, calendar.minYear, calendar.maxYear));
      for (const year of years) {
        const layout = calendar.year(year);
        expect(layout.start).toBe(calendar.yearStart(year));
        expect(layout.days).toBe(calendar.yearLength(year));
        expect(calendar.yearStart(year + 1) - layout.start).toBe(layout.days);
        expect(layout.days).toBe(naiveYear(calendar.definition, year).reduce((sum, part) => sum + part.days, 0));
        expect(layout.leap).toBe(calendar.definition.leap.some((rule) => naiveRuleMatches(rule, year)));
        expect(calendar.yearOf(layout.start)).toBe(year);
        expect(calendar.yearOf(layout.start + layout.days - 1)).toBe(year);
        let next = layout.start;
        for (const part of layout.parts) {
          expect(part.start).toBe(next);
          next += part.days;
        }
        expect(next).toBe(layout.start + layout.days);
      }
    });

    it(`${preset.id}: holds at the edges of its range and refuses what lies beyond`, () => {
      expect(calendar.fromDays(calendar.minDays).year).toBe(-LIMITS.maxYear);
      expect(calendar.fromDays(calendar.maxDays).year).toBe(LIMITS.maxYear);
      expect(calendar.toDays(calendar.fromDays(calendar.minDays))).toBe(calendar.minDays);
      expect(calendar.toDays(calendar.fromDays(calendar.maxDays))).toBe(calendar.maxDays);
      expect(() => calendar.fromDays(calendar.minDays - 1)).toThrow(RangeError);
      expect(() => calendar.fromDays(calendar.maxDays + 1)).toThrow(RangeError);
      expect(() => calendar.fromDays(0.5)).toThrow(RangeError);
      expect(() => calendar.fromDays(Number.NaN)).toThrow(RangeError);
      expect(() => calendar.yearLength(LIMITS.maxYear + 1)).toThrow(RangeError);
      expect(() => calendar.toDays({ year: LIMITS.maxYear + 1, month: 1, day: 1 })).toThrow(RangeError);
      expect(Number.isSafeInteger(calendar.minDays) && Number.isSafeInteger(calendar.maxDays)).toBe(true);
    });
  }
});

describe('the Gregorian preset', () => {
  const calendar = createCalendar(GREGORIAN);

  it('matches the Gregorian arithmetic it was not built from, on a million random days', () => {
    const random = seeded(1582);
    for (let i = 0; i < 1_000_000; i++) {
      const days = between(random, calendar.minDays, calendar.maxDays);
      const date = calendar.fromDays(days);
      const expected = rataDieToGregorian(days + 1);
      if (!('month' in date) || date.year !== expected.year || date.month !== expected.month || date.day !== expected.day) {
        throw new Error(`Day ${days}: ${JSON.stringify(date)} is not ${JSON.stringify(expected)}`);
      }
      if (calendar.weekday(days) !== rataDieWeekday(days + 1)) throw new Error(`Wrong weekday for day ${days}`);
    }
  });

  it('is its own Earth date', () => {
    const days = calendar.fromGregorian({ year: 2026, month: 11, day: 12 })!;
    expect(days).toBe(gregorianToRataDie({ year: 2026, month: 11, day: 12 }) - 1);
    expect(calendar.fromDays(days)).toEqual({ year: 2026, month: 11, day: 12 });
    expect(calendar.toGregorian(days)).toEqual({ year: 2026, month: 11, day: 12 });
    expect(calendar.format(days, 'full')).toBe('Thursday, 12 November 2026 CE');
    expect(calendar.dayOfYear(days)).toBe(316);
  });

  it('has the right leap years and month lengths', () => {
    for (const year of [1600, 1700, 1900, 2000, 2023, 2024, 2100, 0, -4, -100, -400]) {
      expect(calendar.isLeapYear(year)).toBe(isGregorianLeapYear(year));
      expect(calendar.yearLength(year)).toBe(isGregorianLeapYear(year) ? 366 : 365);
      expect(calendar.monthLength(year, 2)).toBe(isGregorianLeapYear(year) ? 29 : 28);
    }
    expect(calendar.daysPerYear).toBe(365);
    expect(calendar.meanYear).toBeCloseTo(365.2425, 10);
  });

  it('refuses dates that do not exist', () => {
    expect(calendar.isValidDate({ year: 2024, month: 2, day: 29 })).toBe(true);
    for (const date of [
      { year: 2023, month: 2, day: 29 },
      { year: 2023, month: 13, day: 1 },
      { year: 2023, month: 0, day: 1 },
      { year: 2023, month: 1, day: 0 },
      { year: 2023, month: 1, day: 32 },
      { year: 2023.5, month: 1, day: 1 },
      { year: 2023, month: 1.5, day: 1 },
      { year: 2023, intercalary: 1, day: 1 },
    ]) {
      expect(calendar.isValidDate(date)).toBe(false);
      expect(() => calendar.toDays(date)).toThrow(RangeError);
    }
    expect(calendar.isValidDate(null as unknown as CalendarDate)).toBe(false);
    expect(() => calendar.fromGregorian({ year: 2023, month: 2, day: 30 })).toThrow(RangeError);
    expect(() => calendar.monthLength(2023, 13)).toThrow(RangeError);
  });
});

describe('the Selunnan Reckoning', () => {
  const calendar = createCalendar(SELUNNAN);

  it("puts 12 November 2026 on 17 Harvestmoon 1022 FS, as the mock-up's converter shows", () => {
    const days = calendar.fromGregorian({ year: 2026, month: 11, day: 12 })!;
    expect(calendar.fromDays(days)).toEqual({ year: 1022, month: 9, day: 17 });
    expect(calendar.format(days)).toBe('17 Harvestmoon 1022 FS');
    expect(calendar.toGregorian(calendar.toDays({ year: 1, month: 1, day: 1 }))).toEqual({ year: 1008, month: 2, day: 15 });
  });

  it('starts every month on Solday, for ever', () => {
    const random = seeded(13);
    for (let i = 0; i < 2000; i++) {
      const year = between(random, -50_000, 50_000);
      for (const part of calendar.year(year).parts) {
        if (part.kind === 'month') expect(calendar.weekday(part.start)).toBe(1);
      }
    }
  });

  it('adds Midyear Day every fifth year, outside the week', () => {
    expect(calendar.yearLength(1022)).toBe(364);
    expect(calendar.yearLength(1020)).toBe(365);
    expect(calendar.intercalaryLength(1022, 1)).toBe(0);
    expect(calendar.intercalaryLength(1020, 1)).toBe(1);
    expect(calendar.isValidDate({ year: 1022, intercalary: 1, day: 1 })).toBe(false);
    const midyear = calendar.toDays({ year: 1020, intercalary: 1, day: 1 });
    expect(calendar.fromDays(midyear - 1)).toEqual({ year: 1020, month: 7, day: 28 });
    expect(calendar.fromDays(midyear + 1)).toEqual({ year: 1020, month: 8, day: 1 });
    expect(calendar.weekday(midyear - 1)).toBe(7);
    expect(calendar.weekday(midyear)).toBeNull();
    expect(calendar.weekday(midyear + 1)).toBe(1);
    expect(calendar.format(midyear, 'full')).toBe('Midyear Day 1020 FS');
    expect(calendar.dayOfYear(midyear)).toBe(197);
  });
});

describe('the other presets', () => {
  it('Meridian: festival days close the year outside the week, six in a leap year', () => {
    const calendar = createCalendar(MERIDIAN);
    expect(calendar.toGregorian(0)).toEqual({ year: 1792, month: 9, day: 22 });
    expect(calendar.yearLength(1)).toBe(365);
    expect(calendar.yearLength(4)).toBe(366);
    expect(calendar.yearLength(128)).toBe(365);
    expect(calendar.yearLength(256)).toBe(365);
    expect(calendar.meanYear).toBeCloseTo(365.2421875, 10);
    const festival = calendar.toDays({ year: 4, intercalary: 1, day: 6 });
    expect(calendar.weekday(festival)).toBeNull();
    expect(calendar.fromDays(festival + 1)).toEqual({ year: 5, month: 1, day: 1 });
    expect(calendar.weekday(festival + 1)).toBe(1);
    expect(calendar.weekday(calendar.toDays({ year: 4, month: 12, day: 30 }))).toBe(10);
    expect(calendar.isValidDate({ year: 3, intercalary: 1, day: 6 })).toBe(false);
    expect(calendar.format(festival)).toBe('6 Festival 4 YR');
  });

  it('Tidewatch: eleven leap days in thirty years, and no link to Earth', () => {
    const calendar = createCalendar(TIDEWATCH);
    expect(calendar.linked).toBe(false);
    expect(calendar.toGregorian(0)).toBeNull();
    expect(calendar.fromGregorian({ year: 2026, month: 1, day: 1 })).toBeNull();
    expect(calendar.yearStart(31) - calendar.yearStart(1)).toBe(30 * 354 + 11);
    expect(calendar.yearLength(30)).toBe(356);
    expect(calendar.monthLength(30, 6)).toBe(30);
    expect(calendar.monthLength(30, 12)).toBe(30);
    expect(calendar.meanYear).toBeCloseTo(354 + 11 / 30, 10);
  });

  it('Tidewatch: every month for 3000 years starts within a day of the new moon', () => {
    const calendar = createCalendar(TIDEWATCH);
    for (let year = 1; year <= 3000; year++) {
      for (const part of calendar.year(year).parts) {
        const near = calendar.moonEvents(part.start - 1, part.start + 1, 1).filter((event) => event.phase === 'new');
        if (near.length !== 1) throw new Error(`No new moon at the start of ${part.name} ${year}`);
      }
    }
  });

  it('Kharan: a long year with a leap day except every sixtieth year', () => {
    const calendar = createCalendar(KHARAN);
    expect(calendar.daysPerYear).toBe(412);
    expect(calendar.yearLength(3)).toBe(413);
    expect(calendar.yearLength(60)).toBe(412);
    expect(calendar.yearLength(120)).toBe(412);
    expect(calendar.fromDays(0)).toEqual({ year: 1, intercalary: 1, day: 1 });
    expect(calendar.weekday(0)).toBe(1);
    expect(calendar.fromDays(1)).toEqual({ year: 1, month: 1, day: 1 });
    expect(calendar.fromDays(-1)).toEqual({ year: 0, intercalary: 2, day: 1 });
    expect(calendar.format(-1)).toBe('Duskturn 0 KY');
    expect(calendar.format(calendar.yearStart(-1))).toBe(`Dawnturn ${String.fromCharCode(0x2212)}1 KY`);
  });
});

describe('random calendars', () => {
  it('agree with counting day by day, for 150 calendars nobody would design', () => {
    const random = seeded(20041225);
    let checked = 0;
    for (let n = 0; n < 150; n++) {
      const definition = randomDefinition(random);
      const calendar = createCalendar(definition);
      expect(calendar.issues).toEqual([]);
      const walk = naiveWalk(calendar.definition, -60, 61);
      for (const expected of walk) {
        const date = calendar.fromDays(expected.days);
        if (!same(date, expected.date) || calendar.weekday(expected.days) !== expected.weekday || calendar.toDays(expected.date) !== expected.days) {
          throw new Error(
            `Calendar ${n}, day ${expected.days}: engine ${JSON.stringify(date)} weekday ${String(calendar.weekday(expected.days))}, ` +
              `counting ${JSON.stringify(expected.date)} weekday ${String(expected.weekday)}\n${JSON.stringify(definition)}`,
          );
        }
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(500_000);
  });

  it('round-trip two million random day counts across their whole range', () => {
    const random = seeded(424242);
    for (let n = 0; n < 200; n++) {
      const calendar = createCalendar(randomDefinition(random));
      const span = calendar.maxDays - calendar.minDays;
      for (let i = 0; i < 10_000; i++) {
        const days = calendar.minDays + Math.floor(random() * (span + 1));
        const date = calendar.fromDays(days);
        if (calendar.toDays(date) !== days) throw new Error(`Calendar ${n}: day ${days} did not come back from ${JSON.stringify(date)}`);
        const year = calendar.yearOf(days);
        if (calendar.yearStart(year) > days || calendar.yearStart(year + 1) <= days) throw new Error(`Calendar ${n}: day ${days} is not in year ${year}`);
      }
    }
  });

  it('count leap years the same way far from year 1 as near it', () => {
    const random = seeded(77);
    for (let n = 0; n < 100; n++) {
      const calendar = createCalendar(randomDefinition(random));
      const first = between(random, -9_000_000, 9_000_000);
      let start = calendar.yearStart(first);
      for (let year = first; year < first + 300; year++) {
        const length = naiveYear(calendar.definition, year).reduce((sum, part) => sum + part.days, 0);
        expect(calendar.yearLength(year)).toBe(length);
        start += length;
        expect(calendar.yearStart(year + 1)).toBe(start);
      }
    }
  });
});

describe('the largest calendar the limits allow', () => {
  it('still does its sums exactly', () => {
    const calendar = createCalendar({
      months: Array.from({ length: LIMITS.months }, (_, i) => ({ name: `M${i + 1}`, days: LIMITS.monthDays })),
      intercalary: Array.from({ length: LIMITS.intercalary }, (_, i) => ({ name: `I${i + 1}`, after: i, days: LIMITS.intercalaryDays, inWeek: i % 2 === 0 })),
      weekdays: Array.from({ length: LIMITS.weekdays }, (_, i) => `D${i + 1}`),
      leap: Array.from({ length: LIMITS.leapRules }, (_, i) => ({ every: i + 2, except: [7, 11, 13], days: LIMITS.leapDays, to: { month: i + 1 } })),
    });
    expect(calendar.issues).toEqual([]);
    expect(calendar.daysPerYear).toBe(120_000);
    expect(Number.isSafeInteger(calendar.minDays) && Number.isSafeInteger(calendar.maxDays)).toBe(true);
    const random = seeded(5);
    for (let i = 0; i < 100_000; i++) {
      const days = between(random, calendar.minDays, calendar.maxDays);
      if (calendar.toDays(calendar.fromDays(days)) !== days) throw new Error(`Day ${days} did not come back`);
    }
    const walk = naiveWalk(calendar.definition, 0, 1);
    for (let i = 0; i < walk.length; i += 97) {
      const expected = walk[i]!;
      expect(calendar.fromDays(expected.days)).toEqual(expected.date);
      expect(calendar.weekday(expected.days)).toBe(expected.weekday);
    }
  });

  it('and the smallest: one month of one day', () => {
    const calendar = createCalendar({ months: [{ name: 'Only', days: 1 }], weekdays: ['Today'], leap: [{ every: 2, except: [], days: 1000, to: { month: 1 } }] });
    expect(calendar.daysPerYear).toBe(1);
    const walk = naiveWalk(calendar.definition, -20, 20);
    for (const expected of walk) {
      expect(calendar.fromDays(expected.days)).toEqual(expected.date);
    }
    const random = seeded(6);
    for (let i = 0; i < 100_000; i++) {
      const days = between(random, calendar.minDays, calendar.maxDays);
      if (calendar.toDays(calendar.fromDays(days)) !== days) throw new Error(`Day ${days} did not come back`);
    }
  });
});
