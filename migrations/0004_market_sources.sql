PRAGMA foreign_keys = ON;

-- Fuentes reales del módulo Mercado IA (sin credenciales)
INSERT OR IGNORE INTO source_registry
  (id, name, source_type, base_url, enabled, configured, frequency_minutes, status, personal_use_allowed,
   public_display_allowed, historical_storage_allowed, attribution_required, slug, category, endpoint,
   source_format, authentication_type, secret_binding_name, is_official, is_enabled, trust_level,
   update_frequency_minutes, rate_limit_notes, adapter_name, terms_url)
VALUES
  ('sec-xbrl', 'SEC XBRL Company Facts', 'financial_facts', 'https://data.sec.gov', 1, 1, 720, 'ready', 1, 1, 1, 1, 'sec-xbrl', 'market', 'https://data.sec.gov/api/xbrl/companyconcept/', 'json', 'none', NULL, 1, 1, 'high', 720, 'Requiere User-Agent identificable; máximo 10 req/s', 'sec-xbrl', 'https://www.sec.gov/privacy.htm'),
  ('frankfurter', 'Frankfurter (tasas BCE)', 'economic_series', 'https://api.frankfurter.dev', 1, 1, 720, 'ready', 1, 1, 1, 1, 'frankfurter', 'market', 'https://api.frankfurter.dev/v1/latest', 'json', 'none', NULL, 1, 1, 'high', 720, 'API pública sin clave; tasas de referencia del BCE (días hábiles)', 'frankfurter', 'https://www.frankfurter.dev/');

INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('schema_version', '4', CURRENT_TIMESTAMP);
