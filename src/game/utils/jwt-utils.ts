export function decodeJWTPayload(token: string): any {
  if (!token) throw new Error("Empty token");

  const parts = token.split(".");
  const payload = parts[1];
  if (!payload) throw new Error("Invalid JWT token");

  // Normalize Base64URL to Base64
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const normalized = base64 + (pad ? "=".repeat(4 - pad) : "");

  let decodedStr: string;
  if (typeof atob === "function") {
    decodedStr = atob(normalized);
  } else {
    const Buf = (globalThis as any).Buffer;
    if (typeof Buf !== "undefined" && typeof Buf.from === "function") {
      decodedStr = Buf.from(normalized, "base64").toString("utf8");
    } else {
      throw new Error("No base64 decoder available to decode JWT payload");
    }
  }

  return JSON.parse(decodedStr);
}

export function hasRoleFromToken(token: string, role: string): boolean {
  const decoded = decodeJWTPayload(token);
  if (decoded && Array.isArray(decoded.roles)) {
    return decoded.roles.includes(role);
  }
  return false;
}
