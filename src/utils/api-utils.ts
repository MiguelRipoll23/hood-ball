import {
  API_HOSTNAME,
  API_PATH,
  API_VERSION,
} from "../constants/api-constants.js";
import { ErrorResponse } from "../interfaces/response/error-response.js";

export class APIUtils {
  public static getBaseURL(): string {
    const protocol = API_HOSTNAME.match("localhost") ? "http:" : "https:";

    return protocol + "//" + API_HOSTNAME + API_PATH + API_VERSION;
  }

  public static getWSBaseURL(): string {
    return this.getBaseURL().replace("http", "ws");
  }

  public static async throwAPIError(response: Response): Promise<void> {
    const errorResponse: ErrorResponse = await response.json();

    throw new Error(errorResponse.message);
  }
}
