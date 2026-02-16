import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { DEFAULT_MIN_COMPANIES } from "@/lib/constants";
import { incrementalDelta } from "@/lib/scoring";
import { nowIso, toDateKey } from "@/lib/time";
import { normalizeProspect } from "@/lib/validation";
import { calculateAchievements, getNewAchievements } from "@/lib/achievements";
import type { BestPracticeStatus, CompetitionConfig, Company, Meeting } from "@/lib/types";

export async function getCompetition(): Promise<CompetitionConfig | null> {
  const doc = await adminDb.collection("competition").doc("current").get();
  if (!doc.exists) {
    return null;
  }
  return doc.data() as CompetitionConfig;
}

export async function getCompany(companyId: string): Promise<Company | null> {
  const doc = await adminDb.collection("companies").doc(companyId).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...(doc.data() as Omit<Company, "id">) };
}

export async function countSubscribedCompanies(): Promise<number> {
  const snap = await adminDb.collection("companies").where("subscribed", "==", true).get();
  return snap.size;
}

export async function activateCompetition(input: {
  startAt: string;
  endAt: string;
  timezone: string;
  rulesVersion: string;
}): Promise<void> {
  const subscribedCount = await countSubscribedCompanies();
  if (subscribedCount < DEFAULT_MIN_COMPANIES) {
    throw new Error("At least 5 subscribed companies are required");
  }

  await adminDb.collection("competition").doc("current").set({
    id: "current",
    startAt: input.startAt,
    endAt: input.endAt,
    timezone: input.timezone,
    status: "ACTIVE",
    minCompanies: DEFAULT_MIN_COMPANIES,
    rulesVersion: input.rulesVersion
  });
}

export async function getCompanyDayMeetingCount(companyId: string, dateKey: string): Promise<number> {
  const snap = await adminDb
    .collection("meetings")
    .where("companyId", "==", companyId)
    .where("dateKey", "==", dateKey)
    .where("status", "==", "valid")
    .get();

  return snap.size;
}

export async function duplicateMeetingExists(companyId: string, prospectCompanyName: string, meetingAt: string) {
  const normalized = normalizeProspect(prospectCompanyName);
  const snap = await adminDb
    .collection("meetings")
    .where("companyId", "==", companyId)
    .where("prospectNormalized", "==", normalized)
    .where("meetingAt", "==", meetingAt)
    .where("status", "==", "valid")
    .limit(1)
    .get();

  return !snap.empty;
}

export async function createMeeting(input: {
  companyId: string;
  prospectCompanyName: string;
  contactName: string;
  meetingAt: string;
  durationMinutes: number;
  type: "digital" | "in person";
  createdAt: string;
  submissionDateKey: string;
}): Promise<{ meeting: Meeting; newAchievements: string[] }> {
  const dateKey = input.submissionDateKey || new Date().toISOString().split('T')[0];
  const currentCount = await getCompanyDayMeetingCount(input.companyId, dateKey);
  const nextCount = currentCount + 1;
  const delta = incrementalDelta(currentCount, nextCount);
  const createdAt = input.createdAt || nowIso();

  const ref = adminDb.collection("meetings").doc();
  const normalized = normalizeProspect(input.prospectCompanyName);
  const meeting: Omit<Meeting, "id"> = {
    companyId: input.companyId,
    prospectCompanyName: input.prospectCompanyName,
    contactName: input.contactName,
    meetingAt: input.meetingAt,
    durationMinutes: input.durationMinutes,
    type: input.type,
    createdAt,
    validated: true,
    status: "valid",
    dateKey
  };

  let initialAchievements: string[] = [];

  await adminDb.runTransaction(async (tx) => {
    const companyRef = adminDb.collection("companies").doc(input.companyId);
    const companyDoc = await tx.get(companyRef);
    if (!companyDoc.exists) {
      throw new Error("Company not found");
    }

    const companyData = companyDoc.data()!;
    initialAchievements = companyData.achievements || [];
    const shieldUsed = !!companyData.shieldUsed;
    const shieldAvailable = companyData.shieldAvailable !== false;

    tx.set(ref, {
      ...meeting,
      prospectNormalized: normalized
    });

    tx.update(companyRef, {
      totalPoints: FieldValue.increment(delta),
      totalValidMeetings: FieldValue.increment(1),
      lastSubmissionDate: dateKey,
      shieldUsed,
      shieldAvailable,
      achievements: calculateAchievements(
        { totalValidMeetings: (companyData.totalValidMeetings || 0) + 1, shieldUsed },
        initialAchievements
      ),
      updatedAt: Timestamp.now()
    });

    tx.set(
      adminDb.collection("activityFeed").doc(),
      {
        companyId: input.companyId,
        type: "meeting_submitted",
        message: `New meeting with ${input.prospectCompanyName}`,
        createdAt
      },
      { merge: true }
    );
  });

  // Fetch updated company after transaction to see new state (for new achievements)
  const updatedCompany = await getCompany(input.companyId);
  const newAchievements = updatedCompany
    ? getNewAchievements(initialAchievements, updatedCompany.achievements || [])
    : [];

  return { meeting: { id: ref.id, ...meeting }, newAchievements };
}

export async function updateBestPracticeStatus(input: {
  id: string;
  status: BestPracticeStatus;
  reviewedBy: string;
}) {
  const ref = adminDb.collection("bestPractices").doc(input.id);
  const doc = await ref.get();
  if (!doc.exists) {
    throw new Error("Best practice not found");
  }

  const data = doc.data() as { companyId: string; status: BestPracticeStatus };

  await adminDb.runTransaction(async (tx) => {
    const companyRef = adminDb.collection("companies").doc(data.companyId);
    const companyDoc = await tx.get(companyRef);
    const company = companyDoc.data() as { shieldAvailable?: boolean } | undefined;

    tx.update(ref, {
      status: input.status,
      reviewedBy: input.reviewedBy,
      reviewedAt: nowIso()
    });

    if (input.status === "approved") {
      if (companyDoc.exists && !company?.shieldAvailable) {
        tx.update(companyRef, { shieldAvailable: true });
      }
    }
  });
}
export async function getCompanyWeeklyActivity(companyId: string, startDateKey: string, endDateKey: string): Promise<string[]> {
  // Fetch all meetings for company to avoid composite index requirements
  // Range and status filtering performed in-memory for maximum reliability
  const snap = await adminDb
    .collection("meetings")
    .where("companyId", "==", companyId)
    .get();

  const activeDates = new Set<string>();
  snap.forEach(doc => {
    const data = doc.data();
    const isWithinRange = data.dateKey >= startDateKey && data.dateKey <= endDateKey;
    const isValid = data.status === "valid";

    if (isWithinRange && isValid && data.dateKey) {
      activeDates.add(data.dateKey);
    }
  });

  return Array.from(activeDates).sort();
}
