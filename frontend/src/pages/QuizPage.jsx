import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api.js';
import Confetti from '../components/Confetti.jsx';
import './QuizPage.css';

const TIMER_DEFAULT = 30;
const LIFELINES = ['50:50', 'hint', 'skip'];

const TRANSLATIONS = {
  en: { question: 'Question', correct: 'Correct', wrong: 'Wrong', next: 'Next Question', finish: 'See Results', hint: 'Hint', explanation: 'Explanation', timeUp: 'Time\'s Up!', score: 'Score' },
  hi: { question: 'प्रश्न', correct: 'सही', wrong: 'गलत', next: 'अगला प्रश्न', finish: 'परिणाम देखें', hint: 'संकेत', explanation: 'व्याख्या', timeUp: 'समय समाप्त!', score: 'अंक' },
  kn: { question: 'ಪ್ರಶ್ನೆ', correct: 'ಸರಿ', wrong: 'ತಪ್ಪು', next: 'ಮುಂದಿನ ಪ್ರಶ್ನೆ', finish: 'ಫಲಿತಾಂಶ ನೋಡಿ', hint: 'ಸೂಚನೆ', explanation: 'ವಿವರಣೆ', timeUp: 'ಸಮಯ ಮುಗಿಯಿತು!', score: 'ಅಂಕ' },
};

