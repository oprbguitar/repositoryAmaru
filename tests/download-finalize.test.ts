import { describe, expect, it } from "vitest";
import { finalizeName } from "../src/features/local-models/downloader";

/** Minimal in-memory folder that mimics the File System Access calls used. */
function fakeFolder(moveError: Error | null) {
  const files = new Map<string, Blob>();
  const handle = (name: string) => ({
    name,
    move: async (next: string) => {
      if (moveError) throw moveError;
      files.set(next, files.get(name) as Blob);
      files.delete(name);
    },
    // jsdom's Blob has no stream(); expose one through a Response body.
    getFile: async () => {
      const blob = files.get(name) as Blob;
      const text = await blob.text();
      return { stream: () => new Response(text).body };
    },
    createWritable: async () => {
      const chunks: BlobPart[] = [];
      return new WritableStream<BlobPart>({
        write: (chunk) => {
          chunks.push(chunk);
        },
        close: () => {
          files.set(name, new Blob(chunks));
        },
      });
    },
  });
  const parent = {
    getFileHandle: async (name: string) => handle(name),
    removeEntry: async (name: string) => {
      files.delete(name);
    },
  };
  return { files, parent, handle };
}

describe("finalizeName", () => {
  it("falls back to copy when move() is not allowed", async () => {
    const denied = new DOMException(
      "The request is not allowed by the user agent or the platform in the current context.",
      "NotAllowedError",
    );
    const { files, parent, handle } = fakeFolder(denied);
    files.set("model.gguf.partial", new Blob(["weights"]));
    await finalizeName(
      parent as unknown as FileSystemDirectoryHandle,
      handle("model.gguf.partial") as unknown as FileSystemFileHandle,
      "model.gguf",
    );
    expect(files.has("model.gguf.partial")).toBe(false);
    expect(await files.get("model.gguf")?.text()).toBe("weights");
  });

  it("uses move() when the browser allows it", async () => {
    const { files, parent, handle } = fakeFolder(null);
    files.set("a.partial", new Blob(["x"]));
    await finalizeName(
      parent as unknown as FileSystemDirectoryHandle,
      handle("a.partial") as unknown as FileSystemFileHandle,
      "a",
    );
    expect([...files.keys()]).toEqual(["a"]);
  });
});
