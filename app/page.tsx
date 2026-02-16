"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { clientAuth, clientDb } from "@/lib/firebase-client";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import type { Company } from "@/lib/types";

// Mock Data Fallback for Demo Purposes
const MOCK_COMPANIES: Company[] = [
  { id: "c1", name: "Sarah Jenkins", totalPoints: 242500, streakCount: 7, rank: 1, shieldAvailable: true, shieldUsed: false, totalValidMeetings: 24, subscribed: true, notificationEmail: "sarah@example.com", disqualified: false, achievements: [], lastBrokenStreak: 0 },
  { id: "c2", name: "Marcus Vance", totalPoints: 188200, streakCount: 4, rank: 2, shieldAvailable: true, shieldUsed: false, totalValidMeetings: 18, subscribed: true, notificationEmail: "marcus@example.com", disqualified: false, achievements: [], lastBrokenStreak: 0 },
  { id: "c3", name: "Elena Rodriguez", totalPoints: 156000, streakCount: 2, rank: 3, shieldAvailable: true, shieldUsed: false, totalValidMeetings: 15, subscribed: true, notificationEmail: "elena@example.com", disqualified: false, achievements: [], lastBrokenStreak: 0 },
  { id: "c4", name: "David Chen", totalPoints: 120000, streakCount: 1, rank: 4, shieldAvailable: true, shieldUsed: false, totalValidMeetings: 12, subscribed: true, notificationEmail: "david@example.com", disqualified: false, achievements: [], lastBrokenStreak: 0 },
  { id: "c5", name: "Team CloudScale", totalPoints: 95000, streakCount: 7, rank: 5, shieldAvailable: true, shieldUsed: false, totalValidMeetings: 9, subscribed: true, notificationEmail: "team@example.com", disqualified: false, achievements: [], lastBrokenStreak: 0 },
];

