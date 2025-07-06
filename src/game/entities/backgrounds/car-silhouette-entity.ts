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
  private carImage: HTMLImageElement | null = null;
  private readonly IMAGE_PATH = "./images/car-silhouette.png";

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.createCars();
  }

  public override load(): void {
    this.carImage = new Image();
    this.carImage.onload = () => {
      super.load();
    };
    this.carImage.src = this.IMAGE_PATH;
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
      if (car.direction < 0) {
        context.scale(-1, 1);
      }
      this.drawCar(context, car.size);
      context.restore();
    });
    context.restore();
  }

  private drawCar(context: CanvasRenderingContext2D, size: number): void {
    if (!this.carImage) {
      return;
    }
    context.drawImage(
      this.carImage,
      -size / 2,
      -size / 2,
      size,
      size
    );
  }
}

