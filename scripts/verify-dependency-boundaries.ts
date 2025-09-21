import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import madge from "madge";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(currentDirectory, "..");
const engineDirectory = path.join(repositoryRoot, "src", "engine");
const gameDirectory = path.join(repositoryRoot, "src", "game");

async function main(): Promise<void> {
  const dependencyGraph = await madge(engineDirectory, {
    baseDir: engineDirectory,
    fileExtensions: ["ts"],
    tsConfig: path.join(repositoryRoot, "tsconfig.json"),
    includeNpm: false,
  });

  const graphEntries = dependencyGraph.obj();
  const violations: Array<{ source: string; targets: string[] }> = [];

  for (const [node, dependencies] of Object.entries(graphEntries)) {
    const absoluteNodePath = path.resolve(engineDirectory, node);

    if (!absoluteNodePath.startsWith(engineDirectory)) {
      continue;
    }

    const offendingDependencies = dependencies
      .map((dependency) => path.resolve(engineDirectory, dependency))
      .filter((dependencyPath) => dependencyPath.startsWith(gameDirectory));

    if (offendingDependencies.length === 0) {
      continue;
    }

    violations.push({
      source: path.relative(repositoryRoot, absoluteNodePath),
      targets: offendingDependencies.map((dependencyPath) =>
        path.relative(repositoryRoot, dependencyPath)
      ),
    });
  }

  if (violations.length > 0) {
    console.error("Engine modules must not depend on game modules:");

    for (const violation of violations) {
      console.error(`- ${violation.source}`);

      for (const target of violation.targets) {
        console.error(`  -> ${target}`);
      }
    }

    process.exitCode = 1;
    return;
  }

  console.log("Dependency boundary check passed: src/engine imports stay isolated from src/game.");
}

await main();
