// Device classes a local model can target, with the practical limits and the
// apps that run models there. Limits are conservative guidance from each
// runtime's documentation (package ≈ memory needed); the UI labels them as
// orientation, not a guarantee.

import type { HubFormat, HubModel } from "./hub";
import { BYTES_PER_GB } from "./memory";
import type { Platform } from "./runtime";

export type DeviceId = "pc" | "android" | "ios" | "web" | "edge";

export type DeviceApp = { name: string; url: string; note: string };

export type DeviceTarget = {
  id: DeviceId;
  label: string;
  short: string;
  /** Largest Q4 package that is reasonable on a typical device of the class. */
  maxBytes: number;
  /** Published formats its apps can load directly. */
  formats: HubFormat[];
  needs: string;
  sizes: string;
  apps: DeviceApp[];
};

const GB = BYTES_PER_GB;

export const DEVICE_TARGETS: DeviceTarget[] = [
  {
    id: "pc",
    label: "PC / laptop",
    short: "PC",
    maxBytes: 20 * GB,
    formats: ["gguf", "mlx", "safetensors", "onnx", "openvino"],
    needs:
      "16 GB de RAM cubren modelos de 7–8 B; una GPU con 8 GB de VRAM los acelera mucho.",
    sizes: "1 B a 32 B (hasta ~20 GB en Q4)",
    apps: [
      {
        name: "LM Studio",
        url: "https://lmstudio.ai",
        note: "App con interfaz",
      },
      {
        name: "Ollama",
        url: "https://ollama.com",
        note: "Servicio + API local",
      },
    ],
  },
  {
    id: "android",
    label: "Android (móvil y tablet)",
    short: "Android",
    maxBytes: 3 * GB,
    formats: ["gguf"],
    needs:
      "8 GB de RAM o más y un chip reciente (Snapdragon 8 Gen 2+, Tensor G3+, Dimensity 9000+). Con 6 GB, quédate en 1–2 B.",
    sizes: "0,5 B a 4 B (≤ 3 GB)",
    apps: [
      {
        name: "Google AI Edge Gallery",
        url: "https://github.com/google-ai-edge/gallery",
        note: "App oficial de Google; modelos LiteRT (Gemma 3n) offline",
      },
      {
        name: "PocketPal AI",
        url: "https://github.com/a-ghorbani/pocketpal-ai",
        note: "Carga archivos .gguf de Hugging Face",
      },
      {
        name: "MLC Chat",
        url: "https://llm.mlc.ai",
        note: "Usa la GPU del teléfono",
      },
    ],
  },
  {
    id: "ios",
    label: "iPhone / iPad",
    short: "iOS",
    maxBytes: 3 * GB,
    formats: ["gguf", "mlx"],
    needs:
      "iPhone 15 Pro o posterior (8 GB) o iPad con chip M. Modelos de 1–4 B en 4 bits.",
    sizes: "0,5 B a 4 B (≤ 3 GB)",
    apps: [
      {
        name: "PocketPal AI",
        url: "https://github.com/a-ghorbani/pocketpal-ai",
        note: "GGUF en iOS",
      },
      {
        name: "MLC Chat",
        url: "https://llm.mlc.ai",
        note: "Acelerado por Metal",
      },
    ],
  },
  {
    id: "web",
    label: "Navegador web",
    short: "Web",
    maxBytes: 2 * GB,
    formats: ["onnx"],
    needs:
      "Chrome o Edge con WebGPU y 8 GB de RAM. El modelo se descarga una vez y queda en caché del navegador.",
    sizes: "Hasta ~2 B (≤ 2 GB)",
    apps: [
      {
        name: "Transformers.js",
        url: "https://huggingface.co/docs/transformers.js",
        note: "Modelos ONNX con WebGPU",
      },
      {
        name: "WebLLM",
        url: "https://webllm.mlc.ai",
        note: "Chat 100 % en el navegador",
      },
    ],
  },
  {
    id: "edge",
    label: "Compactos (Raspberry Pi, Jetson, mini PC)",
    short: "Compactos",
    maxBytes: 4 * GB,
    formats: ["gguf", "onnx"],
    needs:
      "Raspberry Pi 5 de 8 GB para modelos de 1–3 B en CPU; NVIDIA Jetson Orin para 7–8 B con GPU.",
    sizes: "0,5 B a 3 B en Pi · hasta 8 B en Jetson",
    apps: [
      { name: "Ollama", url: "https://ollama.com", note: "ARM64 Linux" },
      {
        name: "llama.cpp",
        url: "https://github.com/ggml-org/llama.cpp",
        note: "Compila en ARM",
      },
    ],
  },
];

export function deviceById(id: DeviceId): DeviceTarget {
  return DEVICE_TARGETS.find((d) => d.id === id) ?? DEVICE_TARGETS[0];
}

/** Device class of the visitor, read from the platform (never sent anywhere). */
export function deviceFromPlatform(platform: Platform | null): DeviceId | null {
  if (platform === "android") return "android";
  if (platform === "ios") return "ios";
  return null;
}

/**
 * True when the estimated Q4 package stays under the device limit. Unknown
 * size → false (no guess). Format is checked apart (`readyFor`): most official
 * repos publish safetensors and the GGUF lives in a sibling conversion repo.
 */
export function fitsDevice(
  model: Pick<HubModel, "estimatedPackageBytes">,
  device: DeviceTarget,
): boolean {
  return (
    model.estimatedPackageBytes !== null &&
    model.estimatedPackageBytes <= device.maxBytes
  );
}

/** The repository already ships a format the device's apps load. */
export function readyFor(
  model: Pick<HubModel, "formats">,
  device: DeviceTarget,
): boolean {
  return model.formats.some((format) => device.formats.includes(format));
}
