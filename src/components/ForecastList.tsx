import type { DailyForecast } from '../services/weather';
import { formatWeekday } from '../utils/format';
import { describeWeatherCode } from '../utils/weatherCodes';

interface ForecastListProps {
  days: DailyForecast[];
  temperatureUnit: string;
}

export default function ForecastList({ days, temperatureUnit }: ForecastListProps) {
  return (
    <section className="card" aria-labelledby="forecast-heading">
      <h2 id="forecast-heading">7-day forecast</h2>
      <ol className="forecast-list">
        {days.map((day, index) => {
          const condition = describeWeatherCode(day.weatherCode);
          return (
            <li key={day.date} className="forecast-day">
              <span className="forecast-name">
                {index === 0 ? 'Today' : formatWeekday(day.date)}
              </span>
              <span className="forecast-icon" aria-hidden="true">
                {condition.icon}
              </span>
              <span className="forecast-detail">
                <span className="forecast-label">{condition.label}</span>
                {day.precipitationProbability !== null && (
                  <span className="forecast-precip">
                    {day.precipitationProbability}% precip
                  </span>
                )}
              </span>
              <span className="forecast-temps">
                <strong>
                  {Math.round(day.temperatureMax)}
                  {temperatureUnit}
                </strong>
                <span className="muted">
                  {Math.round(day.temperatureMin)}
                  {temperatureUnit}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
