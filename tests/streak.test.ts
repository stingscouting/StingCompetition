import { describe, expect, it } from "vitest";
import { resolveDailyStreak } from "@/lib/streak";

describe("resolveDailyStreak", () => {
  it("increments when there is a meeting", () => {
    expect(
      resolveDailyStreak({
        hadMeetingToday: true,
        previousStreak: 2,
        shieldAvailable: true,
        shieldUsed: false
      })
    ).toEqual({ streakCount: 3, shieldUsed: false });
  });

  it("consumes shield on first missed day", () => {
    expect(
      resolveDailyStreak({
        hadMeetingToday: false,
        previousStreak: 4,
        shieldAvailable: true,
        shieldUsed: false
      })
    ).toEqual({ streakCount: 4, shieldUsed: true });
  });

  it("resets streak when shield already used", () => {
    expect(
      resolveDailyStreak({
        hadMeetingToday: false,
        previousStreak: 4,
        shieldAvailable: true,
        shieldUsed: true
      })
    ).toEqual({ streakCount: 0, shieldUsed: true });
  });
});
