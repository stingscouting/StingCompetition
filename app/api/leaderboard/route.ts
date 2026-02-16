import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  const snap = await adminDb.collection("companies").orderBy("rank", "asc").get();
  const companies = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ companies });
}
