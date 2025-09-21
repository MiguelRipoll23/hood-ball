import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const engineDir = resolve(rootDir, "packages/engine");

async function run(command: string, args: string[], options: { cwd?: string } = {}): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });

    child.on("error", (error) => {
      rejectPromise(error);
    });
  });
}

async function ensureEngineBuild(): Promise<void> {
  await run("npm", ["run", "build"], { cwd: engineDir });
}

async function createEngineTarball(packDirectory: string): Promise<string> {
  await run("npm", ["pack", "--pack-destination", packDirectory], { cwd: engineDir });

  const entries = await readdir(packDirectory);
  const archive = entries.find((entry) => entry.endsWith(".tgz"));

  if (!archive) {
    throw new Error("npm pack did not produce a tarball");
  }

  return join(packDirectory, archive);
}

async function writeSmokeProject(tarballPath: string): Promise<string> {
  const projectDir = await mkdtemp(join(tmpdir(), "hood-ball-engine-smoke-"));

  await run("npm", ["init", "-y"], { cwd: projectDir });
  await run("npm", ["install", tarballPath, "typescript@5.9.2", "tsx@4.16.0", "@types/node@20.17.9"], {
    cwd: projectDir,
  });

  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      moduleDetection: "force",
      skipLibCheck: true,
      strict: true,
      esModuleInterop: true,
      lib: ["ES2022", "DOM"],
      types: ["node"],
      outDir: "dist",
    },
    include: ["src/**/*"],
  } satisfies Record<string, unknown>;

  await writeFile(join(projectDir, "tsconfig.json"), JSON.stringify(tsconfig, null, 2));
  await mkdir(join(projectDir, "src"));

  const sample = `import { performance } from \"node:perf_hooks\";
import { createEngineContainer, EngineLoopService } from \"@hood-ball/engine\";

const noop = () => undefined;

(globalThis as { window?: Window }).window = {
  addEventListener: noop,
  removeEventListener: noop,
  setTimeout,
  clearTimeout,
} as unknown as Window;

(globalThis.requestAnimationFrame as unknown) = (callback: FrameRequestCallback) => {
  const id = setTimeout(() => callback(performance.now()), 16) as unknown as number;
  return id;
};

(globalThis.cancelAnimationFrame as unknown) = (handle: number) => {
  clearTimeout(handle as unknown as NodeJS.Timeout);
};

const context = {
  clearRect: noop,
  beginPath: noop,
  arc: noop,
  closePath: noop,
  fill: noop,
  save: noop,
  restore: noop,
} as unknown as CanvasRenderingContext2D;

const canvas = {
  width: 800,
  height: 600,
  style: {},
  getContext: () => context,
  addEventListener: noop,
  removeEventListener: noop,
} as unknown as HTMLCanvasElement;

const container = createEngineContainer();
const engineLoop = container.get(EngineLoopService);

engineLoop.configure({
  canvas,
  context,
  onResize: () => {
    /* no-op */
  },
  callbacks: {
    update: () => {
      /* no-op */
    },
    render: () => {
      /* no-op */
    },
  },
});

engineLoop.start();
engineLoop.stop();
`;

  await writeFile(join(projectDir, "src", "index.ts"), sample);

  return projectDir;
}

async function runSmokeProject(projectDir: string): Promise<void> {
  await run("npx", ["tsc", "--noEmit"], { cwd: projectDir });
  await run("npx", ["tsx", "src/index.ts"], { cwd: projectDir });
}

async function cleanup(paths: string[]): Promise<void> {
  await Promise.all(
    paths
      .filter(Boolean)
      .map(async (path) => {
        await rm(path, { force: true, recursive: true });
      }),
  );
}

async function main(): Promise<void> {
  await ensureEngineBuild();

  const tarballDir = await mkdtemp(join(tmpdir(), "hood-ball-engine-pack-"));
  let smokeDir: string | undefined;

  try {
    const tarball = await createEngineTarball(tarballDir);
    smokeDir = await writeSmokeProject(tarball);
    await runSmokeProject(smokeDir);
  } finally {
    await cleanup([tarballDir, smokeDir ?? ""]);
  }

  console.log("Engine package smoke test completed successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
