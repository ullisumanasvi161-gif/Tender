-- ============================================================
-- Tender Checklist Generator - Supabase PostgreSQL Schema
-- Run this entire script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vcfdghjmgswigpkcebxg/sql/new
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  password     TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS (backend handles its own JWT auth)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- CHECKLISTS TABLE
-- (Sections stored as JSONB arrays for flexible schema)
-- ============================================================
CREATE TABLE IF NOT EXISTS checklists (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name             TEXT NOT NULL,
  project_type             TEXT NOT NULL,
  client_name              TEXT NOT NULL,
  tender_value             NUMERIC NOT NULL,
  tender_category          TEXT NOT NULL,
  submission_deadline      TIMESTAMPTZ NOT NULL,
  location                 TEXT NOT NULL,
  special_requirements     TEXT,
  scope_of_work            TEXT,
  eligibility_criteria     TEXT,
  additional_notes         TEXT,
  technical_section        JSONB DEFAULT '[]'::jsonb,
  commercial_section       JSONB DEFAULT '[]'::jsonb,
  financial_section        JSONB DEFAULT '[]'::jsonb,
  compliance_section       JSONB DEFAULT '[]'::jsonb,
  compliance_score         INT DEFAULT 0,
  readiness_level          TEXT DEFAULT 'Low' CHECK (readiness_level IN ('Low', 'Medium', 'High')),
  missing_documents_alerts JSONB DEFAULT '[]'::jsonb,
  ai_recommendations       JSONB DEFAULT '[]'::jsonb,
  rating                   NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  created_by               UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE checklists DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name   TEXT DEFAULT 'Anonymous',
  user_email  TEXT DEFAULT 'N/A',
  action      TEXT NOT NULL,
  details     TEXT NOT NULL,
  ip_address  TEXT DEFAULT '127.0.0.1',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TENDER DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS tender_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id   UUID REFERENCES checklists(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  file_name   TEXT NOT NULL,
  file_path   TEXT NOT NULL,
  file_type   TEXT,
  file_size   INT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tender_documents DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- INDEXES for query performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_checklists_created_by   ON checklists(created_by);
CREATE INDEX IF NOT EXISTS idx_checklists_created_at   ON checklists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checklists_category     ON checklists(tender_category);
CREATE INDEX IF NOT EXISTS idx_checklists_type         ON checklists(project_type);
CREATE INDEX IF NOT EXISTS idx_checklists_readiness    ON checklists(readiness_level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id      ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at   ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tender_docs_tender_id   ON tender_documents(tender_id);
CREATE INDEX IF NOT EXISTS idx_users_email             ON users(email);
