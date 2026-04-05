from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import random, json, os, datetime, string, uuid

app = FastAPI(title="QuizMaster AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── File paths ─────────────────────────────────────────────────────────────────
BASE = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE, "..", "data")
QUESTIONS_FILE = os.path.join(DATA_DIR, "questions.json")
SCORES_FILE    = os.path.join(DATA_DIR, "scores.json")
ROOMS_FILE     = os.path.join(DATA_DIR, "rooms.json")

def load_json(path, default):
    try:
        with open(path, "r") as f:
            return json.load(f)
    except:
        return default

def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

# ── Models ─────────────────────────────────────────────────────────────────────
class AnswerSubmit(BaseModel):
    question_id: int
    selected_index: int
    category: str
    difficulty: str = "medium"

class ScoreSubmit(BaseModel):
    nickname: str
    category: str
    difficulty: str
    score: int
    total: int
    mode: str = "practice"
    time_taken: int = 0

class RoomCreate(BaseModel):
    nickname: str
    room_code: Optional[str] = None

class RoomJoin(BaseModel):
    nickname: str
    room_code: str

class QuestionAdd(BaseModel):
    category: str
    difficulty: str
    question: str
    options: List[str]
    answer: int
    explanation: str
    hint: str = ""

class DailyChallengeSet(BaseModel):
    category: str
    difficulty: str = "medium"
    date: Optional[str] = None

# ── Helpers ─────────────────────────────────────────────────────────────────────
def get_questions():
    return load_json(QUESTIONS_FILE, {})

def get_scores():
    return load_json(SCORES_FILE, [])

def get_rooms():
    return load_json(ROOMS_FILE, {})

CATEGORIES_META = {
    "html":       {"name": "HTML",             "icon": "🌐", "tag": "Web",      "color": "#e34c26"},
    "css":        {"name": "CSS",              "icon": "🎨", "tag": "Styling",  "color": "#264de4"},
    "javascript": {"name": "JavaScript",       "icon": "⚡", "tag": "Core",     "color": "#f7df1e"},
    "python":     {"name": "Python",           "icon": "🐍", "tag": "Backend",  "color": "#3776ab"},
    "dbms":       {"name": "DBMS",             "icon": "🗄️", "tag": "Database", "color": "#336791"},
    "gk":         {"name": "General Knowledge","icon": "🌍", "tag": "GK",       "color": "#2ecc71"},
    "aiml":       {"name": "AI / ML",          "icon": "🤖", "tag": "AI",       "color": "#9b59b6"},
    "aptitude":   {"name": "Aptitude",         "icon": "🧮", "tag": "Math",     "color": "#e74c3c"},
    "os":         {"name": "Operating System", "icon": "💻", "tag": "System",   "color": "#1abc9c"},
    "networks":   {"name": "Networks",         "icon": "🌐", "tag": "Network",  "color": "#3498db"},
}

# ── Root ────────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "QuizMaster AI API v2.0 🚀", "docs": "/docs"}

# ── Categories ──────────────────────────────────────────────────────────────────
@app.get("/api/categories")
def get_categories():
    qs = get_questions()
    cats = []
    for cat_id, meta in CATEGORIES_META.items():
        if cat_id in qs:
            total = sum(len(qs[cat_id].get(d, [])) for d in ["easy", "medium", "hard"])
            cats.append({
                "id": cat_id,
                "name": meta["name"],
                "icon": meta["icon"],
                "tag": meta["tag"],
                "color": meta["color"],
                "count": total
            })
    return {"categories": cats}

