# Backend für Unternehmensverwaltungssoftware

Dieses Repository enthält den Node.js/Express.js Backend für das Unternehmensverwaltungssystem.

## Installation

1. Node.js installieren (https://nodejs.org/)
2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

## Starten

Starte den Server im Entwicklungsmodus:
```bash
npm run dev
```

Der Server läuft dann auf http://localhost:3001

## API Endpoints

- POST /api/auth/login - Benutzer login
- GET /api/modules - Lade verfügbare Module (mit Auth)
