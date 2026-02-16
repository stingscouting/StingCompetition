"use client";

import { useState, useEffect, type FormEvent } from "react";
import { authorizedFetch } from "@/lib/api-client";

type ModalView = "choice" | "meeting" | "practice";

export function SubmissionModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<ModalView>("choice");
    const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
    const [loading, setLoading] = useState(false);
    const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);

    const [role, setRole] = useState<string>("participant");

    useEffect(() => {
        (window as any).showSubmissionModal = async () => {
            setIsOpen(true);
            setView("choice");
            setMessage(null);
            setUnlockedBadges([]);

            // Fetch latest user role
            try {
                const res = await authorizedFetch("/api/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    setRole(data.user.role);
                }
            } catch (err) { }
        };
        return () => { delete (window as any).showSubmissionModal; };
    }, []);

    if (!isOpen) return null;

    const isGuest = role === "guest";

    async function handleMeeting(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const form = new FormData(e.currentTarget);
        const mDate = form.get("meetingTime") ? new Date(String(form.get("meetingTime"))).toISOString() : new Date().toISOString();

        const res = await authorizedFetch("/api/meetings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prospectCompanyName: form.get("prospect"),
                contactName: form.get("contact") || "Unknown",
                meetingAt: mDate,
                durationMinutes: Number(form.get("duration")),
                type: form.get("type"),
            }),
        });
        setLoading(false);
        if (res.ok) {
            const data = await res.json();
            const newBadges = data.newAchievements || [];

            if (newBadges.length > 0) {
                setUnlockedBadges(newBadges);
                setMessage({ text: `🏆 New Badge: ${newBadges.join(", ")}!`, isError: false });
            } else {
                setMessage({ text: "✅ Meeting submitted successfully!", isError: false });
            }

            // Trigger automatic refresh on dashboard
            window.dispatchEvent(new CustomEvent("meeting:submitted"));
            setTimeout(() => setIsOpen(false), newBadges.length > 0 ? 3000 : 1500);
        } else {
            const data = await res.json();
            let errorText = data.error || "Submission failed";
            if (data.details) {
                errorText += ` (Meeting: ${new Date(data.details.meeting).toLocaleTimeString()} | Window: ${new Date(data.details.start).toLocaleTimeString()} - ${new Date(data.details.end).toLocaleTimeString()})`;
            }
            setMessage({ text: errorText, isError: true });
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
            const data = await res.json();
            if (data.shieldRestored) {
                setMessage({ text: "🏆 Streak Restored! (Shield Consumed)", isError: false });
            } else {
                setMessage({ text: "🚀 Insight shared! Tip posted.", isError: false });
            }
            // Trigger automatic refresh
            window.dispatchEvent(new CustomEvent("meeting:submitted"));
            setTimeout(() => setIsOpen(false), data.shieldRestored ? 3000 : 1500);
        } else {
            const data = await res.json();
            setMessage({ text: data.error || "Submission failed", isError: true });
        }
    }

    return (
        <div className="modal-overlay" onClick={() => !loading && setIsOpen(false)} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
        }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                width: '100%',
                maxWidth: '440px',
                background: '#111',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                padding: '32px',
                boxShadow: '0 20px 80px rgba(0,0,0,0.5)',
                position: 'relative'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>
                        {view === "choice" ? "Submit Your Win" : view === "meeting" ? "Submit Meeting" : "Share Insight"}
                    </h2>
                    <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer' }}>×</button>
                </div>

                {message && (
                    <div style={{ marginBottom: 16, padding: '12px', borderRadius: '8px', background: message.isError ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,157,0.1)', color: message.isError ? '#ff4444' : 'var(--accent-mint)', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}>
                        {message.text}
                    </div>
                )}

                {isGuest && (
                    <div style={{ marginBottom: 24, padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', textAlign: 'center', fontSize: '13px' }}>
                        <div style={{ fontSize: '24px', marginBottom: 8 }}>👀</div>
                        <strong>Read-Only Access</strong>
                        <p style={{ margin: '4px 0 0', opacity: 0.8 }}>Only Company Admins can log activities.</p>
                    </div>
                )}

                {view === "choice" ? (
                    <div className="submission-selector" style={{ opacity: isGuest ? 0.5 : 1, pointerEvents: isGuest ? 'none' : 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <button className="choice-card" onClick={() => !isGuest && setView("meeting")} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: '16px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%'
                        }}>
                            <div className="choice-icon-circle meeting-icon" style={{ fontSize: '24px' }}>🤝</div>
                            <div className="choice-info">
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Submit a Meeting</h3>
                            </div>
                        </button>

                        <button className="choice-card" onClick={() => !isGuest && setView("practice")} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: '16px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%'
                        }}>
                            <div className="choice-icon-circle practice-icon" style={{ fontSize: '24px' }}>💡</div>
                            <div className="choice-info">
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Share Best Practice</h3>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Share a tip and unlock your Streak Shield</p>
                            </div>
                        </button>
                    </div>
                ) : view === "meeting" ? (
                    <form onSubmit={handleMeeting} className="premium-form">
                        <div className="input-group">
                            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Prospect Company Name</label>
                            <input name="prospect" required placeholder="" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '12px', color: '#fff', fontSize: '14px' }} />
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Date and Time of Meeting</label>
                            <input
                                name="meetingTime"
                                type="datetime-local"
                                required
                                defaultValue={new Date().toISOString().slice(0, 16)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    colorScheme: 'dark' // Ensures the native calendar matches the dark theme
                                }}
                            />
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
                                    <option value="in person">In Person</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                            <button type="button" onClick={() => setView("choice")} className="secondary-btn" style={{ flex: 1, padding: '12px' }}>Back</button>
                            <button type="submit" className="submit-btn" disabled={loading} style={{ flex: 2 }}>
                                {loading ? "Submitting..." : "Confirm Meeting"}
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
