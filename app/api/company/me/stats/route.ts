import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getCompany, getCompetition, getCompanyWeeklyActivity } from "@/lib/repository";
import { getCurrentWeekKeys } from "@/lib/date-utils";

export async function GET() {
  try {
    const user = await requireUser();
    const [company, competition] = await Promise.all([
      getCompany(user.companyId),
      getCompetition()
    ]);

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const timezone = competition?.timezone || "UTC";
    const weekKeys = getCurrentWeekKeys(new Date(), timezone);
    const start = weekKeys[0];
    const end = weekKeys[6];

    let activity: string[] = [];
    if (company.id) {
      try {
        activity = await getCompanyWeeklyActivity(company.id, start, end);
      } catch (activityErr: any) {
        console.error("[ACTIVITY_QUERY_ERROR]", activityErr.message);
        activity = [];
      }
    }

    return NextResponse.json({
      company: {
        ...company,
        activity
      },
      competition: {
        timezone,
        weekKeys
      }
    });
  } catch (error: any) {
    const errorName = error?.name || "UnknownError";
    const errorMessage = error?.message || "Internal Server Error";

    if (errorMessage === "AUTH_MISSING" || errorMessage === "AUTH_PROFILE_MISSING") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (errorMessage.includes("Forbidden")) {
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }

    console.error("[STATS_ERROR_FULL_STACK]", error);
    return NextResponse.json(
      {
        error: "Failed to fetch stats",
        message: errorMessage,
        type: errorName,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
