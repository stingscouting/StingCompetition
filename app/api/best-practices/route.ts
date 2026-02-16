import { NextRequest, NextResponse } from "next/server";
import { assertParticipant, requireUser } from "@/lib/auth";
import { bestPracticeInputSchema } from "@/lib/validation";
import { adminDb } from "@/lib/firebase-admin";
import { nowIso } from "@/lib/time";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    assertParticipant(user);

    const parsed = bestPracticeInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const ref = adminDb.collection("bestPractices").doc();
    await ref.set({
      companyId: user.companyId,
      message: parsed.data.message,
      status: "pending",
      createdAt: nowIso()
    });

    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submission failed" },
      { status: 400 }
    );
  }
}
