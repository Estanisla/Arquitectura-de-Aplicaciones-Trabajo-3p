import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const excludedDirs = new Set([
  ".git",
  "node_modules",
  "database",
  "dist",
  "build",
  "coverage",
]);

const codeExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".scss",
  ".html",
]);

async function collectFiles(dir, acc = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (excludedDirs.has(entry.name)) {
        continue;
      }

      await collectFiles(fullPath, acc);
      continue;
    }

    if (entry.isFile() && codeExtensions.has(path.extname(entry.name))) {
      acc.push(fullPath);
    }
  }

  return acc;
}

function countLines(content) {
  if (!content) {
    return 0;
  }

  return content.split(/\r?\n/).length;
}

function getArea(filePath) {
  const relativePath = path.relative(repoRoot, filePath);
  const [area] = relativePath.split(path.sep);
  return area || "(root)";
}

async function main() {
  const files = await collectFiles(repoRoot);
  let totalLines = 0;
  const byArea = new Map();

  for (const filePath of files) {
    const content = await fs.readFile(filePath, "utf8");
    const lines = countLines(content);
    totalLines += lines;

    const area = getArea(filePath);
    byArea.set(area, (byArea.get(area) ?? 0) + lines);
  }

  const orderedAreas = [...byArea.entries()].sort((a, b) => b[1] - a[1]);

  console.log("LOC (sin carpeta database)");
  console.log(`Archivos contabilizados: ${files.length}`);
  console.log(`Lineas totales: ${totalLines}`);
  console.log("");

  for (const [area, lines] of orderedAreas) {
    console.log(`${area}: ${lines}`);
  }
}

main().catch((error) => {
  console.error("Error al contar lineas:", error.message);
  process.exit(1);
});
