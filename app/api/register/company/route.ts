import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getDomainFromUrl } from "@/lib/validation";

const registerSchema = z.object({
  companyName: z.string().trim().min(2),
  userName: z.string().trim().min(2),
  website: z.string().trim().url().optional().or(z.literal("")),
  role: z.enum(["participant", "guest"]).optional()
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

    // Check if user already has a company by UID or Email
    const existingUserByUid = await adminDb.collection("users").doc(uid).get();
    if (existingUserByUid.exists && existingUserByUid.data()?.companyId) {
      return NextResponse.json({ error: "This account is already registered to a company. Please log in instead." }, { status: 409 });
    }

    const existingUserByEmail = await adminDb.collection("users").where("email", "==", email).limit(1).get();
    if (!existingUserByEmail.empty && existingUserByEmail.docs[0].data()?.companyId) {
      return NextResponse.json({ error: "This email is already linked to a company profile. Please log in." }, { status: 409 });
    }

    const normalizedName = parsed.data.companyName.trim().toLowerCase();
    const nameSnap = await adminDb.collection("companies").where("nameNormalized", "==", normalizedName).limit(1).get();
    if (!nameSnap.empty) {
      return NextResponse.json({ error: "A company with this name is already registered" }, { status: 409 });
    }

    const domain = parsed.data.website ? getDomainFromUrl(parsed.data.website) : "";
    const companyRef = adminDb.collection("companies").doc();

    const existingUserRef = adminDb.collection("users").doc(uid);
    await adminDb.runTransaction(async (tx) => {
      // Extract domain for favicon
      let logoUrl = "";
      if (parsed.data.website) {
        try {
          logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        } catch (e) {
          // Fallback if URL is invalid
        }
      }

      tx.set(companyRef, {
        name: parsed.data.companyName,
        nameNormalized: normalizedName,
        totalPoints: 0,
        totalValidMeetings: 0,
        streakCount: 0,
        shieldAvailable: false,
        shieldUsed: false,
        subscribed: true,
        website: parsed.data.website || "",
        logoUrl: logoUrl,
        domain: domain,
        disqualified: false,
        rank: 0,
        createdAt: new Date().toISOString()
      });

      tx.set(existingUserRef, {
        name: parsed.data.userName,
        email,
        role: parsed.data.role || "participant",
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
