import { getMessages } from "../i18n";
import type { EdoSegment, Language } from "../types";

export function getSegmentLabel(segment: EdoSegment, language: Language) {
  const dict = getMessages(language);
  return segment.kind === "day"
    ? dict.daySegment(segment.index)
    : dict.nightSegment(segment.index);
}
