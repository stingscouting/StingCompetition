"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authorizedFetch } from "@/lib/api-client";
import { Nav } from "@/components/Nav";
import { clientAuth } from "@/lib/firebase-client";
import {
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
    User
} from "firebase/auth";

export default function RegisterPage() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Email Auth State
    const [email, setEmail] = useState("");
    const [emailSent, setEmailSent] = useState(false);

    const router = useRouter();

    useEffect(() => {
        // Check for email link sign-in match
        if (isSignInWithEmailLink(clientAuth, window.location.href)) {
            let emailForSignIn = window.localStorage.getItem('emailForSignIn');
            if (!emailForSignIn) {
                emailForSignIn = window.prompt('Please provide your email for confirmation');
            }
            if (emailForSignIn) {
                signInWithEmailLink(clientAuth, emailForSignIn, window.location.href)
                    .then(() => {
                        window.localStorage.removeItem('emailForSignIn');
                        // User will be updated by onAuthStateChanged
                    })
                    .catch((err) => setError(err.message));
            }
        }

        const unsubscribe = onAuthStateChanged(clientAuth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    async function handleGoogleSignIn() {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(clientAuth, provider);
        } catch (err: any) {
            setError(err.message || "Google sign-in failed");
        }
    }

    async function handleEmailLinkSignIn(e: FormEvent) {
        e.preventDefault();
        try {
            await sendSignInLinkToEmail(clientAuth, email, {
                url: window.location.href,
                handleCodeInApp: true,
            });
            window.localStorage.setItem('emailForSignIn', email);
            setEmailSent(true);
        } catch (err: any) {
            setError(err.message || "Failed to send sign-in link");
        }
    }

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!user) {
            setError("You must be signed in to register.");
            return;
        }

        setLoading(true);
        setError("");

        const form = new FormData(event.currentTarget);
        const payload = {
            companyName: String(form.get("companyName") || ""),
            notificationEmail: String(form.get("notificationEmail") || ""),
            userName: String(form.get("userName") || ""),
            website: String(form.get("website") || "")
        };

        try {
            const res = await authorizedFetch("/api/register/company", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push("/my-company"), 2000);
            } else {
                setError(data.error || "Registration failed");
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    if (authLoading) {
        return (
            <main className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ color: 'var(--text-muted)' }}>Loading authentication...</div>
            </main>
        );
    }

    if (success) {
        return (
            <main className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card glow" style={{ textAlign: 'center', padding: '48px 32px' }}>
                    <div style={{ fontSize: '48px', marginBottom: 24 }}>✅</div>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: 16, color: 'var(--accent-mint)' }}>
                        REGISTRATION COMPLETE
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
                        Your company profile has been created successfully.
                    </p>
                    <div className="live-indicator" style={{ display: 'inline-flex' }}>
                        REDIRECTING TO DASHBOARD...
                    </div>
                </div>
                <Nav />
            </main>
        );
    }

    return (
        <main className="page" style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 120 }}>
            <header style={{ marginBottom: 40, borderBottom: '1px solid var(--border)', paddingBottom: 24 }}>
                <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    REGISTER
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: 4, fontWeight: 500 }}>
                    Join Sting Sales Competition
                </p>
            </header>

            {!user ? (
                <section className="card glow">
                    <h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: 24, color: '#fff' }}>Access Required</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '14px' }}>
                        You need to sign in verified account before registering your company.
                    </p>

                    <button
                        onClick={handleGoogleSignIn}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: '#fff',
                            color: '#000',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: 700,
                            marginBottom: 24,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 12
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                        Sign in with Google
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                        <div style={{ height: 1, flexGrow: 1, background: 'var(--border)' }}></div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>OR USE EMAIL</span>
                        <div style={{ height: 1, flexGrow: 1, background: 'var(--border)' }}></div>
                    </div>

                    {!emailSent ? (
                        <form onSubmit={handleEmailLinkSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                required
                                style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', color: '#fff', fontSize: '15px' }}
                            />
                            <button
                                type="submit"
                                style={{
                                    padding: '16px',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                Send Login Link
                            </button>
                        </form>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(0, 255, 157, 0.1)', borderRadius: '12px', color: 'var(--accent-mint)' }}>
                            <div style={{ fontSize: '24px', marginBottom: 8 }}>📧</div>
                            <p style={{ fontWeight: 600 }}>Check your inbox!</p>
                            <p style={{ fontSize: '12px', opacity: 0.8 }}>We sent a secure link to {email}</p>
                        </div>
                    )}

                    {error && (
                        <div style={{ padding: '12px', marginTop: 24, background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.2)', borderRadius: '8px', color: '#ff4444', fontSize: '13px', fontWeight: 600 }}>
                            {error}
                        </div>
                    )}
                </section>
            ) : (
                <section className="card glow">
                    <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>SIGNED IN AS</div>
                            <div style={{ color: '#fff', fontWeight: 500 }}>{user.email}</div>
                        </div>
                        <button
                            onClick={() => clientAuth.signOut()}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer' }}
                        >
                            Change Account
                        </button>
                    </div>

                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div className="input-group">
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.05em' }}>
                                YOUR NAME
                            </label>
                            <input
                                name="userName"
                                required
                                placeholder="e.g. Sarah Jenkins"
                                defaultValue={user.displayName || ""}
                                style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', color: '#fff', fontSize: '15px' }}
                            />
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.05em' }}>
                                COMPANY NAME
                            </label>
                            <input
                                name="companyName"
                                required
                                placeholder="e.g. CloudScale AI"
                                style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', color: '#fff', fontSize: '15px' }}
                            />
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.05em' }}>
                                COMPANY WEBSITE
                            </label>
                            <input
                                name="website"
                                type="url"
                                required
                                placeholder="e.g. https://cloudscale.ai"
                                style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', color: '#fff', fontSize: '15px' }}
                            />
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.05em' }}>
                                NOTIFICATION EMAIL
                            </label>
                            <input
                                name="notificationEmail"
                                type="email"
                                required
                                placeholder="e.g. sarah@cloudscale.ai"
                                defaultValue={user.email || ""}
                                style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', color: '#fff', fontSize: '15px' }}
                            />
                        </div>

                        {error && (
                            <div style={{ padding: '12px', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.2)', borderRadius: '8px', color: '#ff4444', fontSize: '13px', fontWeight: 600 }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: 12,
                                padding: '18px',
                                background: 'var(--accent-mint)',
                                color: '#000',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: 900,
                                letterSpacing: '0.02em',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: loading ? 0.6 : 1,
                                boxShadow: '0 4px 20px rgba(0, 255, 157, 0.2)'
                            }}
                        >
                            {loading ? 'INITIALIZING...' : 'CREATE ACCESS'}
                        </button>
                    </form>
                </section>
            )}

            <div style={{ marginTop: 40, textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    Already have a team? <a href="/" style={{ color: 'var(--accent-mint)', textDecoration: 'none', fontWeight: 700 }}>Go to Leaderboard</a>
                </p>
            </div>
            <Nav />
        </main>
    );
}
