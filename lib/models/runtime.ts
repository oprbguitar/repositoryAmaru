// What a model's published files are and which programs can run them.
// Facts come from each runtime's own documentation (formats it loads, the
// platforms it ships for). Nothing is benchmarked: the UI presents this as
// guidance, and the user's hardware only reorders it.

import type { HubFormat } from "./hub";

export type Platform = "windows" | "macos" | "linux" | "android" | "ios";
export type GpuVendor = "nvidia" | "amd" | "intel" | "apple" | "qualcomm";

export type FileTypeInfo = {
  format: HubFormat;
  extension: string;
  what: string;
  /** Files that must travel with the weights. */
  companions: string;
  /** Runs without Python / training stack. */
  local: boolean;
};

export const FILE_TYPES: Record<HubFormat, FileTypeInfo> = {
  gguf: {
    format: "gguf",
    extension: ".gguf",
    what: "Un solo archivo con pesos cuantizados, tokenizador y plantilla de chat dentro. Es el formato de llama.cpp y de las apps de escritorio.",
    companions:
      "Nada más. Si el modelo ve imágenes, añade el archivo mmproj (proyector de visión).",
    local: true,
  },
  safetensors: {
    format: "safetensors",
    extension: ".safetensors",
    what: "Pesos originales sin comprimir (normalmente BF16/FP16), troceados en varios archivos. Formato seguro: no ejecuta código al cargarse.",
    companions:
      "config.json, tokenizer.json / tokenizer_config.json y generation_config.json; se descargan juntos.",
    local: false,
  },
  mlx: {
    format: "mlx",
    extension: ".safetensors (MLX)",
    what: "Pesos convertidos para el framework MLX de Apple; aprovechan la memoria unificada de los Mac con chip M.",
    companions: "config.json y tokenizer.json en la misma carpeta.",
    local: true,
  },
  onnx: {
    format: "onnx",
    extension: ".onnx (+ .onnx_data)",
    what: "Grafo portable de ONNX: corre en ONNX Runtime, en el navegador (WebGPU) o con DirectML en Windows.",
    companions:
      "Si el modelo supera 2 GB, los pesos van aparte en .onnx_data; también tokenizer.json.",
    local: true,
  },
  pytorch: {
    format: "pytorch",
    extension: ".bin / .pt",
    what: "Formato antiguo de PyTorch (pickle). Puede ejecutar código al cargarse: prefiere safetensors si existe.",
    companions: "config.json y archivos del tokenizador.",
    local: false,
  },
  openvino: {
    format: "openvino",
    extension: ".xml + .bin (OpenVINO IR)",
    what: "Representación intermedia de Intel OpenVINO, optimizada para CPU, GPU integrada y NPU de Intel.",
    companions: "openvino_model.xml y openvino_model.bin siempre en pareja.",
    local: true,
  },
};

export type RuntimeKind = "app" | "cli" | "library";

export type Runtime = {
  id: string;
  name: string;
  kind: RuntimeKind;
  formats: HubFormat[];
  platforms: Platform[];
  /** Hardware acceleration it can use. */
  accel: string;
  /** Pipelines it serves; empty = any text/vision chat model. */
  pipelines: RegExp;
  url: string;
  /** Command template: {repo} and {quant} are replaced. */
  command: string | null;
  note: string;
};

const CHAT =
  /^(text-generation|image-text-to-text|text2text-generation|feature-extraction|sentence-similarity)$/;
const IMAGE = /^(text-to-image|image-to-image|text-to-video|image-to-video)$/;
const ANY = /.*/;

