import {
  BASE_MEETING_POINTS,
  BONUS_FOR_THREE_OR_MORE,
  BONUS_FOR_TWO,
  DAILY_MEETING_CAP
} from "@/lib/constants";
import type { ScoreBreakdown } from "@/lib/types";

export function calculateDailyScore(validMeetingsCount: number): ScoreBreakdown {
  const countedMeetings = Math.min(validMeetingsCount, DAILY_MEETING_CAP);
  const basePoints = countedMeetings * BASE_MEETING_POINTS;

  let bonusPoints = 0;
  if (countedMeetings >= 3) {
    bonusPoints = BONUS_FOR_THREE_OR_MORE;
  } else if (countedMeetings === 2) {
    bonusPoints = BONUS_FOR_TWO;
  }

  return {
    basePoints,
    bonusPoints,
    totalPoints: basePoints + bonusPoints,
    countedMeetings
  };
}

export function incrementalDelta(previousCount: number, nextCount: number): number {
  const before = calculateDailyScore(previousCount);
  const after = calculateDailyScore(nextCount);
  return after.totalPoints - before.totalPoints;
}
