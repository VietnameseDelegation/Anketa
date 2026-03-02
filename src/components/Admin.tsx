import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Admin: React.FC = () => {
    const [resetToken, setResetToken] = useState('');
    const navigate = useNavigate();

    const API_URL = import.meta.env.MODE === 'development' ? 'http://localhost:5000/api' : '/api';

    const handleReset = async () => {
        try {
            const res = await fetch(`${API_URL}/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: resetToken }),
            });
            const data = await res.json();
            if (res.ok) {
                // Force cookie clearing if needed
                document.cookie = "voted=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                alert(data.message);
                navigate('/');
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Reset se nezdařil.');
        }
    };

    return (
        <div className="poll-container">
            <h1 className="poll-title">Administrace ankety</h1>
            <div className="poll-admin" style={{ display: 'block', marginTop: '20px' }}>
                <input
                    type="password"
                    placeholder="Admin Token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                />
                <button className="reset-btn" onClick={handleReset}>Resetovat hlasování</button>
            </div>
            <button className="poll-view-btn" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
                Zpět na anketu
            </button>
        </div>
    );
};

export default Admin;
