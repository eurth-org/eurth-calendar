/**
 * Cleaning a calendar definition.
 *
 * What arrives in a link or a file is someone else's input. normalizeCalendar takes anything
 * at all and gives back a definition the engine can trust: every number whole and in range,
 * every name plain text of a sane length, every reference pointing at something that exists.
 * It never throws, and it says what it changed.
 */
import { formatIsoDate, parseIsoDate } from './gregorian.js';
import { LIMITS } from './limits.js';
import { lcm } from './math.js';
import { DEFINITION_VERSION, } from './types.js';
export const PRINCIPAL_PHASES = Object.freeze([
    'new',
    'first-quarter',
    'full',
    'last-quarter',
]);
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
/** Plain text: no control characters, single spaces, trimmed, at most `max` characters. */
export function cleanText(value, max) {
    if (typeof value !== 'string')
        return '';
    // eslint-disable-next-line no-control-regex
    const flat = value.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim();
    return Array.from(flat).slice(0, max).join('').trim();
}
/** The most days a leap rule's exceptions and its "every" may take to repeat; see LIMITS.leapCycle. */
function cleanExceptions(every, raw, path, issues) {
    if (raw === undefined || raw === null)
        return [];
    if (!Array.isArray(raw)) {
        issues.push({ path, message: 'The exceptions of a leap rule must be a list of numbers.' });
        return [];
    }
    const out = [];
    let cycle = every;
    for (const [i, item] of raw.entries()) {
        if (out.length >= LIMITS.leapExceptions) {
            issues.push({ path, message: `A leap rule takes at most ${LIMITS.leapExceptions} exceptions.` });
            break;
        }
        if (typeof item !== 'number' || !Number.isInteger(item) || item < 2) {
            issues.push({ path: `${path}[${i}]`, message: 'An exception must be a whole number of years, 2 or more.' });
            break;
        }
        const next = lcm(cycle, item);
        if (next > LIMITS.leapCycle) {
            issues.push({ path: `${path}[${i}]`, message: 'This exception comes round too rarely to matter, so it was dropped.' });
            break;
        }
        cycle = next;
        out.push(item);
    }
    return out;
}
class Cleaner {
    issues = [];
    note(path, message) {
        this.issues.push({ path, message });
    }
    /** A whole number between min and max; anything else becomes the fallback (or the nearest bound). */
    int(value, min, max, fallback, path, what) {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            if (value !== undefined)
                this.note(path, `${what} must be a number; ${fallback} was used.`);
            return fallback;
        }
        const whole = Math.round(value);
        if (whole < min || whole > max || whole !== value) {
            const fixed = Math.min(max, Math.max(min, whole));
            this.note(path, `${what} must be a whole number from ${min} to ${max}; ${fixed} was used.`);
            return fixed;
        }
        return whole;
    }
    text(value, max, fallback, path) {
        const clean = cleanText(value, max);
        if (typeof value === 'string' && clean !== value)
            this.note(path, 'The text was tidied or shortened.');
        else if (value !== undefined && typeof value !== 'string')
            this.note(path, 'This must be text.');
        return clean === '' ? fallback : clean;
    }
    list(value, max, path, what) {
        if (value === undefined || value === null)
            return [];
        if (!Array.isArray(value)) {
            this.note(path, `${what} must be a list.`);
            return [];
        }
        if (value.length > max) {
            this.note(path, `There can be at most ${max} ${what.toLowerCase()}; the rest were dropped.`);
            return value.slice(0, max);
        }
        return value;
    }
}
function cleanMonths(c, raw) {
    const months = [];
    for (const [i, item] of c.list(raw, LIMITS.months, 'months', 'Months').entries()) {
        const path = `months[${i}]`;
        const source = isRecord(item) ? item : {};
        if (!isRecord(item))
            c.note(path, 'A month must be an object with a name and a number of days.');
        const month = {
            name: c.text(source.name, LIMITS.name, `Month ${i + 1}`, `${path}.name`),
            days: c.int(source.days, 1, LIMITS.monthDays, 30, `${path}.days`, 'The length of a month'),
        };
        const short = cleanText(source.short, LIMITS.short);
        if (short !== '')
            month.short = short;
        months.push(month);
    }
    if (months.length === 0) {
        c.note('months', 'A calendar needs at least one month; one was added.');
        months.push({ name: 'Month 1', days: 30 });
    }
    return months;
}
function cleanIntercalary(c, raw, monthCount) {
    return c.list(raw, LIMITS.intercalary, 'intercalary', 'Intercalary days').map((item, i) => {
        const path = `intercalary[${i}]`;
        const source = isRecord(item) ? item : {};
        if (!isRecord(item))
            c.note(path, 'An intercalary day must be an object.');
        if (source.inWeek !== undefined && typeof source.inWeek !== 'boolean') {
            c.note(`${path}.inWeek`, 'Whether the day counts in the week must be true or false.');
        }
        return {
            name: c.text(source.name, LIMITS.name, `Intercalary day ${i + 1}`, `${path}.name`),
            after: c.int(source.after, 0, monthCount, monthCount, `${path}.after`, 'The place of an intercalary day'),
            days: c.int(source.days, 0, LIMITS.intercalaryDays, 1, `${path}.days`, 'The length of an intercalary block'),
            inWeek: source.inWeek === true,
        };
    });
}
function cleanWeekdays(c, raw) {
    const days = c
        .list(raw, LIMITS.weekdays, 'weekdays', 'Weekdays')
        .map((item, i) => c.text(item, LIMITS.name, `Day ${i + 1}`, `weekdays[${i}]`));
    if (days.length === 0) {
        c.note('weekdays', 'A calendar needs at least one day in its week; one was added.');
        days.push('Day 1');
    }
    return days;
}
function cleanLeap(c, raw, monthCount, intercalaryCount) {
    const rules = [];
    for (const [i, item] of c.list(raw, LIMITS.leapRules, 'leap', 'Leap rules').entries()) {
        const path = `leap[${i}]`;
        if (!isRecord(item)) {
            c.note(path, 'A leap rule must be an object; it was dropped.');
            continue;
        }
        const to = isRecord(item.to) ? item.to : {};
        let target = null;
        if (typeof to.month === 'number' && Number.isInteger(to.month) && to.month >= 1 && to.month <= monthCount) {
            target = { month: to.month };
        }
        else if (typeof to.intercalary === 'number' &&
            Number.isInteger(to.intercalary) &&
            to.intercalary >= 1 &&
            to.intercalary <= intercalaryCount) {
            target = { intercalary: to.intercalary };
        }
        if (target === null) {
            c.note(`${path}.to`, 'A leap rule must add its days to a month or an intercalary day that exists; it was dropped.');
            continue;
        }
        const every = c.int(item.every, 1, LIMITS.leapEvery, 4, `${path}.every`, 'How often a leap year comes');
        rules.push({
            every,
            except: cleanExceptions(every, item.except, `${path}.except`, c.issues),
            days: c.int(item.days, 1, LIMITS.leapDays, 1, `${path}.days`, 'The days a leap year adds'),
            to: target,
        });
    }
    return rules;
}
function cleanMoons(c, raw) {
    return c.list(raw, LIMITS.moons, 'moons', 'Moons').map((item, i) => {
        const path = `moons[${i}]`;
        const source = isRecord(item) ? item : {};
        if (!isRecord(item))
            c.note(path, 'A moon must be an object.');
        let period = 29.5;
        if (typeof source.period === 'number' && Number.isFinite(source.period)) {
            period = Math.round(source.period * 1e6) / 1e6;
            if (period < LIMITS.moonPeriodMin || period > LIMITS.moonPeriodMax) {
                period = Math.min(LIMITS.moonPeriodMax, Math.max(LIMITS.moonPeriodMin, period));
                c.note(`${path}.period`, `A moon's cycle must be from ${LIMITS.moonPeriodMin} to ${LIMITS.moonPeriodMax} days.`);
            }
        }
        else {
            c.note(`${path}.period`, "A moon's cycle must be a number of days; 29.5 was used.");
        }
        let phase = 0;
        if (typeof source.phase === 'number' && Number.isFinite(source.phase)) {
            phase = Math.round((source.phase - Math.floor(source.phase)) * 1e6) / 1e6;
            if (phase >= 1)
                phase = 0;
        }
        else if (source.phase !== undefined) {
            c.note(`${path}.phase`, "A moon's starting phase must be a number from 0 to 1; 0 (new) was used.");
        }
        return { name: c.text(source.name, LIMITS.name, `Moon ${i + 1}`, `${path}.name`), period, phase };
    });
}
function cleanHolidays(c, raw, months, intercalary, weekdays, leap, moonCount) {
    // The longest a month or a block ever gets, with every leap rule firing at once.
    const longest = (kind, index) => {
        const base = kind === 'month' ? months[index - 1].days : intercalary[index - 1].days;
        return leap.reduce((sum, rule) => {
            const hit = kind === 'month' ? 'month' in rule.to && rule.to.month === index : 'intercalary' in rule.to && rule.to.intercalary === index;
            return hit ? sum + rule.days : sum;
        }, base);
    };
    const inRange = (value, min, max) => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
    const holidays = [];
    for (const [i, item] of c.list(raw, LIMITS.holidays, 'holidays', 'Holidays').entries()) {
        const path = `holidays[${i}]`;
        if (!isRecord(item)) {
            c.note(path, 'A holiday must be an object; it was dropped.');
            continue;
        }
        const name = c.text(item.name, LIMITS.name, `Holiday ${i + 1}`, `${path}.name`);
        if (item.type === 'date') {
            if (inRange(item.month, 1, months.length)) {
                const max = Math.max(1, longest('month', item.month));
                holidays.push({ type: 'date', name, month: item.month, day: c.int(item.day, 1, max, 1, `${path}.day`, 'The day of a holiday') });
            }
            else if (inRange(item.intercalary, 1, intercalary.length)) {
                const max = Math.max(1, longest('intercalary', item.intercalary));
                holidays.push({
                    type: 'date',
                    name,
                    intercalary: item.intercalary,
                    day: c.int(item.day, 1, max, 1, `${path}.day`, 'The day of a holiday'),
                });
            }
            else {
                c.note(path, 'This holiday names a month or an intercalary day that does not exist; it was dropped.');
            }
        }
        else if (item.type === 'weekday') {
            if (!inRange(item.month, 1, months.length)) {
                c.note(`${path}.month`, 'This holiday names a month that does not exist; it was dropped.');
                continue;
            }
            const nth = item.nth === -1 ? -1 : c.int(item.nth, 1, LIMITS.monthDays, 1, `${path}.nth`, 'Which weekday of the month');
            holidays.push({
                type: 'weekday',
                name,
                month: item.month,
                weekday: c.int(item.weekday, 1, weekdays.length, 1, `${path}.weekday`, 'The day of the week'),
                nth,
            });
        }
        else if (item.type === 'moon') {
            if (!inRange(item.moon, 1, moonCount)) {
                c.note(`${path}.moon`, 'This holiday names a moon that does not exist; it was dropped.');
                continue;
            }
            const phase = PRINCIPAL_PHASES.find((p) => p === item.phase);
            if (phase === undefined)
                c.note(`${path}.phase`, 'The phase must be new, first-quarter, full or last-quarter; full was used.');
            holidays.push({
                type: 'moon',
                name,
                moon: item.moon,
                phase: phase ?? 'full',
                nth: item.nth === -1 ? -1 : c.int(item.nth, 0, 1000, 1, `${path}.nth`, 'Which occurrence of the phase'),
                month: c.int(item.month, 0, months.length, 0, `${path}.month`, 'The month of a moon holiday'),
            });
        }
        else {
            c.note(`${path}.type`, 'A holiday must be of type date, weekday or moon; it was dropped.');
        }
    }
    return holidays;
}
/**
 * Turns anything into a calendar definition the engine can trust, and lists what it changed.
 * A valid definition comes back as an equal copy with no issues; nonsense comes back as a
 * plain one-month calendar with a list of reasons.
 */