# ── Quiz ────────────────────────────────────────────────────────────────────────
@app.get("/api/quiz/{category}")
def get_quiz(category: str, difficulty: str = "medium", count: int = 10, shuffle: bool = True):
    qs = get_questions()
    if category not in qs:
        raise HTTPException(404, f"Category '{category}' not found")
    
    cat_qs = qs[category]
    diff_qs = cat_qs.get(difficulty, [])
    
    if not diff_qs:
        # fallback: mix all difficulties
        diff_qs = []
        for d in ["easy", "medium", "hard"]:
            diff_qs.extend(cat_qs.get(d, []))
    
    selected = diff_qs.copy()
    if shuffle:
        random.shuffle(selected)
    selected = selected[:min(count, len(selected))]
    
    # Remove answers for client
    sanitized = []
    for q in selected:
        sq = {k: v for k, v in q.items() if k != "answer"}
        sanitized.append(sq)
    
    return {
        "category": category,
        "category_name": CATEGORIES_META.get(category, {}).get("name", category),
        "difficulty": difficulty,
        "total": len(sanitized),
        "questions": sanitized
    }

@app.post("/api/quiz/check-answer")
def check_answer(body: AnswerSubmit):
    qs = get_questions()
    cat = body.category
    if cat not in qs:
        raise HTTPException(404, "Category not found")
    
    # search all difficulties
    q = None
    for diff in ["easy", "medium", "hard"]:
        q = next((x for x in qs[cat].get(diff, []) if x["id"] == body.question_id), None)
        if q:
            break
    
    if not q:
        raise HTTPException(404, "Question not found")
    
    correct = body.selected_index == q["answer"]
    return {
        "correct": correct,
        "correct_index": q["answer"],
        "explanation": q.get("explanation", ""),
        "hint": q.get("hint", "")
    }

# ── Scores & Leaderboard ────────────────────────────────────────────────────────
@app.post("/api/scores/submit")
def submit_score(body: ScoreSubmit):
    scores = get_scores()
    pct = round((body.score / body.total) * 100) if body.total > 0 else 0
    entry = {
        "id": str(uuid.uuid4()),
        "nickname": body.nickname,
        "category": body.category,
        "difficulty": body.difficulty,
        "score": body.score,
        "total": body.total,
        "percentage": pct,
        "mode": body.mode,
        "time_taken": body.time_taken,
        "date": datetime.datetime.now().isoformat()
    }
    scores.append(entry)
    save_json(SCORES_FILE, scores)
    return {"message": "Score saved!", "result": entry}

@app.get("/api/leaderboard")
def get_leaderboard(category: Optional[str] = None, mode: Optional[str] = None, limit: int = 20):
    scores = get_scores()
    filtered = scores
    if category:
        filtered = [s for s in filtered if s.get("category") == category]
    if mode:
        filtered = [s for s in filtered if s.get("mode") == mode]
    
    sorted_scores = sorted(filtered, key=lambda x: (x.get("percentage", 0), -x.get("time_taken", 999999)), reverse=True)
    
    # Add rank
    result = []
    for i, s in enumerate(sorted_scores[:limit]):
        s["rank"] = i + 1
        result.append(s)
    
    return {"leaderboard": result, "total": len(filtered)}

@app.get("/api/leaderboard/daily")
def get_daily_leaderboard():
    scores = get_scores()
    today = datetime.date.today().isoformat()
    daily = [s for s in scores if s.get("date", "").startswith(today)]
    sorted_scores = sorted(daily, key=lambda x: x.get("percentage", 0), reverse=True)
    for i, s in enumerate(sorted_scores[:20]):
        s["rank"] = i + 1
    return {"leaderboard": sorted_scores[:20], "date": today}

# ── Rooms ────────────────────────────────────────────────────────────────────────
@app.post("/api/rooms/create")
def create_room(body: RoomCreate):
    rooms = get_rooms()
    code = body.room_code or ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    if code in rooms:
        raise HTTPException(400, "Room code already exists")
    
    rooms[code] = {
        "code": code,
        "host": body.nickname,
        "players": [{"nickname": body.nickname, "score": 0, "joined": datetime.datetime.now().isoformat()}],
        "created": datetime.datetime.now().isoformat(),
        "active": True,
        "scores": []
    }
    save_json(ROOMS_FILE, rooms)
    return {"room_code": code, "room": rooms[code]}

