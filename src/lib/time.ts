export function getTimeZoneDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

export function getTimeZoneDateString(date: Date, timeZone: string) {
  const { year, month, day } = getTimeZoneDateParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatInTimeZone(
  date: Date,
  timeZone: string,
  language: "ja" | "en",
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(language, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  }).format(date);
}

export function formatRelativeDuration(ms: number, language: "ja" | "en") {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (language === "ja") {
    if (hours > 0) {
      return `${hours}時間${minutes}分`;
    }
    if (minutes > 0) {
      return `${minutes}分${seconds}秒`;
    }
    return `${seconds}秒`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function parseIsoDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid datetime: ${value}`);
  }
  return date;
}
