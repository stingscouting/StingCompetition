import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getCompany } from "@/lib/repository";

export async function GET() {
  try {
    const user = await requireUser();
    const company = await getCompany(user.companyId);
    return NextResponse.json({ company });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch stats" },
      { status: 400 }
    );
  }
}