export const RUNTIMES: Runtime[] = [
  {
    id: "lmstudio",
    name: "LM Studio",
    kind: "app",
    formats: ["gguf", "mlx"],
    platforms: ["windows", "macos", "linux"],
    accel: "CUDA, Vulkan, Metal o CPU",
    pipelines: CHAT,
    url: "https://lmstudio.ai",
    command: null,
    note: "App con interfaz: busca el repositorio en «Discover», elige la cuantización y chatea. La más sencilla para empezar.",
  },
  {
    id: "ollama",
    name: "Ollama",
    kind: "cli",
    formats: ["gguf"],
    platforms: ["windows", "macos", "linux"],
    accel: "CUDA, ROCm, Metal o CPU",
    pipelines: CHAT,
    url: "https://ollama.com",
    command: "ollama run hf.co/{repo}:{quant}",
    note: "Servicio en segundo plano con API local (puerto 11434) compatible con muchas apps.",
  },
  {
    id: "llamacpp",
    name: "llama.cpp",
    kind: "cli",
    formats: ["gguf"],
    platforms: ["windows", "macos", "linux", "android"],
    accel: "CUDA, ROCm, Vulkan, SYCL, Metal o CPU",
    pipelines: CHAT,
    url: "https://github.com/ggml-org/llama.cpp",
    command: "llama-server -hf {repo}:{quant}",
    note: "El motor detrás de casi todo lo anterior; máximo control (capas en GPU, contexto, hilos).",
  },
  {
    id: "jan",
    name: "Jan",
    kind: "app",
    formats: ["gguf"],
    platforms: ["windows", "macos", "linux"],
    accel: "CUDA, Vulkan, Metal o CPU",
    pipelines: CHAT,
    url: "https://jan.ai",
    command: null,
    note: "App de código abierto, 100 % offline; importa el .gguf desde tu carpeta.",
  },
  {
    id: "mlx",
    name: "MLX-LM",
    kind: "cli",
    formats: ["mlx", "safetensors"],
    platforms: ["macos"],
    accel: "GPU Apple (Metal) con memoria unificada",
    pipelines: CHAT,
    url: "https://github.com/ml-explore/mlx-lm",
    command: 'mlx_lm.generate --model {repo} --prompt "Hola"',
    note: "Solo Mac con chip M. Con safetensors convierte al vuelo; con MLX carga directo.",
  },
  {
    id: "transformers",
    name: "Transformers (Python)",
    kind: "library",
    formats: ["safetensors", "pytorch"],
    platforms: ["windows", "macos", "linux"],
    accel: "CUDA, ROCm, MPS o CPU",
    pipelines: ANY,
    url: "https://huggingface.co/docs/transformers",
    command:
      "python -c \"from transformers import pipeline; print(pipeline(model='{repo}')('Hola'))\"",
    note: "Referencia oficial de Hugging Face; ideal para afinar o experimentar. Pide más memoria que GGUF.",
  },
  {
    id: "vllm",
    name: "vLLM",
    kind: "cli",
    formats: ["safetensors"],
    platforms: ["linux"],
    accel: "NVIDIA CUDA o AMD ROCm",
    pipelines: CHAT,
    url: "https://docs.vllm.ai",
    command: "vllm serve {repo}",
    note: "Servidor de alto rendimiento para varios usuarios; requiere GPU dedicada y Linux (o WSL).",
  },
  {
    id: "diffusers",
    name: "Diffusers / ComfyUI",
    kind: "library",
    formats: ["safetensors"],
    platforms: ["windows", "macos", "linux"],
    accel: "CUDA, ROCm, MPS o CPU",
    pipelines: IMAGE,
    url: "https://huggingface.co/docs/diffusers",
    command: null,
    note: "Para modelos de imagen y video; ComfyUI ofrece una interfaz por nodos.",
  },
  {
    id: "onnx",
    name: "ONNX Runtime / Transformers.js",
    kind: "library",
    formats: ["onnx"],
    platforms: ["windows", "macos", "linux", "android", "ios"],
    accel: "DirectML, CUDA, WebGPU o CPU",
    pipelines: ANY,
    url: "https://onnxruntime.ai",
    command: null,
    note: "Corre incluso dentro del navegador con WebGPU, sin instalar nada.",
  },
  {
    id: "openvino",
    name: "OpenVINO",
    kind: "library",
    formats: ["openvino", "onnx"],
    platforms: ["windows", "linux"],
    accel: "CPU, GPU integrada y NPU de Intel",
    pipelines: ANY,
    url: "https://docs.openvino.ai",
    command: null,
    note: "La mejor opción en laptops Intel con NPU (Core Ultra).",
  },
];

export type HardwareHints = {
  platform: Platform | null;
  gpuVendor: GpuVendor | null;
  vramGib: number | null;
};

export type RuntimeSuggestion = Runtime & {
  /** True when it matches the user's platform/GPU. */
  fits: boolean;
  /** Why it fits or not, for the user's hardware. */
  reason: string;
  commandText: string | null;
};

function fillCommand(
  template: string | null,
  repo: string,
  quant: string | null,
): string | null {
  if (!template) return null;
  if (template.includes("{quant}") && !quant)
    return template.replace(":{quant}", "").replaceAll("{repo}", repo);
  return template.replaceAll("{repo}", repo).replaceAll("{quant}", quant ?? "");
}

const PLATFORM_NAMES: Record<Platform, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  android: "Android",
  ios: "iOS",
};

