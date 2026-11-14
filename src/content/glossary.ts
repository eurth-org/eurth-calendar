/**
 * The Glossary page: the terms the maker and the guide use, in groups. It becomes a
 * DefinedTermSet. Plain text only: no Markdown, no HTML.
 *
 * Each `text` must make sense read alone, and each id in `see` must be a term in this file.
 */

/** One defined term. */
export interface Term {
  /** Kebab-case, unique across the whole glossary: the term's anchor. */
  id: string;
  term: string;
  /** Another name for the same thing. */
  also?: string;
  /** One to three plain sentences. */
  text: string;
  /** Ids of related terms. */
  see?: string[];
}

/** A group of terms under one heading. */
export interface TermGroup {
  /** Kebab-case, unique across the whole glossary. */
  id: string;
  /** Sentence case. */
  title: string;
  intro: string;
  terms: Term[];
}

export interface Glossary {
  title: string;
  /** The meta description: 120 to 160 characters. */
  description: string;
  /** The day the text was last checked, YYYY-MM-DD. */
  updated: string;
  groups: TermGroup[];
}

export const glossary: Glossary = {
  title: 'Calendar glossary',
  description:
    'Plain definitions of calendar terms for worldbuilders: tropical year, synodic month, leap rules, intercalary days, epochs, eras and more.',
  updated: '2026-11-14',
  groups: [
    {
      id: 'the-sky',
      title: 'The sky',
      intro: 'What a calendar is trying to keep up with: the turning planet, its sun and its moons.',
      terms: [
        {
          id: 'solar-day',
          term: 'Solar day',
          text: 'The time from one noon to the next, and the unit every calendar counts in. Calendars are built from whole days, which is where the trouble starts.',
          see: ['day-count', 'tropical-year'],
        },
        {
          id: 'tropical-year',
          term: 'Tropical year',
          also: 'solar year',
          text: 'The year of the seasons: the average time the seasons take to come round again. On Earth it is about 365.2422 days, and it is the year a solar calendar tries to follow.',
          see: ['sidereal-year', 'solar-calendar', 'mean-year'],
        },
        {
          id: 'sidereal-year',
          term: 'Sidereal year',
          text: "The time a planet takes to go once round its sun, measured against the stars. Earth's is about 365.2564 days, some 20 minutes longer than the tropical year, because the planet's axis slowly changes direction.",
          see: ['tropical-year'],
        },
        {
          id: 'equinox',
          term: 'Equinox',
          text: 'One of the two moments in the year when the sun stands directly over the equator and day and night are about equal everywhere. Many calendars begin their year at or near one.',
          see: ['solstice', 'tropical-year'],
        },
        {
          id: 'solstice',
          term: 'Solstice',
          text: 'One of the two moments in the year when the sun reaches its furthest north or south in the sky, giving the longest and the shortest day.',
          see: ['equinox', 'tropical-year'],
        },
        {
          id: 'synodic-month',
          term: 'Synodic month',
          also: 'lunar month',
          text: "The average time from one new moon to the next, as seen from the planet. For Earth's Moon it is about 29.5306 days.",
          see: ['lunation', 'new-moon', 'lunar-calendar'],
        },
        {
          id: 'lunation',
          term: 'Lunation',
          text: "One complete round of a moon's phases, from new moon to new moon. The Moon's lunations average one synodic month, though any single one can be several hours longer or shorter.",
          see: ['synodic-month', 'phase'],
        },
        {
          id: 'phase',
          term: 'Phase',
          text: "How much of a moon's sunlit side can be seen from the planet at a given time. The four principal phases are new moon, first quarter, full moon and last quarter.",
          see: ['new-moon', 'quarter', 'full-moon', 'lunation'],
        },
        {
          id: 'new-moon',
          term: 'New moon',
          text: 'The phase when a moon stands in the same direction as the sun and shows the planet its unlit side, so it cannot be seen. Lunar calendars often begin their months at the new moon, or at the first thin crescent after it.',
          see: ['phase', 'full-moon', 'synodic-month'],
        },
        {
          id: 'full-moon',
          term: 'Full moon',
          text: "The phase when the whole of a moon's face is lit, halfway through the lunation. It is a favourite anchor for festivals.",
          see: ['phase', 'new-moon', 'movable-feast'],
        },
        {
          id: 'quarter',
          term: 'Quarter',
          also: 'half moon',
          text: "Either of the two phases when half of a moon's disc is lit: the first quarter, a quarter of the way through the lunation, and the last quarter, three quarters of the way through. The name counts quarters of the cycle, not of the disc.",
          see: ['phase', 'lunation'],
        },
      ],
    },
    {
      id: 'kinds-of-calendar',
      title: 'Kinds of calendar',
      intro: 'The families calendars fall into, and the two that most of Earth has lived by.',
      terms: [
        {
          id: 'solar-calendar',
          term: 'Solar calendar',
          text: 'A calendar that follows the tropical year and keeps its dates in the same season, letting the moon go its own way. The Gregorian calendar is one.',
          see: ['tropical-year', 'lunar-calendar', 'lunisolar-calendar'],
        },
        {
          id: 'lunar-calendar',
          term: 'Lunar calendar',
          text: "A calendar whose months follow a moon and whose year is simply a number of those months. Twelve of the Moon's months make about 354 days, so a lunar year drifts through the seasons, as the Islamic calendar does.",
          see: ['synodic-month', 'solar-calendar', 'lunisolar-calendar', 'calendar-drift'],
        },
        {
          id: 'lunisolar-calendar',
          term: 'Lunisolar calendar',
          text: 'A calendar whose months follow a moon and whose years are kept with the seasons by adding a leap month every few years. The Hebrew and Chinese calendars work this way.',
          see: ['leap-month', 'metonic-cycle', 'lunar-calendar', 'solar-calendar'],
        },
        {
          id: 'arithmetic-calendar',
          term: 'Arithmetic calendar',
          also: 'tabular calendar',
          text: 'A calendar worked out entirely by rule, with no need to look at the sky. The Gregorian calendar is one, and so is every calendar made in the maker.',
          see: ['observational-calendar', 'leap-year'],
        },
        {
          id: 'observational-calendar',
          term: 'Observational calendar',
          text: 'A calendar set by watching the sky, for example by beginning each month when the new crescent is first seen. It cannot drift, but nobody can be certain of next year in advance.',
          see: ['arithmetic-calendar', 'new-moon'],
        },
        {
          id: 'perennial-calendar',
          term: 'Perennial calendar',
          text: 'A calendar in which every date falls on the same weekday every year, so one printed page serves for good. It usually needs a day or two outside the week to work.',
          see: ['week', 'intercalary-day', 'weekday'],
        },
        {
          id: 'proleptic-calendar',
          term: 'Proleptic calendar',
          text: "A calendar run backwards to dates before it was introduced. The proleptic Gregorian calendar applies today's rules to years long before 1582.",
          see: ['gregorian-calendar', 'julian-calendar', 'epoch'],
        },
        {
          id: 'julian-calendar',
          term: 'Julian calendar',
          text: 'The solar calendar introduced by Julius Caesar and in force from 45 BC: 365 days, with a leap day every fourth year, for a mean year of 365.25 days. It drifts against the seasons by about a day in 128 years.',
          see: ['gregorian-calendar', 'leap-year', 'calendar-drift'],
        },
        {
          id: 'gregorian-calendar',
          term: 'Gregorian calendar',
          text: 'The Julian calendar as corrected in 1582 under Pope Gregory XIII: a century year is a leap year only when it divides by 400. That gives 97 leap years in 400 and a mean year of 365.2425 days.',
          see: ['julian-calendar', 'leap-year', 'mean-year', 'proleptic-calendar'],
        },
      ],
    },
    {
      id: 'years-and-leap-years',
      title: 'Years and leap years',
      intro: 'How a year made of whole days is kept in step with a sky that does not deal in whole numbers.',
      terms: [
        {
          id: 'common-year',
          term: 'Common year',
          text: 'A year of the ordinary length, with no leap day or leap month. In the Gregorian calendar it has 365 days.',
          see: ['leap-year', 'mean-year'],
        },
        {
          id: 'leap-year',
          term: 'Leap year',
          text: 'A year made longer than a common year by a leap day or a leap month, to bring the calendar back into step with the sky.',
          see: ['common-year', 'leap-day', 'leap-month', 'intercalation'],
        },
        {
          id: 'leap-day',
          term: 'Leap day',
          text: 'An extra day added to a leap year. In the Gregorian calendar it is 29 February. In an invented calendar it can join any month or stand alone between two of them.',
          see: ['leap-year', 'intercalary-day', 'intercalation'],
        },
        {
          id: 'leap-month',
          term: 'Leap month',
          also: 'intercalary month',
          text: 'A whole extra month added to some years of a lunisolar calendar, so that the months keep their seasons. The Hebrew calendar adds seven in every 19 years.',
          see: ['lunisolar-calendar', 'metonic-cycle', 'intercalation'],
        },
        {
          id: 'intercalation',
          term: 'Intercalation',
          text: 'Adding a day or a month to a calendar year to keep it in step with the sun or a moon. Leap days and leap months are both intercalations.',
          see: ['leap-day', 'leap-month', 'intercalary-day'],
        },
        {
          id: 'mean-year',
          term: 'Mean year',
          also: 'average year',
          text: "The average length of a calendar's year over one full cycle of its leap rules. For the Gregorian calendar it is 365.2425 days: 146,097 days in 400 years.",
          see: ['leap-year', 'tropical-year', 'calendar-drift'],
        },
        {
          id: 'metonic-cycle',
          term: 'Metonic cycle',
          text: 'A period of 19 years that is very nearly 235 synodic months: the two differ by about two hours. Lunisolar calendars use it to place seven leap months in every 19 years. It is named after Meton of Athens.',
          see: ['lunisolar-calendar', 'leap-month', 'synodic-month'],
        },
        {
          id: 'calendar-drift',
          term: 'Calendar drift',
          text: 'The slow slide of a calendar against the thing it is meant to follow, because its mean year or month is slightly wrong. By 1582 the Julian calendar had slipped about ten days against the equinox since the fourth century.',
          see: ['mean-year', 'julian-calendar', 'equinox'],
        },
      ],
    },
    {
      id: 'weeks-and-days',
      title: 'Weeks and days',
      intro: 'The short cycle of named days, and the days that get special treatment.',
      terms: [
        {
          id: 'week',
          term: 'Week',
          text: 'A short repeating cycle of named days that runs on without regard to months or years. Seven days is the familiar length, but weeks of five, six, eight and ten days have all been used.',
          see: ['weekday', 'perennial-calendar'],
        },
        {
          id: 'weekday',
          term: 'Weekday',
          also: 'day of the week',
          text: "A day's place in the week and the name that goes with it: Monday, Tideday, Tenthday. Here it means any day of the week, not only a working day.",
          see: ['week'],
        },
        {
          id: 'intercalary-day',
          term: 'Intercalary day',
          text: 'A day inserted into the calendar. In the maker it means a day that belongs to no month, standing between two months or at either end of the year, and it can count in the week or stand outside it.',
          see: ['epagomenal-days', 'festival-day', 'intercalation', 'leap-day'],
        },
        {
          id: 'epagomenal-days',
          term: 'Epagomenal days',
          text: 'Days added after the last month to complete the year, belonging to no month. The Egyptian calendar had five of them after its twelve months of 30 days.',
          see: ['intercalary-day', 'festival-day'],
        },
        {
          id: 'festival-day',
          term: 'Festival day',
          text: 'A day set apart from ordinary reckoning for celebration, often outside both month and week, like the five or six days that closed the French Republican year.',
          see: ['intercalary-day', 'epagomenal-days', 'holiday'],
        },
        {
          id: 'holiday',
          term: 'Holiday',
          text: 'A day marked for rest, worship or celebration. In the maker a holiday can be a fixed date, the nth weekday of a month, or a phase of a moon.',
          see: ['movable-feast', 'festival-day'],
        },
        {
          id: 'movable-feast',
          term: 'Movable feast',
          text: 'A holiday that falls on a different date each year because it follows a moon, the week, or both. Easter is the best known.',
          see: ['holiday', 'full-moon', 'weekday'],
        },
        {
          id: 'ordinal-date',
          term: 'Ordinal date',
          also: 'day of the year',
          text: 'A date given as a year and the number of the day within it, with no month: day 318 of 2026 for 14 November 2026.',
          see: ['day-count'],
        },
      ],
    },
    {
      id: 'eras-and-counting',
      title: 'Eras and counting',
      intro: 'Where a calendar starts, how it numbers its years, and how to count days without any years at all.',
      terms: [
        {
          id: 'epoch',
          term: 'Epoch',
          text: 'The fixed moment a calendar counts from: day 1 of year 1. In the maker an epoch can also be tied to a date on Earth, so that dates can be converted between the two.',
          see: ['era', 'day-count', 'year-zero'],
        },
        {
          id: 'era',
          term: 'Era',
          text: 'A run of years counted from one epoch, and the label written beside them: CE, AH, FS. A calendar may have one label for the years from its epoch on and another for the years before.',
          see: ['epoch', 'regnal-year', 'year-zero'],
        },
        {
          id: 'regnal-year',
          term: 'Regnal year',
          text: "A year counted from the start of a ruler's reign, as in the third year of Queen Anne. Each new reign begins the count again.",
          see: ['era', 'epoch'],
        },
        {
          id: 'year-zero',
          term: 'Year zero',
          text: 'A year numbered 0 between the years before an epoch and the years after it. The AD and BC count has none, so 1 BC is followed directly by AD 1. Astronomers add one, calling 1 BC year 0 and 2 BC year −1.',
          see: ['epoch', 'era', 'proleptic-calendar'],
        },
        {
          id: 'day-count',
          term: 'Day count',
          text: "A running count of days from one fixed day, taking no notice of months or years. It is the simplest way to compare two dates or find the days between them, and it is how the maker's engine keeps every day.",
          see: ['julian-day-number', 'rata-die', 'epoch'],
        },
        {
          id: 'julian-day-number',
          term: 'Julian day number',
          text: 'A day count used by astronomers that begins at noon on 1 January 4713 BC in the proleptic Julian calendar. Julian day 2,451,545 began at noon on 1 January 2000.',
          see: ['day-count', 'rata-die', 'proleptic-calendar'],
        },
        {
          id: 'rata-die',
          term: 'Rata die',
          also: 'fixed date',
          text: 'A day count in which day 1 is 1 January of year 1 in the proleptic Gregorian calendar, used by Reingold and Dershowitz in Calendrical Calculations. The name is Latin for "fixed date".',
          see: ['day-count', 'julian-day-number', 'proleptic-calendar'],
        },
      ],
    },
  ],
};
