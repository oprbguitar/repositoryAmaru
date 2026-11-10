import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { askPublicAi, getPublicAiStatus } from "./publicAi";

/**
 * Small, honest trial box: shows the remaining free questions before the
 * visitor spends one, and labels every answer as AI-generated.
 */
export function TryFreeAi({
  initialPrompt,
  system,
}: {
  initialPrompt: string;
  system?: string;
}) {
  const fieldId = useId();
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: ["public-ai-status"],
    queryFn: getPublicAiStatus,
    staleTime: 30_000,
  });
  const [prompt, setPrompt] = useState(initialPrompt);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPrompt(initialPrompt);
    setAnswer(null);
    setError(null);
  }, [initialPrompt]);

  const info = status.data;
  const exhausted =
    info && !info.unlimited && (info.remaining ?? 0) <= 0 ? true : false;
  const disabled =
    !info?.enabled || exhausted || busy || prompt.trim().length < 2;

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const result = await askPublicAi(prompt, system);
      setAnswer(result.text || "(El modelo devolvió una respuesta vacía.)");
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Error inesperado.",
      );
    } finally {
      setBusy(false);
      queryClient.invalidateQueries({ queryKey: ["public-ai-status"] });
    }
  }

  return (
    <section className="pr-try" aria-label="Probar con IA gratuita">
      <header>
        <Sparkles aria-hidden="true" />
        <strong>Probar gratis</strong>
        <span className="pr-try-quota" aria-live="polite">
          {status.isLoading
            ? "Consultando cupo…"
            : !info?.enabled
              ? "Prueba desactivada"
              : info.unlimited
                ? `Administrador · sin límite · ${info.modelLabel}`
                : `${info.remaining} de ${info.dailyLimit} consultas hoy · ${info.modelLabel}`}
        </span>
      </header>
      <label htmlFor={fieldId} className="pr-visually-hidden">
        Consulta para la IA gratuita
      </label>
      <textarea
        id={fieldId}
        value={prompt}
        rows={4}
        maxLength={6000}
        onChange={(event) => setPrompt(event.target.value)}
      />
      <div className="pr-try-actions">
        <button
          type="button"
          className="pr-button pr-button-primary"
          disabled={disabled}
          onClick={run}
        >
          {busy ? <Loader2 className="spin" aria-hidden="true" /> : null}
          {busy ? "Generando…" : "Enviar"}
        </button>
        <small>
          Modelo abierto en Cloudflare Workers AI. No envíes datos personales.
        </small>
      </div>
      {exhausted ? (
        <p className="pr-note">
          Usaste tus consultas gratuitas de hoy. Copia el prompt y úsalo en tu
          herramienta favorita.
        </p>
      ) : null}
      {error ? (
        <p className="pr-note pr-note-error" role="alert">
          {error}
        </p>
      ) : null}
      {answer ? (
        <div className="pr-answer">
          <span className="pr-answer-label">Respuesta generada por IA</span>
          <p>{answer}</p>
        </div>
      ) : null}
    </section>
  );
}
