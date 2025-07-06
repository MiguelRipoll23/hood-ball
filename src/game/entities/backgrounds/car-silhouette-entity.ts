import { BaseGameEntity } from "../../../core/entities/base-game-entity.js";
import { container } from "../../../core/services/di-container.js";
import { SceneTransitionService } from "../../../core/services/gameplay/scene-transition-service.js";

interface Car {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
}

export class CarSilhouetteEntity extends BaseGameEntity {
  private cars: Car[] = [];
  private readonly carCount = 4;
  private carImage: HTMLImageElement | null = null;
  private readonly IMAGE_PATH = "./images/car-silhouette.png";
  private readonly BASE_SPEED = 0.07;
  private readonly SIZE = 60;
  private readonly TRANSITION_SPEED_MULTIPLIER = 2;
  private currentMultiplier = 1;
  private readonly transitionService: SceneTransitionService;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.transitionService = container.get(SceneTransitionService);
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
      const fromLeft = i < this.carCount / 2;
      const vx = fromLeft ? this.BASE_SPEED : -this.BASE_SPEED;
      const vy = this.BASE_SPEED;
      const x = fromLeft
        ? Math.random() * (this.canvas.width / 3)
        : this.canvas.width - Math.random() * (this.canvas.width / 3);
      const y = Math.random() * (this.canvas.height / 3);
      this.cars.push({
        x,
        y,
        vx,
        vy,
        size: this.SIZE,
        angle: Math.atan2(vy, vx),
      });
    }
  }

  public override update(delta: DOMHighResTimeStamp): void {
    const targetMultiplier = this.transitionService.isTransitionActive()
      ? this.TRANSITION_SPEED_MULTIPLIER
      : 1;
    this.currentMultiplier +=
      (targetMultiplier - this.currentMultiplier) * 0.05;
    this.cars.forEach((car) => {
      car.x += car.vx * delta * this.currentMultiplier;
      car.y += car.vy * delta * this.currentMultiplier;

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
      context.rotate(car.angle);
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

