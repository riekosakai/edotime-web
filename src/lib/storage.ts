import type { AppState, Language } from "../types";

const LANGUAGE_KEY = "edotime.language";
const APP_STATE_KEY = "edotime.state";

export function loadLanguage(): Language {
  const value = window.localStorage.getItem(LANGUAGE_KEY);
  return value === "ja" || value === "en" ? value : "ja";
}

export function saveLanguage(language: Language) {
  window.localStorage.setItem(LANGUAGE_KEY, language);
}

export function loadCachedState(): AppState | null {
  const raw = window.localStorage.getItem(APP_STATE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

export function saveCachedState(state: AppState) {
  window.localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
}
