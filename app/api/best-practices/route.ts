import { NextRequest, NextResponse } from "next/server";
import { assertCanSubmit, requireUser } from "@/lib/auth";
import { bestPracticeInputSchema } from "@/lib/validation";
import { adminDb } from "@/lib/firebase-admin";
import { nowIso } from "@/lib/time";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    assertCanSubmit(user);

    const parsed = bestPracticeInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const ref = adminDb.collection("bestPractices").doc();
    let shieldRestored = false;

    await adminDb.runTransaction(async (tx) => {
      const companyRef = adminDb.collection("companies").doc(user.companyId);
      const companyDoc = await tx.get(companyRef);
      if (!companyDoc.exists) throw new Error("Company not found");

      const company = companyDoc.data()!;
      const shieldUsed = !!company.shieldUsed;
      const streakCount = company.streakCount || 0;
      const lastBrokenStreak = company.lastBrokenStreak || 0;

      // Logic: If streak is broken and shield available, signal intent to recover
      if (!shieldUsed && streakCount === 0 && lastBrokenStreak > 0) {
        tx.update(companyRef, {
          shieldRecoveryRequested: true
        });
        shieldRestored = true;
      }

      tx.set(ref, {
        companyId: user.companyId,
        message: parsed.data.message,
        status: "approved", // auto-approve for now
        createdAt: nowIso()
      });
    });

    // Immediate recompute to fulfill the restoration request
    const { recomputeAllCompanyScores } = await import("@/lib/recompute");
    await recomputeAllCompanyScores();

    return NextResponse.json({ id: ref.id, shieldRestored }, { status: 201 });
  } catch (error: any) {
    console.error("Best Practice failed:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
