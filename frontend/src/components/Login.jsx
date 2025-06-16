import React, { useState } from 'react';

const Login = ({ handleLogin, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const onSubmit = (e) => {
        e.preventDefault();
        handleLogin(username, password);
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Anmelden</h2>
                <form onSubmit={onSubmit}>
                    <div className="input-group">
                        <label htmlFor="username">Benutzername</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Passwort</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="login-button">Login</button>
                </form>
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default Login;
