/**
 * A calendar as a piece of a link.
 *
 * Nothing is stored anywhere: a calendar lives in its address. encodeCalendar packs the
 * definition tightly (short keys, lists instead of objects, nothing that is at its default)
 * and writes it as "<version>.<base64url>", the same form @eurth/style's links use.
 * decodeCalendar reads it back, and never trusts it: whatever arrives is cleaned by
 * normalizeCalendar, so a mangled or hostile link gives a tidy calendar or null, never an error.
 *
 * Calendar hands a calendar to Time the same way: time.eurth.org/?cal=<this text>.
 */
import { normalizeCalendar, PRINCIPAL_PHASES, type Issue } from './normalize.js';
import { DEFINITION_VERSION, type CalendarDefinition } from './types.js';

/** The query parameter that carries a calendar from one Eurth tool to another. */
export const CALENDAR_PARAM = 'cal';

/** The longest encoded calendar that will be read. A full calendar is a few thousand characters. */
export const MAX_ENCODED_LENGTH = 60_000;

const toBase64Url = (text: string): string => {
  let binary = '';
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (text: string): string => {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
};

/** The packed form: see the comments on each key. */
interface Packed {
  /** name */
  n?: string;
  /** era */
  e?: string;
  /** eraBefore */
  b?: string;
  /** months: [name, days] or [name, days, short] */
  m: (string | number)[][];
  /** intercalary: [name, after, days, inWeek as 0 or 1] */
  i?: (string | number)[][];
  /** weekdays */
  w: string[];
  /** firstWeekday, when not 1 */
  f?: number;
  /** leap rules: [every, days, 0 for a month or 1 for an intercalary block, its index, ...exceptions] */
  l?: number[][];
  /** epoch */
  g?: string;
  /** moons: [name, period, phase] */
  o?: (string | number)[][];
  /**
   * holidays: [0, name, month, day], [1, name, intercalary, day], [2, name, month, weekday, nth]
   * or [3, name, moon, phase as 0 to 3, nth, month]
   */
  h?: (string | number)[][];
}

function pack(d: CalendarDefinition): Packed {
  const packed: Packed = {
    m: d.months.map((month) => (month.short === undefined ? [month.name, month.days] : [month.name, month.days, month.short])),
    w: [...d.weekdays],
  };
  if (d.name !== '') packed.n = d.name;
  if (d.era !== '') packed.e = d.era;
  if (d.eraBefore !== '') packed.b = d.eraBefore;
  if (d.intercalary.length > 0) packed.i = d.intercalary.map((block) => [block.name, block.after, block.days, block.inWeek ? 1 : 0]);
  if (d.firstWeekday !== 1) packed.f = d.firstWeekday;
  if (d.leap.length > 0) {
    packed.l = d.leap.map((rule) =>
      'month' in rule.to ? [rule.every, rule.days, 0, rule.to.month, ...rule.except] : [rule.every, rule.days, 1, rule.to.intercalary, ...rule.except],
    );
  }
  if (d.epoch !== null) packed.g = d.epoch;
  if (d.moons.length > 0) packed.o = d.moons.map((moon) => [moon.name, moon.period, moon.phase]);
  if (d.holidays.length > 0) {
    packed.h = d.holidays.map((holiday) => {
      if (holiday.type === 'date') {
        return holiday.month !== undefined ? [0, holiday.name, holiday.month, holiday.day] : [1, holiday.name, holiday.intercalary ?? 1, holiday.day];
      }
      if (holiday.type === 'weekday') return [2, holiday.name, holiday.month, holiday.weekday, holiday.nth];
      return [3, holiday.name, holiday.moon, PRINCIPAL_PHASES.indexOf(holiday.phase), holiday.nth, holiday.month];
    });
  }
  return packed;
}

const rows = (value: unknown): unknown[][] => (Array.isArray(value) ? value.filter((row): row is unknown[] => Array.isArray(row)) : []);

/** The packed form opened out into the shape of a definition, unchecked. */
function unpack(packed: Record<string, unknown>): unknown {
  return {
    v: DEFINITION_VERSION,
    name: packed.n,
    era: packed.e,
    eraBefore: packed.b,
    months: rows(packed.m).map(([name, days, short]) => ({ name, days, short })),
    intercalary: rows(packed.i).map(([name, after, days, inWeek]) => ({ name, after, days, inWeek: inWeek === 1 })),
    weekdays: packed.w,
    firstWeekday: packed.f,
    leap: rows(packed.l).map(([every, days, kind, index, ...except]) => ({
      every,
      except,
      days,
      to: kind === 1 ? { intercalary: index } : { month: index },
    })),
    epoch: packed.g,
    moons: rows(packed.o).map(([name, period, phase]) => ({ name, period, phase })),
    holidays: rows(packed.h).map(([kind, name, a, b, c, d]) => {
      if (kind === 0) return { type: 'date', name, month: a, day: b };
      if (kind === 1) return { type: 'date', name, intercalary: a, day: b };
      if (kind === 2) return { type: 'weekday', name, month: a, weekday: b, nth: c };
      if (kind === 3) return { type: 'moon', name, moon: a, phase: typeof b === 'number' ? PRINCIPAL_PHASES[b] : undefined, nth: c, month: d };
      return { type: 'unknown', name };
    }),
  };
}

/** A calendar as link text: "1.eyJtIjpb…". The definition is cleaned first. */
export function encodeCalendar(definition: unknown): string {
  return `${DEFINITION_VERSION}.${toBase64Url(JSON.stringify(pack(normalizeCalendar(definition).calendar)))}`;
}

/**
 * Reads link text back into a calendar definition. Null when the text is not a calendar at
 * all (too long, malformed, from a version this package does not know); otherwise a clean
 * definition and a list of whatever had to be put right.
 */
export function decodeCalendar(text: unknown): { calendar: CalendarDefinition; issues: Issue[] } | null {
  if (typeof text !== 'string' || text.length > MAX_ENCODED_LENGTH) return null;
  const found = /^(\d{1,4})\.([A-Za-z0-9_-]+)$/.exec(text);
  if (!found || Number(found[1]) !== DEFINITION_VERSION) return null;
  let packed: unknown;
  try {
    packed = JSON.parse(fromBase64Url(found[2]!));
  } catch {
    return null;
  }
  if (typeof packed !== 'object' || packed === null || Array.isArray(packed)) return null;
  const record = packed as Record<string, unknown>;
  if (!Array.isArray(record.m) || !Array.isArray(record.w)) return null;
  return normalizeCalendar(unpack(record));
}

/**
 * A link that carries a calendar: the address given, with the calendar as its only query
 * parameter. calendarLink('https://time.eurth.org/', definition) is what "Use in a timeline" opens.
 */
export function calendarLink(base: string, definition: unknown, param: string = CALENDAR_PARAM): string {
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  url.searchParams.set(param, encodeCalendar(definition));
  return url.toString();
}

/** The calendar a link carries, if it carries one. Takes a whole address or just its query string. */
export function calendarFromLink(
  link: string,
  param: string = CALENDAR_PARAM,
): { calendar: CalendarDefinition; issues: Issue[] } | null {
  let search: string;
  try {
    search = link.includes('://') ? new URL(link).search : link;
  } catch {
    return null;
  }
  return decodeCalendar(new URLSearchParams(search).get(param));
}
