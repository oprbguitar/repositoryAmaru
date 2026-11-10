import type { ReactNode } from "react";
import { useAdminSession } from "./adminApi";

/** True only with a real administrator session (local dev counts as admin). */
export function useIsAdmin() {
  return useAdminSession().data?.authenticated === true;
}

/**
 * Configuration hints («falta tal clave», «ejecuta sincronizar») are for the
 * administrator. Visitors see the neutral `fallback`, or nothing.
 */
export function AdminNote({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <>{useIsAdmin() ? children : fallback}</>;
}

export const AUTO_UPDATE_NOTE =
  "Los datos se actualizan automáticamente cada semana.";
