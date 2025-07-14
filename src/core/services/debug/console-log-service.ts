import { injectable } from "@needle-di/core";

export type LogLevel = "log" | "info" | "warn" | "error" | "debug";

export type ConsoleLogEntry = {
  level: LogLevel;
  message: string;
  timestamp: Date;
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
    const message = this.formatArgs(args);

    this.entries.push({ level, message, timestamp: new Date() });
  }

  private formatArgs(args: unknown[]): string {
    if (args.length === 0) return "";

    // Handle style arguments like console.log('%c text', 'color:red');
    if (typeof args[0] === "string" && args[0].includes("%c")) {
      const format = args[0] as string;
      const styleCount = (format.match(/%c/g) || []).length;
      args = [format.replace(/%c/g, ""), ...args.slice(styleCount + 1)];
    }

    const seen = new WeakSet<object>();
    const stringify = (value: unknown): string => {
      if (typeof value === "string") return value;
      try {
        return JSON.stringify(
          value,
          (_: string, val) => {
            if (typeof val === "object" && val !== null) {
              if (seen.has(val)) return "[Circular]";
              seen.add(val);
            }
            return val;
          },
          2
        );
      } catch {
        return String(value);
      }
    };

    return args.map(stringify).join(" ");
  }
}
