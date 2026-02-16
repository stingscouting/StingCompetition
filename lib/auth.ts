import { headers } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { UserProfile } from "@/lib/types";

export async function requireUser(): Promise<UserProfile> {
  const authHeader = (await headers()).get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.slice("Bearer ".length);
  const decoded = await adminAuth.verifyIdToken(token);
  const userId = decoded.uid;

  const userDoc = await adminDb.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    throw new Error("User profile missing");
  }

  return { id: userId, ...(userDoc.data() as Omit<UserProfile, "id">) };
}

export function assertAdmin(user: UserProfile): void {
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }
}

export function assertParticipant(user: UserProfile): void {
  if (user.role !== "participant") {
    throw new Error("Forbidden");
  }
}
