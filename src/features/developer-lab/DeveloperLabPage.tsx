import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Cloud,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Gauge,
  KeyRound,
  Laptop,
  PanelRightClose,
  PanelRightOpen,
  Play,
  PlugZap,
  Radio,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
  DeveloperLabProvider,
  TestbenchModel,
  TestbenchResult,
  TestType,
} from "../../../lib/developer-lab/types";
import {
  configureProviderCredential,
  deleteProviderCredential,
  executeLabTest,
  listDeveloperLabProviders,
  listProviderModels,
  testProviderCredential,
} from "./api";
import { LiveConsole } from "./LiveConsole";

type View = "providers" | "live" | "workspace";
type Mode = "basic" | "advanced";

const TEST_TYPES: Array<{
  id: TestType;
  label: string;
  category: string;
  needsImage: "required" | "optional" | "none";
}> = [
  {
    id: "text",
    label: "Generación de texto",
    category: "text",
    needsImage: "none",
  },
  {
    id: "reasoning",
    label: "Razonamiento",
    category: "reasoning",
    needsImage: "none",
  },
  { id: "code", label: "Programación", category: "code", needsImage: "none" },
  {
    id: "image",
    label: "Comprensión de imágenes",
    category: "multimodal",
    needsImage: "required",
  },
  {
    id: "video",
    label: "Generación de video",
    category: "video",
    needsImage: "optional",
  },
];

const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

function formatPricePerMillion(value: number | null): string {
  if (value === null) return "sin datos";
  if (value === 0) return "US$ 0";
  return `US$ ${value.toLocaleString("es-PE", { maximumFractionDigits: 4 })}`;
}

function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1)
    bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeType });
}

function stateLabel(provider: DeveloperLabProvider): string {
  const state = provider.credential?.state;
  if (!state)
    return provider.location === "local" ? "Sin detectar" : "No configurado";
  const labels: Record<string, string> = {
    configured: "Configurado",
    connection_verified: "Conexión verificada",
    invalid: "Clave inválida",
    expired: "Clave vencida",
    rate_limited: "Límite temporal",
    insufficient_permissions: "Permisos insuficientes",
    unavailable: "No disponible",
  };
  return labels[state] ?? "No configurado";
}

function stateClass(provider: DeveloperLabProvider): string {
  const state = provider.credential?.state;
  if (state === "connection_verified") return "verified";
  if (state === "configured") return "configured";
  if (state === "rate_limited") return "limited";
  if (state && state !== "not_configured") return "error";
  return "not-configured";
}