export default function ArenaDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const companiesQ = query(collection(clientDb, "companies"), orderBy("totalPoints", "desc"));
    const unsub = onSnapshot(companiesQ, (snap) => {
      setCompanies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(clientAuth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // Helper to get initials
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  // Helper to format handle
  const getHandle = (name: string) => `@${name.toLowerCase().replace(/\s+/g, '')}`;

  return (
    <main className="page" style={{
      padding: 0,
      maxWidth: '100%',
      background: '#000',
      minHeight: '100vh'
    }}>
      <Nav />
      {/* Top Atmospheric Section with Glow */}
      <div style={{
        position: 'relative',
        padding: '32px 16px 48px',
        overflow: 'hidden'
      }}>

        {/* Centered Clean Header */}
        <header style={{
          textAlign: 'center',
          marginBottom: 48,
          position: 'relative',
          zIndex: 1
        }}>
          <h1 style={{
            fontSize: '16px',
            fontWeight: 900,
            margin: 0,
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            opacity: 0.9
          }}>
            STING SALES COMPETITION
          </h1>
          {!user && !loading && (
            <div style={{ marginTop: 24 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: 12 }}>Viewing as Guest</p>
              <a
                href="/register"
                style={{
                  display: 'inline-block',
                  background: 'var(--accent-mint)',
                  color: '#000',
                  padding: '10px 24px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 900,
                  textDecoration: 'none',
                  boxShadow: '0 0 20px rgba(0, 255, 157, 0.4)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                JOIN THE COMPETITION
              </a>
            </div>
          )}
        </header>

        {/* Podium Layout */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: 24,
          marginTop: 20,
          position: 'relative',
          zIndex: 1,
          minHeight: 220
        }}>
          {/* Rank 2 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--accent-mint)', marginBottom: 16, letterSpacing: '0.1em' }}>RANK 2</div>
            <div style={{ position: 'relative', opacity: companies[1] ? 1 : 0.3 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', background: companies[1] ? 'var(--accent-mint)' : 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', fontWeight: 900, color: '#000', margin: '0 auto',
                boxShadow: companies[1] ? '0 0 20px rgba(0, 255, 157, 0.2)' : 'none',
                border: companies[1] ? 'none' : '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden'
              }}>
                {companies[1]?.logoUrl ? (
                  <img src={companies[1].logoUrl} alt={companies[1].name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  companies[1] ? getInitials(companies[1].name) : '-'
                )}
              </div>
              {companies[1] && (
                <div style={{ position: 'absolute', top: -4, right: -4, background: '#000', borderRadius: '50%', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00FF9D" strokeWidth="4">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </div>
              )}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', marginTop: 14, opacity: companies[1] ? 0.8 : 0.2 }}>{companies[1] ? getHandle(companies[1].name) : '---'}</div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-mint)', marginTop: 2, opacity: companies[1] ? 1 : 0.2 }}>{companies[1] ? companies[1].totalPoints.toLocaleString() : '0'}</div>
          </div>

          {/* Rank 1 */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: '32px', marginBottom: 8, filter: companies[0] ? 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.4))' : 'none', opacity: companies[0] ? 1 : 0.1 }}>👑</div>
            <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--accent-mint)', marginBottom: 16, letterSpacing: '0.1em' }}>RANK 1</div>
            <div style={{ position: 'relative', opacity: companies[0] ? 1 : 0.3 }}>
              <div style={{
                width: 104, height: 104, borderRadius: '50%', background: companies[0] ? 'var(--accent-mint)' : 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: 900, color: '#000', margin: '0 auto',
                boxShadow: companies[0] ? '0 0 40px rgba(0, 255, 157, 0.4)' : 'none',
                border: companies[0] ? 'none' : '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden'
              }}>
                {companies[0]?.logoUrl ? (
                  <img src={companies[0].logoUrl} alt={companies[0].name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  companies[0] ? getInitials(companies[0].name) : '-'
                )}
              </div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 900, color: '#fff', marginTop: 14, opacity: companies[0] ? 1 : 0.2 }}>{companies[0] ? getHandle(companies[0].name) : '---'}</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent-mint)', marginTop: 2, letterSpacing: '-0.02em', opacity: companies[0] ? 1 : 0.2 }}>{companies[0] ? companies[0].totalPoints.toLocaleString() : '0'}</div>
          </div>

          {/* Rank 3 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--accent-mint)', marginBottom: 16, letterSpacing: '0.1em' }}>RANK 3</div>
            <div style={{ position: 'relative', opacity: companies[2] ? 1 : 0.3 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', background: companies[2] ? 'var(--accent-mint)' : 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', fontWeight: 900, color: '#000', margin: '0 auto',
                boxShadow: companies[2] ? '0 0 20px rgba(0, 255, 157, 0.2)' : 'none',
                border: companies[2] ? 'none' : '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden'
              }}>
                {companies[2]?.logoUrl ? (
                  <img src={companies[2].logoUrl} alt={companies[2].name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  companies[2] ? getInitials(companies[2].name) : '-'
                )}
              </div>
              {companies[2] && (
                <div style={{ position: 'absolute', top: -4, right: -4, background: '#000', borderRadius: '50%', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="4">
                    <path d="M12 5v14M5 12l7 7 7-7" />
                  </svg>
                </div>
              )}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', marginTop: 14, opacity: companies[2] ? 0.8 : 0.2 }}>{companies[2] ? getHandle(companies[2].name) : '---'}</div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-mint)', marginTop: 2, opacity: companies[2] ? 1 : 0.2 }}>{companies[2] ? companies[2].totalPoints.toLocaleString() : '0'}</div>
          </div>
        </div>
      </div>

      {/* Rankings List Container */}
      <div style={{
        padding: '32px 16px 120px',
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '400px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Always render at least a few empty slots if total companies < 8 */}
          {Array.from({ length: Math.max(companies.length, 8) }).map((_, i) => {
            if (i < 3) return null;
            const c = companies[i];
            return (
              <div key={c?.id || `empty-${i}`} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 20px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(0, 255, 157, 0.15)',
                gap: 16,
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--accent-mint)', width: 24, letterSpacing: '0.05em' }}>#{i + 1}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: c ? 1 : 0.2 }}>
                  <div style={{ width: 12, display: 'flex', justifyContent: 'center' }}>
                    {c ? (i % 2 === 0 ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00FF9D" strokeWidth="4">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ff5c00" strokeWidth="4">
                        <path d="M12 5v14M5 12l7 7 7-7" />
                      </svg>
                    )) : null}
                  </div>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: c ? 'linear-gradient(135deg, var(--accent-mint) 0%, #00e5ff 100%)' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 900, color: '#000', overflow: 'hidden'
                  }}>
                    {c?.logoUrl ? (
                      <img src={c.logoUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      c ? getInitials(c.name) : '-'
                    )}
                  </div>
                </div>
                <div style={{ flexGrow: 1, opacity: c ? 1 : 0.2 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', letterSpacing: '0.01em' }}>{c ? getHandle(c.name) : '---'}</div>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--accent-mint)', textShadow: '0 0 10px rgba(0, 255, 157, 0.2)', opacity: c ? 1 : 0.2 }}>
                  {c ? c.totalPoints.toLocaleString() : '0'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
