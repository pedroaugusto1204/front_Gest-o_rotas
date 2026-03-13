-- VAST MAINTENANCE DATABASE INITIALIZATION

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','employee')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employees (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  phone      TEXT,
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_routes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    UUID REFERENCES employees(id) ON DELETE CASCADE,
  route_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  departure_time TIME,
  status         TEXT DEFAULT 'pending'
                 CHECK (status IN ('pending','in_progress','completed')),
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, route_date)
);

CREATE TABLE IF NOT EXISTS route_stops (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_route_id  UUID REFERENCES daily_routes(id) ON DELETE CASCADE,
  stop_order      INT NOT NULL,
  location_name   TEXT NOT NULL,
  address         TEXT,
  notes           TEXT,
  completed       BOOLEAN DEFAULT false,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS route_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID REFERENCES employees(id),
  employee_name TEXT NOT NULL,
  route_date    DATE NOT NULL,
  departure_time TIME,
  stops_data    JSONB NOT NULL,
  embedding     vector(1536),
  logged_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_route_logs_embedding ON route_logs USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_daily_routes_date_emp ON daily_routes (route_date, employee_id);
CREATE INDEX IF NOT EXISTS idx_route_logs_emp_date ON route_logs (employee_id, logged_at DESC);
