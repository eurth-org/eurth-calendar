import { describe, expect, it } from 'vitest';
import { createCalendar, GREGORIAN, KHARAN, MERIDIAN, PRESETS, SELUNNAN } from '../../src/engine/index.js';
import { pageOf, partGrid, turnPage, yearGrids, type Page } from '../../src/maker/grid.js';
import { between, randomDefinition, seeded } from '../engine/helpers.js';

describe('a month as a grid', () => {
  it('lays November 2026 out under Monday to Sunday', () => {
    const calendar = createCalendar(GREGORIAN);
    const grid = partGrid(calendar, 2026, 10);
    expect(grid.title).toBe('November 2026 CE');
    expect(grid.inWeek).toBe(true);
    // 1 November 2026 is a Sunday: six blanks, then the 1st.
    expect(grid.rows.map((row) => row.map((cell) => cell?.day ?? 0))).toEqual([
      [0, 0, 0, 0, 0, 0, 1],
      [2, 3, 4, 5, 6, 7, 8],
      [9, 10, 11, 12, 13, 14, 15],
      [16, 17, 18, 19, 20, 21, 22],
      [23, 24, 25, 26, 27, 28, 29],
      [30, 0, 0, 0, 0, 0, 0],
    ]);
    const twelfth = grid.rows[2]![3]!;
    expect(twelfth.date).toEqual({ year: 2026, month: 11, day: 12 });
    expect(twelfth.weekday).toBe(4);
    expect(twelfth.days).toBe(calendar.toDays({ year: 2026, month: 11, day: 12 }));
    // The new moon of 9 November and the full moon of 24 November 2026, give or take a day.
    const phases = grid.rows.flat().flatMap((cell) => (cell === null ? [] : cell.moons.map((moon) => `${cell.day} ${moon.phase}`)));
    expect(phases.some((p) => /^(8|9|10) new$/.test(p))).toBe(true);
    expect(phases.some((p) => /^(23|24|25) full$/.test(p))).toBe(true);
  });

  it('puts holidays and moons on their days', () => {
    const calendar = createCalendar(SELUNNAN);
    const grid = partGrid(calendar, 1022, 9); // Harvestmoon: Midyear Day's empty slot sits before Ripemoon.
    expect(grid.title).toBe('Harvestmoon 1022 FS');
    expect(grid.rows.length).toBe(4);
    expect(grid.rows.every((row) => row.length === 7 && row.every((cell) => cell !== null))).toBe(true);
    const cells = grid.rows.flat().map((cell) => cell!);
    expect(cells.filter((cell) => cell.holidays.length > 0).map((cell) => [cell.day, cell.holidays[0]!.name])).toEqual([
      [9, 'Harvest Fair'],
      [21, "Founders' Day"],
    ]);
    const events = calendar.moonEvents(grid.part.start, grid.part.start + 27);
    expect(cells.reduce((sum, cell) => sum + cell.moons.length, 0)).toBe(events.length);
    for (const cell of cells) {
      for (const moon of cell.moons) expect(events.some((e) => e.days === cell.days && e.moon === moon.moon && e.phase === moon.phase)).toBe(true);
    }
  });

  it('shows days outside the week as a strip of their own', () => {
    const selunnan = createCalendar(SELUNNAN);
    const midyear = partGrid(selunnan, 1020, 7);
    expect(midyear.title).toBe('Midyear Day 1020 FS');
    expect(midyear.inWeek).toBe(false);
    expect(midyear.rows.length).toBe(1);
    expect(midyear.rows[0]!.map((cell) => [cell!.day, cell!.weekday, cell!.holidays.map((h) => h.name)])).toEqual([[1, null, ['Midyear Day']]]);
    expect(partGrid(selunnan, 1022, 7).rows).toEqual([]);

    const meridian = createCalendar(MERIDIAN);
    const festival = partGrid(meridian, 4, 12);
    expect(festival.rows[0]!.map((cell) => cell!.day)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(festival.rows[0]![5]!.date).toEqual({ year: 4, intercalary: 1, day: 6 });
    expect(() => partGrid(meridian, 4, 13)).toThrow(RangeError);
  });

  it('lines intercalary days that count in the week up with the rest', () => {
    const calendar = createCalendar(KHARAN);
    const dawnturn = partGrid(calendar, 1, 0);
    expect(dawnturn.inWeek).toBe(true);
    expect(dawnturn.rows).toHaveLength(1);
    expect(dawnturn.rows[0]!.map((cell) => cell?.day ?? 0)).toEqual([1, 0, 0, 0, 0, 0, 0, 0]);
    // Arrak then starts on the second day of the eight-day week.
    expect(partGrid(calendar, 1, 1).rows[0]!.map((cell) => cell?.day ?? 0)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('holds every day of the year exactly once, in order, for presets and random calendars', () => {
    const random = seeded(909);
    const calendars = [...PRESETS.map((p) => createCalendar(p.definition)), ...Array.from({ length: 60 }, () => createCalendar(randomDefinition(random)))];
    for (const calendar of calendars) {
      for (let i = 0; i < 6; i++) {
        const year = between(random, -3000, 3000);
        const layout = calendar.year(year);
        const grids = yearGrids(calendar, year);
        expect(grids.every((grid) => grid.part.days > 0)).toBe(true);
        const cells = grids.flatMap((grid) => grid.rows.flat().filter((cell) => cell !== null));
        expect(cells.map((cell) => cell.days)).toEqual(Array.from({ length: layout.days }, (_, n) => layout.start + n));
        for (const grid of grids) {
          for (const row of grid.rows) {
            if (grid.inWeek) expect(row.length).toBe(calendar.definition.weekdays.length);
            row.forEach((cell, column) => {
              if (cell === null) return;
              expect(calendar.fromDays(cell.days)).toEqual(cell.date);
              expect(cell.weekday).toBe(calendar.weekday(cell.days));
              if (grid.inWeek) expect(cell.weekday).toBe(column + 1);
            });
          }
        }
        expect(cells.reduce((sum, cell) => sum + cell.holidays.length, 0)).toBe(calendar.holidays(year).length);
      }
    }
  });
});

describe('turning the pages', () => {
  it('finds the page of a day', () => {
    const calendar = createCalendar(SELUNNAN);
    expect(pageOf(calendar, calendar.toDays({ year: 1022, month: 9, day: 17 }))).toEqual({ year: 1022, position: 9 });
    expect(pageOf(calendar, calendar.toDays({ year: 1020, intercalary: 1, day: 1 }))).toEqual({ year: 1020, position: 7 });
    expect(pageOf(calendar, 0)).toEqual({ year: 1, position: 0 });
    expect(pageOf(calendar, -1)).toEqual({ year: 0, position: 13 });
  });

  it('skips what a year does not have, and runs on into the next year', () => {
    const calendar = createCalendar(SELUNNAN);
    // 1022 has no Midyear Day: Highmoon is followed by Ripemoon.
    expect(turnPage(calendar, { year: 1022, position: 6 }, 1)).toEqual({ year: 1022, position: 8 });
    expect(turnPage(calendar, { year: 1022, position: 8 }, -1)).toEqual({ year: 1022, position: 6 });
    // 1020 has one.
    expect(turnPage(calendar, { year: 1020, position: 6 }, 1)).toEqual({ year: 1020, position: 7 });
    expect(turnPage(calendar, { year: 1022, position: 13 }, 1)).toEqual({ year: 1023, position: 0 });
    expect(turnPage(calendar, { year: 1023, position: 0 }, -1)).toEqual({ year: 1022, position: 13 });
    expect(turnPage(calendar, { year: calendar.maxYear, position: 13 }, 1)).toBeNull();
    expect(turnPage(calendar, { year: calendar.minYear, position: 0 }, -1)).toBeNull();
  });

  it('walks every page there and back, in every kind of calendar', () => {
    const random = seeded(4);
    const calendars = [...PRESETS.map((p) => createCalendar(p.definition)), ...Array.from({ length: 40 }, () => createCalendar(randomDefinition(random)))];
    for (const calendar of calendars) {
      let page: Page = pageOf(calendar, calendar.yearStart(-3));
      const seen: Page[] = [page];
      let end = calendar.yearStart(-3);
      for (let i = 0; i < 150; i++) {
        const part = calendar.year(page.year).parts[page.position]!;
        expect(part.days).toBeGreaterThan(0);
        // Each page starts where the last one ended.
        expect(part.start).toBe(end);
        end = part.start + part.days;
        expect(pageOf(calendar, part.start)).toEqual(page);
        expect(pageOf(calendar, end - 1)).toEqual(page);
        page = turnPage(calendar, page, 1)!;
        seen.push(page);
      }
      for (let i = seen.length - 1; i > 0; i--) {
        expect(turnPage(calendar, seen[i]!, -1)).toEqual(seen[i - 1]);
      }
    }
  });
});
