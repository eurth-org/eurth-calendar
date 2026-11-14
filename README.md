# Calendar

> A friendly note: this tool is part of Eurth's advent calendar, and its door opens on 16 December. Please don't spoil the surprise before then.

A calendar of your own. Calendar will be a free online calendar maker for worldbuilders at cal.eurth.org: name the months, set the leap years, hang a few moons, mark the holidays, and see your world's year on the page. Made by [Eurth](https://eurth.org), a worldbuilding and roleplay community since 2004.

This repository holds two things:

1. **`@eurth/calendar`**, the date engine: a small TypeScript library with no dependencies that turns a calendar definition into dates, weekdays, moon phases and holidays. Released, and used by Time (time.eurth.org) as well.
2. **The site** at cal.eurth.org. Not built yet: it starts once `@eurth/style` 1.0.0 is released. Its plain logic (`src/maker/`) and its words (`src/content/`) are written and tested, waiting for pages to use them.

Status: engine 1.0.0 released; site to come. See the [roadmap](roadmap.md) for what's next, what each release added and what's not planned.

## The engine

### Install

Straight from GitHub, like `@eurth/style`. There is nothing to build and nothing else to install:

```json
{
  "dependencies": {
    "@eurth/calendar": "github:eurth-org/eurth-calendar#semver:^1"
  }
}
```

It is plain ES modules with type declarations, for Node 22 or later and any current browser.

### In one minute

```ts
import { createCalendar, SELUNNAN } from '@eurth/calendar';

const calendar = createCalendar(SELUNNAN);

const days = calendar.fromGregorian({ year: 2026, month: 11, day: 12 }); // 372088
calendar.fromDays(days);          // { year: 1022, month: 9, day: 17 }
calendar.format(days, 'full');    // "Tideday, 17 Harvestmoon 1022 FS"
calendar.weekday(days);           // 3
calendar.moonsOn(days);           // [{ moon: 1, name: 'Selen', phase: 'waxing-crescent', … }, …]
calendar.holidays(1022);          // [{ holiday: 1, name: 'Firstday', days: 371848, date: … }, …]
calendar.toDays({ year: 1022, month: 9, day: 21 }); // 372092
```

### The three ideas

- **A calendar is data.** A `CalendarDefinition` is plain JSON: months, intercalary days, weekdays, leap rules, eras, an optional link to Earth, moons and holidays. It fits in a link and in an Eurth profile.
- **A day count is a whole number.** 0 is day 1 of year 1, 1 is the day after, -1 the day before. Sort by it, subtract it, store it. Everything else is worked out from it.
- **Everything a person counts is 1-based.** Month 1, weekday 1, moon 1, day 1. Years: 1 is the first year, 0 the year before it, -1 the one before that (how it is *written* depends on the eras, see below).

### The definition

```ts
interface CalendarDefinition {
  v: 1;                       // the version of this format
  name: string;               // "Selunnan Reckoning"
  era: string;                // "FS": written after years from year 1 on
  eraBefore: string;          // "Before the Founding": for the years before year 1
  months: { name: string; short?: string; days: number }[];
  intercalary: { name: string; after: number; days: number; inWeek: boolean }[];
  weekdays: string[];
  firstWeekday: number;       // the weekday of day 1 of year 1
  leap: { every: number; except: number[]; days: number; to: { month: number } | { intercalary: number } }[];
  epoch: string | null;       // the Gregorian date of day 1 of year 1, "1008-02-15", or null
  moons: { name: string; period: number; phase: number }[];
  holidays: Holiday[];
}
```

- **Intercalary days** belong to no month. `after` is how many months come before the block (0 opens the year, `months.length` closes it). `inWeek: false` means the week pauses for them, so the day after a Restday can still be a Solday. A block may have `days: 0` and exist only when a leap rule adds to it.
- **Leap rules:** a year is a leap year for a rule when it divides by `every`, except when it also divides by the first number in `except`, unless it divides by the second too, and so on. The Gregorian rule is `{ every: 4, except: [100, 400], days: 1, to: { month: 2 } }`. Every rule that matches adds its days, to a month or to an intercalary block.
- **Eras:** year 1022 is written "1022 FS". Before year 1 the years count backwards with no year zero, as BC does: year 0 is "1 Before the Founding", year -1 is "2 Before the Founding". With an empty `eraBefore` they are written "0 FS", "−1 FS".
- **Epoch:** the Gregorian date of day 1 of year 1, or `null` for a calendar with no link to Earth. Gregorian years are counted as astronomers do ("0000" is 1 BCE, "-0043" is 44 BCE).
- **Moons:** `period` is the days from new moon to new moon (fractions welcome), `phase` where the moon is at the start of day 1 of year 1: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter.
- **Holidays** come in three kinds:

