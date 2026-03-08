import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Admin: React.FC = () => {
    const [resetToken, setResetToken] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const API_URL = import.meta.env.MODE === 'development' ? 'http://localhost:5000/api' : '/api';

    const handleReset = async () => {
        setIsSubmitting(true);
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
                toast.success(data.message || 'Reset byl úspěšný!');
                setTimeout(() => navigate('/'), 1500); // Wait for toast to show
            } else {
                toast.error(data.message || 'Nepodařilo se resetovat anketu.');
            }
        } catch {
            toast.error('Reset se nezdařil.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="poll-container">
                <h1 className="poll-title">Administrace ankety</h1>
                <div className="poll-admin" style={{ display: 'block', marginTop: '20px' }}>
                    <input
                        type="password"
                        placeholder="Admin Token"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                    />
                    <button className="reset-btn" onClick={handleReset} disabled={isSubmitting}>
                        {isSubmitting ? 'Zpracovává se...' : 'Resetovat hlasování'}
                    </button>
                </div>
                <button className="poll-view-btn" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
                    Zpět na anketu
                </button>
            </div>
        </>
    );
};

export default Admin;