export default function QuizPage({ config, user, onFinish, onBack }) {
  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(TIMER_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lifelines, setLifelines] = useState({ '50:50': true, hint: true, skip: true });
  const [hintVisible, setHintVisible] = useState(false);
  const [hintText, setHintText] = useState('');
  const [eliminated, setEliminated] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [startTime] = useState(Date.now());
  const timerRef = useRef(null);
  const isPractice = config?.mode === 'practice';
  const t = TRANSLATIONS[config?.lang || 'en'] || TRANSLATIONS.en;

  // Load quiz
  useEffect(() => {
    loadQuiz();
    return () => clearInterval(timerRef.current);
  }, []);

  const loadQuiz = async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      if (config.mode === 'daily') {
        data = await api.getDailyChallenge();
        data.category = 'mixed';
        data.category_name = 'Daily Challenge';
      } else {
        data = await api.getQuiz(config.category, config.difficulty, config.count || 10);
      }
      setQuiz(data);
      setLoading(false);
      if (voiceEnabled) speakQuestion(data.questions[0]);
    } catch (e) {
      setError('Failed to load quiz. Make sure the backend is running.');
      setLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (!quiz || answered || isPractice || loading) return;
    clearInterval(timerRef.current);
    setTimeLeft(TIMER_DEFAULT);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentQ, quiz, answered, loading]);

  const speakQuestion = (q) => {
    if (!q || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(q.question);
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };

  const handleTimeout = () => {
    if (answered) return;
    setAnswered(true);
    setSelectedIdx(-1);
    const q = quiz.questions[currentQ];
    setAnswers(prev => [...prev, {
      correct: false,
      timedOut: true,
      question: q.question,
      selectedIdx: -1,
      options: q.options,
    }]);
    api.checkAnswer(q.category || config.category, config.difficulty, q.id, -1)
      .then(res => setFeedback(res)).catch(() => {});
  };

  const handleAnswer = async (idx) => {
    if (answered || eliminated.includes(idx)) return;
    clearInterval(timerRef.current);
    setSelectedIdx(idx);
    setAnswered(true);
    setHintVisible(false);
    const q = quiz.questions[currentQ];
    try {
      const result = await api.checkAnswer(
        q.category || config.category,
        config.difficulty,
        q.id,
        idx
      );
      setFeedback(result);
      setAnswers(prev => [...prev, {
        correct: result.correct,
        timedOut: false,
        question: q.question,
        selectedIdx: idx,
        correctIdx: result.correct_index,
        options: q.options,
      }]);
      if (voiceEnabled) {
        const msg = result.correct ? 'Correct!' : 'Wrong answer.';
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(msg));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const nextQuestion = () => {
    const total = quiz.questions.length;
    if (currentQ + 1 >= total) {
      finishQuiz();
    } else {
      setCurrentQ(q => q + 1);
      setAnswered(false);
      setSelectedIdx(null);
      setFeedback(null);
      setEliminated([]);
      setHintVisible(false);
      setHintText('');
      if (voiceEnabled) speakQuestion(quiz.questions[currentQ + 1]);
    }
  };

  const finishQuiz = async () => {
    const correct = answers.filter(a => a.correct).length;
    const total = quiz.questions.length;
    const pct = Math.round((correct / total) * 100);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    if (pct >= 80) setShowConfetti(true);

    try {
      await api.submitScore({
        nickname: user?.nickname || 'Anonymous',
        category: config.category || 'daily',
        difficulty: config.difficulty || 'medium',
        score: correct,
        total,
        mode: config.mode || 'challenge',
        time_taken: timeTaken
      });
      if (user?.roomCode) {
        await api.submitRoomScore(user.roomCode, {
          nickname: user.nickname,
          category: config.category || 'daily',
          difficulty: config.difficulty || 'medium',
          score: correct,
          total,
          mode: config.mode,
          time_taken: timeTaken
        });
      }
    } catch (e) { /* ignore */ }

    onFinish({ answers, correct, total, pct, timeTaken, config, quiz });
  };

  // Lifelines
  const use5050 = () => {
    if (!lifelines['50:50'] || answered) return;
    const q = quiz.questions[currentQ];
    const correct = feedback?.correct_index ?? 0;
    const wrong = q.options.map((_, i) => i).filter(i => i !== correct);
    const toElim = wrong.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminated(toElim);
    setLifelines(l => ({ ...l, '50:50': false }));
  };

  const useHint = () => {
    if (!lifelines.hint || answered) return;
    const q = quiz.questions[currentQ];
    setHintText(q.hint || 'No hint available for this question.');
    setHintVisible(true);
    setLifelines(l => ({ ...l, hint: false }));
  };

  const useSkip = () => {
    if (!lifelines.skip || answered) return;
    clearInterval(timerRef.current);
    setAnswered(true);
    setSelectedIdx(-2); // skip marker
    const q = quiz.questions[currentQ];
    setAnswers(prev => [...prev, {
      correct: false,
      skipped: true,
      question: q.question,
      selectedIdx: -2,
      options: q.options,
    }]);
    setLifelines(l => ({ ...l, skip: false }));
    api.checkAnswer(q.category || config.category, config.difficulty, q.id, -1)
      .then(setFeedback).catch(() => {});
  };

  if (loading) return (
    <div className="quiz-loading">
      <div className="quiz-loading-inner">
        <div className="loading-orb" />
        <span>Loading quiz...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="quiz-error">
      <div className="error-card">
        <div style={{fontSize:'3rem'}}>⚠️</div>
        <h2>Failed to load quiz</h2>
        <p>{error}</p>
        <button className="quiz-btn-primary" onClick={loadQuiz}>Retry</button>
        <button className="quiz-btn-outline" onClick={onBack}>Go Back</button>
      </div>
    </div>
  );

  if (!quiz) return null;

  const q = quiz.questions[currentQ];
  const total = quiz.questions.length;
  const correct = answers.filter(a => a.correct).length;
  const timerPct = timeLeft / TIMER_DEFAULT;
  const timerColor = timeLeft > 15 ? '#3b82f6' : timeLeft > 7 ? '#f59e0b' : '#ef4444';
  const progress = ((currentQ) / total) * 100;
  const labels = ['A', 'B', 'C', 'D'];
  const circumference = 2 * Math.PI * 20;

  return (
    <div className="quiz-wrap">
      {showConfetti && <Confetti />}
      <div className="quiz-bg-grad" />

      {/* Top bar */}
      <div className="quiz-topbar">
        <button className="quiz-back-btn" onClick={onBack}>← Exit</button>
        <div className="quiz-meta">
          <span className="quiz-subject">{quiz.category_name || config.category?.toUpperCase()}</span>
          <span className="quiz-diff-chip">{config.difficulty}</span>
          {config.mode === 'daily' && <span className="quiz-daily-chip">📅 Daily</span>}
        </div>
        <button
          className={`voice-btn ${voiceEnabled ? 'active' : ''}`}
          onClick={() => { setVoiceEnabled(!voiceEnabled); window.speechSynthesis.cancel(); }}
          title="Toggle voice"
        >
          {voiceEnabled ? '🔊' : '🔇'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
        <div className="progress-head" style={{ left: `${progress}%` }} />
      </div>

      {/* Stats strip */}
      <div className="stats-strip">
        <div className="stat-chip green">
          <span className="stat-val">{correct}</span>
          <span className="stat-lbl">{t.correct}</span>
        </div>
        <div className="stat-chip red">
          <span className="stat-val">{currentQ - correct}</span>
          <span className="stat-lbl">{t.wrong}</span>
        </div>
        <div className="stat-chip blue">
          <span className="stat-val">{currentQ + 1}<span style={{fontSize:'0.7em',color:'var(--muted)'}}> /{total}</span></span>
          <span className="stat-lbl">{t.question}</span>
        </div>

        {/* Timer ring */}
        {!isPractice && (
          <div className={`timer-wrap ${timeLeft <= 7 ? 'urgent' : ''}`}>
            <svg viewBox="0 0 48 48" width="54" height="54">
              <circle className="timer-bg" cx="24" cy="24" r="20" />
              <circle
                className="timer-fg"
                cx="24" cy="24" r="20"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - timerPct)}
                stroke={timerColor}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
              />
            </svg>
            <span className="timer-num" style={{ color: timerColor }}>{timeLeft}</span>
          </div>
        )}
      </div>

      {/* Main quiz area */}
      <div className="quiz-main">
        {/* Question card */}
        <div className="question-card fade-up" key={currentQ}>
          <div className="q-meta-row">
            <span className="q-badge">Q{currentQ + 1} · {config.difficulty?.toUpperCase()}</span>
            <div className="lifelines">
              {[
                { id: '50:50', icon: '⚖️', label: '50:50', action: use5050 },
                { id: 'hint',  icon: '💡', label: 'Hint',  action: useHint },
                { id: 'skip',  icon: '⏭️', label: 'Skip',  action: useSkip },
              ].map(ll => (
                <button
                  key={ll.id}
                  className={`lifeline-btn ${!lifelines[ll.id] ? 'used' : ''}`}
                  onClick={ll.action}
                  disabled={!lifelines[ll.id] || answered}
                  title={ll.label}
                >
                  {ll.icon}
                </button>
              ))}
            </div>
          </div>

          <p className="q-text">{q?.question}</p>

          {hintVisible && (
            <div className="hint-box fade-in">
              <span>💡 {t.hint}:</span> {hintText}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="options-list">
          {q?.options.map((opt, i) => {
            let cls = '';
            if (answered) {
              if (i === feedback?.correct_index) cls = 'correct';
              else if (i === selectedIdx) cls = 'wrong';
            }
            const isElim = eliminated.includes(i);
            return (
              <button
                key={i}
                className={`option-btn ${cls} ${isElim ? 'eliminated' : ''}`}
                onClick={() => handleAnswer(i)}
                disabled={answered || isElim}
              >
                <span className={`opt-label ${cls}`}>{labels[i]}</span>
                <span className="opt-text">{opt}</span>
                {answered && i === feedback?.correct_index && (
                  <span className="opt-check">✓</span>
                )}
                {answered && i === selectedIdx && i !== feedback?.correct_index && (
                  <span className="opt-x">✗</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {answered && feedback && (
          <div className="feedback-area fade-up">
            <div className={`feedback-banner ${feedback.correct ? 'correct' : 'wrong'}`}>
              {feedback.correct ? '🎉 Correct!' : selectedIdx === -2 ? '⏭️ Skipped' : timeLeft === 0 ? `⏰ ${t.timeUp}` : '❌ Incorrect'}
            </div>
            {feedback.explanation && (
              <div className="explanation-box">
                <strong>💡 {t.explanation}:</strong> {feedback.explanation}
              </div>
            )}
            <button className="next-btn" onClick={nextQuestion}>
              {currentQ + 1 < total ? `${t.next} →` : `🏁 ${t.finish}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
