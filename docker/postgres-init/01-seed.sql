-- Seed data: runs once when the postgres volume is first created.
-- Password for all seed accounts: admin123
-- BCrypt hash ($2y works with Spring Security's BCryptPasswordEncoder)

-- Enums must exist before INSERT (Flyway creates them, but this script
-- runs before Spring Boot, so we CREATE IF NOT EXISTS here).
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE test_session_status AS ENUM ('IN_PROGRESS', 'PENDING_REVIEW', 'FINALIZED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE scoring_mode AS ENUM ('AUTO', 'REVIEW');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tables (idempotent — Flyway may create them later, but this guarantees seed works)
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE,
    phone_number    VARCHAR(20) UNIQUE,  -- optional: doctors/admins use email only
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    education_years INT,
    gender          VARCHAR(20),
    date_of_birth   DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Align with Flyway V4: phone required only for patient login
ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

CREATE TABLE IF NOT EXISTS doctor_profiles (
    user_id         UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    specialty       VARCHAR(255),
    license_number  VARCHAR(100),
    is_active       BOOLEAN NOT NULL DEFAULT true
);

-- Seed accounts (skip if already exist)
INSERT INTO users (id, email, phone_number, role, full_name, password_hash)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@moca.local',          '84900000001', 'ADMIN',   'Admin MoCA',       '$2y$10$Er0oOYtcN7wVw.lQE6v7DeOaQIAokDEmKfUbnzHP5vxcxwmCByYjO'),
  ('00000000-0000-0000-0000-000000000002', 'doctor.tran@moca.local',    '84900000201', 'DOCTOR',  'BS. Trần Văn A',   '$2y$10$Er0oOYtcN7wVw.lQE6v7DeOaQIAokDEmKfUbnzHP5vxcxwmCByYjO'),
  ('00000000-0000-0000-0000-000000000003', 'doctor.le@moca.local',      '84900000202', 'DOCTOR',  'BS. Lê Thị B',     '$2y$10$Er0oOYtcN7wVw.lQE6v7DeOaQIAokDEmKfUbnzHP5vxcxwmCByYjO'),
  ('00000000-0000-0000-0000-000000000004', 'patient.nguyen@moca.local', '84901234567', 'PATIENT', 'Nguyễn Văn C',     '$2y$10$Er0oOYtcN7wVw.lQE6v7DeOaQIAokDEmKfUbnzHP5vxcxwmCByYjO')
ON CONFLICT (email) DO NOTHING;

INSERT INTO doctor_profiles (user_id, specialty, license_number)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'Thần kinh', 'CCHN-001'),
  ('00000000-0000-0000-0000-000000000003', 'Lão khoa',  'CCHN-002')
ON CONFLICT (user_id) DO NOTHING;
