"use client";

import { Nav } from "@/components/Nav";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clientAuth } from "@/lib/firebase-client";
import { onAuthStateChanged } from "firebase/auth";

export default function RulesPage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(clientAuth, (user) => {
      const companyId = localStorage.getItem("companyId");
      if (!user && !companyId) {
        router.push("/");
      }
    });
    return () => unsub();
  }, [router]);
  return (
    <main className="page" style={{ paddingBottom: '120px' }}>
      <header style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div className="choice-icon" style={{ width: 44, height: 44, borderRadius: 12 }}>📜</div>
          <h1 className="page-title">Sting Core Sales Sprint</h1>
        </div>
      </header>

      {/* Overview Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: 24, borderLeft: '4px solid var(--accent-mint)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: 16, color: 'var(--accent-mint)' }}>Competition Overview</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="stat-header" style={{ marginBottom: 0 }}>
            <span>📅 TIMELINE</span>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Feb 16 – Feb 20, 2026</p>

          <div className="stat-header" style={{ marginBottom: 0, marginTop: 8 }}>
            <span>👥 PARTICIPANTS</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>All Sting Core – Fall 2025 companies.</p>
        </div>
      </div>


      {/* Sales Meeting Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: '24px' }}>🤝</span>
          <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>The "Sales Meeting"</h3>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 12 }}>To keep things fair, a valid meeting must be:</p>
        <ul style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>With a <strong>potential customer</strong></li>
          <li><strong>External</strong> to your company</li>
          <li>Duration of <strong>20+ minutes</strong></li>
          <li>Online or in-person</li>
        </ul>
      </div>

      {/* Scoring Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: '24px' }}>🏅</span>
          <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Scoring Engine</h3>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Base Meeting</span>
            <span style={{ color: 'var(--accent-mint)', fontWeight: 800 }}>+10 pts</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Awarded for every valid submission.</p>
        </div>

        <div style={{ background: 'rgba(0, 255, 157, 0.05)', border: '1px solid rgba(0, 255, 157, 0.1)', padding: '16px', borderRadius: '16px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 800, marginBottom: 12, color: 'var(--accent-mint)' }}>Daily Momentum Bonus</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>2 Meetings in a day</span>
              <span style={{ fontWeight: 700 }}>+5 bonus</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>3+ Meetings in a day</span>
              <span style={{ fontWeight: 700 }}>+10 bonus</span>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--accent-mint)', marginTop: 12, fontStyle: 'italic' }}>*Bonuses do not stack.</p>
        </div>
      </div>

      {/* Streaks Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: '24px' }}>🔥</span>
          <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Execution Streaks</h3>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 16 }}>Submit at least <strong>1 meeting every day</strong> to keep your streak alive. Streaks are evaluated daily at end-of-day.</p>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', marginBottom: 20 }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 8px 0' }}>If a company has:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>1+ meeting per day</span>
              <span style={{ color: 'var(--accent-mint)', fontWeight: 700 }}>Streak continues</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>0 meetings on a day</span>
              <span style={{ color: '#ff5c00', fontWeight: 700 }}>Streak resets</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px', background: 'rgba(255, 92, 0, 0.05)', border: '1px solid rgba(255, 92, 0, 0.1)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <span style={{ fontWeight: 800, color: '#ff5c00', fontSize: '14px' }}>STREAK SHIELD</span>
          </div>
          <p style={{ fontSize: '13px', margin: 0, lineHeight: '1.5', color: 'var(--text-muted)' }}>
            Unlock a one-time shield by sharing a <strong>Best Practice</strong>. Once approved, it automatically protects your streak from one missed day.
          </p>
        </div>
      </div>

      {/* Integrity Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: 16, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '99px', marginBottom: 12 }}>
            <span style={{ fontSize: '14px' }}>⚖️</span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fair Play & Integrity</span>
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 8px 0' }}>This competition is built on trust.</h3>
        </div>

        <ul style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <li>Submissions <strong>must reflect real meetings</strong></li>
          <li>Inflating numbers <strong>defeats the purpose</strong></li>
          <li>Organizers <strong>may conduct random checks</strong></li>
        </ul>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', textAlign: 'center', fontStyle: 'italic', margin: 0 }}>
          This is not about gaming the system. It&apos;s about building the habit of consistent sales execution. <strong>The goal is growth.</strong>
        </p>
      </div>

      <Nav />
    </main>
  );
}
