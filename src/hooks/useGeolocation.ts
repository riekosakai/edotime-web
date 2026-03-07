import { useState } from "react";

type GeolocationErrorCode = "unsupported" | "denied" | "unavailable" | "timeout";

type GeolocationState = {
  loading: boolean;
  error: GeolocationErrorCode | null;
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ loading: false, error: null });

  async function getCurrentPosition() {
    if (!("geolocation" in navigator)) {
      console.warn("[geolocation] unsupported browser");
      setState({ loading: false, error: "unsupported" });
      throw new Error("Geolocation unsupported");
    }

    setState({ loading: true, error: null });

    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.info("[geolocation] success", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setState({ loading: false, error: null });
          resolve(position);
        },
        (error) => {
          const nextError = mapGeolocationError(error);
          console.warn("[geolocation] failure", {
            code: error.code,
            message: error.message,
            mapped: nextError,
          });
          setState({ loading: false, error: nextError });
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        },
      );
    });
  }

  return {
    ...state,
    getCurrentPosition,
  };
}

function mapGeolocationError(error: GeolocationPositionError): GeolocationErrorCode {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "denied";
    case error.POSITION_UNAVAILABLE:
      return "unavailable";
    case error.TIMEOUT:
      return "timeout";
    default:
      return "unavailable";
  }
}
