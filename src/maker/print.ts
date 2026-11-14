/**
 * The printable year: a whole year of a calendar laid out on A4 or Letter pages.
 *
 * First the months, as small grids side by side, with holidays boxed and the first moon's
 * phases drawn in; then the holidays by name and the moons' phases by date, so nothing depends
 * on a mark alone. The result is a list of pages of shapes (see pdf.ts): writePdf turns them
 * into a file, and the site can draw the same shapes on a canvas.
 */
import {
  formatGregorian,
  formatYear,
  phaseLabel,
  shortName,
  type Calendar,
  type CalendarDate,
  type PrincipalPhase,
} from '../engine/index.js';
import { yearGrids, type PartGrid } from './grid.js';
import { fitText, PAPER, textWidth, type Paper, type Shape, type VectorPage } from './pdf.js';

const MARGIN = 42;
const GUTTER = 18;
const ROW = 11.5;
const INK = 0;
const SOFT = 0.38;
const RULE = 0.7;

/** A date without its year: "9 Harvestmoon", "Midyear Day", "3 Festival". */
function dayLabel(calendar: Calendar, date: CalendarDate): string {
  const d = calendar.definition;
  if ('month' in date) return `${date.day} ${d.months[date.month - 1]!.name}`;
  const block = d.intercalary[date.intercalary - 1]!;
  return calendar.longestIntercalary(date.intercalary) <= 1 ? block.name : `${date.day} ${block.name}`;
}

/** Breaks a text into lines no wider than a width. */
export function wrapText(text: string, maxWidth: number, size: number, bold = false, measure: typeof textWidth = textWidth): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const candidate = line === '' ? word : `${line} ${word}`;
    if (line !== '' && measure(candidate, size, bold) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line !== '') lines.push(line);
  return lines.map((item) => fitText(item, maxWidth, size, bold, measure));
}

/** Pages being filled from the top down. */
class Sheets {
  readonly pages: VectorPage[] = [];
  readonly width: number;
  readonly height: number;
  /** Where the next thing goes. */
  y = 0;
  shapes: Shape[] = [];

  constructor(
    paper: Paper,
    private readonly heading: (shapes: Shape[], width: number) => number,
  ) {
    this.width = PAPER[paper].width;
    this.height = PAPER[paper].height;
    this.newPage();
  }

  get bottom(): number {
    return this.height - MARGIN - 14;
  }

  newPage(): void {
    this.shapes = [];
    this.pages.push({ width: this.width, height: this.height, shapes: this.shapes });
    this.y = this.heading(this.shapes, this.width);
  }

  /** Makes sure there is room for something this tall, on a new page if need be. */
  need(height: number): void {
    if (this.y + height > this.bottom) this.newPage();
  }
}

/** A grid, or as much of one as fits on a page. */
interface Piece {
  grid: PartGrid;
  rows: PartGrid['rows'];
  title: string;
}

