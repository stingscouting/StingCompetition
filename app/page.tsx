"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { clientAuth, clientDb } from "@/lib/firebase-client";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import type { Company } from "@/lib/types";

// Mock Data Fallback for Demo Purposes
const MOCK_COMPANIES: Company[] = [
  { id: "c1", name: "Sarah Jenkins", totalPoints: 242500, streakCount: 7, rank: 1, shieldAvailable: true, shieldUsed: false, totalValidMeetings: 24, subscribed: true, notificationEmail: "sarah@example.com", disqualified: false },
  { id: "c2", name: "Marcus Vance", totalPoints: 188200, streakCount: 4, rank: 2, shieldAvailable: true, shieldUsed: false, totalValidMeetings: 18, subscribed: true, notificationEmail: "marcus@example.com", disqualified: false },
  { id: "c3", name: "Elena Rodriguez", totalPoints: 156000, streakCount: 2, rank: 3, shieldAvailable: true, shieldUsed: false, totalValidMeetings: 15, subscribed: true, notificationEmail: "elena@example.com", disqualified: false },
  { id: "c4", name: "David Chen", totalPoints: 120000, streakCount: 1, rank: 4, shieldAvailable: true, shieldUsed: false, totalValidMeetings: 12, subscribed: true, notificationEmail: "david@example.com", disqualified: false },
  { id: "c5", name: "Team CloudScale", totalPoints: 95000, streakCount: 7, rank: 5, shieldAvailable: true, shieldUsed: false, totalValidMeetings: 9, subscribed: true, notificationEmail: "team@example.com", disqualified: false },
];

export default function ArenaDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const companiesQ = query(collection(clientDb, "companies"), orderBy("totalPoints", "desc"));
    const unsub = onSnapshot(companiesQ, (snap) => {
      if (snap.empty) {
        setCompanies(MOCK_COMPANIES);
      } else {
        setCompanies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company)));
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const top3 = companies.slice(0, 3);
  const rest = companies.slice(3);

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
            Leaderboard
          </h1>
        </header>

        {/* Podium Layout */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: 24,
          marginTop: 20,
          position: 'relative',
          zIndex: 1
        }}>
          {/* Rank 2 */}
          {top3[1] && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#444', marginBottom: 16 }}>2</div>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', background: 'var(--accent-mint)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', fontWeight: 900, color: '#000', margin: '0 auto',
                  boxShadow: '0 0 20px rgba(0, 255, 157, 0.2)',
                  overflow: 'hidden'
                }}>
                  {top3[1].logoUrl ? (
                    <img src={top3[1].logoUrl} alt={top3[1].name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(top3[1].name)
                  )}
                </div>
                <div style={{ position: 'absolute', top: -4, right: -4, background: '#000', borderRadius: '50%', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00FF9D" strokeWidth="4">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', marginTop: 14, opacity: 0.8 }}>{getHandle(top3[1].name)}</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-mint)', marginTop: 2 }}>{top3[1].totalPoints.toLocaleString()}</div>
            </div>
          )}

          {/* Rank 1 */}
          {top3[0] && (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: '32px', marginBottom: 8, filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.4))' }}>👑</div>
              <div style={{ fontSize: '12px', fontWeight: 900, color: '#444', marginBottom: 16 }}>1</div>
              <div style={{
                width: 104, height: 104, borderRadius: '50%', background: 'var(--accent-mint)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: 900, color: '#000', margin: '0 auto',
                boxShadow: '0 0 40px rgba(0, 255, 157, 0.4)',
                overflow: 'hidden'
              }}>
                {top3[0].logoUrl ? (
                  <img src={top3[0].logoUrl} alt={top3[0].name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getInitials(top3[0].name)
                )}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 900, color: '#fff', marginTop: 14 }}>{getHandle(top3[0].name)}</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent-mint)', marginTop: 2, letterSpacing: '-0.02em' }}>{top3[0].totalPoints.toLocaleString()}</div>
            </div>
          )}

          {/* Rank 3 */}
          {top3[2] && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#444', marginBottom: 16 }}>3</div>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', background: 'var(--accent-mint)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', fontWeight: 900, color: '#000', margin: '0 auto',
                  boxShadow: '0 0 20px rgba(0, 255, 157, 0.2)',
                  overflow: 'hidden'
                }}>
                  {top3[2].logoUrl ? (
                    <img src={top3[2].logoUrl} alt={top3[2].name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(top3[2].name)
                  )}
                </div>
                <div style={{ position: 'absolute', top: -4, right: -4, background: '#000', borderRadius: '50%', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff5c00" strokeWidth="4">
                    <path d="M12 5v14M5 12l7-7 7 7" />
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', marginTop: 14, opacity: 0.8 }}>{getHandle(top3[2].name)}</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-mint)', marginTop: 2 }}>{top3[2].totalPoints.toLocaleString()}</div>
            </div>
          )}
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
          {companies.map((c, i) => {
            if (i < 3) return null;
            return (
              <div key={c.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 20px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(0, 255, 157, 0.15)', // Hairline teal border
                gap: 16,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Subtle diagonal highlight */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-10%',
                  width: '120%',
                  height: '200%',
                  background: 'linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.02) 50%, transparent 55%)',
                  pointerEvents: 'none'
                }} />

                <div style={{ fontSize: '11px', fontWeight: 900, color: '#444', width: 20 }}>{i + 1}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 12, display: 'flex', justifyContent: 'center' }}>
                    {i % 2 === 0 ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00FF9D" strokeWidth="4">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ff5c00" strokeWidth="4">
                        <path d="M12 5v14M5 12l7 7 7-7" />
                      </svg>
                    )}
                  </div>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-mint) 0%, #00e5ff 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 900, color: '#000', overflow: 'hidden'
                  }}>
                    {c.logoUrl ? (
                      <img src={c.logoUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      getInitials(c.name)
                    )}
                  </div>
                </div>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', letterSpacing: '0.01em' }}>{getHandle(c.name)}</div>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--accent-mint)', textShadow: '0 0 10px rgba(0, 255, 157, 0.2)' }}>
                  {c.totalPoints.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
