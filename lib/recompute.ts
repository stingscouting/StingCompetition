import { adminDb } from "@/lib/firebase-admin";
import { calculateDailyScore } from "@/lib/scoring";
import { resolveDailyStreak } from "@/lib/streak";
import { rankCompanies } from "@/lib/ranking";
import { getCompetition } from "@/lib/repository";
import { toDateKey, nowIso } from "@/lib/time";
import { calculateAchievements } from "@/lib/achievements";
import type { Company } from "@/lib/types";

interface MeetingDoc {
  companyId: string;
  meetingAt: string;
  createdAt?: string;
  status: "valid" | "invalid" | "deleted";
  dateKey?: string;
}

function dayDiff(a: string, b: string): number {
  const aTime = new Date(`${a}T00:00:00.000Z`).getTime();
  const bTime = new Date(`${b}T00:00:00.000Z`).getTime();
  return Math.round((bTime - aTime) / (1000 * 60 * 60 * 24));
}

export async function recomputeAllCompanyScores(): Promise<void> {
  const competition = await getCompetition();
  if (!competition) {
    return;
  }

  const companiesSnap = await adminDb.collection("companies").get();
  const meetingsSnap = await adminDb.collection("meetings").where("status", "==", "valid").get();

  const companies = companiesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Company[];
  const meetings = meetingsSnap.docs.map((doc) => doc.data() as MeetingDoc);

  const updated = companies.map((company) => {
    const relevant = meetings.filter((m) => m.companyId === company.id);
    const byDay = new Map<string, number>();

    for (const meeting of relevant) {
      const sourceDate = meeting.createdAt ?? meeting.meetingAt;
      const dateKey = meeting.dateKey ?? toDateKey(sourceDate, competition.timezone);
      byDay.set(dateKey, (byDay.get(dateKey) ?? 0) + 1);
    }

    let totalPoints = 0;
    let streakCount = 0;
    let shieldUsed = !!company.shieldUsed;
    let shieldAvailable = company.shieldAvailable !== false;
    let lastBrokenStreak = company.lastBrokenStreak || 0;
    let shieldUsedDateKey = company.shieldUsedDateKey;
    let shieldRecoveryRequested = !!company.shieldRecoveryRequested;
    let lastSubmissionDate = company.lastSubmissionDate;
    let previousKey: string | null = null;

    // Internal flag to track if the shield was *actually* needed this run
    let shieldActuallyBridgedGap = false;

    const orderedKeys = [...byDay.keys()].sort();
    for (const dateKey of orderedKeys) {
      const count = byDay.get(dateKey) ?? 0;
      if (previousKey) {
        const gap = dayDiff(previousKey, dateKey);
        if (gap > 1) {
          for (let i = 0; i < gap - 1; i += 1) {
            const gapDate = new Date(new Date(`${previousKey}T00:00:00.000Z`).getTime() + (i + 1) * 86400000).toISOString().split('T')[0];

            if (shieldUsedDateKey === gapDate) {
              // Streak preserved by existing shield usage
              shieldActuallyBridgedGap = true;
            } else if (shieldRecoveryRequested && !shieldUsed) {
              // CONSUME SHIELD: Intent found and shield available for this gap
              shieldUsed = true;
              shieldUsedDateKey = gapDate;
              shieldRecoveryRequested = false;
              shieldActuallyBridgedGap = true;
              // Streak preserved
            } else {
              if (streakCount > 0) lastBrokenStreak = streakCount;
              streakCount = 0;
            }
          }
        }
      }

      const dayScore = calculateDailyScore(count);
      totalPoints += dayScore.totalPoints;

      const resolved = resolveDailyStreak({
        hadMeetingToday: count > 0,
        previousStreak: streakCount
      });

      streakCount = resolved.streakCount;
      if (count > 0) {
        lastSubmissionDate = dateKey;
      }
      previousKey = dateKey;
    }

    // Handle gap until today
    const todayKey = toDateKey(nowIso(), competition.timezone);
    if (previousKey && previousKey < todayKey) {
      const gap = dayDiff(previousKey, todayKey);
      if (gap > 1) {
        for (let i = 0; i < gap - 1; i += 1) {
          const gapDate = new Date(new Date(`${previousKey}T00:00:00.000Z`).getTime() + (i + 1) * 86400000).toISOString().split('T')[0];

          if (shieldUsedDateKey === gapDate) {
            // Streak preserved
            shieldActuallyBridgedGap = true;
          } else if (shieldRecoveryRequested && !shieldUsed) {
            // CONSUME SHIELD
            shieldUsed = true;
            shieldUsedDateKey = gapDate;
            shieldRecoveryRequested = false;
            shieldActuallyBridgedGap = true;
          } else {
            if (streakCount > 0) lastBrokenStreak = streakCount;
            streakCount = 0;
          }
        }
      }
    }

    // Final Audit: If shield was marked used but didn't bridge any gap, REFUND IT.
    // This handles cases where a shield was "used" manually or erroneously.
    if (shieldUsed && !shieldActuallyBridgedGap) {
      shieldUsed = false;
      shieldUsedDateKey = undefined;
    }

    const achievements = calculateAchievements(
      { totalValidMeetings: relevant.length, shieldUsed },
      company.achievements || []
    );

    return {
      ...company,
      totalPoints,
      totalValidMeetings: relevant.length,
      streakCount,
      shieldUsed,
      shieldAvailable,
      lastSubmissionDate,
      achievements,
      lastBrokenStreak,
      shieldUsedDateKey,
      shieldRecoveryRequested
    };
  });

  const ranked = rankCompanies(updated);
  const batch = adminDb.batch();

  ranked.forEach((company) => {
    const ref = adminDb.collection("companies").doc(company.id);
    const updateData: any = {
      totalPoints: company.totalPoints,
      totalValidMeetings: company.totalValidMeetings,
      streakCount: company.streakCount,
      shieldUsed: company.shieldUsed,
      shieldAvailable: company.shieldAvailable,
      rank: company.rank,
      achievements: company.achievements,
      lastBrokenStreak: company.lastBrokenStreak,
      shieldUsedDateKey: company.shieldUsedDateKey || null,
      shieldRecoveryRequested: company.shieldRecoveryRequested
    };
    if (company.lastSubmissionDate) {
      updateData.lastSubmissionDate = company.lastSubmissionDate;
    }
    batch.update(ref, updateData);
  });

  await batch.commit();
}
