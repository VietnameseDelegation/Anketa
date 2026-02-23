import React, { useState, useEffect } from 'react';

interface Option {
    id: string;
    text: string;
    votes: number;
}

interface PollData {
    question: string;
    options: Option[];
    hasVoted: boolean;
}

const PollApp: React.FC = () => {
    const [poll, setPoll] = useState<PollData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [resetToken, setResetToken] = useState('');

    const API_URL = import.meta.env.MODE === 'development' ? 'http://localhost:5000/api' : '/api';

    const fetchPoll = async () => {
        try {
            const res = await fetch(`${API_URL}/poll`);
            const data = await res.json();
            setPoll(data);
            if (data.hasVoted) setShowResults(true);
        } catch (err) {
            setError('Nepodařilo se načíst anketu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoll();
    }, []);

    const handleVote = async (optionId: string) => {
        try {
            const res = await fetch(`${API_URL}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ optionId }),
            });
            const data = await res.json();
            if (res.ok) {
                setPoll(prev => prev ? { ...prev, options: data.options, hasVoted: true } : null);
                setShowResults(true);
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Hlasování se nezdařilo.');
        }
    };

    const handleReset = async () => {
        try {
            const res = await fetch(`${API_URL}/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: resetToken }),
            });
            const data = await res.json();
            if (res.ok) {
                setPoll(prev => prev ? { ...prev, options: data.options, hasVoted: false } : null);
                setShowResults(false);
                setResetToken('');
                // Force cookie clearing if needed
                document.cookie = "voted=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                alert(data.message);
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Reset se nezdařil.');
        }
    };

    if (loading) return <div className="poll-loading">Načítání...</div>;
    if (error) return <div className="poll-error">{error}</div>;
    if (!poll) return null;

    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

    return (
        <div className="poll-container">
            <h1 className="poll-title">{poll.question}</h1>

            {!showResults ? (
                <div className="poll-options">
                    {poll.options.map(option => (
                        <button
                            key={option.id}
                            className="poll-option-btn"
                            onClick={() => handleVote(option.id)}
                        >
                            {option.text}
                        </button>
                    ))}
                    <button className="poll-view-btn" onClick={() => setShowResults(true)}>
                        Zobrazit výsledky bez hlasování
                    </button>
                </div>
            ) : (
                <div className="poll-results">
                    {poll.options.map(option => {
                        const percentage = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);
                        return (
                            <div key={option.id} className="result-item">
                                <div className="result-info">
                                    <span className="result-text">{option.text}</span>
                                    <span className="result-count">{option.votes} hlasů ({percentage}%)</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                    <div className="result-summary">Celkem hlasů: {totalVotes}</div>
                    {!poll.hasVoted && (
                        <button className="poll-view-btn" onClick={() => setShowResults(false)}>
                            Zpět k hlasování
                        </button>
                    )}
                </div>
            )}

            <div className="poll-admin">
                <h3>Administrace</h3>
                <input
                    type="password"
                    placeholder="Admin Token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                />
                <button className="reset-btn" onClick={handleReset}>Resetovat hlasování</button>
            </div>
        </div>
    );
};

export default PollApp;
