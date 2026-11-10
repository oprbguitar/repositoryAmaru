import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { AdminSourcesPage } from "../observatory/AdminSourcesPage";
import {
  adminLogin,
  adminLogout,
  getPublicAiConfig,
  type PublicAiSettings,
  savePublicAiConfig,
  useAdminSession,
} from "./adminApi";
import "./admin.css";

type Tab = "keys" | "ai";

/**
 * «Administración»: the only account. Keys and sources reuse the existing
 * integrations page; the public-AI limits are new.
 */
export function AdminConsole() {
  const session = useAdminSession();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("keys");

  if (session.isLoading)
    return (
      <div className="adm-center">
        <Loader2 className="spin" aria-hidden="true" /> Verificando sesión…
      </div>
    );

  if (!session.data?.authenticated)
    return <LoginForm configured={session.data?.configured ?? false} />;

  const production = session.data.mode === "production";

  return (
    <div className="adm-shell" data-guide="admin">
      <div className="adm-bar">
        <ShieldCheck aria-hidden="true" />
        <strong>Administración</strong>
        <span className="adm-mode">
          {production ? "Sesión de administrador" : "Modo local (sin login)"}
        </span>
        <div className="adm-tabs" role="tablist" aria-label="Administración">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "keys"}
            onClick={() => setTab("keys")}
          >
            <KeyRound aria-hidden="true" /> Claves y fuentes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "ai"}
            onClick={() => setTab("ai")}
          >
            <Sparkles aria-hidden="true" /> IA gratuita
          </button>
        </div>
        {production ? (
          <button
            type="button"
            className="adm-logout"
            onClick={async () => {
              await adminLogout();
              await queryClient.invalidateQueries();
            }}
          >
            <LogOut aria-hidden="true" /> Salir
          </button>
        ) : null}
      </div>
      <div className="adm-body">
        {tab === "keys" ? <AdminSourcesPage /> : <PublicAiSettingsPanel />}
      </div>
    </div>
  );
}

function LoginForm({ configured }: { configured: boolean }) {
  const queryClient = useQueryClient();
  const userId = useId();
  const passId = useId();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const login = useMutation({
    mutationFn: () => adminLogin(user, password),
    onSuccess: () => {
      setPassword("");
      void queryClient.invalidateQueries();
    },
  });
  return (
    <div className="adm-center">
      <form
        className="adm-login"
        onSubmit={(event) => {
          event.preventDefault();
          login.mutate();
        }}
      >
        <ShieldCheck aria-hidden="true" className="adm-login-icon" />
        <h1>Administración</h1>
        <p>
          Zona reservada para gestionar claves de API, fuentes y los límites de
          la IA gratuita.
        </p>
        {!configured ? (
          <p className="adm-warn" role="status">
            El acceso aún no está configurado en el servidor (falta el secreto
            ADMIN_PASSWORD).
          </p>
        ) : null}
        <label htmlFor={userId}>Usuario</label>
        <input
          id={userId}
          autoComplete="username"
          value={user}
          onChange={(event) => setUser(event.target.value)}
          required
        />
        <label htmlFor={passId}>Clave</label>
        <input
          id={passId}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button type="submit" disabled={login.isPending || !user || !password}>
          {login.isPending ? (
            <Loader2 className="spin" aria-hidden="true" />
          ) : null}
          Ingresar
        </button>
        {login.error ? (
          <p className="adm-error" role="alert">
            {login.error.message}
          </p>
        ) : null}
        <small>
          5 intentos fallidos bloquean el acceso por 15 minutos. La sesión dura
          8 horas.
        </small>
      </form>
    </div>
  );
}

function PublicAiSettingsPanel() {
  const queryClient = useQueryClient();
  const config = useQuery({
    queryKey: ["admin-public-ai"],
    queryFn: getPublicAiConfig,
  });
  const [draft, setDraft] = useState<PublicAiSettings | null>(null);
  useEffect(() => {
    if (config.data && !draft) setDraft(config.data.settings);
  }, [config.data, draft]);
  const save = useMutation({
    mutationFn: (settings: PublicAiSettings) => savePublicAiConfig(settings),
    onSuccess: (data) => {
      setDraft(data.settings);
      void queryClient.invalidateQueries({ queryKey: ["public-ai-status"] });
    },
  });

  if (config.error) return <p className="adm-error">{config.error.message}</p>;
  if (!draft || !config.data)
    return (
      <p className="adm-center">
        <Loader2 className="spin" aria-hidden="true" /> Cargando…
      </p>
    );

  const set = <K extends keyof PublicAiSettings>(
    key: K,
    value: PublicAiSettings[K],
  ) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current));

  return (
    <form
      className="adm-ai"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(draft);
      }}
    >
      <h2>IA gratuita para visitantes</h2>
      <p>
        Usa Cloudflare Workers AI con modelos abiertos pequeños, dentro de la
        asignación diaria gratuita de Cloudflare. No usa ninguna de tus claves
        de pago. Como administrador no tienes límite.
      </p>
      <label className="adm-check">
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={(event) => set("enabled", event.target.checked)}
        />
        Permitir la prueba gratuita
      </label>
      <div className="adm-grid">
        <label>
          <span>Consultas por visitante al día</span>
          <input
            type="number"
            min={0}
            max={20}
            value={draft.dailyLimit}
            onChange={(event) => set("dailyLimit", Number(event.target.value))}
          />
          <small>Recomendado: 2–3. Con 0 nadie puede consultar.</small>
        </label>
        <label>
          <span>Tope diario de todo el sitio</span>
          <input
            type="number"
            min={0}
            max={2000}
            value={draft.globalDailyCap}
            onChange={(event) =>
              set("globalDailyCap", Number(event.target.value))
            }
          />
          <small>Red de seguridad para no salir del nivel gratuito.</small>
        </label>
        <label>
          <span>Modelo</span>
          <select
            value={draft.model}
            onChange={(event) => set("model", event.target.value)}
          >
            {config.data.models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Máximo de tokens por respuesta</span>
          <input
            type="number"
            min={128}
            max={1500}
            value={draft.maxOutputTokens}
            onChange={(event) =>
              set("maxOutputTokens", Number(event.target.value))
            }
          />
        </label>
      </div>
      <div className="adm-actions">
        <button type="submit" disabled={save.isPending}>
          {save.isPending ? (
            <Loader2 className="spin" aria-hidden="true" />
          ) : null}
          Guardar límites
        </button>
        {save.isSuccess ? <span role="status">Guardado.</span> : null}
        {save.error ? (
          <span className="adm-error" role="alert">
            {save.error.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
