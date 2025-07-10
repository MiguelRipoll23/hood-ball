import { BaseMoveableGameEntity } from "../../core/entities/base-moveable-game-entity.js";

interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

export class CarExplosionEntity extends BaseMoveableGameEntity {
  private particles: ExplosionParticle[] = [];
  private elapsed = 0;
  private readonly duration = 1000; // ms

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
    this.createParticles();
  }

  private createParticles(): void {
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      const fire = i < 20;
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        size: fire ? 4 + Math.random() * 2 : 6 + Math.random() * 4,
        color: fire
          ? `rgba(255,${100 + Math.random() * 155},0,1)`
          : `rgba(80,80,80,1)`,
      });
    }
  }

  public override update(delta: DOMHighResTimeStamp): void {
    this.elapsed += delta;
    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
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
      context.globalAlpha = Math.max(p.life, 0);
      context.fillStyle = p.color;
      context.beginPath();
      context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      context.fill();
    });
    context.globalAlpha = 1;
    context.restore();
  }
}
