import { adminDb } from "@/lib/firebase-admin";
import { calculateDailyScore } from "@/lib/scoring";
import { resolveDailyStreak } from "@/lib/streak";
import { rankCompanies } from "@/lib/ranking";
import { getCompetition } from "@/lib/repository";
import { toDateKey } from "@/lib/time";
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
    let shieldUsed = company.shieldUsed;
    let lastSubmissionDate = company.lastSubmissionDate;
    let previousKey: string | null = null;

    const orderedKeys = [...byDay.keys()].sort();
    for (const dateKey of orderedKeys) {
      const count = byDay.get(dateKey) ?? 0;
      if (previousKey) {
        const gap = dayDiff(previousKey, dateKey);
        if (gap > 1) {
          for (let i = 0; i < gap - 1; i += 1) {
            const missed = resolveDailyStreak({
              hadMeetingToday: false,
              previousStreak: streakCount,
              shieldAvailable: company.shieldAvailable,
              shieldUsed
            });
            streakCount = missed.streakCount;
            shieldUsed = missed.shieldUsed;
          }
        }
      }

      const dayScore = calculateDailyScore(count);
      totalPoints += dayScore.totalPoints;

      const resolved = resolveDailyStreak({
        hadMeetingToday: count > 0,
        previousStreak: streakCount,
        shieldAvailable: company.shieldAvailable,
        shieldUsed
      });

      streakCount = resolved.streakCount;
      shieldUsed = resolved.shieldUsed;
      if (count > 0) {
        lastSubmissionDate = dateKey;
      }
      previousKey = dateKey;
    }

    return {
      ...company,
      totalPoints,
      totalValidMeetings: relevant.length,
      streakCount,
      shieldUsed,
      lastSubmissionDate
    };
  });

  const ranked = rankCompanies(updated);
  const batch = adminDb.batch();

  ranked.forEach((company) => {
    const ref = adminDb.collection("companies").doc(company.id);
    batch.update(ref, {
      totalPoints: company.totalPoints,
      totalValidMeetings: company.totalValidMeetings,
      streakCount: company.streakCount,
      shieldUsed: company.shieldUsed,
      lastSubmissionDate: company.lastSubmissionDate,
      rank: company.rank
    });
  });

  await batch.commit();
}