function CredentialDialog({
  provider,
  onClose,
}: {
  provider: DeveloperLabProvider;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [credential, setCredential] = useState("");
  const [alias, setAlias] = useState(provider.name);
  const [storage, setStorage] = useState<"temporary" | "local">("temporary");
  const [visible, setVisible] = useState(false);
  const mutation = useMutation({
    mutationFn: configureProviderCredential,
    onSuccess: async () => {
      setCredential("");
      await client.invalidateQueries({ queryKey: ["developer-lab-providers"] });
      onClose();
    },
  });
  return (
    <div className="developer-dialog-backdrop" role="presentation">
      <section
        className="developer-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="credential-title"
      >
        <button
          type="button"
          className="developer-dialog-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X />
        </button>
        <div className="developer-dialog-icon">
          <KeyRound />
        </div>
        <h2 id="credential-title">Configurar {provider.name}</h2>
        <p>
          La clave se envía solo al Worker local y nunca vuelve al navegador.
        </p>
        <label>
          Alias
          <input
            value={alias}
            onChange={(event) => setAlias(event.target.value)}
            maxLength={80}
          />
        </label>
        <label>
          Clave API
          <span className="secret-input">
            <input
              type={visible ? "text" : "password"}
              value={credential}
              onChange={(event) => setCredential(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setVisible((value) => !value)}
              aria-label={visible ? "Ocultar clave" : "Mostrar clave"}
            >
              {visible ? <EyeOff /> : <Eye />}
            </button>
          </span>
        </label>
        <fieldset className="credential-storage">
          <legend>Persistencia</legend>
          <label>
            <input
              type="radio"
              checked={storage === "temporary"}
              onChange={() => setStorage("temporary")}
            />{" "}
            Temporal · 8 horas en KV local cifrado
          </label>
          <label>
            <input
              type="radio"
              checked={storage === "local"}
              onChange={() => setStorage("local")}
            />{" "}
            Este entorno · D1 local cifrado
          </label>
        </fieldset>
        {mutation.error ? (
          <p className="developer-error">
            <CircleAlert /> {mutation.error.message}
          </p>
        ) : null}
        <button
          type="button"
          className="primary-button developer-save"
          disabled={credential.trim().length < 8 || mutation.isPending}
          onClick={() =>
            mutation.mutate({
              providerId: provider.id,
              credential,
              alias,
              storage,
            })
          }
        >
          {mutation.isPending ? (
            <RefreshCw className="spin" />
          ) : (
            <ShieldCheck />
          )}
          Guardar sin probar conexión
        </button>
      </section>
    </div>
  );
}

function ProviderCard({
  provider,
  onConfigure,
}: {
  provider: DeveloperLabProvider;
  onConfigure: () => void;
}) {
  const client = useQueryClient();
  const test = useMutation({
    mutationFn: () => testProviderCredential(provider.id),
    onSettled: async () =>
      client.invalidateQueries({ queryKey: ["developer-lab-providers"] }),
  });
  const remove = useMutation({
    mutationFn: () => deleteProviderCredential(provider.id),
    onSuccess: async () =>
      client.invalidateQueries({ queryKey: ["developer-lab-providers"] }),
  });
  const canConfigure = Boolean(provider.credentialBinding);
  const canTest =
    provider.location === "local" ||
    provider.id === "cloudflare-workers-ai" ||
    Boolean(provider.credential);
  return (
    <article className="developer-provider-card">
      <header>
        <span className={`provider-kind ${provider.location}`}>
          {provider.location === "local" ? <Laptop /> : <Cloud />}
        </span>
        <div>
          <h2>{provider.name}</h2>
          <span>
            {provider.location === "local"
              ? "Servidor local"
              : "API en la nube"}
          </span>
        </div>
        <span className={`developer-state ${stateClass(provider)}`}>
          {stateLabel(provider)}
        </span>
      </header>
      <div className="provider-capabilities">
        {provider.categories.slice(0, 4).map((category) => (
          <span key={category}>{category}</span>
        ))}
      </div>
      <dl>
        <div>
          <dt>Credencial</dt>
          <dd>
            {provider.credential ? `•••• ${provider.credential.lastFour}` : "—"}
          </dd>
        </div>
        <div>
          <dt>Modelos visibles</dt>
          <dd>{provider.modelCount}</dd>
        </div>
        <div>
          <dt>Streaming</dt>
          <dd>{provider.supports.streaming ? "Sí" : "No"}</dd>
        </div>
        <div>
          <dt>Uso</dt>
          <dd>
            {provider.supports.usageMetadata ? "Disponible" : "No informado"}
          </dd>
        </div>
      </dl>
      {test.data ? (
        <p className={`connection-result ${test.data.data.ok ? "ok" : "warn"}`}>
          {test.data.data.message} · {test.data.data.latencyMs} ms
        </p>
      ) : null}
      {test.error || remove.error ? (
        <p className="developer-error">
          <CircleAlert /> {(test.error ?? remove.error)?.message}
        </p>
      ) : null}
      <footer>
        {canConfigure ? (
          <button
            type="button"
            className="secondary-button compact"
            onClick={onConfigure}
          >
            <KeyRound /> {provider.credential ? "Reemplazar" : "Configurar"}
          </button>
        ) : null}
        <button
          type="button"
          className="secondary-button compact"
          disabled={!canTest || test.isPending}
          onClick={() => test.mutate()}
        >
          {test.isPending ? <RefreshCw className="spin" /> : <PlugZap />} Probar
          conexión
        </button>
        {provider.credential &&
        provider.credential.storage !== "environment" ? (
          <button
            type="button"
            className="icon-danger"
            onClick={() => remove.mutate()}
            aria-label={`Eliminar clave de ${provider.name}`}
          >
            <Trash2 />
          </button>
        ) : null}
        <a
          href={provider.links.documentation}
          target="_blank"
          rel="noreferrer"
          aria-label={`Documentación de ${provider.name}`}
        >
          <BookOpen />
        </a>
        {provider.links.pricing ? (
          <a
            href={provider.links.pricing}
            target="_blank"
            rel="noreferrer"
            aria-label={`Precios de ${provider.name}`}
          >
            <ExternalLink />
          </a>
        ) : null}
      </footer>
    </article>
  );
}

function ProviderDirectory({
  providers,
}: {
  providers: DeveloperLabProvider[];
}) {
  const [location, setLocation] = useState<"all" | "cloud" | "local">("all");
  const [configuredOnly, setConfiguredOnly] = useState(false);
  const [dialogProvider, setDialogProvider] =
    useState<DeveloperLabProvider | null>(null);
  const filtered = providers.filter(
    (provider) =>
      (location === "all" || provider.location === location) &&
      (!configuredOnly || Boolean(provider.credential)),
  );
  return (
    <section className="developer-directory scroll-region">
      <div className="developer-summary">
        <article>
          <PlugZap />
          <div>
            <strong>
              {
                providers.filter(
                  (provider) =>
                    provider.credential?.state === "connection_verified",
                ).length
              }
            </strong>
            <span>conexiones verificadas</span>
          </div>
        </article>
        <article>
          <KeyRound />
          <div>
            <strong>
              {providers.filter((provider) => provider.credential).length}
            </strong>
            <span>credenciales configuradas</span>
          </div>
        </article>
        <article>
          <Laptop />
          <div>
            <strong>
              {
                providers.filter((provider) => provider.location === "local")
                  .length
              }
            </strong>
            <span>servidores locales</span>
          </div>
        </article>
      </div>
      <div className="developer-filters">
        <div className="ranking-tabs">
          {(["all", "cloud", "local"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={location === item ? "active" : ""}
              onClick={() => setLocation(item)}
            >
              {item === "all" ? "Todos" : item === "cloud" ? "Nube" : "Local"}
            </button>
          ))}
        </div>
        <label>
          <input
            type="checkbox"
            checked={configuredOnly}
            onChange={(event) => setConfiguredOnly(event.target.checked)}
          />{" "}
          Solo configurados
        </label>
        <span>{filtered.length} proveedores</span>
      </div>
      <div className="developer-provider-grid">
        {filtered.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onConfigure={() => setDialogProvider(provider)}
          />
        ))}
      </div>
      {dialogProvider ? (
        <CredentialDialog
          provider={dialogProvider}
          onClose={() => setDialogProvider(null)}
        />
      ) : null}
    </section>
  );
}

