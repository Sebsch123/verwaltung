import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MainContent from './MainContent';

const Dashboard = ({ user, modules, onLogout }) => {
    const [activeModuleId, setActiveModuleId] = useState(modules[0]?.id || 'dashboard');

    // Find the full object for the active module or sub-item
    let activeModule = null;
    if (modules) {
        for (const mod of modules) {
            if (mod.id === activeModuleId) {
                activeModule = mod;
                break;
            }
            if (mod.subItems) {
                const subItem = mod.subItems.find(sub => sub.id === activeModuleId);
                if (subItem) {
                    activeModule = subItem;
                    break;
                }
            }
        }
    }

    // Fallback if nothing is found
    if (!activeModule && modules && modules.length > 0) {
        activeModule = modules[0];
        if(activeModule.subItems && activeModule.subItems.length > 0) {
            // if the main module has subitems, select the first one by default
            activeModule = activeModule.subItems[0];
        } 
    }

    return (
        <div className="dashboard-layout">
            <Header user={user} onLogout={onLogout} />
            <div className="dashboard-body">
                <Sidebar modules={modules} activeModule={activeModuleId} setActiveModule={setActiveModuleId} />
                <MainContent module={activeModule} />
            </div>
        </div>
    );
};

export default Dashboard;
