export type UserRole = "admin" | "participant" | "guest";
export type CompetitionStatus = "DRAFT" | "ACTIVE" | "ENDED";
export type MeetingType = "digital" | "in person";
export type BestPracticeStatus = "pending" | "approved" | "rejected";
export type MeetingStatus = "valid" | "invalid" | "deleted";

export interface CompetitionConfig {
  id: "current";
  startAt: string;
  endAt: string;
  timezone: string;
  status: CompetitionStatus;
  minCompanies: number;
  rulesVersion: string;
}

export interface Company {
  id: string;
  name: string;
  totalPoints: number;
  totalValidMeetings: number;
  streakCount: number;
  lastSubmissionDate?: string;
  shieldAvailable: boolean;
  shieldUsed: boolean;
  subscribed: boolean;
  notificationEmail: string;
  disqualified: boolean;
  disqualificationReason?: string;
  rank: number;
  website?: string;
  logoUrl?: string;
  achievements: string[];
  lastBrokenStreak: number;
  shieldUsedDateKey?: string;
  shieldRecoveryRequested?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  companyName?: string;
}

export interface Meeting {
  id: string;
  companyId: string;
  prospectCompanyName: string;
  contactName: string;
  meetingAt: string;
  durationMinutes: number;
  type: MeetingType;
  createdAt: string;
  validated: boolean;
  status: MeetingStatus;
  invalidReason?: string;
  deletedAt?: string;
  dateKey: string;
}

export interface BestPractice {
  id: string;
  companyId: string;
  message: string;
  status: BestPracticeStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface DailySnapshot {
  id: string;
  dateKey: string;
  companyId: string;
  rank: number;
  totalPoints: number;
  streakCount: number;
}

export interface RulesContent {
  id: "current";
  content: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ScoreBreakdown {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  countedMeetings: number;
}
