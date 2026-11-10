import { useQuery } from "@tanstack/react-query";
import { PowerOff, RotateCw, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageProvider";
import { Brand } from "./Brand";

type DevHealth = { ok: true; pid: number; startedAt: string };

/**
 * `/__amaru/health` only exists on the local Vite dev server (see
 * scripts/dev-server-control.ts). On Cloudflare it falls through to the SPA,
 * and the share proxy answers 404, so the shutdown control stays hidden.
 */
async function fetchDevHealth(): Promise<DevHealth | null> {
  try {
    const response = await fetch("/__amaru/health", { cache: "no-store" });
    if (!response.ok) return null;
    if (!response.headers.get("content-type")?.includes("application/json"))
      return null;
    const body = (await response.json()) as Partial<DevHealth>;
    return body.ok === true && typeof body.pid === "number"
      ? (body as DevHealth)
      : null;
  } catch {
    return null;
  }
}

export function useDevServerHealth() {
  const query = useQuery({
    queryKey: ["amaru-dev-health"],
    queryFn: fetchDevHealth,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });
  return query.data ?? null;
}

async function requestShutdown() {
  const response = await fetch("/__amaru/shutdown", {
    method: "POST",
    headers: { "x-amaru-csrf": "local-ui" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("shutdown_rejected");
}

export function ShutdownDialog({
  open,
  onClose,
  onStopped,
}: {
  open: boolean;
  onClose: () => void;
  onStopped: () => void;
}) {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setFailed(false);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function confirm() {
    setPending(true);
    setFailed(false);
    try {
      await requestShutdown();
      onStopped();
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="shell-dialog"
      aria-labelledby="shutdown-title"
      aria-describedby="shutdown-body"
      onClose={onClose}
      onCancel={(event) => {
        if (pending) event.preventDefault();
      }}
    >
      <div className="shell-dialog-head">
        <TriangleAlert aria-hidden="true" />
        <h2 id="shutdown-title">{t("shell.shutdownTitle")}</h2>
      </div>
      <p id="shutdown-body">{t("shell.shutdownBody")}</p>
      {failed ? (
        <p className="shell-dialog-error" role="alert">
          {t("shell.shutdownFailed")}
        </p>
      ) : null}
      <div className="shell-dialog-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onClose}
          disabled={pending}
          // Safer default: Enter on open cancels instead of shutting down.
          autoFocus
        >
          {t("shell.cancel")}
        </button>
        <button
          type="button"
          className="danger-button"
          onClick={confirm}
          disabled={pending}
          aria-busy={pending}
        >
          <PowerOff aria-hidden="true" />
          {pending ? t("shell.shuttingDown") : t("shell.shutdownConfirm")}
        </button>
      </div>
    </dialog>
  );
}

export function ServerStoppedScreen() {
  const { t } = useLanguage();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  return (
    <main className="server-stopped">
      <div className="server-stopped-card">
        <Brand />
        <h1 ref={headingRef} tabIndex={-1}>
          <PowerOff aria-hidden="true" />
          {t("shell.offTitle")}
        </h1>
        <p>{t("shell.offBody")}</p>
        <code>Iniciar-Servidor-Local.cmd</code>
        <button
          type="button"
          className="secondary-button"
          onClick={() => window.location.reload()}
        >
          <RotateCw aria-hidden="true" />
          {t("shell.reload")}
        </button>
      </div>
    </main>
  );
}
