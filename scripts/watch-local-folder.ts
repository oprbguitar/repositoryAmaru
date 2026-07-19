import chokidar from "chokidar";
import { getLocalResearchDirectory, runIngestion } from "./ingest-local-folder";

let running = false;
let pending = false;

async function schedule(): Promise<void> {
  if (running) {
    pending = true;
    return;
  }
  running = true;
  try {
    await runIngestion();
  } finally {
    running = false;
    if (pending) {
      pending = false;
      await schedule();
    }
  }
}

const root = getLocalResearchDirectory();
console.log(`Vigilando ${root}. Los archivos originales nunca se modifican.`);
chokidar
  .watch(root, {
    ignoreInitial: true,
    followSymlinks: false,
    awaitWriteFinish: { stabilityThreshold: 1200, pollInterval: 100 },
  })
  .on("all", () => void schedule());
