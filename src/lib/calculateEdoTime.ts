import type { EdoSchedule, EdoSegment, SolarTimes } from "../types";

function makeSegment(
  kind: "day" | "night",
  index: 1 | 2 | 3 | 4 | 5 | 6,
  start: Date,
  end: Date,
  now: Date,
): EdoSegment {
  return {
    id: `${kind}-${index}`,
    kind,
    index,
    labelJa: kind === "day" ? `昼${index}刻` : `夜${index}刻`,
    labelEn: kind === "day" ? `Day ${index}` : `Night ${index}`,
    start,
    end,
    isCurrent: now >= start && now < end,
  };
}

function splitRange(
  kind: "day" | "night",
  start: Date,
  end: Date,
  now: Date,
): EdoSegment[] {
  const span = end.getTime() - start.getTime();
  const unit = span / 6;

  return Array.from({ length: 6 }, (_, idx) => {
    const segmentStart = new Date(start.getTime() + unit * idx);
    const segmentEnd = idx === 5 ? end : new Date(start.getTime() + unit * (idx + 1));
    return makeSegment(kind, (idx + 1) as 1 | 2 | 3 | 4 | 5 | 6, segmentStart, segmentEnd, now);
  });
}

export function calculateEdoTime(now: Date, solarTimes: SolarTimes, modernTime: string): EdoSchedule {
  const daySegments = splitRange("day", solarTimes.sunrise, solarTimes.sunset, now);
  const nightSegments = splitRange("night", solarTimes.sunset, solarTimes.nextSunrise, now);
  const segments = [...daySegments, ...nightSegments];
  const currentSegment = segments.find((segment) => now >= segment.start && now < segment.end) ?? segments[0];
  const nextSegmentStartsAt = currentSegment.end;
  const remainingMs = Math.max(0, nextSegmentStartsAt.getTime() - now.getTime());

  return {
    now,
    modernTime,
    solarTimes,
    segments,
    currentSegment,
    nextSegmentStartsAt,
    remainingMs,
  };
}
