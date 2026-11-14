/**
 * The limits a calendar definition is held to. They match the Eurth profile's "calendar"
 * section where the two overlap, and keep every sum inside what a JavaScript number holds
 * exactly.
 */
export const LIMITS = Object.freeze({
  /** Longest calendar, month, weekday, moon, intercalary or holiday name. */
  name: 80,
  /** Longest short form of a month name. */
  short: 12,
  /** Longest era label after a year ("FS"). */
  era: 20,
  /** Longest label for the years before year 1 ("Before the Founding"). */
  eraBefore: 40,
  months: 100,
  monthDays: 1000,
  intercalary: 20,
  intercalaryDays: 1000,
  weekdays: 30,
  leapRules: 8,
  /** Largest "every n years". */
  leapEvery: 100_000,
  /** Most exceptions in one rule's chain. */
  leapExceptions: 3,
  /**
   * The chain of a leap rule repeats after the least common multiple of its numbers. An
   * exception that would push that past this is dropped: it could never matter in the years
   * the engine covers.
   */
  leapCycle: 10_000_000,
  /** Most days one leap rule adds. */
  leapDays: 1000,
  moons: 12,
  /** Shortest and longest moon cycle, in days. */
  moonPeriodMin: 1,
  moonPeriodMax: 10_000,
  holidays: 200,
  /** Years run from -maxYear to +maxYear. */
  maxYear: 10_000_000,
});
