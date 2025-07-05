import { BaseMoveableGameEntity } from "../../core/entities/base-moveable-game-entity.js";

interface EmojiParticle {
  angle: number; // current angle around the center point
  radius: number; // orbit radius
  angularVelocity: number; // angular speed
  size: number;
  life: number;
}

export class ThumbsDownCloudEntity extends BaseMoveableGameEntity {
  private particles: EmojiParticle[] = [];
  private elapsed = 0;
  private readonly duration = 4000; // ms, extended so players notice the effect
  private readonly centerX: number;
  private readonly centerY: number;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
    this.createParticles();
  }

  private createParticles(): void {
    const count = 30;
    const maxRadius = Math.min(this.canvas.width, this.canvas.height) / 3;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 40 + Math.random() * maxRadius,
        angularVelocity: (Math.random() - 0.5) * 0.03 + 0.05,
        size: 24 + Math.random() * 12,
        life: 1,
      });
    }
  }

  public override update(delta: DOMHighResTimeStamp): void {
    this.elapsed += delta;
    this.particles.forEach((p) => {
      p.angle += p.angularVelocity;
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
      const x = this.centerX + Math.cos(p.angle) * p.radius;
      const y = this.centerY + Math.sin(p.angle) * p.radius;
      context.save();
      context.translate(x, y);
      context.globalAlpha = Math.max(p.life, 0);
      context.font = `${p.size}px system-ui`;
      context.fillText("\uD83D\uDC4E", 0, 0); // thumbs down emoji
      context.restore();
    });
    context.restore();
  }
}
