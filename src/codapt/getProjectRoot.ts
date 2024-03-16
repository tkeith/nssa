import { promises as fs } from "fs";
import { join, dirname, resolve } from "path";

export async function getProjectRoot(): Promise<string> {
  let currentDir = resolve(__dirname);

  while (true) {
    try {
      await fs.access(join(currentDir, "package.json"));
      return currentDir;
    } catch {
      const parentDir = dirname(currentDir);
      if (parentDir === currentDir) {
        throw new Error("Could not find package.json in any parent directory");
      }
      currentDir = parentDir;
    }
  }
}
