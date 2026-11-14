/**
 * The Examples page: the five presets written up, each with what to look at and what to change
 * first. Plain text only: no Markdown, no HTML.
 *
 * Every statement here must be true of the preset's definition in src/engine/presets.ts. When a
 * preset changes, read its entry again. A test checks the ids, order and titles.
 */

/** One preset, written up. */
export interface Example {
  /** The preset's id. */
  id: string;
  /** The preset definition's name. */
  title: string;
  /** A few words on what kind of calendar it is. */
  kicker: string;
  /** One or two short paragraphs. */
  text: string[];
  /** Things to look at in the maker. */
  notice: string[];
  /** Changes to try first. */
  tryNext: string[];
}

export interface Examples {
  title: string;
  /** The meta description: 120 to 160 characters. */
  description: string;
  /** The day the text was last checked, YYYY-MM-DD. */
  updated: string;
  intro: string;
  items: Example[];
}

export const examples: Examples = {
  title: 'Example calendars',
  description:
    'Five calendars to start from: the Gregorian calendar and four invented ones, each a different way to build a year, with what to try first.',
  updated: '2026-11-14',
  intro:
    'Five calendars to open in the maker and take apart. One is real and four are invented, and each shows a different way to build a year. None of them is precious: change the names, break the rules, keep what works.',
  items: [
    {
      id: 'gregorian',
      title: 'Gregorian calendar',
      kicker: 'Solar, with twelve uneven months',
      text: [
        "Earth's civil calendar, and the one every other calendar here is quietly compared with. Twelve months of 28 to 31 days make 365. A leap day in February every fourth year, except in century years that do not divide by 400, brings the average year to 365.2425 days.",
        'The preset runs the same rules backwards and forwards for ever, which makes it the proleptic Gregorian calendar: it will give you a date in the year 800 that nobody alive at the time would have recognised. Its Moon is the average Moon, within about half a day of the real one.',
      ],
      notice: [
        'The full moon keeps no fixed date in the month. The months stopped following the Moon long ago.',
        'Leap Day is a holiday on 29 February, so it turns up only in leap years.',
        'Earth Hour is set as the last Saturday of March: a holiday that keeps its weekday and changes its date.',
        'The year starts on a different weekday from one year to the next, because 365 days are 52 weeks and a day.',
      ],
      tryNext: [
        'Remove the 100 and 400 exceptions from the leap rule to get the Julian calendar.',
        'Replace the exceptions with a single 128 and compare the average year.',
        'Rename the months and weekdays and keep the rest: the quickest way to a calendar that sounds foreign and works like home.',
      ],
    },
    {
      id: 'selunnan',
      title: 'Selunnan Reckoning',
      kicker: 'Perennial, 13 × 28',
      text: [
        'Thirteen months of 28 days, each exactly four weeks. Every month starts on a Solday and ends on a Restday, so a date falls on the same weekday year after year. Every fifth year a Midyear Day is added after Highmoon, the seventh month. It stands outside the week, so even then the pattern holds.',
        "Two moons, Selen and Kair, keep their own time above it all. The year averages 364.2 days, which suits a world whose year is that long. It is about a day shorter than Earth's, so the linked Earth dates slip by roughly a day a year.",
      ],
      notice: [
        'Every month grid is the same four tidy rows. Only the moons and the holidays change.',
        'Spring Market is set as the second Fieldday of Seedmoon, which in this calendar is always the 13th.',
        'Lantern Night is the first full moon of Selen in Darkmoon. Selen takes 29.5 days and Darkmoon has 28, so about one year in twenty has no Lantern Night at all.',
        'In a leap year, look between Highmoon and Ripemoon: Midyear Day has a date and no weekday.',
      ],
      tryNext: [
        'Let Midyear Day count in the week, and watch the months after it stop starting on Solday.',
        'Give Selen a period of exactly 28 days. The full moon then falls on the same date every month, until a Midyear Day moves it a day earlier.',
        'Add a day after Darkmoon every year, outside the week, to bring the ordinary year up to 365 days.',
      ],
    },
    {
      id: 'tidewatch',
      title: 'Tidewatch Count',
      kicker: 'Lunar, drifting through the seasons',
      text: [
        'A purely lunar calendar. Twelve months alternate between 30 and 29 days, 354 in all, and follow the moon Ila and nothing else. A day is added to Lumen, the last month, every third year, and to Farrow, the sixth, every thirtieth. That makes eleven leap days in thirty years, enough to keep each month beginning close to the new moon.',
        "What it does not keep is the seasons. If the Tidewatchers' seasons take as long as Earth's, their calendar year is about eleven days short, and each month wanders through spring, summer, autumn and winter in about 33 years. The calendar has no link to Earth, so there are no Earth dates to convert.",
      ],
      notice: [
        'Bright Night is every full moon of Ila: twelve a year, always between the 15th and the 17th of the month.',
        'The month grid and the moon agree: a thin crescent in the first days of a month, the last sliver or a dark sky at its end.',
        'Year 30 gets both leap days and runs to 356 days.',
        'Blessing of the Nets is the first Netday of Dessa, so its date moves about within the first seven days of the month.',
      ],
      tryNext: [
        'Add a second, slower moon and see how seldom the two are full on the same night.',
        'Add an intercalary block of no days after Lumen, and a leap rule that gives it 30 days every third year: a rough leap month, and the start of a lunisolar calendar.',
        'Rename the weekdays for your own coast. The week here has seven days, named for tides and work.',
      ],
    },
    {
      id: 'meridian',
      title: 'Meridian Republican Calendar',
      kicker: 'Decimal, with festival days',
      text: [
        'A decimal calendar modelled on the one the French Republic used from 1793 to 1805. Twelve months of 30 days, each of three ten-day weeks, are followed by five Festival days that belong to no month and no week. A sixth is added every fourth year, except every 128th, which gives an average year of 365.2421875 days.',
        'Day 1 is 22 September 1792, the day the French calendar counted from, and the month names are plain English versions of the French ones: Vintage for Vendémiaire, Fogmonth for Brumaire, and so on. The leap rule is our own choice. The French calendar tied its new year to the autumn equinox instead.',
      ],
      notice: [
        'Every month starts on a Firstday and ends on a Tenthday. The 10th, 20th and 30th are always Tenthdays.',
        'The Festival block closes the year: Festival of Virtue on its first day, Festival of Labour on its third, and Festival of the Republic on its sixth, in leap years only.',
        'Assembly Day is set as the first Tenthday of Budmonth, which is always the 10th.',
        'In the converter, 14 November 2026 is Thirday, 23 Fogmonth 235 YR.',
      ],
      tryNext: [
        'Move the Festival block to the middle of the year, after Windmonth.',
        'Let the festival days count in the week, and watch the months stop starting on Firstday.',
        'Swap the leap rule for the Gregorian one and compare the average year: 365.2425 days against 365.2421875.',
      ],
    },
    {
      id: 'kharan',
      title: 'Kharan Long Year',
      kicker: 'Another world: 412 days and three moons',
      text: [
        'A calendar with nothing of Earth in it. The year has 412 days: ten months of 41, with Dawnturn before the first and Duskturn after the last. Both turning days count in the eight-day week, which runs from Onesun to Darksun. Every third year, except every sixtieth, Jurn gets a 42nd day, for an average year of about 412.3167 days.',
        'Three moons cross the grid at their own speeds: Aru in 12.25 days, Besh in 33 and Tolu in 97.6. The years before year 1 have no name of their own, so the count simply runs down through 0 KY to −1 KY.',
      ],
      notice: [
        'A month of 41 days is five weeks and a day, so each month starts one weekday later than the month before.',
        'Aru runs through its phases more than three times in a month. Tolu is full only four or five times a year.',
        'Night of Tolu is the last full moon of Tolu in the year, and can land anywhere from late Hadd to Duskturn itself.',
        'The year before year 1 is written 0 KY: this calendar has a year zero.',
      ],
      tryNext: [
        'Take Dawnturn and Duskturn out of the week. That leaves the 410 days of an ordinary year in the week, which eight still does not divide, so try a week of five or ten.',
        'Give the years before year 1 a name of their own, and the year zero disappears.',
        'Drop the exception from the leap rule and compare the average year: about 412.3333 days against 412.3167.',
      ],
    },
  ],
};
