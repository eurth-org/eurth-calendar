/**
 * A small PDF writer: enough to print a calendar, and nothing more.
 *
 * A page is a list of shapes (text, lines, boxes, circles, moons) in points, measured from
 * the top left corner. Text is set in Helvetica, which every PDF reader has built in, so
 * nothing is embedded and nothing is downloaded. Helvetica covers Western European letters
 * (the Windows-1252 set); canEncode says whether a text fits. For a calendar with names in
 * other scripts the site draws the same shapes on a canvas with the device's own fonts and
 * hands the picture to writePdf as a page instead.
 *
 * No dependencies, no browser needed: writePdf gives back bytes.
 */
import type { PrincipalPhase } from '../engine/index.js';

/** Paper sizes in points (1/72 inch). */
export const PAPER = Object.freeze({
  a4: Object.freeze({ width: 595.28, height: 841.89 }),
  letter: Object.freeze({ width: 612, height: 792 }),
});
export type Paper = keyof typeof PAPER;

/** A shade of grey: 0 is black, 1 is white. */
export type Grey = number;

export type Shape =
  | { kind: 'text'; x: number; y: number; text: string; size: number; bold?: boolean; align?: 'left' | 'center' | 'right'; grey?: Grey }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; width: number; grey?: Grey }
  | { kind: 'rect'; x: number; y: number; width: number; height: number; fill?: Grey; stroke?: Grey; strokeWidth?: number }
  | { kind: 'circle'; x: number; y: number; radius: number; fill?: Grey; stroke?: Grey; strokeWidth?: number }
  | { kind: 'moon'; x: number; y: number; radius: number; phase: PrincipalPhase };

/** A page of shapes. For text, y is the baseline. */
export interface VectorPage {
  width: number;
  height: number;
  shapes: Shape[];
}

/** A page that is one picture: a JPEG that fills it. */
export interface PicturePage {
  width: number;
  height: number;
  jpeg: Uint8Array;
  pixelWidth: number;
  pixelHeight: number;
}

export type PdfPage = VectorPage | PicturePage;

export interface PdfInfo {
  title: string;
  author?: string;
  subject?: string;
  /** The language of the text, for screen readers (default en-GB). */
  language?: string;
  /** When the file was made (default: now). */
  created?: Date;
}

// ---- Text: the Windows-1252 set and Helvetica's widths ----

/** Code points of bytes 0x80 to 0x9F in Windows-1252; 0 where the byte is unused. */
const HIGH = [
  0x20ac, 0, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0, 0x017d, 0, 0, 0x2018, 0x2019, 0x201c,
  0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0, 0x017e, 0x0178,
];

/** The Windows-1252 byte of a character, or -1 when it has none. */
function byteOf(char: string): number {
  const code = char.codePointAt(0) ?? 0;
  if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff)) return code;
  const high = HIGH.indexOf(code);
  return high >= 0 && code !== 0 ? 0x80 + high : -1;
}

/** Whether Helvetica in a PDF can show every character of a text. */
export function canEncode(text: string): boolean {
  for (const char of text) if (byteOf(char) < 0) return false;
  return true;
}

/** Widths of Helvetica and Helvetica-Bold for the characters from space to tilde, in thousandths of the type size. */
const REGULAR = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584,
  584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278,
  556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];
const BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584,
  584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333,
  611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];
/** Widths of the characters beyond tilde that a calendar is likely to use: [code point, regular, bold]. */
const OTHER: readonly (readonly [number, number, number])[] = [
  [0xa0, 278, 278], [0xb7, 278, 278], [0x2022, 350, 350], [0x2013, 556, 556], [0x2014, 1000, 1000], [0x2026, 1000, 1000], [0x2018, 222, 278],
  [0x2019, 222, 278], [0x201c, 333, 500], [0x201d, 333, 500], [0xd7, 584, 584], [0xb0, 400, 400], [0xdf, 611, 611], [0xe6, 889, 889],
  [0xc6, 1000, 1000], [0xf8, 611, 611], [0xd8, 778, 778], [0x153, 944, 944], [0x152, 1000, 1000], [0x20ac, 556, 556],
];

function charWidth(char: string, bold: boolean): number {
  const table = bold ? BOLD : REGULAR;
  const code = char.codePointAt(0) ?? 0;
  if (code >= 0x20 && code <= 0x7e) return table[code - 0x20]!;
  const other = OTHER.find((entry) => entry[0] === code);
  if (other !== undefined) return bold ? other[2] : other[1];
  // An accented letter is as wide as the letter under the accent.
  const base = char.normalize('NFD').codePointAt(0) ?? 0;
  if (base >= 0x20 && base <= 0x7e) return table[base - 0x20]!;
  return bold ? 611 : 556;
}

/** The width of a text in Helvetica, in points. */
export function textWidth(text: string, size: number, bold = false): number {
  let width = 0;
  for (const char of text) width += charWidth(char, bold);
  return (width * size) / 1000;
}

