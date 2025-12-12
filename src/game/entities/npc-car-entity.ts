import { CarEntity } from "./car-entity.js";
import { BallEntity } from "./ball-entity.js";
import { GamePlayer } from "../models/game-player.js";

export class NpcCarEntity extends CarEntity {
  private readonly AI_UPDATE_INTERVAL = 50; // Update AI decisions every 50ms
  private readonly BOOST_DISTANCE_THRESHOLD = 200; // Distance to ball to activate boost
  private readonly BOOST_ANGLE_THRESHOLD = 0.5; // Max angle difference to use boost
  private readonly MIN_BOOST_THRESHOLD = 20; // Minimum boost required to activate
  private readonly ANGLE_TOLERANCE = 0.1; // Minimum angle difference to turn
  
  private aiUpdateTimer = 0;
  private targetAngle = 0;

  constructor(
    x: number,
    y: number,
    angle: number,
    canvas: HTMLCanvasElement,
    private readonly ballEntity: BallEntity,
    spawnPointIndex: number = -1
  ) {
    super(x, y, angle, true); // remote=true to use red car
    this.setCanvas(canvas);
    
    // Create a distinctive NPC player with robot emoji
    const npcPlayer = new GamePlayer(
      "npc-00000000-0000-0000-0000-000000000000",
      "🤖 NPC",
      false,
      0,
      spawnPointIndex
    );
    this.setOwner(npcPlayer);
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.aiUpdateTimer += deltaTimeStamp;

    if (this.aiUpdateTimer >= this.AI_UPDATE_INTERVAL) {
      this.aiUpdateTimer = 0;
      this.updateAI(deltaTimeStamp);
    }

    super.update(deltaTimeStamp);
  }

  private updateAI(deltaTimeStamp: DOMHighResTimeStamp): void {
    // Calculate direction to ball
    const ballX = this.ballEntity.getX();
    const ballY = this.ballEntity.getY();
    const dx = ballX - this.x;
    const dy = ballY - this.y;
    const distanceToBall = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate angle to ball
    // Note: The car's movement system uses x -= vx, y -= vy, so we need to invert the angle
    // to make the car move towards the ball instead of away from it
    const angleTowardsBall = Math.atan2(dy, dx) + Math.PI;
    
    // Always try to move towards the ball
    this.targetAngle = angleTowardsBall;
    
    // Smooth angle transition
    const angleDiff = this.normalizeAngle(this.targetAngle - this.angle);
    const turnAmount = this.HANDLING * deltaTimeStamp;
    
    if (Math.abs(angleDiff) > this.ANGLE_TOLERANCE) {
      if (angleDiff > 0) {
        this.angle += Math.min(turnAmount, angleDiff);
      } else {
        this.angle += Math.max(-turnAmount, angleDiff);
      }
    }

    // Always accelerate towards the ball
    if (this.speed < this.topSpeed) {
      this.speed += this.acceleration * deltaTimeStamp;
    }

    // Use boost if close to ball and facing it (to push it harder)
    if (distanceToBall < this.BOOST_DISTANCE_THRESHOLD && 
        Math.abs(angleDiff) < this.BOOST_ANGLE_THRESHOLD && 
        this.boost > this.MIN_BOOST_THRESHOLD) {
      this.activateBoost();
    } else {
      this.deactivateBoost();
    }
  }

  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }

  public override reset(): void {
    super.reset();
    this.aiUpdateTimer = 0;
  }
}
