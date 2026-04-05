import { useState, useEffect } from 'react';
import { api } from '../api.js';
import './AdminPage.css';

const CATS = ['html','css','javascript','python','dbms','gk','aiml','aptitude','os','networks'];
const DIFFS = ['easy','medium','hard'];

export default function AdminPage({ onBack }) {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [questions, setQuestions] = useState({});
  const [scores, setScores] = useState([]);
  const [addForm, setAddForm] = useState({
    category: 'html', difficulty: 'medium', question: '',
    options: ['','','',''], answer: 0, explanation: '', hint: ''
  });
  const [addStatus, setAddStatus] = useState('');
  const [viewCat, setViewCat] = useState('html');
  const [viewDiff, setViewDiff] = useState('medium');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'dashboard') fetchStats();
    if (tab === 'questions') fetchQuestions();
    if (tab === 'export') fetchScores();
  }, [tab]);

  const fetchStats = async () => {
    try { const r = await api.getAdminStats(); setStats(r); } catch (e) {}
  };
  const fetchQuestions = async () => {
    try { const r = await api.getAdminQuestions(); setQuestions(r.questions || {}); } catch (e) {}
  };
  const fetchScores = async () => {
    try { const r = await api.exportScores(); setScores(r.scores || []); } catch (e) {}
  };

  const handleAddQuestion = async () => {
    if (!addForm.question || addForm.options.some(o => !o)) {
      setAddStatus('error:Please fill all fields including all 4 options');
      return;
    }
    setLoading(true);
    try {
      await api.addQuestion(addForm);
      setAddStatus('success:Question added successfully!');
      setAddForm(f => ({ ...f, question: '', options: ['','','',''], explanation: '', hint: '' }));
      fetchQuestions();
    } catch (e) {
      setAddStatus(`error:${e.message}`);
    }
    setLoading(false);
  };

  const handleDelete = async (cat, diff, id) => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.deleteQuestion(cat, diff, id);
      fetchQuestions();
    } catch (e) { alert(e.message); }
  };

  const exportCSV = () => {
    const headers = ['nickname','category','difficulty','score','total','percentage','mode','date'];
    const rows = scores.map(s => headers.map(h => JSON.stringify(s[h] || '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'quiz_scores.csv'; a.click();
  };

  const viewQs = questions[viewCat]?.[viewDiff] || [];
  const [addStatusType, addStatusMsg] = addStatus.split(':').length > 1 ? addStatus.split(':') : ['',''];

  const TABS = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'questions', icon: '❓', label: 'Questions' },
    { id: 'add',       icon: '➕', label: 'Add Q' },
    { id: 'export',    icon: '📤', label: 'Export' },
  ];

  return (
    <div className="admin-wrap">
      <div className="admin-bg" />

      <div className="admin-container fade-up">
        <div className="admin-header">
          <button className="admin-back" onClick={onBack}>← Back</button>
          <h1 className="admin-title">⚙️ Admin Panel</h1>
          <span className="admin-badge">ADMIN</span>
        </div>

        <div className="admin-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`admin-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div className="admin-section fade-in">
            <div className="stat-cards">
              {stats ? [
                { label: 'Total Quiz Attempts', val: stats.total_scores, icon: '🎯', color: 'var(--accent)' },
                { label: 'Total Questions', val: stats.total_questions, icon: '❓', color: 'var(--success)' },
                { label: 'Active Rooms', val: stats.active_rooms, icon: '🏠', color: 'var(--warning)' },
                { label: 'Categories', val: stats.categories, icon: '📚', color: 'var(--purple)' },
                { label: 'Today\'s Attempts', val: stats.today_scores, icon: '📅', color: 'var(--accent2)' },
                { label: 'Total Rooms', val: stats.total_rooms, icon: '🚪', color: 'var(--error)' },
              ].map((s, i) => (
                <div key={i} className="stat-card" style={{ '--sc-color': s.color }}>
                  <div className="sc-icon">{s.icon}</div>
                  <div className="sc-val">{s.val ?? '—'}</div>
                  <div className="sc-lbl">{s.label}</div>
                </div>
              )) : (
                <div className="admin-loading">Loading stats...</div>
              )}
            </div>
            {stats?.top_category && (
              <div className="top-cat-banner">
                🔥 Most popular: <strong>{stats.top_category.toUpperCase()}</strong>
              </div>
            )}
          </div>
        )}

        {/* Questions viewer */}
        {tab === 'questions' && (
          <div className="admin-section fade-in">
            <div className="q-filters">
              <select className="admin-select" value={viewCat} onChange={e => setViewCat(e.target.value)}>
                {CATS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
              <select className="admin-select" value={viewDiff} onChange={e => setViewDiff(e.target.value)}>
                {DIFFS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <span className="q-count-badge">{viewQs.length} questions</span>
            </div>
            <div className="q-list">
              {viewQs.length === 0 ? (
                <div className="admin-empty">No questions in {viewCat} / {viewDiff}</div>
              ) : viewQs.map((q, i) => (
                <div key={i} className="q-item">
                  <div className="q-item-header">
                    <span className="q-num-badge">Q{q.id}</span>
                    <button className="delete-btn" onClick={() => handleDelete(viewCat, viewDiff, q.id)}>🗑️</button>
                  </div>
                  <div className="q-text">{q.question}</div>
                  <div className="q-options">
                    {q.options.map((opt, j) => (
                      <span key={j} className={`q-opt ${j === q.answer ? 'correct' : ''}`}>
                        {['A','B','C','D'][j]}: {opt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add question */}
        {tab === 'add' && (
          <div className="admin-section fade-in">
            <div className="add-form">
              <div className="add-row">
                <div className="add-group">
                  <label className="add-label">Category</label>
                  <select className="admin-select" value={addForm.category} onChange={e => setAddForm(f => ({...f, category: e.target.value}))}>
                    {CATS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="add-group">
                  <label className="add-label">Difficulty</label>
                  <select className="admin-select" value={addForm.difficulty} onChange={e => setAddForm(f => ({...f, difficulty: e.target.value}))}>
                    {DIFFS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="add-group">
                <label className="add-label">Question</label>
                <textarea
                  className="admin-textarea"
                  placeholder="Enter the question..."
                  value={addForm.question}
                  onChange={e => setAddForm(f => ({...f, question: e.target.value}))}
                  rows={3}
                />
              </div>

              <div className="add-group">
                <label className="add-label">Options (click radio to mark correct answer)</label>
                <div className="options-inputs">
                  {addForm.options.map((opt, i) => (
                    <div key={i} className={`option-input-row ${addForm.answer === i ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="correct"
                        checked={addForm.answer === i}
                        onChange={() => setAddForm(f => ({...f, answer: i}))}
                        className="radio-input"
                      />
                      <span className="opt-letter">{['A','B','C','D'][i]}</span>
                      <input
                        className="admin-input"
                        placeholder={`Option ${['A','B','C','D'][i]}...`}
                        value={opt}
                        onChange={e => setAddForm(f => ({
                          ...f,
                          options: f.options.map((o, j) => j === i ? e.target.value : o)
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="add-group">
                <label className="add-label">Explanation</label>
                <textarea
                  className="admin-textarea"
                  placeholder="Explain why the correct answer is right..."
                  value={addForm.explanation}
                  onChange={e => setAddForm(f => ({...f, explanation: e.target.value}))}
                  rows={2}
                />
              </div>

              <div className="add-group">
                <label className="add-label">Hint (optional)</label>
                <input
                  className="admin-input"
                  placeholder="A helpful hint for the player..."
                  value={addForm.hint}
                  onChange={e => setAddForm(f => ({...f, hint: e.target.value}))}
                />
              </div>

              {addStatus && (
                <div className={`add-status ${addStatusType}`}>
                  {addStatusType === 'success' ? '✅' : '⚠️'} {addStatusMsg}
                </div>
              )}

              <button className="add-submit-btn" onClick={handleAddQuestion} disabled={loading}>
                {loading ? 'Adding...' : '➕ Add Question'}
              </button>
            </div>
          </div>
        )}

        {/* Export */}
        {tab === 'export' && (
          <div className="admin-section fade-in">
            <div className="export-header">
              <span>{scores.length} total score records</span>
              <button className="export-btn" onClick={exportCSV}>⬇️ Export CSV</button>
            </div>
            <div className="export-table-wrap">
              <table className="export-table">
                <thead>
                  <tr>
                    {['Nickname','Category','Difficulty','Score','%','Mode','Date'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scores.slice(0, 50).map((s, i) => (
                    <tr key={i}>
                      <td>{s.nickname}</td>
                      <td>{s.category}</td>
                      <td>{s.difficulty}</td>
                      <td>{s.score}/{s.total}</td>
                      <td className={s.percentage >= 70 ? 'good' : s.percentage >= 50 ? 'mid' : 'bad'}>
                        {s.percentage}%
                      </td>
                      <td>{s.mode}</td>
                      <td>{new Date(s.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {scores.length > 50 && <p className="more-note">Showing first 50. Export CSV for full data.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