/** A text cut to fit a width, with an ellipsis when something had to go. */
export function fitText(text: string, maxWidth: number, size: number, bold = false, measure: typeof textWidth = textWidth): string {
  if (measure(text, size, bold) <= maxWidth) return text;
  const chars = Array.from(text);
  const ellipsis = String.fromCodePoint(0x2026);
  while (chars.length > 1 && measure(chars.join('').trimEnd() + ellipsis, size, bold) > maxWidth) chars.pop();
  return chars.join('').trimEnd() + ellipsis;
}

/** A text as a PDF hex string in Windows-1252; characters Helvetica lacks become question marks. */
function hexText(text: string): string {
  let hex = '';
  for (const char of text) {
    const byte = byteOf(char);
    hex += (byte < 0 ? 0x3f : byte).toString(16).padStart(2, '0');
  }
  return `<${hex}>`;
}

/** A text as a PDF hex string in UTF-16, for the document's title and other details, which may be in any script. */
function hexUnicode(text: string): string {
  let hex = 'feff';
  for (let i = 0; i < text.length; i++) hex += text.charCodeAt(i).toString(16).padStart(4, '0');
  return `<${hex}>`;
}

// ---- Drawing ----

/** A number as PDF writes it: no exponent, at most three decimals. */
const n = (value: number): string => {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? '0' : String(rounded);
};

/** How far a Bezier handle sits from its point to draw a quarter circle. */
const K = 0.5522847498;

/** The path of a circle, in PDF coordinates. */
function circlePath(cx: number, cy: number, r: number): string {
  const k = r * K;
  return [
    `${n(cx + r)} ${n(cy)} m`,
    `${n(cx + r)} ${n(cy + k)} ${n(cx + k)} ${n(cy + r)} ${n(cx)} ${n(cy + r)} c`,
    `${n(cx - k)} ${n(cy + r)} ${n(cx - r)} ${n(cy + k)} ${n(cx - r)} ${n(cy)} c`,
    `${n(cx - r)} ${n(cy - k)} ${n(cx - k)} ${n(cy - r)} ${n(cx)} ${n(cy - r)} c`,
    `${n(cx + k)} ${n(cy - r)} ${n(cx + r)} ${n(cy - k)} ${n(cx + r)} ${n(cy)} c`,
    'h',
  ].join('\n');
}

/** The path of half a disc: the left half for side -1, the right half for side 1. */
function halfPath(cx: number, cy: number, r: number, side: 1 | -1): string {
  const k = r * K;
  const s = side * r;
  const sk = side * k;
  return [
    `${n(cx)} ${n(cy + r)} m`,
    `${n(cx + sk)} ${n(cy + r)} ${n(cx + s)} ${n(cy + k)} ${n(cx + s)} ${n(cy)} c`,
    `${n(cx + s)} ${n(cy - k)} ${n(cx + sk)} ${n(cy - r)} ${n(cx)} ${n(cy - r)} c`,
    'h',
  ].join('\n');
}

function drawShape(shape: Shape, pageHeight: number, measure: typeof textWidth): string {
  const flip = (y: number): number => pageHeight - y;
  switch (shape.kind) {
    case 'text': {
      const width = shape.align === undefined || shape.align === 'left' ? 0 : measure(shape.text, shape.size, shape.bold ?? false);
      const x = shape.x - (shape.align === 'center' ? width / 2 : shape.align === 'right' ? width : 0);
      return `BT\n${n(shape.grey ?? 0)} g\n/${shape.bold ? 'F2' : 'F1'} ${n(shape.size)} Tf\n${n(x)} ${n(flip(shape.y))} Td\n${hexText(shape.text)} Tj\nET`;
    }
    case 'line':
      return `${n(shape.grey ?? 0)} G\n${n(shape.width)} w\n${n(shape.x1)} ${n(flip(shape.y1))} m\n${n(shape.x2)} ${n(flip(shape.y2))} l\nS`;
    case 'rect': {
      const path = `${n(shape.x)} ${n(flip(shape.y + shape.height))} ${n(shape.width)} ${n(shape.height)} re`;
      const fill = shape.fill === undefined ? '' : `${n(shape.fill)} g\n`;
      const stroke = shape.stroke === undefined ? '' : `${n(shape.stroke)} G\n${n(shape.strokeWidth ?? 0.5)} w\n`;
      return `${fill}${stroke}${path}\n${shape.fill !== undefined && shape.stroke !== undefined ? 'B' : shape.fill !== undefined ? 'f' : 'S'}`;
    }
    case 'circle': {
      const fill = shape.fill === undefined ? '' : `${n(shape.fill)} g\n`;
      const stroke = shape.stroke === undefined ? '' : `${n(shape.stroke)} G\n${n(shape.strokeWidth ?? 0.5)} w\n`;
      return `${fill}${stroke}${circlePath(shape.x, flip(shape.y), shape.radius)}\n${shape.fill !== undefined && shape.stroke !== undefined ? 'B' : shape.fill !== undefined ? 'f' : 'S'}`;
    }
    case 'moon': {
      // New: a dark disc. Full: an open ring. Quarters: half dark, the lit half on the right
      // for the first quarter, as the Moon looks from the north of Earth.
      const cy = flip(shape.y);
      const ring = `0 G\n${n(Math.max(0.3, shape.radius / 6))} w\n`;
      const circle = circlePath(shape.x, cy, shape.radius);
      if (shape.phase === 'new') return `0 g\n${ring}${circle}\nB`;
      if (shape.phase === 'full') return `1 g\n${ring}${circle}\nB`;
      return `1 g\n${ring}${circle}\nB\n0 g\n${halfPath(shape.x, cy, shape.radius, shape.phase === 'first-quarter' ? -1 : 1)}\nf`;
    }
  }
}

