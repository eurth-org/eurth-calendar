import { describe, expect, it } from 'vitest';
import { createCalendar, GREGORIAN, moonOn, moonPhasesBetween, phaseLabel, SELUNNAN, type Moon } from '../../src/engine/index.js';
import { between, seeded } from './helpers.js';

describe('moons', () => {
  it('start where they are told to', () => {
    expect(moonOn({ name: 'A', period: 28, phase: 0 }, 0).phase).toBe('new');
    expect(moonOn({ name: 'A', period: 28, phase: 0.25 }, 0).phase).toBe('first-quarter');
    expect(moonOn({ name: 'A', period: 28, phase: 0.5 }, 0).phase).toBe('full');
    expect(moonOn({ name: 'A', period: 28, phase: 0.75 }, 0).phase).toBe('last-quarter');
  });

  it('run through the eight phases in order', () => {
    const moon: Moon = { name: 'A', period: 28, phase: 0 };
    expect(Array.from({ length: 29 }, (_, d) => moonOn(moon, d).phase)).toEqual([
      'new',
      ...Array<string>(6).fill('waxing-crescent'),
      'first-quarter',
      ...Array<string>(6).fill('waxing-gibbous'),
      'full',
      ...Array<string>(6).fill('waning-gibbous'),
      'last-quarter',
      ...Array<string>(6).fill('waning-crescent'),
      'new',
    ]);
    expect(moonOn(moon, -1).phase).toBe('waning-crescent');
    expect(moonOn(moon, -14).phase).toBe('full');
    expect(moonOn(moon, -28).phase).toBe('new');
  });

  it('are dark when new and bright when full', () => {
    const moon: Moon = { name: 'A', period: 30, phase: 0 };
    // At midday the moon is half a day into the day's stretch of the cycle.
    expect(moonOn(moon, 0).lit).toBeLessThan(0.01);
    expect(moonOn(moon, 15).lit).toBeGreaterThan(0.99);
    expect(moonOn(moon, 7).lit).toBeCloseTo(0.5, 1);
    expect(moonOn(moon, 0).fraction).toBeCloseTo(0.5 / 30, 10);
    for (let d = -100; d < 100; d++) {
      const state = moonOn(moon, d);
      expect(state.fraction).toBeGreaterThanOrEqual(0);
      expect(state.fraction).toBeLessThan(1);
      expect(state.lit).toBeGreaterThanOrEqual(0);
      expect(state.lit).toBeLessThanOrEqual(1);
    }
  });

  it('list the same phases, day for day, as asking about each day', () => {
    const random = seeded(88);
    for (let n = 0; n < 300; n++) {
      const moon: Moon = { name: 'M', period: Math.round((4.5 + random() * 80) * 1e6) / 1e6, phase: Math.floor(random() * 1e6) / 1e6 };
      const from = between(random, -40_000_000_000, 40_000_000_000);
      const to = from + 400;
      const events = moonPhasesBetween(moon, from, to);
      const byDay = new Map(events.map((event) => [event.days, event.phase]));
      // With a cycle over four days, no two phases share a day.
      expect(byDay.size).toBe(events.length);
      for (let d = from; d <= to; d++) {
        const phase = moonOn(moon, d).phase;
        const listed = byDay.get(d);
        if (listed === undefined ? !phase.includes('wax') && !phase.includes('wan') : listed !== phase) {
          throw new Error(`Moon ${JSON.stringify(moon)}, day ${d}: listed ${String(listed)}, asked ${phase}`);
        }
      }
      // In order, a quarter of a cycle apart, give or take the rounding to whole days.
      for (let i = 1; i < events.length; i++) {
        const gap = events[i]!.days - events[i - 1]!.days;
        expect(gap).toBeGreaterThanOrEqual(Math.floor(moon.period / 4));
        expect(gap).toBeLessThanOrEqual(Math.ceil(moon.period / 4));
      }
    }
  });

  it('keep exact time over millions of years', () => {
    const moon: Moon = { name: 'A', period: 29.5, phase: 0 };
    // 29.5 days: new moons fall on days 0, 29 (29.5), 59, 88 (88.5), 118: every 59 days exactly.
    for (const cycles of [1, 1000, 1_000_000, 1_000_000_000]) {
      const day = 59 * cycles;
      expect(moonOn(moon, day).phase).toBe('new');
      expect(moonOn(moon, -day).phase).toBe('new');
      expect(moonPhasesBetween(moon, day, day + 59, 'new').map((event) => event.days)).toEqual([day, day + 29, day + 59]);
    }
  });

  it('can list one phase only, and refuse a span too long to list', () => {
    const moon: Moon = { name: 'A', period: 10, phase: 0.5 };
    expect(moonPhasesBetween(moon, 0, 30, 'full').map((event) => event.days)).toEqual([0, 10, 20, 30]);
    expect(moonPhasesBetween(moon, 0, 30, 'new').map((event) => event.days)).toEqual([5, 15, 25]);
    expect(moonPhasesBetween(moon, 1, 9, 'full')).toEqual([]);
    expect(moonPhasesBetween(moon, 9, 1)).toEqual([]);
    expect(moonPhasesBetween(moon, -30, 0, 'full').map((event) => event.days)).toEqual([-30, -20, -10, 0]);
    expect(() => moonPhasesBetween(moon, 0, 10_000_000)).toThrow(RangeError);
    expect(() => moonPhasesBetween(moon, 0.5, 3)).toThrow(RangeError);
  });

  it('handle a moon faster than a day', () => {
    const moon: Moon = { name: 'Dart', period: 1, phase: 0 };
    expect(moonOn(moon, 5).phase).toBe('new');
    expect(moonPhasesBetween(moon, 0, 0).map((event) => event.phase)).toEqual(['new', 'first-quarter', 'full', 'last-quarter']);
  });

  it("put Earth's Moon within a day of where it really was", () => {
    const calendar = createCalendar(GREGORIAN);
    const near = (date: { year: number; month: number; day: number }, phase: string): void => {
      const days = calendar.fromGregorian(date)!;
      const found = calendar.moonEvents(days - 1, days + 1).filter((event) => event.phase === phase);
      if (found.length !== 1) throw new Error(`No ${phase} moon within a day of ${JSON.stringify(date)}`);
    };
    near({ year: 2000, month: 1, day: 6 }, 'new');
    near({ year: 2026, month: 11, day: 9 }, 'new');
    near({ year: 2026, month: 11, day: 24 }, 'full');
    near({ year: 1969, month: 7, day: 29 }, 'full');
    near({ year: 1999, month: 8, day: 11 }, 'new'); // the eclipse
  });

  it('are listed per calendar, in order', () => {
    const calendar = createCalendar(SELUNNAN);
    const start = calendar.toDays({ year: 1022, month: 9, day: 1 });
    const events = calendar.moonEvents(start, start + 27);
    expect(events.length).toBeGreaterThanOrEqual(5);
    expect(new Set(events.map((event) => event.name))).toEqual(new Set(['Selen', 'Kair']));
    for (let i = 1; i < events.length; i++) expect(events[i]!.days).toBeGreaterThanOrEqual(events[i - 1]!.days);
    expect(calendar.moonEvents(start, start + 27, 2).every((event) => event.moon === 2)).toBe(true);
    const states = calendar.moonsOn(start);
    expect(states.map((state) => state.name)).toEqual(['Selen', 'Kair']);
    expect(states.map((state) => state.moon)).toEqual([1, 2]);
  });

  it('have names for their phases', () => {
    expect(phaseLabel('first-quarter')).toBe('first quarter');
    expect(phaseLabel('waxing-gibbous')).toBe('waxing gibbous');
    expect(phaseLabel('full')).toBe('full');
  });
});
