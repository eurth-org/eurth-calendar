/**
 * A month as a grid of weeks, a year as a run of months, and the pages of a desk calendar.
 *
 * Plain functions over the engine: the maker's month view, the year view and the printable
 * year are all drawn from what these give back.
 */
import { formatYear, type Calendar, type CalendarDate, type HolidayOccurrence, type PrincipalPhase, type YearPart } from '../engine/index.js';

/** A moon reaching a principal phase on a day. */
export interface CellMoon {
  /** Which moon (1-based). */
  moon: number;
  name: string;
  phase: PrincipalPhase;
}

/** One day in a grid. */
export interface GridCell {
  /** The day count. */
  days: number;
  /** The day of the month or of the intercalary block (1-based). */
  day: number;
  date: CalendarDate;
  /** The day of the week (1-based), or null for a day outside the week. */
  weekday: number | null;
  /** New moons, quarters and full moons that day. */
  moons: CellMoon[];
  /** Holidays that day. */
  holidays: HolidayOccurrence[];
}

/** A month, or an intercalary block, laid out for display. */
export interface PartGrid {
  year: number;
  part: YearPart;
  /** The part's position among the year's parts (0-based), for page turning. */
  position: number;
  /** "Harvestmoon 1022 FS", or "Midyear Day 1020 FS". */
  title: string;
  /**
   * Rows of weeks: one cell per weekday, null where the month has no day. For days outside
   * the week (an intercalary block with inWeek false) there is a single row holding just
   * those days, to be shown as a strip rather than under the weekday headings.
   */
  rows: (GridCell | null)[][];
  /** Whether the rows line up under the weekday headings. */
  inWeek: boolean;
}

/** A page of the desk calendar: a year and a position among that year's parts. */
export interface Page {
  year: number;
  position: number;
}

/** The grid of one part of a year. `position` is the part's place in calendar.year(year).parts. */
export function partGrid(calendar: Calendar, year: number, position: number): PartGrid {
  const layout = calendar.year(year);
  const part = layout.parts[position];
  if (part === undefined) throw new RangeError(`Year ${year} has no part ${position}.`);
  const week = calendar.definition.weekdays.length;

  const moons = new Map<number, CellMoon[]>();
  const holidays = new Map<number, HolidayOccurrence[]>();
  if (part.days > 0) {
    for (const event of calendar.moonEvents(part.start, part.start + part.days - 1)) {
      const list = moons.get(event.days) ?? [];
      list.push({ moon: event.moon, name: event.name, phase: event.phase });
      moons.set(event.days, list);
    }
    for (const occurrence of calendar.holidays(year)) {
      if (occurrence.days < part.start || occurrence.days >= part.start + part.days) continue;
      const list = holidays.get(occurrence.days) ?? [];
      list.push(occurrence);
      holidays.set(occurrence.days, list);
    }
  }

  const cells: GridCell[] = [];
  for (let i = 0; i < part.days; i++) {
    const days = part.start + i;
    cells.push({
      days,
      day: i + 1,
      date: part.kind === 'month' ? { year, month: part.index, day: i + 1 } : { year, intercalary: part.index, day: i + 1 },
      weekday: part.inWeek ? calendar.weekday(days) : null,
      moons: moons.get(days) ?? [],
      holidays: holidays.get(days) ?? [],
    });
  }

  let rows: (GridCell | null)[][];
  if (!part.inWeek) {
    rows = cells.length > 0 ? [cells] : [];
  } else {
    rows = [];
    let row: (GridCell | null)[] = [];
    for (const cell of cells) {
      const column = (cell.weekday ?? 1) - 1;
      if (row.length === 0) row = Array<GridCell | null>(week).fill(null);
      row[column] = cell;
      if (column === week - 1) {
        rows.push(row);
        row = [];
      }
    }
    if (row.length > 0) rows.push(row);
  }
  return { year, part, position, title: `${part.name} ${formatYear(calendar.definition, year)}`, rows, inWeek: part.inWeek };
}

/** Every part of a year that has days in it, as grids, in order. */
export function yearGrids(calendar: Calendar, year: number): PartGrid[] {
  const grids: PartGrid[] = [];
  calendar.year(year).parts.forEach((part, position) => {
    if (part.days > 0) grids.push(partGrid(calendar, year, position));
  });
  return grids;
}

/** The page a day is on. */
export function pageOf(calendar: Calendar, days: number): Page {
  const year = calendar.yearOf(days);
  const parts = calendar.year(year).parts;
  let position = 0;
  parts.forEach((part, i) => {
    if (part.days > 0 && part.start <= days) position = i;
  });
  return { year, position };
}

/**
 * The next page (step 1) or the one before (step -1), skipping parts with no days that year
 * and running on into the next or the previous year. Null at the ends of the calendar's range.
 */
export function turnPage(calendar: Calendar, page: Page, step: 1 | -1): Page | null {
  let { year, position } = page;
  let parts = calendar.year(year).parts;
  // A year always has at least one part with days in it, so this ends within two years.
  for (let guard = 0; guard < 4 * parts.length + 4; guard++) {
    position += step;
    if (position < 0 || position >= parts.length) {
      year += step;
      if (year < calendar.minYear || year > calendar.maxYear) return null;
      parts = calendar.year(year).parts;
      position = step === 1 ? 0 : parts.length - 1;
    }
    if (parts[position]!.days > 0) return { year, position };
  }
  return null;
}
