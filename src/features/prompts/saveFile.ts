/**
 * Saves text where the visitor chooses. Chrome/Edge open the native "Save as"
 * dialog (the person picks folder and name); other browsers fall back to a
 * regular download into their default folder.
 */
type SavePicker = (options: {
  suggestedName: string;
  types: Array<{ description: string; accept: Record<string, string[]> }>;
}) => Promise<{
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}>;

export type SaveResult = "picked" | "downloaded" | "cancelled";

export async function saveTextFile(
  fileName: string,
  text: string,
  mime = "text/markdown",
): Promise<SaveResult> {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const picker = (window as unknown as { showSaveFilePicker?: SavePicker })
    .showSaveFilePicker;
  if (picker) {
    try {
      const handle = await picker({
        suggestedName: fileName,
        types: [
          { description: "Documento Markdown", accept: { [mime]: [".md"] } },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return "picked";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError")
        return "cancelled";
      // Any other failure (permissions, iframe) falls back to a download.
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}

export function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "prompt"
  );
}
