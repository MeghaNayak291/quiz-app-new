import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import RoomLobby from './pages/RoomLobby.jsx';

// Persist session to sessionStorage
const SESSION_KEY = 'qm_user';

export default function App() {
  const [screen, setScreen] = useState(() => {
    if (window.location.pathname === '/admin') return 'admin';
    return 'login';
  });
  const [user, setUser] = useState(null);
  const [quizConfig, setQuizConfig] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  // Restore session & handle popstate
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/admin') {
        setScreen('admin');
      } else {
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved) {
          const u = JSON.parse(saved);
          setUser(u);
          setScreen(u.roomCode ? 'lobby' : 'home');
        } else {
          setScreen('login');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    if (window.location.pathname !== '/admin') {
      try {
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved) {
          const u = JSON.parse(saved);
          setUser(u);
          setScreen(u.roomCode ? 'lobby' : 'home');
        }
      } catch (e) { }
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData)); } catch (e) { }
    setScreen(userData.roomCode ? 'lobby' : 'home');
  };

  const handleLogout = () => {
    setUser(null);
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { }
    setScreen('login');
  };

  const handleStartQuiz = (config) => {
    setQuizConfig(config);
    setScreen('quiz');
  };

  const handleQuizFinish = (result) => {
    setQuizResult(result);
    setScreen('results');
  };

  const handleRetry = () => {
    if (quizConfig) {
      setScreen('quiz');
      setQuizResult(null);
    }
  };

  const handleNav = (dest) => {
    if (dest === 'admin') {
      window.history.pushState({}, '', '/admin');
      setScreen('admin');
      return;
    }

    // If navigating away from admin, reset URL
    if (screen === 'admin') {
      window.history.pushState({}, '', '/');
    }

    if (dest === 'leaderboard') setScreen('leaderboard');
    if (dest === 'home') setScreen('home');
    if (dest === 'login') handleLogout();
  };

  return (
    <>
      {screen === 'login' && (
        <LoginPage onLogin={handleLogin} />
      )}
      {screen === 'home' && (
        <HomePage
          user={user}
          onStartQuiz={handleStartQuiz}
          onNav={handleNav}
        />
      )}
      {screen === 'quiz' && (
        <QuizPage
          config={quizConfig}
          user={user}
          onFinish={handleQuizFinish}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'results' && quizResult && (
        <ResultsPage
          result={quizResult}
          user={user}
          onHome={(dest) => setScreen(dest || 'home')}
          onRetry={handleRetry}
        />
      )}
      {screen === 'leaderboard' && (
        <LeaderboardPage
          user={user}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'admin' && (
        <AdminPage onBack={() => handleNav('home')} />
      )}
      {screen === 'lobby' && user?.roomCode && (
        <RoomLobby
          user={user}
          onStartQuiz={handleStartQuiz}
          onBack={() => {
            const u = { ...user, roomCode: null, isHost: false };
            setUser(u);
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
            setScreen('home');
          }}
        />
      )}
    </>
  );
}
