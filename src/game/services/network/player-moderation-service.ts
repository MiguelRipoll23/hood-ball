import { injectable, inject } from "@needle-di/core";
import { APIService } from "./api-service.js";
import {
  USER_MODERATION_REPORT_ENDPOINT,
  USER_MODERATION_BAN_ENDPOINT,
} from "../../constants/api-constants.js";
import type { ReportUserRequest } from "../../interfaces/requests/report-user-request-interface.js";
import type { BanUserRequest } from "../../interfaces/requests/ban-user-request-interface.js";
import { APIUtils } from "../../utils/api-utils.js";

@injectable()
export class PlayerModerationService {
  private baseURL: string;

  constructor(private readonly apiService: APIService = inject(APIService)) {
    this.baseURL = APIUtils.getBaseURL();
  }

  public async reportUser(
    userId: string,
    reason: string,
    automatic: boolean = false
  ): Promise<void> {
    const reportRequest: ReportUserRequest = {
      userId,
      reason,
      automatic,
    };

    const authToken = this.apiService.getAuthenticationToken();

    if (!authToken) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(
      this.baseURL + USER_MODERATION_REPORT_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
        body: JSON.stringify(reportRequest),
      }
    );

    if (!response.ok) {
      await APIUtils.throwAPIError(response);
    }

    console.log(`User ${userId} reported for: ${reason}`);
  }

  public async banUser(
    userId: string,
    reason: string,
    duration?: { value: number; unit: string }
  ): Promise<void> {
    const banRequest: BanUserRequest = {
      userId,
      reason,
      duration,
    };

    const authToken = this.apiService.getAuthenticationToken();

    if (!authToken) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(this.baseURL + USER_MODERATION_BAN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify(banRequest),
    });

    if (!response.ok) {
      await APIUtils.throwAPIError(response);
    }

    console.log(`User ${userId} banned for: ${reason}`);
  }
}
