import type { ApiResponse } from "../../../types/api";

export type PublicAiStatus = {
  enabled: boolean;
  aiBinding: boolean;
  model: string;
  modelLabel: string;
  dailyLimit: number;
  used: number;
  remaining: number | null;
  unlimited: boolean;
  globalRemaining: number;
};

export type PublicAiAnswer = {
  text: string;
  model: string;
  remaining: number | null;
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
    throw new Error(
      body?.errors?.[0]?.message ?? "No se pudo completar la consulta.",
    );
  return body.data;
}

export async function getPublicAiStatus() {
  return unwrap<PublicAiStatus>(await fetch("/api/public-ai/status"));
}

export async function askPublicAi(prompt: string, system?: string) {
  return unwrap<PublicAiAnswer>(
    await fetch("/api/public-ai/chat", {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ prompt, system }),
    }),
  );
}
