ALTER TABLE feature_requests ADD COLUMN dev_queue_status TEXT
  CHECK (dev_queue_status IS NULL OR dev_queue_status IN (
    'queued', 'building', 'in_review', 'fix_needed', 'ready_for_approval', 'shipped'
  ));

CREATE TABLE feature_dev_tasks (
  id TEXT PRIMARY KEY,
  feature_request_id TEXT NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog'
    CHECK (status IN ('backlog', 'in_progress', 'in_review', 'done')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_feature_dev_tasks_feature ON feature_dev_tasks(feature_request_id);

CREATE TABLE feature_pull_requests (
  id TEXT PRIMARY KEY,
  feature_request_id TEXT NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  pr_number INTEGER NOT NULL,
  pr_url TEXT NOT NULL,
  branch TEXT,
  head_sha TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'ai_review', 'fix_needed', 'ready', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (feature_request_id, pr_number)
);

CREATE TABLE feature_code_reviews (
  id TEXT PRIMARY KEY,
  feature_request_id TEXT NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  pr_id TEXT REFERENCES feature_pull_requests(id) ON DELETE SET NULL,
  reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('ai', 'human')),
  verdict TEXT NOT NULL CHECK (verdict IN ('pass', 'fix_needed', 'reject', 'approve_ship')),
  summary TEXT NOT NULL,
  findings_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_feature_code_reviews_feature ON feature_code_reviews(feature_request_id);
