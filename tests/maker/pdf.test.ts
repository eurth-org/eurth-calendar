import { describe, expect, it } from 'vitest';
import { createCalendar, GREGORIAN, normalizeCalendar, PRESETS, SELUNNAN } from '../../src/engine/index.js';
import { canEncode, fitText, PAPER, textWidth, writePdf, type PdfPage, type Shape } from '../../src/maker/pdf.js';
import { pageTexts, printYear, wrapText } from '../../src/maker/print.js';
import { between, randomDefinition, seeded } from '../engine/helpers.js';

const latin1 = (bytes: Uint8Array): string => Buffer.from(bytes).toString('latin1');
const created = new Date('2026-11-14T22:00:00Z');

/** Reads a PDF the way a reader would: from the end, through the cross-reference table, to every object. */
function check(bytes: Uint8Array): { text: string; objects: Map<number, string>; pages: number } {
  const text = latin1(bytes);
  expect(text.startsWith('%PDF-1.4\n')).toBe(true);
  expect(text.endsWith('%%EOF\n')).toBe(true);
  const startxref = Number(/startxref\n(\d+)\n%%EOF\n$/.exec(text)![1]);
  expect(text.slice(startxref, startxref + 5)).toBe('xref\n');
  const size = Number(/xref\n0 (\d+)\n/.exec(text.slice(startxref))![1]);
  expect(text.slice(startxref)).toContain(`/Size ${size} /Root 1 0 R /Info 5 0 R`);
  const entries = text.slice(startxref).split('\n').slice(2, 2 + size);
  expect(entries[0]).toBe('0000000000 65535 f ');
  const objects = new Map<number, string>();
  for (let id = 1; id < size; id++) {
    expect(entries[id]).toMatch(/^\d{10} 00000 n $/);
    const offset = Number(entries[id]!.slice(0, 10));
    const head = `${id} 0 obj\n`;
    expect(text.slice(offset, offset + head.length)).toBe(head);
    const end = text.indexOf('\nendobj\n', offset);
    expect(end).toBeGreaterThan(offset);
    const body = text.slice(offset + head.length, end);
    objects.set(id, body);
    // A stream is exactly as long as it says.
    const stream = /\/Length (\d+) >>\nstream\n/.exec(body);
    if (stream !== null) {
      const from = stream.index + stream[0].length;
      expect(body.slice(from + Number(stream[1]))).toBe('\nendstream');
    }
  }
  const pages = Number(/\/Count (\d+)/.exec(objects.get(2)!)![1]);
  const kids = [...objects.get(2)!.matchAll(/(\d+) 0 R/g)].map((m) => Number(m[1]));
  expect(kids.length).toBe(pages);
  for (const kid of kids) {
    expect(objects.get(kid)).toContain('/Type /Page /Parent 2 0 R');
    const contents = Number(/\/Contents (\d+) 0 R/.exec(objects.get(kid)!)![1]);
    expect(objects.has(contents)).toBe(true);
  }
  return { text, objects, pages };
}

