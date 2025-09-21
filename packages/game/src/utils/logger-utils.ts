export class LoggerUtils {
  private category: string;

  constructor(category: string) {
    this.category = category;
    this.info("Logger initialized");
  }

  public info(message: string, ...args: unknown[]): void {
    console.info(this.category, message, ...args);
  }

  public warn(message: string, ...args: unknown[]): void {
    console.warn(this.category, message, ...args);
  }

  public debug(message: string, ...args: unknown[]): void {
    console.debug(this.category, message, ...args);
  }

  public error(message: string, ...args: unknown[]): void {
    console.error(this.category, message, ...args);
  }
}
