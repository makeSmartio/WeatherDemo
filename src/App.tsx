import { useEffect, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import LocationSearch from './components/LocationSearch';
import {
  fetchWeatherReport,
  getErrorMessage,
  isAbortError,
  type Location,
  type WeatherReport,
} from './services/weather';

export const DEFAULT_LOCATION: Location = {
  id: 4990729,
  name: 'Detroit',
  latitude: 42.33143,
  longitude: -83.04575,
  country: 'United States',
  admin1: 'Michigan',
  timezone: 'America/Detroit',
};

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; report: WeatherReport }
  | { status: 'error'; message: string };

export default function App() {
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });

    fetchWeatherReport(location, { signal: controller.signal })
      .then((report) => setState({ status: 'ready', report }))
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        setState({ status: 'error', message: getErrorMessage(error) });
      });

    return () => controller.abort();
  }, [location, attempt]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Weather</h1>
        <LocationSearch onSelect={setLocation} />
      </header>

      <main className="app-main">
        {state.status === 'loading' && (
          <p role="status" className="muted">
            Loading weather for {location.name}...
          </p>
        )}

        {state.status === 'error' && (
          <div role="alert" className="card error-panel">
            <p>{state.message}</p>
            <button type="button" onClick={() => setAttempt((count) => count + 1)}>
              Try again
            </button>
          </div>
        )}

        {state.status === 'ready' && (
          <>
            <CurrentWeather report={state.report} />
            <ForecastList
              days={state.report.daily}
              temperatureUnit={state.report.units.temperature}
            />
          </>
        )}
      </main>
    </div>
  );
}
