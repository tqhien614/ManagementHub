-- Initialize AI-PDMH database. Run once as the postgres superuser:
--   psql -U postgres -f init_db.sql
-- Tables are created automatically by the FastAPI app on first startup
-- (SQLModel.metadata.create_all), so this script only creates the DB + extension.

CREATE DATABASE managementhub;

\echo 'Database "managementhub" created.'
\echo 'Now copy backend/.env.example to backend/.env and set DATABASE_URL with your postgres password.'
\echo 'Then run the backend (uvicorn app.main:app) to create all tables.'
