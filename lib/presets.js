/**
 * The Gregorian calendar: Earth's civil calendar, run backwards and forwards for ever (the
 * "proleptic" Gregorian calendar). The Moon is the mean Moon: within about half a day of the
 * real one.
 */
export const GREGORIAN = {
    v: 1,
    name: 'Gregorian calendar',
    era: 'CE',
    eraBefore: 'BCE',
    months: [
        { name: 'January', days: 31 },
        { name: 'February', days: 28 },
        { name: 'March', days: 31 },
        { name: 'April', days: 30 },
        { name: 'May', days: 31 },
        { name: 'June', days: 30 },
        { name: 'July', days: 31 },
        { name: 'August', days: 31 },
        { name: 'September', days: 30 },
        { name: 'October', days: 31 },
        { name: 'November', days: 30 },
        { name: 'December', days: 31 },
    ],
    intercalary: [],
    weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    firstWeekday: 1,
    leap: [{ every: 4, except: [100, 400], days: 1, to: { month: 2 } }],
    epoch: '0001-01-01',
    moons: [{ name: 'Moon', period: 29.530588, phase: 0.644368 }],
    holidays: [
        { type: 'date', name: "New Year's Day", month: 1, day: 1 },
        { type: 'date', name: 'Leap Day', month: 2, day: 29 },
        { type: 'weekday', name: 'Earth Hour', month: 3, weekday: 6, nth: -1 },
        { type: 'date', name: "New Year's Eve", month: 12, day: 31 },
    ],
};
/**
 * The Selunnan Reckoning: thirteen months of twenty-eight days. Every month starts on the
 * same day of the week, and every fifth year a Midyear Day slips in outside the week, so the
 * pattern never breaks.
 */
export const SELUNNAN = {
    v: 1,
    name: 'Selunnan Reckoning',
    era: 'FS',
    eraBefore: 'Before the Founding',
    months: [
        'Frostmoon',
        'Thawmoon',
        'Seedmoon',
        'Rainmoon',
        'Bloommoon',
        'Sunmoon',
        'Highmoon',
        'Ripemoon',
        'Harvestmoon',
        'Mistmoon',
        'Leafmoon',
        'Embermoon',
        'Darkmoon',
    ].map((name) => ({ name, days: 28 })),
    intercalary: [{ name: 'Midyear Day', after: 7, days: 0, inWeek: false }],
    weekdays: ['Solday', 'Monday', 'Tideday', 'Windday', 'Hearthday', 'Fieldday', 'Restday'],
    firstWeekday: 1,
    leap: [{ every: 5, except: [], days: 1, to: { intercalary: 1 } }],
    epoch: '1008-02-15',
    moons: [
        { name: 'Selen', period: 29.5, phase: 0 },
        { name: 'Kair', period: 41, phase: 0.5 },
    ],
    holidays: [
        { type: 'date', name: 'Firstday', month: 1, day: 1 },
        { type: 'weekday', name: 'Spring Market', month: 3, weekday: 6, nth: 2 },
        { type: 'date', name: 'Midyear Day', intercalary: 1, day: 1 },
        { type: 'date', name: 'Harvest Fair', month: 9, day: 9 },
        { type: 'date', name: "Founders' Day", month: 9, day: 21 },
        { type: 'moon', name: 'Lantern Night', moon: 1, phase: 'full', nth: 1, month: 13 },
    ],
};
/**
 * The Tidewatch Count: a purely lunar calendar. Twelve months of thirty and twenty-nine days
 * follow the moon and nothing else, so the year is eleven days short of the seasons and the
 * months drift through them. Eleven leap days in every thirty years keep each month starting
 * at the new moon.
 */
export const TIDEWATCH = {
    v: 1,
    name: 'Tidewatch Count',
    era: 'TC',
    eraBefore: 'before the Count',
    months: ['Ashar', 'Belen', 'Corun', 'Dessa', 'Enil', 'Farrow', 'Ghal', 'Hesk', 'Ilun', 'Jorra', 'Kesh', 'Lumen'].map((name, i) => ({
        name,
        days: i % 2 === 0 ? 30 : 29,
    })),
    intercalary: [],
    weekdays: ['Ebbday', 'Neapday', 'Floodday', 'Springday', 'Saltday', 'Netday', 'Stillday'],
    firstWeekday: 1,
    leap: [
        { every: 3, except: [], days: 1, to: { month: 12 } },
        { every: 30, except: [], days: 1, to: { month: 6 } },
    ],
    epoch: null,
    moons: [{ name: 'Ila', period: 29.530556, phase: 0 }],
    holidays: [
        { type: 'date', name: 'Turning of the Count', month: 1, day: 1 },
        { type: 'moon', name: 'Bright Night', moon: 1, phase: 'full', nth: 0, month: 0 },
        { type: 'weekday', name: 'Blessing of the Nets', month: 4, weekday: 6, nth: 1 },
        { type: 'date', name: 'Long Ebb', month: 9, day: 10 },
    ],
};
/**
 * The Meridian Republican Calendar: decimal and rational, after the calendar of the French
 * Republic. Twelve months of thirty days in weeks of ten, and five festival days at the end
 * of the year that belong to no month and no week; a sixth in leap years.
 */
