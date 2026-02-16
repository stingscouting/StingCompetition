import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const registerSchema = z.object({
  companyName: z.string().trim().min(2),
  notificationEmail: z.string().trim().email(),
  userName: z.string().trim().min(2),
  website: z.string().trim().url().optional().or(z.literal(""))
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.slice("Bearer ".length);
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email;

    if (!email) {
      return NextResponse.json({ error: "Authenticated email is required" }, { status: 400 });
    }

    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const existingUserRef = adminDb.collection("users").doc(uid);
    const existingUserDoc = await existingUserRef.get();
    if (existingUserDoc.exists && existingUserDoc.data()?.companyId) {
      return NextResponse.json({ error: "User is already registered to a company" }, { status: 409 });
    }

    const companyRef = adminDb.collection("companies").doc();

    await adminDb.runTransaction(async (tx) => {
      // Extract domain for favicon
      let logoUrl = "";
      if (parsed.data.website) {
        try {
          const domain = new URL(parsed.data.website).hostname;
          logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        } catch (e) {
          // Fallback if URL is invalid
        }
      }

      tx.set(companyRef, {
        name: parsed.data.companyName,
        totalPoints: 0,
        totalValidMeetings: 0,
        streakCount: 0,
        shieldAvailable: false,
        shieldUsed: false,
        subscribed: true,
        notificationEmail: parsed.data.notificationEmail,
        website: parsed.data.website || "",
        logoUrl: logoUrl,
        disqualified: false,
        rank: 0,
        createdAt: new Date().toISOString()
      });

      tx.set(existingUserRef, {
        name: parsed.data.userName,
        email,
        role: "participant",
        companyId: companyRef.id
      }, { merge: true });
    });

    return NextResponse.json({ companyId: companyRef.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 400 }
    );
  }
}
