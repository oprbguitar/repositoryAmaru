// Response shapes of `/api/model-hub/*`, shared by the worker and the UI.
import type { HubModel, summarizeFiles } from "./hub";

export type HubSource = { label: string; url: string };

export type HubPoolPayload = {
  models: HubModel[];
  sources: HubSource[];
  fetchedAt: string;
  authenticated: boolean;
};

export type HubConfigFacts = {
  contextLength: number | null;
  contextField: string | null;
  numExperts: number | null;
  expertsPerToken: number | null;
  hiddenSize: number | null;
  layers: number | null;
};

export type HubDetailPayload = {
  model: HubModel;
  packages: ReturnType<typeof summarizeFiles>;
  config: HubConfigFacts | null;
  limitations: { heading: string; excerpt: string } | null;
  sources: HubSource[];
  fetchedAt: string;
};