/** Draws one month (or intercalary block) at a place. */
function drawGrid(shapes: Shape[], calendar: Calendar, piece: Piece, x: number, y: number, width: number, measure: typeof textWidth): void {
  const { grid } = piece;
  const weekdays = calendar.definition.weekdays;
  shapes.push({ kind: 'text', x, y: y + 10, text: fitText(piece.title, width, 10, true, measure), size: 10, bold: true });
  let top = y + 16;
  const cell = width / weekdays.length;
  // Type that fits the narrowest cell: a week of thirty days still prints, in small figures.
  const size = Math.max(4.5, Math.min(8, cell * 0.42));

  if (grid.inWeek) {
    const headSize = Math.min(6.5, size);
    weekdays.forEach((name, i) => {
      const letters = cell >= 18 ? 3 : cell >= 12 ? 2 : 1;
      shapes.push({ kind: 'text', x: x + cell * (i + 0.5), y: top + 6, text: Array.from(shortName(name)).slice(0, letters).join(''), size: headSize, align: 'center', grey: SOFT });
    });
    top += 9;
    shapes.push({ kind: 'line', x1: x, y1: top, x2: x + width, y2: top, width: 0.4, grey: RULE });
    top += 1.5;
  }

  for (const row of piece.rows) {
    row.forEach((day, i) => {
      if (day === null) return;
      const cx = x + cell * (i + 0.5);
      const holiday = day.holidays.length > 0;
      if (holiday) {
        shapes.push({ kind: 'rect', x: x + cell * i + 0.8, y: top + 0.8, width: cell - 1.6, height: ROW - 1.6, stroke: INK, strokeWidth: 0.6 });
      }
      shapes.push({ kind: 'text', x: cx, y: top + ROW / 2 + size * 0.36, text: String(day.day), size, bold: holiday, align: 'center' });
      const moon = day.moons.find((event) => event.moon === 1);
      if (moon !== undefined && cell >= 9) {
        const radius = Math.min(1.9, cell * 0.11);
        shapes.push({ kind: 'moon', x: x + cell * (i + 1) - radius - 1.6, y: top + radius + 1.8, radius, phase: moon.phase });
      }
    });
    top += ROW;
  }
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** How tall a piece will be. */
const pieceHeight = (piece: Piece): number => 16 + (piece.grid.inWeek ? 10.5 : 0) + piece.rows.length * ROW;

/**
 * The year's grids as pieces that each fit on a page. Days outside the week run on in rows of
 * their own, as many to a row as a week has days; a month too long for one page carries on
 * under "(continued)".
 */
function pieces(calendar: Calendar, year: number, mostRows: number): Piece[] {
  const week = calendar.definition.weekdays.length;
  return yearGrids(calendar, year).flatMap((grid) => {
    const rows = grid.inWeek ? grid.rows : chunk(grid.rows[0] ?? [], week);
    return chunk(rows, mostRows).map((part, i) => ({ grid, rows: part, title: i === 0 ? grid.part.name : `${grid.part.name} (continued)` }));
  });
}

/**
 * A year of a calendar as pages to print.
 * @param options.measure how wide a text is (default: Helvetica's own widths, for the PDF)
 */
export function printYear(calendar: Calendar, year: number, paper: Paper, options: { measure?: typeof textWidth } = {}): VectorPage[] {
  const measure = options.measure ?? textWidth;
  const d = calendar.definition;
  const layout = calendar.year(year);
  const name = d.name === '' ? 'Calendar' : d.name;
  const yearLabel = formatYear(d, year);
  const first = calendar.toGregorian(layout.start);
  const last = calendar.toGregorian(layout.start + layout.days - 1);
  const span = first !== null && last !== null ? `${formatGregorian(first)} to ${formatGregorian(last)}` : `${layout.days} days`;

  const sheets = new Sheets(paper, (shapes, width) => {
    const right = width - MARGIN;
    const label = fitText(yearLabel, (width - 2 * MARGIN) * 0.45, 18, true, measure);
    shapes.push({ kind: 'text', x: MARGIN, y: MARGIN + 16, text: fitText(name, right - MARGIN - measure(label, 18, true) - 12, 18, true, measure), size: 18, bold: true });
    shapes.push({ kind: 'text', x: right, y: MARGIN + 16, text: label, size: 18, bold: true, align: 'right' });
    shapes.push({ kind: 'text', x: MARGIN, y: MARGIN + 29, text: fitText(span, right - MARGIN, 8, false, measure), size: 8, grey: SOFT });
    shapes.push({ kind: 'line', x1: MARGIN, y1: MARGIN + 35, x2: right, y2: MARGIN + 35, width: 0.8 });
    return MARGIN + 50;
  });
  const inner = sheets.width - 2 * MARGIN;

  // The months, side by side: three across for a week of up to eight days, fewer for a longer one.
  const week = d.weekdays.length;
  const across = week <= 8 ? 3 : week <= 16 ? 2 : 1;
  const width = (inner - GUTTER * (across - 1)) / across;
  const mostRows = Math.max(1, Math.floor((sheets.bottom - sheets.y - 27) / ROW));
  for (const row of chunk(pieces(calendar, year, mostRows), across)) {
    const height = Math.max(...row.map(pieceHeight));
    sheets.need(height);
    row.forEach((piece, i) => drawGrid(sheets.shapes, calendar, piece, MARGIN + i * (width + GUTTER), sheets.y, width, measure));
    sheets.y += height + 14;
  }

  const section = (title: string): void => {
    sheets.need(40);
    sheets.y += 6;
    sheets.shapes.push({ kind: 'text', x: MARGIN, y: sheets.y + 9, text: title, size: 11, bold: true });
    sheets.y += 16;
  };

  // The key: what the marks in the months mean. It runs on to a second line if it must.
  const firstMoon = d.moons[0];
  if (d.holidays.length > 0 || firstMoon !== undefined) {
    const items: { label: string; phase: PrincipalPhase | null }[] = [];
    if (d.holidays.length > 0) items.push({ label: 'Holiday', phase: null });
    if (firstMoon !== undefined) {
      const phases: PrincipalPhase[] = ['new', 'first-quarter', 'full', 'last-quarter'];
      const moonName = fitText(firstMoon.name, 90, 7.5, false, measure);
      for (const phase of phases) items.push({ label: `${moonName} ${phase === 'new' || phase === 'full' ? phase : phaseLabel(phase)}`, phase });
    }
    sheets.need(16);
    let x = MARGIN;
    for (const item of items) {
      const lead = item.phase === null ? 13 : 9;
      const itemWidth = lead + measure(item.label, 7.5, false);
      if (x > MARGIN && x + itemWidth > MARGIN + inner) {
        x = MARGIN;
        sheets.y += 12;
        sheets.need(16);
      }
      const y = sheets.y + 6;
      if (item.phase === null) sheets.shapes.push({ kind: 'rect', x, y: y - 6.5, width: 9, height: 9, stroke: INK, strokeWidth: 0.6 });
      else sheets.shapes.push({ kind: 'moon', x: x + 3, y: y - 2.4, radius: 2.6, phase: item.phase });
      sheets.shapes.push({ kind: 'text', x: x + lead, y, text: item.label, size: 7.5, grey: SOFT });
      x += itemWidth + 14;
    }
    sheets.y += 16;
  }

  // The holidays, by name.
  const holidays = calendar.holidays(year);
  if (holidays.length > 0) {
    section('Holidays');
    const columnWidth = (inner - GUTTER) / 2;
    const dateWidth = columnWidth * 0.42;
    for (const pair of chunk(holidays, 2)) {
      sheets.need(11);
      pair.forEach((holiday, i) => {
        const x = MARGIN + i * (columnWidth + GUTTER);
        sheets.shapes.push({ kind: 'text', x, y: sheets.y + 7.5, text: fitText(dayLabel(calendar, holiday.date), dateWidth - 6, 8, false, measure), size: 8, grey: SOFT });
        sheets.shapes.push({ kind: 'text', x: x + dateWidth, y: sheets.y + 7.5, text: fitText(holiday.name, columnWidth - dateWidth, 8, true, measure), size: 8, bold: true });
      });
      sheets.y += 11;
    }
  }

  // The moons, by date: every new and full moon of every moon.
  if (d.moons.length > 0) {
    section(d.moons.length === 1 ? 'The moon' : 'The moons');
    const end = layout.start + layout.days - 1;
    d.moons.forEach((moon, i) => {
      const events = calendar.moonEvents(layout.start, end, i + 1);
      for (const phase of ['new', 'full'] as const) {
        const days = events.filter((event) => event.phase === phase).map((event) => dayLabel(calendar, calendar.fromDays(event.days)));
        // A very fast moon would fill pages; past a hundred, say how many instead.
        const text = days.length === 0 ? 'none this year' : days.length > 100 ? `${days.length} times this year` : days.join(', ');
        const lines = wrapText(`${moon.name}, ${phase} moon: ${text}.`, inner, 8, false, measure);
        for (const line of lines) {
          sheets.need(10.5);
          sheets.shapes.push({ kind: 'text', x: MARGIN, y: sheets.y + 7.5, text: line, size: 8 });
          sheets.y += 10.5;
        }
        sheets.y += 2;
      }
    });
  }

  // The foot of every page.
  sheets.pages.forEach((page, i) => {
    const y = page.height - MARGIN + 4;
    page.shapes.push({ kind: 'text', x: MARGIN, y, text: 'Made with Calendar, cal.eurth.org', size: 7, grey: SOFT });
    page.shapes.push({ kind: 'text', x: page.width - MARGIN, y, text: `${i + 1} / ${sheets.pages.length}`, size: 7, grey: SOFT, align: 'right' });
  });
  return sheets.pages;
}

/** Every text a set of pages shows, to check whether Helvetica can print it (see canEncode in pdf.ts). */
export function pageTexts(pages: readonly VectorPage[]): string[] {
  return pages.flatMap((page) => page.shapes.flatMap((shape) => (shape.kind === 'text' ? [shape.text] : [])));
}
