CREATE TABLE feature_requests (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN (
      'received', 'ai_review', 'planned', 'in_development',
      'shipped', 'declined', 'already_exists'
    )),
  decline_reason TEXT,
  existing_feature_url TEXT,
  ai_feedback TEXT,
  clarification_thread TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_feature_requests_buyer ON feature_requests(buyer_id);
CREATE INDEX idx_feature_requests_status ON feature_requests(status);
