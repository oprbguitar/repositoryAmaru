import { describe, expect, it } from "vitest";
import { AGENT_BLUEPRINTS, CHAINS } from "../src/features/prompts/catalog";
import {
  blueprintSystemPrompt,
  MASTER_PROMPTS,
  TOKEN_SAVERS,
} from "../src/features/prompts/masters";

describe("prompt maestro", () => {
  it("exists for every chain and only for real chains", () => {
    const ids = CHAINS.map((chain) => chain.id).sort();
    expect(Object.keys(MASTER_PROMPTS).sort()).toEqual(ids);
  });

  it("uses only variables its chain declares", () => {
    for (const chain of CHAINS) {
      const master = MASTER_PROMPTS[chain.id];
      const used = [...(master?.prompt ?? "").matchAll(/\{\{(\w+)\}\}/g)].map(
        (match) => match[1],
      );
      const declared = chain.variables.map((variable) => variable.key);
      for (const key of used) expect(declared, chain.id).toContain(key);
    }
  });

  it("is long, has an example and valid token-saving tags", () => {
    const saverIds = TOKEN_SAVERS.map((saver) => saver.id);
    for (const [id, master] of Object.entries(MASTER_PROMPTS)) {
      expect(master.prompt.split("\n").length, id).toBeGreaterThan(15);
      expect(master.example.length, id).toBeGreaterThan(150);
      for (const saver of master.savers) expect(saverIds, id).toContain(saver);
    }
  });

  it("builds a full orchestrator system prompt per agent blueprint", () => {
    for (const blueprint of AGENT_BLUEPRINTS) {
      const prompt = blueprintSystemPrompt(blueprint, (tier) => tier);
      expect(prompt).toContain("<bucle_de_control>");
      expect(prompt).toContain("<presupuesto_de_tokens>");
      expect(prompt.match(/<fase /g)?.length).toBe(blueprint.phases.length);
    }
  });
});
