import type { Location } from '../services/weather';

/** Builds a readable label such as "Berlin, Berlin, Germany". */
export function formatLocationName(location: Location): string {
  return [location.name, location.admin1, location.country]
    .filter((part): part is string => Boolean(part))
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(', ');
}

/**
 * Formats a "YYYY-MM-DD" date as a short weekday name. Parsing in UTC keeps
 * the calendar day stable regardless of the viewer's time zone.
 */
export function formatWeekday(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
