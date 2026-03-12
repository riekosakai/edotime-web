import { useEffect, useRef, useState } from "react";
import { calculateEdoTime } from "../lib/calculateEdoTime";
import { reverseGeocode, fetchTimezone } from "../lib/location";
import { fetchSolarRange, getRequiredSolarDateKeys, resolveSolarTimes, type SolarCache } from "../lib/solar";
import { formatInTimeZone } from "../lib/time";
import { loadCachedState, saveCachedState } from "../lib/storage";
import type { AppState, EdoSchedule, LocationSelection, Language } from "../types";

type UseEdoTimeState = {
  location: LocationSelection | null;
  schedule: EdoSchedule | null;
  solarCache: SolarCache;
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
  const cacheRef = useRef<SolarCache>(state.solarCache);
  const locationRef = useRef<LocationSelection | null>(state.location);
  const inFlightRef = useRef<Set<string>>(new Set());
  const lastFetchAtRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    cacheRef.current = state.solarCache;
    locationRef.current = state.location;
  }, [state.location, state.solarCache]);

  useEffect(() => {
    if (!state.location) {
      return;
    }

    void ensureSolarCache(state.location, new Date(), { showLoading: false });
  }, [language, state.location]);

  useEffect(() => {
    if (!state.location) {
      return;
    }

    timerRef.current = window.setInterval(() => {
      const location = locationRef.current;
      if (!location) {
        return;
      }

      const now = new Date();
      const requiredDates = getRequiredSolarDateKeys(now, location.timezone);
      const hasAllDates =
        Boolean(cacheRef.current[requiredDates.yesterday]) &&
        Boolean(cacheRef.current[requiredDates.current]) &&
        Boolean(cacheRef.current[requiredDates.tomorrow]);

      if (!hasAllDates) {
        void ensureSolarCache(location, now, { showLoading: false });
      }

      setState((current) => {
        if (!current.location) {
          return current;
        }

        const schedule = buildSchedule(now, current.location, language, cacheRef.current);
        if (!schedule) {
          return current;
        }

        return {
          ...current,
          schedule,
        };
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [language, state.location]);

  async function refresh(location: LocationSelection) {
    cacheRef.current = {};
    setState((current) => ({
      ...current,
      location,
      schedule:
        current.location?.timezone === location.timezone &&
        current.location?.latitude === location.latitude &&
        current.location?.longitude === location.longitude
          ? current.schedule
          : null,
      solarCache: {},
    }));
    await ensureSolarCache(location, new Date(), { force: true, showLoading: true });
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

  async function ensureSolarCache(
    location: LocationSelection,
    baseDate: Date,
    options: { force?: boolean; showLoading?: boolean },
  ) {
    const requiredDates = getRequiredSolarDateKeys(baseDate, location.timezone);
    const fetchKey = `${location.latitude}:${location.longitude}:${location.timezone}:${requiredDates.current}`;
    const cache = cacheRef.current;
    const hasAllDates =
      Boolean(cache[requiredDates.yesterday]) &&
      Boolean(cache[requiredDates.current]) &&
      Boolean(cache[requiredDates.tomorrow]);

    if (hasAllDates && !options.force) {
      const schedule = buildSchedule(new Date(), location, language, cache);
      if (schedule) {
        setState((current) => ({
          ...current,
          location,
          schedule,
          loading: false,
          error: null,
        }));
      }
      return;
    }

    const lastFetchAt = lastFetchAtRef.current.get(fetchKey) ?? 0;
    if (!options.force && Date.now() - lastFetchAt < 60_000) {
      return;
    }

    if (inFlightRef.current.has(fetchKey)) {
      return;
    }

    lastFetchAtRef.current.set(fetchKey, Date.now());
    inFlightRef.current.add(fetchKey);

    if (options.showLoading) {
      setState((current) => ({
        ...current,
        location,
        loading: true,
        error: null,
        usingOfflineFallback: false,
      }));
    }

    try {
      const fetchedRange = await fetchSolarRange(location, baseDate);
      const mergedCache = { ...cacheRef.current, ...fetchedRange };
      cacheRef.current = mergedCache;

      const now = new Date();
      const schedule = buildSchedule(now, location, language, mergedCache);
      if (!schedule) {
        throw new Error("Solar schedule incomplete");
      }

      const fetchedAt = new Date().toISOString();
      const nextState: AppState = {
        location,
        schedule,
        fetchedAt,
      };
      saveCachedState(nextState);

      setState({
        location,
        schedule,
        solarCache: mergedCache,
        loading: false,
        error: null,
        usingOfflineFallback: false,
        lastUpdated: fetchedAt,
      });
    } catch {
      const fallback = loadCachedState();
      if (fallback) {
        setState(hydrateCachedState(fallback, language, true));
      } else {
        setState((current) => ({
          ...current,
          location,
          loading: false,
          error: "solar",
        }));
      }
    } finally {
      inFlightRef.current.delete(fetchKey);
    }
  }

  return {
    ...state,
    refresh,
    selectCoordinates,
  };
}

function buildSchedule(
  now: Date,
  location: LocationSelection,
  language: Language,
  solarCache: SolarCache,
): EdoSchedule | null {
  const solarTimes = resolveSolarTimes(now, location.timezone, solarCache);
  if (!solarTimes) {
    return null;
  }

  const modernTime = formatInTimeZone(now, location.timezone, language);
  return calculateEdoTime(now, solarTimes, modernTime);
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
      solarCache: {},
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
    solarCache: {},
    loading: false,
    error: null,
    usingOfflineFallback,
    lastUpdated: cached.fetchedAt,
  };
}
