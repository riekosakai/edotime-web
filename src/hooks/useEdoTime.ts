import { useEffect, useRef, useState } from "react";
import { calculateEdoTime } from "../lib/calculateEdoTime";
import { reverseGeocode, fetchTimezone } from "../lib/location";
import { fetchSolarTimes } from "../lib/solar";
import { formatInTimeZone } from "../lib/time";
import { loadCachedState, saveCachedState } from "../lib/storage";
import type { AppState, EdoSchedule, LocationSelection, Language } from "../types";

type UseEdoTimeState = {
  location: LocationSelection | null;
  schedule: EdoSchedule | null;
  loading: boolean;
  error: string | null;
  usingOfflineFallback: boolean;
  lastUpdated: string | null;
};

const DEFAULT_COORDINATE_LOCATION = {
  name: "Custom location",
  latitude: 35.6764,
  longitude: 139.65,
  timezone: "Asia/Tokyo",
} satisfies LocationSelection;

export function useEdoTime(language: Language) {
  const cached = typeof window === "undefined" ? null : loadCachedState();
  const [state, setState] = useState<UseEdoTimeState>(() => hydrateCachedState(cached, language));
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!state.location || !state.schedule) {
      return;
    }

    timerRef.current = window.setInterval(() => {
      const now = new Date();
      const modernTime = formatInTimeZone(now, state.location!.timezone, language);
      setState((current) => {
        if (!current.schedule || !current.location) {
          return current;
        }
        return {
          ...current,
          schedule: calculateEdoTime(now, current.schedule.solarTimes, modernTime),
        };
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [language, state.location, state.schedule?.solarTimes]);

  async function refresh(location: LocationSelection) {
    setState((current) => ({ ...current, location, loading: true, error: null, usingOfflineFallback: false }));

    try {
      const now = new Date();
      const solarTimes = await fetchSolarTimes(location, now);
      const modernTime = formatInTimeZone(now, location.timezone, language);
      const schedule = calculateEdoTime(now, solarTimes, modernTime);
      const nextState: AppState = {
        location,
        schedule,
        fetchedAt: new Date().toISOString(),
      };
      saveCachedState(nextState);
      setState({
        location,
        schedule,
        loading: false,
        error: null,
        usingOfflineFallback: false,
        lastUpdated: nextState.fetchedAt,
      });
    } catch {
      const fallback = loadCachedState();
      if (fallback) {
        setState(hydrateCachedState(fallback, language, true));
      } else {
        setState((current) => ({
          ...current,
          loading: false,
          error: "solar",
        }));
      }
    }
  }

  async function selectCoordinates(latitude: number, longitude: number, name?: string) {
    const timezone = await fetchTimezone(latitude, longitude);
    const locationName = name ?? (await reverseGeocode(latitude, longitude)) ?? DEFAULT_COORDINATE_LOCATION.name;
    const location = {
      name: locationName,
      latitude,
      longitude,
      timezone,
    };
    await refresh(location);
  }

  return {
    ...state,
    refresh,
    selectCoordinates,
  };
}

function hydrateCachedState(
  cached: AppState | null,
  language: Language,
  usingOfflineFallback = false,
): UseEdoTimeState {
  if (!cached) {
    return {
      location: null,
      schedule: null,
      loading: false,
      error: null,
      usingOfflineFallback: false,
      lastUpdated: null,
    };
  }

  const location = cached.location;
  const now = new Date();
  const solarTimes = {
    sunrise: new Date(cached.schedule.solarTimes.sunrise),
    sunset: new Date(cached.schedule.solarTimes.sunset),
    nextSunrise: new Date(cached.schedule.solarTimes.nextSunrise),
  };
  const modernTime = formatInTimeZone(now, location.timezone, language);

  return {
    location,
    schedule: calculateEdoTime(now, solarTimes, modernTime),
    loading: false,
    error: null,
    usingOfflineFallback,
    lastUpdated: cached.fetchedAt,
  };
}
