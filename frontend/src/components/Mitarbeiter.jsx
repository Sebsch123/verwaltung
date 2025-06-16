import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MitarbeiterDetail from './MitarbeiterDetail';
import { FaSortUp, FaSortDown } from 'react-icons/fa';
import { FaFilter } from 'react-icons/fa';

const Mitarbeiter = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'employeeId', direction: 'asc' });
    const [columnFilters, setColumnFilters] = useState({ employeeId: '', username: '', firstName: '', lastName: '', status:'', abteilung:'', eintrittsdatum:'' });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError('');
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Keine Berechtigung. Bitte neu anmelden.');
                    setLoading(false);
                    return;
                }

                const response = await axios.get('http://localhost:3009/api/users', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const filteredUsers = response.data.filter(user => user.username !== 'admin');
                setUsers(filteredUsers);
            } catch (err) {
                console.error('Error fetching users:', err);
                const detailedError = err.response?.data?.error || 'Keine weiteren Details verfügbar.';
                setError(`Fehler beim Laden der Mitarbeiterliste: ${err.response?.data?.message} (${detailedError})`);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleUserSelect = (userId) => {
        setSelectedUserId(userId);
        setIsCreating(false);
    };

    const handleBackToList = () => {
        setSelectedUserId(null);
        setIsCreating(false);
    };

    const handleShowCreateForm = () => {
        setSelectedUserId(null);
        setIsCreating(true);
    };

    const handleUserUpdate = (updatedUser) => {
        setUsers(users.map(user => (user._id === updatedUser._id ? updatedUser : user)));
    };

    const handleUserDeleted = (deletedId) => {
        setUsers(users.filter(u => u._id !== deletedId));
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleColumnFilterChange = (key, value) => {
        setColumnFilters(prev => ({ ...prev, [key]: value }));
    };

    const filteredUsers = users.filter(u => {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
            (u.employeeId || '').toLowerCase().includes(q) ||
            u.username.toLowerCase().includes(q) ||
            (u.firstName || '').toLowerCase().includes(q) ||
            (u.lastName || '').toLowerCase().includes(q) ||
            (u.status || '').toLowerCase().includes(q) ||
            (u.abteilung || '').toLowerCase().includes(q) ||
            (u.eintrittsdatum || '').toLowerCase().includes(q);

        const matchesColumnFilters =
            (u.employeeId || '').toLowerCase().includes(columnFilters.employeeId.toLowerCase()) &&
            u.username.toLowerCase().includes(columnFilters.username.toLowerCase()) &&
            (u.firstName || '').toLowerCase().includes(columnFilters.firstName.toLowerCase()) &&
            (u.lastName || '').toLowerCase().includes(columnFilters.lastName.toLowerCase()) &&
            (u.status || '').toLowerCase().includes(columnFilters.status.toLowerCase()) &&
            (u.abteilung || '').toLowerCase().includes(columnFilters.abteilung.toLowerCase()) &&
            (u.eintrittsdatum || '').toLowerCase().includes(columnFilters.eintrittsdatum.toLowerCase());

        return matchesSearch && matchesColumnFilters;
    });

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        const { key, direction } = sortConfig;
        let valA = a[key] || '';
        let valB = b[key] || '';
        // Parse date for eintrittsdatum
        if (key === 'eintrittsdatum') {
            valA = valA ? new Date(valA) : new Date(0);
            valB = valB ? new Date(valB) : new Date(0);
        }
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    if (loading) {
        return <div className="loading-spinner">Wird geladen...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (selectedUserId) {
        return <MitarbeiterDetail userId={selectedUserId} onBack={handleBackToList} onUserUpdated={handleUserUpdate} onUserDeleted={handleUserDeleted} />;
    }

    if (isCreating) {
        const handleCreated = (newUser) => {
            setUsers([...users, newUser]);
            handleBackToList();
        };
        return <MitarbeiterDetail onBack={handleBackToList} onUserCreated={handleCreated} />;
    }

    return (
        <div className="mitarbeiter-liste">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Mitarbeiterübersicht</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        placeholder="Suche..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ padding: '0.3rem 0.6rem' }}
                    />
                    <button onClick={handleShowCreateForm} className="action-button save">+ Mitarbeiter anlegen</button>
                    <button onClick={() => setShowFilters(prev=>!prev)} className="action-button" title="Spaltenfilter"><FaFilter/></button>
                </div>
            </div>
            <table className="mitarbeiter-table">
                <thead>
                    <tr>
                        <th onMouseDown={e => e.preventDefault()} onClick={() => requestSort('employeeId')} className="sortable">ID {sortConfig.key === 'employeeId' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}</th>
                        <th onMouseDown={e => e.preventDefault()} onClick={() => requestSort('username')} className="sortable">Benutzername {sortConfig.key === 'username' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}</th>
                        <th onMouseDown={e => e.preventDefault()} onClick={() => requestSort('firstName')} className="sortable">Vorname {sortConfig.key === 'firstName' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}</th>
                        <th onMouseDown={e => e.preventDefault()} onClick={() => requestSort('lastName')} className="sortable">Nachname {sortConfig.key === 'lastName' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}</th>
                        <th onMouseDown={e => e.preventDefault()} onClick={() => requestSort('status')} className="sortable">Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}</th>
                        <th onMouseDown={e => e.preventDefault()} onClick={() => requestSort('abteilung')} className="sortable">Abteilung {sortConfig.key === 'abteilung' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}</th>
                        <th onMouseDown={e => e.preventDefault()} onClick={() => requestSort('eintrittsdatum')} className="sortable">Eintrittsdatum {sortConfig.key === 'eintrittsdatum' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}</th>
                    </tr>
                    {showFilters && (
                    <tr className="filter-row">
                        <th><input type="text" value={columnFilters.employeeId} onChange={e => handleColumnFilterChange('employeeId', e.target.value)} placeholder="Filter ID"/></th>
                        <th><input type="text" value={columnFilters.username} onChange={e => handleColumnFilterChange('username', e.target.value)} placeholder="Filter Benutzer"/></th>
                        <th><input type="text" value={columnFilters.firstName} onChange={e => handleColumnFilterChange('firstName', e.target.value)} placeholder="Filter Vorname"/></th>
                        <th><input type="text" value={columnFilters.lastName} onChange={e => handleColumnFilterChange('lastName', e.target.value)} placeholder="Filter Nachname"/></th>
                        <th><input type="text" value={columnFilters.status} onChange={e => handleColumnFilterChange('status', e.target.value)} placeholder="Filter Status"/></th>
                        <th><input type="text" value={columnFilters.abteilung} onChange={e => handleColumnFilterChange('abteilung', e.target.value)} placeholder="Filter Abteilung"/></th>
                        <th><input type="text" value={columnFilters.eintrittsdatum} onChange={e => handleColumnFilterChange('eintrittsdatum', e.target.value)} placeholder="YYYY-MM-DD"/></th>
                    </tr>
                    )}
                </thead>
                <tbody>
                    {sortedUsers.map(user => (
                        <tr key={user._id} onClick={() => handleUserSelect(user._id)} className="clickable-row">
                            <td>{user.employeeId}</td>
                            <td>{user.username}</td>
                            <td>{user.firstName}</td>
                            <td>{user.lastName}</td>
                            <td><span className={`status-badge status-${user.status}`}>{user.status}</span></td>
                            <td>{user.abteilung}</td>
                            <td>{user.eintrittsdatum ? new Date(user.eintrittsdatum).toLocaleDateString('de-DE') : ''}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Mitarbeiter;
