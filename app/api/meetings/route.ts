import { NextRequest, NextResponse } from "next/server";
import { assertCanSubmit, requireUser } from "@/lib/auth";
import {
  getCompetition,
  createMeeting,
  duplicateMeetingExists,
  getCompanyDayMeetingCount
} from "@/lib/repository";
import { meetingInputSchema } from "@/lib/validation";
import { DAILY_MEETING_CAP } from "@/lib/constants";
import { isWithinWindow, nowIso, toDateKey } from "@/lib/time";
import { recomputeAllCompanyScores } from "@/lib/recompute";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    assertCanSubmit(user);

    const parsed = meetingInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const competition = await getCompetition();
    if (!competition || competition.status !== "ACTIVE") {
      return NextResponse.json({ error: "Competition is not active" }, { status: 400 });
    }

    // DEBUG: Log window comparison
    const mTime = new Date(parsed.data.meetingAt).getTime();
    const sTime = new Date(competition.startAt).getTime();
    const eTime = new Date(competition.endAt).getTime();
    if (mTime < sTime || mTime > eTime) {
      console.log(`[WINDOW_FAILED] Meeting: ${parsed.data.meetingAt} (${mTime}) | Window: ${competition.startAt} - ${competition.endAt} (${sTime} - ${eTime})`);
      return NextResponse.json({
        error: "Meeting must be within competition window",
        details: { meeting: parsed.data.meetingAt, start: competition.startAt, end: competition.endAt }
      }, { status: 400 });
    }

    const isDuplicate = await duplicateMeetingExists(
      user.companyId,
      parsed.data.prospectCompanyName,
      parsed.data.meetingAt
    );

    if (isDuplicate) {
      return NextResponse.json({ error: "Duplicate meeting submission" }, { status: 409 });
    }

    const submittedAt = nowIso();
    const submissionDateKey = toDateKey(submittedAt, competition.timezone);
    const count = await getCompanyDayMeetingCount(user.companyId, submissionDateKey);

    if (count >= DAILY_MEETING_CAP) {
      return NextResponse.json({ error: "Daily maximum of 6 meetings counted reached" }, { status: 400 });
    }

    const { meeting, newAchievements } = await createMeeting({
      companyId: user.companyId,
      ...parsed.data,
      createdAt: submittedAt,
      submissionDateKey
    });
    // Non-blocking recompute (ensure one bad doc doesn't block submissions)
    try {
      await recomputeAllCompanyScores();
    } catch (recomputeErr) {
      console.error("[RECOMPUTE_ERROR_NON_BLOCKING]", recomputeErr);
    }

    return NextResponse.json({ meeting, newAchievements }, { status: 201 });
  } catch (error: any) {
    if (error.message === "AUTH_MISSING" || error.message === "AUTH_PROFILE_MISSING") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[MEETING_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Meeting submission failed" },
      { status: 500 }
    );
  }
}
