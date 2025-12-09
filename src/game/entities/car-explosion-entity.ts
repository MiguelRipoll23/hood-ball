import { BaseMoveableGameEntity } from "../../engine/entities/base-moveable-game-entity.ts";

interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

interface DebrisParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  life: number;
  size: number;
}

export class CarExplosionEntity extends BaseMoveableGameEntity {
  private particles: ExplosionParticle[] = [];
  private debris: DebrisParticle[] = [];
  private elapsed = 0;
  private readonly duration = 1200; // ms
  private shockwaveRadius = 0;
  private shockwaveOpacity = 1;
  private readonly shockwaveMaxRadius = 60;

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
    this.createParticles();
    this.createDebris();
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

  private createDebris(): void {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 1.5;
      this.debris.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        life: 1,
        size: 6 + Math.random() * 6,
      });
    }
  }

  public override update(delta: DOMHighResTimeStamp): void {
    this.elapsed += delta;
    const t = Math.min(this.elapsed / this.duration, 1);
    this.shockwaveRadius = this.shockwaveMaxRadius * t;
    this.shockwaveOpacity = 1 - t;

    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= delta / this.duration;
    });
    this.particles = this.particles.filter((p) => p.life > 0);

    this.debris.forEach((d) => {
      d.x += d.vx;
      d.y += d.vy;
      d.vx *= 0.97;
      d.vy *= 0.97;
      d.angle += d.spin;
      d.life -= delta / this.duration;
    });
    this.debris = this.debris.filter((d) => d.life > 0);

    if (
      this.elapsed >= this.duration &&
      this.particles.length === 0 &&
      this.debris.length === 0
    ) {
      this.setRemoved(true);
    }
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();

    if (this.shockwaveOpacity > 0) {
      context.strokeStyle = `rgba(255,255,255,${this.shockwaveOpacity})`;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(this.x, this.y, this.shockwaveRadius, 0, Math.PI * 2);
      context.stroke();
    }

    this.particles.forEach((p) => {
      context.globalAlpha = Math.max(p.life, 0);
      context.fillStyle = p.color;
      context.beginPath();
      context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      context.fill();
    });

    this.debris.forEach((d) => {
      context.save();
      context.translate(d.x, d.y);
      context.rotate(d.angle);
      context.globalAlpha = Math.max(d.life, 0);
      context.fillStyle = "#888";
      context.fillRect(-d.size / 2, -d.size / 4, d.size, d.size / 2);
      context.restore();
    });

    context.globalAlpha = 1;
    context.restore();
  }
}
