import { describe, expect, it } from 'vitest';
import { cleanText, createCalendar, GREGORIAN, LIMITS, normalizeCalendar, PRESETS, validateCalendar } from '../../src/engine/index.js';
import { between, randomDefinition, seeded } from './helpers.js';

/** Rubbish of every kind, nested a little. */
function rubbish(random: () => number, depth = 0): unknown {
  const pick = between(random, 0, depth > 2 ? 9 : 12);
  switch (pick) {
    case 0: return null;
    case 1: return undefined;
    case 2: return random() < 0.5;
    case 3: return between(random, -5, 2000);
    case 4: return random() * 1e9 - 5e8;
    case 5: return [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -0, 1e308, 2 ** 53][between(random, 0, 5)];
    case 6: return ['', 'x', 'date', 'weekday', 'moon', 'full', 'new', '\u0000\u0007bell\n\ttab', 'a'.repeat(500), '2024-02-30', '1999-12-31', '<b>bold</b>'][between(random, 0, 11)];
    case 7: return 'month';
    case 8: return 1;
    case 9: return {};
    case 10: return Array.from({ length: between(random, 0, 6) }, () => rubbish(random, depth + 1));
    default: {
      const keys = ['v', 'name', 'era', 'eraBefore', 'months', 'intercalary', 'weekdays', 'firstWeekday', 'leap', 'epoch', 'moons', 'holidays', 'days', 'after', 'inWeek', 'every', 'except', 'to', 'month', 'intercalary', 'period', 'phase', 'type', 'day', 'weekday', 'nth', 'moon', 'short', '__proto__', 'constructor'];
      const out: Record<string, unknown> = {};
      for (let i = between(random, 0, 10); i > 0; i--) out[keys[between(random, 0, keys.length - 1)]!] = rubbish(random, depth + 1);
      return out;
    }
  }
}

