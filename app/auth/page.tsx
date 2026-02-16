"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function sendLink(event: FormEvent) {
    event.preventDefault();
    await sendSignInLinkToEmail(clientAuth, email, {
      url: `${window.location.origin}/auth`,
      handleCodeInApp: true
    });
    localStorage.setItem("emailForSignIn", email);
    setMessage("Sign-in link sent. Check your inbox.");
  }

  useEffect(() => {
    const href = window.location.href;
    if (!isSignInWithEmailLink(clientAuth, href)) return;

    const cachedEmail = localStorage.getItem("emailForSignIn") || window.prompt("Confirm email");
    if (!cachedEmail) return;

    signInWithEmailLink(clientAuth, cachedEmail, href)
      .then(async (cred) => {
        const token = await cred.user.getIdToken();
        localStorage.setItem("idToken", token);
        localStorage.setItem("emailForSignIn", cred.user.email || cachedEmail);
        setMessage("Authenticated. Continue to company registration if needed.");
      })
      .catch(() => setMessage("Authentication failed."));
  }, []);

  return (
    <main className="page" style={{ maxWidth: 760 }}>
      <section className="card glow">
        <p className="section-title">Step 1</p>
        <h1 className="page-title">Sign In</h1>
        <p className="subtitle">Use your work email. Access is passwordless via secure email link.</p>

        <form onSubmit={sendLink} style={{ marginTop: 14 }}>
          <p><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></p>
          <button type="submit">Send Sign-In Link</button>
        </form>

        {message ? <p className="subtitle">{message}</p> : null}

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <Link href="/register-company" className="pill">Next: Register Company</Link>
          <Link href="/" className="pill">Go to Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
