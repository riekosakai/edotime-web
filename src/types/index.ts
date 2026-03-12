export type Language = "ja" | "en";

export type LocationSelection = {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

export type SolarTimes = {
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
};

export type SolarDayTimes = {
  dateKey: string;
  sunrise: Date;
  sunset: Date;
};

export type EdoSegment = {
  id: string;
  kind: "day" | "night";
  index: 1 | 2 | 3 | 4 | 5 | 6;
  labelJa: string;
  labelEn: string;
  start: Date;
  end: Date;
  isCurrent: boolean;
};

export type EdoSchedule = {
  now: Date;
  modernTime: string;
  solarTimes: SolarTimes;
  segments: EdoSegment[];
  currentSegment: EdoSegment;
  nextSegmentStartsAt: Date;
  remainingMs: number;
};

export type AppState = {
  location: LocationSelection;
  schedule: EdoSchedule;
  fetchedAt: string;
};
