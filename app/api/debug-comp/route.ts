import { NextResponse } from "next/server";
import { getCompetition } from "@/lib/repository";

export async function GET() {
    const comp = await getCompetition();
    return NextResponse.json({ comp });
}
