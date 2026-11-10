/**
 * Plain-language explanations of model package terms (GGUF, quantizations,
 * safetensors) shown next to the package picker. Quality notes follow the
 * llama.cpp quantization documentation; they are general guidance, not
 * measurements of a specific model.
 */

export type TermExplanation = { term: string; text: string };

export const FORMAT_TERMS: Record<"gguf" | "safetensors", TermExplanation> = {
  gguf: {
    term: "GGUF",
    text: "Formato de un solo archivo pensado para ejecutar modelos en tu computadora con llama.cpp, Ollama, LM Studio o Jan. Funciona en CPU y aprovecha la GPU si existe.",
  },
  safetensors: {
    term: "Safetensors (modelo completo)",
    text: "Pesos originales del modelo, sin comprimir. Sirven para afinar (fine-tuning), convertir a otros formatos o ejecutar con Transformers/vLLM. Ocupan mucho más y suelen requerir GPU.",
  },
};

type QuantRule = {
  pattern: RegExp;
  label: string;
  quality: string;
  use: string;
};

const QUANT_RULES: QuantRule[] = [
  {
    pattern: /^(F32|F16|BF16)/,
    label: "Precisión completa (16/32 bits)",
    quality: "Calidad idéntica al original.",
    use: "Referencia o conversión; muy pesado para uso diario.",
  },
  {
    pattern: /^Q8/,
    label: "8 bits",
    quality: "Prácticamente sin pérdida perceptible.",
    use: "Si te sobra memoria y quieres máxima fidelidad.",
  },
  {
    pattern: /^Q6/,
    label: "6 bits",
    quality: "Pérdida muy pequeña.",
    use: "Equilibrio alto: buena opción con 16 GB de RAM o más.",
  },
  {
    pattern: /^Q5/,
    label: "5 bits",
    quality: "Pérdida pequeña.",
    use: "Algo mejor que Q4 a cambio de ~15 % más de tamaño.",
  },
  {
    pattern: /^(Q4_K_M|Q4_K|Q4_K_S|IQ4)/,
    label: "4 bits (K / IQ)",
    quality: "Pérdida moderada y la mejor relación calidad/tamaño.",
    use: "Recomendado para la mayoría: chat, código y resúmenes en laptops.",
  },
  {
    pattern: /^Q4/,
    label: "4 bits (método antiguo)",
    quality: "Pérdida moderada; preferible Q4_K_M si está disponible.",
    use: "Compatibilidad con programas antiguos.",
  },
  {
    pattern: /^(Q3|IQ3)/,
    label: "3 bits",
    quality: "Pérdida notable en razonamiento y precisión.",
    use: "Solo si la memoria no alcanza para Q4.",
  },
  {
    pattern: /^(Q2|IQ2|IQ1|TQ|UD-TQ|UD-IQ1|UD-IQ2|UD-Q2)/,
    label: "1–2 bits (extremo)",
    quality: "Pérdida alta; el modelo puede equivocarse a menudo.",
    use: "Experimentar con modelos muy grandes en poca memoria.",
  },
];

/** Explains a quantization label such as Q4_K_M, IQ3_XS or UD-Q4_K_XL. */
export function explainQuant(id: string): TermExplanation & {
  quality: string;
  use: string;
} {
  const upper = id.toUpperCase();
  const core = upper.replace(/^UD-/, "");
  const rule =
    QUANT_RULES.find((r) => r.pattern.test(upper)) ??
    QUANT_RULES.find((r) => r.pattern.test(core));
  const dynamic = upper.startsWith("UD-")
    ? " «UD» = cuantización dinámica de Unsloth: protege las capas más sensibles."
    : "";
  if (!rule)
    return {
      term: id,
      text: `Variante ${id}. No hay una descripción estándar para esta etiqueta.`,
      quality: "Desconocida.",
      use: "Revisa la ficha del repositorio.",
    };
  return {
    term: id,
    text: `Cuantización: los pesos se guardan con ${rule.label.toLowerCase()} en vez de 16 bits, para que el modelo ocupe menos y corra en equipos comunes.${dynamic}`,
    quality: rule.quality,
    use: rule.use,
  };
}

/** Rough memory needed to run a package: file size plus ~20 % for context. */
export function runtimeMemoryHint(bytes: number): string {
  const gib = (bytes * 1.2) / 1024 ** 3;
  return `Para ejecutarlo necesitas ≈ ${gib.toFixed(1)} GB libres de RAM o VRAM (archivo + contexto).`;
}
