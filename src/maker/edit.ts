/**
 * Changing a calendar without breaking it.
 *
 * Leap rules, holidays and intercalary days point at months, weekdays and moons by number.
 * Take a month out and everything after it shifts by one; these functions do the shifting, and
 * drop what pointed at the thing that went. Each one takes a definition and gives back a new,
 * clean one; none changes what it was given.
 */
import { LIMITS, normalizeCalendar, type CalendarDefinition, type Holiday, type LeapRule } from '../engine/index.js';

const copy = (definition: CalendarDefinition): CalendarDefinition => JSON.parse(JSON.stringify(definition)) as CalendarDefinition;
const clean = (definition: CalendarDefinition): CalendarDefinition => normalizeCalendar(definition).calendar;

/** Where item `index` ends up after the item at `from` is moved to `to` (all 1-based). */
function moved(index: number, from: number, to: number): number {
  if (index === from) return to;
  if (from < to && index > from && index <= to) return index - 1;
  if (from > to && index >= to && index < from) return index + 1;
  return index;
}

/** A name not yet in the list: "Month 13", "Month 14". */
function freshName(taken: string[], word: string): string {
  for (let n = taken.length + 1; ; n++) {
    const name = `${word} ${n}`;
    if (!taken.includes(name)) return name;
  }
}

/** Spreads a number of days as evenly as it goes over a number of months, longer months first: 365 over 12 gives five of 31 and seven of 30. */
export function evenMonths(total: number, count: number): number[] {
  const months = Math.max(1, Math.round(count));
  const days = Math.max(months, Math.round(total));
  const base = Math.floor(days / months);
  const extra = days - base * months;
  return Array.from({ length: months }, (_, i) => base + (i < extra ? 1 : 0));
}

/**
 * Sets the length of the ordinary year by spreading the days evenly over the months. Days in
 * intercalary blocks are left as they are and count towards the total.
 */
export function setYearLength(definition: CalendarDefinition, total: number): CalendarDefinition {
  const next = copy(definition);
  const outside = next.intercalary.reduce((sum, block) => sum + block.days, 0);
  const lengths = evenMonths(Math.max(next.months.length, Math.round(total) - outside), next.months.length);
  next.months.forEach((month, i) => {
    month.days = Math.min(LIMITS.monthDays, lengths[i]!);
  });
  return clean(next);
}

/** Adds a month at the end, as long as the one before it. Nothing happens once the limit is reached. */
export function addMonth(definition: CalendarDefinition): CalendarDefinition {
  if (definition.months.length >= LIMITS.months) return clean(copy(definition));
  const next = copy(definition);
  const count = next.months.length;
  next.months.push({ name: freshName(next.months.map((m) => m.name), 'Month'), days: next.months[count - 1]?.days ?? 30 });
  // What closed the year still closes it.
  for (const block of next.intercalary) if (block.after === count) block.after = count + 1;
  return clean(next);
}

/**
 * Takes a month out (1-based). Leap rules and holidays that pointed at it go with it;
 * everything pointing at a later month follows that month down. The last month cannot be removed.
 */
export function removeMonth(definition: CalendarDefinition, month: number): CalendarDefinition {
  if (definition.months.length <= 1 || month < 1 || month > definition.months.length) return clean(copy(definition));
  const next = copy(definition);
  next.months.splice(month - 1, 1);
  const shift = (index: number): number => (index > month ? index - 1 : index);
  for (const block of next.intercalary) if (block.after >= month) block.after -= 1;
  next.leap = next.leap.flatMap((rule): LeapRule[] => {
    if (!('month' in rule.to)) return [rule];
    return rule.to.month === month ? [] : [{ ...rule, to: { month: shift(rule.to.month) } }];
  });
  next.holidays = next.holidays.flatMap((holiday): Holiday[] => {
    if (holiday.type === 'moon') {
      if (holiday.month === month) return [];
      return [{ ...holiday, month: holiday.month === 0 ? 0 : shift(holiday.month) }];
    }
    if (holiday.month === undefined) return [holiday];
    return holiday.month === month ? [] : [{ ...holiday, month: shift(holiday.month) }];
  });
  return clean(next);
}

