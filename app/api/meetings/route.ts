import { NextRequest, NextResponse } from "next/server";
import { assertParticipant, requireUser } from "@/lib/auth";
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
    assertParticipant(user);

    const parsed = meetingInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const competition = await getCompetition();
    if (!competition || competition.status !== "ACTIVE") {
      return NextResponse.json({ error: "Competition is not active" }, { status: 400 });
    }

    if (!isWithinWindow(parsed.data.meetingAt, competition.startAt, competition.endAt)) {
      return NextResponse.json({ error: "Meeting must be within competition window" }, { status: 400 });
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

    const meeting = await createMeeting({
      companyId: user.companyId,
      ...parsed.data,
      createdAt: submittedAt,
      submissionDateKey
    });
    await recomputeAllCompanyScores();

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Meeting submission failed" },
      { status: 400 }
    );
  }
}
