import { HitboxObject } from "./common/hitbox-object.js";
import { BaseDynamicCollidableGameObject } from "./base/base-collidable-dynamic-game-object.js";
import { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import { GamePlayer } from "../models/game-player.js";
import {
  BLUE_TEAM_TRANSPARENCY_COLOR,
  RED_TEAM_TRANSPARENCY_COLOR,
} from "../constants/colors-constants.js";
import {
  SCALE_FACTOR_FOR_ANGLES,
  SCALE_FACTOR_FOR_SPEED,
} from "../constants/webrtc-constants.js";
import { DebugUtils } from "../utils/debug-utils.js";

export class CarObject extends BaseDynamicCollidableGameObject {
  protected readonly TOP_SPEED: number = 0.3;
  protected readonly ACCELERATION: number = 0.002;
  protected readonly HANDLING: number = 0.005;

  private readonly IMAGE_BLUE_PATH = "./images/car-blue.png";
  private readonly IMAGE_RED_PATH = "./images/car-red.png";

  private readonly MASS: number = 500;
  private readonly DISTANCE_CENTER: number = 220;
  private readonly FRICTION: number = 0.001;

  private readonly PLAYER_NAME_PADDING = 10;
  private readonly PLAYER_NAME_RECT_HEIGHT = 24;
  private readonly PLAYER_NAME_RADIUS = 10;

  private readonly PING_CIRCLE_RADIUS = 3;
  private readonly PING_CIRCLE_SPACING = 4;
  private readonly PING_ACTIVE_COLOR = "#C6FF00";
  private readonly PING_INACTIVE_COLOR = "#FF0000";

  protected width: number = 50;
  protected height: number = 50;
  protected canvas: HTMLCanvasElement | null = null;
  protected speed: number = 0;

  private carImage: HTMLImageElement | null = null;
  private imagePath = this.IMAGE_BLUE_PATH;

  constructor(x: number, y: number, angle: number, private remote = false) {
    super();
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.mass = this.MASS;

    if (remote) {
      this.imagePath = this.IMAGE_RED_PATH;
    }

    this.addCollisionExclusion(CarObject);
  }

  public override load(): void {
    this.createHitbox();
    this.loadCarImage();
  }

  public override reset(): void {
    this.angle = 1.5708;
    this.speed = 0;
    this.setCenterPosition();
    super.reset();
  }

  public override serialize(): ArrayBuffer {
    const buffer = new ArrayBuffer(8);
    const dataView = new DataView(buffer);
    const angle = Math.round(this.angle * SCALE_FACTOR_FOR_ANGLES);
    const speed = Math.round(this.speed * SCALE_FACTOR_FOR_SPEED);

    dataView.setUint16(0, this.x);
    dataView.setUint16(2, this.y);
    dataView.setInt16(4, angle);
    dataView.setInt16(6, speed);

    return buffer;
  }

  public override sendSyncableData(
    webrtcPeer: WebRTCPeer,
    data: ArrayBuffer
  ): void {
    webrtcPeer.sendUnreliableOrderedMessage(data);
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.applyFriction(deltaTimeStamp);
    this.calculateMovement(deltaTimeStamp);
    this.updateHitbox();

    super.update(deltaTimeStamp);
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();

    context.translate(this.x, this.y); // Centered position
    context.rotate(this.angle);
    context.drawImage(
      this.carImage!,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );

    context.restore();

    if (this.owner?.isHost()) {
      this.renderHostIndicator(context);
    } else {
      this.renderPingLevel(context);
    }

    this.renderPlayerName(context);

    if (this.debug) {
      this.renderDebugInformation(context);
    }

    // Hitbox debug
    super.render(context);
  }

  public getPlayer(): GamePlayer | null {
    return this.owner;
  }

  public setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
  }

  public setCenterPosition(): void {
    if (this.canvas === null) {
      throw new Error("Canvas is not set");
    }

    this.x = this.canvas.width / 2;
    this.y = this.canvas.height / 2 + this.DISTANCE_CENTER;
  }

  private createHitbox(): void {
    this.setHitboxObjects([
      new HitboxObject(
        this.x - this.width / 2,
        this.y - this.height / 2,
        this.width,
        this.height
      ),
    ]);
  }

  protected updateHitbox(): void {
    this.getHitboxObjects().forEach((object) => {
      object.setX(this.x - this.width / 2);
      object.setY(this.y - this.height / 2);
    });
  }

  private loadCarImage(): void {
    this.carImage = new Image();
    this.carImage.onload = () => {
      super.load();
    };

    this.carImage.src = this.imagePath;
  }

  private applyFriction(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.isColliding()) {
      return;
    }

    if (this.speed !== 0) {
      const friction = this.FRICTION * deltaTimeStamp; // Scale friction by deltaTime
      if (Math.abs(this.speed) <= friction) {
        this.speed = 0;
      } else {
        this.speed += -Math.sign(this.speed) * friction;
      }
    }
  }

  private calculateMovement(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.isColliding()) {
      this.speed *= -1;
    }

    // Scale velocity by deltaTime to make movement frame-rate independent
    this.vx = Math.cos(this.angle) * this.speed * deltaTimeStamp;
    this.vy = Math.sin(this.angle) * this.speed * deltaTimeStamp;

    this.x -= this.vx;
    this.y -= this.vy;
  }

  private renderHostIndicator(context: CanvasRenderingContext2D): void {
    const startY = this.y - this.height / 2 - this.PLAYER_NAME_RECT_HEIGHT - 15;

    context.beginPath();
    context.arc(this.x, startY, this.PING_CIRCLE_RADIUS, 0, Math.PI * 2);
    context.fillStyle = "#FF80AB";
    context.fill();
    context.closePath();
  }

  private renderPingLevel(context: CanvasRenderingContext2D): void {
    const pingTime = this.owner?.getPingTime() ?? null;

    if (pingTime === null) {
      return;
    }

    let activeCircles = 3;

    if (pingTime > 800) {
      activeCircles = 0;
    } else if (pingTime > 400) {
      activeCircles = 2;
    } else if (pingTime > 200) {
      activeCircles = 1;
    }

    const totalWidth =
      3 * (2 * this.PING_CIRCLE_RADIUS) + 2 * this.PING_CIRCLE_SPACING;

    const startX = this.x - totalWidth / 2 + 3;
    const startY = this.y - this.height / 2 - this.PLAYER_NAME_RECT_HEIGHT - 15;

    context.save();

    for (let i = 0; i < 3; i++) {
      const x =
        startX + i * (2 * this.PING_CIRCLE_RADIUS + this.PING_CIRCLE_SPACING);
      const color =
        i < activeCircles ? this.PING_ACTIVE_COLOR : this.PING_INACTIVE_COLOR;

      context.beginPath();
      context.arc(x, startY, this.PING_CIRCLE_RADIUS, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
      context.closePath();
    }

    context.restore();
  }

  private renderPlayerName(context: CanvasRenderingContext2D): void {
    context.save();

    const playerName = this.owner?.getName() ?? "Unknown";
    context.font = "16px system-ui";

    const textWidth = context.measureText(playerName).width;
    const rectWidth = textWidth + this.PLAYER_NAME_PADDING * 1.8;

    const rectX = this.x - rectWidth / 2;
    const rectY = this.y - this.height / 2 - this.PLAYER_NAME_RECT_HEIGHT - 5;

    if (this.remote) {
      context.fillStyle = RED_TEAM_TRANSPARENCY_COLOR;
    } else {
      context.fillStyle = BLUE_TEAM_TRANSPARENCY_COLOR;
    }

    context.beginPath();
    context.moveTo(rectX + this.PLAYER_NAME_RADIUS, rectY);
    context.lineTo(rectX + rectWidth - this.PLAYER_NAME_RADIUS, rectY);
    context.arcTo(
      rectX + rectWidth,
      rectY,
      rectX + rectWidth,
      rectY + this.PLAYER_NAME_RADIUS,
      this.PLAYER_NAME_RADIUS
    );
    context.lineTo(
      rectX + rectWidth,
      rectY + this.PLAYER_NAME_RECT_HEIGHT - this.PLAYER_NAME_RADIUS
    );
    context.arcTo(
      rectX + rectWidth,
      rectY + this.PLAYER_NAME_RECT_HEIGHT,
      rectX + rectWidth - this.PLAYER_NAME_RADIUS,
      rectY + this.PLAYER_NAME_RECT_HEIGHT,
      this.PLAYER_NAME_RADIUS
    );
    context.lineTo(
      rectX + this.PLAYER_NAME_RADIUS,
      rectY + this.PLAYER_NAME_RECT_HEIGHT
    );
    context.arcTo(
      rectX,
      rectY + this.PLAYER_NAME_RECT_HEIGHT,
      rectX,
      rectY + this.PLAYER_NAME_RECT_HEIGHT - this.PLAYER_NAME_RADIUS,
      this.PLAYER_NAME_RADIUS
    );
    context.lineTo(rectX, rectY + this.PLAYER_NAME_RADIUS);
    context.arcTo(
      rectX,
      rectY,
      rectX + this.PLAYER_NAME_RADIUS,
      rectY,
      this.PLAYER_NAME_RADIUS
    );
    context.closePath();
    context.fill();

    context.fillStyle = "white";
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(
      playerName,
      rectX + rectWidth / 2,
      rectY + this.PLAYER_NAME_RECT_HEIGHT / 2 - 0.5
    );

    context.restore();
  }

  private renderDebugInformation(context: CanvasRenderingContext2D): void {
    this.renderDebugPosition(context);
  }

  private renderDebugPosition(context: CanvasRenderingContext2D): void {
    DebugUtils.renderDebugText(
      context,
      this.x - this.width / 2,
      this.y + this.height / 2 + 5,
      `X(${Math.round(this.x)}) Y(${Math.round(this.y)})`
    );
  }
}