@app.post("/api/rooms/join")
def join_room(body: RoomJoin):
    rooms = get_rooms()
    code = body.room_code.upper()
    if code not in rooms:
        raise HTTPException(404, "Room not found")
    if not rooms[code]["active"]:
        raise HTTPException(400, "Room is no longer active")
    
    # Check if player already in room
    existing = [p for p in rooms[code]["players"] if p["nickname"] == body.nickname]
    if not existing:
        rooms[code]["players"].append({
            "nickname": body.nickname,
            "score": 0,
            "joined": datetime.datetime.now().isoformat()
        })
        save_json(ROOMS_FILE, rooms)
    
    return {"room": rooms[code]}

@app.get("/api/rooms/{code}")
def get_room(code: str):
    rooms = get_rooms()
    code = code.upper()
    if code not in rooms:
        raise HTTPException(404, "Room not found")
    return {"room": rooms[code]}

@app.post("/api/rooms/{code}/score")
def submit_room_score(code: str, body: ScoreSubmit):
    rooms = get_rooms()
    code = code.upper()
    if code not in rooms:
        raise HTTPException(404, "Room not found")
    
    pct = round((body.score / body.total) * 100) if body.total > 0 else 0
    score_entry = {
        "nickname": body.nickname,
        "score": body.score,
        "total": body.total,
        "percentage": pct,
        "date": datetime.datetime.now().isoformat()
    }
    
    if "scores" not in rooms[code]:
        rooms[code]["scores"] = []
    rooms[code]["scores"].append(score_entry)
    
    # Update player score
    for p in rooms[code]["players"]:
        if p["nickname"] == body.nickname:
            p["score"] = max(p.get("score", 0), pct)
    
    save_json(ROOMS_FILE, rooms)
    sorted_scores = sorted(rooms[code]["scores"], key=lambda x: x.get("percentage", 0), reverse=True)
    return {"leaderboard": sorted_scores, "room": rooms[code]}

@app.get("/api/rooms/{code}/leaderboard")
def get_room_leaderboard(code: str):
    rooms = get_rooms()
    code = code.upper()
    if code not in rooms:
        raise HTTPException(404, "Room not found")
    scores = sorted(rooms[code].get("scores", []), key=lambda x: x.get("percentage", 0), reverse=True)
    return {"leaderboard": scores, "players": rooms[code]["players"]}

# ── Admin ────────────────────────────────────────────────────────────────────────
@app.get("/api/admin/stats")
def admin_stats():
    scores = get_scores()
    rooms = get_rooms()
    qs = get_questions()
    
    total_questions = sum(
        len(qs[cat].get(d, []))
        for cat in qs
        for d in ["easy", "medium", "hard"]
    )
    
    today = datetime.date.today().isoformat()
    daily_scores = [s for s in scores if s.get("date", "").startswith(today)]
    
    return {
        "total_scores": len(scores),
        "total_rooms": len(rooms),
        "active_rooms": sum(1 for r in rooms.values() if r.get("active")),
        "total_questions": total_questions,
        "categories": len(qs),
        "today_scores": len(daily_scores),
        "top_category": max(
            [(cat, sum(1 for s in scores if s.get("category") == cat)) for cat in CATEGORIES_META],
            key=lambda x: x[1], default=("none", 0)
        )[0]
    }

@app.post("/api/admin/questions/add")
def add_question(body: QuestionAdd):
    qs = get_questions()
    if body.category not in qs:
        qs[body.category] = {"easy": [], "medium": [], "hard": []}
    
    diff_list = qs[body.category].get(body.difficulty, [])
    new_id = max([q["id"] for q in diff_list], default=0) + 1
    
    new_q = {
        "id": new_id,
        "question": body.question,
        "options": body.options,
        "answer": body.answer,
        "explanation": body.explanation,
        "hint": body.hint
    }
    
    if body.difficulty not in qs[body.category]:
        qs[body.category][body.difficulty] = []
    qs[body.category][body.difficulty].append(new_q)
    save_json(QUESTIONS_FILE, qs)
    return {"message": "Question added!", "question": new_q}

