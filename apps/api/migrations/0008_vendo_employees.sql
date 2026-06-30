CREATE TABLE vendo_employees (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  employee_role TEXT NOT NULL DEFAULT 'engineer'
    CHECK (employee_role IN ('admin', 'engineer')),
  is_active INTEGER NOT NULL DEFAULT 1,
  onboarded_by TEXT REFERENCES vendo_employees(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_vendo_employees_username ON vendo_employees(username);
CREATE INDEX idx_vendo_employees_user ON vendo_employees(user_id);
