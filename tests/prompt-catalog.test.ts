import { describe, expect, it } from "vitest";
import {
  AGENT_BLUEPRINTS,
  CATEGORIES,
  CHAINS,
  chainToMarkdown,
  fillTemplate,
} from "../src/features/prompts/catalog";

describe("prompt catalogue", () => {
  it("fills known variables and leaves unknown ones visible", () => {
    expect(fillTemplate("Tema: {{tema}} / {{otro}}", { tema: "IA" })).toBe(
      "Tema: IA / {{otro}}",
    );
  });

  it("has unique ids, valid categories and declared variables", () => {
    const ids = new Set(CHAINS.map((chain) => chain.id));
    expect(ids.size).toBe(CHAINS.length);
    for (const chain of CHAINS) {
      expect(CATEGORIES.some((c) => c.id === chain.category)).toBe(true);
      const declared = new Set(chain.variables.map((v) => v.key));
      for (const step of chain.steps)
        for (const [, key] of step.prompt.matchAll(/\{\{(\w+)\}\}/g))
          expect(declared.has(key ?? ""), `${chain.id}: ${key}`).toBe(true);
    }
    expect(AGENT_BLUEPRINTS.length).toBeGreaterThan(2);
  });

  it("exports a chain as Markdown with sources", () => {
    const chain = CHAINS[0];
    if (!chain) throw new Error("empty catalogue");
    const markdown = chainToMarkdown(chain, {});
    expect(markdown.startsWith(`# ${chain.title}`)).toBe(true);
    expect(markdown).toContain("## Fuentes");
  });
});