/** Moves a month from one place to another (both 1-based). Everything that pointed at a month still points at the same month. */
export function moveMonth(definition: CalendarDefinition, from: number, to: number): CalendarDefinition {
  const count = definition.months.length;
  if (from < 1 || from > count || to < 1 || to > count || from === to) return clean(copy(definition));
  const next = copy(definition);
  const [month] = next.months.splice(from - 1, 1);
  next.months.splice(to - 1, 0, month!);
  for (const rule of next.leap) if ('month' in rule.to) rule.to = { month: moved(rule.to.month, from, to) };
  for (const holiday of next.holidays) {
    if (holiday.type === 'moon') {
      if (holiday.month !== 0) holiday.month = moved(holiday.month, from, to);
    } else if (holiday.month !== undefined) {
      holiday.month = moved(holiday.month, from, to);
    }
  }
  // An intercalary block stays behind the month it followed.
  for (const block of next.intercalary) {
    if (block.after >= 1 && block.after < count) block.after = moved(block.after, from, to);
  }
  return clean(next);
}

/** Takes an intercalary block out (1-based), with the leap rules and holidays that pointed at it. */
export function removeIntercalary(definition: CalendarDefinition, intercalary: number): CalendarDefinition {
  if (intercalary < 1 || intercalary > definition.intercalary.length) return clean(copy(definition));
  const next = copy(definition);
  next.intercalary.splice(intercalary - 1, 1);
  const shift = (index: number): number => (index > intercalary ? index - 1 : index);
  next.leap = next.leap.flatMap((rule): LeapRule[] => {
    if (!('intercalary' in rule.to)) return [rule];
    return rule.to.intercalary === intercalary ? [] : [{ ...rule, to: { intercalary: shift(rule.to.intercalary) } }];
  });
  next.holidays = next.holidays.flatMap((holiday): Holiday[] => {
    if (holiday.type !== 'date' || holiday.intercalary === undefined) return [holiday];
    return holiday.intercalary === intercalary ? [] : [{ ...holiday, intercalary: shift(holiday.intercalary) }];
  });
  return clean(next);
}

/** Takes a day out of the week (1-based). Holidays on that weekday go with it. A week keeps at least one day. */
export function removeWeekday(definition: CalendarDefinition, weekday: number): CalendarDefinition {
  if (definition.weekdays.length <= 1 || weekday < 1 || weekday > definition.weekdays.length) return clean(copy(definition));
  const next = copy(definition);
  next.weekdays.splice(weekday - 1, 1);
  if (next.firstWeekday > weekday) next.firstWeekday -= 1;
  next.firstWeekday = Math.min(next.firstWeekday, next.weekdays.length);
  next.holidays = next.holidays.flatMap((holiday): Holiday[] => {
    if (holiday.type !== 'weekday') return [holiday];
    if (holiday.weekday === weekday) return [];
    return [{ ...holiday, weekday: holiday.weekday > weekday ? holiday.weekday - 1 : holiday.weekday }];
  });
  return clean(next);
}

/** Takes a moon out (1-based), with the holidays it set. */
export function removeMoon(definition: CalendarDefinition, moon: number): CalendarDefinition {
  if (moon < 1 || moon > definition.moons.length) return clean(copy(definition));
  const next = copy(definition);
  next.moons.splice(moon - 1, 1);
  next.holidays = next.holidays.flatMap((holiday): Holiday[] => {
    if (holiday.type !== 'moon') return [holiday];
    if (holiday.moon === moon) return [];
    return [{ ...holiday, moon: holiday.moon > moon ? holiday.moon - 1 : holiday.moon }];
  });
  return clean(next);
}

/**
 * Whether the calendar is the tidy one: thirteen months of twenty-eight days each. (364 days,
 * exactly 52 weeks of seven: every date falls on the same weekday every year.)
 */
export function isVeryTidy(definition: CalendarDefinition): boolean {
  return definition.months.length === 13 && definition.months.every((month) => month.days === 28);
}

/**
 * The easter egg: in a calendar of thirteen months of twenty-eight days, Midyear Day gets
 * "Very tidy." Midyear Day is any day of an intercalary block in the middle of the year
 * (after the sixth or the seventh month); in a calendar with no such block, it is the 14th of
 * the seventh month, the last day of the year's first half.
 */
export function tidyNote(definition: CalendarDefinition, date: { month?: number; intercalary?: number; day: number }): string | null {
  if (!isVeryTidy(definition)) return null;
  const middle = definition.intercalary.map((block, i) => (block.after === 6 || block.after === 7 ? i + 1 : 0)).filter((i) => i > 0);
  const isMidyear =
    middle.length > 0 ? date.intercalary !== undefined && middle.includes(date.intercalary) : date.month === 7 && date.day === 14;
  return isMidyear ? 'Very tidy.' : null;
}
