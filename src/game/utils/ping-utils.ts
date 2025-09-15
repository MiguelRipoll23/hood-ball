export function getPingTextColor(ping: number): number {
  if (ping > 400) return 0xff0000ff;
  if (ping > 200) return 0xff00ffff;
  return 0xff00ff00;
}
