import { injectable } from "@needle-di/core";

export type LogLevel = "log" | "info" | "warn" | "error" | "debug";

export type ConsoleLogEntry = {
  level: LogLevel;
  message: string;
};

@injectable()
export class ConsoleLogService {
  private readonly entries: ConsoleLogEntry[] = [];
  private readonly originals: Record<LogLevel, (...args: unknown[]) => void>;

  constructor() {
    this.originals = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    (Object.keys(this.originals) as LogLevel[]).forEach((level) => {
      console[level] = (...args: unknown[]) => {
        this.addEntry(level, args);
        this.originals[level](...args);
      };
    });
  }

  public getEntries(): ConsoleLogEntry[] {
    return this.entries;
  }

  public clear(): void {
    this.entries.length = 0;
  }

  private addEntry(level: LogLevel, args: unknown[]): void {
    const message = args
      .map((a) => {
        if (typeof a === "string") return a;
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(" ");

    this.entries.push({ level, message });
  }
}
