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
      const speed = 0.06 + Math.random() * 0.04;
      const size = 20 + Math.random() * 10;
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
    context.fillStyle = "rgba(0, 0, 0, 0.3)";
    this.cars.forEach((car) => {
      context.save();
      context.translate(car.x, car.y);
      context.rotate(car.direction > 0 ? Math.PI / 6 : -Math.PI / 6);
      context.fillRect(-car.size / 2, -car.size / 4, car.size, car.size / 2);
      context.restore();
    });
    context.restore();
  }
}

