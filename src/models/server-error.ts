export class ServerError extends Error {
  public code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ServerError";
    this.code = code;

    // Set the prototype explicitly to support instanceof checks
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}
