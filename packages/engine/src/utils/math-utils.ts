export class MathUtils {
  public static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }
}
