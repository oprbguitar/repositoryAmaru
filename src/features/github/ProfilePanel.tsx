import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import {
  buildSuggestPrompt,
  parseAiSuggestions,
  type Suggestion,
  type SuggestionSet,
  suggestLocally,
} from "../../../lib/github/suggest";
import { useAdminSession } from "../admin/adminApi";
import {
  executeLabTest,
  listDeveloperLabProviders,
  listProviderModels,
} from "../developer-lab/api";
import { readStored, writeStored } from "./api";

const PROFILE_KEY = "amaru-github-profile";

export function ProfilePanel({
  onSearch,
  onAddTopic,
}: {
  onSearch: (suggestion: Suggestion) => void;
  onAddTopic: (topic: string) => void;
}) {
  const [profile, setProfile] = useState(() => readStored(PROFILE_KEY, ""));
  const [providerId, setProviderId] = useState("");
  const [modelId, setModelId] = useState("");
  const [result, setResult] = useState<SuggestionSet | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Paid providers belong to the administrator: visitors skip the request.
  const session = useAdminSession();
  const providers = useQuery({
    queryKey: ["developer-lab-providers"],
    queryFn: listDeveloperLabProviders,
    staleTime: 60_000,
    retry: false,
    enabled: session.data?.authenticated === true,
  });
  const usable = (providers.data?.data ?? []).filter(
    (provider) =>
      (provider.credential?.state === "configured" ||
        provider.credential?.state === "connection_verified") &&
      provider.categories.some((c) => c === "text" || c === "reasoning"),
  );
  const models = useQuery({
    queryKey: ["developer-lab-models", providerId],
    queryFn: () => listProviderModels(providerId, "text"),
    enabled: !!providerId,
    retry: false,
  });

  const run = useMutation({
    mutationFn: async () => {
      const response = await executeLabTest({
        providerId,
        modelId,
        testType: "text",
        prompt: buildSuggestPrompt(profile),
        temperature: 0.2,
        maxOutputTokens: 1200,
      });
      return parseAiSuggestions(response.data.outputText);
    },
    onSuccess: (parsed) => {
      if (parsed) {
        setResult(parsed);
        setNotice(null);
      } else {
        setResult(suggestLocally(profile));
        setNotice(
          "El modelo no devolvió JSON válido; se usó el sugeridor local por palabras clave.",
        );
      }
    },
    onError: (error) => {
      setResult(suggestLocally(profile));
      setNotice(
        `${error instanceof Error ? error.message : "Falló la ejecución"} Se usó el sugeridor local.`,
      );
    },
  });

  function save(value: string) {
    setProfile(value);
    writeStored(PROFILE_KEY, value);
  }

  const canRun = profile.trim().length >= 10 && !!providerId && !!modelId;
  return (
    <section className="gh-profile" aria-label="Aprende sobre mí">
      <h3>
        <Sparkles /> Aprende sobre mí
      </h3>
      <label className="gh-label" htmlFor="gh-profile-text">
        Cuéntame tus intereses, proyectos y stack
      </label>
      <textarea
        id="gh-profile-text"
        className="gh-input"
        rows={5}
        maxLength={4000}
        value={profile}
        onChange={(event) => save(event.target.value)}
        placeholder="Ej.: ingeniero industrial, hago dashboards con React y Cloudflare, me interesan agentes de IA y mantenimiento predictivo."
      />
      {usable.length ? (
        <div className="gh-row">
          <select
            className="gh-input"
            aria-label="Proveedor"
            value={providerId}
            onChange={(event) => {
              setProviderId(event.target.value);
              setModelId("");
            }}
          >
            <option value="">Proveedor…</option>
            {usable.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
          <select
            className="gh-input"
            aria-label="Modelo"
            value={modelId}
            disabled={!providerId || models.isLoading}
            onChange={(event) => setModelId(event.target.value)}
          >
            <option value="">
              {models.isLoading ? "Cargando…" : "Modelo…"}
            </option>
            {(models.data?.data ?? []).slice(0, 80).map((model) => (
              <option key={model.id} value={model.id}>
                {model.displayName}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="gh-note">
          {session.data?.authenticated !== true
            ? "Sugerencias por palabras clave, sin IA."
            : providers.isLoading
              ? "Buscando proveedores configurados…"
              : "No hay proveedor de modelos configurado en el Laboratorio de APIs: se usa el sugeridor local por palabras clave, sin IA."}
        </p>
      )}
      <div className="gh-actions">
        <button
          type="button"
          className="gh-btn gh-btn-primary"
          disabled={!canRun || run.isPending}
          onClick={() => run.mutate()}
        >
          {run.isPending ? "Consultando…" : "Sugerir con IA"}
        </button>
        <button
          type="button"
          className="gh-btn"
          disabled={profile.trim().length < 3}
          onClick={() => {
            setNotice(null);
            setResult(suggestLocally(profile));
          }}
        >
          Sugerir local
        </button>
      </div>
      {canRun ? (
        <p className="gh-note">
          «Sugerir con IA» envía el texto de arriba al proveedor elegido.
        </p>
      ) : null}
      {notice ? <p className="gh-note gh-note-warn">{notice}</p> : null}
      {result ? (
        <div>
          <p className="gh-note">
            {result.source === "ai"
              ? "Sugerido por IA"
              : "Sugerido localmente (palabras clave)"}
            {result.summary ? `: ${result.summary}` : "."}
          </p>
          <ul className="gh-suggestions">
            {result.suggestions.map((suggestion) => (
              <li key={suggestion.label}>
                <button
                  type="button"
                  className="gh-btn"
                  onClick={() => onSearch(suggestion)}
                >
                  {suggestion.label}
                </button>
                <span>
                  {(suggestion.spec.anyTopics ?? []).join(", ") ||
                    (suggestion.spec.keywords ?? []).join(", ")}
                </span>
                {suggestion.why ? <small>{suggestion.why}</small> : null}
                {(suggestion.spec.anyTopics ?? []).length ? (
                  <button
                    type="button"
                    className="gh-link"
                    onClick={() => {
                      for (const topic of suggestion.spec.anyTopics ?? [])
                        onAddTopic(topic);
                    }}
                  >
                    + a mis topics
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
