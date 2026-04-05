import { useState } from 'react';
import Confetti from '../components/Confetti.jsx';
import './ResultsPage.css';

export default function ResultsPage({ result, user, onHome, onRetry }) {
  const { correct, total, pct, timeTaken, config, answers } = result;
  const [tab, setTab] = useState('overview');

  let grade, gradeClass, emoji, message;
  if (pct >= 90)      { grade = 'S'; gradeClass = 'grade-s'; emoji = '🏆'; message = 'Legendary!'; }
  else if (pct >= 80) { grade = 'A'; gradeClass = 'grade-a'; emoji = '🥇'; message = 'Outstanding!'; }
  else if (pct >= 70) { grade = 'B'; gradeClass = 'grade-b'; emoji = '🥈'; message = 'Great Work!'; }
  else if (pct >= 60) { grade = 'C'; gradeClass = 'grade-c'; emoji = '🥉'; message = 'Good Effort!'; }
  else if (pct >= 40) { grade = 'D'; gradeClass = 'grade-d'; emoji = '📚'; message = 'Keep Practicing!'; }
  else                { grade = 'F'; gradeClass = 'grade-f'; emoji = '💪'; message = 'Don\'t Give Up!'; }

  const wrong = total - correct;
  const accuracy = pct;
  const avgTime = total > 0 ? Math.round(timeTaken / total) : 0;
  const mins = Math.floor(timeTaken / 60);
  const secs = timeTaken % 60;

  return (
    <div className="results-wrap">
      {pct >= 80 && <Confetti />}
      <div className="results-bg" />

      <div className="results-container fade-up">
        {/* Score header */}
        <div className="results-hero">
          <div className={`grade-circle ${gradeClass}`}>
            <span className="grade-emoji">{emoji}</span>
            <span className="grade-letter">{grade}</span>
          </div>
          <div className="score-big">{pct}<span className="pct-sym">%</span></div>
          <div className="score-msg">{message}</div>
          <div className="score-sub">
            {correct} of {total} correct · {config?.category?.toUpperCase() || 'DAILY'} · {config?.difficulty || 'mixed'}
          </div>
        </div>

        {/* Stats row */}
        <div className="results-stats">
          {[
            { label: 'Correct',  val: correct,   unit: '',  color: 'var(--success)' },
            { label: 'Wrong',    val: wrong,      unit: '',  color: 'var(--error)' },
            { label: 'Accuracy', val: accuracy,   unit: '%', color: 'var(--accent2)' },
            { label: 'Time',     val: `${mins}m ${secs}s`, unit: '', color: 'var(--warning)' },
          ].map((s, i) => (
            <div key={i} className="results-stat-box">
              <div className="rs-val" style={{ color: s.color }}>{s.val}{s.unit}</div>
              <div className="rs-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="results-tabs">
          {['overview', 'review'].map(t => (
            <button key={t} className={`results-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'overview' ? '📊 Overview' : '📋 Review'}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="overview-content fade-in">
            {/* Score bar */}
            <div className="score-bar-wrap">
              <div className="score-bar-label">
                <span>Score</span>
                <span className="mono">{correct}/{total}</span>
              </div>
              <div className="score-bar-track">
                <div className="score-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* Performance breakdown */}
            <div className="perf-grid">
              <div className="perf-item">
                <div className="perf-icon">⚡</div>
                <div className="perf-val">{avgTime}s</div>
                <div className="perf-lbl">Avg per Q</div>
              </div>
              <div className="perf-item">
                <div className="perf-icon">🎯</div>
                <div className="perf-val">{correct}</div>
                <div className="perf-lbl">Correct</div>
              </div>
              <div className="perf-item">
                <div className="perf-icon">💥</div>
                <div className="perf-val">{wrong}</div>
                <div className="perf-lbl">Missed</div>
              </div>
              <div className="perf-item">
                <div className="perf-icon">📊</div>
                <div className="perf-val">{pct}%</div>
                <div className="perf-lbl">Accuracy</div>
              </div>
            </div>

            {/* Message */}
            <div className={`result-callout ${pct >= 70 ? 'positive' : 'neutral'}`}>
              {pct >= 90 ? '🌟 Incredible performance! You\'re a true expert in this subject.' :
               pct >= 70 ? '👍 Solid performance! A bit more practice and you\'ll ace it.' :
               pct >= 50 ? '📖 Not bad! Review the missed questions and try again.' :
               '💡 Keep learning! Every attempt makes you smarter.'}
            </div>
          </div>
        )}

        {tab === 'review' && (
          <div className="review-content fade-in">
            {answers.map((a, i) => (
              <div key={i} className={`review-row ${a.correct ? 'ok' : a.skipped ? 'skipped' : a.timedOut ? 'timeout' : 'bad'}`}>
                <div className="review-icon">
                  {a.correct ? '✅' : a.skipped ? '⏭️' : a.timedOut ? '⏰' : '❌'}
                </div>
                <div className="review-body">
                  <div className="review-q">Q{i+1}: {a.question}</div>
                  {!a.correct && a.options && typeof a.correctIdx === 'number' && (
                    <div className="review-correct">
                      ✓ Correct: {a.options[a.correctIdx]}
                    </div>
                  )}
                  {a.skipped && <div className="review-note">Skipped with lifeline</div>}
                  {a.timedOut && <div className="review-note">Time ran out</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="results-actions">
          <button className="results-action-btn outline" onClick={onHome}>🏠 Home</button>
          <button className="results-action-btn primary" onClick={onRetry}>🔄 Retry</button>
        </div>

        {user?.nickname && (
          <div className="score-saved-note">
            ✓ Score saved for <strong>{user.nickname}</strong>
            {user?.roomCode && ` · Room ${user.roomCode}`}
          </div>
        )}
      </div>
    </div>
  );
}