```ts
{ type: 'date', name: "Founders' Day", month: 9, day: 21 }           // a fixed date
{ type: 'date', name: 'Midyear Day', intercalary: 1, day: 1 }       // …or a day of an intercalary block
{ type: 'weekday', name: 'Spring Market', month: 3, weekday: 6, nth: 2 }  // the 2nd Fieldday of month 3; nth -1 is the last
{ type: 'moon', name: 'Lantern Night', moon: 1, phase: 'full', nth: 1, month: 13 }
// the first full moon of moon 1 in month 13; month 0 is the whole year; nth 0 is every time, -1 the last
```

The limits (100 months, 30 weekdays, 12 moons, 200 holidays and so on) are in `LIMITS`.

### Making a calendar

| Call | What it gives |
| --- | --- |
| `createCalendar(definition)` | A `Calendar`. The definition can come from anywhere: it is cleaned first and never throws. `calendar.issues` lists what had to change; `calendar.definition` is the cleaned, frozen definition. |
| `normalizeCalendar(input)` | `{ calendar, issues }`: just the cleaning. Use it on anything from a link, a file or a form. |
| `validateCalendar(input)` | The issues alone. Empty when the definition is fine as it stands. |

### What a calendar answers

| Call | What it gives |
| --- | --- |
| `calendar.toDays(date)` | The day count of a date. Throws a `RangeError` for a date that does not exist. |
| `calendar.fromDays(days)` | The date: `{ year, month, day }`, or `{ year, intercalary, day }` for a day outside the months. |
| `calendar.isValidDate(date)` | Whether the date exists (30 February does not, nor Midyear Day in a year without one). |
| `calendar.weekday(days)` | The day of the week, 1-based, or `null` on a day outside the week. |
| `calendar.dayOfYear(days)`, `calendar.yearOf(days)` | The day of the year (1-based), and the year. |
| `calendar.year(year)` | The year laid out: `{ year, start, days, leap, parts }`, each part a month or intercalary block with its `name`, `days` that year, the day count of its `start`, and `inWeek`. This is what a month grid or a year view is drawn from. |
| `calendar.yearStart(year)`, `yearLength(year)`, `isLeapYear(year)`, `monthLength(year, month)`, `intercalaryLength(year, n)` | The pieces of the same. |
| `calendar.toGregorian(days)` | `{ year, month, day }` on Earth, or `null` when there is no epoch. |
| `calendar.fromGregorian(date)` | The day count of an Earth date, or `null` when there is no epoch. |
| `calendar.linked` | Whether the calendar has an epoch. |
| `calendar.moonsOn(days)` | Each moon that day: `{ moon, name, phase, fraction, lit }`. `phase` is one of eight names; a principal phase (new, first-quarter, full, last-quarter) is given on the day it happens. `lit` is how much of the disc is lit at midday, 0 to 1. |
| `calendar.moonEvents(from, to, moon?)` | The principal phases in a span of days, in order: `{ moon, name, phase, days }`. |
| `calendar.holidays(year)` | The year's holidays in order: `{ holiday, name, days, date }`. |
| `calendar.holidaysOn(days)`, `calendar.holidaysBetween(from, to)` | The same, for a day or a span. |
| `calendar.format(daysOrDate, style?)` | The date in words. Styles: `'long'` (17 Harvestmoon 1022 FS, the default), `'full'` (Tideday, 17 Harvestmoon 1022 FS), `'short'` (17 Har 1022 FS), `'numeric'` (1022-09-17). |
| `calendar.day(days)` | All of the above for one day: `{ days, date, weekday, dayOfYear, gregorian, moons, holidays }`. |
| `calendar.daysPerYear`, `meanYear`, `minYear`, `maxYear`, `minDays`, `maxDays` | The ordinary and the average year, and the range covered: ten million years either side of year 1. |

### Text, links and files

