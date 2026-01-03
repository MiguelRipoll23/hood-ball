export interface BanUserRequest {
  userId: string;
  reason: string;
  duration?: {
    value: number;
    unit: string;
  };
}
