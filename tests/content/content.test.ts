import { describe, expect, it } from 'vitest';
import { PRESETS } from '../../src/engine/index.js';
import { examples } from '../../src/content/examples.js';
import { glossary } from '../../src/content/glossary.js';
import type { Term } from '../../src/content/glossary.js';
import { guide } from '../../src/content/guide.js';

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The terms the glossary must define, by id. */
const REQUIRED_TERMS = [
  'tropical-year',
  'sidereal-year',
  'synodic-month',
  'lunation',
  'phase',
  'new-moon',
  'full-moon',
  'quarter',
  'solar-calendar',
  'lunar-calendar',
  'lunisolar-calendar',
  'leap-year',
  'leap-day',
  'leap-month',
  'intercalation',
  'intercalary-day',
  'epagomenal-days',
  'common-year',
  'mean-year',
  'metonic-cycle',
  'epoch',
  'era',
  'year-zero',
  'proleptic-calendar',
  'julian-calendar',
  'gregorian-calendar',
  'day-count',
  'julian-day-number',
  'rata-die',
  'week',
  'weekday',
  'perennial-calendar',
  'festival-day',
  'holiday',
  'movable-feast',
  'ordinal-date',
  'regnal-year',
  'calendar-drift',
];

/** American spellings the house style rules out, as whole words and their common endings. */
const AMERICAN = /\b(?:color|center|favorite|organiz|honor(?!ary|ific)|neighbor|gray)\w*/i;

const pages = { guide, glossary, examples };

/** Every string in a value, with where it sits. */
function strings(value: unknown, path: string): { path: string; text: string }[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((item, index) => strings(item, `${path}[${index}]`));
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([key, item]) => strings(item, `${path}.${key}`));
  }
  return [];
}

