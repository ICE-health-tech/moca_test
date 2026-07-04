-- MoCA scores: exact numeric (no float). Scale 0 = whole points.

ALTER TABLE test_sessions
    ALTER COLUMN auto_score TYPE NUMERIC(10, 0) USING auto_score::numeric,
    ALTER COLUMN review_score TYPE NUMERIC(10, 0) USING review_score::numeric,
    ALTER COLUMN final_score TYPE NUMERIC(10, 0) USING final_score::numeric,
    ALTER COLUMN education_bonus TYPE NUMERIC(10, 0) USING education_bonus::numeric;

ALTER TABLE test_section_scores
    ALTER COLUMN max_points TYPE NUMERIC(10, 0) USING max_points::numeric,
    ALTER COLUMN points TYPE NUMERIC(10, 0) USING points::numeric,
    ALTER COLUMN doctor_override TYPE NUMERIC(10, 0) USING doctor_override::numeric;
