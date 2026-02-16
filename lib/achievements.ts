import type { Company } from "./types";

export const ACHIEVEMENT_IDS = {
    FAST_START: "Fast Start",
    CLOSER_KING: "Closer King",
    SHIELD_ON: "Shield On"
} as const;

/**
 * Deterministically calculate current achievements based on company stats.
 * We never remove achievements once earned.
 */
export function calculateAchievements(
    company: Partial<Company>,
    currentAchievements: string[] = []
): string[] {
    const achievements = new Set(currentAchievements);

    const totalMeetings = company.totalValidMeetings || 0;
    const shieldUsed = !!company.shieldUsed;

    // 1. Fast Start: First valid meeting
    if (totalMeetings >= 1) {
        achievements.add(ACHIEVEMENT_IDS.FAST_START);
    }

    // 2. Closer King: Meaningful milestone
    if (totalMeetings >= 10) {
        achievements.add(ACHIEVEMENT_IDS.CLOSER_KING);
    }

    // 3. Shield On: Shield consumed during protection
    // This badge is dynamic: it reflects the CURRENT shieldUsed state.
    if (shieldUsed) {
        achievements.add(ACHIEVEMENT_IDS.SHIELD_ON);
    } else {
        achievements.delete(ACHIEVEMENT_IDS.SHIELD_ON);
    }

    return Array.from(achievements);
}

/**
 * Returns the list of badges in 'updated' that were not in 'original'.
 */
export function getNewAchievements(original: string[], updated: string[]): string[] {
    return updated.filter(a => !original.includes(a));
}
