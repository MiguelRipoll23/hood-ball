import {
  API_HOST as API_HOST,
  API_PATH,
  API_VERSION,
} from "../constants/api-constants.js";
import type { ErrorResponse } from "../interfaces/response/error-response.js";
import { ServerError } from "../models/server-error.js";

export class APIUtils {
  public static getBaseURL(): string {
    return API_HOST + API_PATH + API_VERSION;
  }

  public static getWSBaseURL(): string {
    return this.getBaseURL().replace("http", "ws");
  }

  public static async throwAPIError(response: Response): Promise<void> {
    const errorResponse: ErrorResponse = await response.json();

    throw new ServerError(errorResponse.code, errorResponse.message);
  }
}
