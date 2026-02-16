import { describe, expect, it } from "vitest";
import { calculateDailyScore, incrementalDelta } from "@/lib/scoring";

describe("calculateDailyScore", () => {
  it("applies no bonus for 0 or 1 meetings", () => {
    expect(calculateDailyScore(0).totalPoints).toBe(0);
    expect(calculateDailyScore(1).totalPoints).toBe(10);
  });

  it("applies +5 at two meetings", () => {
    expect(calculateDailyScore(2).totalPoints).toBe(25);
  });

  it("applies +10 at three meetings", () => {
    expect(calculateDailyScore(3).totalPoints).toBe(40);
  });

  it("caps counted meetings at six", () => {
    expect(calculateDailyScore(7).countedMeetings).toBe(6);
    expect(calculateDailyScore(7).totalPoints).toBe(70);
  });

  it("uses incremental delta from 2 to 3 as +15 (10 base + 5 bonus diff)", () => {
    expect(incrementalDelta(2, 3)).toBe(15);
  });
});