function words(text: string): number {
  return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

function duplicates(ids: string[]): string[] {
  return ids.filter((id, index) => ids.indexOf(id) !== index);
}

function isIsoDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

const allTerms: Term[] = glossary.groups.flatMap((group) => group.terms);
const allStrings = strings(pages, 'content');

describe('every page', () => {
  it.each(Object.entries(pages))('%s has a title and a description of 120 to 160 characters', (_name, page) => {
    expect(page.title.length).toBeGreaterThan(0);
    expect(page.description.length).toBeGreaterThanOrEqual(120);
    expect(page.description.length).toBeLessThanOrEqual(160);
  });

  it.each(Object.entries(pages))('%s has a real date for "updated"', (_name, page) => {
    expect(isIsoDate(page.updated)).toBe(true);
  });

  it('knows a real date from a wrong one', () => {
    expect(isIsoDate('2026-11-14')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('14-11-2026')).toBe(false);
  });

  it('has no empty strings, and no stray spaces', () => {
    const wrong = allStrings.filter(({ text }) => text.length === 0 || text !== text.trim() || / {2}/.test(text) || /[\t\n\r ]/.test(text));
    expect(wrong).toEqual([]);
  });

  it('has no emoji', () => {
    const wrong = allStrings.filter(({ text }) => /\p{Extended_Pictographic}/u.test(text));
    expect(wrong).toEqual([]);
  });

  it('is in British English', () => {
    const wrong = allStrings.filter(({ path, text }) => !path.endsWith('.url') && AMERICAN.test(text));
    expect(wrong).toEqual([]);
  });

  it('catches the American spellings it is meant to', () => {
    for (const word of ['color', 'Colors', 'center', 'centered', 'favorite', 'organize', 'organized', 'honor', 'honors', 'neighbor', 'neighboring', 'gray']) {
      expect(AMERICAN.test(`a ${word} b`), word).toBe(true);
    }
    for (const word of ['colour', 'colours', 'centre', 'favourite', 'organise', 'honour', 'honorary', 'neighbour', 'grey', 'Gregorian']) {
      expect(AMERICAN.test(`a ${word} b`), word).toBe(false);
    }
  });

  it('is plain text: no Markdown, no HTML, no typographic quotes', () => {
    const wrong = allStrings.filter(({ path, text }) => !path.endsWith('.url') && (/[<>`*_#]|\]\(/.test(text) || /[‘’“”]/.test(text)));
    expect(wrong).toEqual([]);
  });

  it('uses no em dashes', () => {
    expect(allStrings.filter(({ text }) => text.includes('—'))).toEqual([]);
  });
});

describe('the guide', () => {
  const sectionIds = guide.sections.map((section) => section.id);

  it('has kebab-case, unique section ids', () => {
    for (const id of sectionIds) expect(id).toMatch(KEBAB);
    expect(duplicates(sectionIds)).toEqual([]);
  });

  it('has an introduction, and paragraphs in every section', () => {
    expect(guide.intro.length).toBeGreaterThan(0);
    expect(guide.sections.length).toBeGreaterThanOrEqual(8);
    for (const section of guide.sections) {
      expect(section.title.length, section.id).toBeGreaterThan(0);
      expect(section.paragraphs.length, section.id).toBeGreaterThan(0);
      if (section.points !== undefined) expect(section.points.length, section.id).toBeGreaterThan(0);
    }
  });

  it('is between 1500 and 2300 words long', () => {
    const text = [
      ...guide.intro,
      ...guide.sections.flatMap((section) => [section.title, ...section.paragraphs, ...(section.points ?? []), ...(section.tryIt === undefined ? [] : [section.tryIt])]),
    ];
    const count = text.reduce((sum, part) => sum + words(part), 0);
    expect(count).toBeGreaterThanOrEqual(1500);
    expect(count).toBeLessThanOrEqual(2300);
  });

  it('gives the real lengths of the year and the month', () => {
    const text = guide.sections.flatMap((section) => section.paragraphs).join(' ');
    expect(text).toContain('365.2422');
    expect(text).toContain('29.5306');
  });

  it('writes its headings in sentence case', () => {
    for (const section of guide.sections) {
      const capitals = section.title.split(' ').filter((word) => /^\p{Lu}/u.test(word));
      expect(capitals.length, section.title).toBe(1);
      expect(section.title.endsWith('.'), section.title).toBe(false);
    }
  });

  it('names only real presets in "try it"', () => {
    const names = PRESETS.map((preset) => preset.definition.name);
    const named = guide.sections.filter((section) => section.tryIt !== undefined && names.some((name) => section.tryIt?.includes(name)));
    // Most sections point at a preset; the test below would pass on none at all without this.
    expect(named.length).toBeGreaterThanOrEqual(6);
    for (const section of guide.sections) {
      const mentions = section.tryIt?.match(/the ((?:[A-Z][a-z]+ )+(?:Reckoning|Count|Calendar|Year))/g) ?? [];
      for (const mention of mentions) expect(names, section.id).toContain(mention.replace(/^the /, ''));
    }
  });

  it('has 8 to 12 sources, each with a title and an https link or none', () => {
    expect(guide.sources.length).toBeGreaterThanOrEqual(8);
    expect(guide.sources.length).toBeLessThanOrEqual(12);
    for (const source of guide.sources) {
      expect(source.title.length).toBeGreaterThan(0);
      if (source.url !== undefined) {
        expect(source.url.startsWith('https://'), source.url).toBe(true);
        expect(() => new URL(source.url ?? ''), source.url).not.toThrow();
      }
      if (source.year !== undefined) {
        expect(Number.isInteger(source.year)).toBe(true);
        expect(source.year).toBeGreaterThan(1000);
        expect(source.year).toBeLessThanOrEqual(Number(guide.updated.slice(0, 4)));
      }
    }
    expect(duplicates(guide.sources.map((source) => source.title))).toEqual([]);
    expect(duplicates(guide.sources.flatMap((source) => (source.url === undefined ? [] : [source.url])))).toEqual([]);
  });
});

describe('the glossary', () => {
  const termIds = allTerms.map((term) => term.id);
  const groupIds = glossary.groups.map((group) => group.id);

  it('has 36 to 44 terms in 5 or 6 groups', () => {
    expect(allTerms.length).toBeGreaterThanOrEqual(36);
    expect(allTerms.length).toBeLessThanOrEqual(44);
    expect(glossary.groups.length).toBeGreaterThanOrEqual(5);
    expect(glossary.groups.length).toBeLessThanOrEqual(6);
    for (const group of glossary.groups) expect(group.terms.length, group.id).toBeGreaterThan(0);
  });

  it('has kebab-case ids, unique across groups and terms', () => {
    for (const id of [...groupIds, ...termIds]) expect(id).toMatch(KEBAB);
    expect(duplicates([...groupIds, ...termIds])).toEqual([]);
  });

  it('defines no term twice', () => {
    expect(duplicates(allTerms.map((term) => term.term.toLowerCase()))).toEqual([]);
  });

  it('defines every required term', () => {
    expect(REQUIRED_TERMS.filter((id) => !termIds.includes(id))).toEqual([]);
  });

  it('gives every term an id made from its name', () => {
    for (const term of allTerms) expect(term.id).toBe(term.term.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  });

  it('points every "see" at another term that exists, once', () => {
    for (const term of allTerms) {
      const see = term.see ?? [];
      expect(see, term.id).not.toContain(term.id);
      expect(see.filter((id) => !termIds.includes(id)), term.id).toEqual([]);
      expect(duplicates(see), term.id).toEqual([]);
    }
  });

  it('keeps every definition to one to three sentences', () => {
    for (const term of allTerms) {
      expect(term.text, term.id).toMatch(/[.]"?$/);
      const sentences = term.text.split(/(?<=[.?])\s+(?=\p{Lu})/u).length;
      expect(sentences, term.id).toBeGreaterThanOrEqual(1);
      expect(sentences, term.id).toBeLessThanOrEqual(3);
    }
  });
});

describe('the examples', () => {
  it('cover the presets, in order, under their own names', () => {
    expect(examples.items.map((item) => item.id)).toEqual(PRESETS.map((preset) => preset.id));
    expect(examples.items.map((item) => item.title)).toEqual(PRESETS.map((preset) => preset.definition.name));
  });

  it('have kebab-case ids', () => {
    for (const item of examples.items) expect(item.id).toMatch(KEBAB);
  });

  it('each have a kicker, one or two paragraphs, 3 or 4 things to notice and 2 or 3 to try', () => {
    for (const item of examples.items) {
      expect(item.kicker.length, item.id).toBeGreaterThan(0);
      expect(item.text.length, item.id).toBeGreaterThanOrEqual(1);
      expect(item.text.length, item.id).toBeLessThanOrEqual(2);
      expect(item.notice.length, item.id).toBeGreaterThanOrEqual(3);
      expect(item.notice.length, item.id).toBeLessThanOrEqual(4);
      expect(item.tryNext.length, item.id).toBeGreaterThanOrEqual(2);
      expect(item.tryNext.length, item.id).toBeLessThanOrEqual(3);
    }
  });

  it('name only months, weekdays, moons, holidays and intercalary days their preset has', () => {
    // A name from one preset, in another preset's write-up, is a slip (Monday is in two of them).
    const namesOf = (index: number): string[] => {
      const definition = PRESETS[index]?.definition;
      if (definition === undefined) return [];
      return [
        ...definition.months.map((month) => month.name),
        ...definition.weekdays,
        ...definition.moons.map((moon) => moon.name),
        ...definition.holidays.map((holiday) => holiday.name),
        ...definition.intercalary.map((block) => block.name),
      ];
    };
    examples.items.forEach((item, index) => {
      const own = namesOf(index);
      const text = [...item.text, ...item.notice, ...item.tryNext].join(' ');
      PRESETS.forEach((_other, otherIndex) => {
        // The Gregorian preset's "Moon" and month names are ordinary English words, so it is not compared.
        if (otherIndex === index || otherIndex === 0) return;
        for (const name of namesOf(otherIndex)) {
          if (own.includes(name) || name === 'Moon' || name === 'Festival') continue;
          expect(new RegExp(`\\b${name}\\b`).test(text), `${item.id} mentions ${name}`).toBe(false);
        }
      });
    });
  });
});
