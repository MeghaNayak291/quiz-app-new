const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Categories
  getCategories: () => req('/api/categories'),

  // Quiz
  getQuiz: (category, difficulty = 'medium', count = 10) =>
    req(`/api/quiz/${category}?difficulty=${difficulty}&count=${count}`),
  checkAnswer: (category, difficulty, questionId, selectedIndex) =>
    req('/api/quiz/check-answer', {
      method: 'POST',
      body: { category, difficulty, question_id: questionId, selected_index: selectedIndex }
    }),

  // Scores
  submitScore: (data) => req('/api/scores/submit', { method: 'POST', body: data }),
  getLeaderboard: (category, mode, limit = 20) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (mode) params.set('mode', mode);
    params.set('limit', limit);
    return req(`/api/leaderboard?${params}`);
  },
  getDailyLeaderboard: () => req('/api/leaderboard/daily'),

  // Rooms
  createRoom: (nickname, roomCode) => req('/api/rooms/create', { method: 'POST', body: { nickname, room_code: roomCode } }),
  joinRoom: (nickname, roomCode) => req('/api/rooms/join', { method: 'POST', body: { nickname, room_code: roomCode } }),
  getRoom: (code) => req(`/api/rooms/${code}`),
  submitRoomScore: (code, data) => req(`/api/rooms/${code}/score`, { method: 'POST', body: data }),
  getRoomLeaderboard: (code) => req(`/api/rooms/${code}/leaderboard`),

  // Daily Challenge
  getDailyChallenge: () => req('/api/daily-challenge'),
  checkDailyAnswer: (category, difficulty, questionId, selectedIndex) =>
    req('/api/daily-challenge/check-answer', {
      method: 'POST',
      body: { category, difficulty, question_id: questionId, selected_index: selectedIndex }
    }),

  // AI
  getSuggestion: (category, nickname) =>
    req(`/api/ai/suggest-quiz/${category}?nickname=${encodeURIComponent(nickname)}`),

  // Admin
  getAdminStats: () => req('/api/admin/stats'),
  getAdminQuestions: (category) => req(`/api/admin/questions${category ? `?category=${category}` : ''}`),
  addQuestion: (data) => req('/api/admin/questions/add', { method: 'POST', body: data }),
  deleteQuestion: (category, difficulty, id) =>
    req(`/api/admin/questions/${category}/${difficulty}/${id}`, { method: 'DELETE' }),
  exportScores: () => req('/api/admin/export-scores'),
  deactivateRoom: (code) => req(`/api/admin/rooms/${code}`, { method: 'DELETE' }),
};
