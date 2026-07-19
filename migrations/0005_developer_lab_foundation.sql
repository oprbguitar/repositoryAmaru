PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS developer_lab_provider_configs (
  provider_id TEXT PRIMARY KEY,
  credential_alias TEXT NOT NULL,
  credential_last_four TEXT NOT NULL CHECK (length(credential_last_four) <= 4),
  encrypted_credential TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  credential_state TEXT NOT NULL DEFAULT 'configured' CHECK (
    credential_state IN ('not_configured','configured','connection_verified','invalid','expired','rate_limited','insufficient_permissions','unavailable')
  ),
  verified_at TEXT,
  last_tested_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS developer_lab_sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  tags_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS developer_lab_provider_status (
  provider_id TEXT PRIMARY KEY,
  credential_state TEXT NOT NULL CHECK (
    credential_state IN ('not_configured','configured','connection_verified','invalid','expired','rate_limited','insufficient_permissions','unavailable')
  ),
  last_http_status INTEGER,
  last_latency_ms INTEGER,
  discovered_model_count INTEGER,
  last_message TEXT,
  last_tested_at TEXT NOT NULL,
  last_success_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS developer_lab_runs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES developer_lab_sessions(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  provider_model_identifier TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending','running','streaming','completed','failed','cancelled')),
  sanitized_parameters_json TEXT NOT NULL DEFAULT '{}',
  input_metadata_json TEXT NOT NULL DEFAULT '{}',
  output_metadata_json TEXT NOT NULL DEFAULT '{}',
  usage_json TEXT,
  cost_json TEXT,
  timing_json TEXT,
  error_json TEXT,
  user_rating INTEGER CHECK (user_rating IS NULL OR user_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS developer_lab_events (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES developer_lab_runs(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  sanitized_payload_json TEXT NOT NULL DEFAULT '{}',
  event_at TEXT NOT NULL,
  UNIQUE(run_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_developer_lab_sessions_updated ON developer_lab_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_developer_lab_runs_session ON developer_lab_runs(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_developer_lab_runs_provider ON developer_lab_runs(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_developer_lab_events_run ON developer_lab_events(run_id, sequence_number);

INSERT OR REPLACE INTO app_settings (key, value, updated_at)
VALUES ('schema_version', '5', CURRENT_TIMESTAMP);