describe('the PDF writer', () => {
  it('writes a file a reader can find its way around', () => {
    const shapes: Shape[] = [
      { kind: 'text', x: 50, y: 60, text: 'Harvestmoon', size: 12, bold: true },
      { kind: 'text', x: 300, y: 80, text: 'centred', size: 10, align: 'center', grey: 0.4 },
      { kind: 'text', x: 500, y: 100, text: 'right', size: 10, align: 'right' },
      { kind: 'line', x1: 50, y1: 110, x2: 500, y2: 110, width: 0.5 },
      { kind: 'rect', x: 50, y: 120, width: 20, height: 10, stroke: 0 },
      { kind: 'rect', x: 80, y: 120, width: 20, height: 10, fill: 0.9 },
      { kind: 'rect', x: 110, y: 120, width: 20, height: 10, fill: 0.9, stroke: 0, strokeWidth: 1 },
      { kind: 'circle', x: 200, y: 200, radius: 5, fill: 0.5 },
      { kind: 'circle', x: 220, y: 200, radius: 5, stroke: 0 },
      { kind: 'moon', x: 300, y: 200, radius: 4, phase: 'new' },
      { kind: 'moon', x: 320, y: 200, radius: 4, phase: 'first-quarter' },
      { kind: 'moon', x: 340, y: 200, radius: 4, phase: 'full' },
      { kind: 'moon', x: 360, y: 200, radius: 4, phase: 'last-quarter' },
    ];
    const pages: PdfPage[] = [
      { ...PAPER.a4, shapes },
      { ...PAPER.letter, shapes: [] },
    ];
    const { text, objects, pages: count } = check(writePdf(pages, { title: 'Selunnan Reckoning 1022 FS', author: 'Orioni', subject: 'A year', created }));
    expect(count).toBe(2);
    expect(objects.get(1)).toContain('/Type /Catalog /Pages 2 0 R /Lang (en-GB)');
    expect(objects.get(3)).toContain('/BaseFont /Helvetica /Encoding /WinAnsiEncoding');
    expect(objects.get(4)).toContain('/BaseFont /Helvetica-Bold');
    expect(objects.get(5)).toContain('/CreationDate (D:20261114220000Z)');
    expect(objects.get(6)).toContain('/MediaBox [0 0 595.28 841.89]');
    expect(objects.get(8)).toContain('/MediaBox [0 0 612 792]');
    // The page is measured from the top; PDF measures from the bottom.
    expect(text).toContain(`/F2 12 Tf\n50 781.89 Td\n<${Buffer.from('Harvestmoon', 'latin1').toString('hex')}> Tj`);
    const half = textWidth('centred', 10) / 2;
    expect(text).toContain(`${Math.round((300 - half) * 1000) / 1000} 761.89 Td`);
    expect(text).toContain(`${Math.round((500 - textWidth('right', 10)) * 1000) / 1000} 741.89 Td`);
    expect(text).toContain('50 711.89 20 10 re\nS');
    expect(text).toContain('80 711.89 20 10 re\nf');
    expect(text).toContain('110 711.89 20 10 re\nB');
    // Nothing in the page descriptions that a PDF number cannot be.
    expect(objects.get(7)).not.toMatch(/NaN|Infinity|e[+-]\d|undefined/);
  });

  it('is the same file for the same pages', () => {
    const pages = printYear(createCalendar(SELUNNAN), 1022, 'a4');
    expect(writePdf(pages, { title: 'T', created })).toEqual(writePdf(pages, { title: 'T', created }));
  });

  it('writes its details in any script', () => {
    const { objects } = check(writePdf([{ ...PAPER.a4, shapes: [] }], { title: 'Зима \u{1F319}', language: 'ru"); /Evil (', created }));
    const expected = Buffer.from('﻿Зима \u{1F319}', 'utf16le').swap16().toString('hex');
    expect(objects.get(5)).toContain(`/Title <${expected}>`);
    expect(objects.get(1)).toContain('/Lang (ruEvil)');
  });

  it('takes a picture for a page', () => {
    const jpeg = Uint8Array.from({ length: 300 }, (_, i) => (i * 37) % 256);
    const bytes = writePdf([{ ...PAPER.a4, jpeg, pixelWidth: 1654, pixelHeight: 2339 }, { ...PAPER.a4, shapes: [] }], { title: 'Picture', created });
    const { objects, pages } = check(bytes);
    expect(pages).toBe(2);
    expect(objects.get(6)).toContain('/XObject << /Im0 8 0 R >>');
    expect(objects.get(7)).toContain('595.28 0 0 841.89 0 0 cm\n/Im0 Do');
    expect(objects.get(8)).toContain('/Subtype /Image /Width 1654 /Height 2339 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length 300');
    expect(objects.get(8)!.endsWith(`${latin1(jpeg)}\nendstream`)).toBe(true);
    expect(objects.get(9)).toContain('/Type /Page');
  });

  it('knows what Helvetica can print', () => {
    expect(canEncode('Harvestmoon 1022 FS')).toBe(true);
    expect(canEncode('Fête de l’été, Þórr, Æsir, Šárka, 13 × 28 … €')).toBe(true);
    expect(canEncode('Зима')).toBe(false);
    expect(canEncode('Tōkyō')).toBe(false);
    expect(canEncode('月')).toBe(false);
    expect(canEncode('tab\there')).toBe(false);
    expect(canEncode('')).toBe(true);
    const text = latin1(writePdf([{ ...PAPER.a4, shapes: [{ kind: 'text', x: 0, y: 10, text: 'é€Š月', size: 10 }] }], { title: 'T', created }));
    expect(text).toContain('<e9808a3f> Tj');
  });

  it('measures text as Helvetica sets it', () => {
    expect(textWidth('Hello', 10)).toBeCloseTo(22.78, 6);
    expect(textWidth('Hello', 10, true)).toBeCloseTo(24.45, 6);
    expect(textWidth('', 10)).toBe(0);
    expect(textWidth('été', 12)).toBeCloseTo(textWidth('ete', 12), 6);
    expect(textWidth('0123456789', 8)).toBeCloseTo(44.48, 6);
    expect(textWidth('月', 10)).toBeCloseTo(5.56, 6);
    expect(fitText('Harvestmoon', 500, 10)).toBe('Harvestmoon');
    const cut = fitText('Meridian Republican Calendar', 60, 10, true);
    expect(cut.endsWith('…')).toBe(true);
    expect(textWidth(cut, 10, true)).toBeLessThanOrEqual(60);
    expect(cut.length).toBeGreaterThan(4);
    expect(fitText('Wide', 1, 10)).toBe('W…');
    const wrapped = wrapText('one two three four five six', 40, 10);
    expect(wrapped).toEqual(['one two', 'three', 'four five', 'six']);
    expect(wrapped.join(' ')).toBe('one two three four five six');
    expect(wrapText('', 40, 10)).toEqual([]);
    for (const line of wrapText('Supercalifragilistic word and another', 30, 10)) expect(textWidth(line, 10)).toBeLessThanOrEqual(30);
  });
});

