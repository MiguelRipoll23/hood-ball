import { ErrorResponse } from "../interfaces/response/error-response.js";

export class APIUtils {
  public static async throwAPIError(response: Response): Promise<void> {
    const errorResponse: ErrorResponse = await response.json();

    throw new Error(errorResponse.message);
  }
}
