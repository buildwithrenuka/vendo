-- Users and auth
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'undecided' CHECK (role IN ('undecided', 'buyer', 'supplier')),
  buyer_verification_status TEXT NOT NULL DEFAULT 'none'
    CHECK (buyer_verification_status IN ('none', 'pending', 'approved', 'rejected')),
  pricing_tier TEXT NOT NULL DEFAULT 'standard' CHECK (pricing_tier IN ('standard', 'enterprise')),
  company_name TEXT,
  business_email_domain TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE oauth_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'oidc')),
  provider_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (provider, provider_user_id)
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Buyer verification documents
CREATE TABLE buyer_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_email TEXT NOT NULL,
  gst_number TEXT,
  document_urls TEXT,
  extracted_data TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Supplier invites (7-day token)
CREATE TABLE invites (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  accepted_by_user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_invites_buyer ON invites(buyer_id);
CREATE INDEX idx_invites_email ON invites(email);

-- Versioned form templates
CREATE TABLE form_templates (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  schema_json TEXT NOT NULL,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (buyer_id, name, version)
);

CREATE INDEX idx_form_templates_buyer ON form_templates(buyer_id);

-- Form submissions
CREATE TABLE form_submissions (
  id TEXT PRIMARY KEY,
  form_template_id TEXT NOT NULL REFERENCES form_templates(id),
  supplier_id TEXT NOT NULL REFERENCES users(id),
  buyer_id TEXT NOT NULL REFERENCES users(id),
  data_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'auto_approved', 'pending_review', 'approved', 'rejected')),
  rule_results_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_at TEXT,
  reviewed_at TEXT
);

CREATE INDEX idx_submissions_buyer ON form_submissions(buyer_id);
CREATE INDEX idx_submissions_supplier ON form_submissions(supplier_id);
CREATE INDEX idx_submissions_status ON form_submissions(status);

-- Approval rules (plain language → structured)
CREATE TABLE approval_rulesets (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  natural_language TEXT NOT NULL,
  structured_rules_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_rulesets_buyer ON approval_rulesets(buyer_id);

-- Pending invite token stored in oauth state
CREATE TABLE oauth_states (
  state TEXT PRIMARY KEY,
  invite_token TEXT,
  redirect_path TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
