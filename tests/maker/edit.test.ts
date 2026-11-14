import { describe, expect, it } from 'vitest';
import { createCalendar, GREGORIAN, KHARAN, LIMITS, MERIDIAN, normalizeCalendar, PRESETS, SELUNNAN, TIDEWATCH, type CalendarDefinition } from '../../src/engine/index.js';
import {
  addMonth,
  evenMonths,
  isVeryTidy,
  moveMonth,
  removeIntercalary,
  removeMonth,
  removeMoon,
  removeWeekday,
  setYearLength,
  tidyNote,
} from '../../src/maker/edit.js';
import { between, randomDefinition, seeded } from '../engine/helpers.js';

const frozen = (definition: CalendarDefinition): CalendarDefinition => createCalendar(definition).definition;
const holidayNames = (definition: CalendarDefinition): string[] => definition.holidays.map((holiday) => holiday.name);

describe('editing a calendar', () => {
  it('spreads a year evenly over its months', () => {
    expect(evenMonths(365, 12)).toEqual([31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30]);
    expect(evenMonths(364, 13)).toEqual(Array(13).fill(28));
    expect(evenMonths(5, 12)).toEqual(Array(12).fill(1));
    expect(evenMonths(10.4, 3.2)).toEqual([4, 3, 3]);
    expect(setYearLength(SELUNNAN, 400).months.map((m) => m.days).reduce((a, b) => a + b)).toBe(400);
    // Festival days count towards the total.
    const meridian = setYearLength(MERIDIAN, 400);
    expect(createCalendar(meridian).daysPerYear).toBe(400);
    expect(meridian.intercalary[0]!.days).toBe(5);
    expect(setYearLength(GREGORIAN, 1e9).months.every((m) => m.days === LIMITS.monthDays)).toBe(true);
    expect(setYearLength(GREGORIAN, -5).months.every((m) => m.days === 1)).toBe(true);
  });

  it('adds a month at the end, behind which the year still closes', () => {
    const next = addMonth(MERIDIAN);
    expect(next.months.length).toBe(13);
    expect(next.months[12]).toEqual({ name: 'Month 13', days: 30 });
    expect(next.intercalary[0]!.after).toBe(13);
    expect(addMonth(addMonth(MERIDIAN)).months[13]!.name).toBe('Month 14');
    const taken = addMonth({ ...GREGORIAN, months: GREGORIAN.months.map((m, i) => (i === 0 ? { ...m, name: 'Month 13' } : m)) });
    expect(taken.months[12]!.name).toBe('Month 14');
    const full = normalizeCalendar({ months: Array.from({ length: LIMITS.months }, (_, i) => ({ name: `M${i}`, days: 3 })) }).calendar;
    expect(addMonth(full).months.length).toBe(LIMITS.months);
  });

  it('removes a month and everything that hung on it', () => {
    const next = removeMonth(SELUNNAN, 9); // Harvestmoon, with Harvest Fair and Founders' Day
    expect(next.months.length).toBe(12);
    expect(next.months.map((m) => m.name)).not.toContain('Harvestmoon');
    expect(holidayNames(next)).toEqual(['Firstday', 'Spring Market', 'Midyear Day', 'Lantern Night']);
    // Lantern Night was in Darkmoon, month 13, and still is: now month 12.
    expect(next.holidays[3]).toMatchObject({ type: 'moon', month: 12 });
    expect(next.months[11]!.name).toBe('Darkmoon');
    // Midyear Day still follows Highmoon.
    expect(next.intercalary[0]!.after).toBe(7);

    const earlier = removeMonth(SELUNNAN, 2);
    expect(earlier.intercalary[0]!.after).toBe(6);
    expect(earlier.months[5]!.name).toBe('Highmoon');
    expect(earlier.holidays.find((h) => h.name === 'Spring Market')).toMatchObject({ month: 2 });

    // February goes, and its leap rule with it.
    const gregorian = removeMonth(GREGORIAN, 2);
    expect(gregorian.leap).toEqual([]);
    expect(holidayNames(gregorian)).toEqual(["New Year's Day", 'Earth Hour', "New Year's Eve"]);
    expect(gregorian.holidays[1]).toMatchObject({ month: 2 });

    // A calendar keeps its last month.
    const one = normalizeCalendar({ months: [{ name: 'Only', days: 9 }] }).calendar;
    expect(removeMonth(one, 1)).toEqual(one);
    expect(removeMonth(SELUNNAN, 99)).toEqual(SELUNNAN);
  });

  it('moves a month and keeps everything pointing at the same month', () => {
    const next = moveMonth(GREGORIAN, 2, 12); // February to the end of the year
    expect(next.months.map((m) => m.name).slice(0, 3)).toEqual(['January', 'March', 'April']);
    expect(next.months[11]!.name).toBe('February');
    expect(next.leap[0]!.to).toEqual({ month: 12 });
    expect(next.holidays.find((h) => h.name === 'Leap Day')).toMatchObject({ month: 12, day: 29 });
    expect(next.holidays.find((h) => h.name === 'Earth Hour')).toMatchObject({ month: 2 });
    expect(next.holidays.find((h) => h.name === "New Year's Eve")).toMatchObject({ month: 11 });
    expect(moveMonth(moveMonth(GREGORIAN, 2, 12), 12, 2)).toEqual(GREGORIAN);
    expect(moveMonth(GREGORIAN, 3, 3)).toEqual(GREGORIAN);
    expect(moveMonth(GREGORIAN, 0, 3)).toEqual(GREGORIAN);

    // Midyear Day goes where Highmoon goes; what closes the year still closes it.
    const selunnan = moveMonth(SELUNNAN, 7, 2);
    expect(selunnan.months[1]!.name).toBe('Highmoon');
    expect(selunnan.intercalary[0]!.after).toBe(2);
    expect(moveMonth(MERIDIAN, 12, 1).intercalary[0]!.after).toBe(12);
    expect(moveMonth(KHARAN, 1, 10).intercalary.map((b) => b.after)).toEqual([0, 10]);
  });

  it('removes intercalary days, weekdays and moons with what hung on them', () => {
    const noFestival = removeIntercalary(MERIDIAN, 1);
    expect(noFestival.intercalary).toEqual([]);
    expect(noFestival.leap).toEqual([]);
    expect(holidayNames(noFestival)).toEqual(['Founding Day', 'Assembly Day']);

    const noDawn = removeIntercalary(KHARAN, 1);
    expect(noDawn.intercalary.map((b) => b.name)).toEqual(['Duskturn']);
    expect(noDawn.holidays.find((h) => h.name === 'Duskturn')).toMatchObject({ intercalary: 1 });
    expect(holidayNames(noDawn)).not.toContain('Dawnturn');
    expect(removeIntercalary(KHARAN, 5)).toEqual(KHARAN);

    const noFieldday = removeWeekday(SELUNNAN, 6);
    expect(noFieldday.weekdays).toEqual(['Solday', 'Monday', 'Tideday', 'Windday', 'Hearthday', 'Restday']);
    expect(holidayNames(noFieldday)).not.toContain('Spring Market');
    const noMonday = removeWeekday(GREGORIAN, 1);
    expect(noMonday.holidays.find((h) => h.name === 'Earth Hour')).toMatchObject({ weekday: 5 });
    expect(noMonday.weekdays[4]).toBe('Saturday');
    expect(removeWeekday({ ...GREGORIAN, firstWeekday: 7 }, 3).firstWeekday).toBe(6);
    expect(removeWeekday({ ...GREGORIAN, firstWeekday: 7 }, 7).firstWeekday).toBe(6);
    const oneDay = normalizeCalendar({ weekdays: ['Today'] }).calendar;
    expect(removeWeekday(oneDay, 1)).toEqual(oneDay);

    const twoMoons = removeMoon(KHARAN, 2); // Besh goes, and Dark of Besh
    expect(twoMoons.moons.map((m) => m.name)).toEqual(['Aru', 'Tolu']);
    expect(holidayNames(twoMoons)).toEqual(['Dawnturn', 'Night of Tolu', 'Caravan Rest', 'Duskturn']);
    expect(twoMoons.holidays[1]).toMatchObject({ moon: 2 });
    expect(removeMoon(TIDEWATCH, 1).holidays.map((h) => h.type)).toEqual(['date', 'weekday', 'date']);
    expect(removeMoon(TIDEWATCH, 2)).toEqual(TIDEWATCH);
  });

  it('never changes what it was given, and always gives back a clean calendar', () => {
    const random = seeded(31337);
    const definitions = [...PRESETS.map((p) => p.definition), ...Array.from({ length: 150 }, () => randomDefinition(random))];
    for (const original of definitions) {
      // A frozen definition: any attempt to change it in place would throw.
      const definition = frozen(original);
      const m = definition.months.length;
      const results = [
        addMonth(definition),
        removeMonth(definition, between(random, 1, m)),
        moveMonth(definition, between(random, 1, m), between(random, 1, m)),
        removeIntercalary(definition, between(random, 1, Math.max(1, definition.intercalary.length))),
        removeWeekday(definition, between(random, 1, definition.weekdays.length)),
        removeMoon(definition, between(random, 1, Math.max(1, definition.moons.length))),
        setYearLength(definition, between(random, 1, 900)),
      ];
      for (const result of results) {
        expect(normalizeCalendar(result)).toEqual({ calendar: result, issues: [] });
        const calendar = createCalendar(result);
        expect(calendar.toDays(calendar.fromDays(12_345))).toBe(12_345);
        calendar.holidays(3);
      }
      expect(definition).toEqual(original);
    }
  });

  it('keeps holidays on the same month by name when months move about', () => {
    const random = seeded(8);
    for (let i = 0; i < 300; i++) {
      const definition = randomDefinition(random);
      const names = definition.months.map((month) => month.name);
      const monthOf = (d: CalendarDefinition): (string | null)[] =>
        d.holidays.map((h) => {
          const index = h.type === 'moon' ? h.month : h.type === 'date' ? (h.month ?? 0) : h.month;
          return index === 0 ? null : d.months[index - 1]!.name;
        });
      const before = monthOf(definition);
      const from = between(random, 1, names.length);
      const to = between(random, 1, names.length);
      const after = moveMonth(definition, from, to);
      expect(monthOf(after)).toEqual(before);
      expect(after.months.map((month) => month.name).sort()).toEqual([...names].sort());
      expect(after.leap.map((rule) => ('month' in rule.to ? after.months[rule.to.month - 1]!.name : null))).toEqual(
        definition.leap.map((rule) => ('month' in rule.to ? definition.months[rule.to.month - 1]!.name : null)),
      );
    }
  });
});

