import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function GET() {
    try {
        const user = await requireUser();
        return NextResponse.json({ user });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unauthorized" },
            { status: 401 }
        );
    }
}
