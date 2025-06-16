import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [modules, setModules] = useState([]);
    const [error, setError] = useState('');

    const fetchModules = async (currentToken) => {
        try {
            const response = await axios.get('http://localhost:3009/api/modules', {
                headers: { Authorization: `Bearer ${currentToken}` },
            });
            setModules(response.data.filter(m => m.enabled));
        } catch (err) {
            console.error('Error fetching modules:', err);
            setError('Fehler beim Laden der Module.');
        }
    };

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (Date.now() >= decoded.exp * 1000) {
                    handleLogout();
                } else {
                    setUser({ username: decoded.username, roles: decoded.roles });
                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify({ username: decoded.username, roles: decoded.roles }));
                    fetchModules(token);
                }
            } catch (err) {
                console.error('Invalid token:', err);
                handleLogout();
            }
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }, [token]);

    const handleLogin = async (username, password) => {
        setError('');
        try {
            const response = await axios.post('http://localhost:3009/api/auth/login', { 
                username: username.trim(), 
                password: password.trim() 
            });
            setToken(response.data.token);
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Login fehlgeschlagen. Bitte versuchen Sie es erneut.');
        }
    };

    const handleLogout = () => {
        setToken(null);
        setUser(null);
        setModules([]);
    };

    return (
        <div className="App">
            {token && user ? (
                <Dashboard user={user} modules={modules} onLogout={handleLogout} />
            ) : (
                <Login handleLogin={handleLogin} error={error} />
            )}
        </div>
    );
}

export default App;
