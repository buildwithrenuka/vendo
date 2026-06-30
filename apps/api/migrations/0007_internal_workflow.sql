ALTER TABLE feature_requests ADD COLUMN request_type TEXT NOT NULL DEFAULT 'feature'
  CHECK (request_type IN ('feature', 'bug'));

ALTER TABLE feature_requests ADD COLUMN current_pain TEXT;

CREATE TABLE feature_request_activity_log (
  id TEXT PRIMARY KEY,
  feature_request_id TEXT NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('customer', 'ai', 'employee', 'system')),
  actor_email TEXT,
  event TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_feature_activity_feature ON feature_request_activity_log(feature_request_id);
CREATE INDEX idx_feature_requests_type ON feature_requests(request_type);
