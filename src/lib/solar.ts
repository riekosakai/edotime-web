import { getTimeZoneDateString } from "./time";
import type { LocationSelection, SolarTimes } from "../types";

type OpenMeteoResponse = {
  timezone: string;
  daily: {
    sunrise: number[];
    sunset: number[];
  };
};

export async function fetchSolarTimes(
  location: LocationSelection,
  baseDate: Date,
): Promise<SolarTimes> {
  const yesterdayDate = new Date(baseDate.getTime() - 24 * 60 * 60 * 1000);
  const tomorrowDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = getTimeZoneDateString(yesterdayDate, location.timezone);
  const tomorrow = getTimeZoneDateString(tomorrowDate, location.timezone);

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    daily: "sunrise,sunset",
    timezone: location.timezone,
    timeformat: "unixtime",
    start_date: yesterday,
    end_date: tomorrow,
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to load solar times");
  }

  const data = (await response.json()) as OpenMeteoResponse;
  if (
    !data.daily.sunrise?.[0] ||
    !data.daily.sunrise?.[1] ||
    !data.daily.sunrise?.[2] ||
    !data.daily.sunset?.[0] ||
    !data.daily.sunset?.[1]
  ) {
    throw new Error("Solar data missing");
  }

  const yesterdaySunrise = new Date(data.daily.sunrise[0] * 1000);
  const yesterdaySunset = new Date(data.daily.sunset[0] * 1000);
  const todaySunrise = new Date(data.daily.sunrise[1] * 1000);
  const todaySunset = new Date(data.daily.sunset[1] * 1000);
  const tomorrowSunrise = new Date(data.daily.sunrise[2] * 1000);

  if (baseDate < todaySunrise) {
    return {
      sunrise: yesterdaySunrise,
      sunset: yesterdaySunset,
      nextSunrise: todaySunrise,
    };
  }

  return {
    sunrise: todaySunrise,
    sunset: todaySunset,
    nextSunrise: tomorrowSunrise,
  };
}
