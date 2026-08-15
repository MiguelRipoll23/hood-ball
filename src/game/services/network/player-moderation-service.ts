import { injectable, inject } from "@needle-di/core";
import { APIService } from "./api-service.js";
import {
  USER_MODERATION_MANUAL_REPORT_ENDPOINT,
  USER_MODERATION_AUTOMATIC_REPORT_ENDPOINT,
  USER_MODERATION_BAN_ENDPOINT,
} from "../../constants/api-constants.js";
import type { ReportUserRequest } from "../../interfaces/requests/report-user-request-interface.js";
import type { AutomaticReportRequest } from "../../interfaces/requests/automatic-report-request-interface.js";
import type { BanUserRequest } from "../../interfaces/requests/ban-user-request-interface.js";
import { APIUtils } from "../../utils/api-utils.js";
import { UUIDUtils } from "../../utils/uuid-utils.js";

@injectable()
export class PlayerModerationService {
  private baseURL: string;

  constructor(private readonly apiService: APIService = inject(APIService)) {
    this.baseURL = APIUtils.getBaseURL();
  }

  public async reportUser(
    userId: string,
    reason: string,
  ): Promise<void> {
    // The moderation API expects a canonical UUID (36 chars with dashes).
    // Network IDs are stored without dashes, so normalize before sending.
    const reportRequest: ReportUserRequest = {
      userId: UUIDUtils.format(userId),
      reason,
    };

    const response = await this.apiService.fetchWithAuthentication(
      this.baseURL + USER_MODERATION_MANUAL_REPORT_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportRequest),
      }
    );

    if (!response.ok) {
      await APIUtils.throwAPIError(response);
    }
  }

  public async reportAutomaticViolation(
    userId: string,
    ruleId: number,
  ): Promise<void> {
    // The moderation API expects a canonical UUID (36 chars with dashes).
    // Network IDs are stored without dashes, so normalize before sending.
    const reportRequest: AutomaticReportRequest = {
      userId: UUIDUtils.format(userId),
      ruleId,
    };

    const response = await this.apiService.fetchWithAuthentication(
      this.baseURL + USER_MODERATION_AUTOMATIC_REPORT_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportRequest),
      }
    );

    if (!response.ok) {
      await APIUtils.throwAPIError(response);
    }
  }

  public async banUser(
    userId: string,
    reason: string,
    duration?: { value: number; unit: string }
  ): Promise<void> {
    // The moderation API expects a canonical UUID (36 chars with dashes).
    // Network IDs are stored without dashes, so normalize before sending.
    const banRequest: BanUserRequest = {
      userId: UUIDUtils.format(userId),
      reason,
      duration,
    };

    const response = await this.apiService.fetchWithAuthentication(
      this.baseURL + USER_MODERATION_BAN_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(banRequest),
      }
    );

    if (!response.ok) {
      await APIUtils.throwAPIError(response);
    }
  }
}
