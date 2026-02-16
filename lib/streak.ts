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

export function resolveDailyStreak(input: StreakResolutionInput): StreakResolution {
  if (input.hadMeetingToday) {
    return {
      streakCount: input.previousStreak + 1,
      shieldUsed: input.shieldUsed
    };
  }

  if (input.shieldAvailable && !input.shieldUsed) {
    return {
      streakCount: input.previousStreak,
      shieldUsed: true
    };
  }

  return {
    streakCount: 0,
    shieldUsed: input.shieldUsed
  };
}
