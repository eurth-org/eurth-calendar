# Roadmap

Calendar is a maker for a world's own calendar, at cal.eurth.org, and the home of `@eurth/calendar`, the date engine that Time (time.eurth.org) uses too. It is one of Eurth's free worldbuilding tools, and door 7 of the 2026 advent calendar: the site opens on 16 December at 00:00 Europe/Brussels and must not exist anywhere before then.

Three parts: what comes next, what each release added (newest first), and what's not planned.

## Where to pick up

For a new session: read `CLAUDE.md` (the brief), then this section.

- **Done:** steps 1 to 4 of the brief as far as the engine goes. The repository exists, the brief is saved, and `@eurth/calendar` 1.0.0 is released (tag `v1.0.0`) with its tests, presets and README.
- **Next, without `@eurth/style`:** the content and the remaining plain logic listed under "Next" below (guide, glossary, examples, the PDF writer, the month-grid and year-view logic).
- **Blocked:** the site (step 5). Do not scaffold pages or styles until `@eurth/style` 1.0.0 is released: check `gh release list -R eurth-org/eurth-style`. On 14 November 2026 it had no release and no `HANDBOOK.md` yet. When it is out, start from its starter template and read `HANDBOOK.md` first; it wins over the brief on everything shared.
- **Keep true while building the site:** this repository's root `package.json` is the `@eurth/calendar` package. Everything the site needs goes in `devDependencies`, never `dependencies`, and there is no `prepare` script; otherwise Time's install breaks. `tests/engine/lib.test.ts` checks this. The site's build goes to `dist/` (ignored); the engine's goes to `lib/` (committed).

## Next

### Before the site (needs nothing from `@eurth/style`)

- **Guide text:** how real calendars handle the year (solar, lunar, lunisolar), leap rules, weeks and eras, with sources and a last-updated date.
- **Glossary:** the terms the maker and the guide use (intercalary, epoch, era, leap year, lunation, synodic month, perennial calendar and the rest), as data for a DefinedTermSet.
- **Examples page content:** the five presets written up, each with what to notice and what to change first.
- **Printable year:** a small PDF writer in plain TypeScript (A4 and Letter, the device's fonts are not available in a PDF, so the standard Helvetica), and the layout of a year onto pages. Tested without a browser.
- **Month grid and year view logic:** rows of weeks for a month, with days outside the week shown in their own row; plain functions over `calendar.year()`, tested.
- **The maker's state:** editing operations on a definition (add, remove and move months; keep leap rules and holidays pointing at the right month when one is removed), undo and redo, and "Very tidy." detection (13 months of 28 days, on Midyear Day).

### The site (once `@eurth/style` 1.0.0 is out)

- Start from the starter template; pages: Maker, Guide, Glossary, Examples.
- The maker, v1: name and eras, months, intercalary days, week, leap rules, epoch, moons, holidays; views (month grid with moon phases and holidays as word and icon, the whole year, the converter between Earth dates and the calendar); the five presets.
- The calendar lives in its link (`?d=` with `encodeCalendar`); the profile's `calendar` section saves and loads it as a file.
- Exports: printable year (A4 and Letter PDF), iCal of holidays, the definition as JSON, Copy description, and "Use in a timeline" (`calendarLink('https://time.eurth.org/', definition)`, only shown once Time has launched).
- Signature touch: switching months turns the page like a desk calendar. Easter egg: "Very tidy." on Midyear Day in a calendar of 13 months of 28 days.
- Everything in the handbook's checklist: SEO pages and JSON-LD, Open Graph images, service worker, manifest, security headers, axe and Lighthouse, the launch workflow with `LAUNCH_AT` for 16 December.
- Add `docs/feedback-log.md` entries as feedback arrives.

### The engine, later (all compatible with version 1)

- **Ask Foundations to describe `calendar.definition` in the profile schema.** The schema allows it today (extra keys are kept), but it only documents the simple fields.
- **Leap months:** a rule that adds a whole named month in some years (the Hebrew and Chinese way). Today a rule adds days to a month or an intercalary block that exists every year or only in leap years; a 30-day block with `days: 0` plus a rule is a leap month in all but name, and the maker could offer it as one.
- **Cycles that are not "every n years":** the 19-year Metonic pattern (years 3, 6, 8, 11, 14, 17 and 19) needs a list of years within a cycle.
- **Negative leap rules:** a rule that takes a day away.
- **Seasons and solstices** as a kind of holiday, from a year length and a starting point.
- **Moon-based holidays with an offset** ("the first Restday after the first full moon of spring"), which is what Easter is.
- **A pattern formatter** (`D MMMM Y`), if the four styles turn out not to be enough.
- **Time of day:** hours in a day, for worlds that turn at another speed. Time may want it before Calendar does.

## 14 November 2026: @eurth/calendar 1.0.0

The engine's first release, so that Time can be built on it.

- **A calendar as data:** months, intercalary days inside or outside the week, weekdays, leap rules with chains of exceptions that add days to a month or to an intercalary block, two era labels, an optional Gregorian epoch, moons, holidays. Version 1 of the definition format.
- **Day counts, dates and the Gregorian calendar:** `toDays`, `fromDays`, `toGregorian`, `fromGregorian`, weekdays (including days that stand outside the week), year layouts, for ten million years either side of year 1. Whole-number arithmetic with no `Date` object, and no loop over years.
- **Moons:** any number, each with a period and a starting phase; the phase of any day and the list of new moons, quarters and full moons in a span, in exact arithmetic.
- **Holidays:** fixed dates (in months or on intercalary days), the nth or last weekday of a month, and moon-based (the nth, last or every phase in a month or the year).
- **Words:** dates in four styles, years with eras ("3 Before the Founding"), a compact text form for dates, a written description of a whole calendar and of a single day, a one-line summary.
- **Cleaning:** `normalizeCalendar` turns anything into a valid definition and says what it changed; the engine never trusts its input and never throws on a definition.
- **Links:** `encodeCalendar` and `decodeCalendar` (compact, versioned, base64url), and `calendarLink` with the shared `cal` parameter for handing a calendar to Time.
- **Profile:** `toProfileSection` and `fromProfileSection` for the Eurth profile's `calendar` section: the schema's simple fields plus the full definition under `definition`.
- **iCalendar:** holidays as an `.ics` file for calendars linked to Earth.
- **Five presets:** the Gregorian calendar; the Selunnan Reckoning (13 months of 28 days, a Midyear Day outside the week); the Tidewatch Count (lunar); the Meridian Republican Calendar (decimal, with festival days); the Kharan Long Year (another world, three moons).
- **Tests:** 113 of them. A million random day counts there and back through every preset on each run; every preset and 150 random calendars compared with a second implementation that counts day by day; the Gregorian preset against separate Gregorian arithmetic and JavaScript's `Date`; rubbish and hostile input for the cleaner and the link reader.
- **Packaging:** installed straight from GitHub with no build step and no dependencies; `lib/` is committed and a test keeps it in step with the source.

## Not planned

- **Publishing to npm.** Like `@eurth/style`, the package is installed from GitHub; one place to release from is enough.
- **Storing calendars on a server, or in the browser.** A calendar lives in its link or in the profile file. Nothing is kept anywhere else.
- **Real astronomy.** Moons keep mean time: steady cycles, no orbital wobble, no eclipses. It is right for an invented world and within about half a day for Earth's Moon; an ephemeris is a different tool.
- **Historical calendar switches** (the Julian to Gregorian change, country by country). The Gregorian preset runs the modern rules backwards for ever, which is what a link to Earth needs.
- **Time zones and clocks.** The engine counts days.
