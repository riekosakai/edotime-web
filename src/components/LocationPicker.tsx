import { useState } from "react";
import { searchLocations } from "../lib/location";
import type { LocationSelection } from "../types";

type LocationPickerProps = {
  labels: {
    title: string;
    useCurrentLocation: string;
    searchLabel: string;
    searchPlaceholder: string;
    searchButton: string;
    latitude: string;
    longitude: string;
    applyCoordinates: string;
    selectedLocation: string;
    timezone: string;
    searchResults: string;
    geolocationHelp: string;
    searchError: string;
  };
  selectedLocation: LocationSelection | null;
  geolocating: boolean;
  onUseCurrentLocation: () => void;
  onSelectLocation: (location: LocationSelection) => void | Promise<void>;
  onApplyCoordinates: (latitude: number, longitude: number) => void | Promise<void>;
};

export function LocationPicker({
  labels,
  selectedLocation,
  geolocating,
  onUseCurrentLocation,
  onSelectLocation,
  onApplyCoordinates,
}: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationSelection[]>([]);
  const [searchError, setSearchError] = useState(false);
  const [latitude, setLatitude] = useState(String(selectedLocation?.latitude ?? 35.6764));
  const [longitude, setLongitude] = useState(String(selectedLocation?.longitude ?? 139.65));

  async function handleSearch() {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setSearchError(false);
      setResults(await searchLocations(query.trim()));
    } catch {
      setSearchError(true);
    }
  }

  return (
    <section className="location-picker-body">
      <div className="panel-header">
        <h2>{labels.title}</h2>
        <button className="button-primary" onClick={onUseCurrentLocation} disabled={geolocating}>
          {labels.useCurrentLocation}
        </button>
      </div>
      <p className="muted">{labels.geolocationHelp}</p>

      <div className="search-row">
        <label className="field grow">
          <span>{labels.searchLabel}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleSearch();
              }
            }}
            placeholder={labels.searchPlaceholder}
          />
        </label>
        <button className="button-secondary" onClick={() => void handleSearch()}>
          {labels.searchButton}
        </button>
      </div>

      {searchError ? <p className="error">{labels.searchError}</p> : null}
      {results.length > 0 ? (
        <div className="result-list">
          <p className="muted strong">{labels.searchResults}</p>
          {results.map((result) => (
            <button key={`${result.latitude}-${result.longitude}`} className="result-item" onClick={() => void onSelectLocation(result)}>
              <strong>{result.name}</strong>
              <span>{result.timezone}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="coords-grid">
        <label className="field">
          <span>{labels.latitude}</span>
          <input type="number" step="0.0001" value={latitude} onChange={(event) => setLatitude(event.target.value)} />
        </label>
        <label className="field">
          <span>{labels.longitude}</span>
          <input type="number" step="0.0001" value={longitude} onChange={(event) => setLongitude(event.target.value)} />
        </label>
      </div>
      <button
        className="button-secondary"
        onClick={() => void onApplyCoordinates(Number(latitude), Number(longitude))}
      >
        {labels.applyCoordinates}
      </button>

      {selectedLocation ? (
        <div className="selected-card">
          <strong>{selectedLocation.name}</strong>
          <span>
            {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
          </span>
          <span>
            {labels.timezone}: {selectedLocation.timezone}
          </span>
        </div>
      ) : null}
    </section>
  );
}
