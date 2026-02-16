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
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    User
} from "firebase/auth";

export default function RegisterPage() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [success, setSuccess] = useState(false);

    // Email Auth State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [usePassword, setUsePassword] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const router = useRouter();

    useEffect(() => {
        // ... (rest of useEffect)
        // Check for email link sign-in match
        if (isSignInWithEmailLink(clientAuth, window.location.href)) {
            const emailForSignIn = window.localStorage.getItem('emailForSignIn') || "";
            signInWithEmailLink(clientAuth, emailForSignIn, window.location.href)
                .then(() => {
                    window.localStorage.removeItem('emailForSignIn');
                })
                .catch((err) => {
                    // If email is missing, we could prompt, but the user wants to avoid it.
                    // Instead, we'll let it fail or the user can sign in again if needed.
                    console.error("Link sign-in error:", err);
                    setError("Sign-in link expired or invalid email. Please try again.");
                });
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

    async function handleForgotPassword() {
        if (!email) {
            setError("Please enter your email address first.");
            return;
        }
        try {
            setLoading(true);
            setError("");
            setStatusMessage("");
            await sendPasswordResetEmail(clientAuth, email);
            setStatusMessage("Password reset email sent! Please check your inbox (and spam folder).");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handlePasswordAuth(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        setStatusMessage("");
        try {
            if (isRegistering) {
                // Register
                try {
                    await createUserWithEmailAndPassword(clientAuth, email, password);
                } catch (regErr: any) {
                    if (regErr.code === "auth/email-already-in-use") {
                        setError("Account exists. Sign in or reset password.");
                    } else {
                        setError(regErr.message);
                    }
                    setLoading(false);
                    return;
                }
            } else {
                // Login
                await signInWithEmailAndPassword(clientAuth, email, password);
            }

            // Check if registered in Firestore
            const res = await authorizedFetch("/api/auth/me");
            if (res.ok) {
                const data = await res.json();
                if (data.user?.companyId) {
                    localStorage.setItem("companyId", data.user.companyId);
                    router.push("/my-company");
                    return;
                }
            }
            // User logged in but no company profile found, continue to step 2
        } catch (err: any) {
            if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
                setError("Invalid email or password. Please try again or create an account.");
            } else if (err.code === "auth/wrong-password") {
                setError("Incorrect password. Try again or use 'Forgot Password'.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
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
            userName: String(form.get("userName") || ""),
            website: String(form.get("website") || ""),
            role: String(form.get("role") || "participant")
        };

        try {
            const res = await authorizedFetch("/api/register/company", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                if (data.companyId) {
                    localStorage.setItem("companyId", data.companyId);
                }
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
                    Create your competition profile in 2 easy steps
                </p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {/* Step 1: Authentication */}
                <section className={`card glow ${user ? 'completed' : 'active'}`} style={{ opacity: user ? 0.7 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: user ? 'var(--accent-mint)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, color: user ? '#000' : '#fff' }}>
                            {user ? '✓' : '1'}
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#fff' }}>Verify Identity</h2>
                    </div>

                    {!user ? (
                        <>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '14px' }}>
                                Sign in to link your account to your company profile.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                                <div style={{ height: 1, flexGrow: 1, background: 'var(--border)' }}></div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>EMAIL & PASSWORD</span>
                                <div style={{ height: 1, flexGrow: 1, background: 'var(--border)' }}></div>
                            </div>

                            <form onSubmit={handlePasswordAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    required
                                    style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', color: '#fff', fontSize: '15px' }}
                                />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    required
                                    style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', color: '#fff', fontSize: '15px' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent-mint)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                                {error && (
                                    <div style={{ padding: '12px', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.2)', borderRadius: '8px', color: '#ff4444', fontSize: '13px', fontWeight: 600 }}>
                                        {error}
                                    </div>
                                )}
                                {statusMessage && (
                                    <div style={{ padding: '12px', background: 'rgba(0, 255, 157, 0.1)', border: '1px solid rgba(0, 255, 157, 0.2)', borderRadius: '8px', color: 'var(--accent-mint)', fontSize: '13px', fontWeight: 600 }}>
                                        {statusMessage}
                                    </div>
                                )}
                                <button type="submit" disabled={loading} style={{ padding: '16px', background: 'var(--accent-mint)', color: '#000', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 20px rgba(0, 255, 157, 0.2)' }}>
                                    {loading ? 'AUTHENTICATING...' : isRegistering ? 'CREATE ACCOUNT' : 'SIGN IN'}
                                </button>
                                <div style={{ textAlign: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsRegistering(!isRegistering);
                                            setError("");
                                        }}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent-mint)', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}
                                    >
                                        {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Create Account"}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>VERIFIED ACCOUNT</div>
                                <div style={{ color: 'var(--accent-mint)', fontWeight: 700 }}>{user.email}</div>
                            </div>
                            <button onClick={() => clientAuth.signOut()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>Change</button>
                        </div>
                    )}
                </section>

                {/* Step 2: Company Details */}
                <section className={`card glow ${user ? 'active' : ''}`} style={{ opacity: user ? 1 : 0.4, pointerEvents: user ? 'auto' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: user ? 'var(--accent-mint)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, color: user ? '#000' : '#fff' }}>
                            2
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#fff' }}>Company Profile</h2>
                    </div>

                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div className="input-group">
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.05em' }}>YOUR NAME</label>
                            <input name="userName" required placeholder="e.g. Sarah Jenkins" defaultValue={user?.displayName || ""} style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', color: '#fff', fontSize: '15px' }} />
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.05em' }}>COMPANY NAME</label>
                            <input name="companyName" required placeholder="e.g. CloudScale AI" style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', color: '#fff', fontSize: '15px' }} />
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.05em' }}>COMPANY WEBSITE</label>
                            <input name="website" type="url" required placeholder="https://..." style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', color: '#fff', fontSize: '15px' }} />
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.05em' }}>YOUR ROLE</label>
                            <div style={{ display: 'flex', gap: 16 }}>
                                <label style={{ flex: 1, cursor: 'pointer' }}>
                                    <input type="radio" name="role" value="participant" defaultChecked style={{ display: 'none' }} id="role-admin" />
                                    <div className="role-card" onClick={() => (document.getElementById('role-admin') as any).click()}>
                                        <div style={{ fontWeight: 700, fontSize: '14px' }}>Company Admin</div>
                                        <div style={{ fontSize: '11px', opacity: 0.6 }}>Full submission power</div>
                                    </div>
                                </label>
                                <label style={{ flex: 1, cursor: 'pointer' }}>
                                    <input type="radio" name="role" value="guest" style={{ display: 'none' }} id="role-guest" />
                                    <div className="role-card" onClick={() => (document.getElementById('role-guest') as any).click()}>
                                        <div style={{ fontWeight: 700, fontSize: '14px' }}>Company Guest</div>
                                        <div style={{ fontSize: '11px', opacity: 0.6 }}>View access only</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {error && (
                            <div style={{ padding: '12px', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.2)', borderRadius: '8px', color: '#ff4444', fontSize: '13px', fontWeight: 600 }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !user}
                            style={{ marginTop: 12, padding: '18px', background: user ? 'var(--accent-mint)' : 'rgba(255,255,255,0.1)', color: user ? '#000' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 900, cursor: user ? 'pointer' : 'default', transition: 'all 0.2s ease', boxShadow: user ? '0 4px 20px rgba(0, 255, 157, 0.2)' : 'none' }}
                        >
                            {loading ? 'PROCESSING...' : user ? 'COMPLETE REGISTRATION' : 'FINISH STEP 1 FIRST'}
                        </button>
                    </form>
                </section>
            </div>

            <style jsx>{`
                .role-card {
                    padding: 16px;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    background: rgba(255,255,255,0.03);
                    transition: all 0.2s ease;
                    text-align: center;
                }
                input[type="radio"]:checked + .role-card {
                    border-color: var(--accent-mint);
                    background: rgba(0, 255, 157, 0.05);
                    color: var(--accent-mint);
                }
            `}</style>

            <div style={{ marginTop: 40, textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    Already have a team? <a href="/" style={{ color: 'var(--accent-mint)', textDecoration: 'none', fontWeight: 700 }}>Go to Leaderboard</a>
                </p>
            </div>
            <Nav />
        </main>
    );
}