// ---- The file ----

const ascii = (text: string): Uint8Array => Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff);

/** A date as PDF writes it: D:20261114213000Z. */
const pdfDate = (date: Date): string => `(D:${date.toISOString().replace(/[-:T]/g, '').replace(/\.\d+Z$/, 'Z')})`;

/**
 * Writes a PDF. Each page is either a list of shapes or one JPEG picture.
 * @param options.measure how wide a text is, when the pages were laid out with something other than Helvetica's own widths
 */
export function writePdf(pages: readonly PdfPage[], info: PdfInfo, options: { measure?: typeof textWidth } = {}): Uint8Array {
  const measure = options.measure ?? textWidth;
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (chunk: Uint8Array | string): void => {
    const bytes = typeof chunk === 'string' ? ascii(chunk) : chunk;
    chunks.push(bytes);
    length += bytes.length;
  };
  /** Starts object number `id` (1-based). */
  const begin = (id: number): void => {
    offsets[id] = length;
    push(`${id} 0 obj\n`);
  };
  const stream = (id: number, dictionary: string, data: Uint8Array): void => {
    begin(id);
    push(`<< ${dictionary} /Length ${data.length} >>\nstream\n`);
    push(data);
    push('\nendstream\nendobj\n');
  };

  // Objects 1 to 5 are the catalogue, the page tree, the two fonts and the details; then come
  // two or three per page: the page, its contents, and its picture if it is one.
  const first = 6;
  const ids: { page: number; contents: number; image: number | null }[] = [];
  let next = first;
  for (const page of pages) {
    const picture = 'jpeg' in page;
    ids.push({ page: next, contents: next + 1, image: picture ? next + 2 : null });
    next += picture ? 3 : 2;
  }

  // The second line is four bytes above 127, so that anything handling the file treats it as binary.
  push('%PDF-1.4\n');
  push(Uint8Array.from([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  begin(1);
  push(`<< /Type /Catalog /Pages 2 0 R /Lang (${(info.language ?? 'en-GB').replace(/[^A-Za-z0-9-]/g, '')}) /ViewerPreferences << /DisplayDocTitle true >> >>\nendobj\n`);
  begin(2);
  push(`<< /Type /Pages /Count ${pages.length} /Kids [${ids.map((id) => `${id.page} 0 R`).join(' ')}] >>\nendobj\n`);
  begin(3);
  push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n');
  begin(4);
  push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n');
  begin(5);
  const created = pdfDate(info.created ?? new Date());
  push(
    `<< /Title ${hexUnicode(info.title)}${info.author === undefined ? '' : ` /Author ${hexUnicode(info.author)}`}` +
      `${info.subject === undefined ? '' : ` /Subject ${hexUnicode(info.subject)}`} /Creator ${hexUnicode('Calendar, cal.eurth.org')}` +
      ` /Producer ${hexUnicode('@eurth/calendar')} /CreationDate ${created} /ModDate ${created} >>\nendobj\n`,
  );

  pages.forEach((page, i) => {
    const id = ids[i]!;
    const box = `[0 0 ${n(page.width)} ${n(page.height)}]`;
    begin(id.page);
    if ('jpeg' in page) {
      push(`<< /Type /Page /Parent 2 0 R /MediaBox ${box} /Resources << /XObject << /Im0 ${id.image!} 0 R >> >> /Contents ${id.contents} 0 R >>\nendobj\n`);
      stream(id.contents, '', ascii(`q\n${n(page.width)} 0 0 ${n(page.height)} 0 0 cm\n/Im0 Do\nQ`));
      stream(
        id.image!,
        `/Type /XObject /Subtype /Image /Width ${Math.round(page.pixelWidth)} /Height ${Math.round(page.pixelHeight)} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,
        page.jpeg,
      );
    } else {
      push(`<< /Type /Page /Parent 2 0 R /MediaBox ${box} /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${id.contents} 0 R >>\nendobj\n`);
      stream(id.contents, '', ascii(page.shapes.map((shape) => drawShape(shape, page.height, measure)).join('\n')));
    }
  });

  const xref = length;
  const count = next;
  push(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let id = 1; id < count; id++) push(`${String(offsets[id]!).padStart(10, '0')} 00000 n \n`);
  push(`trailer\n<< /Size ${count} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  const out = new Uint8Array(length);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}
