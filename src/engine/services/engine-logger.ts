/**
 * EngineLogger — Globally accessible logging infrastructure for the engine.
 *
 * Follows patterns from Unity (Debug.Log) and Godot (print/Logger).
 * Provides categorized, leveled logging without any game-specific knowledge.
 *
 * Usage:
 *   EngineLogger.info("SceneManager", "Scene loaded");
 *   EngineLogger.warn("Network", "Connection timeout");
 *   EngineLogger.debug("Physics", { velocity: playerVX });
 */

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  None = 4,
}

export interface LogSink {
  write(level: LogLevel, category: string, message: string, ...args: unknown[]): void;
}

/**
 * Default console sink that writes to the browser console.
 */
class ConsoleSink implements LogSink {
  public write(level: LogLevel, category: string, message: string, ...args: unknown[]): void {
    const prefix = `[${category}]`;

    switch (level) {
      case LogLevel.Debug:
        console.debug(prefix, message, ...args);
        break;
      case LogLevel.Info:
        console.info(prefix, message, ...args);
        break;
      case LogLevel.Warn:
        console.warn(prefix, message, ...args);
        break;
      case LogLevel.Error:
        console.error(prefix, message, ...args);
        break;
    }
  }
}

export class EngineLogger {
  private static enabled = false;
  private static minimumLevel: LogLevel = LogLevel.Debug;
  private static sinks: LogSink[] = [new ConsoleSink()];
  private static categoryFilters: Map<string, LogLevel> = new Map();

  /**
   * Enable or disable all logging. When disabled, all log calls are no-ops.
   * Defaults to false; set to true via the `?debug` URL query parameter.
   */
  public static setEnabled(value: boolean): void {
    this.enabled = value;
  }

  public static isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set the minimum log level. Messages below this level are suppressed.
   */
  public static setMinimumLevel(level: LogLevel): void {
    this.minimumLevel = level;
  }

  /**
   * Set a per-category minimum log level (overrides global minimum).
   */
  public static setCategoryLevel(category: string, level: LogLevel): void {
    this.categoryFilters.set(category, level);
  }

  /**
   * Add a custom log sink (e.g., for sending logs to a server or file).
   */
  public static addSink(sink: LogSink): void {
    this.sinks.push(sink);
  }

  /**
   * Remove all sinks and reset to just the console sink.
   */
  public static resetSinks(): void {
    this.sinks = [new ConsoleSink()];
  }

  public static debug(category: string, message: string, ...args: unknown[]): void {
    this.log(LogLevel.Debug, category, message, ...args);
  }

  public static info(category: string, message: string, ...args: unknown[]): void {
    this.log(LogLevel.Info, category, message, ...args);
  }

  public static warn(category: string, message: string, ...args: unknown[]): void {
    this.log(LogLevel.Warn, category, message, ...args);
  }

  public static error(category: string, message: string, ...args: unknown[]): void {
    this.log(LogLevel.Error, category, message, ...args);
  }

  private static log(level: LogLevel, category: string, message: string, ...args: unknown[]): void {
    if (!this.enabled) {
      return;
    }

    const effectiveLevel = this.categoryFilters.get(category) ?? this.minimumLevel;

    if (level < effectiveLevel) {
      return;
    }

    for (const sink of this.sinks) {
      try {
        sink.write(level, category, message, ...args);
      } catch {
        // Silently ignore sink errors to avoid cascading failures
      }
    }
  }
}
