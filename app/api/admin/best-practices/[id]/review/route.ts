import { NextRequest, NextResponse } from "next/server";
import { assertAdmin, requireUser } from "@/lib/auth";
import { updateBestPracticeStatus } from "@/lib/repository";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    assertAdmin(user);

    const { id } = await params;
    const body = (await request.json()) as { status: "approved" | "rejected" };

    if (body.status !== "approved" && body.status !== "rejected") {
      return NextResponse.json({ error: "Invalid status" }, { status: 422 });
    }

    await updateBestPracticeStatus({
      id,
      status: body.status,
      reviewedBy: user.id
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review failed" },
      { status: 400 }
    );
  }
}
