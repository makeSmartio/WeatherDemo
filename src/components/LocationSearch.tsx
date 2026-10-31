import { useEffect, useId, useState } from 'react';
import {
  getErrorMessage,
  isAbortError,
  searchLocations,
  type Location,
} from '../services/weather';
import { formatLocationName } from '../utils/format';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

interface LocationSearchProps {
  onSelect: (location: Location) => void;
}

export default function LocationSearch({ onSelect }: LocationSearchProps) {
  const inputId = useId();
  const statusId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError(null);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);

    const timer = window.setTimeout(() => {
      searchLocations(trimmed, { signal: controller.signal })
        .then((found) => {
          setResults(found);
          setError(null);
          setIsSearching(false);
        })
        .catch((err: unknown) => {
          if (isAbortError(err)) return;
          setResults([]);
          setError(getErrorMessage(err));
          setIsSearching(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const showEmptyMessage =
    !isSearching &&
    !error &&
    query.trim().length >= MIN_QUERY_LENGTH &&
    results.length === 0;

  function handleSelect(location: Location) {
    setQuery('');
    onSelect(location);
  }

  return (
    <div className="location-search">
      <label htmlFor={inputId}>Search for a city</label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="e.g. Berlin"
        autoComplete="off"
        aria-describedby={statusId}
      />
      <div id={statusId} role="status" aria-live="polite" className="muted">
        {isSearching ? 'Searching...' : showEmptyMessage ? 'No matching cities found.' : ''}
      </div>
      {error && <p role="alert" className="error-text">{error}</p>}
      {results.length > 0 && (
        <ul className="search-results" aria-label="Matching cities">
          {results.map((location) => (
            <li key={location.id}>
              <button type="button" onClick={() => handleSelect(location)}>
                {formatLocationName(location)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
