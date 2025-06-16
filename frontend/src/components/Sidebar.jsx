import React, { useState, useEffect } from 'react';

const Sidebar = ({ modules, activeModule, setActiveModule }) => {
    // This state will track which top-level menus are open
    const [openMenus, setOpenMenus] = useState({});

    // When the activeModule changes, ensure its parent menu is open
    useEffect(() => {
        const parentMenu = modules.find(m => m.subItems?.some(sub => sub.id === activeModule));
        if (parentMenu) {
            setOpenMenus(prev => ({ ...prev, [parentMenu.id]: true }));
        }
    }, [activeModule, modules]);

    const toggleMenu = (menuId) => {
        setOpenMenus(prevOpenMenus => ({
            ...prevOpenMenus,
            [menuId]: !prevOpenMenus[menuId]
        }));
    };

    const handleItemClick = (itemId) => {
        setActiveModule(itemId);
    };

    return (
        <aside className="sidebar">
            <nav>
                <ul>
                    {modules.map(mod => (
                        <li key={mod.id} className={`menu-item-container ${mod.subItems && mod.subItems.length > 0 ? 'has-submenu' : ''}`}>
                            {mod.subItems && mod.subItems.length > 0 ? (
                                <>
                                    <a href="#" className="menu-item" onClick={(e) => { e.preventDefault(); toggleMenu(mod.id); }}>
                                        <span>{mod.name}</span>
                                        <span className={`arrow ${openMenus[mod.id] ? 'open' : ''}`}>&#9660;</span>
                                    </a>
                                    {openMenus[mod.id] && (
                                        <ul className="submenu">
                                            {mod.subItems.map(subItem => (
                                                <li key={subItem.id} className={subItem.id === activeModule ? 'active' : ''}>
                                                    <a href="#" onClick={() => handleItemClick(subItem.id)}>
                                                        {subItem.name}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            ) : (
                                <a href="#" 
                                   onClick={() => handleItemClick(mod.id)}
                                   className={`menu-item ${mod.id === activeModule ? 'active' : ''}`}
                                >
                                    <span>{mod.name}</span>
                                </a>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
