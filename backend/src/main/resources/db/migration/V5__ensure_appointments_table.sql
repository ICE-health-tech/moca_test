-- Recreate the appointments table if it was dropped out-of-band.
-- Idempotent: no-op when V1 already created it; restores it when missing
-- so Hibernate ddl-auto=validate passes.
CREATE TABLE IF NOT EXISTS appointments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    doctor_id    UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status       appointment_status NOT NULL DEFAULT 'SCHEDULED',
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments (patient_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments (doctor_id, scheduled_at);
