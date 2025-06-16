# Unternehmensverwaltungssoftware SaaS

Modulares, cloudbasiertes SaaS-System zur Unternehmensverwaltung mit Multi-Tenant-Unterstützung.

## Technische Basis
- Frontend: React
- Backend: FastAPI (Python)
- Datenbank: PostgreSQL
- Authentifizierung: JWT
- Modularität: Dynamische Modul-Ladung via Plugin-Registry

## Setup
1. Python 3.10+ und Node.js installieren
2. Backend-Abhängigkeiten installieren: `pip install -r backend/requirements.txt`
3. Frontend-Abhängigkeiten installieren: `cd frontend && npm install`
4. Datenbank konfigurieren (PostgreSQL)
5. Backend starten: `uvicorn backend.main:app --reload`
6. Frontend starten: `npm start`

## Projektstruktur
- backend/: FastAPI Backend mit Auth, API und Modulverwaltung
- frontend/: React Frontend mit dynamischem Modul-Laden
- database/: Datenbank-Skripte und Migrationen

## Hinweise
- Nach Login werden Module basierend auf Rolle und Kaufstatus dynamisch geladen.
- Clean Architecture und Trennung von Daten und Logik.
- Internationalisierung vorbereitet (i18n).

---

Bitte die Umgebungsvariablen für Datenbank und JWT konfigurieren.