describe('the printable year', () => {
  it('prints every preset on both papers, inside the page', () => {
    for (const preset of PRESETS) {
      const calendar = createCalendar(preset.definition);
      for (const paper of ['a4', 'letter'] as const) {
        const pages = printYear(calendar, 1022, paper);
        expect(pages.length).toBeGreaterThanOrEqual(1);
        for (const page of pages) {
          expect(page.width).toBe(PAPER[paper].width);
          expect(page.height).toBe(PAPER[paper].height);
          for (const shape of page.shapes) {
            const xs = shape.kind === 'line' ? [shape.x1, shape.x2] : shape.kind === 'rect' ? [shape.x, shape.x + shape.width] : [shape.x];
            const ys = shape.kind === 'line' ? [shape.y1, shape.y2] : shape.kind === 'rect' ? [shape.y, shape.y + shape.height] : [shape.y];
            for (const x of xs) expect(x >= 36 && x <= page.width - 36).toBe(true);
            for (const y of ys) expect(y >= 36 && y <= page.height - 30).toBe(true);
            if (shape.kind === 'text') {
              expect(shape.text.length).toBeGreaterThan(0);
              // Left-set text ends before the right margin.
              if (shape.align === undefined) expect(shape.x + textWidth(shape.text, shape.size, shape.bold ?? false)).toBeLessThanOrEqual(page.width - 41);
            }
          }
        }
        const texts = pageTexts(pages);
        expect(canEncode(texts.join(' '))).toBe(true);
        expect(texts).toContain(preset.definition.name);
        expect(texts).toContain(`1 / ${pages.length}`);
        expect(texts).toContain('Made with Calendar, cal.eurth.org');
        // Every day of the year is there: one figure per day.
        const layout = calendar.year(1022);
        const figures = pages.flatMap((page) => page.shapes).filter((shape) => shape.kind === 'text' && shape.align === 'center' && /^\d+$/.test(shape.text));
        expect(figures.length).toBe(layout.days);
        // Every holiday of the year is named, and boxed on its day.
        const holidays = calendar.holidays(1022);
        for (const holiday of holidays) expect(texts).toContain(holiday.name);
        const boxes = pages.flatMap((page) => page.shapes).filter((shape) => shape.kind === 'rect' && shape.height > 9.5);
        expect(boxes.length).toBe(new Set(holidays.map((holiday) => holiday.days)).size);
        check(writePdf(pages, { title: preset.definition.name, created }));
      }
    }
  });

  it('heads the page with the year, and the Earth dates when there are any', () => {
    const selunnan = pageTexts(printYear(createCalendar(SELUNNAN), 1020, 'a4'));
    expect(selunnan).toContain('1020 FS');
    expect(selunnan).toContain('18 March 2024 to 17 March 2025');
    expect(selunnan).toContain('Midyear Day');
    expect(selunnan).toContain('Holidays');
    expect(selunnan).toContain('The moons');
    expect(selunnan.some((text) => text.startsWith('Selen, full moon: '))).toBe(true);
    expect(selunnan.some((text) => text.startsWith('Kair, new moon: '))).toBe(true);
    expect(selunnan).toContain('Selen first quarter');
    const tidewatch = pageTexts(printYear(createCalendar(PRESETS[2]!.definition), 30, 'letter'));
    expect(tidewatch).toContain('356 days');
    expect(tidewatch).toContain('The moon');
    const bare = pageTexts(printYear(createCalendar({}), 1, 'a4'));
    expect(bare).toContain('Calendar');
    expect(bare).not.toContain('Holidays');
    expect(bare).not.toContain('The moon');
  });

  it('carries a month too long for a page over to the next', () => {
    const calendar = createCalendar({ name: 'Long', months: [{ name: 'Endless', days: 1000 }], weekdays: ['Today'] });
    const pages = printYear(calendar, 1, 'a4');
    expect(pages.length).toBeGreaterThan(5);
    const texts = pageTexts(pages);
    expect(texts.filter((text) => text === 'Endless').length).toBe(1);
    expect(texts.filter((text) => text === 'Endless (continued)').length).toBeGreaterThan(4);
    const figures = pages.flatMap((page) => page.shapes).filter((shape) => shape.kind === 'text' && shape.align === 'center' && /^\d+$/.test(shape.text));
    expect(figures.length).toBe(1000);
    for (const page of pages) for (const shape of page.shapes) if (shape.kind === 'text') expect(shape.y).toBeLessThanOrEqual(page.height - 30);
  });

  it('prints whatever calendar it is given', () => {
    const random = seeded(1234);
    for (let i = 0; i < 120; i++) {
      const calendar = createCalendar(randomDefinition(random));
      const year = between(random, -500, 500);
      const pages = printYear(calendar, year, i % 2 === 0 ? 'a4' : 'letter');
      const figures = pages.flatMap((page) => page.shapes).filter((shape) => shape.kind === 'text' && shape.align === 'center' && /^\d+$/.test(shape.text));
      expect(figures.length).toBe(calendar.yearLength(year));
      for (const page of pages) {
        for (const shape of page.shapes) {
          for (const value of Object.values(shape)) if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
          if (shape.kind === 'text') expect(shape.y).toBeLessThanOrEqual(page.height - 30);
        }
      }
      check(writePdf(pages, { title: 'Random', created }));
    }
    // The widest week and the longest names the limits allow.
    const wide = normalizeCalendar({
      name: 'W'.repeat(80),
      era: 'E'.repeat(20),
      months: Array.from({ length: 3 }, () => ({ name: 'M'.repeat(80), days: 61 })),
      weekdays: Array.from({ length: 30 }, () => 'D'.repeat(80)),
      moons: [{ name: 'O'.repeat(80), period: 1.5, phase: 0 }],
      holidays: [{ type: 'date', name: 'H'.repeat(80), month: 1, day: 1 }],
    }).calendar;
    const pages = printYear(createCalendar(wide), 1, 'letter');
    for (const page of pages) {
      for (const shape of page.shapes) {
        if (shape.kind === 'text' && shape.align === undefined) expect(shape.x + textWidth(shape.text, shape.size, shape.bold ?? false)).toBeLessThanOrEqual(page.width - 41);
      }
    }
    check(writePdf(pages, { title: 'Wide', created }));
  });

  it('says when a calendar needs the picture route', () => {
    const cyrillic = createCalendar({ ...GREGORIAN, name: 'Григорианский календарь' });
    expect(canEncode(pageTexts(printYear(cyrillic, 2026, 'a4')).join(' '))).toBe(false);
  });
});
