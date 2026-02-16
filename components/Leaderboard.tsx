"use client";

import type { Company } from "@/lib/types";

interface LeaderboardProps {
  companies: Company[];
}

export function Leaderboard({ companies }: LeaderboardProps) {
  return (
    <div className="closer-list">
      {companies.map((company, index) => {
        const rank = index + 1;
        const progress = Math.min(100, Math.round((company.totalPoints / 250000) * 100));

        return (
          <div key={company.id} className="closer-card">
            <div className="avatar-container">
              <div
                className="avatar-circle"
                style={{
                  background: rank === 1 ? 'rgba(0, 255, 163, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: rank === 1 ? 'var(--accent-green)' : 'var(--border)'
                }}
              >
                {/* Silhouette SVG */}
                <svg viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div
                className="rank-pill"
                style={{
                  background: rank === 1 ? '#ffc400' : rank === 2 ? '#e0e0e0' : rank === 3 ? '#cd7f32' : '#333',
                  color: rank <= 3 ? '#000' : '#fff'
                }}
              >
                {rank}
              </div>
            </div>

            <div className="closer-content">
              <div className="closer-header">
                <div>
                  <div className="closer-name">{company.name}</div>
                  <div className="closer-sub">{company.id === 'c1' ? 'Enterprise Solutions' : company.id === 'c2' ? 'Global Accounts' : 'Sales Team'}</div>
                </div>
                <div className="closer-value">${company.totalPoints.toLocaleString()}</div>
              </div>

              <div className="progress-track" style={{ height: 6, marginTop: 8 }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${progress}%`,
                    background: rank === 1 ? 'var(--accent-green)' : 'var(--text-muted)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginTop: 4, color: 'var(--text-muted)', fontWeight: 700 }}>
                <span>QUOTA: $250K</span>
                <span>{progress}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
