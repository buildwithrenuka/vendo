-- Verified Once: reusable supplier profile across buyers
CREATE TABLE supplier_profiles (
  supplier_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  profile_data_json TEXT NOT NULL DEFAULT '{}',
  verified_at TEXT,
  source_submission_id TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Per buyer-supplier scorecard (green / yellow / red)
CREATE TABLE supplier_scorecards (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplier_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating TEXT NOT NULL DEFAULT 'yellow'
    CHECK (rating IN ('green', 'yellow', 'red')),
  approved_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  auto_approved_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (buyer_id, supplier_id)
);

CREATE INDEX idx_scorecards_buyer ON supplier_scorecards(buyer_id);

-- GST invoice reconciliation (Enterprise tier)
CREATE TABLE gst_invoices (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplier_id TEXT REFERENCES users(id),
  invoice_number TEXT NOT NULL,
  invoice_date TEXT NOT NULL,
  supplier_gst TEXT,
  taxable_amount REAL,
  gst_amount REAL,
  match_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (match_status IN ('pending', 'matched', 'mismatch', 'missing')),
  matched_submission_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_gst_invoices_buyer ON gst_invoices(buyer_id);
