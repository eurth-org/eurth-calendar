/**
 * The calendar itself: a definition, made ready to answer questions.
 *
 * Every date has a day count: a whole number, 0 for day 1 of year 1, 1 for the day after, -1
 * for the day before. Day counts are what the engine does its sums in, what a timeline sorts
 * by, and the bridge to the Gregorian calendar.
 *
 * Nothing here loops over years. The start of any year is worked out directly from the leap
 * rules, so year 3,000,000 costs the same as year 3.
 */
import { formatDate } from './format.js';
import { gregorianToRataDie, isValidGregorian, parseIsoDate, rataDieToGregorian } from './gregorian.js';
import { holidaysInYear } from './holidays.js';
import { LIMITS } from './limits.js';
import { floorDiv, lcm, mod } from './math.js';
import { moonOn, moonPhasesBetween } from './moons.js';
import { normalizeCalendar, type Issue } from './normalize.js';
import type {
  CalendarDate,
  CalendarDefinition,
  DateStyle,
  DayInfo,
  GregorianDate,
  HolidayOccurrence,
  LeapRule,
  MoonEvent,
  MoonState,
  YearLayout,
  YearPart,
} from './types.js';

/** A month or an intercalary block, in its place in the year. */
interface Slot {
  kind: 'month' | 'intercalary';
  /** 1-based index into months or intercalary. */
  index: number;
  name: string;
  base: number;
  inWeek: boolean;
}

/** A leap rule, with what the sums need worked out once. */
interface Rule {
  source: LeapRule;
  /** The least common multiples down the chain: every, every and the first exception, and so on. */
  chain: number[];
  slot: number;
  /** The days it adds that are days of the week. */
  weekDays: number;
}

/** The lengths of a year's slots for one combination of leap rules. */
interface Shape {
  lengths: number[];
  /** Days before each slot. */
  starts: number[];
  /** Days of the week before each slot. */
  weekStarts: number[];
  days: number;
}

/** Where a day count falls. */
interface Place {
  year: number;
  yearStart: number;
  shape: Shape;
  slot: number;
  /** 0-based day within the slot. */
  offset: number;
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

const isMonthDate = (date: CalendarDate): date is { year: number; month: number; day: number } => 'month' in date;

export class Calendar {
  /** The definition this calendar runs on: cleaned, complete and frozen. */
  readonly definition: CalendarDefinition;
  /** What had to be changed in the definition it was given. Empty when it was fine. */
  readonly issues: readonly Issue[];
  /** Days in an ordinary year. */
  readonly daysPerYear: number;
  /** The average length of a year, leap years included. */
  readonly meanYear: number;
  /** The first and last year the calendar covers. */
  readonly minYear = -LIMITS.maxYear;
  readonly maxYear = LIMITS.maxYear;
  /** The first and last day count the calendar covers. */
  readonly minDays: number;
  readonly maxDays: number;

  readonly #slots: Slot[];
  readonly #monthSlot: number[];
  readonly #intercalarySlot: number[];
  readonly #rules: Rule[];
  readonly #weekDaysPerYear: number;
  readonly #wobble: number;
  readonly #shapes = new Map<number, Shape>();
  readonly #epoch: number | null;
  readonly #holidays = new Map<number, HolidayOccurrence[]>();

  constructor(definition: unknown) {
    const { calendar, issues } = normalizeCalendar(definition);
    this.definition = deepFreeze(calendar);
    this.issues = Object.freeze(issues);

    // The year in order: before each month, the intercalary blocks that follow the month before it.
    const slots: Slot[] = [];
    this.#monthSlot = [];
    this.#intercalarySlot = [];
    for (let position = 0; position <= calendar.months.length; position++) {
      calendar.intercalary.forEach((block, i) => {
        if (block.after !== position) return;
        this.#intercalarySlot[i] = slots.length;
        slots.push({ kind: 'intercalary', index: i + 1, name: block.name, base: block.days, inWeek: block.inWeek });
      });
      const month = calendar.months[position];
      if (month !== undefined) {
        this.#monthSlot[position] = slots.length;
        slots.push({ kind: 'month', index: position + 1, name: month.name, base: month.days, inWeek: true });
      }
    }
    this.#slots = slots;

    this.#rules = calendar.leap.map((source) => {
      const chain = [source.every];
      for (const exception of source.except) chain.push(lcm(chain[chain.length - 1]!, exception));
      const slot = 'month' in source.to ? this.#monthSlot[source.to.month - 1]! : this.#intercalarySlot[source.to.intercalary - 1]!;
      return { source, chain, slot, weekDays: slots[slot]!.inWeek ? source.days : 0 };
    });

    this.daysPerYear = slots.reduce((sum, slot) => sum + slot.base, 0);
    this.#weekDaysPerYear = slots.reduce((sum, slot) => sum + (slot.inWeek ? slot.base : 0), 0);

