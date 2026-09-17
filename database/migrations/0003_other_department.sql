INSERT INTO departments (id, code, name)
VALUES ('dep-other', 'OTHER', 'Lainnya')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
