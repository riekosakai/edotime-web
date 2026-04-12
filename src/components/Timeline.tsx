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

type Anchor = "start" | "center" | "end";

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
        <div className="timeline-plot" aria-label={title}>
          <div className="timeline-track">
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
          </div>

          <div className="timeline-overlay" aria-hidden="true">
            <Marker
              className="sunrise-marker"
              left={sunriseOffset}
              label={`${sunriseLabel} ${formatInTimeZone(schedule.solarTimes.sunrise, location.timezone, language)}`}
              anchor={getAnchor(sunriseOffset)}
              placement="top"
            />
            <Marker
              className="sunset-marker"
              left={sunsetOffset}
              label={`${sunsetLabel} ${formatInTimeZone(schedule.solarTimes.sunset, location.timezone, language)}`}
              anchor={getAnchor(sunsetOffset)}
              placement="top"
            />
            <Marker
              className="now-marker"
              left={nowOffset}
              label={`${nowLabel} ${schedule.modernTime}`}
              anchor={getAnchor(nowOffset)}
              placement="bottom"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Marker({
  left,
  label,
  className,
  anchor,
  placement,
}: {
  left: number;
  label: string;
  className: string;
  anchor: Anchor;
  placement: "top" | "bottom";
}) {
  return (
    <div className={`timeline-marker ${className}`} style={{ left: `${left}%` }} aria-label={label}>
      <span className={`timeline-marker-label ${placement}`} data-anchor={anchor}>
        {label}
      </span>
    </div>
  );
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

function getAnchor(offset: number): Anchor {
  if (offset <= 12) {
    return "start";
  }
  if (offset >= 88) {
    return "end";
  }
  return "center";
}
