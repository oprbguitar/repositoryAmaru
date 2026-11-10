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

export const extraRouters: ExtraRouter[] = [];
