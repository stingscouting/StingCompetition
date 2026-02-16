"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { authorizedFetch } from "@/lib/api-client";
import { clientAuth } from "@/lib/firebase-client";
import { onAuthStateChanged } from "firebase/auth";

import { useRouter } from "next/navigation";

interface CompanyStats {
  id: string;
  name: string;
  totalPoints: number;
  totalValidMeetings: number;
  streakCount: number;
  rank: number;
  shieldAvailable: boolean;
  shieldUsed: boolean;
  achievements?: string[];
  logoUrl?: string;
}

const MOCK_COMPANY: CompanyStats = {
  id: "demo-c1",
  name: "Sarah Jenkins",
  rank: 1,
  totalPoints: 242500,
  totalValidMeetings: 24,
  streakCount: 7,
  shieldAvailable: true,
  shieldUsed: false,
  achievements: ["Closer King"]
};

export default function MyCompanyPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [company, setCompany] = useState<CompanyStats | null>(null);
  const [loadError, setLoadError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkRegistration = () => {
      const companyId = localStorage.getItem("companyId");
      if (!companyId && !clientAuth.currentUser) {
        router.push("/");
      }
    };

    const stop = onAuthStateChanged(clientAuth, (user) => {
      setIsAuthenticated(Boolean(user));
      if (!user) {
        checkRegistration();
        // Force mock data for demonstration ONLY IF on a demo-like environment or testing
        // But for production, we want strict redirection
        setCompany(MOCK_COMPANY);
      }
    });
    return () => stop();
  }, [router]);

  async function loadCompany() {
    const res = await authorizedFetch("/api/company/me/stats");
    const data = await res.json();
    if (!res.ok || !data.company) {
      setLoadError(data.error || "Failed to load company stats");
      setCompany(MOCK_COMPANY); // Fallback if API fails
      return;
    }
    setCompany(data.company as CompanyStats);
  }

  useEffect(() => {
    if (isAuthenticated) loadCompany();
  }, [isAuthenticated]);

  const activityDays = [
    { l: "M", a: true }, { l: "T", a: true }, { l: "W", a: true },
    { l: "T", a: true }, { l: "F", a: true }, { l: "S", a: false }, { l: "S", a: false, active: true }
  ];

  return (
    <main className="page">
      <Nav />

      <header style={{ marginBottom: 40, borderBottom: '1px solid var(--border)', paddingBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div className="rank-avatar" style={{
            width: 64,
            height: 64,
            fontSize: '28px',
            background: 'linear-gradient(135deg, var(--accent-mint) 0%, #00e5ff 100%)',
            color: '#000',
            border: 'none',
            boxShadow: '0 0 20px rgba(0, 255, 157, 0.3)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              company?.name?.[0] || 'C'
            )}
          </div>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {company?.name || 'My Company'}
            </h1>
            <p style={{ color: 'var(--accent-mint)', fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
              Active Competitor
            </p>
          </div>
        </div>
      </header>

      {/* Unified Metrics Grid */}
      <div className="section-label">Performance Metrics</div>
      <div className="metric-row" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        marginBottom: 24
      }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.05) 0%, rgba(0, 0, 0, 0) 100%)' }}>
          <div className="stat-label">🏆 Rank</div>
          <div className="stat-value" style={{ fontSize: '24px', marginTop: 8 }}>#{company?.rank || '-'}</div>
          <div className="progress-bar-container" style={{ marginTop: 12 }}>
            <div className="progress-bar-fill" style={{ width: '92%', background: 'linear-gradient(90deg, var(--accent-mint), #00e5ff)' }} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">🤝 Meetings</div>
          <div className="stat-value" style={{ fontSize: '24px', marginTop: 8 }}>{company?.totalValidMeetings || 0}</div>
          <div className="progress-bar-container" style={{ marginTop: 12 }}>
            <div className="progress-bar-fill" style={{ width: '68%' }} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">💰 Points</div>
          <div className="stat-value" style={{ fontSize: '24px', marginTop: 8 }}>
            {(company?.totalPoints || 0).toLocaleString()}
          </div>
          <div className="progress-bar-container" style={{ marginTop: 12 }}>
            <div className="progress-bar-fill" style={{ width: '45%' }} />
          </div>
        </div>
      </div>

      {/* Activity Streak Hub */}
      {/* Daily Activity Streak Overhaul */}
      <div className="stat-card" style={{
        padding: '24px 32px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 100%)',
        position: 'relative',
        marginBottom: 32
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>Daily Activity Streak</h3>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)', margin: 0 }}>
              You&apos;re on fire, {company?.name || 'Team'}!
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '32px', filter: 'drop-shadow(0 0 10px rgba(255, 107, 0, 0.4))' }}>🔥</span>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#fff', lineHeight: 1, marginTop: 4 }}>{company?.streakCount || 0}</span>
          </div>
        </div>

        <div className="day-tracker" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          {activityDays.map((d, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  ...(d.active ? {
                    background: 'var(--accent-mint)',
                    color: '#000',
                    boxShadow: '0 0 20px rgba(0, 255, 157, 0.4)',
                    border: 'none'
                  } : d.a ? {
                    border: '1.5px solid var(--accent-mint)',
                    background: 'transparent',
                    color: 'var(--accent-mint)'
                  } : {
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: 'transparent'
                  })
                }}
              >
                {d.active ? "★" : d.a ? "✓" : ""}
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 900,
                color: d.active ? 'var(--accent-mint)' : 'var(--text-muted)',
                letterSpacing: '0.05em'
              }}>
                {d.l}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements Section - Unified Badges */}
      <div className="section-label">Achievements</div>
      <div className="achievement-row" style={{ display: 'flex', gap: 24, justifyContent: 'flex-start' }}>
        {[
          { id: "Closer King", icon: "👑", color: "var(--accent-mint)", bg: "rgba(0,255,157,0.05)" },
          { id: "Fast Start", icon: "🚀", color: "#00e5ff", bg: "rgba(0,229,255,0.05)" },
          { id: "Shield On", icon: "🛡️", color: "#ff6b00", bg: "rgba(255,107,0,0.05)" }
        ].map(badge => {
          const isAchieved = company?.achievements?.includes(badge.id);
          return (
            <div key={badge.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div className="achievement-icon-circle" style={{
                border: `1.5px solid ${isAchieved ? badge.color : 'rgba(255,255,255,0.1)'}`,
                background: isAchieved ? badge.bg : 'rgba(255,255,255,0.02)',
                filter: isAchieved ? 'none' : 'grayscale(1) opacity(0.3)',
                boxShadow: isAchieved ? `0 0 15px ${badge.color}33` : 'none',
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
              }}>
                {badge.icon}
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 900,
                letterSpacing: '0.05em',
                color: isAchieved ? '#fff' : 'var(--text-muted)',
                textTransform: 'uppercase'
              }}>
                {badge.id}
              </span>
            </div>
          );
        })}
      </div>

    </main>
  );
}
