# Weather App

A small responsive weather app built in a live demo of working with [Cursor](https://cursor.com). It was planned and implemented with Cursor's AI agent, so treat it as a demo rather than production software.

## Features

- Current conditions: temperature, feels-like, humidity, and wind
- 7-day forecast with highs, lows, and precipitation chance
- City search with debounced lookup
- Responsive layout with automatic dark mode
- Loading, empty-search, and error states (with retry)

Weather data comes from [Open-Meteo](https://open-meteo.com), which needs no API key or account. The app starts on Detroit, Michigan.

## Tech stack

- React 19 and TypeScript
- Vite
- Vitest and React Testing Library

## Getting started

You need [Node.js](https://nodejs.org) (LTS recommended), which includes npm.

```sh
npm install
npm run dev
```

Then open the local URL that Vite prints (usually http://localhost:5173).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck and create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

## Project structure

```
src/
  App.tsx                  App state and layout (default location lives here)
  components/              Search, current weather, and forecast components
  services/weather.ts      Open-Meteo geocoding and forecast client
  utils/                   Weather-code labels/icons and formatting helpers
  styles.css               Responsive styles
```

## License

Released under the [MIT License](LICENSE).

## Notes

- Temperatures are shown in Fahrenheit and wind in mph. Change the units in `fetchWeatherReport` in `src/services/weather.ts`.
- To change the starting city, edit `DEFAULT_LOCATION` in `src/App.tsx`.
- Open-Meteo's free API is intended for non-commercial use. Check their [terms](https://open-meteo.com/en/terms) before using this commercially.


## Thanks
Cheers to the hard working people who built these incredible technologies that people like me get to build on, especially the open-source community.

Be good to each other.

Peace.