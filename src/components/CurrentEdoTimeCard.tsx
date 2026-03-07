import { getSegmentLabel } from "../lib/labels";
import { formatInTimeZone, formatRelativeDuration } from "../lib/time";
import type { EdoSchedule, Language, LocationSelection } from "../types";

type CurrentEdoTimeCardProps = {
  schedule: EdoSchedule | null;
  location: LocationSelection | null;
  language: Language;
  labels: {
    currentTime: string;
    currentSegment: string;
    nextSegmentIn: string;
    sunrise: string;
    sunset: string;
    nextSunrise: string;
    emptyState: string;
    loading: string;
    lastUpdated: string;
    changeLocation: string;
    selectedLocation: string;
    timezone: string;
    locationCoordinates: string;
  };
  loading: boolean;
  lastUpdated: string | null;
  onChangeLocation: () => void;
};

export function CurrentEdoTimeCard({
  schedule,
  location,
  language,
  labels,
  loading,
  lastUpdated,
  onChangeLocation,
}: CurrentEdoTimeCardProps) {
  if (loading && !schedule) {
    return <section className="panel tall center">{labels.loading}</section>;
  }

  if (!schedule || !location) {
    return <section className="panel tall center">{labels.emptyState}</section>;
  }

  return (
    <section className="panel current-card hero-card">
      <div className="hero-meta">
        <div className="location-compact">
          <span className="location-label">{labels.selectedLocation}</span>
          <strong>{location.name}</strong>
          <span className="muted small">
            {labels.timezone}: {location.timezone}
          </span>
          <span className="muted small">
            {labels.locationCoordinates}: {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
          </span>
        </div>
        <button className="button-secondary subtle-button" onClick={onChangeLocation}>
          {labels.changeLocation}
        </button>
      </div>

      <div className="current-top hero-main">
        <div className="hero-copy">
          <p className="muted eyebrow-line">{labels.currentSegment}</p>
          <h2>{getSegmentLabel(schedule.currentSegment, language)}</h2>
          <p className="hero-subline">
            {labels.currentTime}
            <strong>{schedule.modernTime}</strong>
          </p>
        </div>
        <div className="countdown-block">
          <span>{labels.nextSegmentIn}</span>
          <strong>{formatRelativeDuration(schedule.remainingMs, language)}</strong>
        </div>
      </div>

      <div className="hero-support-grid">
        <div className="stat">
          <span>{labels.sunrise}</span>
          <strong>{formatInTimeZone(schedule.solarTimes.sunrise, location.timezone, language)}</strong>
        </div>
        <div className="stat">
          <span>{labels.sunset}</span>
          <strong>{formatInTimeZone(schedule.solarTimes.sunset, location.timezone, language)}</strong>
        </div>
        <div className="stat">
          <span>{labels.nextSunrise}</span>
          <strong>{formatInTimeZone(schedule.solarTimes.nextSunrise, location.timezone, language)}</strong>
        </div>
      </div>

      {lastUpdated ? (
        <p className="muted small">
          {labels.lastUpdated}: {new Date(lastUpdated).toLocaleString(language)}
        </p>
      ) : null}
    </section>
  );
}
