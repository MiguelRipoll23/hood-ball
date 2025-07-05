import { BaseMoveableGameEntity } from "../../core/entities/base-moveable-game-entity.js";
import { BLUE_TEAM_COLOR, RED_TEAM_COLOR } from "../constants/colors-constants.js";
import { TeamType } from "../enums/team-type.js";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export class GoalExplosionEntity extends BaseMoveableGameEntity {
  private particles: Particle[] = [];
  private elapsed = 0;
  private readonly duration = 2000; // ms
  private shockwaveRadius = 0;
  private distortionRadius = 0;
  private flashOpacity = 1;
  private readonly color: string;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    x: number,
    y: number,
    team: TeamType
  ) {
    super();
    this.x = x;
    this.y = y;
    this.color = team === TeamType.Blue ? BLUE_TEAM_COLOR : RED_TEAM_COLOR;
    this.createParticles();
  }

  private createParticles(): void {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
      });
    }
  }

  public override update(delta: DOMHighResTimeStamp): void {
    this.elapsed += delta;
    const t = this.elapsed / this.duration;
    this.shockwaveRadius = 120 * t;
    this.distortionRadius = 80 * t;
    this.flashOpacity = 1 - Math.min(this.elapsed / 200, 1);
    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= delta / this.duration;
    });
    this.particles = this.particles.filter((p) => p.life > 0);

    if (this.elapsed >= this.duration) {
      this.setRemoved(true);
    }
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();

    // Flash
    if (this.flashOpacity > 0) {
      context.fillStyle = `rgba(255,255,255,${this.flashOpacity})`;
      context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      context.fillStyle = this.color;
      context.globalAlpha = this.flashOpacity * 0.5;
      context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      context.globalAlpha = 1;
    }

    // Shockwave
    context.strokeStyle = this.color;
    context.lineWidth = 4 * (1 - this.elapsed / this.duration);
    context.beginPath();
    context.arc(this.x, this.y, this.shockwaveRadius, 0, Math.PI * 2);
    context.stroke();

    // Distortion ripple
    const grad = context.createRadialGradient(
      this.x,
      this.y,
      this.distortionRadius * 0.8,
      this.x,
      this.y,
      this.distortionRadius
    );
    grad.addColorStop(0, "rgba(255,255,255,0.3)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = grad;
    context.beginPath();
    context.arc(this.x, this.y, this.distortionRadius, 0, Math.PI * 2);
    context.fill();

    // Particles
    this.particles.forEach((p) => {
      context.globalAlpha = Math.max(p.life, 0);
      context.fillStyle = this.color;
      context.beginPath();
      context.arc(p.x, p.y, 3, 0, Math.PI * 2);
      context.fill();
    });
    context.globalAlpha = 1;

    context.restore();
  }
}
