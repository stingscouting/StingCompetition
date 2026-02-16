interface StreakResolutionInput {
  hadMeetingToday: boolean;
  previousStreak: number;
  shieldAvailable: boolean;
  shieldUsed: boolean;
}

interface StreakResolution {
  streakCount: number;
  shieldUsed: boolean;
}

export function resolveDailyStreak(input: {
  hadMeetingToday: boolean;
  previousStreak: number;
}): { streakCount: number } {
  if (input.hadMeetingToday) {
    return {
      streakCount: input.previousStreak + 1
    };
  }

  // Reactive logic: Always reset to 0 if meeting missed.
  // Recovery is handled manually via Best Practice API.
  return {
    streakCount: 0
  };
}
