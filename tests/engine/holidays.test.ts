import { describe, expect, it } from 'vitest';
import { createCalendar, GREGORIAN, KHARAN, MERIDIAN, moonOn, PRESETS, SELUNNAN, TIDEWATCH } from '../../src/engine/index.js';
import { between, randomDefinition, seeded } from './helpers.js';

describe('holidays', () => {
  it('fall on fixed dates, and skip the years that lack the date', () => {
    const calendar = createCalendar(GREGORIAN);
    const names = (year: number): string[] => calendar.holidays(year).map((h) => h.name);
    expect(names(2024)).toEqual(["New Year's Day", 'Leap Day', 'Earth Hour', "New Year's Eve"]);
    expect(names(2023)).toEqual(["New Year's Day", 'Earth Hour', "New Year's Eve"]);
    expect(calendar.holidays(2024)[1]!.date).toEqual({ year: 2024, month: 2, day: 29 });
  });

  it('find the nth and the last weekday of a month', () => {
    const calendar = createCalendar(GREGORIAN);
    const earthHour = (year: number): unknown => calendar.holidays(year).find((h) => h.name === 'Earth Hour')!.date;
    // The last Saturday of March.
    expect(earthHour(2026)).toEqual({ year: 2026, month: 3, day: 28 });
    expect(earthHour(2025)).toEqual({ year: 2025, month: 3, day: 29 });
    expect(earthHour(2024)).toEqual({ year: 2024, month: 3, day: 30 });

    const selunnan = createCalendar(SELUNNAN);
    // The second Fieldday of Seedmoon is always the 13th: every month starts on Solday.
    expect(selunnan.holidays(1022).find((h) => h.name === 'Spring Market')!.date).toEqual({ year: 1022, month: 3, day: 13 });

    // A fifth Monday exists in some months only.
    const fifth = createCalendar({ ...GREGORIAN, holidays: [{ type: 'weekday', name: 'Fifth Monday', month: 2, weekday: 1, nth: 5 }] });
    expect(fifth.holidays(2023)).toEqual([]);
    expect(fifth.holidays(2044).map((h) => h.date)).toEqual([{ year: 2044, month: 2, day: 29 }]);
  });

  it('follow the moons', () => {
    const tidewatch = createCalendar(TIDEWATCH);
    const bright = tidewatch.holidays(12).filter((h) => h.name === 'Bright Night');
    // Every full moon of a 354-day year.
    expect(bright.length).toBe(12);
    for (const night of bright) expect(moonOn(TIDEWATCH.moons[0]!, night.days).phase).toBe('full');

    const selunnan = createCalendar(SELUNNAN);
    let withLantern = 0;
    for (let year = 1000; year < 1100; year++) {
      const lantern = selunnan.holidays(year).filter((h) => h.name === 'Lantern Night');
      // Darkmoon has 28 days and Selen takes 29.5, so some years have no full moon in it.
      expect(lantern.length).toBeLessThanOrEqual(1);
      for (const night of lantern) {
        withLantern++;
        expect(night.date).toMatchObject({ year, month: 13 });
        expect(moonOn(SELUNNAN.moons[0]!, night.days).phase).toBe('full');
      }
    }
    expect(withLantern).toBeGreaterThan(85);
    expect(withLantern).toBeLessThan(100);

    const kharan = createCalendar(KHARAN);
    const tolu = kharan.holidays(7).filter((h) => h.name === 'Night of Tolu');
    expect(tolu.length).toBe(1);
    // The last full moon of the year: no other follows it before the year ends.
    const layout = kharan.year(7);
    expect(kharan.moonEvents(tolu[0]!.days + 1, layout.start + layout.days - 1, 3).filter((e) => e.phase === 'full')).toEqual([]);
  });

  it('can sit on intercalary days, including ones that only some years have', () => {
    const calendar = createCalendar(MERIDIAN);
    const names = (year: number): string[] => calendar.holidays(year).map((h) => h.name);
    expect(names(3)).toEqual(['Founding Day', 'Assembly Day', 'Festival of Virtue', 'Festival of Labour']);
    expect(names(4)).toEqual(['Founding Day', 'Assembly Day', 'Festival of Virtue', 'Festival of Labour', 'Festival of the Republic']);
    expect(calendar.holidays(4)[4]!.date).toEqual({ year: 4, intercalary: 1, day: 6 });
    // The first Tenthday of Budmonth is the 10th: months are three weeks of ten.
    expect(calendar.holidays(4)[1]!.date).toEqual({ year: 4, month: 7, day: 10 });
  });

  it('are listed by day and by span', () => {
    const calendar = createCalendar(GREGORIAN);
    const newYear = calendar.toDays({ year: 2026, month: 1, day: 1 });
    expect(calendar.holidaysOn(newYear).map((h) => h.name)).toEqual(["New Year's Day"]);
    expect(calendar.holidaysOn(newYear + 1)).toEqual([]);
    expect(calendar.day(newYear).holidays.map((h) => h.name)).toEqual(["New Year's Day"]);
    const span = calendar.holidaysBetween(newYear - 1, newYear + 366);
    expect(span.map((h) => h.name)).toEqual(["New Year's Eve", "New Year's Day", 'Earth Hour', "New Year's Eve", "New Year's Day", ]);
    expect(calendar.holidaysBetween(newYear + 5, newYear)).toEqual([]);
    expect(() => calendar.holidaysBetween(0, 400_000)).toThrow(RangeError);
  });

  it('hand out copies, so a caller cannot spoil the next answer', () => {
    const calendar = createCalendar(GREGORIAN);
    const first = calendar.holidays(2026);
    first[0]!.name = 'Changed';
    (first[0]!.date as { day: number }).day = 99;
    expect(calendar.holidays(2026)[0]).toMatchObject({ name: "New Year's Day", date: { year: 2026, month: 1, day: 1 } });
  });

  it('are always real, ordered dates inside their year, for presets and random calendars alike', () => {
    const random = seeded(606);
    const calendars = [...PRESETS.map((p) => createCalendar(p.definition)), ...Array.from({ length: 60 }, () => createCalendar(randomDefinition(random)))];
    for (const calendar of calendars) {
      for (let i = 0; i < 40; i++) {
        const year = between(random, -5000, 5000);
        const layout = calendar.year(year);
        const found = calendar.holidays(year);
        for (const [n, holiday] of found.entries()) {
          expect(calendar.isValidDate(holiday.date)).toBe(true);
          expect(calendar.toDays(holiday.date)).toBe(holiday.days);
          expect(holiday.days).toBeGreaterThanOrEqual(layout.start);
          expect(holiday.days).toBeLessThan(layout.start + layout.days);
          expect(holiday.name).toBe(calendar.definition.holidays[holiday.holiday - 1]!.name);
          if (n > 0) expect(holiday.days).toBeGreaterThanOrEqual(found[n - 1]!.days);
        }
      }
    }
  });
});
