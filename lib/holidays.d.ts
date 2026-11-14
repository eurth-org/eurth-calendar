/** Working out when a year's holidays fall. */
import type { Calendar } from './calendar.js';
import type { HolidayOccurrence } from './types.js';
/** The holidays of one year, in order of day, then in the order they are listed in the definition. */
export declare function holidaysInYear(calendar: Calendar, year: number): HolidayOccurrence[];
