import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaEdit, FaKey, FaTrash } from 'react-icons/fa';
import axios from 'axios';

const MitarbeiterDetail = ({ userId, onBack, onUserUpdated, onUserCreated, onUserDeleted }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(!!userId);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('allgemein');
    const [isEditing, setIsEditing] = useState(!userId);
    const [formData, setFormData] = useState({});
    const [nameFields, setNameFields] = useState({ firstName: '', lastName: '' });
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                setError('');
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:3009/api/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(response.data);
                const { fullName, ...rest } = response.data;
                let first = '', last = '';
                if (fullName) {
                    const parts = fullName.split(' ');
                    first = parts.shift();
                    last = parts.join(' ');
                }
                setNameFields({ firstName: first, lastName: last });
                setFormData({ ...rest });
            } catch (err) {
                setError('Fehler beim Laden der Mitarbeiterdaten.');
            } finally {
                setLoading(false);
            }
        };

        const fetchNextId = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:3009/api/users/next-employee-id', { headers: { Authorization: `Bearer ${token}` } });
                setFormData(prev => ({ ...prev, employeeId: res.data.nextEmployeeId }));
            } catch (err) {
                console.error('Fehler beim Laden der nächsten Mitarbeiter-ID');
            }
        };

        if (userId) {
            fetchUser();
        } else {
            // new user – prefill next employee id
            fetchNextId();
            setNameFields({ firstName: '', lastName: '' });
        }
    }, [userId]);

    const handleEdit = (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        setFormData(user); // Reset form data to current user state
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (userId) {
            setFormData(user);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'firstName' || name === 'lastName') {
            setNameFields(prev => ({ ...prev, [name]: value }));
            return;
        }
        const keys = name.split('.');
        if (keys.length > 1) {
            setFormData(prev => ({
                ...prev,
                [keys[0]]: {
                    ...prev[keys[0]],
                    [keys[1]]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate employeeId – exactly 5 digits if provided
        if (isEditing && formData.employeeId && !/^\d{5}$/.test(formData.employeeId)) {
            setValidationError('Die Mitarbeiter-ID muss genau 5 Ziffern enthalten.');
            return;
        }

        const fullName = `${nameFields.firstName} ${nameFields.lastName}`.trim();
        const payload = { ...formData, fullName };

        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            if (userId) {
                // Update existing user
                const res = await axios.put(`http://localhost:3009/api/users/${userId}`, payload, { headers });
                setUser(res.data.user || res.data);
                if (onUserUpdated) onUserUpdated(res.data.user || res.data);
            } else {
                // Create new user
                const res = await axios.post('http://localhost:3009/api/users', payload, { headers });
                if (onUserCreated) onUserCreated(res.data);
            }
            setIsEditing(false);
            if (!userId) onBack();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || '';
            if (msg.includes('duplicate') || msg.includes('E11000')) {
                setValidationError('Die Mitarbeiter-ID ist bereits vergeben. Bitte wählen Sie eine andere.');
            } else if (msg.includes('Mitarbeiter-ID')) {
                setValidationError(msg);
            } else {
                setError(msg || 'Fehler beim Speichern.');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        // Returns date in YYYY-MM-DD format for input[type=date]
        return new Date(dateString).toISOString().split('T')[0];
    };

    const displayDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('de-DE');
    }

    // Password reset handler
    const handleResetPassword = async () => {
        if (!window.confirm('Möchten Sie das Passwort wirklich zurücksetzen?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:3009/api/users/${userId}/reset-password`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert('Passwort wurde zurückgesetzt und per E-Mail versendet.');
        } catch (err) {
            alert(err.response?.data?.message || 'Fehler beim Zurücksetzen des Passworts');
        }
    };

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3009/api/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
            if (onUserDeleted) onUserDeleted(userId);
            onBack();
        } catch (err) {
            alert(err.response?.data?.message || 'Fehler beim Löschen');
        }
    };

    const ValidationModal = () => (
        validationError ? (
            <div className="modal-overlay">
                <div className="modal">
                    <h3>Eingabefehler</h3>
                    <p>{validationError}</p>
                    <div className="modal-actions">
                        <button className="action-button" onClick={() => setValidationError('')}>OK</button>
                    </div>
                </div>
            </div>
        ) : null
    );

    const DeleteConfirmModal = () => (
        confirmDelete ? (
            <div className="modal-overlay">
                <div className="modal">
                    <h3>Benutzer löschen</h3>
                    <p>Möchten Sie diesen Benutzer wirklich löschen?</p>
                    <div className="modal-actions">
                        <button className="action-button danger" onClick={() => { setConfirmDelete(false); handleDelete(); }}>Ja, löschen</button>
                        <button className="action-button" onClick={() => setConfirmDelete(false)}>Abbrechen</button>
                    </div>
                </div>
            </div>
        ) : null
    );

    if (loading) return <div className="loading-spinner">Lade Stammdaten...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (userId && !user) return <div>Keine Benutzerdaten gefunden.</div>;

    return (
        <form className="stammdaten-ansicht" onSubmit={handleSubmit}>
            {/* Validation modal */}
            <ValidationModal />

            <div className="header-bar">
                <button type="button" onClick={onBack} className="back-button">&larr; Zurück zur Liste</button>
                <h2>{userId ? `Mitarbeiterstammdaten: ${user?.fullName || ''}` : 'Neuen Mitarbeiter anlegen'}</h2>
                <div className="actions">
                    {(user?.username !== 'admin' || !userId) && (
                        isEditing ? (
                            <>
                                <button type="submit" className="action-button save" title="Speichern" aria-label="Speichern"><FaSave size={18} /></button>
                                <button type="button" onClick={handleCancel} className="action-button cancel" title="Abbrechen" aria-label="Abbrechen"><FaTimes size={18} /></button>
                            </>
                        ) : (
                            <button type="button" onClick={handleEdit} className="action-button edit" title="Bearbeiten" aria-label="Bearbeiten"><FaEdit size={18} /></button>
                        )
                    )}
                    {userId && isEditing && user?.username !== 'admin' && (
                        <>
                            <button type="button" className="action-button warning" onClick={handleResetPassword} title="Passwort zurücksetzen" aria-label="Passwort zurücksetzen"><FaKey size={18} /></button>
                            <button type="button" className="action-button danger" onClick={() => setConfirmDelete(true)} title="Löschen" aria-label="Löschen"><FaTrash size={18} /></button>
                        </>
                    )}
                </div>
            </div>

            {/* Accordion Sections */}
            <section>
                <details className="accordion-item" open>
                    <summary>Persönliche Daten <span className="arrow">▶</span></summary>
                    <div className="accordion-content two-column-grid">
                        {/* Employee ID */}
                        {isEditing ? (
                            <div className="floating-group">
                                <input
                                    type="text"
                                    name="employeeId"
                                    placeholder=" "
                                    value={formData.employeeId || ''}
                                    onChange={handleChange}
                                />
                                <label>Mitarbeiter-ID</label>
                            </div>
                        ) : (
                            <div><strong>Mitarbeiter-ID</strong><br/>{user?.employeeId || 'N/A'}</div>
                        )}
                        {isEditing ? (
                            <>
                                <div className="floating-group">
                                    <input type="text" name="firstName" placeholder=" " value={nameFields.firstName} onChange={handleChange} />
                                    <label>Vorname</label>
                                </div>
                                <div className="floating-group">
                                    <input type="text" name="lastName" placeholder=" " value={nameFields.lastName} onChange={handleChange} />
                                    <label>Nachname</label>
                                </div>
                                <div className="floating-group">
                                    <input type="date" name="geburtsdatum" placeholder=" " value={formatDate(formData.geburtsdatum)} onChange={handleChange} />
                                    <label>Geburtsdatum</label>
                                </div>
                                <div className="floating-group">
                                    <input type="text" name="username" placeholder=" " value={formData.username || ''} onChange={handleChange} required />
                                    <label>Benutzername</label>
                                </div>
                                <div className="floating-group">
                                    <input type="text" name="adresse.strasse" placeholder=" " value={formData.adresse?.strasse || ''} onChange={handleChange} />
                                    <label>Straße</label>
                                </div>
                                <div className="floating-group">
                                    <input type="text" name="adresse.plz" placeholder=" " value={formData.adresse?.plz || ''} onChange={handleChange} />
                                    <label>PLZ</label>
                                </div>
                                <div className="floating-group">
                                    <input type="text" name="adresse.stadt" placeholder=" " value={formData.adresse?.stadt || ''} onChange={handleChange} />
                                    <label>Stadt</label>
                                </div>
                            </>
                        ) : (
                            <>
                                <div><strong>Vorname</strong><br/>{nameFields.firstName}</div>
                                <div><strong>Nachname</strong><br/>{nameFields.lastName}</div>
                                <div><strong>Geburtsdatum</strong><br/>{displayDate(user?.geburtsdatum)}</div>
                                <div><strong>Benutzername</strong><br/>{user?.username}</div>
                                <div><strong>Straße</strong><br/>{user?.adresse?.strasse || 'N/A'}</div>
                                <div><strong>PLZ</strong><br/>{user?.adresse?.plz || 'N/A'}</div>
                                <div><strong>Stadt</strong><br/>{user?.adresse?.stadt || 'N/A'}</div>
                            </>
                        )}
                    </div>
                </details>

                <details className="accordion-item" open>
                    <summary>Kontakt <span className="arrow">▶</span></summary>
                    <div className="accordion-content two-column-grid">
                        {isEditing ? (
                            <>
                                <div className="floating-group">
                                    <input type="email" name="email" placeholder=" " value={formData.email || ''} onChange={handleChange} required />
                                    <label>E-Mail</label>
                                </div>
                                {!userId && (
                                    <div className="floating-group">
                                        <input type="password" name="password" placeholder=" " value={formData.password || ''} onChange={handleChange} required />
                                        <label>Passwort</label>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div><strong>E-Mail</strong><br/>{user?.email}</div>
                        )}
                    </div>
                </details>

                <details className="accordion-item" open>
                    <summary>Organisation <span className="arrow">▶</span></summary>
                    <div className="accordion-content two-column-grid">
                        {isEditing ? (
                            <>
                                <div className="floating-group">
                                    <input type="text" name="position" placeholder=" " value={formData.position || ''} onChange={handleChange} />
                                    <label>Position</label>
                                </div>
                                <div className="floating-group">
                                    <input type="text" name="abteilung" placeholder=" " value={formData.abteilung || ''} onChange={handleChange} />
                                    <label>Abteilung</label>
                                </div>
                                <div className="floating-group">
                                    <input type="date" name="eintrittsdatum" placeholder=" " value={formatDate(formData.eintrittsdatum)} onChange={handleChange} />
                                    <label>Eintrittsdatum</label>
                                </div>
                                <div className="floating-group">
                                    <select name="status" value={formData.status || 'aktiv'} onChange={handleChange}>
                                        <option value="aktiv">Aktiv</option>
                                        <option value="inaktiv">Inaktiv</option>
                                        <option value="beurlaubt">Beurlaubt</option>
                                        <option value="karenz">Karenz</option>
                                    </select>
                                    <label>Status</label>
                                </div>
                            </>
                        ) : (
                            <>
                                <div><strong>Position</strong><br/>{user?.position || 'N/A'}</div>
                                <div><strong>Abteilung</strong><br/>{user?.abteilung || 'N/A'}</div>
                                <div><strong>Eintrittsdatum</strong><br/>{displayDate(user?.eintrittsdatum)}</div>
                                <div><strong>Status</strong><br/><span className={`status-badge status-${user?.status}`}>{user?.status}</span></div>
                            </>
                        )}
                    </div>
                </details>

                <details className="accordion-item" open>
                    <summary>Finanzen <span className="arrow">▶</span></summary>
                    <div className="accordion-content two-column-grid">
                        {isEditing ? (
                            <>
                                <div className="floating-group">
                                    <input type="number" name="gehalt" placeholder=" " value={formData.gehalt || ''} onChange={handleChange} />
                                    <label>Gehalt</label>
                                </div>
                                <div className="floating-group">
                                    <input type="text" name="iban" placeholder=" " value={formData.iban || ''} onChange={handleChange} />
                                    <label>IBAN</label>
                                </div>
                            </>
                        ) : (
                            <>
                                <div><strong>Gehalt</strong><br/>{user?.gehalt ? `${user.gehalt.toLocaleString('de-DE')} €` : 'N/A'}</div>
                                <div><strong>IBAN</strong><br/>{user?.iban || 'N/A'}</div>
                            </>
                        )}
                    </div>
                </details>
            </section>
            <DeleteConfirmModal />
        </form>
    );
};

export default MitarbeiterDetail;
