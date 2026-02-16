"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clientAuth } from "@/lib/firebase-client";
import { onAuthStateChanged } from "firebase/auth";

export function Nav() {
  const pathname = usePathname();
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has a registered company
    const checkRegistration = () => {
      const companyId = localStorage.getItem("companyId");
      setIsRegistered(!!companyId);
    };

    checkRegistration();
    // Also listen for auth changes
    const unsub = onAuthStateChanged(clientAuth, (user) => {
      if (user) setIsRegistered(true);
      else checkRegistration();
    });
    return () => unsub();
  }, []);

  const handleOpenModal = () => {
    if (typeof window !== "undefined" && (window as any).showSubmissionModal) {
      (window as any).showSubmissionModal();
    }
  };

  // If we haven't checked yet, render a skeleton or nothing to avoid flicker
  if (isRegistered === null) return <nav className="modern-bottom-nav" style={{ height: '80px' }}></nav>;

  return (
    <nav className="modern-bottom-nav" style={{
      justifyContent: isRegistered ? 'space-between' : 'center'
    }}>
      <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <span>LEADERBOARD</span>
      </Link>

      {isRegistered && (
        <>
          <Link href="/my-company" className={`nav-item ${pathname === '/my-company' ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>MY COMPANY</span>
          </Link>

          <button className="central-fab" onClick={handleOpenModal}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <Link href="/rules" className={`nav-item ${pathname === '/rules' ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>RULES</span>
          </Link>

          <Link href="/admin" className={`nav-item ${pathname === '/admin' ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>ADMIN</span>
          </Link>
        </>
      )}
    </nav>
  );
}