const VIDEO_EXECUTABLE_PROVIDERS = new Set(["google-gemini"]);

function ModelPricing({ model }: { model: TestbenchModel }) {
  return (
    <div className="developer-model-pricing">
      <div>
        <dt>Precio entrada (1M tokens)</dt>
        <dd>{formatPricePerMillion(model.inputPricePerMillion)}</dd>
      </div>
      <div>
        <dt>Precio salida (1M tokens)</dt>
        <dd>{formatPricePerMillion(model.outputPricePerMillion)}</dd>
      </div>
      <div>
        <dt>Contexto</dt>
        <dd>
          {model.contextLength
            ? `${model.contextLength.toLocaleString("es-PE")} tokens`
            : "sin datos"}
        </dd>
      </div>
      {model.pricingNote ? (
        <p className="developer-pricing-note">{model.pricingNote}</p>
      ) : null}
    </div>
  );
}

function TestWorkspace({ providers }: { providers: DeveloperLabProvider[] }) {
  const [mode, setMode] = useState<Mode>("basic");
  const [testType, setTestType] = useState<TestType>("text");
  const [providerId, setProviderId] = useState(
    providers.find((provider) => provider.credential)?.id ?? "",
  );
  const [modelId, setModelId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<{
    base64: string;
    mimeType: string;
    fileName: string;
  } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [temperature, setTemperature] = useState(0.7);
  const [maxOutputTokens, setMaxOutputTokens] = useState(1024);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [timelineOpen, setTimelineOpen] = useState(true);

  const typeDefinition =
    TEST_TYPES.find((type) => type.id === testType) ?? TEST_TYPES[0];
  const eligibleProviders = providers.filter((item) =>
    item.categories.includes(
      typeDefinition.category as (typeof item.categories)[number],
    ),
  );
  const provider = eligibleProviders.find((item) => item.id === providerId);

  const models = useQuery({
    queryKey: ["developer-lab-models", providerId, testType],
    queryFn: () => listProviderModels(providerId, testType),
    enabled: Boolean(providerId),
    staleTime: 5 * 60_000,
  });
  const modelList = models.data?.data ?? [];
  const selectedModel = modelList.find((model) => model.id === modelId);

  const execution = useMutation({ mutationFn: executeLabTest });
  const result: TestbenchResult | null = execution.data?.data ?? null;

  function changeTestType(next: TestType) {
    setTestType(next);
    setModelId("");
    setImage(null);
    setImageError(null);
    execution.reset();
    const definition = TEST_TYPES.find((type) => type.id === next);
    if (
      definition &&
      provider &&
      !provider.categories.includes(
        definition.category as (typeof provider.categories)[number],
      )
    )
      setProviderId("");
  }

  function changeProvider(next: string) {
    setProviderId(next);
    setModelId("");
    execution.reset();
  }

  function pickImage(file: File | null) {
    setImageError(null);
    if (!file) {
      setImage(null);
      return;
    }
    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      setImageError("Formato no soportado. Usa PNG, JPEG, WebP o GIF.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setImageError("La imagen supera el límite de 8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      const base64 = value.slice(value.indexOf(",") + 1);
      setImage({ base64, mimeType: file.type, fileName: file.name });
    };
    reader.readAsDataURL(file);
  }

  const videoBlocked =
    testType === "video" &&
    Boolean(providerId) &&
    !VIDEO_EXECUTABLE_PROVIDERS.has(providerId);
  const canExecute =
    Boolean(provider) &&
    Boolean(modelId) &&
    prompt.trim().length > 0 &&
    !videoBlocked &&
    (typeDefinition.needsImage !== "required" || image !== null) &&
    !execution.isPending;

  function execute() {
    if (!canExecute) return;
    execution.mutate({
      providerId,
      modelId,
      testType,
      prompt: prompt.trim(),
      imageBase64: image?.base64,
      imageMimeType: image?.mimeType,
      temperature,
      maxOutputTokens,
    });
  }

  function downloadResult() {
    if (!result) return;
    const stamp = result.finishedAt.replace(/[:.]/g, "-");
    if (result.outputFile) {
      const extension = result.outputFile.mimeType.includes("mp4")
        ? "mp4"
        : "bin";
      downloadBlob(
        `prueba-${result.providerId}-${stamp}.${extension}`,
        base64ToBlob(result.outputFile.base64, result.outputFile.mimeType),
      );
      return;
    }
    const lines = [
      `# Prueba del Laboratorio de APIs`,
      "",
      `- Proveedor: ${result.providerId}`,
      `- Modelo: ${result.modelId}`,
      `- Tipo: ${testType}`,
      `- Fecha: ${result.finishedAt}`,
      `- Latencia: ${result.latencyMs} ms`,
      `- Tokens de entrada: ${result.usage.inputTokens ?? "sin datos"}`,
      `- Tokens de salida: ${result.usage.outputTokens ?? "sin datos"}`,
      `- Costo: ${result.costUsd === null ? "sin datos" : `US$ ${result.costUsd}`} (${result.costNote})`,
      "",
      "## Prompt",
      "",
      prompt.trim(),
      "",
      "## Resultado",
      "",
      result.outputText ?? "",
      "",
    ];
    downloadBlob(
      `prueba-${result.providerId}-${stamp}.md`,
      new Blob([lines.join("\n")], { type: "text/markdown" }),
    );
  }

  const timelineState = execution.isPending
    ? "Ejecutando…"
    : execution.isError
      ? "La ejecución falló"
      : result
        ? "Ejecución completada"
        : "Esperando una ejecución";

  return (
    <section
      className={`developer-workbench ${inspectorOpen ? "" : "inspector-closed"}`}
    >
      <aside className="developer-config scroll-region">
        <div className="developer-panel-title">
          <ServerCog />
          <div>
            <strong>Configuración</strong>
            <span>Selecciona tipo, proveedor y modelo para ejecutar.</span>
          </div>
        </div>
        <label>
          Tipo de prueba
          <select
            value={testType}
            onChange={(event) => changeTestType(event.target.value as TestType)}
          >
            {TEST_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Proveedor
          <select
            value={provider ? providerId : ""}
            onChange={(event) => changeProvider(event.target.value)}
          >
            <option value="">Selecciona un proveedor</option>
            {eligibleProviders.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.credential ? " · configurado" : " · no configurado"}
              </option>
            ))}
          </select>
        </label>
        {videoBlocked ? (
          <p className="developer-error">
            <CircleAlert /> La generación de video solo está implementada para
            Google Gemini (Veo).
          </p>
        ) : null}
        <label>
          Modelo
          <select
            value={selectedModel ? modelId : ""}
            onChange={(event) => setModelId(event.target.value)}
            disabled={!providerId || models.isLoading}
          >
            <option value="">
              {!providerId
                ? "Selecciona primero un proveedor"
                : models.isLoading
                  ? "Cargando modelos…"
                  : modelList.length
                    ? `Selecciona un modelo (${modelList.length})`
                    : "Sin modelos indexados para este tipo"}
            </option>
            {modelList.map((model) => (
              <option key={model.id} value={model.id}>
                {model.displayName}
              </option>
            ))}
          </select>
        </label>
        {models.error ? (
          <p className="developer-error">
            <CircleAlert /> {models.error.message}
          </p>
        ) : null}
        {selectedModel ? <ModelPricing model={selectedModel} /> : null}
        {typeDefinition.needsImage !== "none" ? (
          <label>
            Imagen{" "}
            {typeDefinition.needsImage === "required"
              ? "(obligatoria)"
              : "(opcional)"}
            <input
              type="file"
              accept={IMAGE_MIME_TYPES.join(",")}
              onChange={(event) => pickImage(event.target.files?.[0] ?? null)}
            />
            {image ? <small>{image.fileName}</small> : null}
            {imageError ? (
              <small className="developer-error">{imageError}</small>
            ) : null}
          </label>
        ) : null}
        <div className="developer-mode">
          <button
            type="button"
            className={mode === "basic" ? "active" : ""}
            onClick={() => setMode("basic")}
          >
            Básico
          </button>
          <button
            type="button"
            className={mode === "advanced" ? "active" : ""}
            onClick={() => setMode("advanced")}
          >
            Avanzado
          </button>
        </div>
        {mode === "advanced" ? (
          <fieldset>
            <legend>Parámetros técnicos</legend>
            <label>
              Temperatura
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(event) => setTemperature(Number(event.target.value))}
              />
            </label>
            <label>
              Máximo de salida
              <input
                type="number"
                min="1"
                max="65536"
                value={maxOutputTokens}
                onChange={(event) =>
                  setMaxOutputTokens(Number(event.target.value))
                }
              />
            </label>
          </fieldset>
        ) : null}
        <div className="developer-limit-note">
          <ShieldCheck />
          <span>
            Cada ejecución consume la cuota de tu clave; el costo se calcula con
            precios indexados cuando existen.
          </span>
        </div>
      </aside>
      <main className="developer-output">
        <div className="developer-output-toolbar">
          <span>{provider?.name ?? "Sin proveedor"}</span>
          <span>{selectedModel?.displayName ?? "Sin modelo"}</span>
          <button
            type="button"
            disabled={!canExecute}
            title={
              canExecute
                ? "Ejecutar la prueba con el proveedor seleccionado"
                : "Completa tipo, proveedor, modelo y prompt"
            }
            onClick={execute}
          >
            {execution.isPending ? <RefreshCw className="spin" /> : <Play />}{" "}
            {execution.isPending ? "Ejecutando…" : "Ejecutar prueba"}
          </button>
          <button
            type="button"
            disabled={!result}
            title="Descargar el resultado"
            onClick={downloadResult}
          >
            <Download /> Descargar
          </button>
        </div>
        <label className="developer-prompt">
          Prompt
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={
              testType === "video"
                ? "Describe el video que quieres generar…"
                : testType === "image"
                  ? "¿Qué quieres saber de la imagen seleccionada?"
                  : "Escribe el prompt que deseas probar…"
            }
          />
        </label>
        {execution.isError ? (
          <div className="developer-empty-output">
            <CircleAlert />
            <h2>La ejecución falló</h2>
            <p>{execution.error.message}</p>
          </div>
        ) : execution.isPending ? (
          <div className="developer-empty-output">
            <RefreshCw className="spin" />
            <h2>
              {testType === "video"
                ? "Generando video… puede tardar varios minutos"
                : "Esperando la respuesta del proveedor…"}
            </h2>
            <p>La solicitud se envía desde el Worker local con tu clave.</p>
          </div>
        ) : result ? (
          <div className="developer-result scroll-region">
            {result.outputFile ? (
              <video
                controls
                className="developer-result-video"
                src={`data:${result.outputFile.mimeType};base64,${result.outputFile.base64}`}
              >
                <track kind="captions" />
              </video>
            ) : (
              <pre className="developer-result-text">{result.outputText}</pre>
            )}
          </div>
        ) : (
          <div className="developer-empty-output">
            <Activity />
            <h2>Área de resultado en vivo</h2>
            <p>
              Elige un tipo de prueba, un proveedor con credencial y un modelo;
              luego ejecuta para ver la respuesta, el uso y el costo.
            </p>
          </div>
        )}
      </main>
      <aside className="developer-inspector scroll-region">
        <button
          type="button"
          className="developer-inspector-toggle"
          onClick={() => setInspectorOpen(false)}
          aria-label="Ocultar inspector"
        >
          <PanelRightClose />
        </button>
        <div className="developer-panel-title">
          <Gauge />
          <div>
            <strong>Métricas e inspector</strong>
            <span>{timelineState}</span>
          </div>
        </div>
        <dl>
          <div>
            <dt>Estado</dt>
            <dd>{timelineState}</dd>
          </div>
          <div>
            <dt>Proveedor</dt>
            <dd>{provider?.name ?? "—"}</dd>
          </div>
          <div>
            <dt>Modelo</dt>
            <dd>{result?.modelId ?? selectedModel?.displayName ?? "—"}</dd>
          </div>
          <div>
            <dt>Tiempo total</dt>
            <dd>{result ? `${result.latencyMs} ms` : "—"}</dd>
          </div>
          <div>
            <dt>Tokens</dt>
            <dd>
              {result
                ? `${result.usage.inputTokens ?? "?"} entrada · ${result.usage.outputTokens ?? "?"} salida`
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Costo</dt>
            <dd>
              {result
                ? result.costUsd === null
                  ? "Sin datos"
                  : `US$ ${result.costUsd}`
                : "—"}
            </dd>
          </div>
        </dl>
        {result ? (
          <p className="developer-pricing-note">{result.costNote}</p>
        ) : null}
        <section className="developer-help">
          <h3>Dos laboratorios, dos propósitos</h3>
          <p>
            <strong>Mi laboratorio</strong> diseña arquitecturas completas y
            alternativas de implementación.
          </p>
          <p>
            <strong>Laboratorio de APIs</strong> conecta proveedores y ejecuta
            pruebas reales medibles.
          </p>
        </section>
      </aside>
      {!inspectorOpen ? (
        <button
          type="button"
          className="developer-reopen-inspector"
          onClick={() => setInspectorOpen(true)}
          aria-label="Mostrar inspector"
        >
          <PanelRightOpen />
        </button>
      ) : null}
      <footer
        className={`developer-timeline ${timelineOpen ? "" : "collapsed"}`}
      >
        <button
          type="button"
          onClick={() => setTimelineOpen((value) => !value)}
        >
          {timelineOpen ? <ChevronDown /> : <ChevronUp />} Línea de tiempo
        </button>
        {timelineOpen ? (
          <div>
            <span>
              <i className={execution.isPending ? "" : result ? "ok" : ""} />{" "}
              {timelineState}
            </span>
            <span>request</span>
            <span>usage</span>
            <span>cost</span>
          </div>
        ) : null}
      </footer>
    </section>
  );
}

