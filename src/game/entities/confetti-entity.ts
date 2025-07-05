import { BaseMoveableGameEntity } from "../../core/entities/base-moveable-game-entity.js";

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  size: number;
  color: string;
  life: number;
}

export class ConfettiEntity extends BaseMoveableGameEntity {
  private particles: ConfettiParticle[] = [];
  private elapsed = 0;
  // Keep particles alive for at least three seconds so the celebration is visible
  private readonly duration = 3000; // ms

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.createParticles();
  }

  private createParticles(): void {
    const count = 200;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * -50,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * -2,
        rotation: Math.random() * Math.PI * 2,
        size: 4 + Math.random() * 4,
        color: `hsl(${Math.random() * 360},100%,50%)`,
        life: 1,
      });
    }
  }

  public override update(delta: DOMHighResTimeStamp): void {
    this.elapsed += delta;
    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.rotation += 0.1;
      p.life -= delta / this.duration;
    });
    this.particles = this.particles.filter((p) => p.life > 0);

    if (this.elapsed >= this.duration && this.particles.length === 0) {
      this.setRemoved(true);
    }
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();
    this.particles.forEach((p) => {
      context.fillStyle = p.color;
      context.save();
      context.translate(p.x, p.y);
      context.rotate(p.rotation);
      context.globalAlpha = Math.max(p.life, 0);
      context.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      context.restore();
    });
    context.restore();
  }
}
