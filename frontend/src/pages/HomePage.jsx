import { useState, useEffect } from 'react';
import { api } from '../api.js';
import './HomePage.css';

const MODES = [
  { id: 'challenge', label: 'Start Challenge', icon: '⚡', desc: 'Full quiz with all features', color: '#3b82f6' },
  { id: 'daily', label: 'Daily Challenge', icon: '📅', desc: "Today's special quiz", color: '#8b5cf6' },
  { id: 'practice', label: 'Practice Exam', icon: '📚', desc: 'No timer, learn at your pace', color: '#10b981' },
  { id: 'custom', label: 'Custom Quiz', icon: '⚙️', desc: 'Choose topics & difficulty', color: '#f59e0b' },
  { id: 'exam', label: 'Exam Model', icon: '🎓', desc: 'Simulate real exam conditions', color: '#ef4444' },
  { id: 'subject', label: 'Subject-wise', icon: '📖', desc: 'Deep dive into one subject', color: '#06b6d4' },
  { id: 'language', label: 'Language Quiz', icon: '🌐', desc: 'Try in Hindi or Kannada', color: '#ec4899' },
  { id: 'level', label: 'Level-based', icon: '🏆', desc: 'Easy → Medium → Hard progression', color: '#f97316' },
];

const LANGS = [
  { id: 'en', label: 'English', flag: '🇺🇸' },
  { id: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { id: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
];

export default function HomePage({ user, onStartQuiz, onNav }) {
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedMode, setSelectedMode] = useState('challenge');
  const [selectedLang, setSelectedLang] = useState('en');
  const [suggestion, setSuggestion] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);

  useEffect(() => {
    api.getCategories().then(d => setCategories(d.categories)).catch(() => { });
  }, []);

  useEffect(() => {
    if (selectedCat && user?.nickname) {
      api.getSuggestion(selectedCat, user.nickname).then(setSuggestion).catch(() => { });
    }
  }, [selectedCat, user?.nickname]);

  const handleStart = () => {
    if (!selectedCat && selectedMode !== 'daily') return;
    onStartQuiz({
      category: selectedCat,
      difficulty,
      mode: selectedMode,
      lang: selectedLang,
      count: questionCount,
      nickname: user?.nickname,
      roomCode: user?.roomCode,
    });
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="home-wrap">
      <div className="home-bg-grad" />

      {/* Header */}
      <header className="home-header fade-in">
        <div className="home-logo">
          <span>🧠</span>
          <span className="home-logo-text">QuizMaster<span className="ai-badge">AI</span></span>
        </div>
        <div className="home-header-right">
          {user?.roomCode && (
            <div className="room-badge">
              <span>🏠</span>
              <span className="mono">{user.roomCode}</span>
            </div>
          )}
          <div className="user-chip">
            <div className="user-avatar">{user?.nickname?.[0]?.toUpperCase() || '?'}</div>
            <span>{user?.nickname}</span>
          </div>
          <button className="nav-btn" onClick={() => onNav('leaderboard')} title="Leaderboard">🏆</button>
        </div>
      </header>

      <div className="home-content">
        {/* Daily challenge banner */}
        <div className="daily-banner fade-up" onClick={() => { setSelectedMode('daily'); handleStart(); }}>
          <div className="daily-left">
            <span className="daily-icon">📅</span>
            <div>
              <div className="daily-title">Daily Challenge</div>
              <div className="daily-sub">{today}</div>
            </div>
          </div>
          <div className="daily-right">
            <span>Play Now →</span>
          </div>
        </div>

        {/* Mode Grid */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Quiz Modes</h2>
          </div>
          <div className="modes-grid">
            {MODES.map((m, i) => (
              <button
                key={m.id}
                className={`mode-card ${selectedMode === m.id ? 'active' : ''}`}
                style={{ '--mode-color': m.color, animationDelay: `${i * 0.05}s` }}
                onClick={() => setSelectedMode(m.id)}
              >
                <span className="mode-icon">{m.icon}</span>
                <div className="mode-label">{m.label}</div>
                <div className="mode-desc">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        {selectedMode === 'language' && (
          <div className="section fade-up">
            <h2 className="section-title">Select Language</h2>
            <div className="lang-row">
              {LANGS.map(l => (
                <button key={l.id} className={`lang-btn ${selectedLang === l.id ? 'active' : ''}`}
                  onClick={() => setSelectedLang(l.id)}>
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        {selectedMode !== 'daily' && (
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Choose Subject</h2>
              {selectedCat && suggestion && (
                <div className="suggestion-pill">
                  💡 {suggestion.message}
                </div>
              )}
            </div>
            <div className="cat-grid">
              {categories.map((c, i) => (
                <button
                  key={c.id}
                  className={`cat-card ${selectedCat === c.id ? 'active' : ''}`}
                  style={{ '--cat-color': c.color, animationDelay: `${i * 0.04}s` }}
                  onClick={() => setSelectedCat(c.id)}
                >
                  <div className="cat-top">
                    <span className="cat-tag">{c.tag}</span>
                  </div>
                  <div className="cat-icon">{c.icon}</div>
                  <div className="cat-name">{c.name}</div>
                  <div className="cat-count">{c.count} Qs</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="section">
          <h2 className="section-title">Settings</h2>
          <div className="settings-row">
            {/* Difficulty */}
            <div className="setting-group">
              <label className="setting-label">Difficulty</label>
              <div className="diff-btns">
                {[
                  { id: 'easy', label: '🟢 Easy', color: '#10b981' },
                  { id: 'medium', label: '🟡 Medium', color: '#f59e0b' },
                  { id: 'hard', label: '🔴 Hard', color: '#ef4444' },
                ].map(d => (
                  <button
                    key={d.id}
                    className={`diff-btn ${difficulty === d.id ? 'active' : ''}`}
                    style={{ '--diff-color': d.color }}
                    onClick={() => setDifficulty(d.id)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question count */}
            <div className="setting-group">
              <label className="setting-label">Questions: <span className="mono">{questionCount}</span></label>
              <input
                type="range"
                min="5"
                max="15"
                value={questionCount}
                onChange={e => setQuestionCount(Number(e.target.value))}
                className="range-input"
              />
              <div className="range-labels"><span>5</span><span>15</span></div>
            </div>
          </div>
        </div>

        {/* Start button */}
        <button
          className="start-btn fade-up"
          disabled={selectedMode !== 'daily' && !selectedCat}
          onClick={handleStart}
        >
          {selectedMode === 'daily' ? '📅 Start Daily Challenge' :
            !selectedCat ? 'Select a subject to begin' :
              `${MODES.find(m => m.id === selectedMode)?.icon} ${MODES.find(m => m.id === selectedMode)?.label} →`}
        </button>
      </div>
    </div>
  );
}
