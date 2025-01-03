export class WebRTCUtils {
  public static addHyphensToUUID(uuid: string): string {
    if (uuid.length !== 32) {
      throw new Error("Invalid UUID format. Expected a 32-character string.");
    }

    return `${uuid.substring(0, 8)}-${uuid.substring(8, 12)}-${uuid.substring(
      12,
      16
    )}-${uuid.substring(16, 20)}-${uuid.substring(20)}`;
  }

  public static removeHyphensFromUUID(uuid: string): string {
    return uuid.replace(/-/g, "");
  }
}
