import { BaseGameEntity } from "../../../core/entities/base-game-entity.js";

interface Car {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  direction: number;
}

export class CarSilhouetteEntity extends BaseGameEntity {
  private cars: Car[] = [];
  private readonly carCount = 8;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.createCars();
  }

  private createCars(): void {
    for (let i = 0; i < this.carCount; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      const speed = 0.05 + Math.random() * 0.03;
      const size = 30 + Math.random() * 15;
      this.cars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: speed * dir,
        vy: speed * dir,
        size,
        direction: dir,
      });
    }
  }

  public override update(delta: DOMHighResTimeStamp): void {
    this.cars.forEach((car) => {
      car.x += car.vx * delta;
      car.y += car.vy * delta;

      if (car.x > this.canvas.width + car.size) {
        car.x = -car.size;
      } else if (car.x < -car.size) {
        car.x = this.canvas.width + car.size;
      }

      if (car.y > this.canvas.height + car.size) {
        car.y = -car.size;
      } else if (car.y < -car.size) {
        car.y = this.canvas.height + car.size;
      }
    });
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();
    this.cars.forEach((car) => {
      context.save();
      context.translate(car.x, car.y);
      const angle = car.direction > 0 ? Math.PI / 4 : -Math.PI / 4;
      context.rotate(angle);
      this.drawCar(context, car.size);
      context.restore();
    });
    context.restore();
  }

  private drawCar(context: CanvasRenderingContext2D, size: number): void {
    const bodyHeight = size * 0.3;
    const roofHeight = size * 0.2;
    const wheelRadius = size * 0.15;

    const gradient = context.createLinearGradient(
      0,
      -roofHeight,
      0,
      bodyHeight + wheelRadius
    );
    gradient.addColorStop(0, "rgba(0,0,0,0.55)");
    gradient.addColorStop(1, "rgba(0,0,0,0.2)");

    // car body
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(-size / 2, bodyHeight);
    context.lineTo(-size / 4, -roofHeight);
    context.lineTo(size / 4, -roofHeight);
    context.lineTo(size / 2, bodyHeight);
    context.closePath();
    context.fill();

    // wheels
    context.fillStyle = "rgba(0,0,0,0.35)";
    context.beginPath();
    context.arc(-size * 0.3, bodyHeight + wheelRadius, wheelRadius, 0, Math.PI * 2);
    context.arc(size * 0.3, bodyHeight + wheelRadius, wheelRadius, 0, Math.PI * 2);
    context.fill();
  }
}

