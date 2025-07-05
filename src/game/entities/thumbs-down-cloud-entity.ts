import { BaseMoveableGameEntity } from "../../core/entities/base-moveable-game-entity.js";

interface EmojiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  size: number;
  life: number;
}

export class ThumbsDownCloudEntity extends BaseMoveableGameEntity {
  private particles: EmojiParticle[] = [];
  private elapsed = 0;
  private readonly duration = 4000; // ms, extended so players notice the effect

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.createParticles();
  }

  private createParticles(): void {
    const count = 30;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        angle: Math.random() * Math.PI * 2,
        size: 24 + Math.random() * 12,
        life: 1,
      });
    }
  }

  public override update(delta: DOMHighResTimeStamp): void {
    this.elapsed += delta;
    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.angle += 0.05;
      p.life -= delta / this.duration;
    });
    this.particles = this.particles.filter((p) => p.life > 0);

    if (this.elapsed >= this.duration && this.particles.length === 0) {
      this.setRemoved(true);
    }
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();
    context.textAlign = "center";
    context.textBaseline = "middle";
    this.particles.forEach((p) => {
      context.save();
      context.translate(p.x, p.y);
      context.rotate(p.angle);
      context.globalAlpha = Math.max(p.life, 0);
      context.font = `${p.size}px system-ui`;
      context.fillText("\uD83D\uDC4E", 0, 0); // thumbs down emoji
      context.restore();
    });
    context.restore();
  }
}