describe('the easter egg', () => {
  it('knows a very tidy calendar', () => {
    expect(isVeryTidy(SELUNNAN)).toBe(true);
    expect(PRESETS.filter((p) => isVeryTidy(p.definition)).map((p) => p.id)).toEqual(['selunnan']);
    expect(isVeryTidy(removeMonth(SELUNNAN, 1))).toBe(false);
    expect(isVeryTidy({ ...SELUNNAN, months: SELUNNAN.months.map((m, i) => (i === 3 ? { ...m, days: 29 } : m)) })).toBe(false);
  });

  it('says so on Midyear Day and on no other day', () => {
    expect(tidyNote(SELUNNAN, { intercalary: 1, day: 1 })).toBe('Very tidy.');
    expect(tidyNote(SELUNNAN, { month: 7, day: 14 })).toBeNull();
    expect(tidyNote(SELUNNAN, { month: 9, day: 17 })).toBeNull();
    expect(tidyNote(GREGORIAN, { month: 7, day: 14 })).toBeNull();
    // Without a midyear block, the middle of the year is the 14th of the seventh month.
    const plain = removeIntercalary(SELUNNAN, 1);
    expect(tidyNote(plain, { month: 7, day: 14 })).toBe('Very tidy.');
    expect(tidyNote(plain, { month: 7, day: 15 })).toBeNull();
    // A block at the year's end is not Midyear Day.
    const yearEnd = { ...SELUNNAN, intercalary: [{ name: 'Year Day', after: 13, days: 1, inWeek: false }], leap: [], holidays: [] };
    expect(tidyNote(yearEnd, { intercalary: 1, day: 1 })).toBeNull();
    expect(tidyNote(yearEnd, { month: 7, day: 14 })).toBe('Very tidy.');
  });
});