@app.delete("/api/admin/questions/{category}/{difficulty}/{question_id}")
def delete_question(category: str, difficulty: str, question_id: int):
    qs = get_questions()
    if category not in qs or difficulty not in qs[category]:
        raise HTTPException(404, "Category/difficulty not found")
    
    original = qs[category][difficulty]
    qs[category][difficulty] = [q for q in original if q["id"] != question_id]
    
    if len(qs[category][difficulty]) == len(original):
        raise HTTPException(404, "Question not found")
    
    save_json(QUESTIONS_FILE, qs)
    return {"message": "Question deleted!"}

@app.get("/api/admin/questions")
def list_all_questions(category: Optional[str] = None):
    qs = get_questions()
    if category:
        return {"questions": qs.get(category, {}), "category": category}
    return {"questions": qs}

@app.get("/api/admin/export-scores")
def export_scores():
    scores = get_scores()
    return {"scores": scores, "exported_at": datetime.datetime.now().isoformat(), "total": len(scores)}

@app.delete("/api/admin/rooms/{code}")
def delete_room(code: str):
    rooms = get_rooms()
    if code not in rooms:
        raise HTTPException(404, "Room not found")
    rooms[code]["active"] = False
    save_json(ROOMS_FILE, rooms)
    return {"message": f"Room {code} deactivated"}

# ── Daily Challenge ─────────────────────────────────────────────────────────────
@app.get("/api/daily-challenge")
def get_daily_challenge():
    today = datetime.date.today().isoformat()
    qs = get_questions()
    
    # Use date as seed for consistent daily quiz
    random.seed(today)
    
    all_qs = []
    for cat, cat_data in qs.items():
        for diff in ["easy", "medium", "hard"]:
            for q in cat_data.get(diff, []):
                all_qs.append({**q, "category": cat, "difficulty": diff})
    
    random.shuffle(all_qs)
    selected = all_qs[:10]
    sanitized = [{k: v for k, v in q.items() if k != "answer"} for q in selected]
    
    random.seed()  # reset seed
    return {
        "date": today,
        "questions": sanitized,
        "total": len(sanitized)
    }

@app.post("/api/daily-challenge/check-answer")
def check_daily_answer(body: AnswerSubmit):
    return check_answer(body)

# ── AI-generated questions (using existing questions as base + variation) ────────
@app.get("/api/ai/suggest-quiz/{category}")
def suggest_quiz(category: str, nickname: str = "player"):
    scores = get_scores()
    player_scores = [s for s in scores if s.get("nickname") == nickname and s.get("category") == category]
    
    if not player_scores:
        suggested_difficulty = "easy"
        message = "Start with easy questions to build confidence!"
    else:
        avg_pct = sum(s.get("percentage", 0) for s in player_scores) / len(player_scores)
        if avg_pct >= 80:
            suggested_difficulty = "hard"
            message = f"You're doing great ({avg_pct:.0f}% avg)! Try hard mode!"
        elif avg_pct >= 60:
            suggested_difficulty = "medium"
            message = f"Good progress ({avg_pct:.0f}% avg)! Try medium difficulty!"
        else:
            suggested_difficulty = "easy"
            message = f"Keep practicing ({avg_pct:.0f}% avg)! Stick with easy for now."
    
    return {
        "suggested_difficulty": suggested_difficulty,
        "message": message,
        "player_stats": {
            "attempts": len(player_scores),
            "avg_percentage": round(sum(s.get("percentage", 0) for s in player_scores) / len(player_scores), 1) if player_scores else 0
        }
    }
