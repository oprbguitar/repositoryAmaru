PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS source_registry (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  base_url TEXT,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  configured INTEGER NOT NULL DEFAULT 0 CHECK (configured IN (0, 1)),
  frequency_minutes INTEGER NOT NULL DEFAULT 720,
  status TEXT NOT NULL DEFAULT 'not_configured',
  last_success_at TEXT,
  last_failure_at TEXT,
  last_error TEXT,
  attribution TEXT,
  terms_url TEXT,
  personal_use_allowed INTEGER NOT NULL DEFAULT 1,
  public_display_allowed INTEGER NOT NULL DEFAULT 0,
  commercial_use_allowed INTEGER NOT NULL DEFAULT 0,
  redistribution_allowed INTEGER NOT NULL DEFAULT 0,
  historical_storage_allowed INTEGER NOT NULL DEFAULT 0,
  attribution_required INTEGER NOT NULL DEFAULT 1,
  license_verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS import_runs (
  id TEXT PRIMARY KEY,
  source_alias TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  discovered_count INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_documents (
  id TEXT PRIMARY KEY,
  relative_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  extension TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
  modified_at TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  parser_name TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  ingestion_status TEXT NOT NULL CHECK (ingestion_status IN ('processed', 'warning', 'rejected', 'unsupported')),
  ingested_at TEXT NOT NULL,
  last_error TEXT,
  detected_title TEXT,
  summary TEXT,
  extracted_text TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  origin TEXT,
  source_alias TEXT NOT NULL DEFAULT 'Biblioteca local',
  raw_object_key TEXT,
  is_relevant INTEGER NOT NULL DEFAULT 0 CHECK (is_relevant IN (0, 1)),
  in_watchlist INTEGER NOT NULL DEFAULT 0 CHECK (in_watchlist IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_relations (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES local_documents(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  relation_type TEXT NOT NULL DEFAULT 'related',
  confidence TEXT NOT NULL DEFAULT 'inferred',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(document_id, entity_type, entity_id, relation_type)
);

CREATE VIRTUAL TABLE IF NOT EXISTS local_documents_fts USING fts5(
  document_id UNINDEXED,
  file_name,
  detected_title,
  summary,
  extracted_text,
  tags
);

CREATE INDEX IF NOT EXISTS idx_local_documents_modified ON local_documents(modified_at DESC);
CREATE INDEX IF NOT EXISTS idx_local_documents_status ON local_documents(ingestion_status);
CREATE INDEX IF NOT EXISTS idx_local_documents_extension ON local_documents(extension);
CREATE INDEX IF NOT EXISTS idx_local_documents_hash ON local_documents(sha256);
CREATE INDEX IF NOT EXISTS idx_import_runs_started ON import_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_registry_status ON source_registry(status, enabled);

INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('schema_version', '1'),
  ('library_alias', 'Biblioteca local'),
  ('demo_data_enabled', 'false');

INSERT OR IGNORE INTO source_registry (
  id, name, source_type, enabled, configured, status, attribution, personal_use_allowed,
  public_display_allowed, historical_storage_allowed, attribution_required
) VALUES (
  'local-library', 'Biblioteca local', 'local_directory', 1, 1, 'ready',
  'Archivos privados proporcionados por el usuario', 1, 0, 1, 0
);
