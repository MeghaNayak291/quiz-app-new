# QuizMaster AI 🧠

A full-stack AI-powered quiz application with a modern blue-black UI theme.

## 🚀 Tech Stack

- **Frontend**: React + Vite
- **Backend**: FastAPI (Python)
- **Storage**: JSON files (no database needed)
- **Voice**: Browser Web Speech API (synthesis + recognition)

## 📁 Folder Structure

```
quiz-app/
├── frontend/          # React + Vite app
│   └── src/
│       ├── pages/     # LoginPage, HomePage, QuizPage, ResultsPage, LeaderboardPage, AdminPage
│       ├── components/ # Confetti
│       ├── App.jsx    # Router
│       ├── api.js     # API client
│       └── index.css  # Global styles
├── backend/
│   ├── main.py        # FastAPI app
│   └── requirements.txt
└── data/
    ├── questions.json # All quiz questions (10 subjects × 3 difficulties)
    ├── scores.json    # Score history
    └── rooms.json     # Active rooms
```

## ⚙️ Setup & Run

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API runs at: http://localhost:8000  
Swagger docs: http://localhost:8000/docs

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

App runs at: http://localhost:5173

## 🎮 Features

### Quiz Modes
- ⚡ **Start Challenge** – Full quiz with all features enabled
- 📅 **Daily Challenge** – A new daily quiz seeded from today's date
- 📚 **Practice Exam** – No timer, learn at your own pace
- ⚙️ **Custom Quiz** – Configure topic + difficulty
- 🎓 **Exam Model** – Strict exam simulation
- 📖 **Subject-wise** – Deep dive into one subject
- 🌐 **Language Quiz** – UI text in English / Hindi / Kannada
- 🏆 **Level-based** – Progressive Easy → Medium → Hard

### Subjects
HTML, CSS, JavaScript, Python, DBMS, General Knowledge, AI/ML, Aptitude, Operating System, Networks

### Gameplay
- ⏱️ 30-second countdown timer per question
- ⚖️ 50:50 lifeline
- 💡 Hint lifeline
- ⏭️ Skip lifeline
- 🔊 Voice reading of questions (browser TTS)
- ✅ Instant correct/wrong feedback with explanation
- 📊 Live score tracking
- 🎉 Confetti on high scores (≥80%)

### Multiplayer Rooms
- Create a room (auto or custom code)
- Share 6-character code with friends
- Room-specific leaderboard

### Leaderboard
- Global rankings with podium for top 3
- Daily challenge rankings
- Room-specific rankings
- Filter by subject

### Admin Panel (`/admin` button in header)
- Dashboard with key stats
- Browse & delete questions by subject/difficulty
- Add new questions with form
- Export all scores as CSV

### AI Features
- Personalized difficulty suggestion based on past performance
- Daily challenge seeded consistently per day

## 🔧 Configuration

Change API URL by setting `VITE_API_URL` in a `.env` file:

```
VITE_API_URL=http://your-backend-url:8000
```

## 📦 Production Build

```bash
cd frontend
npm run build
# Serve the dist/ folder with any static host
```

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```
