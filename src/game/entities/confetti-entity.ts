import { BaseMoveableGameEntity } from "../../engine/entities/base-moveable-game-entity.ts";

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
  private spawnElapsed = 0;
  // Keep spawning particles for five seconds so the celebration is visible
  private readonly duration = 5000; // ms
  // Increased spawn rate for denser confetti
  private readonly spawnRate = 100; // particles per second

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
  }

  private createParticle(): void {
    this.particles.push({
      x: Math.random() * this.canvas.width,
      y: Math.random() * -10,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 2 + 1,
      rotation: Math.random() * Math.PI * 2,
      size: 4 + Math.random() * 4,
      color: `hsl(${Math.random() * 360},100%,50%)`,
      life: 1,
    });
  }

  public override update(delta: DOMHighResTimeStamp): void {
    this.elapsed += delta;
    if (this.elapsed < this.duration) {
      this.spawnElapsed += delta;
      const toSpawn = Math.floor((this.spawnElapsed / 1000) * this.spawnRate);
      if (toSpawn > 0) {
        this.spawnElapsed -= (toSpawn / this.spawnRate) * 1000;
        for (let i = 0; i < toSpawn; i++) {
          this.createParticle();
        }
      }
    }

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
