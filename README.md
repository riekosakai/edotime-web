# EdoTime

EdoTime is a responsive PWA web app that shows Edo-style temporal time from the selected location's local sunrise and sunset. It is designed as a static client-side app for desktop, Android, and iPhone browsers.

## Features

- Browser geolocation with manual coordinate fallback
- Place search via Open-Meteo geocoding
- Timezone-aware sunrise/sunset lookup via Open-Meteo
- Current Edo segment, remaining time, and 12-segment timeline
- Japanese and English UI
- Offline fallback using the last cached result
- Basic PWA manifest and service worker

## Stack

- React 19
- TypeScript
- Vite
- Vitest

## Development

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

## Build

```bash
npm run build
```

## Deployment

The app is static and can be deployed to GitHub Pages or Cloudflare Pages after a production build.

## Notes

- Solar times and timezone detection are fetched client-side from public Open-Meteo endpoints.
- Reverse geocoding for current location naming uses OpenStreetMap Nominatim.
- When the network is unavailable, the app falls back to the latest cached result if present.
