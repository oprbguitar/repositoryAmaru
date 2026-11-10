import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "../../../types/api";

export type AdminSession = {
  authenticated: boolean;
  mode: "production" | "local";
  configured: boolean;
};

export type PublicAiSettings = {
  enabled: boolean;
  dailyLimit: number;
  globalDailyCap: number;
  model: string;
  maxOutputTokens: number;
};

export type PublicAiConfig = {
  settings: PublicAiSettings;
  models: ReadonlyArray<{ id: string; label: string }>;
};

const HEADERS = {
  "content-type": "application/json",
  "x-amaru-csrf": "local-ui",
};

async function unwrap<T>(response: Response): Promise<T> {
  const body = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !body)
    throw new Error(body?.errors?.[0]?.message ?? `Error ${response.status}`);
  return body.data;
}

export async function getAdminSession() {
  return unwrap<AdminSession>(await fetch("/api/admin/session"));
}

export function useAdminSession() {
  return useQuery({
    queryKey: ["admin-session"],
    queryFn: getAdminSession,
    staleTime: 60_000,
  });
}

export async function adminLogin(user: string, password: string) {
  return unwrap<{ authenticated: boolean }>(
    await fetch("/api/admin/login", {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ user, password }),
    }),
  );
}

export async function adminLogout() {
  await fetch("/api/admin/logout", { method: "POST", headers: HEADERS });
}

export async function getPublicAiConfig() {
  return unwrap<PublicAiConfig>(await fetch("/api/admin/public-ai"));
}

export async function savePublicAiConfig(settings: PublicAiSettings) {
  return unwrap<PublicAiConfig>(
    await fetch("/api/admin/public-ai", {
      method: "PUT",
      headers: HEADERS,
      body: JSON.stringify(settings),
    }),
  );
}