/**
 * Runtimes able to load at least one published format for the model's
 * pipeline, ordered so the best match for the user's hardware comes first.
 */
export function suggestRuntimes(input: {
  repo: string;
  formats: HubFormat[];
  pipelineTag: string | null;
  quant: string | null;
  hardware: HardwareHints;
}): RuntimeSuggestion[] {
  const { platform, gpuVendor, vramGib } = input.hardware;
  const out: RuntimeSuggestion[] = [];
  for (const runtime of RUNTIMES) {
    if (!runtime.formats.some((f) => input.formats.includes(f))) continue;
    if (input.pipelineTag && !runtime.pipelines.test(input.pipelineTag))
      continue;
    let fits = true;
    let reason = `Disponible para ${runtime.platforms.map((p) => PLATFORM_NAMES[p]).join(", ")}.`;
    if (platform && !runtime.platforms.includes(platform)) {
      fits = false;
      reason = `No tiene versión para ${PLATFORM_NAMES[platform]}.`;
    } else if (
      runtime.id === "vllm" &&
      gpuVendor !== "nvidia" &&
      gpuVendor !== "amd"
    ) {
      fits = false;
      reason = "Necesita una GPU NVIDIA o AMD dedicada.";
    } else if (
      runtime.id === "mlx" &&
      platform === "macos" &&
      gpuVendor &&
      gpuVendor !== "apple"
    ) {
      fits = false;
      reason = "Solo funciona en Mac con chip Apple (M1 o posterior).";
    } else if (platform) {
      reason = `Funciona en tu ${PLATFORM_NAMES[platform]}${gpuVendor ? ` con ${accelFor(gpuVendor, platform)}` : ""}.`;
    }
    out.push({
      ...runtime,
      fits,
      reason,
      commandText: fillCommand(runtime.command, input.repo, input.quant),
    });
  }
  const score = (r: RuntimeSuggestion) => {
    let s = r.fits ? 100 : 0;
    if (
      platform === "macos" &&
      gpuVendor === "apple" &&
      r.id === "mlx" &&
      input.formats.includes("mlx")
    )
      s += 30;
    if (r.id === "lmstudio") s += 20;
    if (r.id === "ollama") s += 15;
    if (r.id === "llamacpp") s += 10;
    if (r.id === "vllm" && (vramGib ?? 0) >= 16) s += 12;
    if (r.id === "transformers") s += 8;
    if (r.id === "openvino" && gpuVendor === "intel") s += 25;
    return s;
  };
  return out.sort((a, b) => score(b) - score(a));
}

/** Acceleration backend a local runtime would use on that GPU. */
export function accelFor(
  vendor: GpuVendor | null,
  platform: Platform | null,
): string {
  switch (vendor) {
    case "nvidia":
      return "CUDA (GPU NVIDIA)";
    case "amd":
      return platform === "linux" ? "ROCm (GPU AMD)" : "Vulkan (GPU AMD)";
    case "intel":
      return "Vulkan / SYCL (GPU Intel)";
    case "apple":
      return "Metal (GPU Apple)";
    case "qualcomm":
      return "CPU ARM / NPU Qualcomm";
    default:
      return "CPU (AVX2)";
  }
}

/** Normalises the WebGPU `adapter.info.vendor` string. */
export function gpuVendorFrom(
  value: string | null | undefined,
): GpuVendor | null {
  const v = (value ?? "").toLowerCase();
  if (v.includes("nvidia")) return "nvidia";
  if (v.includes("amd") || v.includes("ati")) return "amd";
  if (v.includes("intel")) return "intel";
  if (v.includes("apple")) return "apple";
  if (v.includes("qualcomm")) return "qualcomm";
  return null;
}

/** Best-effort platform from the user agent; never sent anywhere. */
export function platformFrom(
  userAgent: string,
  hint?: string | null,
): Platform | null {
  const value = `${hint ?? ""} ${userAgent}`.toLowerCase();
  if (value.includes("android")) return "android";
  if (/iphone|ipad|ios/.test(value)) return "ios";
  if (/windows|win32|win64/.test(value)) return "windows";
  if (value.includes("mac")) return "macos";
  if (value.includes("linux") || value.includes("x11")) return "linux";
  return null;
}

/** Hugging Face search for a runnable conversion of the same model. */
export function conversionSearchUrl(
  repo: string,
  format: "gguf" | "mlx",
): string {
  const name = repo.split("/").pop() ?? repo;
  return `https://huggingface.co/models?search=${encodeURIComponent(`${name} ${format}`)}`;
}
