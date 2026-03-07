import { getSegmentLabel } from "../lib/labels";
import { formatInTimeZone } from "../lib/time";
import type { EdoSchedule, Language, LocationSelection } from "../types";

type DetailsSectionProps = {
  schedule: EdoSchedule | null;
  location: LocationSelection | null;
  language: Language;
  labels: {
    detailsTitle: string;
    currentSegment: string;
    sunrise: string;
    sunset: string;
    nextSunrise: string;
    segmentTable: string;
    start: string;
    end: string;
    lastUpdated: string;
  };
  lastUpdated: string | null;
};

export function DetailsSection({
  schedule,
  location,
  language,
  labels,
  lastUpdated,
}: DetailsSectionProps) {
  if (!schedule || !location) {
    return null;
  }

  return (
    <details className="panel details-panel">
      <summary>{labels.detailsTitle}</summary>

      <div className="details-grid">
        <div className="detail-stat">
          <span>{labels.sunrise}</span>
          <strong>{formatInTimeZone(schedule.solarTimes.sunrise, location.timezone, language)}</strong>
        </div>
        <div className="detail-stat">
          <span>{labels.sunset}</span>
          <strong>{formatInTimeZone(schedule.solarTimes.sunset, location.timezone, language)}</strong>
        </div>
        <div className="detail-stat">
          <span>{labels.nextSunrise}</span>
          <strong>{formatInTimeZone(schedule.solarTimes.nextSunrise, location.timezone, language)}</strong>
        </div>
        {lastUpdated ? (
          <div className="detail-stat">
            <span>{labels.lastUpdated}</span>
            <strong>{new Date(lastUpdated).toLocaleString(language)}</strong>
          </div>
        ) : null}
      </div>

      <div className="segment-table-wrap">
        <h3>{labels.segmentTable}</h3>
        <table className="segment-table">
          <thead>
            <tr>
              <th>{labels.currentSegment ?? ""}</th>
              <th>{labels.start}</th>
              <th>{labels.end}</th>
            </tr>
          </thead>
          <tbody>
            {schedule.segments.map((segment) => (
              <tr key={segment.id} className={segment.isCurrent ? "is-current" : ""}>
                <td>{getSegmentLabel(segment, language)}</td>
                <td>{formatInTimeZone(segment.start, location.timezone, language)}</td>
                <td>{formatInTimeZone(segment.end, location.timezone, language)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
