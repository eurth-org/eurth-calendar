import { describe, expect, it } from 'vitest';
import { createCalendar, fromProfileSection, GREGORIAN, PRESETS, SELUNNAN, toProfileSection } from '../../src/engine/index.js';

// The rules of the Eurth profile's "calendar" section, from eurth-profile's schema.
const LINK = /^https:\/\/[!-~]+$/;
const UPDATED = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]{1,9})?(Z|[+-]([01][0-9]|2[0-3]):[0-5][0-9])$/;

describe('the profile section', () => {
  it('holds the simple fields the profile describes, and the whole definition', () => {
    const section = toProfileSection(SELUNNAN, { link: 'https://cal.eurth.org/?d=1.abc', updated: new Date('2026-11-14T21:30:00.123Z') });
    expect(section).toEqual({
      link: 'https://cal.eurth.org/?d=1.abc',
      summary: 'Selunnan Reckoning: 13 months of 28 days, 364 days a year, weeks of 7 days, leap years, 2 moons and 6 holidays. Years are written like "1 FS".',
      updated: '2026-11-14T21:30:00Z',
      name: 'Selunnan Reckoning',
      daysPerYear: 364,
      months: SELUNNAN.months.map((month) => ({ name: month.name, days: 28 })),
      weekdays: SELUNNAN.weekdays,
      era: 'FS',
      definition: SELUNNAN,
    });
    expect(Object.keys(section)[0]).toBe('link');
  });

  it('keeps to the profile schema for every preset', () => {
    for (const preset of PRESETS) {
      const section = toProfileSection(preset.definition, { link: 'https://cal.eurth.org/' });
      expect(section.link).toMatch(LINK);
      expect(section.updated).toMatch(UPDATED);
      expect(section.summary.length).toBeLessThanOrEqual(600);
      expect(section.name.length).toBeLessThanOrEqual(80);
      expect(section.era.length).toBeLessThanOrEqual(20);
      expect(section.daysPerYear).toBeGreaterThanOrEqual(1);
      expect(section.daysPerYear).toBeLessThanOrEqual(100_000);
      expect(section.months.length).toBeLessThanOrEqual(100);
      expect(section.weekdays.length).toBeLessThanOrEqual(30);
      for (const month of section.months) {
        expect(month.name.length).toBeGreaterThanOrEqual(1);
        expect(month.days).toBeGreaterThanOrEqual(1);
        expect(month.days).toBeLessThanOrEqual(1000);
      }
      // It is plain JSON and does not share anything with the preset.
      expect(JSON.parse(JSON.stringify(section))).toEqual(section);
      expect(section.definition).not.toBe(preset.definition);
      expect(Object.isFrozen(section.definition)).toBe(false);
    }
  });

  it('leaves out a link that is not a plain https link, and a year too long for the schema', () => {
    for (const link of ['http://cal.eurth.org/', 'javascript:alert(1)', 'https://cal.eurth.org/?a b', `https://cal.eurth.org/?d=${'a'.repeat(4000)}`, '']) {
      expect('link' in toProfileSection(GREGORIAN, { link })).toBe(false);
    }
    expect('link' in toProfileSection(GREGORIAN)).toBe(false);
    const huge = toProfileSection({ months: Array.from({ length: 100 }, () => ({ name: 'M', days: 1000 })), intercalary: [{ name: 'I', after: 0, days: 1 }] });
    expect('daysPerYear' in huge).toBe(false);
  });

  it('cleans the definition it is given', () => {
    const section = toProfileSection({ name: ' Odd \u0000 one ', months: [{ name: 'M', days: 99999 }] });
    expect(section.name).toBe('Odd one');
    expect(section.definition.months).toEqual([{ name: 'M', days: 1000 }]);
    expect(createCalendar(section.definition).issues).toEqual([]);
  });

  it('is read back whole', () => {
    for (const preset of PRESETS) {
      const section = JSON.parse(JSON.stringify(toProfileSection(preset.definition))) as unknown;
      expect(fromProfileSection(section)).toEqual({ calendar: preset.definition, issues: [] });
    }
  });

  it('is read from the simple fields when the definition is missing', () => {
    const found = fromProfileSection({
      name: 'Selunnan Reckoning',
      daysPerYear: 364,
      months: [{ name: 'Frostmoon', days: 28 }, { name: 'Thawmoon' }],
      weekdays: ['Solday', 'Monday'],
      era: 'FS',
    })!;
    expect(found.calendar).toMatchObject({
      name: 'Selunnan Reckoning',
      era: 'FS',
      months: [{ name: 'Frostmoon', days: 28 }, { name: 'Thawmoon', days: 30 }],
      weekdays: ['Solday', 'Monday'],
      leap: [],
      epoch: null,
    });
    expect(fromProfileSection({ months: [{ name: 'A', days: 10 }] })!.calendar.weekdays).toEqual(['Day 1']);
  });

  it('gives null when there is nothing to read, and cleans what is there', () => {
    for (const nothing of [undefined, null, 'calendar', 7, [], {}, { name: 'No months' }, { months: [] }, { months: 'twelve' }]) {
      expect(fromProfileSection(nothing)).toBeNull();
    }
    const odd = fromProfileSection({ definition: { months: [{ name: 'M', days: -3 }], weekdays: 'none' } })!;
    expect(odd.issues.length).toBeGreaterThan(0);
    expect(odd.calendar.months).toEqual([{ name: 'M', days: 1 }]);
  });
});
