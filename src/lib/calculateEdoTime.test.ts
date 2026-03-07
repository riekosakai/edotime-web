import { describe, expect, it } from "vitest";
import { calculateEdoTime } from "./calculateEdoTime";

describe("calculateEdoTime", () => {
  it("splits day and night into twelve segments", () => {
    const schedule = calculateEdoTime(
      new Date("2026-03-07T09:00:00+09:00"),
      {
        sunrise: new Date("2026-03-07T06:00:00+09:00"),
        sunset: new Date("2026-03-07T18:00:00+09:00"),
        nextSunrise: new Date("2026-03-08T06:00:00+09:00"),
      },
      "09:00",
    );

    expect(schedule.segments).toHaveLength(12);
    expect(schedule.currentSegment.id).toBe("day-2");
    expect(schedule.segments[0].start.toISOString()).toBe("2026-03-06T21:00:00.000Z");
    expect(schedule.segments[11].end.toISOString()).toBe("2026-03-07T21:00:00.000Z");
  });

  it("moves to the next segment at the boundary", () => {
    const schedule = calculateEdoTime(
      new Date("2026-03-07T18:00:00+09:00"),
      {
        sunrise: new Date("2026-03-07T06:00:00+09:00"),
        sunset: new Date("2026-03-07T18:00:00+09:00"),
        nextSunrise: new Date("2026-03-08T06:00:00+09:00"),
      },
      "18:00",
    );

    expect(schedule.currentSegment.id).toBe("night-1");
    expect(schedule.remainingMs).toBe(2 * 60 * 60 * 1000);
  });
});
