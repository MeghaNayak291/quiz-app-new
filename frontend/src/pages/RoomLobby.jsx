import { useState, useEffect } from 'react';
import { api } from '../api.js';
import './RoomLobby.css';

export default function RoomLobby({ user, onStartQuiz, onBack }) {
    const [room, setRoom] = useState(null);
    const [categories, setCategories] = useState([]);
    const [config, setConfig] = useState({ category: 'html', difficulty: 'medium', lang: 'en' });
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        // Initial load
        fetchRoom();
        api.getCategories().then(d => {
            setCategories(d.categories);
            if (d.categories.length > 0) setConfig(c => ({ ...c, category: d.categories[0].id }));
        }).catch(() => { });

        // Polling
        const timer = setInterval(fetchRoom, 3000);
        return () => clearInterval(timer);
    }, []);

    const fetchRoom = async () => {
        try {
            const res = await api.getRoom(user.roomCode);
            const r = res.room;
            setRoom(r);
            setLoading(false);

            // If game started by host, redirect joiners
            if (r.game_started && !user.isHost) {
                onStartQuiz({
                    category: r.category,
                    difficulty: r.difficulty,
                    lang: r.lang,
                    mode: 'room',
                    roomCode: r.code,
                    nickname: user.nickname,
                    count: 10
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleStart = async () => {
        setStarting(true);
        try {
            await api.startRoom(user.roomCode, config.category, config.difficulty, config.lang);
            onStartQuiz({
                category: config.category,
                difficulty: config.difficulty,
                lang: config.lang,
                mode: 'room',
                roomCode: user.roomCode,
                nickname: user.nickname,
                count: 10
            });
        } catch (e) {
            alert(e.message);
        }
        setStarting(false);
    };

    if (loading || !room) {
        return <div className="lobby-wrap"><div className="lobby-loading">Finding your room...</div></div>;
    }

    return (
        <div className="lobby-wrap">
            <div className="lobby-bg" />
            <div className="lobby-container fade-up">
                <header className="lobby-header">
                    <button className="back-btn" onClick={onBack}>← Leave</button>
                    <div className="room-info">
                        <span className="room-label">ROOM CODE</span>
                        <h1 className="room-code">{room.code}</h1>
                    </div>
                    <div className="player-count">
                        <span className="count-num">{room.players.length}</span>
                        <span className="count-label">Players Joined</span>
                    </div>
                </header>

                <div className="lobby-main">
                    {/* Players List */}
                    <div className="players-section">
                        <h2 className="section-title">Players in Lobby</h2>
                        <div className="players-list">
                            {room.players.map((p, i) => (
                                <div key={i} className={`player-card ${p.nickname === user.nickname ? 'is-you' : ''}`}>
                                    <div className="player-avatar">{p.nickname[0].toUpperCase()}</div>
                                    <div className="player-name">
                                        {p.nickname}
                                        {p.nickname === room.host && <span className="host-badge">HOST</span>}
                                        {p.nickname === user.nickname && <span className="you-tag">(You)</span>}
                                    </div>
                                    <div className="player-status">Ready</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Settings / Status */}
                    <div className="settings-section">
                        {(user.isHost || user.nickname === room.host) ? (
                            <>
                                <h2 className="section-title">Room Settings</h2>
                                <div className="lobby-settings">
                                    <div className="setting-group">
                                        <label>Category</label>
                                        <select
                                            value={config.category}
                                            onChange={e => setConfig({ ...config, category: e.target.value })}
                                            className="lobby-select"
                                        >
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="setting-group">
                                        <label>Difficulty</label>
                                        <select
                                            value={config.difficulty}
                                            onChange={e => setConfig({ ...config, difficulty: e.target.value })}
                                            className="lobby-select"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                    <div className="setting-group">
                                        <label>Language</label>
                                        <select
                                            value={config.lang}
                                            onChange={e => setConfig({ ...config, lang: e.target.value })}
                                            className="lobby-select"
                                        >
                                            <option value="en">English 🇺🇸</option>
                                            <option value="hi">Hindi 🇮🇳</option>
                                            <option value="kn">Kannada 🇮🇳</option>
                                        </select>
                                    </div>
                                    <button className="lobby-start-btn" onClick={handleStart} disabled={starting}>
                                        {starting ? 'Starting...' : '🚀 Start Quiz for Everyone'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="wait-card">
                                <div className="wait-icon">⏳</div>
                                <h3>Get Ready!</h3>
                                <p>Waiting for the host ({room.host}) to start the quiz.</p>
                                <div className="pulse-loader" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