export const MERIDIAN = {
    v: 1,
    name: 'Meridian Republican Calendar',
    era: 'YR',
    eraBefore: 'before the Republic',
    months: [
        'Vintage',
        'Fogmonth',
        'Frostmonth',
        'Snowmonth',
        'Rainmonth',
        'Windmonth',
        'Budmonth',
        'Flowermonth',
        'Meadowmonth',
        'Reapmonth',
        'Heatmonth',
        'Fruitmonth',
    ].map((name) => ({ name, days: 30 })),
    intercalary: [{ name: 'Festival', after: 12, days: 5, inWeek: false }],
    weekdays: ['Firstday', 'Seconday', 'Thirday', 'Fourthday', 'Fifthday', 'Sixthday', 'Sevenday', 'Eighthday', 'Ninthday', 'Tenthday'],
    firstWeekday: 1,
    leap: [{ every: 4, except: [128], days: 1, to: { intercalary: 1 } }],
    epoch: '1792-09-22',
    moons: [{ name: 'Moon', period: 29.530588, phase: 0.191934 }],
    holidays: [
        { type: 'date', name: 'Founding Day', month: 1, day: 1 },
        { type: 'weekday', name: 'Assembly Day', month: 7, weekday: 10, nth: 1 },
        { type: 'date', name: 'Festival of Virtue', intercalary: 1, day: 1 },
        { type: 'date', name: 'Festival of Labour', intercalary: 1, day: 3 },
        { type: 'date', name: 'Festival of the Republic', intercalary: 1, day: 6 },
    ],
};
/**
 * The Kharan Long Year: a calendar for another world. A year of 412 days, ten long months, a
 * week of eight days and three moons. Dawnturn opens the year and counts in the week; Duskturn
 * closes it. Leap years add a day to the last month.
 */
export const KHARAN = {
    v: 1,
    name: 'Kharan Long Year',
    era: 'KY',
    eraBefore: '',
    months: ['Arrak', 'Besht', 'Chol', 'Dunn', 'Eshk', 'Farr', 'Ghesh', 'Hadd', 'Ikkar', 'Jurn'].map((name) => ({ name, days: 41 })),
    intercalary: [
        { name: 'Dawnturn', after: 0, days: 1, inWeek: true },
        { name: 'Duskturn', after: 10, days: 1, inWeek: true },
    ],
    weekdays: ['Onesun', 'Twosun', 'Threesun', 'Foursun', 'Fivesun', 'Sixsun', 'Sevensun', 'Darksun'],
    firstWeekday: 1,
    leap: [{ every: 3, except: [60], days: 1, to: { month: 10 } }],
    epoch: null,
    moons: [
        { name: 'Aru', period: 12.25, phase: 0 },
        { name: 'Besh', period: 33, phase: 0.25 },
        { name: 'Tolu', period: 97.6, phase: 0.5 },
    ],
    holidays: [
        { type: 'date', name: 'Dawnturn', intercalary: 1, day: 1 },
        { type: 'moon', name: 'Night of Tolu', moon: 3, phase: 'full', nth: -1, month: 0 },
        { type: 'weekday', name: 'Caravan Rest', month: 5, weekday: 8, nth: 3 },
        { type: 'moon', name: 'Dark of Besh', moon: 2, phase: 'new', nth: 1, month: 8 },
        { type: 'date', name: 'Duskturn', intercalary: 2, day: 1 },
    ],
};
/** The presets, in the order the maker offers them. */
export const PRESETS = Object.freeze([
    {
        id: 'gregorian',
        pitch: "Earth's own calendar: twelve uneven months, a leap day every four years with the 100 and 400 exceptions.",
        definition: GREGORIAN,
    },
    {
        id: 'selunnan',
        pitch: 'Thirteen months of 28 days. Every month starts on the same weekday, and a Midyear Day stands outside the week.',
        definition: SELUNNAN,
    },
    {
        id: 'tidewatch',
        pitch: 'A lunar calendar: months follow the moon, the year is 354 days, and the seasons drift.',
        definition: TIDEWATCH,
    },
    {
        id: 'meridian',
        pitch: 'A decimal calendar: twelve months of 30 days, weeks of ten, and festival days that belong to no month.',
        definition: MERIDIAN,
    },
    {
        id: 'kharan',
        pitch: 'Another world: a year of 412 days, a week of eight, three moons and no link to Earth.',
        definition: KHARAN,
    },
]);
/** A fresh copy of a preset's definition, safe to change. Undefined for an id that is not a preset. */
export function presetDefinition(id) {
    const preset = PRESETS.find((candidate) => candidate.id === id);
    return preset === undefined ? undefined : JSON.parse(JSON.stringify(preset.definition));
}
