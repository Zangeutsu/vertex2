# ETT Manager

Plataforma de gestão para Empresas de Trabalho Temporário (ETT) com backend FastAPI e frontend Next.js.

## Estrutura
- `backend/`: FastAPI + SQLAlchemy (camadas controllers/routers, services, repositories, schemas).
- `frontend/`: Next.js (App Router) + TypeScript + Tailwind + componentes inspirados em shadcn/ui.
- `docker-compose.yml`: stack com Postgres, backend e frontend.

## Primeiros passos (dev local)
1. Backend
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
   A API fica em `http://localhost:8000/api/v1`.

2. Frontend
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   A UI fica em `http://localhost:3000`.

3. Docker (usa Postgres)
   ```bash
   docker compose up --build
   ```

## Testes
- Backend: `cd backend && pytest`

## Configuração
- Variáveis `.env` no backend (ver `backend/.env.example`). `DATABASE_URL` pode apontar para SQLite (dev) ou Postgres.
- Frontend lê `NEXT_PUBLIC_API_BASE` (por omissão `http://localhost:8000/api/v1`).

## Segurança e qualidade
- Tipagem Pydantic v2 + SQLAlchemy 2.0 com `async`.
- Serviços encapsulam regras (alertas, conformidade).
- Repositórios isolam acesso a dados.
- CORS restrito a localhost por defeito (ajuste `allowed_origins`).