describe('cleaning a definition', () => {
  it('leaves a good definition exactly as it was', () => {
    for (const preset of PRESETS) {
      const { calendar, issues } = normalizeCalendar(preset.definition);
      expect(issues).toEqual([]);
      expect(calendar).toEqual(preset.definition);
      expect(calendar).not.toBe(preset.definition);
      expect(validateCalendar(preset.definition)).toEqual([]);
    }
    const random = seeded(3);
    for (let i = 0; i < 200; i++) {
      const definition = randomDefinition(random);
      const { calendar, issues } = normalizeCalendar(definition);
      expect(issues).toEqual([]);
      expect(calendar).toEqual(definition);
    }
  });

  it('makes a calendar out of nothing at all', () => {
    for (const input of [undefined, null, 42, 'calendar', [], true, () => 1, Symbol('x')]) {
      const { calendar, issues } = normalizeCalendar(input);
      expect(issues.length).toBeGreaterThan(0);
      expect(calendar.months).toEqual([{ name: 'Month 1', days: 30 }]);
      expect(calendar.weekdays).toEqual(['Day 1']);
      expect(calendar).toMatchObject({ v: 1, name: '', era: '', eraBefore: '', firstWeekday: 1, epoch: null, leap: [], moons: [], holidays: [], intercalary: [] });
    }
    expect(normalizeCalendar({}).calendar.months.length).toBe(1);
  });

  it('turns any rubbish into a calendar that works, and is settled after one pass', () => {
    const random = seeded(1789);
    for (let i = 0; i < 4000; i++) {
      const input = rubbish(random);
      const { calendar } = normalizeCalendar(input);
      const again = normalizeCalendar(calendar);
      if (again.issues.length > 0 || JSON.stringify(again.calendar) !== JSON.stringify(calendar)) {
        throw new Error(`Not settled after one pass: ${JSON.stringify(again.issues)}\n${JSON.stringify(calendar)}`);
      }
      // It is plain JSON, and it runs.
      expect(JSON.parse(JSON.stringify(calendar))).toEqual(calendar);
      const made = createCalendar(input);
      const days = between(random, -100_000, 100_000);
      expect(made.toDays(made.fromDays(days))).toBe(days);
      made.day(days);
      made.holidays(made.yearOf(days));
      made.format(days, 'full');
    }
  });

  it('holds every number to its limits', () => {
    const { calendar, issues } = normalizeCalendar({
      months: [{ name: 'A', days: 0 }, { name: 'B', days: 5000 }, { name: 'C', days: 2.6 }, { name: 'D', days: '30' }, { name: 'E' }],
      intercalary: [{ name: 'X', after: 99, days: -1, inWeek: 'yes' }, { name: 'Y', after: -3, days: 1e9 }],
      weekdays: ['a', 'b'],
      firstWeekday: 3,
      moons: [{ name: 'M', period: 0.2, phase: 1.75 }, { name: 'N', period: 1e9, phase: -0.25 }, { name: 'O', period: 'slow', phase: 'full' }, { name: 'P', period: 29.53058812345, phase: 0.9999999 }],
    });
    expect(calendar.months.map((m) => m.days)).toEqual([1, 1000, 3, 30, 30]);
    expect(calendar.intercalary).toEqual([
      { name: 'X', after: 5, days: 0, inWeek: false },
      { name: 'Y', after: 0, days: 1000, inWeek: false },
    ]);
    expect(calendar.firstWeekday).toBe(2);
    expect(calendar.moons).toEqual([
      { name: 'M', period: 1, phase: 0.75 },
      { name: 'N', period: 10000, phase: 0.75 },
      { name: 'O', period: 29.5, phase: 0 },
      { name: 'P', period: 29.530588, phase: 0 },
    ]);
    expect(issues.map((issue) => issue.path)).toEqual(expect.arrayContaining(['months[0].days', 'months[1].days', 'months[2].days', 'months[3].days', 'intercalary[0].after', 'intercalary[0].inWeek', 'firstWeekday', 'moons[0].period', 'moons[2].period']));
  });

  it('cuts lists to their limits', () => {
    const { calendar, issues } = normalizeCalendar({
      months: Array.from({ length: 300 }, () => ({ name: 'M', days: 10 })),
      weekdays: Array.from({ length: 300 }, () => 'd'),
      intercalary: Array.from({ length: 300 }, () => ({ name: 'i', after: 0, days: 1 })),
      moons: Array.from({ length: 300 }, () => ({ name: 'm', period: 10, phase: 0 })),
      leap: Array.from({ length: 300 }, () => ({ every: 4, days: 1, to: { month: 1 } })),
      holidays: Array.from({ length: 3000 }, () => ({ type: 'date', name: 'h', month: 1, day: 1 })),
    });
    expect(calendar.months.length).toBe(LIMITS.months);
    expect(calendar.weekdays.length).toBe(LIMITS.weekdays);
    expect(calendar.intercalary.length).toBe(LIMITS.intercalary);
    expect(calendar.moons.length).toBe(LIMITS.moons);
    expect(calendar.leap.length).toBe(LIMITS.leapRules);
    expect(calendar.holidays.length).toBe(LIMITS.holidays);
    expect(issues.length).toBe(6);
  });

  it('tidies text and keeps it short', () => {
    expect(cleanText('  Sel\u0000unnan\n\tReckoning  ', 80)).toBe('Sel unnan Reckoning');
    expect(cleanText('x'.repeat(200), 80)).toBe('x'.repeat(80));
    expect(cleanText('\u{1F319}'.repeat(100), 5)).toBe('\u{1F319}'.repeat(5));
    expect(cleanText(42, 80)).toBe('');
    expect(cleanText('line one' + String.fromCharCode(0x2028) + 'line two', 80)).toBe('line one line two');
    const { calendar } = normalizeCalendar({ name: 'N'.repeat(500), era: 'E'.repeat(500), eraBefore: 'B'.repeat(500), months: [{ name: '', days: 3, short: 'S'.repeat(50) }], weekdays: ['', 7] });
    expect(calendar.name.length).toBe(LIMITS.name);
    expect(calendar.era.length).toBe(LIMITS.era);
    expect(calendar.eraBefore.length).toBe(LIMITS.eraBefore);
    expect(calendar.months[0]).toEqual({ name: 'Month 1', days: 3, short: 'S'.repeat(LIMITS.short) });
    expect(calendar.weekdays).toEqual(['Day 1', 'Day 2']);
  });

  it('drops leap rules that point nowhere and exceptions that could never matter', () => {
    const { calendar, issues } = normalizeCalendar({
      ...GREGORIAN,
      leap: [
        { every: 4, except: [100, 400], days: 1, to: { month: 2 } },
        { every: 4, except: [], days: 1, to: { month: 13 } },
        { every: 4, except: [], days: 1, to: { intercalary: 1 } },
        'every four years',
        { every: 7, except: [99991, 99989], days: 2, to: { month: 1 } },
        { every: 0, except: [3, 1, 5], days: 0, to: { month: 1 } },
        { every: 4, except: [100, 400, 3200, 86400], days: 1, to: { month: 3 } },
        { every: 4, except: 'never', days: 1, to: { month: 4 } },
      ],
    });
    expect(calendar.leap).toEqual([
      { every: 4, except: [100, 400], days: 1, to: { month: 2 } },
      { every: 7, except: [99991], days: 2, to: { month: 1 } },
      { every: 1, except: [3], days: 1, to: { month: 1 } },
      { every: 4, except: [100, 400, 3200], days: 1, to: { month: 3 } },
      { every: 4, except: [], days: 1, to: { month: 4 } },
    ]);
    expect(issues.length).toBeGreaterThanOrEqual(7);
  });

  it('checks the epoch', () => {
    expect(normalizeCalendar({ ...GREGORIAN, epoch: '2024-2-9' }).calendar.epoch).toBe('2024-02-09');
    expect(normalizeCalendar({ ...GREGORIAN, epoch: '-0044-03-15' }).calendar.epoch).toBe('-0044-03-15');
    for (const bad of ['2023-02-29', 'soon', 20240101, {}, '99999999-01-01']) {
      const { calendar, issues } = normalizeCalendar({ ...GREGORIAN, epoch: bad });
      expect(calendar.epoch).toBeNull();
      expect(issues.map((issue) => issue.path)).toEqual(['epoch']);
    }
    expect(normalizeCalendar({ ...GREGORIAN, epoch: null }).issues).toEqual([]);
  });

  it('drops holidays that point nowhere and fixes the ones it can', () => {
    const { calendar } = normalizeCalendar({
      ...GREGORIAN,
      holidays: [
        { type: 'date', name: 'Fine', month: 2, day: 29 },
        { type: 'date', name: 'Too late', month: 2, day: 31 },
        { type: 'date', name: 'No month', month: 13, day: 1 },
        { type: 'date', name: 'No block', intercalary: 1, day: 1 },
        { type: 'weekday', name: 'Odd', month: 1, weekday: 9, nth: 0 },
        { type: 'weekday', name: 'Last', month: 1, weekday: 7, nth: -1 },
        { type: 'moon', name: 'No moon', moon: 2, phase: 'full', nth: 1, month: 0 },
        { type: 'moon', name: 'Odd phase', moon: 1, phase: 'gibbous', nth: -7, month: 44 },
        { type: 'feast', name: 'Unknown' },
        'Tuesday',
        { type: 'date', month: 1, day: 1 },
      ],
    });
    expect(calendar.holidays).toEqual([
      { type: 'date', name: 'Fine', month: 2, day: 29 },
      { type: 'date', name: 'Too late', month: 2, day: 29 },
      { type: 'weekday', name: 'Odd', month: 1, weekday: 7, nth: 1 },
      { type: 'weekday', name: 'Last', month: 1, weekday: 7, nth: -1 },
      { type: 'moon', name: 'Odd phase', moon: 1, phase: 'full', nth: 0, month: 12 },
      { type: 'date', name: 'Holiday 11', month: 1, day: 1 },
    ]);
  });

  it('gives a calendar a frozen definition, and does not touch the one it was given', () => {
    const mine = JSON.parse(JSON.stringify(GREGORIAN)) as typeof GREGORIAN;
    const calendar = createCalendar(mine);
    expect(Object.isFrozen(calendar.definition)).toBe(true);
    expect(Object.isFrozen(calendar.definition.months[0])).toBe(true);
    expect(() => {
      (calendar.definition.months as { name: string }[])[0]!.name = 'Changed';
    }).toThrow(TypeError);
    mine.months[0]!.name = 'Changed';
    expect(calendar.definition.months[0]!.name).toBe('January');
    expect(Object.isFrozen(GREGORIAN)).toBe(false);
  });
});
