/// <reference lib="webworker" />
// Hashes a downloaded file off the main thread so the UI never freezes.
import { Sha256 } from "./sha256";

type Request = { id: number; file: File; upTo: number };

self.onmessage = async (event: MessageEvent<Request>) => {
  const { id, file, upTo } = event.data;
  try {
    const hasher = new Sha256();
    const reader = file.slice(0, upTo).stream().getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      hasher.update(value);
    }
    self.postMessage({ id, hex: hasher.hex(), state: hasher.save() });
  } catch (error) {
    self.postMessage({ id, error: (error as Error).message });
  }
};
