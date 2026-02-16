"use client";

import { useState, useEffect, type FormEvent } from "react";
import { authorizedFetch } from "@/lib/api-client";

type ModalView = "choice" | "meeting" | "practice";

export function SubmissionModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<ModalView>("choice");
    const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (window as any).showSubmissionModal = () => {
            setIsOpen(true);
            setView("choice");
            setMessage(null);
        };
        return () => { delete (window as any).showSubmissionModal; };
    }, []);

    if (!isOpen) return null;

    async function handleMeeting(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const form = new FormData(e.currentTarget);
        const res = await authorizedFetch("/api/meetings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prospectCompanyName: form.get("prospect"),
                contactName: form.get("contact") || "Unknown",
                meetingAt: new Date().toISOString(),
                durationMinutes: Number(form.get("duration")),
                type: form.get("type"),
            }),
        });
        setLoading(false);
        if (res.ok) {
            setMessage({ text: "✅ Meeting logged successfully!", isError: false });
            setTimeout(() => setIsOpen(false), 1500);
        } else {
            const data = await res.json();
            setMessage({ text: data.error || "Submission failed", isError: true });
        }
    }

    async function handlePractice(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const form = new FormData(e.currentTarget);
        const res = await authorizedFetch("/api/best-practices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: form.get("message") }),
        });
        setLoading(false);
        if (res.ok) {
            setMessage({ text: "🚀 Best practice shared!", isError: false });
            setTimeout(() => setIsOpen(false), 1500);
        } else {
            const data = await res.json();
            setMessage({ text: data.error || "Submission failed", isError: true });
        }
    }

    return (
        <div className="modal-overlay" onClick={() => !loading && setIsOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>
                        {view === "choice" ? "Log Your Win" : view === "meeting" ? "Log Meeting" : "Share Insight"}
                    </h2>
                    <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer' }}>×</button>
                </div>

                {message && (
                    <div style={{ marginBottom: 16, padding: '12px', borderRadius: '8px', background: message.isError ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,157,0.1)', color: message.isError ? '#ff4444' : 'var(--accent-mint)', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>
                        {message.text}
                    </div>
                )}

                {view === "choice" ? (
                    <div className="submission-selector">
                        <button className="choice-card" onClick={() => setView("meeting")}>
                            <div className="choice-icon-circle meeting-icon">🤝</div>
                            <div className="choice-info">
                                <h3>Log a Meeting</h3>
                                <p>Track a new prospect meeting (20+ min)</p>
                            </div>
                        </button>

                        <button className="choice-card" onClick={() => setView("practice")}>
                            <div className="choice-icon-circle practice-icon">💡</div>
                            <div className="choice-info">
                                <h3>Share Best Practice</h3>
                                <p>Share a tip and unlock your Streak Shield</p>
                            </div>
                        </button>
                    </div>
                ) : view === "meeting" ? (
                    <form onSubmit={handleMeeting} className="premium-form">
                        <div className="input-group">
                            <label>Prospect Company Name</label>
                            <input name="prospect" required placeholder="Startup name..." />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group">
                                <label>Duration</label>
                                <select name="duration" defaultValue="30">
                                    <option value="20">20 min</option>
                                    <option value="30">30 min</option>
                                    <option value="45">45 min</option>
                                    <option value="60">60 min</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Meeting Type</label>
                                <select name="type" defaultValue="digital">
                                    <option value="digital">Digital</option>
                                    <option value="physical">Physical</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                            <button type="button" onClick={() => setView("choice")} className="secondary-btn" style={{ flex: 1, padding: '12px' }}>Back</button>
                            <button type="submit" className="submit-btn" disabled={loading} style={{ flex: 2 }}>
                                {loading ? "Logging..." : "Confirm Meeting"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handlePractice} className="premium-form">
                        <div className="input-group">
                            <label>What worked today?</label>
                            <textarea name="message" required placeholder="Share a tip with the team..." rows={4} maxLength={240} />
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '-8px 0 16px' }}>
                            Sharing unlocks your <strong>Streak Shield</strong>.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button type="button" onClick={() => setView("choice")} className="secondary-btn" style={{ flex: 1, padding: '12px' }}>Back</button>
                            <button type="submit" className="submit-btn" disabled={loading} style={{ flex: 2 }}>
                                {loading ? "Sharing..." : "Post Tip"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
