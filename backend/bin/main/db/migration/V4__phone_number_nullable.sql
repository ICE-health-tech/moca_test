-- Doctors/admins register with email; phone is only required for patient login.
ALTER TABLE users
    ALTER COLUMN phone_number DROP NOT NULL;
