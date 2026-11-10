/**
 * Registry for feature routers added after the original monolithic router.
 *
 * Each feature owns one module under `worker/routes/` that exports a function
 * with the `ExtraRouter` signature: return a Response when the request is
 * yours, or `null` to let the next router try. Register it by adding ONE
 * import and ONE array entry below — nothing else in `worker/index.ts`
 * needs to change.
 */

import type { ExternalEnv } from "./external";
import { githubRouter } from "./routes/github";
import { libraryAnalysesRouter } from "./routes/library-analyses";
import { llmMapRouter } from "./routes/llm-map";
import { localModelsRouter } from "./routes/local-models";
import { marketForecastRouter } from "./routes/market-forecast";
import { modelHubRouter } from "./routes/model-hub";

export type ExtraEnv = ExternalEnv & {
  CACHE: KVNamespace;
  DB: D1Database;
  AI?: Ai;
  [key: string]: unknown;
};

export type ExtraRouter = (
  request: Request,
  env: ExtraEnv,
  url: URL,
) => Promise<Response | null>;

export const extraRouters: ExtraRouter[] = [
  marketForecastRouter,
  llmMapRouter,
  githubRouter,
  libraryAnalysesRouter,
  localModelsRouter,
  modelHubRouter,
];