| Call | What it gives |
| --- | --- |
| `dateToString(date)`, `parseDate(text)` | A date as compact text for links and files: `"1022-09-17"`, `"1020-i1-01"` for day 1 of intercalary block 1, `"-0003-02-11"`. |
| `formatYear(definition, year)` | "1022 FS", "3 Before the Founding". |
| `describeCalendar(calendar)` | The calendar in plain sentences: what "Copy description" copies. |
| `describeDay(calendar, days)` | One day in a sentence or two, with its Earth date, moons and holidays. |
| `summarizeCalendar(calendar)` | One line, at most 600 characters. |
| `encodeCalendar(definition)`, `decodeCalendar(text)` | The calendar as link text, `"1.eyJtIjpb…"`, and back. `decodeCalendar` gives `null` for anything that is not a calendar, and cleans the rest. |
| `calendarLink(base, definition)`, `calendarFromLink(link)` | A link that carries a calendar in its `cal` parameter, and the calendar a link carries. This is how Calendar hands a calendar to Time: `calendarLink('https://time.eurth.org/', definition)`. |
| `toProfileSection(definition, { link })`, `fromProfileSection(section)` | The "calendar" section of an [Eurth profile](https://github.com/eurth-org/eurth-profile), written and read. See below. |
| `holidaysToICal(calendar, from, to)` | The holidays in a span of days as the text of an `.ics` file, or `null` for a calendar with no link to Earth. |
| `PRESETS`, `presetDefinition(id)`, `GREGORIAN`, `SELUNNAN`, `TIDEWATCH`, `MERIDIAN`, `KHARAN` | The five ready-made calendars. |
| `gregorianToRataDie`, `rataDieToGregorian`, `parseIsoDate`, `formatIsoDate`, `gregorianFromJsDate`, … | The Gregorian arithmetic the engine uses, for whoever needs it. |

### The profile section

Calendar owns the `calendar` section of the Eurth profile, and Time reads it. `toProfileSection` writes the plain fields the profile's schema describes (`name`, `daysPerYear`, `months`, `weekdays`, `era`, with `link`, `summary` and `updated`), so any tool can say a line about the calendar, and puts the whole calendar under `definition`:

```ts
import { getSection, setSection } from '@eurth/profile';
import { createCalendar, fromProfileSection, toProfileSection } from '@eurth/calendar';

// Calendar writes:
profile = setSection(profile, 'calendar', toProfileSection(definition, { link }));

// Time reads:
const found = fromProfileSection(getSection(profile, 'calendar'));
const calendar = found ? createCalendar(found.calendar) : null;
```

A section with no `definition` (written by hand, say) still gives a plain calendar from its months and weekdays.

### What it promises

- **Exact.** Whole-number arithmetic throughout; no `Date` object, no time zones, no floating point in the dates. Moons are worked out in whole numbers too, so a full moon lands on the same day whether you ask in year 3 or year 3,000,000.
- **Fast everywhere.** The start of any year is computed directly from the leap rules. Nothing loops over years.
- **Tested hard.** Every run of the tests sends a million random day counts through each preset and back, compares each preset with a second, naive implementation that counts 4000 years one day at a time, does the same for 150 random calendars nobody would design, and checks the Gregorian preset against separate Gregorian arithmetic and against JavaScript's own `Date`.
- **Stable.** Version 1 releases stay compatible: a definition, a link or a profile written today keeps working.

## Where things live

| What | Where |
| --- | --- |
| The definition and every other type | `src/engine/types.ts` |
| The calendar: years, dates, day counts, weekdays | `src/engine/calendar.ts` |
| Cleaning a definition; the limits | `src/engine/normalize.ts`, `src/engine/limits.ts` |
| Gregorian arithmetic | `src/engine/gregorian.ts` |
| Moons | `src/engine/moons.ts` |
| Holidays | `src/engine/holidays.ts` |
| Dates as words and as compact text | `src/engine/format.ts` |
| The written description | `src/engine/describe.ts` |
| Links | `src/engine/codec.ts` |
| The profile section | `src/engine/profile.ts` |
| iCalendar export | `src/engine/ical.ts` |
| The presets | `src/engine/presets.ts` |
| The built package (committed) | `lib/` |
| A month as rows of weeks, the year as grids, turning pages | `src/maker/grid.ts` |
| Edits that keep leap rules and holidays pointing the right way; "Very tidy." | `src/maker/edit.ts` |
| The PDF writer (no dependencies) | `src/maker/pdf.ts` |
| A year laid out on A4 or Letter | `src/maker/print.ts` |
| The guide, the glossary and the examples, as data | `src/content/` |
| Tests | `tests/engine/`, `tests/maker/`, `tests/content/` |

## Development

Node 22 or later.

```bash
npm install
```

```bash
npm run check
```

```bash
npm test
```

After any change to `src/engine/`, rebuild `lib/` and commit it with the change; a test fails if it is out of date:

```bash
npm run build:engine
```

A longer soak, ten million day counts per preset (add `-- 50` for fifty million):

```bash
npm run soak
```

Two rules keep the package installable from GitHub: `package.json` has no `dependencies` (everything the site will need goes in `devDependencies`), and no `prepare` script. A test checks both.

## Releasing the engine

1. Change `version` in `package.json` and `VERSION` in `src/engine/index.ts`. Version 1 releases must stay compatible; anything that breaks a definition, a link or a call is version 2.
2. `npm run build:engine`, `npm run check`, `npm test`.
3. Add the release's section to [roadmap.md](roadmap.md) and move finished items out of "Next".
4. Commit, tag `v1.x.y`, push the commit and the tag, and publish a GitHub release for the tag. Tools that depend on `#semver:^1` pick it up on their next nightly update.

## Deployment

The site is not built yet. It will be a static Astro site served as a Cloudflare Worker with static assets on cal.eurth.org, deployed by its launch workflow when its door opens, as [@eurth/style](https://github.com/eurth-org/eurth-style)'s handbook sets out.

## Licence

Apache 2.0. Made by Orioni for [Eurth](https://eurth.org).
