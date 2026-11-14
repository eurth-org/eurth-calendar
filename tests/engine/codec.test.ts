import { describe, expect, it } from 'vitest';
import {
  CALENDAR_PARAM,
  calendarFromLink,
  calendarLink,
  createCalendar,
  decodeCalendar,
  encodeCalendar,
  GREGORIAN,
  MAX_ENCODED_LENGTH,
  PRESETS,
  SELUNNAN,
} from '../../src/engine/index.js';
import { randomDefinition, seeded } from './helpers.js';

const base64Url = (text: string): string => Buffer.from(text, 'utf8').toString('base64url');

describe('a calendar in a link', () => {
  it('comes back exactly as it went in', () => {
    for (const preset of PRESETS) {
      const text = encodeCalendar(preset.definition);
      expect(text).toMatch(/^1\.[A-Za-z0-9_-]+$/);
      expect(decodeCalendar(text)).toEqual({ calendar: preset.definition, issues: [] });
    }
    const random = seeded(11);
    for (let i = 0; i < 300; i++) {
      const definition = randomDefinition(random);
      expect(decodeCalendar(encodeCalendar(definition))).toEqual({ calendar: definition, issues: [] });
    }
  });

  it('stays short enough for a link', () => {
    for (const preset of PRESETS) expect(encodeCalendar(preset.definition).length).toBeLessThan(1500);
    // The fullest calendar the limits allow still fits under the reader's limit.
    const full = encodeCalendar({
      name: 'N'.repeat(80),
      months: Array.from({ length: 100 }, () => ({ name: 'M'.repeat(80), days: 1000, short: 'S'.repeat(12) })),
      weekdays: Array.from({ length: 30 }, () => 'W'.repeat(80)),
      intercalary: Array.from({ length: 20 }, () => ({ name: 'I'.repeat(80), after: 100, days: 1000, inWeek: true })),
      moons: Array.from({ length: 12 }, () => ({ name: 'O'.repeat(80), period: 9999.999999, phase: 0.999999 })),
      holidays: Array.from({ length: 200 }, () => ({ type: 'moon', name: 'H'.repeat(80), moon: 12, phase: 'last-quarter', nth: 1000, month: 100 })),
    });
    expect(full.length).toBeLessThan(MAX_ENCODED_LENGTH);
    expect(decodeCalendar(full)!.issues).toEqual([]);
  });

  it('carries names in any script', () => {
    const definition = { ...SELUNNAN, name: 'Calendrier sélénite 月曆 \u{1F319}', months: SELUNNAN.months.map((m, i) => (i === 0 ? { ...m, name: 'Зима', short: 'Зим' } : m)) };
    const back = decodeCalendar(encodeCalendar(definition))!;
    expect(back.issues).toEqual([]);
    expect(back.calendar).toEqual(definition);
  });

  it('cleans what it is given before packing it', () => {
    const text = encodeCalendar({ months: [{ name: 'Only', days: 99999 }] });
    expect(decodeCalendar(text)!.calendar.months).toEqual([{ name: 'Only', days: 1000 }]);
    expect(decodeCalendar(text)!.issues).toEqual([]);
  });

  it('gives null for anything that is not a calendar', () => {
    const bad: unknown[] = [
      undefined, null, 42, {}, '', 'calendar', '1.', '1', '.abc', '1.***', '1.a b', `2.${base64Url('{"m":[],"w":[]}')}`,
      `1.${base64Url('not json')}`, `1.${base64Url('[1,2,3]')}`, `1.${base64Url('"text"')}`, `1.${base64Url('null')}`,
      `1.${base64Url('{"w":["a"]}')}`, `1.${base64Url('{"m":[["A",3]]}')}`, `1.${base64Url('{"m":"x","w":"y"}')}`,
      '1.' + Buffer.from([0xff, 0xfe, 0xfd]).toString('base64url'),
      `1.${'A'.repeat(MAX_ENCODED_LENGTH)}`,
    ];
    for (const text of bad) expect(decodeCalendar(text)).toBeNull();
  });

  it('never trusts what a link holds', () => {
    const hostile = {
      n: '<script>alert(1)</script>\u0000',
      m: [['A', 1e9], [null, -4], 'month', [{}, []], ['B', 30, 7]],
      w: [null, { toString: 1 }, 'Day'],
      f: 99,
      i: [['X', 'end', 'many', 'yes'], 5],
      l: [[0, 0, 5, 77], ['4', 1, 0, 1], [4, 1, 0, 1, 100, 400, 'x'], 'leap', [4, 1, 1, 9]],
      g: 'tomorrow',
      o: [[1, '29', null], ['M', 29.5, 0.5]],
      h: [[0, 'Day', 1, 500], [3, 'Moon', 2, 9, 1, 0], [9, 'What'], [2, 'W', 1, 1, 1], 'holiday', [3, 'Odd', 2, 'full', 1, 0]],
    };
    const result = decodeCalendar(`1.${base64Url(JSON.stringify(hostile))}`)!;
    expect(result.issues.length).toBeGreaterThan(10);
    expect(result.calendar.name).toBe('<script>alert(1)</script>');
    expect(result.calendar.months.map((m) => m.days)).toEqual([1000, 1, 30, 30]);
    expect(result.calendar.epoch).toBeNull();
    expect(result.calendar.moons).toEqual([{ name: 'Moon 1', period: 29.5, phase: 0 }, { name: 'M', period: 29.5, phase: 0.5 }]);
    const calendar = createCalendar(result.calendar);
    expect(calendar.issues).toEqual([]);
    expect(calendar.toDays(calendar.fromDays(12345))).toBe(12345);
  });

  it('rides in a link from one tool to the next', () => {
    const link = calendarLink('https://time.eurth.org/?old=1#top', SELUNNAN);
    expect(link.startsWith(`https://time.eurth.org/?${CALENDAR_PARAM}=1.`)).toBe(true);
    expect(link).not.toContain('old=');
    expect(link).not.toContain('#');
    expect(calendarFromLink(link)).toEqual({ calendar: SELUNNAN, issues: [] });
    expect(calendarFromLink(new URL(link).search)).toEqual({ calendar: SELUNNAN, issues: [] });
    expect(calendarFromLink(calendarLink('https://cal.eurth.org/', GREGORIAN, 'd'), 'd')!.calendar).toEqual(GREGORIAN);
    expect(calendarFromLink('https://time.eurth.org/')).toBeNull();
    expect(calendarFromLink('https://time.eurth.org/?cal=nonsense')).toBeNull();
    expect(calendarFromLink('http://[bad')).toBeNull();
    expect(calendarFromLink('')).toBeNull();
  });
});
