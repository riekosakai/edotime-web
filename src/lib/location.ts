import type { LocationSelection } from "../types";

type GeoCodingResult = {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

type GeoCodingResponse = {
  results?: GeoCodingResult[];
};

type ReverseGeoCodingResponse = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
};

function buildName(result: Pick<GeoCodingResult, "name" | "country" | "admin1">) {
  return [result.name, result.admin1, result.country].filter(Boolean).join(", ");
}

export async function searchLocations(query: string): Promise<LocationSelection[]> {
  const params = new URLSearchParams({
    name: query,
    count: "5",
    language: "en",
    format: "json",
  });

  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Location search failed");
  }

  const data = (await response.json()) as GeoCodingResponse;
  return (data.results ?? []).map((result) => ({
    name: buildName(result),
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone,
  }));
}

export async function reverseGeocode(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: "jsonv2",
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as ReverseGeoCodingResponse;
  const address = data.address;
  if (!address) {
    return null;
  }

  return [address.city ?? address.town ?? address.village, address.state, address.country]
    .filter(Boolean)
    .join(", ");
}

export async function fetchTimezone(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current_weather: "true",
    timezone: "auto",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Timezone lookup failed");
  }

  const data = (await response.json()) as { timezone?: string };
  if (!data.timezone) {
    throw new Error("Timezone missing");
  }
  return data.timezone;
}
