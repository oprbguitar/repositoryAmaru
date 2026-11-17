import {
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import type { GatedAccess } from "./hf";
import { isHfToken, setHfToken, useHfToken } from "./hfToken";

const STATE_TEXT: Record<GatedAccess, { title: string; text: string }> = {
  open: { title: "Acceso libre", text: "No hace falta token." },
  granted: {
    title: "Acceso concedido",
    text: "Tu cuenta ya aceptó las condiciones: puedes descargar.",
  },
  "needs-token": {
    title: "Falta tu token de Hugging Face",
    text: "Este modelo exige identificarse. Acepta las condiciones (paso 1) y pega un token de lectura (paso 2).",
  },
  "bad-token": {
    title: "Token no válido",
    text: "Hugging Face no reconoce el token. Crea uno nuevo de tipo «Read» y vuelve a pegarlo.",
  },
  pending: {
    title: "Solicitud en revisión",
    text: "Ya pediste acceso y el autor aún no lo aprueba (Meta suele tardar de minutos a horas). Vuelve a comprobar más tarde.",
  },
  "not-accepted": {
    title: "Aún no aceptaste las condiciones",
    text: "Tu token funciona, pero tu cuenta no tiene acceso. Abre el modelo en Hugging Face, acepta su licencia y comprueba de nuevo.",
  },
  unknown: {
    title: "No se pudo comprobar",
    text: "Hugging Face no respondió como se esperaba. Reintenta en unos segundos.",
  },
};

/**
 * Guided access for gated repositories. Accepting a licence is a legal step
 * the user must take on huggingface.co with their own account; the app only
 * links there, stores the user's token locally and re-checks access.
 */
export function GatedAccessPanel({
  repo,
  access,
  checking,
  onRecheck,
  alternativesUrl,
}: {
  repo: string;
  access: GatedAccess;
  checking: boolean;
  onRecheck: () => void;
  alternativesUrl: string;
}) {
  const token = useHfToken();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ok = access === "granted" || access === "open";
  const state = STATE_TEXT[access];

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!isHfToken(draft)) {
      setError("El token debe empezar por «hf_». Cópialo completo.");
      return;
    }
    setError(null);
    setHfToken(draft);
    setDraft("");
    onRecheck();
  }

  return (
    <section
      className="lm-gated"
      data-ok={ok || undefined}
      aria-labelledby="lm-gated-title"
    >
      <header>
        {ok ? <CheckCircle2 aria-hidden /> : <KeyRound aria-hidden />}
        <div>
          <h4 id="lm-gated-title">
            Modelo con acceso controlado · {state.title}
          </h4>
          <p>{state.text}</p>
        </div>
      </header>
      {ok ? null : (
        <ol className="lm-gated-steps">
          <li>
            <strong>Acepta la licencia con tu cuenta.</strong>{" "}
            <a
              href={`https://huggingface.co/${repo}`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir {repo} en Hugging Face <ExternalLink aria-hidden />
            </a>
            <small>
              Inicia sesión y pulsa «Agree and access repository». Es un acuerdo
              legal: solo tú puedes aceptarlo.
            </small>
          </li>
          <li>
            <strong>Pega un token de lectura.</strong>{" "}
            <a
              href="https://huggingface.co/settings/tokens"
              target="_blank"
              rel="noreferrer"
            >
              Crear token «Read» <ExternalLink aria-hidden />
            </a>
            {token ? (
              <span className="lm-gated-token">
                Token guardado (…{token.slice(-4)})
                <button
                  type="button"
                  className="lm-link"
                  onClick={() => {
                    setHfToken(null);
                    onRecheck();
                  }}
                >
                  Olvidar
                </button>
              </span>
            ) : (
              <form className="lm-gated-form" onSubmit={save}>
                <input
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Token de lectura de Hugging Face"
                  placeholder="hf_…"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button type="submit" className="lm-btn">
                  Guardar
                </button>
              </form>
            )}
            {error ? <small className="lm-error">{error}</small> : null}
            <small>
              Se guarda solo en este navegador y solo se envía a huggingface.co,
              nunca al servidor de AMARU.
            </small>
          </li>
          <li>
            <strong>Comprueba y descarga.</strong>{" "}
            <button
              type="button"
              className="lm-btn"
              onClick={onRecheck}
              disabled={checking}
            >
              {checking ? (
                <Loader2 className="lm-spin" aria-hidden />
              ) : (
                <RefreshCw aria-hidden />
              )}
              Comprobar acceso
            </button>
          </li>
        </ol>
      )}
      {ok ? null : (
        <p className="lm-note">
          ¿Prefieres no registrarte? Muchas conversiones GGUF de la comunidad
          (bartowski, unsloth, lmstudio-community) son de descarga libre:{" "}
          <a href={alternativesUrl} target="_blank" rel="noreferrer">
            buscar versiones sin registro <ExternalLink aria-hidden />
          </a>
        </p>
      )}
    </section>
  );
}
