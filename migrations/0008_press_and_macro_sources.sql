PRAGMA foreign_keys = ON;

-- Agregadores de prensa y series macroeconómicas. Las tres quedan
-- 'not_configured' hasta que exista la clave gratuita correspondiente, ya sea
-- como variable de entorno o guardada cifrada desde Configurar integraciones.
INSERT OR IGNORE INTO source_registry
  (id, name, source_type, base_url, enabled, configured, frequency_minutes, status, personal_use_allowed,
   public_display_allowed, historical_storage_allowed, attribution_required, slug, category, endpoint,
   source_format, authentication_type, secret_binding_name, is_official, is_enabled, trust_level,
   update_frequency_minutes, rate_limit_notes, adapter_name, terms_url)
VALUES
  ('guardian', 'The Guardian', 'press_agregator', 'https://content.guardianapis.com', 1, 0, 360, 'not_configured', 1, 1, 1, 1, 'guardian', 'news', 'https://content.guardianapis.com/search', 'json', 'api_key', 'GUARDIAN_API_KEY', 1, 1, 'high', 360, 'Clave de desarrollador gratuita: 500 llamadas al día, 1 por segundo', 'guardian', 'https://open-platform.theguardian.com/terms/'),
  ('newsapi', 'NewsAPI', 'press_agregator', 'https://newsapi.org', 1, 0, 360, 'not_configured', 1, 1, 1, 1, 'newsapi', 'news', 'https://newsapi.org/v2/everything', 'json', 'api_key', 'NEWSAPI_API_KEY', 0, 1, 'medium', 360, 'Plan de desarrollo: 100 peticiones al día y solo desde localhost', 'newsapi', 'https://newsapi.org/terms'),
  ('fred', 'FRED (Reserva Federal de San Luis)', 'official_economic_series', 'https://api.stlouisfed.org', 1, 0, 720, 'not_configured', 1, 1, 1, 1, 'fred', 'market', 'https://api.stlouisfed.org/fred/series/observations', 'json', 'api_key', 'FRED_API_KEY', 1, 1, 'high', 720, 'Clave gratuita con registro; 120 peticiones por minuto', 'fred', 'https://fred.stlouisfed.org/docs/api/terms_of_use.html');

INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('schema_version', '8', CURRENT_TIMESTAMP);
