import { NextRequest, NextResponse } from "next/server";
import { activateCompetition } from "@/lib/repository";
import { assertAdmin, requireUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    assertAdmin(user);

    const body = (await request.json()) as {
      startAt: string;
      endAt: string;
      timezone: string;
      rulesVersion?: string;
    };

    await activateCompetition({
      startAt: body.startAt,
      endAt: body.endAt,
      timezone: body.timezone,
      rulesVersion: body.rulesVersion ?? "v1"
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to activate competition" },
      { status: 400 }
    );
  }
}
