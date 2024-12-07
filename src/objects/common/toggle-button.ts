import { BasePressableGameObject } from "../base/base-pressable-game-object.js";

export class ToggleObject extends BasePressableGameObject {
  private thumbPosition: number;
  private readonly trackWidth: number;
  private readonly trackHeight: number;
  private readonly thumbSize: number;

  constructor(private toggleId: string, private toggleState = false) {
    super();
    this.width = 100; // Track width of the toggle button
    this.height = 50; // Track height
    this.trackWidth = this.width - 20; // Space for thumb movement
    this.trackHeight = 30; // Track height
    this.thumbSize = 30; // Size of the thumb
    this.thumbPosition = this.toggleState
      ? this.trackWidth - this.thumbSize
      : 0; // Initial position of the thumb
  }

  // Override the update method to check if the button is pressed
  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.isPressed()) {
      // Toggle state change on press
      this.toggleState = !this.toggleState;
      this.thumbPosition = this.toggleState
        ? this.trackWidth - this.thumbSize
        : 0;
      console.log(
        `${this.toggleId} is pressed, new state: ${this.toggleState}`
      );
    }

    // Call the parent class's update method
    super.update(deltaTimeStamp);
  }

  // Render method to visualize the toggle button on canvas
  public override render(context: CanvasRenderingContext2D): void {
    // Draw the track (background of the toggle)
    context.fillStyle = this.toggleState ? "#4cd137" : "#dcdde1"; // Green for ON, Grey for OFF
    context.fillRect(this.x, this.y, this.trackWidth, this.trackHeight);

    // Draw the thumb (circle that moves)
    context.beginPath();
    context.arc(
      this.x + this.thumbPosition + this.thumbSize / 2,
      this.y + this.trackHeight / 2,
      this.thumbSize / 2,
      0,
      Math.PI * 2
    );
    context.fillStyle = "#ffffff"; // Thumb color (white)
    context.fill();
    context.closePath();

    // Optional: Draw border around the toggle track
    context.strokeStyle = "#ccc";
    context.lineWidth = 2;
    context.strokeRect(this.x, this.y, this.trackWidth, this.trackHeight);

    // Call the parent class's render method
    super.render(context);
  }
}
