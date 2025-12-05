import { BaseMoveableGameEntity } from "../../core/entities/base-moveable-game-entity.js";

interface Snowflake {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export class SnowEntity extends BaseMoveableGameEntity {
  private snowflakes: Snowflake[] = [];
  private elapsed = 0;
  private spawnElapsed = 0;
  private readonly DURATION = 30000; // 30 seconds
  private readonly SPAWN_RATE = 40; // snowflakes per second
  private readonly MAX_SNOWFLAKES = 200;
  private readonly OVERLAY_FADE_IN_DURATION = 5000; // 5 seconds for overlay to appear

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    // Don't create initial burst - let snow appear gradually
  }

  private createSnowflake(initialY?: number): void {
    if (this.snowflakes.length >= this.MAX_SNOWFLAKES) {
      return;
    }

    this.snowflakes.push({
      x: Math.random() * this.canvas.width,
      y: initialY ?? -10,
      vx: (Math.random() - 0.5) * 0.5, // Slight horizontal drift
      vy: 0.5 + Math.random() * 1, // Gentle fall speed
      size: 2 + Math.random() * 3,
      opacity: 0.6 + Math.random() * 0.4,
    });
  }

  public override update(delta: DOMHighResTimeStamp): void {
    this.elapsed += delta;

    if (this.elapsed < this.DURATION) {
      this.spawnElapsed += delta;
      const toSpawn = Math.floor((this.spawnElapsed / 1000) * this.SPAWN_RATE);
      if (toSpawn > 0) {
        this.spawnElapsed -= (toSpawn / this.SPAWN_RATE) * 1000;
        for (let i = 0; i < toSpawn; i++) {
          this.createSnowflake();
        }
      }
    }

    // Update snowflakes
    this.snowflakes.forEach((flake) => {
      flake.x += flake.vx;
      flake.y += flake.vy;

      // Add slight horizontal drift
      flake.vx += (Math.random() - 0.5) * 0.02;
      flake.vx = Math.max(-1, Math.min(1, flake.vx));
    });

    // Remove snowflakes that have fallen off screen
    this.snowflakes = this.snowflakes.filter(
      (flake) => flake.y < this.canvas.height + 10
    );

    // Remove entity when duration is over and all snowflakes are gone
    if (this.elapsed >= this.DURATION && this.snowflakes.length === 0) {
      this.setRemoved(true);
    }
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();

    // Render bluish field overlay
    this.renderFieldOverlay(context);

    // Render snowflakes
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
    // Calculate overlay opacity based on elapsed time
    const overlayProgress = Math.min(
      this.elapsed / this.OVERLAY_FADE_IN_DURATION,
      1
    );
    const overlayOpacity = overlayProgress * 0.15; // Max 15% opacity for subtle bluish tint

    if (overlayOpacity <= 0) {
      return;
    }

    context.fillStyle = `rgba(173, 216, 255, ${overlayOpacity})`;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public isActive(): boolean {
    return this.elapsed < this.DURATION;
  }
}
