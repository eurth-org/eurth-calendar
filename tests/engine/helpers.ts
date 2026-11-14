/**
 * Test helpers: a seeded random number generator, random calendars, and a second, deliberately
 * naive way to lay out a calendar (walk every day of every year, one by one) that the engine's
 * direct arithmetic is checked against.
 */
import type { CalendarDate, CalendarDefinition, Holiday, LeapRule } from '../../src/engine/index.js';

/** A small seeded generator (mulberry32): the same seed always gives the same numbers. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A whole number from min to max inclusive. */
export const between = (random: () => number, min: number, max: number): number => min + Math.floor(random() * (max - min + 1));

const modulo = (a: number, b: number): number => ((a % b) + b) % b;

/** The leap rule read straight off its definition: divides by this, and the rest of the chain does not undo it. */
export function naiveRuleMatches(rule: LeapRule, year: number): boolean {
  const chain = [rule.every, ...rule.except];
  const undone = (i: number): boolean => i < chain.length && modulo(year, chain[i]!) === 0 && !undone(i + 1);
  return modulo(year, rule.every) === 0 && !undone(1);
}

export interface NaivePart {
  kind: 'month' | 'intercalary';
  index: number;
  days: number;
  inWeek: boolean;
}

/** The parts of a year in order, with their lengths that year. */
export function naiveYear(definition: CalendarDefinition, year: number): NaivePart[] {
  const parts: NaivePart[] = [];
  const add = (kind: 'month' | 'intercalary', index: number, base: number, inWeek: boolean): void => {
    let days = base;
    for (const rule of definition.leap) {
      const hit = kind === 'month' ? 'month' in rule.to && rule.to.month === index : 'intercalary' in rule.to && rule.to.intercalary === index;
      if (hit && naiveRuleMatches(rule, year)) days += rule.days;
    }
    parts.push({ kind, index, days, inWeek });
  };
  for (let position = 0; position <= definition.months.length; position++) {
    definition.intercalary.forEach((block, i) => {
      if (block.after === position) add('intercalary', i + 1, block.days, block.inWeek);
    });
    const month = definition.months[position];
    if (month !== undefined) add('month', position + 1, month.days, true);
  }
  return parts;
}

export interface NaiveDay {
  days: number;
  date: CalendarDate;
  weekday: number | null;
}

/** Every day from the first day of `firstYear` to the last day of `lastYear`, found by counting. firstYear must be 1 or less. */
export function naiveWalk(definition: CalendarDefinition, firstYear: number, lastYear: number): NaiveDay[] {
  // Count back from day 0 to find where the walk starts.
  let days = 0;
  let weekCount = 0;
  for (let year = 0; year >= firstYear; year--) {
    for (const part of naiveYear(definition, year)) {
      days -= part.days;
      if (part.inWeek) weekCount -= part.days;
    }
  }
  const out: NaiveDay[] = [];
  const week = definition.weekdays.length;
  for (let year = firstYear; year <= lastYear; year++) {
    for (const part of naiveYear(definition, year)) {
      for (let day = 1; day <= part.days; day++) {
        const date: CalendarDate = part.kind === 'month' ? { year, month: part.index, day } : { year, intercalary: part.index, day };
        const weekday = part.inWeek ? modulo(weekCount + definition.firstWeekday - 1, week) + 1 : null;
        out.push({ days, date, weekday });
        days++;
        if (part.inWeek) weekCount++;
      }
    }
  }
  return out;
}

const NAMES = ['Ash', 'Birch', 'Cedar', 'Dune', 'Elm', 'Fern', 'Gorse', 'Heath', 'Iris', 'Juniper', 'Kelp', 'Larch', 'Moss', 'Nettle', 'Oak'];

/** A random, valid calendar: odd month lengths, intercalary blocks, leap rules whose exceptions need not nest. */
export function randomDefinition(random: () => number): CalendarDefinition {
  const monthCount = between(random, 1, 15);
  const months = Array.from({ length: monthCount }, (_, i) => ({ name: NAMES[i]!, days: between(random, 1, 40) }));
  const intercalary = Array.from({ length: between(random, 0, 3) }, (_, i) => ({
    name: `Feast ${i + 1}`,
    after: between(random, 0, monthCount),
    days: between(random, 0, 3),
    inWeek: random() < 0.5,
  }));
  const weekdays = Array.from({ length: between(random, 1, 10) }, (_, i) => `Day ${i + 1}`);
  const leap: LeapRule[] = Array.from({ length: between(random, 0, 3) }, () => ({
    every: between(random, 1, 12),
    except: Array.from({ length: between(random, 0, 2) }, () => between(random, 2, 40)),
    days: between(random, 1, 3),
    to: intercalary.length > 0 && random() < 0.4 ? { intercalary: between(random, 1, intercalary.length) } : { month: between(random, 1, monthCount) },
  }));
  const moons = Array.from({ length: between(random, 0, 3) }, (_, i) => ({
    name: `Moon ${i + 1}`,
    period: Math.round((1 + random() * 60) * 1e6) / 1e6,
    phase: Math.floor(random() * 1e6) / 1e6,
  }));
  const holidays: Holiday[] = [
    { type: 'date', name: 'First', month: 1, day: 1 },
    { type: 'weekday', name: 'Nth', month: between(random, 1, monthCount), weekday: between(random, 1, weekdays.length), nth: random() < 0.3 ? -1 : between(random, 1, 3) },
  ];
  if (moons.length > 0) {
    holidays.push({ type: 'moon', name: 'Moonfeast', moon: between(random, 1, moons.length), phase: 'full', nth: between(random, -1, 2), month: between(random, 0, monthCount) });
  }
  return {
    v: 1,
    name: 'Random calendar',
    era: 'R',
    eraBefore: random() < 0.5 ? 'before R' : '',
    months,
    intercalary,
    weekdays,
    firstWeekday: between(random, 1, weekdays.length),
    leap,
    epoch: random() < 0.5 ? '1900-01-01' : null,
    moons,
    holidays,
  };
}
