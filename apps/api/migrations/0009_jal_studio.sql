CREATE TABLE jal_projects (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  github_repo TEXT NOT NULL,
  jal_context_json TEXT NOT NULL DEFAULT '{}',
  api_key_hash TEXT NOT NULL UNIQUE,
  repo_scanned_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_jal_projects_owner ON jal_projects(owner_user_id);

ALTER TABLE feature_requests ADD COLUMN project_id TEXT REFERENCES jal_projects(id);
ALTER TABLE feature_requests ADD COLUMN submitter_email TEXT;

CREATE INDEX idx_feature_requests_project ON feature_requests(project_id);
