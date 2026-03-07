import { getSegmentLabel } from "../lib/labels";
import { formatInTimeZone } from "../lib/time";
import type { EdoSchedule, Language, LocationSelection } from "../types";

type TimelineProps = {
  schedule: EdoSchedule | null;
  location: LocationSelection | null;
  language: Language;
  title: string;
  description: string;
  nowLabel: string;
  sunriseLabel: string;
  sunsetLabel: string;
  dayLabel: string;
  nightLabel: string;
};

export function Timeline({
  schedule,
  location,
  language,
  title,
  description,
  nowLabel,
  sunriseLabel,
  sunsetLabel,
  dayLabel,
  nightLabel,
}: TimelineProps) {
  if (!schedule || !location) {
    return null;
  }

  const start = schedule.segments[0].start.getTime();
  const end = schedule.segments[schedule.segments.length - 1].end.getTime();
  const total = end - start;
  const nowOffset = clampPercent(((schedule.now.getTime() - start) / total) * 100);
  const sunriseOffset = clampPercent(((schedule.solarTimes.sunrise.getTime() - start) / total) * 100);
  const sunsetOffset = clampPercent(((schedule.solarTimes.sunset.getTime() - start) / total) * 100);

  return (
    <section className="panel timeline-panel">
      <div className="panel-header timeline-header">
        <div>
          <h2>{title}</h2>
          <p className="muted">{description}</p>
        </div>
        <div className="timeline-legend" aria-hidden="true">
          <span className="legend-chip day-chip">{dayLabel}</span>
          <span className="legend-chip night-chip">{nightLabel}</span>
        </div>
      </div>

      <div className="visual-timeline">
        <div className="timeline-track" aria-label={title}>
          {schedule.segments.map((segment) => {
            const duration = segment.end.getTime() - segment.start.getTime();
            return (
              <div
                key={segment.id}
                className={`segment-block ${segment.kind} ${segment.isCurrent ? "is-current" : ""}`}
                style={{ flexGrow: duration }}
                title={`${getSegmentLabel(segment, language)} ${formatInTimeZone(segment.start, location.timezone, language)} - ${formatInTimeZone(segment.end, location.timezone, language)}`}
              >
                <span>{segment.index}</span>
              </div>
            );
          })}

          <Marker className="now-marker" left={nowOffset} label={nowLabel} />
          <Marker className="sunrise-marker" left={sunriseOffset} label={sunriseLabel} />
          <Marker className="sunset-marker" left={sunsetOffset} label={sunsetLabel} />
        </div>

        <div className="marker-label-row">
          <span style={{ left: `${sunriseOffset}%` }}>
            {sunriseLabel} {formatInTimeZone(schedule.solarTimes.sunrise, location.timezone, language)}
          </span>
          <span style={{ left: `${sunsetOffset}%` }}>
            {sunsetLabel} {formatInTimeZone(schedule.solarTimes.sunset, location.timezone, language)}
          </span>
          <span className="now-readout" style={{ left: `${nowOffset}%` }}>
            {nowLabel} {schedule.modernTime}
          </span>
        </div>

        <div className="timeline-current-readout">
          <strong>{getSegmentLabel(schedule.currentSegment, language)}</strong>
          <span>
            {formatInTimeZone(schedule.currentSegment.start, location.timezone, language)} -{" "}
            {formatInTimeZone(schedule.currentSegment.end, location.timezone, language)}
          </span>
        </div>
      </div>
    </section>
  );
}

function Marker({ left, label, className }: { left: number; label: string; className: string }) {
  return (
    <div className={`timeline-marker ${className}`} style={{ left: `${left}%` }} aria-label={label}>
      <span>{label}</span>
    </div>
  );
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}
