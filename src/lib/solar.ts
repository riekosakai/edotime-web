import { getTimeZoneDateString } from "./time";
import type { LocationSelection, SolarDayTimes, SolarTimes } from "../types";

type OpenMeteoResponse = {
  timezone: string;
  daily: {
    sunrise: number[];
    sunset: number[];
    time: string[];
  };
};

export type SolarCache = Record<string, SolarDayTimes>;

export async function fetchSolarRange(
  location: LocationSelection,
  baseDate: Date,
): Promise<SolarCache> {
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
  if (!data.daily.time?.length || !data.daily.sunrise?.length || !data.daily.sunset?.length) {
    throw new Error("Solar data missing");
  }

  const cache: SolarCache = {};
  for (let index = 0; index < data.daily.time.length; index += 1) {
    const dateKey = data.daily.time[index];
    const sunrise = data.daily.sunrise[index];
    const sunset = data.daily.sunset[index];

    if (!dateKey || !sunrise || !sunset) {
      continue;
    }

    cache[dateKey] = {
      dateKey,
      sunrise: new Date(sunrise * 1000),
      sunset: new Date(sunset * 1000),
    };
  }

  return cache;
}

export function getRequiredSolarDateKeys(now: Date, timeZone: string) {
  const current = getTimeZoneDateString(now, timeZone);
  const yesterday = getTimeZoneDateString(new Date(now.getTime() - 24 * 60 * 60 * 1000), timeZone);
  const tomorrow = getTimeZoneDateString(new Date(now.getTime() + 24 * 60 * 60 * 1000), timeZone);

  return { yesterday, current, tomorrow };
}

export function resolveSolarTimes(
  now: Date,
  timeZone: string,
  cache: SolarCache,
): SolarTimes | null {
  const { yesterday, current, tomorrow } = getRequiredSolarDateKeys(now, timeZone);
  const yesterdayDay = cache[yesterday];
  const todayDay = cache[current];
  const tomorrowDay = cache[tomorrow];

  // 深夜〜日の出前は「前日の日の出・日の入り → 今日の日の出」で計算できる。
  // tomorrowDay は不要なので、日付跨ぎ直後にキャッシュになくてもカウントダウンを継続できる。
  if (todayDay && yesterdayDay && now < todayDay.sunrise) {
    return {
      sunrise: yesterdayDay.sunrise,
      sunset: yesterdayDay.sunset,
      nextSunrise: todayDay.sunrise,
    };
  }

  if (!todayDay || !tomorrowDay) {
    return null;
  }

  if (now < todayDay.sunset) {
    return {
      sunrise: todayDay.sunrise,
      sunset: todayDay.sunset,
      nextSunrise: tomorrowDay.sunrise,
    };
  }

  return {
    sunrise: todayDay.sunrise,
    sunset: todayDay.sunset,
    nextSunrise: tomorrowDay.sunrise,
  };
}
