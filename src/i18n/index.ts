import en from "./en";
import ja from "./ja";
import type { Language } from "../types";

export const messages = { ja, en };

export function getMessages(language: Language) {
  return messages[language];
}
