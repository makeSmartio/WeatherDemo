import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWeatherReport,
  getErrorMessage,
  searchLocations,
  transformForecast,
  WeatherApiError,
  type Location,
} from './weather';

const berlin: Location = {
  id: 2950159,
  name: 'Berlin',
  latitude: 52.52437,
  longitude: 13.41053,
  country: 'Germany',
  admin1: 'Berlin',
  timezone: 'Europe/Berlin',
};

const rawForecast = {
  current: {
    time: '2026-10-30T16:00',
    temperature_2m: 58.4,
    relative_humidity_2m: 72,
    apparent_temperature: 55.1,
    weather_code: 2,
    wind_speed_10m: 9.6,
  },
  current_units: {
    temperature_2m: '°F',
    wind_speed_10m: 'mph',
  },
  daily: {
    time: ['2026-10-30', '2026-10-31'],
    weather_code: [2, 61],
    temperature_2m_max: [60.2, 55.9],
    temperature_2m_min: [48.1, 44.6],
    precipitation_probability_max: [10, null],
  },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('transformForecast', () => {
  it('maps the Open-Meteo payload into the app report shape', () => {
    const report = transformForecast(berlin, rawForecast);

    expect(report.location).toEqual(berlin);
    expect(report.current).toEqual({
      time: '2026-10-30T16:00',
      temperature: 58.4,
      apparentTemperature: 55.1,
      humidity: 72,
      windSpeed: 9.6,
      weatherCode: 2,
    });
    expect(report.units).toEqual({ temperature: '°F', wind: 'mph' });
    expect(report.daily).toEqual([
      {
        date: '2026-10-30',
        weatherCode: 2,
        temperatureMax: 60.2,
        temperatureMin: 48.1,
        precipitationProbability: 10,
      },
      {
        date: '2026-10-31',
        weatherCode: 61,
        temperatureMax: 55.9,
        temperatureMin: 44.6,
        precipitationProbability: null,
      },
    ]);
  });

  it('fills in null precipitation when the field is missing', () => {
    const { precipitation_probability_max: _omitted, ...daily } = rawForecast.daily;
    const report = transformForecast(berlin, { ...rawForecast, daily });

    expect(report.daily.every((day) => day.precipitationProbability === null)).toBe(true);
  });
});

describe('searchLocations', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('skips the request for queries shorter than two characters', async () => {
    await expect(searchLocations(' b ')).resolves.toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns mapped locations from the geocoding API', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        results: [{ ...berlin, extra_field: 'ignored' }],
      }),
    );

    const results = await searchLocations('Berlin');

    expect(results).toEqual([berlin]);
    const requested = new URL(String(vi.mocked(fetch).mock.calls[0][0]));
    expect(requested.searchParams.get('name')).toBe('Berlin');
  });

  it('returns an empty list when the API has no matches', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}));

    await expect(searchLocations('zzzzqqq')).resolves.toEqual([]);
  });

  it('throws WeatherApiError for non-OK responses', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}, 500));

    await expect(searchLocations('Berlin')).rejects.toMatchObject({
      name: 'WeatherApiError',
      status: 500,
    });
  });
});

describe('fetchWeatherReport', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests a seven-day forecast and returns a report', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(rawForecast));

    const report = await fetchWeatherReport(berlin);

    expect(report.daily).toHaveLength(2);
    const requested = new URL(String(vi.mocked(fetch).mock.calls[0][0]));
    expect(requested.searchParams.get('latitude')).toBe(String(berlin.latitude));
    expect(requested.searchParams.get('forecast_days')).toBe('7');
    expect(requested.searchParams.get('timezone')).toBe('auto');
  });

  it('passes the abort signal through to fetch', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(rawForecast));
    const controller = new AbortController();

    await fetchWeatherReport(berlin, { signal: controller.signal });

    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({
      signal: controller.signal,
    });
  });

  it('throws WeatherApiError when the forecast request fails', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}, 503));

    await expect(fetchWeatherReport(berlin)).rejects.toBeInstanceOf(WeatherApiError);
  });
});

describe('getErrorMessage', () => {
  it('explains API failures', () => {
    const message = getErrorMessage(new WeatherApiError('Service down.', 503));
    expect(message).toContain('Service down.');
  });

  it('explains network failures', () => {
    expect(getErrorMessage(new TypeError('Failed to fetch'))).toMatch(/network/i);
  });

  it('falls back to a generic message', () => {
    expect(getErrorMessage('unexpected')).toMatch(/something went wrong/i);
  });
});
