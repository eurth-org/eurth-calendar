/** Working out when a year's holidays fall. */
import type { Calendar } from './calendar.js';
import { mod } from './math.js';
import { moonPhasesBetween } from './moons.js';
import type { HolidayOccurrence, YearPart } from './types.js';

/** The nth item of a list (1-based), the last for -1, or nothing. */
function pick<T>(items: T[], nth: number): T[] {
  if (nth === 0) return items;
  const item = nth === -1 ? items[items.length - 1] : items[nth - 1];
  return item === undefined ? [] : [item];
}

/** The holidays of one year, in order of day, then in the order they are listed in the definition. */
export function holidaysInYear(calendar: Calendar, year: number): HolidayOccurrence[] {
  const { holidays, moons, weekdays } = calendar.definition;
  if (holidays.length === 0) return [];
  const layout = calendar.year(year);
  const part = (kind: YearPart['kind'], index: number): YearPart | undefined =>
    layout.parts.find((candidate) => candidate.kind === kind && candidate.index === index);

  const out: HolidayOccurrence[] = [];
  holidays.forEach((holiday, i) => {
    let days: number[] = [];
    if (holiday.type === 'date') {
      const where = holiday.month !== undefined ? part('month', holiday.month) : part('intercalary', holiday.intercalary ?? 0);
      if (where !== undefined && holiday.day <= where.days) days = [where.start + holiday.day - 1];
    } else if (holiday.type === 'weekday') {
      const where = part('month', holiday.month);
      if (where !== undefined && where.days > 0) {
        const first = calendar.weekday(where.start);
        if (first !== null) {
          const matches: number[] = [];
          for (let d = where.start + mod(holiday.weekday - first, weekdays.length); d < where.start + where.days; d += weekdays.length) {
            matches.push(d);
          }
          days = pick(matches, holiday.nth);
        }
      }
    } else {
      const moon = moons[holiday.moon - 1];
      const where = holiday.month === 0 ? { start: layout.start, days: layout.days } : part('month', holiday.month);
      if (moon !== undefined && where !== undefined && where.days > 0) {
        const matches = moonPhasesBetween(moon, where.start, where.start + where.days - 1, holiday.phase).map((event) => event.days);
        days = pick(matches, holiday.nth);
      }
    }
    for (const day of days) {
      out.push({ holiday: i + 1, name: holiday.name, days: day, date: calendar.fromDays(day) });
    }
  });
  return out.sort((a, b) => a.days - b.days || a.holiday - b.holiday);
}
