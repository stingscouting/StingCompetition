import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";

admin.initializeApp();
const db = admin.firestore();

function calculateDailyScore(count: number): number {
  const capped = Math.min(count, 6);
  const base = capped * 10;
  const bonus = capped >= 3 ? 10 : capped === 2 ? 5 : 0;
  return base + bonus;
}

function dateKeyInTimezone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "0000";
  const month = parts.find((p) => p.type === "month")?.value ?? "00";
  const day = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${year}-${month}-${day}`;
}

export const dailyRollover = onSchedule({
  schedule: "every 60 minutes",
  timeZone: "UTC"
}, async () => {
  logger.info("Running daily rollover");

  const competitionDoc = await db.collection("competition").doc("current").get();
  if (!competitionDoc.exists) return;

  const competition = competitionDoc.data() as {
    status: string;
    timezone: string;
    startAt: string;
    endAt: string;
  };

  if (competition.status !== "ACTIVE") return;

  const companiesSnap = await db.collection("companies").get();
  const meetingsSnap = await db.collection("meetings").where("status", "==", "valid").get();

  const meetings = meetingsSnap.docs.map((d) => d.data() as { companyId: string; dateKey: string });
  const nowDate = new Date();
  const localParts = new Intl.DateTimeFormat("en-US", {
    timeZone: competition.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(nowDate);
  const hour = Number(localParts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(localParts.find((p) => p.type === "minute")?.value ?? "0");
  if (!(hour === 0 && minute < 5)) return;

  const rolloverDate = new Date(nowDate.getTime() - 24 * 60 * 60 * 1000);
  const dateKey = dateKeyInTimezone(rolloverDate, competition.timezone);

  const batch = db.batch();
  const ranking: { id: string; name: string; totalPoints: number; totalValidMeetings: number; streakCount: number }[] = [];

  companiesSnap.docs.forEach((companyDoc) => {
    const company = companyDoc.data() as {
      shieldAvailable: boolean;
      shieldUsed: boolean;
      streakCount: number;
      name: string;
    };

    const companyMeetings = meetings.filter((m) => m.companyId === companyDoc.id);
    const perDay = new Map<string, number>();
    companyMeetings.forEach((m) => perDay.set(m.dateKey, (perDay.get(m.dateKey) ?? 0) + 1));

    let totalPoints = 0;
    [...perDay.keys()].sort().forEach((key) => {
      totalPoints += calculateDailyScore(perDay.get(key) ?? 0);
    });

    const hadMeetingYesterday = (perDay.get(dateKey) ?? 0) > 0;
    let nextStreak = company.streakCount;
    let shieldUsed = company.shieldUsed;

    if (hadMeetingYesterday) {
      nextStreak += 1;
    } else if (company.shieldAvailable && !company.shieldUsed) {
      shieldUsed = true;
    } else {
      nextStreak = 0;
    }

    ranking.push({
      id: companyDoc.id,
      name: company.name,
      totalPoints,
      totalValidMeetings: companyMeetings.length,
      streakCount: nextStreak
    });

    batch.update(companyDoc.ref, {
      totalPoints,
      totalValidMeetings: companyMeetings.length,
      streakCount: nextStreak,
      shieldUsed
    });
  });

  ranking
    .sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.totalValidMeetings - a.totalValidMeetings ||
        a.name.localeCompare(b.name)
    )
    .forEach((row, idx) => {
      batch.update(db.collection("companies").doc(row.id), { rank: idx + 1 });
    });

  await batch.commit();
});
