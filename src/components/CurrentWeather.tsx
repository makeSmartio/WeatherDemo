import type { WeatherReport } from '../services/weather';
import { describeWeatherCode } from '../utils/weatherCodes';
import { formatLocationName } from '../utils/format';

interface CurrentWeatherProps {
  report: WeatherReport;
}

export default function CurrentWeather({ report }: CurrentWeatherProps) {
  const { location, current, units } = report;
  const condition = describeWeatherCode(current.weatherCode);

  return (
    <section className="card current-weather" aria-labelledby="current-heading">
      <h2 id="current-heading">{formatLocationName(location)}</h2>

      <div className="current-main">
        <span className="current-icon" aria-hidden="true">
          {condition.icon}
        </span>
        <div>
          <p className="current-temp">
            {Math.round(current.temperature)}
            {units.temperature}
          </p>
          <p className="current-label">{condition.label}</p>
        </div>
      </div>

      <dl className="current-details">
        <div>
          <dt>Feels like</dt>
          <dd>
            {Math.round(current.apparentTemperature)}
            {units.temperature}
          </dd>
        </div>
        <div>
          <dt>Humidity</dt>
          <dd>{current.humidity}%</dd>
        </div>
        <div>
          <dt>Wind</dt>
          <dd>
            {Math.round(current.windSpeed)} {units.wind}
          </dd>
        </div>
      </dl>
    </section>
  );
}