export function normalizeCalendar(input) {
    const c = new Cleaner();
    const source = isRecord(input) ? input : {};
    if (!isRecord(input))
        c.note('', 'A calendar definition must be an object.');
    if (source.v !== undefined && source.v !== DEFINITION_VERSION) {
        c.note('v', `This definition says it is version ${String(source.v)}; it was read as version ${DEFINITION_VERSION}.`);
    }
    const months = cleanMonths(c, source.months);
    const intercalary = cleanIntercalary(c, source.intercalary, months.length);
    const weekdays = cleanWeekdays(c, source.weekdays);
    const leap = cleanLeap(c, source.leap, months.length, intercalary.length);
    const moons = cleanMoons(c, source.moons);
    let epoch = null;
    if (source.epoch !== undefined && source.epoch !== null) {
        const date = parseIsoDate(source.epoch);
        if (date === null || Math.abs(date.year) > LIMITS.maxYear) {
            c.note('epoch', 'The epoch must be a real Gregorian date written as YYYY-MM-DD; the link to Earth was dropped.');
        }
        else {
            epoch = formatIsoDate(date);
        }
    }
    const calendar = {
        v: DEFINITION_VERSION,
        name: c.text(source.name, LIMITS.name, '', 'name'),
        era: c.text(source.era, LIMITS.era, '', 'era'),
        eraBefore: c.text(source.eraBefore, LIMITS.eraBefore, '', 'eraBefore'),
        months,
        intercalary,
        weekdays,
        firstWeekday: c.int(source.firstWeekday, 1, weekdays.length, 1, 'firstWeekday', 'The weekday of day 1'),
        leap,
        epoch,
        moons,
        holidays: cleanHolidays(c, source.holidays, months, intercalary, weekdays, leap, moons.length),
    };
    return { calendar, issues: c.issues };
}
/** What is wrong with a definition, as a list. Empty when it is fine as it stands. */
export function validateCalendar(input) {
    return normalizeCalendar(input).issues;
}
