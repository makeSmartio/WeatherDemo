const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

export interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbability: number | null;
}

export interface WeatherUnits {
  temperature: string;
  wind: string;
}

export interface WeatherReport {
  location: Location;
  current: CurrentWeather;
  daily: DailyForecast[];
  units: WeatherUnits;
}

export interface RequestOptions {
  signal?: AbortSignal;
}

export class WeatherApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'WeatherApiError';
  }
}

interface RawLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

interface GeocodingResponse {
  results?: RawLocation[];
}

interface ForecastResponse {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  current_units: {
    temperature_2m: string;
    wind_speed_10m: string;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max?: (number | null)[];
  };
}

async function getJson<T>(url: URL, options: RequestOptions): Promise<T> {
  const response = await fetch(url, { signal: options.signal });
  if (!response.ok) {
    throw new WeatherApiError(
      `Weather service responded with status ${response.status}.`,
      response.status,
    );
  }
  return (await response.json()) as T;
}

/**
 * Finds cities matching a free-text query. Queries shorter than two
 * characters return an empty list without making a request.
 */
export async function searchLocations(
  query: string,
  options: RequestOptions = {},
): Promise<Location[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const url = new URL(GEOCODING_URL);
  url.search = new URLSearchParams({
    name: trimmed,
    count: '5',
    language: 'en',
    format: 'json',
  }).toString();

  const data = await getJson<GeocodingResponse>(url, options);
  return (data.results ?? []).map(toLocation);
}

/** Converts a raw Open-Meteo forecast payload into the app's report shape. */
export function transformForecast(
  location: Location,
  raw: ForecastResponse,
): WeatherReport {
  const probabilities = raw.daily.precipitation_probability_max ?? [];

  return {
    location,
    current: {
      time: raw.current.time,
      temperature: raw.current.temperature_2m,
      apparentTemperature: raw.current.apparent_temperature,
      humidity: raw.current.relative_humidity_2m,
      windSpeed: raw.current.wind_speed_10m,
      weatherCode: raw.current.weather_code,
    },
    daily: raw.daily.time.map((date, index) => ({
      date,
      weatherCode: raw.daily.weather_code[index],
      temperatureMax: raw.daily.temperature_2m_max[index],
      temperatureMin: raw.daily.temperature_2m_min[index],
      precipitationProbability: probabilities[index] ?? null,
    })),
    units: {
      temperature: raw.current_units.temperature_2m,
      wind: raw.current_units.wind_speed_10m,
    },
  };
}

/** Fetches current conditions and a seven-day forecast for a location. */
export async function fetchWeatherReport(
  location: Location,
  options: RequestOptions = {},
): Promise<WeatherReport> {
  const url = new URL(FORECAST_URL);
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'auto',
    forecast_days: '7',
  }).toString();

  const data = await getJson<ForecastResponse>(url, options);
  return transformForecast(location, data);
}

/** Returns a user-facing message for any error thrown by this module. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof WeatherApiError) {
    return `${error.message} Please try again in a moment.`;
  }
  if (error instanceof TypeError) {
    return 'Network error: check your connection and try again.';
  }
  return 'Something went wrong while loading the weather.';
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function toLocation(raw: RawLocation): Location {
  return {
    id: raw.id,
    name: raw.name,
    latitude: raw.latitude,
    longitude: raw.longitude,
    country: raw.country,
    admin1: raw.admin1,
    timezone: raw.timezone,
  };
}