export function DeveloperLabPage() {
  const [view, setView] = useState<View>("providers");
  const providers = useQuery({
    queryKey: ["developer-lab-providers"],
    queryFn: listDeveloperLabProviders,
  });
  const items = providers.data?.data ?? [];
  const status = useMemo(
    () =>
      items.some(
        (provider) => provider.credential?.state === "connection_verified",
      )
        ? "Conexión disponible"
        : "Sin conexión verificada",
    [items],
  );
  return (
    <div className="developer-lab-page">
      <header className="developer-lab-header">
        <div>
          <h1>
            <ServerCog /> Laboratorio de APIs
          </h1>
          <p>
            Prueba, compara y mide modelos, proveedores y herramientas de
            inteligencia artificial.
          </p>
        </div>
        <nav aria-label="Secciones del laboratorio">
          <button
            type="button"
            className={view === "providers" ? "active" : ""}
            onClick={() => setView("providers")}
          >
            <PlugZap /> Conexiones
          </button>
          <button
            type="button"
            className={view === "live" ? "active" : ""}
            onClick={() => setView("live")}
          >
            <Radio /> En vivo
          </button>
          <button
            type="button"
            className={view === "workspace" ? "active" : ""}
            onClick={() => setView("workspace")}
          >
            <Activity /> Banco de pruebas
          </button>
        </nav>
        <span className="developer-lab-status">
          <i className={status === "Conexión disponible" ? "ok" : ""} />{" "}
          {status}
        </span>
      </header>
      {providers.isLoading ? (
        <div className="developer-loading">
          <RefreshCw className="spin" /> Preparando el laboratorio local…
        </div>
      ) : providers.error ? (
        <div className="developer-loading error">
          <CircleAlert /> {providers.error.message}
        </div>
      ) : view === "providers" ? (
        <ProviderDirectory providers={items} />
      ) : view === "live" ? (
        <LiveConsole providers={items} />
      ) : (
        <TestWorkspace providers={items} />
      )}
    </div>
  );
}
