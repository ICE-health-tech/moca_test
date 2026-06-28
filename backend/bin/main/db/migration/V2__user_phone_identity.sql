-- Phone identity for patient login; email optional when set

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

UPDATE users SET phone_number = '84900000001', updated_at = now()
WHERE email = 'admin@moca.local' AND phone_number IS NULL;

UPDATE users SET phone_number = '84900000201', updated_at = now()
WHERE email = 'doctor.tran@moca.local' AND phone_number IS NULL;

UPDATE users SET phone_number = '84900000202', updated_at = now()
WHERE email = 'doctor.le@moca.local' AND phone_number IS NULL;

UPDATE users SET phone_number = '84901234567', updated_at = now()
WHERE email = 'patient.nguyen@moca.local' AND phone_number IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_number ON users (phone_number);

ALTER TABLE users
    ALTER COLUMN email DROP NOT NULL;
