"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Nav } from "@/components/Nav";
import { authorizedFetch } from "@/lib/api-client";
import { clientDb } from "@/lib/firebase-client";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { useRouter } from "next/navigation";
import { clientAuth } from "@/lib/firebase-client";
import { onAuthStateChanged } from "firebase/auth";

interface PendingBestPractice {
  id: string;
  companyId: string;
  message: string;
  createdAt: string;
}

export default function AdminPage() {
  const [activationMessage, setActivationMessage] = useState("");
  const [pending, setPending] = useState<PendingBestPractice[]>([]);
  const [reviewMessage, setReviewMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(clientAuth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const res = await authorizedFetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user.role !== "admin") {
            router.push("/");
          }
        } else {
          router.push("/");
        }
      } catch (err) {
        router.push("/");
      }
    });
    return () => unsub();
  }, [router]);

  async function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      startAt: new Date(String(form.get("startAt"))).toISOString(),
      endAt: new Date(String(form.get("endAt"))).toISOString(),
      timezone: String(form.get("timezone")),
      rulesVersion: "v1"
    };

    const res = await authorizedFetch("/api/admin/competition/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setActivationMessage(res.ok ? "Competition activated." : data.error || "Activation failed");
  }

  async function reviewBestPractice(id: string, status: "approved" | "rejected") {
    const res = await authorizedFetch(`/api/admin/best-practices/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    setReviewMessage(res.ok ? `Best practice ${status}.` : data.error || "Review failed");
  }

  useEffect(() => {
    const q = query(collection(clientDb, "bestPractices"), where("status", "==", "pending"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPending(snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<PendingBestPractice, "id">) })));
      },
      () => { }
    );

    return () => unsub();
  }, []);

  return (
    <main className="page">
      <Nav />
      <div className="grid">
        <section className="card" style={{ gridColumn: "span 6" }}>
          <p className="section-title">Admin</p>
          <h1 className="page-title">Activate Competition</h1>
          <form onSubmit={activate}>
            <p><label>Start</label><input name="startAt" type="datetime-local" required /></p>
            <p><label>End</label><input name="endAt" type="datetime-local" required /></p>
            <p><label>Timezone (IANA)</label><input name="timezone" defaultValue="America/New_York" required /></p>
            <button type="submit">Activate</button>
          </form>
          {activationMessage ? <p className="subtitle">{activationMessage}</p> : null}
        </section>

        <section className="card" style={{ gridColumn: "span 6" }}>
          <p className="section-title">Best Practice Moderation</p>
          <h2 style={{ marginTop: 0 }}>Pending Submissions</h2>
          {pending.length === 0 ? <p className="subtitle">No pending submissions.</p> : null}
          <div style={{ display: "grid", gap: 10 }}>
            {pending.map((item) => (
              <article key={item.id} className="quote">
                <p style={{ margin: 0 }}>{item.message}</p>
                <small>Company: {item.companyId}</small>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button type="button" onClick={() => reviewBestPractice(item.id, "approved")}>Approve</button>
                  <button type="button" onClick={() => reviewBestPractice(item.id, "rejected")}>Reject</button>
                </div>
              </article>
            ))}
          </div>
          {reviewMessage ? <p className="subtitle">{reviewMessage}</p> : null}
        </section>
      </div>
    </main>
  );
}
