You're building Calendar (cal.eurth.org), a maker for a world's own calendar, and the date engine that Time (time.eurth.org) will use. One of Eurth's free worldbuilding tools; Eurth (eurth.org) is a worldbuilding and roleplay community since 2004. The attached repo is eurth-org/eurth-calendar.

Working order (Foundations and many other tools are being built at the same time tonight):
1. Save this brief as CLAUDE.md.
2. If the repo named above doesn't exist on GitHub yet, create it as a public, empty repo in eurth-org with the gh CLI and connect this folder; if you can't, ask me.
3. Read what already exists of github.com/eurth-org/eurth-style (HANDBOOK.md) and github.com/eurth-org/eurth-profile; they may still be in progress. Write the plan and show it to me.
4. Build the tool's core logic as plain TypeScript modules with thorough tests, and its content and data (guide text, presets, examples, data snapshots). None of that needs eurth-style. For this tool, finish and release @eurth/calendar 1.0.0 first: the Time session is waiting for it.
5. Only once @eurth/style 1.0.0 is released (check the releases of github.com/eurth-org/eurth-style), start the site from its starter template and carry on to the end of this brief. Until then, don't scaffold the site, pages or styles.
6. Commit and push after every finished step, and keep roadmap.md up to date with exactly where to pick up, so a new session can continue if this one stops.

Background for every step: Read HANDBOOK.md in github.com/eurth-org/eurth-style and start from its starter template; read the profile schema in github.com/eurth-org/eurth-profile; look at github.com/eurth-org/eurth-flag, the reference build. The handbook wins over this brief on everything shared. Then write a plan and show it to me before you build.

Mock-up: the "cal.eurth.org, calendar maker" board on https://claude.ai/artifact/32RKDdVTtCfHsL6Qc6LxV6.

Two outputs from this repo
1. @eurth/calendar, a small, fully tested TypeScript date engine, published as a package from this repo (installed from GitHub like @eurth/style). It converts between a day count, the custom calendar and the Gregorian calendar, formats dates, and works out moon phases and holidays.
2. The site at cal.eurth.org.

Pages: Maker, Guide, Glossary, Examples.

The maker, v1
- Calendar name and era names ("FS", "Before the Founding"), year length, months (names and lengths), intercalary days that belong to no month, week length and day names.
- Leap rules: every n years, with exceptions (as the Gregorian 4/100/400), adding a day to a named month or an extra day.
- Epoch: which Gregorian date is day 1 of year 1, or no link to Earth at all.
- Moons: any number, each with a period and a starting phase.
- Holidays: fixed date, nth weekday of a month, or moon-based.
- Views: month grid with moon phases and holidays (word and icon, not colour alone), the whole year, and a converter between Earth dates and the calendar.
- Presets: the Gregorian calendar and four invented ones, as starting points.

Guide: how real calendars handle the year (solar, lunar, lunisolar), leap rules, weeks, eras, with sources.

Profile section "calendar": the full calendar definition, which Time reads.

Exports: printable year (A4 and Letter, as a PDF made in the browser), iCal of holidays, the definition as JSON, Copy description, and "Use in a timeline", which opens time.eurth.org with this calendar.

Signature touch: switching months turns the page like a desk calendar. Easter egg: a 13-month calendar of 28 days each shows "Very tidy." on Midyear Day.

Done when the handbook's checklist passes, the engine round-trips millions of random day counts through every preset without error, and @eurth/calendar v1.0.0 is released.
