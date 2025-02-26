import {
  API_HOSTNAME,
  API_PATH,
  API_VERSION,
} from "../constants/api-constants.js";
import { ErrorResponse } from "../interfaces/response/error-response.js";

export class APIUtils {
  public static getBaseURL(location: Location): string {
    return location.protocol + "//" + API_HOSTNAME + API_PATH + API_VERSION;
  }

  public static getWSBaseURL(location: Location): string {
    return this.getBaseURL(location).replace("http", "ws");
  }

  public static async throwAPIError(response: Response): Promise<void> {
    const errorResponse: ErrorResponse = await response.json();

    throw new Error(errorResponse.message);
  }
}
