import React from 'react';
import Mitarbeiter from './Mitarbeiter';

const MainContent = ({ module }) => {
    if (!module) {
        return (
            <main className="main-content">
                <div className="content-header">
                    <h1>Willkommen</h1>
                </div>
                <div className="content-body">
                    <p>Bitte wählen Sie ein Modul aus der Seitenleiste aus.</p>
                </div>
            </main>
        );
    }

    const renderContent = () => {
        switch (module.id) {
            case 'mitarbeiter':
                return <Mitarbeiter />;
            case 'dashboard':
                 return <p>Hier könnte Ihr Dashboard mit wichtigen Kennzahlen stehen.</p>;
            default:
                return <p>Hier werden die Inhalte für das Modul \"{module.name}\" angezeigt.</p>;
        }
    };

    return (
        <main className="main-content">
            <div className="content-header">
                <h1>{module.name}</h1>
            </div>
            <div className="content-body">
                {renderContent()}
            </div>
        </main>
    );
};

export default MainContent;