    // How far the true start of a year can stray from "years times the average": less than one
    // leap's worth of days per term of each rule's chain.
    let mean = this.daysPerYear;
    let wobble = 0;
    for (const rule of this.#rules) {
      rule.chain.forEach((cycle, i) => {
        mean += ((i % 2 === 0 ? 1 : -1) * rule.source.days) / cycle;
      });
      wobble += rule.source.days * rule.chain.length;
    }
    this.meanYear = mean;
    this.#wobble = wobble;

    const epoch = calendar.epoch === null ? null : parseIsoDate(calendar.epoch);
    this.#epoch = epoch === null ? null : gregorianToRataDie(epoch);

    this.minDays = this.yearStart(this.minYear);
    this.maxDays = this.yearStart(this.maxYear + 1) - 1;
  }

  /** Whether the calendar is tied to Earth's: whether day 1 of year 1 has a Gregorian date. */
  get linked(): boolean {
    return this.#epoch !== null;
  }

  // ---- Years ----

  /** The leap years of one rule from year 1 up to and including `year` (negative for years before year 1). */
  #leapsThrough(rule: Rule, year: number): number {
    let count = 0;
    for (let i = 0; i < rule.chain.length; i++) {
      const n = floorDiv(year, rule.chain[i]!);
      count += i % 2 === 0 ? n : -n;
    }
    return count;
  }

  #ruleMatches(rule: Rule, year: number): boolean {
    if (mod(year, rule.source.every) !== 0) return false;
    let leap = true;
    for (const exception of rule.source.except) {
      if (mod(year, exception) !== 0) break;
      leap = !leap;
    }
    return leap;
  }

  /** Which rules match a year, as bits. */
  #mask(year: number): number {
    let mask = 0;
    for (let i = 0; i < this.#rules.length; i++) {
      if (this.#ruleMatches(this.#rules[i]!, year)) mask |= 1 << i;
    }
    return mask;
  }

  #shape(mask: number): Shape {
    let shape = this.#shapes.get(mask);
    if (shape === undefined) {
      const lengths = this.#slots.map((slot) => slot.base);
      this.#rules.forEach((rule, i) => {
        if (mask & (1 << i)) lengths[rule.slot]! += rule.source.days;
      });
      const starts: number[] = [];
      const weekStarts: number[] = [];
      let days = 0;
      let weekDays = 0;
      lengths.forEach((length, i) => {
        starts.push(days);
        weekStarts.push(weekDays);
        days += length;
        if (this.#slots[i]!.inWeek) weekDays += length;
      });
      shape = { lengths, starts, weekStarts, days };
      this.#shapes.set(mask, shape);
    }
    return shape;
  }

  #checkYear(year: number): void {
    if (!Number.isInteger(year) || year < this.minYear || year > this.maxYear) {
      throw new RangeError(`The year must be a whole number from ${this.minYear} to ${this.maxYear}.`);
    }
  }

  /** Whether any leap rule matches the year. */
  isLeapYear(year: number): boolean {
    this.#checkYear(year);
    return this.#mask(year) !== 0;
  }

  /** The length of a year in days. */
  yearLength(year: number): number {
    this.#checkYear(year);
    return this.#shape(this.#mask(year)).days;
  }

  /**
   * The day count of the first day of a year. Also answers for the year after the last one,
   * so that the end of the last year can be found.
   */
  yearStart(year: number): number {
    if (!Number.isInteger(year) || year < this.minYear || year > this.maxYear + 1) {
      throw new RangeError(`The year must be a whole number from ${this.minYear} to ${this.maxYear}.`);
    }
    let start = (year - 1) * this.daysPerYear;
    for (const rule of this.#rules) start += rule.source.days * this.#leapsThrough(rule, year - 1);
    return start;
  }

  /** How many days of the week come before the first day of a year, counted from day 1 of year 1. */
  #weekCountAtYearStart(year: number): number {
    let count = (year - 1) * this.#weekDaysPerYear;
    for (const rule of this.#rules) count += rule.weekDays * this.#leapsThrough(rule, year - 1);
    return count;
  }

  /** A year laid out: its months and intercalary blocks in order, with their lengths that year. */
  year(year: number): YearLayout {
    this.#checkYear(year);
    const mask = this.#mask(year);
    const shape = this.#shape(mask);
    const start = this.yearStart(year);
    const parts: YearPart[] = this.#slots.map((slot, i) => ({
      kind: slot.kind,
      index: slot.index,
      name: slot.name,
      days: shape.lengths[i]!,
      start: start + shape.starts[i]!,
      inWeek: slot.inWeek,
    }));
    return { year, start, days: shape.days, leap: mask !== 0, parts };
  }

  /** The length of a month in a year. */
  monthLength(year: number, month: number): number {
    this.#checkYear(year);
    const slot = this.#monthSlot[month - 1];
    if (!Number.isInteger(month) || slot === undefined) throw new RangeError(`There is no month ${month}.`);
    return this.#shape(this.#mask(year)).lengths[slot]!;
  }

  /** The length of an intercalary block in a year. 0 when it does not occur that year. */
  intercalaryLength(year: number, intercalary: number): number {
    this.#checkYear(year);
    const slot = this.#intercalarySlot[intercalary - 1];
    if (!Number.isInteger(intercalary) || slot === undefined) throw new RangeError(`There is no intercalary block ${intercalary}.`);
    return this.#shape(this.#mask(year)).lengths[slot]!;
  }

  /** The longest an intercalary block ever is. A block that is never more than a day long is written without a day number. */
  longestIntercalary(intercalary: number): number {
    const slot = this.#intercalarySlot[intercalary - 1];
    if (slot === undefined) throw new RangeError(`There is no intercalary block ${intercalary}.`);
    return this.#rules.reduce((sum, rule) => (rule.slot === slot ? sum + rule.source.days : sum), this.#slots[slot]!.base);
  }

  // ---- Dates and day counts ----

  #slotOf(date: CalendarDate): number | undefined {
    return isMonthDate(date) ? this.#monthSlot[date.month - 1] : this.#intercalarySlot[date.intercalary - 1];
  }

  /** Whether a date exists in this calendar. 30 February does not; nor does Midyear Day in a year without one. */
  isValidDate(date: CalendarDate): boolean {
    if (typeof date !== 'object' || date === null) return false;
    const { year, day } = date;
    if (!Number.isInteger(year) || year < this.minYear || year > this.maxYear || !Number.isInteger(day) || day < 1) return false;
    const index = isMonthDate(date) ? date.month : date.intercalary;
    const slot = Number.isInteger(index) ? this.#slotOf(date) : undefined;
    return slot !== undefined && day <= this.#shape(this.#mask(year)).lengths[slot]!;
  }

  /** The day count of a date. Throws a RangeError for a date that does not exist. */
  toDays(date: CalendarDate): number {
    if (!this.isValidDate(date)) {
      throw new RangeError(`There is no such date in ${this.definition.name || 'this calendar'}: ${JSON.stringify(date)}.`);
    }
    const slot = this.#slotOf(date)!;
    return this.yearStart(date.year) + this.#shape(this.#mask(date.year)).starts[slot]! + date.day - 1;
  }

  #checkDays(days: number): void {
    if (!Number.isInteger(days) || days < this.minDays || days > this.maxDays) {
      throw new RangeError(`The day count must be a whole number from ${this.minDays} to ${this.maxDays}.`);
    }
  }

  /** The year a day count falls in. */
  yearOf(days: number): number {
    this.#checkDays(days);
    // Start from the average, then close in. The true year is never further off than the wobble allows.
    const guess = Math.floor(days / this.meanYear) + 1;
    const reach = Math.ceil(this.#wobble / this.meanYear) + 2;
    let low = Math.max(this.minYear, guess - reach);
    let high = Math.min(this.maxYear, guess + reach);
    // The largest year that starts on or before the day.
    while (low < high) {
      const middle = low + Math.ceil((high - low) / 2);
      if (this.yearStart(middle) <= days) low = middle;
      else high = middle - 1;
    }
    return low;
  }

  #place(days: number): Place {
    const year = this.yearOf(days);
    const yearStart = this.yearStart(year);
    const shape = this.#shape(this.#mask(year));
    const dayOfYear = days - yearStart;
    // The last slot that starts on or before the day. Empty slots share their start with the
    // slot after them, so the last one is always the one that holds the day.
    let low = 0;
    let high = shape.starts.length - 1;
    while (low < high) {
      const middle = low + Math.ceil((high - low) / 2);
      if (shape.starts[middle]! <= dayOfYear) low = middle;
      else high = middle - 1;
    }
    return { year, yearStart, shape, slot: low, offset: dayOfYear - shape.starts[low]! };
  }

  #dateAt(place: Place): CalendarDate {
    const slot = this.#slots[place.slot]!;
    return slot.kind === 'month'
      ? { year: place.year, month: slot.index, day: place.offset + 1 }
      : { year: place.year, intercalary: slot.index, day: place.offset + 1 };
  }

  #weekdayAt(place: Place): number | null {
    if (!this.#slots[place.slot]!.inWeek) return null;
    const count = this.#weekCountAtYearStart(place.year) + place.shape.weekStarts[place.slot]! + place.offset;
    return mod(count + this.definition.firstWeekday - 1, this.definition.weekdays.length) + 1;
  }

  /** The date of a day count. */
  fromDays(days: number): CalendarDate {
    return this.#dateAt(this.#place(days));
  }

  /** The day of the week of a day count (1-based), or null for a day that stands outside the week. */
  weekday(days: number): number | null {
    return this.#weekdayAt(this.#place(days));
  }

  /** The day of the year of a day count (1-based). */
  dayOfYear(days: number): number {
    const place = this.#place(days);
    return days - place.yearStart + 1;
  }

  // ---- Earth ----

  /** The Gregorian date of a day count. Null when the calendar has no link to Earth. */
  toGregorian(days: number): GregorianDate | null {
    this.#checkDays(days);
    return this.#epoch === null ? null : rataDieToGregorian(this.#epoch + days);
  }

  /**
   * The day count of a Gregorian date. Null when the calendar has no link to Earth; a
   * RangeError for a date that does not exist or lies outside the years the calendar covers.
   */
  fromGregorian(date: GregorianDate): number | null {
    if (this.#epoch === null) return null;
    if (!isValidGregorian(date)) throw new RangeError(`There is no such Gregorian date: ${JSON.stringify(date)}.`);
    const days = gregorianToRataDie(date) - this.#epoch;
    this.#checkDays(days);
    return days;
  }

  // ---- Moons ----

  /** Every moon as it looks on a day. */
  moonsOn(days: number): MoonState[] {
    this.#checkDays(days);
    return this.definition.moons.map((moon, i) => ({ moon: i + 1, name: moon.name, ...moonOn(moon, days) }));
  }

  /**
   * The new moons, quarters and full moons from day `from` to day `to` inclusive, in order.
   * Give `moon` (1-based) to list one moon only.
   */
  moonEvents(from: number, to: number, moon?: number): MoonEvent[] {
    this.#checkDays(from);
    this.#checkDays(to);
    const events: MoonEvent[] = [];
    this.definition.moons.forEach((definition, i) => {
      if (moon !== undefined && moon !== i + 1) return;
      for (const event of moonPhasesBetween(definition, from, to)) {
        events.push({ moon: i + 1, name: definition.name, ...event });
      }
    });
    return events.sort((a, b) => a.days - b.days || a.moon - b.moon);
  }

  // ---- Holidays ----

  /** The holidays of a year, in order. */
  holidays(year: number): HolidayOccurrence[] {
    this.#checkYear(year);
    let found = this.#holidays.get(year);
    if (found === undefined) {
      found = holidaysInYear(this, year);
      if (this.#holidays.size >= 64) this.#holidays.clear();
      this.#holidays.set(year, found);
    }
    return found.map((occurrence) => ({ ...occurrence, date: { ...occurrence.date } }));
  }

  /** The holidays that fall on a day. */
  holidaysOn(days: number): HolidayOccurrence[] {
    return this.holidays(this.yearOf(days)).filter((occurrence) => occurrence.days === days);
  }

  /** The holidays from day `from` to day `to` inclusive, in order. At most 1000 years at a time. */
  holidaysBetween(from: number, to: number): HolidayOccurrence[] {
    if (to < from) return [];
    const first = this.yearOf(from);
    const last = this.yearOf(to);
    if (last - first > 1000) throw new RangeError('That is too long a span to list holidays for; ask for 1000 years or fewer.');
    const out: HolidayOccurrence[] = [];
    for (let year = first; year <= last; year++) {
      for (const occurrence of this.holidays(year)) {
        if (occurrence.days >= from && occurrence.days <= to) out.push(occurrence);
      }
    }
    return out;
  }

  // ---- Words ----

  /**
   * A date written out. Styles: "long" (17 Harvestmoon 1022 FS, the default), "full" (with the
   * day of the week in front), "short" (17 Har 1022 FS) and "numeric" (1022-09-17).
   */
  format(date: number | CalendarDate, style: DateStyle = 'long'): string {
    const days = typeof date === 'number' ? date : this.toDays(date);
    const place = this.#place(days);
    return formatDate(this, this.#dateAt(place), style, this.#weekdayAt(place));
  }

  /** Everything about one day: its date, weekday, Gregorian date, moons and holidays. */
  day(days: number): DayInfo {
    const place = this.#place(days);
    return {
      days,
      date: this.#dateAt(place),
      weekday: this.#weekdayAt(place),
      dayOfYear: days - place.yearStart + 1,
      gregorian: this.toGregorian(days),
      moons: this.moonsOn(days),
      holidays: this.holidays(place.year).filter((occurrence) => occurrence.days === days),
    };
  }
}

/**
 * Makes a calendar ready to use. The definition may come from anywhere: it is cleaned first
 * (see normalizeCalendar), and `issues` on the result lists anything that had to change.
 */
export function createCalendar(definition: unknown): Calendar {
  return new Calendar(definition);
}
