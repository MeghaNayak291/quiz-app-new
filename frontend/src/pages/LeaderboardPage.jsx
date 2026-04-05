import { useState, useEffect } from 'react';
import { api } from '../api.js';
import './LeaderboardPage.css';

const DIFF_COLORS = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };
const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage({ user, onBack }) {
  const [tab, setTab] = useState('global');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomData, setRoomData] = useState(null);
  const [catFilter, setCatFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [tab, catFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'daily') {
        const r = await api.getDailyLeaderboard();
        setData(r.leaderboard || []);
      } else if (tab === 'room' && user?.roomCode) {
        const r = await api.getRoomLeaderboard(user.roomCode);
        setData(r.leaderboard || []);
        setRoomData(r);
      } else {
        const r = await api.getLeaderboard(catFilter || undefined);
        setData(r.leaderboard || []);
      }
    } catch (e) {
      setData([]);
    }
    setLoading(false);
  };

  const CATS = ['html','css','javascript','python','dbms','gk','aiml','aptitude','os','networks'];

  return (
    <div className="lb-wrap">
      <div className="lb-bg" />

      <div className="lb-container fade-up">
        {/* Header */}
        <div className="lb-header">
          <button className="lb-back" onClick={onBack}>← Back</button>
          <div className="lb-title-wrap">
            <h1 className="lb-title">🏆 Leaderboard</h1>
            {user?.roomCode && (
              <span className="room-tag mono">{user.roomCode}</span>
            )}
          </div>
          <button className="lb-refresh" onClick={fetchData}>↻</button>
        </div>

        {/* Tabs */}
        <div className="lb-tabs">
          {[
            { id: 'global', label: '🌍 Global' },
            { id: 'daily',  label: '📅 Daily' },
            ...(user?.roomCode ? [{ id: 'room', label: '🏠 Room' }] : []),
          ].map(t => (
            <button key={t.id} className={`lb-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Filter */}
        {tab === 'global' && (
          <div className="lb-filter">
            <button className={`filter-btn ${!catFilter ? 'active' : ''}`} onClick={() => setCatFilter('')}>All</button>
            {CATS.map(c => (
              <button key={c} className={`filter-btn ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Top 3 podium */}
        {!loading && data.length >= 3 && (
          <div className="podium">
            {[data[1], data[0], data[2]].map((entry, idx) => {
              const pos = idx === 1 ? 0 : idx === 0 ? 1 : 2;
              const heights = ['70px', '90px', '55px'];
              return entry ? (
                <div key={pos} className={`podium-col pos-${pos + 1}`}>
                  <div className="podium-avatar" style={{ background: pos === 0 ? 'linear-gradient(135deg,#fbbf24,#d97706)' : pos === 1 ? 'linear-gradient(135deg,#94a3b8,#64748b)' : 'linear-gradient(135deg,#c2763a,#a55c2d)' }}>
                    {MEDALS[pos]}
                  </div>
                  <div className="podium-nick">{entry.nickname}</div>
                  <div className="podium-pct">{entry.percentage}%</div>
                  <div className="podium-bar" style={{ height: heights[idx] }} />
                </div>
              ) : null;
            })}
          </div>
        )}

        {/* List */}
        <div className="lb-list">
          {loading ? (
            <div className="lb-loading">
              <div className="lb-spin" />
              <span>Loading rankings...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="lb-empty">
              <div style={{fontSize:'3rem'}}>📭</div>
              <p>No scores yet. Be the first!</p>
            </div>
          ) : (
            data.map((entry, i) => (
              <div key={i} className={`lb-row ${entry.nickname === user?.nickname ? 'mine' : ''}`}>
                <div className="lb-rank">
                  {i < 3 ? <span className="medal">{MEDALS[i]}</span> : <span className="rank-num mono">#{i + 1}</span>}
                </div>
                <div className="lb-avatar">{entry.nickname?.[0]?.toUpperCase()}</div>
                <div className="lb-info">
                  <div className="lb-nick">
                    {entry.nickname}
                    {entry.nickname === user?.nickname && <span className="you-tag">YOU</span>}
                  </div>
                  <div className="lb-meta">
                    <span className="mono" style={{color: DIFF_COLORS[entry.difficulty] || 'var(--muted)'}}>
                      {entry.difficulty || ''}
                    </span>
                    {entry.category && <span className="lb-cat">{entry.category.toUpperCase()}</span>}
                    {entry.date && <span className="lb-date">{new Date(entry.date).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="lb-score-wrap">
                  <div className="lb-pct" style={{
                    color: entry.percentage >= 80 ? 'var(--success)' : entry.percentage >= 60 ? 'var(--warning)' : 'var(--error)'
                  }}>
                    {entry.percentage}%
                  </div>
                  <div className="lb-raw mono">{entry.score}/{entry.total}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
