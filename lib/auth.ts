import { headers } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { UserProfile } from "@/lib/types";

export async function requireUser(): Promise<UserProfile> {
  const authHeader = (await headers()).get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("AUTH_MISSING");
  }

  const token = authHeader.slice("Bearer ".length);
  const decoded = await adminAuth.verifyIdToken(token);
  const userId = decoded.uid;
  const email = decoded.email;

  const userDoc = await adminDb.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    throw new Error("AUTH_PROFILE_MISSING");
  }

  const userData = userDoc.data() as Omit<UserProfile, "id">;
  let companyName = "";

  if (userData.companyId) {
    const companyDoc = await adminDb.collection("companies").doc(userData.companyId).get();
    if (companyDoc.exists) {
      companyName = (companyDoc.data() as any).name || "";
    }
  }

  // Check if email is in admins collection
  let role = userData.role;
  if (email) {
    const adminDoc = await adminDb.collection("admins").doc(email).get();
    if (adminDoc.exists) {
      role = "admin";
    }
  }

  return { id: userId, ...userData, role, companyName };
}

export function assertAdmin(user: UserProfile): void {
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }
}

export function assertParticipant(user: UserProfile): void {
  if (user.role !== "participant" && user.role !== "guest") {
    throw new Error("Forbidden: Must be part of a company");
  }
}

export function assertCanSubmit(user: UserProfile): void {
  // System admins and Company Admins (participants) can submit
  if (user.role !== "admin" && user.role !== "participant") {
    throw new Error("Forbidden: Only Company Admins can submit information");
  }
}
