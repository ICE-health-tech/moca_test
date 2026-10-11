-- MoCA Platform — core schema (P3 slice)
-- Roles: PATIENT | DOCTOR | ADMIN

CREATE TYPE user_role AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN');
CREATE TYPE test_session_status AS ENUM ('IN_PROGRESS', 'PENDING_REVIEW', 'FINALIZED');
CREATE TYPE appointment_status AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
CREATE TYPE scoring_mode AS ENUM ('AUTO', 'REVIEW');

-- ── Users (all roles) ───────────────────────────────────────────────────────
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    education_years INT,
    gender          VARCHAR(20),
    date_of_birth   DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    phone_number    VARCHAR(20) NOT NULL UNIQUE
);

CREATE INDEX idx_users_role ON users (role);

-- ── Doctor profile extension ──────────────────────────────────────────────────
CREATE TABLE doctor_profiles (
    user_id         UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    specialty       VARCHAR(255),
    license_number  VARCHAR(100),
    is_active       BOOLEAN NOT NULL DEFAULT true
);

-- ── Patient → doctor assignment (supports history + "đổi bác sĩ") ─────────────
CREATE TABLE patient_assignments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    doctor_id   UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    is_current  BOOLEAN NOT NULL DEFAULT true,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_patient_assignments_current
    ON patient_assignments (patient_id)
    WHERE is_current = true;

CREATE INDEX idx_patient_assignments_doctor ON patient_assignments (doctor_id);

-- ── Appointments (lịch khám) ──────────────────────────────────────────────────
CREATE TABLE appointments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    doctor_id    UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status       appointment_status NOT NULL DEFAULT 'SCHEDULED',
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_patient ON appointments (patient_id, scheduled_at);
CREATE INDEX idx_appointments_doctor ON appointments (doctor_id, scheduled_at);

-- ── MoCA test sessions ───────────────────────────────────────────────────────
CREATE TABLE test_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    doctor_id       UUID REFERENCES users (id),
    set_id          VARCHAR(50) NOT NULL,
    raw_answers     JSONB NOT NULL DEFAULT '{}',
    status          test_session_status NOT NULL DEFAULT 'IN_PROGRESS',
    auto_score      INT,
    review_score    INT,
    final_score     INT,
    education_bonus INT NOT NULL DEFAULT 0,
    classification  VARCHAR(100),
    submitted_at    TIMESTAMPTZ,
    reviewed_at     TIMESTAMPTZ,
    reviewed_by     UUID REFERENCES users (id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_test_sessions_patient ON test_sessions (patient_id, created_at DESC);
CREATE INDEX idx_test_sessions_doctor_review ON test_sessions (doctor_id, status)
    WHERE status = 'PENDING_REVIEW';

-- ── Per-section scores (auto + clinician/AI review) ───────────────────────────
CREATE TABLE test_section_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES test_sessions (id) ON DELETE CASCADE,
    section_key     VARCHAR(50) NOT NULL,
    label           VARCHAR(255) NOT NULL,
    max_points      INT NOT NULL,
    points          INT NOT NULL DEFAULT 0,
    scoring_mode    scoring_mode NOT NULL,
    ai_suggestion   JSONB,
    doctor_override INT,
    UNIQUE (session_id, section_key)
);

CREATE INDEX idx_test_section_scores_session ON test_section_scores (session_id);
