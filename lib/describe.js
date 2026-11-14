import { formatYear } from './format.js';
import { parseIsoDate } from './gregorian.js';
import { phaseLabel } from './moons.js';
export const GREGORIAN_MONTHS = Object.freeze([
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]);
/** 1st, 2nd, 3rd, 4th, 11th, 21st. */
export function ordinal(n) {
    const tens = n % 100;
    if (tens >= 11 && tens <= 13)
        return `${n}th`;
    return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
/** "a, b and c". */
function list(items) {
    if (items.length <= 1)
        return items.join('');
    return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
/** A number of days without a trailing ".0": 29.5, 41, 29.530588. */
const number = (value) => String(Math.round(value * 1e6) / 1e6);
function leapSentence(definition, rule) {
    const target = 'month' in rule.to ? definition.months[rule.to.month - 1].name : definition.intercalary[rule.to.intercalary - 1].name;
    let text = `Every ${rule.every === 1 ? 'year' : `${ordinal(rule.every)} year`} adds ${rule.days === 1 ? 'a day' : `${rule.days} days`} to ${target}`;
    rule.except.forEach((exception, i) => {
        text += i % 2 === 0 ? `, except every ${ordinal(exception)}` : `, unless it is also a ${ordinal(exception)}`;
    });
    return `${text}.`;
}
function holidayPhrase(definition, holiday) {
    if (holiday.type === 'date') {
        if (holiday.month !== undefined)
            return `${holiday.day} ${definition.months[holiday.month - 1].name}`;
        const block = definition.intercalary[(holiday.intercalary ?? 1) - 1];
        return block.days <= 1 && holiday.day === 1 ? block.name : `day ${holiday.day} of ${block.name}`;
    }
    if (holiday.type === 'weekday') {
        const which = holiday.nth === -1 ? 'last' : ordinal(holiday.nth);
        return `the ${which} ${definition.weekdays[holiday.weekday - 1]} of ${definition.months[holiday.month - 1].name}`;
    }
    const moon = definition.moons[holiday.moon - 1].name;
    const phase = holiday.phase === 'new' || holiday.phase === 'full' ? `${holiday.phase} moon` : phaseLabel(holiday.phase);
    const where = holiday.month === 0 ? 'the year' : definition.months[holiday.month - 1].name;
    if (holiday.nth === 0)
        return holiday.month === 0 ? `every ${phase} of ${moon}` : `every ${phase} of ${moon} in ${where}`;
    return `the ${holiday.nth === -1 ? 'last' : ordinal(holiday.nth)} ${phase} of ${moon} in ${where}`;
}
/** A Gregorian date in words: "22 September 1792", "15 March 44 BCE". */
export function formatGregorian(date) {
    const year = date.year >= 1 ? String(date.year) : `${1 - date.year} BCE`;
    return `${date.day} ${GREGORIAN_MONTHS[date.month - 1] ?? ''} ${year}`;
}
/**
 * The whole calendar in a few plain sentences, one paragraph per subject, separated by blank
 * lines. Takes a calendar (from createCalendar), so the definition has been cleaned.
 */
export function describeCalendar(calendar) {
    const d = calendar.definition;
    const name = d.name === '' ? 'This calendar' : d.name;
    const paragraphs = [];
    // The year and its months.
    const lengths = new Set(d.months.map((month) => month.days));
    const months = lengths.size === 1 && d.months.length > 1
        ? `${d.months.length} months of ${plural(d.months[0].days, 'day')} each`
        : plural(d.months.length, 'month');
    let year = `${name} has ${months}, ${plural(calendar.daysPerYear, 'day')} in an ordinary year.`;
    year +=
        lengths.size === 1
            ? ` The months are ${list(d.months.map((month) => month.name))}.`
            : ` The months are ${list(d.months.map((month) => `${month.name} (${month.days})`))}.`;
    paragraphs.push(year);
    // Days outside the months.
    if (d.intercalary.length > 0) {
        const sentences = d.intercalary.map((block) => {
            const place = block.after === 0
                ? 'opens the year'
                : block.after === d.months.length
                    ? 'closes the year'
                    : `follows ${d.months[block.after - 1].name}`;
            const what = block.days === 0 ? `${block.name} (in leap years only)` : block.days === 1 ? block.name : `${block.name} (${block.days} days)`;
            return `${what} ${place} and ${block.inWeek ? 'counts in the week' : 'stands outside the week'}.`;
        });
        paragraphs.push(`Outside the months: ${sentences.join(' ')}`);
    }
    // The week.
    paragraphs.push(`A week has ${plural(d.weekdays.length, 'day')}: ${list([...d.weekdays])}.`);
    // Leap years.
    paragraphs.push(d.leap.length === 0
        ? 'There are no leap years: every year is the same length.'
        : `${d.leap.map((rule) => leapSentence(d, rule)).join(' ')} An average year is ${number(Math.round(calendar.meanYear * 1e4) / 1e4)} days long.`);
    // Eras and Earth.
    let eras = `Years are written like "${formatYear(d, 1)}"`;
    eras += d.eraBefore === '' ? `; the year before year 1 is "${formatYear(d, 0)}".` : `; before that they count back from "${formatYear(d, 0)}".`;
    const epoch = d.epoch === null ? null : parseIsoDate(d.epoch);
    eras += epoch === null ? " It has no link to Earth's calendar." : ` Day 1 of year 1 is ${formatGregorian(epoch)} in the Gregorian calendar.`;
    paragraphs.push(eras);
    // Moons.
    if (d.moons.length > 0) {
        const moons = d.moons.map((moon) => `${moon.name} (a cycle of ${plural(Number(number(moon.period)), 'day')})`);
        paragraphs.push(`It follows ${plural(d.moons.length, 'moon')}: ${list(moons)}.`);
    }
    // Holidays.
    if (d.holidays.length > 0) {
        paragraphs.push(`Holidays: ${list(d.holidays.map((holiday) => `${holiday.name} (${holidayPhrase(d, holiday)})`))}.`);
    }
    return paragraphs.join('\n\n');
}
/** One line about the calendar, at most 600 characters: the profile's summary. */
export function summarizeCalendar(calendar) {
    const d = calendar.definition;
    const lengths = new Set(d.months.map((month) => month.days));
    const bits = [
        lengths.size === 1 && d.months.length > 1
            ? `${d.months.length} months of ${plural(d.months[0].days, 'day')}`
            : plural(d.months.length, 'month'),
        `${plural(calendar.daysPerYear, 'day')} a year`,
        `weeks of ${plural(d.weekdays.length, 'day')}`,
    ];
    if (d.leap.length > 0)
        bits.push('leap years');
    if (d.moons.length > 0)
        bits.push(plural(d.moons.length, 'moon'));
    if (d.holidays.length > 0)
        bits.push(plural(d.holidays.length, 'holiday'));
    const text = `${d.name === '' ? 'A calendar' : d.name}: ${list(bits)}. Years are written like "${formatYear(d, 1)}".`;
    return Array.from(text).slice(0, 600).join('');
}
/**
 * One day in a sentence or two, for a converter and for screen readers:
 * "Tideday, 17 Harvestmoon 1022 FS. 12 November 2026 on Earth. Selen is waxing gibbous; Kair is full. Holiday: Founders' Day."
 */
export function describeDay(calendar, days) {
    const info = calendar.day(days);
    const sentences = [`${calendar.format(days, 'full')}.`];
    if (info.gregorian !== null)
        sentences.push(`${formatGregorian(info.gregorian)} on Earth.`);
    if (info.moons.length > 0) {
        const moons = info.moons.map((moon) => {
            const phase = moon.phase === 'new' || moon.phase === 'full' ? moon.phase : `at its ${phaseLabel(moon.phase)}`;
            return `${moon.name} is ${moon.phase.startsWith('wax') || moon.phase.startsWith('wan') ? phaseLabel(moon.phase) : phase}`;
        });
        sentences.push(`${moons.join('; ')}.`);
    }
    if (info.holidays.length > 0) {
        sentences.push(`${info.holidays.length === 1 ? 'Holiday' : 'Holidays'}: ${list(info.holidays.map((holiday) => holiday.name))}.`);
    }
    return sentences.join(' ');
}
