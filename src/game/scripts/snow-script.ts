import type { ScriptLifecycle } from "../../engine/components/script-component.js";

interface Snowflake {
  x: number; y: number; vx: number; vy: number; size: number; opacity: number;
}

export class SnowScript implements ScriptLifecycle {
  private static readonly OVERLAY_COLOR_RGB = "173, 216, 255";

  private snowflakes: Snowflake[] = [];
  private elapsed = 0;
  private spawnElapsed = 0;
  private readonly DURATION = 30000;
  private readonly SPAWN_RATE = 40;
  private readonly MAX_SNOWFLAKES = 200;
  private readonly OVERLAY_FADE_IN_DURATION = 5000;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.createInitialSnowflakes();
  }

  private createInitialSnowflakes(): void {
    const initialCount = Math.floor(this.MAX_SNOWFLAKES * 0.5);
    for (let i = 0; i < initialCount; i++) {
      this.createSnowflake(Math.random() * this.canvas.height);
    }
  }

  private createSnowflake(initialY?: number): void {
    if (this.snowflakes.length >= this.MAX_SNOWFLAKES) return;
    this.snowflakes.push({
      x: Math.random() * this.canvas.width,
      y: initialY ?? -10,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0.5 + Math.random() * 1,
      size: 2 + Math.random() * 3,
      opacity: 0.6 + Math.random() * 0.4,
    });
  }

  isActive(): boolean { return this.elapsed < this.DURATION; }

  update(delta: DOMHighResTimeStamp): void {
    this.elapsed += delta;

    if (this.elapsed < this.DURATION) {
      this.spawnElapsed += delta;
      const toSpawn = Math.floor((this.spawnElapsed / 1000) * this.SPAWN_RATE);
      if (toSpawn > 0) {
        this.spawnElapsed -= (toSpawn / this.SPAWN_RATE) * 1000;
        for (let i = 0; i < toSpawn; i++) this.createSnowflake();
      }
    }

    this.snowflakes.forEach((flake) => {
      flake.x += flake.vx;
      flake.y += flake.vy;
      flake.vx += (Math.random() - 0.5) * 0.02;
      flake.vx = Math.max(-1, Math.min(1, flake.vx));
    });

    for (let i = this.snowflakes.length - 1; i >= 0; i--) {
      if (this.snowflakes[i].y >= this.canvas.height + 10) {
        this.snowflakes.splice(i, 1);
      }
    }
  }

  isFinished(): boolean {
    return this.elapsed >= this.DURATION && this.snowflakes.length === 0;
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    this.renderFieldOverlay(context);
    this.snowflakes.forEach((flake) => {
      context.fillStyle = "white";
      context.globalAlpha = flake.opacity;
      context.beginPath();
      context.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  }

  private renderFieldOverlay(context: CanvasRenderingContext2D): void {
    const overlayProgress = Math.min(this.elapsed / this.OVERLAY_FADE_IN_DURATION, 1);
    const overlayOpacity = overlayProgress * 0.15;
    if (overlayOpacity <= 0) return;
    context.fillStyle = `rgba(${SnowScript.OVERLAY_COLOR_RGB}, ${overlayOpacity})`;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
