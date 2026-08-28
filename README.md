# Bali Catering Service

Sistema de gestão e apresentação do restaurante Bali Catering Service em Tete, Moçambique.

## Setup Local

```bash
npm install
npm run dev        # inicia server + Vite em http://localhost:3001
```

## Build

```bash
npm run build      # produção
npm start          # serve em http://localhost:3000
```

## Environment

Copier `.env.example` para `.env` e preencher:

| Variável | Obrigatório | Default | Descrição |
|---|---|---|---|
| `PORT` | Não | `3000` | Porta do server |
| `GEMINI_API_KEY` | Sim | — | API do Google AI |
| `APP_URL` | Sim | — | URL da app |

## Credenciais Padrão

| User | Role | Password |
|---|---|---|
| admin | ADMIN | 250420 |
| carlos.vendedor | SELLER | 1234 |
| joana.vendedora | SELLER | 1234 |

## Tech Stack

- React 19 + Vite + TypeScript
- TailwindCSS
- Express.js (server API + Cloud Backup)
- LocalStorage (dados principais)
- SHA-256 hashing (puro TS)

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/cloud/backups` | GET | List backups |
| `/api/cloud/backups/create` | POST | Create backup |
| `/api/cloud/backups/:id/restore` | GET | Restore backup |
| `/api/cloud/backups/:id` | DELETE | Delete backup |
| `/api/cloud/sync` | POST | Sync client state |
