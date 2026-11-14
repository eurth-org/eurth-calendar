import { describe, expect, it } from 'vitest';
import {
  formatIsoDate,
  gregorianFromJsDate,
  gregorianMonthLength,
  gregorianToRataDie,
  isGregorianLeapYear,
  isValidGregorian,
  parseIsoDate,
  rataDieToGregorian,
  rataDieWeekday,
} from '../../src/engine/index.js';
import { between, seeded } from './helpers.js';

const DAY = 86_400_000;
/** The rata die of a JavaScript time: 1970-01-01 is rata die 719163. */
const rataDieOfTime = (time: number): number => Math.floor(time / DAY) + 719163;

describe('the Gregorian calendar', () => {
  it('knows its anchors', () => {
    expect(gregorianToRataDie({ year: 1, month: 1, day: 1 })).toBe(1);
    expect(gregorianToRataDie({ year: 1970, month: 1, day: 1 })).toBe(719163);
    expect(gregorianToRataDie({ year: 2000, month: 1, day: 1 })).toBe(730120);
    expect(gregorianToRataDie({ year: 0, month: 12, day: 31 })).toBe(0);
    // The Julian day number of 1 January 2000 is 2451545; rata die 1 is Julian day 1721426.
    expect(gregorianToRataDie({ year: 2000, month: 1, day: 1 }) + 1721425).toBe(2451545);
    expect(rataDieToGregorian(1)).toEqual({ year: 1, month: 1, day: 1 });
    expect(rataDieToGregorian(0)).toEqual({ year: 0, month: 12, day: 31 });
    expect(rataDieToGregorian(-365)).toEqual({ year: 0, month: 1, day: 1 });
  });

  it('knows its leap years', () => {
    expect([1900, 2000, 2023, 2024, 2100, 2400, 0, -4, -100, -400].map(isGregorianLeapYear)).toEqual([
      false, true, false, true, false, true, true, true, false, true,
    ]);
    expect(gregorianMonthLength(2024, 2)).toBe(29);
    expect(gregorianMonthLength(2023, 2)).toBe(28);
    expect([1, 3, 4, 6, 9, 11, 12].map((m) => gregorianMonthLength(2023, m))).toEqual([31, 31, 30, 30, 30, 30, 31]);
  });

  it('knows the days of the week', () => {
    expect(rataDieWeekday(1)).toBe(1); // 1 January of year 1, a Monday
    expect(rataDieWeekday(gregorianToRataDie({ year: 2026, month: 11, day: 12 }))).toBe(4); // a Thursday
    expect(rataDieWeekday(gregorianToRataDie({ year: 1969, month: 7, day: 20 }))).toBe(7); // a Sunday
    expect(rataDieWeekday(0)).toBe(7);
  });

  it('agrees with the JavaScript Date on 400,000 days in a row', () => {
    // From 1 January 1600 on: more than a whole 400-year cycle.
    const start = Date.UTC(1600, 0, 1);
    for (let i = 0; i < 400_000; i++) {
      const time = start + i * DAY;
      const js = new Date(time);
      const rataDie = rataDieOfTime(time);
      const date = rataDieToGregorian(rataDie);
      if (date.year !== js.getUTCFullYear() || date.month !== js.getUTCMonth() + 1 || date.day !== js.getUTCDate()) {
        throw new Error(`Day ${rataDie} gave ${JSON.stringify(date)}, the Date says ${js.toISOString()}`);
      }
      if (gregorianToRataDie(date) !== rataDie) throw new Error(`Day ${rataDie} did not come back from ${JSON.stringify(date)}`);
      if (rataDieWeekday(rataDie) !== ((js.getUTCDay() + 6) % 7) + 1) throw new Error(`Wrong weekday for day ${rataDie}`);
    }
  });

  it('agrees with the JavaScript Date on random days across 500,000 years', () => {
    const random = seeded(2004);
    for (let i = 0; i < 300_000; i++) {
      const rataDie = between(random, -90_000_000, 90_000_000);
      const js = new Date((rataDie - 719163) * DAY);
      const date = rataDieToGregorian(rataDie);
      if (date.year !== js.getUTCFullYear() || date.month !== js.getUTCMonth() + 1 || date.day !== js.getUTCDate()) {
        throw new Error(`Day ${rataDie} gave ${JSON.stringify(date)}, the Date says ${js.toISOString()}`);
      }
      if (gregorianToRataDie(date) !== rataDie) throw new Error(`Day ${rataDie} did not come back`);
    }
  });

  it('round-trips far beyond what a Date can hold', () => {
    const random = seeded(7);
    for (let i = 0; i < 200_000; i++) {
      const rataDie = between(random, -4_000_000_000, 4_000_000_000);
      const date = rataDieToGregorian(rataDie);
      expect(isValidGregorian(date)).toBe(true);
      if (gregorianToRataDie(date) !== rataDie) throw new Error(`Day ${rataDie} did not come back`);
    }
  });

  it('checks dates', () => {
    expect(isValidGregorian({ year: 2024, month: 2, day: 29 })).toBe(true);
    expect(isValidGregorian({ year: 2023, month: 2, day: 29 })).toBe(false);
    expect(isValidGregorian({ year: 2023, month: 13, day: 1 })).toBe(false);
    expect(isValidGregorian({ year: 2023, month: 0, day: 1 })).toBe(false);
    expect(isValidGregorian({ year: 2023, month: 4, day: 31 })).toBe(false);
    expect(isValidGregorian({ year: 2023.5, month: 4, day: 3 })).toBe(false);
    expect(isValidGregorian({ year: 2023, month: 4, day: 1.5 })).toBe(false);
  });

  it('reads and writes dates as text', () => {
    expect(formatIsoDate({ year: 2026, month: 11, day: 12 })).toBe('2026-11-12');
    expect(formatIsoDate({ year: 8, month: 2, day: 3 })).toBe('0008-02-03');
    expect(formatIsoDate({ year: -43, month: 3, day: 15 })).toBe('-0043-03-15');
    expect(formatIsoDate({ year: 12345, month: 1, day: 1 })).toBe('12345-01-01');
    expect(parseIsoDate('2026-11-12')).toEqual({ year: 2026, month: 11, day: 12 });
    expect(parseIsoDate(' 0008-2-3 ')).toEqual({ year: 8, month: 2, day: 3 });
    expect(parseIsoDate('-0043-03-15')).toEqual({ year: -43, month: 3, day: 15 });
    expect(parseIsoDate('+2026-11-12')).toEqual({ year: 2026, month: 11, day: 12 });
    expect(parseIsoDate('0000-01-01')).toEqual({ year: 0, month: 1, day: 1 });
    for (const bad of ['2023-02-29', '2023-13-01', 'yesterday', '', '2023/01/01', '2023-01', null, 20230101, {}]) {
      expect(parseIsoDate(bad)).toBeNull();
    }
    const random = seeded(99);
    for (let i = 0; i < 20_000; i++) {
      const date = rataDieToGregorian(between(random, -5_000_000, 5_000_000));
      expect(parseIsoDate(formatIsoDate(date))).toEqual(date);
    }
  });

  it('reads the date off a JavaScript Date', () => {
    const date = new Date(Date.UTC(2026, 10, 12, 23, 30));
    expect(gregorianFromJsDate(date, { utc: true })).toEqual({ year: 2026, month: 11, day: 12 });
    expect(gregorianFromJsDate(new Date(2026, 10, 12, 8, 0))).toEqual({ year: 2026, month: 11, day: 12 });
  });
});
