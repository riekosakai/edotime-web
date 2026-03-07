import { useState } from "react";

type GeolocationState = {
  loading: boolean;
  error: string | null;
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ loading: false, error: null });

  async function getCurrentPosition() {
    if (!("geolocation" in navigator)) {
      setState({ loading: false, error: "unavailable" });
      throw new Error("Geolocation unsupported");
    }

    setState({ loading: true, error: null });

    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({ loading: false, error: null });
          resolve(position);
        },
        (error) => {
          setState({
            loading: false,
            error: error.code === error.PERMISSION_DENIED ? "denied" : "unavailable",
          });
          reject(error);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000,
        },
      );
    });
  }

  return {
    ...state,
    getCurrentPosition,
  };
}
