import { useEffect, useRef, useState } from "react";
import { CurrentEdoTimeCard } from "./components/CurrentEdoTimeCard";
import { DetailsSection } from "./components/DetailsSection";
import { Header } from "./components/Header";
import { InfoSection } from "./components/InfoSection";
import { LocationPicker } from "./components/LocationPicker";
import { Timeline } from "./components/Timeline";
import { getMessages } from "./i18n";
import { saveLanguage, loadLanguage } from "./lib/storage";
import { useEdoTime } from "./hooks/useEdoTime";
import { useGeolocation } from "./hooks/useGeolocation";
import type { Language } from "./types";

function App() {
  const [language, setLanguage] = useState<Language>(() => loadLanguage());
  const [locationEditorOpen, setLocationEditorOpen] = useState(false);
  const locationDisclosureRef = useRef<HTMLDivElement>(null);
  const dict = getMessages(language);
  const { loading: geolocating, error: geolocationError, getCurrentPosition } = useGeolocation();
  const { location, schedule, loading, error, usingOfflineFallback, lastUpdated, refresh, selectCoordinates } =
    useEdoTime(language);

  useEffect(() => {
    saveLanguage(language);
  }, [language]);

  useEffect(() => {
    if (locationEditorOpen) {
      locationDisclosureRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [locationEditorOpen]);

  async function handleUseCurrentLocation() {
    try {
      const position = await getCurrentPosition();
      await selectCoordinates(
        position.coords.latitude,
        position.coords.longitude,
        dict.currentLocationName,
      );
      setLocationEditorOpen(false);
    } catch {
      // useGeolocation stores a stable error code and the UI keeps manual fallback available.
    }
  }

  return (
    <div className="app-shell">
      <div className="aurora aurora-left" />
      <div className="aurora aurora-right" />
      <main className="app">
        <Header
          language={language}
          onLanguageChange={setLanguage}
          title={dict.appName}
          tagline={dict.tagline}
          languageLabel={dict.language}
        />

        {geolocationError === "denied" ? <p className="banner warning">{dict.locationDenied}</p> : null}
        {geolocationError === "unavailable" ? <p className="banner warning">{dict.locationUnavailable}</p> : null}
        {geolocationError === "timeout" ? <p className="banner warning">{dict.locationTimeout}</p> : null}
        {geolocationError === "unsupported" ? <p className="banner warning">{dict.locationUnsupported}</p> : null}
        {error === "solar" ? <p className="banner error">{dict.solarError}</p> : null}
        {usingOfflineFallback ? <p className="banner info">{dict.offlineFallback}</p> : null}

        <CurrentEdoTimeCard
          schedule={schedule}
          location={location}
          language={language}
          labels={{
            currentTime: dict.currentTime,
            currentSegment: dict.currentSegment,
            nextSegmentIn: dict.nextSegmentIn,
            sunrise: dict.sunrise,
            sunset: dict.sunset,
            nextSunrise: dict.nextSunrise,
            emptyState: dict.emptyState,
            loading: dict.loading,
            lastUpdated: dict.lastUpdated,
            changeLocation: dict.changeLocation,
            selectedLocation: dict.selectedLocation,
            timezone: dict.timezone,
            locationCoordinates: dict.locationCoordinates,
          }}
          loading={loading}
          lastUpdated={lastUpdated}
          onChangeLocation={() => setLocationEditorOpen((open) => !open)}
        />

        <Timeline
          schedule={schedule}
          location={location}
          language={language}
          title={dict.timeline}
          description={dict.timelineDescription}
          nowLabel={dict.now}
          sunriseLabel={dict.sunrise}
          sunsetLabel={dict.sunset}
          dayLabel={dict.day}
          nightLabel={dict.night}
        />

        <div ref={locationDisclosureRef} className="panel location-disclosure">
          <button
            type="button"
            className="location-disclosure-trigger"
            aria-expanded={locationEditorOpen}
            onClick={() => setLocationEditorOpen((open) => !open)}
          >
            {dict.changeLocation}
          </button>
          {locationEditorOpen && (
            <LocationPicker
              labels={{
                title: dict.locationSectionTitle,
                useCurrentLocation: geolocating ? dict.locating : dict.useCurrentLocation,
                searchLabel: dict.locationSearchLabel,
                searchPlaceholder: dict.locationSearchPlaceholder,
                searchButton: dict.searchButton,
                latitude: dict.latitude,
                longitude: dict.longitude,
                applyCoordinates: dict.applyCoordinates,
                selectedLocation: dict.selectedLocation,
                timezone: dict.timezone,
                searchResults: dict.searchResults,
                geolocationHelp: dict.geolocationHelp,
                searchError: dict.searchError,
              }}
              selectedLocation={location}
              geolocating={geolocating}
              onUseCurrentLocation={() => void handleUseCurrentLocation()}
              onSelectLocation={async (selected) => {
                await refresh(selected);
                setLocationEditorOpen(false);
              }}
              onApplyCoordinates={async (latitude, longitude) => {
                await selectCoordinates(latitude, longitude);
                setLocationEditorOpen(false);
              }}
            />
          )}
        </div>

        <DetailsSection
          schedule={schedule}
          location={location}
          language={language}
          labels={{
            detailsTitle: dict.detailsTitle,
            currentSegment: dict.currentSegment,
            sunrise: dict.sunrise,
            sunset: dict.sunset,
            nextSunrise: dict.nextSunrise,
            segmentTable: dict.segmentTable,
            start: dict.start,
            end: dict.end,
            lastUpdated: dict.lastUpdated,
          }}
          lastUpdated={lastUpdated}
        />

        <InfoSection
          title={dict.explanationTitle}
          paragraph1={dict.explanationBody}
          paragraph2={dict.explanationBody2}
        />
      </main>
    </div>
  );
}

export default App;
