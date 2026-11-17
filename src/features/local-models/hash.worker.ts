/// <reference lib="webworker" />
// Hashes downloads off the main thread so the UI never freezes.
// - "stream-*": SHA-256 fed chunk by chunk while a file downloads
//   (WebAssembly, ~2× the plain TypeScript version).
// - "file-hex": SHA-256 of a file already on disk (resumed downloads).
// - "state": resumable TypeScript state for small files.
import { createSHA256, type IHasher } from "hash-wasm";
import { Sha256 } from "./sha256";

type Message =
  | { type: "stream-start"; sid: string }
  | { type: "stream-update"; sid: string; data: Uint8Array }
  | { type: "stream-digest"; sid: string; key: string }
  | { type: "stream-drop"; sid: string }
  | { type: "file-hex"; key: string; file: File; upTo: number }
  | { type: "state"; key: string; file: File; upTo: number };

const streams = new Map<string, Promise<IHasher>>();

async function newHasher(): Promise<IHasher> {
  const hasher = await createSHA256();
  hasher.init();
  return hasher;
}

async function readInto(
  file: File,
  upTo: number,
  update: (chunk: Uint8Array) => void,
) {
  const reader = file.slice(0, upTo).stream().getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    update(value);
  }
}

self.onmessage = async (event: MessageEvent<Message>) => {
  const message = event.data;
  try {
    switch (message.type) {
      case "stream-start":
        streams.set(message.sid, newHasher());
        return;
      case "stream-update":
        // Awaiting the same promise keeps the updates in arrival order.
        (await streams.get(message.sid))?.update(message.data);
        return;
      case "stream-digest": {
        const hasher = await streams.get(message.sid);
        streams.delete(message.sid);
        self.postMessage({ key: message.key, hex: hasher?.digest("hex") });
        return;
      }
      case "stream-drop":
        streams.delete(message.sid);
        return;
      case "file-hex": {
        const hasher = await newHasher();
        await readInto(message.file, message.upTo, (c) => hasher.update(c));
        self.postMessage({ key: message.key, hex: hasher.digest("hex") });
        return;
      }
      case "state": {
        const hasher = new Sha256();
        await readInto(message.file, message.upTo, (c) => hasher.update(c));
        self.postMessage({ key: message.key, state: hasher.save() });
        return;
      }
    }
  } catch (error) {
    if ("key" in message)
      self.postMessage({ key: message.key, error: (error as Error).message });
  }
};
