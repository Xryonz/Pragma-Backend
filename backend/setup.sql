-- setup.sql — Cria as tabelas no PostgreSQL
-- Execute: psql -U postgres -d pragma_db -f setup.sql
-- ─────────────────────────────────────────────────────────────
-- 📚 Tipos de dados usados aqui:
--   SERIAL      → inteiro com auto-incremento (1, 2, 3...)
--   VARCHAR(n)  → texto com limite de caracteres
--   TEXT        → texto sem limite
--   BOOLEAN     → true/false
--   DATE        → apenas data (2025-07-15), sem horário
--   TIMESTAMPTZ → data + hora + fuso horário
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,  -- UNIQUE: sem duplicatas
  password   VARCHAR(255),                  -- NULL para login social
  provider   VARCHAR(50) DEFAULT 'local',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEX acelera buscas por email (login é feito muitas vezes)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,

  -- REFERENCES: chave estrangeira — user_id deve existir em users.id
  -- ON DELETE CASCADE: se o usuário sumir, as tarefas somem junto
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title       VARCHAR(255) NOT NULL,
  description TEXT,
  deadline    DATE,

  -- CHECK: só aceita esses três valores, como um enum
  priority    VARCHAR(10) DEFAULT 'medium'
              CHECK (priority IN ('low', 'medium', 'high')),

  done        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- TRIGGER: atualiza updated_at automaticamente a cada UPDATE
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

SELECT 'Banco configurado com sucesso! ✅' AS status;
