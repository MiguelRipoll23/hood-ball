import { injectable } from "@needle-di/core";
import { USER_MODERATION_REPORT_ENDPOINT } from "../../constants/api-constants.js";
import type { ReportUserRequest } from "../../interfaces/requests/report-user-request-interface.js";
import { APIUtils } from "../../utils/api-utils.js";

@injectable()
export class PlayerModerationService {
  private baseURL: string;

  constructor() {
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

    const response = await fetch(this.baseURL + USER_MODERATION_REPORT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reportRequest),
    });

    if (!response.ok) {
      await APIUtils.throwAPIError(response);
    }

    console.log(`User ${userId} reported for: ${reason}`);
  }
}
