PRAGMA foreign_keys = ON;

-- Índices académicos adicionales para el módulo Investigación.
-- Europe PMC, DOAJ y DBLP son públicos y no requieren credencial; Semantic
-- Scholar y CORE quedan 'not_configured' hasta que exista una clave gratuita
-- (variable de entorno o credencial cifrada guardada desde la interfaz).
INSERT OR IGNORE INTO source_registry
  (id, name, source_type, base_url, enabled, configured, frequency_minutes, status, personal_use_allowed,
   public_display_allowed, historical_storage_allowed, attribution_required, slug, category, endpoint,
   source_format, authentication_type, secret_binding_name, is_official, is_enabled, trust_level,
   update_frequency_minutes, rate_limit_notes, adapter_name, terms_url)
VALUES
  ('europe-pmc', 'Europe PMC', 'academic_index', 'https://www.ebi.ac.uk', 1, 1, 720, 'ready', 1, 1, 1, 1, 'europe-pmc', 'research', 'https://www.ebi.ac.uk/europepmc/webservices/rest/search', 'json', 'none', NULL, 1, 1, 'high', 720, 'API pública del EMBL-EBI; se pide un User-Agent identificable', 'europe-pmc', 'https://europepmc.org/Copyright'),
  ('doaj', 'DOAJ (acceso abierto)', 'open_access_index', 'https://doaj.org', 1, 1, 720, 'ready', 1, 1, 1, 1, 'doaj', 'research', 'https://doaj.org/api/search/articles', 'json', 'none', NULL, 1, 1, 'high', 720, 'API pública; 2 peticiones por segundo recomendadas', 'doaj', 'https://doaj.org/terms'),
  ('dblp', 'DBLP (computación)', 'bibliography_index', 'https://dblp.org', 1, 1, 720, 'ready', 1, 1, 1, 1, 'dblp', 'research', 'https://dblp.org/search/publ/api', 'json', 'none', NULL, 1, 1, 'high', 720, 'API pública; limita ráfagas con HTTP 429', 'dblp', 'https://dblp.org/db/about/copyright.html'),
  ('semantic-scholar', 'Semantic Scholar', 'academic_index', 'https://api.semanticscholar.org', 1, 0, 720, 'not_configured', 1, 1, 1, 1, 'semantic-scholar', 'research', 'https://api.semanticscholar.org/graph/v1/paper/search', 'json', 'api_key', 'SEMANTIC_SCHOLAR_API_KEY', 1, 1, 'high', 720, 'Sin clave la API responde 429; la clave gratuita se solicita por formulario', 'semantic-scholar', 'https://www.semanticscholar.org/product/api/license'),
  ('core', 'CORE (repositorios abiertos)', 'open_access_index', 'https://api.core.ac.uk', 1, 0, 720, 'not_configured', 1, 1, 1, 1, 'core', 'research', 'https://api.core.ac.uk/v3/search/works', 'json', 'bearer', 'CORE_API_KEY', 1, 1, 'medium', 720, 'Clave gratuita para uso académico: 10 000 peticiones al día', 'core', 'https://core.ac.uk/terms');

INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('schema_version', '7', CURRENT_TIMESTAMP);
