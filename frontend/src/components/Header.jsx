import React from 'react';

const Header = ({ user, onLogout }) => {
    return (
        <header className="header">
            <div className="header-title">Verwaltungs-Dashboard</div>
            <div className="header-user-info">
                <span>Willkommen, {user.username}</span>
                <button onClick={onLogout} className="logout-button">Logout</button>
            </div>
        </header>
    );
};

export default Header;
