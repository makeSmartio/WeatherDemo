import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const detroitForecast = {
  current: {
    time: '2026-10-30T16:00',
    temperature_2m: 61.3,
    relative_humidity_2m: 55,
    apparent_temperature: 59.8,
    weather_code: 0,
    wind_speed_10m: 7.2,
  },
  current_units: { temperature_2m: '°F', wind_speed_10m: 'mph' },
  daily: {
    time: ['2026-10-30', '2026-10-31', '2026-11-01'],
    weather_code: [0, 3, 61],
    temperature_2m_max: [63, 58, 54],
    temperature_2m_min: [49, 45, 42],
    precipitation_probability_max: [0, 20, 80],
  },
};

const berlinForecast = {
  ...detroitForecast,
  current: { ...detroitForecast.current, weather_code: 63, temperature_2m: 48.2 },
};

const berlinResult = {
  id: 2950159,
  name: 'Berlin',
  latitude: 52.52437,
  longitude: 13.41053,
  country: 'Germany',
  admin1: 'Berlin',
  timezone: 'Europe/Berlin',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function routeRequests(url: string): Response {
  if (url.includes('geocoding-api')) {
    const query = new URL(url).searchParams.get('name');
    return jsonResponse({
      results: query === 'Berlin' ? [berlinResult] : [],
    });
  }
  if (url.includes('latitude=52.52')) {
    return jsonResponse(berlinForecast);
  }
  return jsonResponse(detroitForecast);
}

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => routeRequests(String(input))),
    );
  });

  it('shows the default city with current conditions and a seven-day forecast', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: /Detroit/ })).toBeInTheDocument();
    const current = screen.getByRole('region', { name: /Detroit/ });
    expect(within(current).getByText('Clear sky')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '7-day forecast' })).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('80% precip')).toBeInTheDocument();
  });

  it('searches for a city and loads its weather after selection', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: /Detroit/ });

    fireEvent.change(screen.getByLabelText('Search for a city'), {
      target: { value: 'Berlin' },
    });

    const option = await screen.findByRole('button', { name: 'Berlin, Germany' });
    fireEvent.click(option);

    expect(await screen.findByRole('heading', { name: /Berlin/ })).toBeInTheDocument();
    expect(await screen.findByText('Moderate rain')).toBeInTheDocument();
  });

  it('reports when a search has no matching cities', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: /Detroit/ });

    fireEvent.change(screen.getByLabelText('Search for a city'), {
      target: { value: 'Nowhereville' },
    });

    expect(await screen.findByText('No matching cities found.')).toBeInTheDocument();
  });

  it('shows an error with a retry option when the forecast fails', async () => {
    let failing = true;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        if (failing && String(input).includes('api.open-meteo.com')) {
          return jsonResponse({}, 500);
        }
        return routeRequests(String(input));
      }),
    );

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/status 500/);

    failing = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: /Detroit/ })).toBeInTheDocument();
  });

  it('shows a loading message while the first request is pending', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));

    render(<App />);

    await waitFor(() =>
      expect(screen.getByText('Loading weather for Detroit...')).toBeInTheDocument(),
    );
  });
});
