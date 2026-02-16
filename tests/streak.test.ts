import { describe, expect, it } from "vitest";
import { resolveDailyStreak } from "@/lib/streak";

describe("resolveDailyStreak", () => {
  it("increments when there is a meeting", () => {
    expect(
      resolveDailyStreak({
        hadMeetingToday: true,
        previousStreak: 2
      })
    ).toEqual({ streakCount: 3 });
  });

  it("resets to 0 when meeting is missed (reactive model)", () => {
    expect(
      resolveDailyStreak({
        hadMeetingToday: false,
        previousStreak: 4
      })
    ).toEqual({ streakCount: 0 });
  });
});
