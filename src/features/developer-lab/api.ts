import {
  decodeLabEvent,
  type LabStreamEvent,
  SseDecoder,
} from "../../../lib/developer-lab/streaming";
import type {
  ConnectionTestResult,
  CredentialMetadata,
  DeveloperLabProvider,
  TestbenchModel,
  TestbenchResult,
  TestType,
} from "../../../lib/developer-lab/types";
import type { ApiResponse } from "../../../types/api";

const PROTECTED_HEADERS = {
  "content-type": "application/json",
  "x-amaru-csrf": "local-ui",
};

async function read<T>(response: Response): Promise<ApiResponse<T>> {
  const payload = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !payload)
    throw new Error(
      payload?.errors?.[0]?.message ?? "El laboratorio no está disponible.",
    );
  return payload;
}

export async function listDeveloperLabProviders() {
  return read<DeveloperLabProvider[]>(
    await fetch("/api/developer-lab/providers"),
  );
}

export async function configureProviderCredential(input: {
  providerId: string;
  credential: string;
  alias: string;
  storage: "temporary" | "local";
}) {
  return read<CredentialMetadata>(
    await fetch(
      `/api/developer-lab/providers/${encodeURIComponent(input.providerId)}/configure`,
      {
        method: "POST",
        headers: PROTECTED_HEADERS,
        body: JSON.stringify({
          credential: input.credential,
          alias: input.alias,
          storage: input.storage,
        }),
      },
    ),
  );
}

export async function testProviderCredential(providerId: string) {
  return read<ConnectionTestResult>(
    await fetch(
      `/api/developer-lab/providers/${encodeURIComponent(providerId)}/test`,
      { method: "POST", headers: PROTECTED_HEADERS },
    ),
  );
}

export async function listProviderModels(
  providerId: string,
  testType: TestType,
) {
  return read<TestbenchModel[]>(
    await fetch(
      `/api/developer-lab/providers/${encodeURIComponent(providerId)}/models?type=${testType}`,
    ),
  );
}

export type ExecuteTestPayload = {
  providerId: string;
  modelId: string;
  testType: TestType;
  prompt: string;
  imageBase64?: string;
  imageMimeType?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export async function executeLabTest(payload: ExecuteTestPayload) {
  return read<TestbenchResult>(
    await fetch("/api/developer-lab/execute", {
      method: "POST",
      headers: PROTECTED_HEADERS,
      body: JSON.stringify(payload),
    }),
  );
}

export async function deleteProviderCredential(providerId: string) {
  return read<{ deleted: boolean }>(
    await fetch(
      `/api/developer-lab/providers/${encodeURIComponent(providerId)}/credential`,
      { method: "DELETE", headers: PROTECTED_HEADERS },
    ),
  );
}

export type StreamRunPayload = {
  providerId: string;
  modelId: string;
  prompt: string;
  system?: string;
  temperature?: number;
  maxOutputTokens?: number;
  compareGroupId?: string;
};

/**
 * POSTs to the normalized SSE endpoint and calls `onEvent` for each event as
 * it arrives (fetch + ReadableStream; EventSource cannot POST).
 */
export async function streamLabRun(
  payload: StreamRunPayload,
  onEvent: (event: LabStreamEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch("/api/developer-lab/stream", {
    method: "POST",
    headers: { ...PROTECTED_HEADERS, accept: "text/event-stream" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!response.ok || !response.body) {
    const body = (await response
      .json()
      .catch(() => null)) as ApiResponse<null> | null;
    throw new Error(
      body?.errors?.[0]?.message ??
        `El laboratorio respondió ${response.status}.`,
    );
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  const decoder = new SseDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    for (const message of decoder.push(value)) {
      const event = decodeLabEvent(message);
      if (event) onEvent(event);
    }
  }
  for (const message of decoder.flush()) {
    const event = decodeLabEvent(message);
    if (event) onEvent(event);
  }
}

export type ModelRunStats = {
  providerId: string;
  modelId: string;
  runs: number;
  completed: number;
  failed: number;
  cancelled: number;
  avgCostUsd: number | null;
  totalCostUsd: number | null;
  avgLatencyMs: number | null;
  avgTtftMs: number | null;
  avgTokensPerSecond: number | null;
  lastRunAt: string;
};

export async function listRunStats() {
  return read<ModelRunStats[]>(await fetch("/api/developer-lab/runs/stats"));
}

export async function saveRunOutput(
  runId: string,
  output: string,
  prompt: string,
) {
  return read<{ saved: boolean }>(
    await fetch(`/api/developer-lab/runs/${encodeURIComponent(runId)}/save`, {
      method: "POST",
      headers: PROTECTED_HEADERS,
      body: JSON.stringify({ output, prompt }),
    }),
  );
}
