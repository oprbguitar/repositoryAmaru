-- Live streaming test-bench runs. Metrics only: the response text is stored
-- solely when the user explicitly presses "Guardar" (saved_output).
-- Separate from developer_lab_runs (0005), which requires a session.
CREATE TABLE IF NOT EXISTS developer_lab_stream_runs (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  protocol TEXT NOT NULL CHECK (protocol IN ('openai','anthropic','gemini','ollama')),
  status TEXT NOT NULL CHECK (status IN ('completed','failed','cancelled')),
  compare_group_id TEXT,
  temperature REAL,
  max_output_tokens INTEGER,
  prompt_chars INTEGER NOT NULL DEFAULT 0,
  system_chars INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER,
  output_tokens INTEGER,
  reasoning_tokens INTEGER,
  tokens_estimated INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL,
  cost_note TEXT,
  latency_ms INTEGER,
  ttft_ms INTEGER,
  tokens_per_second REAL,
  finish_reason TEXT,
  error_message TEXT,
  saved_prompt TEXT,
  saved_output TEXT,
  saved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_developer_lab_stream_runs_model
  ON developer_lab_stream_runs(provider_id, model_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_developer_lab_stream_runs_created
  ON developer_lab_stream_runs(created_at DESC);
