import { useState } from 'react';
import { api } from '../api.js';
import './LoginPage.css';

export default function LoginPage({ onLogin }) {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState('solo'); // solo | create | join
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!nickname.trim()) { setError('Please enter a nickname'); return; }
    if ((mode === 'join') && !roomCode.trim()) { setError('Please enter a room code'); return; }
    setError('');
    setLoading(true);

    try {
      if (mode === 'solo') {
        onLogin({ nickname: nickname.trim(), roomCode: null, isHost: false });
      } else if (mode === 'create') {
        const res = await api.createRoom(nickname.trim(), roomCode.trim() || undefined);
        onLogin({ nickname: nickname.trim(), roomCode: res.room_code, isHost: true });
      } else {
        const res = await api.joinRoom(nickname.trim(), roomCode.trim().toUpperCase());
        onLogin({ nickname: nickname.trim(), roomCode: roomCode.trim().toUpperCase(), isHost: false });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      {/* Animated background orbs */}
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />
      <div className="grid-overlay" />

      <div className="login-container fade-up">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon">🧠</div>
          <div className="logo-text">
            <span className="logo-main">QuizMaster</span>
            <span className="logo-badge">AI</span>
          </div>
          <p className="logo-sub">Challenge your mind. Beat the clock. Top the board.</p>
        </div>

        {/* Mode selector */}
        <div className="mode-tabs">
          {[
            { id: 'solo',   label: 'Solo Play',    icon: '🎯' },
            { id: 'create', label: 'Create Room',  icon: '🏠' },
            { id: 'join',   label: 'Join Room',    icon: '🚀' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`mode-tab ${mode === tab.id ? 'active' : ''}`}
              onClick={() => { setMode(tab.id); setError(''); }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="login-form">
          <div className="input-group">
            <label className="input-label">Your Nickname</label>
            <div className="input-wrap">
              <span className="input-icon">👤</span>
              <input
                className="login-input"
                placeholder="Enter your nickname..."
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                maxLength={20}
              />
              <span className="char-count">{nickname.length}/20</span>
            </div>
          </div>

          {(mode === 'join' || mode === 'create') && (
            <div className="input-group fade-up">
              <label className="input-label">
                {mode === 'create' ? 'Custom Room Code (optional)' : 'Room Code'}
              </label>
              <div className="input-wrap">
                <span className="input-icon">🔑</span>
                <input
                  className="login-input mono"
                  placeholder={mode === 'create' ? 'Leave blank to auto-generate' : 'e.g. ABC123'}
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  maxLength={8}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="login-error fade-in">
              <span>⚠️</span> {error}
            </div>
          )}

          <button className="login-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <span className="loading-spin" />
            ) : (
              <>
                <span>
                  {mode === 'solo' ? '🎯 Start Playing' :
                   mode === 'create' ? '🏠 Create Room' : '🚀 Join Room'}
                </span>
                <span className="btn-arrow">→</span>
              </>
            )}
          </button>
        </div>

        {/* Features */}
        <div className="login-features">
          {['⚡ AI-Powered Questions', '🏆 Global Leaderboard', '🎙️ Voice Support', '🎯 10 Subjects'].map((f, i) => (
            <div key={i} className="feature-chip">{f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
