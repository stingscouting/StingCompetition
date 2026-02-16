"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clientAuth } from "@/lib/firebase-client";
import { onAuthStateChanged } from "firebase/auth";
import { authorizedFetch } from "@/lib/api-client";
import type { UserRole } from "@/lib/types";

export function Nav() {
  const pathname = usePathname();
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [role, setRole] = useState<UserRole>("participant");

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // Check if user has a registered company
    const checkRegistration = async () => {
      const companyId = localStorage.getItem("companyId");
      setIsRegistered(!!companyId);

      try {
        const res = await authorizedFetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setRole(data.user.role);
          setProfile(data.user);
          setIsRegistered(true);
          if (data.user.companyId) {
            localStorage.setItem("companyId", data.user.companyId);
          }
        }
      } catch (err) {
        // Silently fail if not authenticated
      }
    };

    checkRegistration();
    // Also listen for auth changes
    const unsub = onAuthStateChanged(clientAuth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Update idToken when auth changes
        currentUser.getIdToken().then(token => {
          localStorage.setItem("idToken", token);
          checkRegistration();
        });
      } else {
        localStorage.removeItem("idToken");
        localStorage.removeItem("companyId");
        setIsRegistered(false);
        setRole("participant");
        setShowMenu(false);
      }
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    await clientAuth.signOut();
    localStorage.removeItem("idToken");
    localStorage.removeItem("companyId");
    window.location.href = "/";
  };

  const handleOpenModal = () => {
    if (typeof window !== "undefined" && (window as any).showSubmissionModal) {
      (window as any).showSubmissionModal();
    }
  };

  // If we haven't checked yet, render a skeleton or nothing to avoid flicker
  if (isRegistered === null) return null;

  return (
    <>
      {/* Top Profile Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
        pointerEvents: 'none'
      }}>
        {user ? (
          <div style={{ position: 'relative', pointerEvents: 'auto' }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--accent-mint)',
                color: '#000',
                border: 'none',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(0, 255, 157, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {user.email?.[0].toUpperCase() || 'U'}
            </button>

            {showMenu && (
              <div style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                background: '#111',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '8px',
                width: '180px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                zIndex: 1001
              }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800 }}>SIGNED IN AS</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                  {profile?.companyName && (
                    <div style={{ fontSize: '11px', color: 'var(--accent-mint)', fontWeight: 700, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profile.companyName}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    color: '#ff4444',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/register"
            style={{
              pointerEvents: 'auto',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '6px 16px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-mint)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            SIGN IN
          </Link>
        )}
      </div>

      <nav className="modern-bottom-nav">
        {/* Slot 1: Leaderboard */}
        <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>LEADERBOARD</span>
        </Link>

        {isRegistered ? (
          <>
            {/* Slot 2: Placeholder for balance */}
            <div className="nav-placeholder" style={{ pointerEvents: 'none' }} />

            {/* Slot 3: My Company (Exactly in the middle) */}
            <Link href="/my-company" className={`nav-item ${pathname === '/my-company' ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>MY COMPANY</span>
            </Link>

            {/* FAB elevated in center */}
            <button className="central-fab" onClick={handleOpenModal} aria-label="Submit Win">+</button>

            {/* Slot 4: Admin (if present) or Placeholder */}
            {role === "admin" ? (
              <Link href="/admin" className={`nav-item ${pathname === '/admin' ? 'active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>ADMIN</span>
              </Link>
            ) : (
              <div className="nav-placeholder" style={{ pointerEvents: 'none' }} />
            )}

            {/* Slot 5: Rules (Strictly at the end) */}
            <Link href="/rules" className={`nav-item ${pathname === '/rules' ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>RULES</span>
            </Link>
          </>
        ) : (
          <div style={{ gridColumn: 'span 5' }} />
        )}
      </nav>
    </>
  );
}
