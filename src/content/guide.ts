/**
 * The Guide page: how real calendars handle the year, the month, the week and the count of
 * years, written for someone inventing a calendar. Plain text only: no Markdown, no HTML.
 *
 * Every figure here is checked against the sources at the foot of the file. When you change a
 * number, check it again and change `updated`.
 */

/** A work the guide leans on. A `url` is only given when the page has been opened and checked. */
export interface Source {
  title: string;
  author?: string;
  publisher?: string;
  year?: number;
  url?: string;
  /** What the guide takes from it. */
  note?: string;
}

/** One section of the guide. */
export interface GuideSection {
  /** Kebab-case, unique: the section's anchor. */
  id: string;
  /** Sentence case. */
  title: string;
  paragraphs: string[];
  /** A short list, shown after the paragraphs. */
  points?: string[];
  /** One sentence on something to try in the maker. */
  tryIt?: string;
}

export interface Guide {
  title: string;
  /** The meta description: 120 to 160 characters. */
  description: string;
  /** The day the text was last checked, YYYY-MM-DD. */
  updated: string;
  intro: string[];
  sections: GuideSection[];
  sources: Source[];
}

export const guide: Guide = {
  title: 'How calendars work: a guide for worldbuilders',
  description:
    'How real calendars keep the year: solar, lunar and lunisolar systems, leap rules, weeks and eras, and what each one offers a worldbuilder.',
  updated: '2026-11-14',
  intro: [
    'A calendar is a promise that the same festival will come round in the same weather. Keeping that promise is harder than it looks, because the sky was not built with whole numbers in mind.',
    'This guide looks at how real calendars have handled the year, the month, the week and the count of years, and what each answer offers someone inventing a calendar of their own. Every idea here can be tried in the maker.',
  ],
  sections: [
    {
      id: 'three-clocks',
      title: 'Three clocks that never agree',
      paragraphs: [
        "Every calendar counts days. The trouble is what it tries to fit them into. The day is one turn of the planet. The month, in its first sense, is one round of the Moon's phases: the synodic month, about 29.5306 days from new moon to new moon. The year is one round of the seasons: the tropical year, about 365.2422 days.",
        'None of these divides evenly into another. Neither the year nor the month is a whole number of days, and the year is not a whole number of months. Twelve months come to about 354.37 days, nearly eleven days short of the year. Thirteen overshoot it by more than eighteen.',
        'So every calendar is a compromise. It picks one clock to follow faithfully, one to follow roughly, and one to ignore. Your world has the same problem with different numbers, and the same three ways out.',
      ],
      tryIt:
        'Open the Gregorian calendar preset and follow the full moon through the month grids: it keeps no fixed date in the month.',
    },
    {
      id: 'solar-calendars',
      title: 'Following the sun',
      paragraphs: [
        'A solar calendar follows the seasons and lets the moon go. The Egyptian civil calendar was the plainest of them: twelve months of 30 days and five extra days, 365 in all, with no leap year. That is about a quarter of a day short, so it slipped by a day every four years and went right round the seasons in about 1,500 years. Egypt carried on regardless.',
        "Julius Caesar's reform, in force from 45 BC, added one day every fourth year. The Julian year averages 365.25 days, about eleven minutes too long. That sounds harmless, and adds up to a day in roughly 128 years.",
        "By 1582 the spring equinox had moved about ten days from its date at the time of the Council of Nicaea in 325, which mattered because the date of Easter hangs on it. Pope Gregory XIII's bull Inter gravissimas removed ten days, so that Thursday 4 October was followed by Friday 15 October, and changed the rule: a century year is a leap year only if it divides by 400. The Gregorian year averages 365.2425 days and is out by roughly a day in 3,000 years.",
        'A calendar that drifts is not broken. It is a calendar with history in it: festivals that used to fall in spring, reformers, and regions that refuse the reform. Britain held out until 1752, by which time it had eleven days to drop.',
      ],
      tryIt:
        'Start from the Gregorian calendar preset and remove the 100 and 400 exceptions from its leap rule: that is the Julian calendar.',
    },
    {
      id: 'lunar-calendars',
      title: 'Following the moon',
      paragraphs: [
        'A lunar calendar does the opposite: it follows the moon and lets the seasons go. The Islamic calendar is the great example. It has twelve months, each traditionally beginning when the new crescent is first seen, and a year of 354 or 355 days.',
        'That is about eleven days shorter than the year of the seasons, so the months move steadily earlier and pass through every season in about 33 years. Ramadan can fall in midwinter or in midsummer. This is not a flaw: the calendar was never meant to follow the sun.',
        'For reckoning ahead there is an arithmetic version, the tabular Islamic calendar. Its months alternate between 30 and 29 days, and 11 years in every cycle of 30 get one extra day. That makes 10,631 days in 360 months, an average month of about 29.5306 days, which stays with the Moon to within a day in roughly 2,500 years.',
        'A lunar calendar suits a people who live by tides, night travel or the moon itself. It also gives you something a solar calendar never will: neighbours whose years are not the same length as yours.',
      ],
      tryIt:
        'Load the Tidewatch Count: its months alternate 30 and 29 days, and the full moon stays in the middle of every month.',
    },
    {
      id: 'lunisolar-calendars',
      title: 'Keeping both',
      paragraphs: [
        'A lunisolar calendar keeps both. Its months follow the moon, and roughly every third year it adds a whole leap month, so that the year keeps up with the seasons.',
        'What makes this workable is the Metonic cycle, named after Meton of Athens: 19 tropical years are very nearly 235 synodic months, the two differing by about two hours. Nineteen years of twelve months make 228, so seven leap months in every 19 years make up the difference.',
        "The Hebrew calendar does this by rule. Years 3, 6, 8, 11, 14, 17 and 19 of each cycle have thirteen months, and a year can last 353, 354, 355, 383, 384 or 385 days. The Chinese calendar works from astronomy instead: each month begins on the day of the new moon, and a leap month is added when a month passes without one of the twelve principal solar terms.",
        'This is the richest kind of calendar and the hardest to run. Someone has to announce the leap month, and in an invented world that is a job, a privilege and a source of plot.',
      ],
      tryIt:
        'Load the Tidewatch Count, add an intercalary block of no days after its last month, and give it 30 days every third year with a leap rule: a leap month in all but name.',
    },
    {
      id: 'leap-rules',
      title: 'Leap rules compared',
      paragraphs: [
        'A leap rule is a way of writing a fraction. The year is 365 days and a bit, and the rule says how often to add a day so that the average comes out right.',
        "A leap day every fourth year, except every 128th, is a simpler rule than the Gregorian one and lands within a second of today's tropical year. No country uses it. Calendars are chosen by committees and kept by habit, and the best arithmetic rarely wins.",
        "To make a rule for an invented year, start from the fraction. Say your world's year lasts 412.317 days. A leap day every third year gives 412.333, which is too long by about a sixtieth of a day. So skip one leap day every 60 years: 19 leap days in 60 years and a mean year of about 412.3167 days. One rule and one exception hold for thousands of years.",
        'You can also decide not to be that good. A rule with a visible error gives your world a calendar reform to argue about.',
      ],
      points: [
        'Julian: a leap day every 4 years, for a mean year of 365.25 days.',
        'Gregorian: every 4 years, except century years that do not divide by 400. That is 97 leap days in 400 years and a mean year of 365.2425 days.',
        'The 128-year rule: every 4 years, except every 128th. That is 31 leap days in 128 years and a mean year of 365.2421875 days.',
      ],
      tryIt:
        'The Kharan Long Year uses exactly this rule, and the Meridian Republican Calendar uses the 128-year rule.',
    },
    {
      id: 'weeks',
      title: 'The week goes its own way',
      paragraphs: [
        'The seven-day week is the odd one out: it follows nothing in the sky. It simply runs on, straight through month ends, year ends and calendar reforms. When ten days were dropped in 1582, Thursday was still followed by Friday. As far as anyone knows, the cycle has never been broken.',
        'Seven is a habit, not a law. Republican Rome had an eight-day market cycle, the nundinae, with the days lettered A to H on its calendars. The French Republican calendar cut each 30-day month into three décades of ten days, with rest on the tenth, and people noticed that one day off in ten is fewer than one in seven. The Soviet Union tried a five-day week with staggered rest days from 1929, then a six-day week from 1931, and went back to seven in 1940.',
        'Because 365 is one more than 52 weeks, dates wander through the weekdays from year to year. Two proposals of the twentieth century, the World Calendar and the International Fixed Calendar, stop that by giving the year 364 ordinary days and putting the 365th outside the week: a day with a date and no weekday. The Fixed Calendar goes further, with thirteen months of 28 days, each beginning on a Sunday. Neither was adopted, and breaking the seven-day cycle was a large part of the objection.',
        'In an invented world the week is where daily life shows: market day, rest day, the day the ferry runs. Choose its length for the rhythm you want, then decide whether it is sacred enough to run unbroken.',
      ],
      tryIt:
        'The Selunnan Reckoning is 13 × 28 with a Midyear Day outside the week, and the Meridian Republican Calendar has weeks of ten: in both, every month starts on the same weekday.',
    },
    {
      id: 'days-outside-the-months',
      title: 'Days that belong to no month',
      paragraphs: [
        'Tidy months leave days over. Twelve months of 30 days make 360, and something must be done with the other five. The Egyptians put them after the twelfth month and outside all of them. They are known by a Greek name, the epagomenal days, and in Egyptian tradition they were the birthdays of five gods: Osiris, Horus, Seth, Isis and Nephthys. The Coptic and Ethiopian calendars still end the year this way, with a sixth day every fourth year.',
        'The French Republican calendar did the same with different gods. Its five closing days, the sansculottides, were festivals of Virtue, Genius, Labour, Opinion and Rewards, with a sixth, the day of the Revolution, in leap years.',
        'Leftover days are a gift to a worldbuilder. They belong to no month, so they can be anything: a festival, a fast, a day when no contract can be signed. Decide where they sit, whether the week counts them, and what people call a day that has no ordinary name.',
      ],
      tryIt:
        'In the Meridian Republican Calendar, look at the Festival block after the twelfth month: five days outside month and week, and a sixth in leap years.',
    },
    {
      id: 'eras-and-epochs',
      title: 'Counting the years',
      paragraphs: [
        'A calendar also needs somewhere to count from. The oldest answer is the regnal year: the fifth year of this king, the second of that one. It needs no arithmetic, only a good memory for reigns. Japan still names its years this way beside the Gregorian count: 2026 is Reiwa 8.',
        "An era fixes one starting point, its epoch, and counts on from there. Roman historians counted from the founding of the city, ab urbe condita, traditionally 753 BC. The Hebrew calendar counts Anno Mundi, from a reckoned creation in 3761 BC. The Islamic calendar counts from the Hijra, Muhammad's migration from Mecca to Medina in AD 622. The French Republic counted from its own proclamation on 22 September 1792, and since the calendar was only adopted late in 1793, year I was over before anyone could date a letter by it.",
        'The AD count was worked out by the monk Dionysius Exiguus in the sixth century, and the years BC were added later. There is no year zero between them: 1 BC is followed directly by AD 1. That makes sums across the boundary awkward, so astronomers number the years differently, calling 1 BC year 0 and 2 BC year −1.',
        'For your world, an epoch says what a people think their history starts with: a founding, a conquest, a prophet, a disaster. Rival nations can share months and weekdays and still disagree about the year. Decide early whether there is a year zero, before your timeline depends on it.',
      ],
      tryIt:
        'The Selunnan Reckoning counts back from year 1 as "Before the Founding" with no year zero, while the Kharan Long Year names no such era and so gets a year 0.',
    },
    {
      id: 'designing-your-own',
      title: 'Designing a calendar for your world',
      paragraphs: [
        "Start with the sky: the length of your planet's year in its own days, the number of moons, and how long each takes from new to new. Fix those numbers before you name a single month, because everything else leans on them.",
        'Then decide what the calendar must stay in step with. Farmers need the seasons. Sailors and priests may need a moon. Tax collectors need months of a predictable length. You cannot please them all, and the choice tells you who held power when the calendar was made.',
        'Last, leave a flaw. Real calendars carry old mistakes: months named after the wrong number, and a February nobody would design. A calendar that is slightly wrong in a way its people have stopped noticing will feel more real than a perfect one.',
      ],
      points: [
        'Choose the month lengths, then count what is left over. Leftover days become leap days, festival days or one short month.',
        'Keep names short and pronounceable. Players will have to say them aloud, and nobody remembers a month with three apostrophes.',
        'Choose an epoch, and write down what happened in year 1.',
      ],
      tryIt:
        'Start from the preset nearest your idea, change one thing at a time, and use Copy description to check that the calendar still says what you meant.',
    },
  ],
  sources: [
    {
      title: 'Calendrical Calculations: The Ultimate Edition',
      author: 'Edward M. Reingold and Nachum Dershowitz',
      publisher: 'Cambridge University Press',
      year: 2018,
      url: 'https://doi.org/10.1017/9781107415058',
      note: 'The standard work on calendar arithmetic: the Gregorian, Julian, Islamic, Hebrew, Chinese and French Republican calendars, and the fixed day count (rata die).',
    },
    {
      title: 'Mapping Time: The Calendar and its History',
      author: 'E. G. Richards',
      publisher: 'Oxford University Press',
      year: 1998,
      note: 'A history of the calendars described here, including the Egyptian and French Republican calendars, the week and the reform proposals of the twentieth century.',
    },
    {
      title: 'Calendars, chapter 15 of the Explanatory Supplement to the Astronomical Almanac, third edition',
      author: 'E. G. Richards; edited by Sean E. Urban and P. Kenneth Seidelmann',
      publisher: 'University Science Books',
      year: 2012,
      url: 'https://aa.usno.navy.mil/downloads/c15_usb_online.pdf',
      note: 'The lengths of the year and the lunation, the three kinds of calendar, the Egyptian year and its epagomenal days, the week, eras and Julian day numbers.',
    },
    {
      title: 'Calendars, from the Explanatory Supplement to the Astronomical Almanac, 1992 edition',
      author: 'L. E. Doggett; edited by P. Kenneth Seidelmann',
      publisher: 'University Science Books; reprinted online by NASA',
      year: 1992,
      url: 'https://eclipse.gsfc.nasa.gov/SEhelp/calendars.html',
      note: 'The rules of the Gregorian, Hebrew, Islamic and Chinese calendars, with the leap years of the 19-year and 30-year cycles.',
    },
    {
      title: 'Inter gravissimas',
      author: 'Pope Gregory XIII',
      year: 1582,
      url: 'https://en.wikisource.org/wiki/Translation:Inter_gravissimas',
      note: 'The papal bull that set up the Gregorian calendar, in English translation: the ten days removed from October 1582 and the rule for century years.',
    },
    {
      title: 'Introduction to Calendars',
      publisher: 'Astronomical Applications Department, United States Naval Observatory',
      url: 'https://aa.usno.navy.mil/faq/calendars',
      note: 'A short account of solar, lunar and lunisolar calendars, the Gregorian leap rule and the Metonic cycle.',
    },
    {
      title: 'Frequently Asked Questions about Calendars',
      author: 'Claus Tøndering',
      url: 'https://www.tondering.dk/claus/calendar.html',
      note: 'Plain answers on the Gregorian reform and when countries adopted it, the Islamic calendar, the French Republican calendar, and the week, including the Soviet five-day and six-day weeks.',
    },
    {
      title: 'The Seven Day Circle: The History and Meaning of the Week',
      author: 'Eviatar Zerubavel',
      publisher: 'Free Press',
      year: 1985,
      note: 'The week as a social invention, and the French and Soviet attempts to replace it.',
    },
    {
      title: 'The Oxford Companion to the Year',
      author: 'Bonnie Blackburn and Leofranc Holford-Strevens',
      publisher: 'Oxford University Press',
      year: 1999,
      note: 'Eras and ways of numbering years, the Roman calendar and its market days, and the history of calendar reform.',
    },
    {
      title: 'The history of the tropical year',
      author: 'Jean Meeus and Denis Savoie',
      publisher: 'Journal of the British Astronomical Association, volume 102, pages 40 to 42',
      year: 1992,
      note: 'What the tropical year is, how its length has been measured, and how slowly it changes.',
    },
  ],
};
