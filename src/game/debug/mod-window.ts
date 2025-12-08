import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import { BaseWindow } from "../../core/debug/base-window.js";
import type { GameState } from "../../core/models/game-state.js";
import { BallEntity } from "../entities/ball-entity.js";
import { LocalCarEntity as LocalCarEntityClass } from "../entities/local-car-entity.js";
import { GoalEntity } from "../entities/goal-entity.js";

export class ModWindow extends BaseWindow {
  // Game tab state
  private speedMultiplier = [1.0];
  private infiniteBoost = [false];
  private autoScore = [false];

  // Store base values
  private baseTopSpeed = 0.3;
  private baseAcceleration = 0.002;

  // Colors
  private static readonly DARK_GRAY_COLOR = 0xff808080;

  constructor(private gameState: GameState) {
    super("Mod menu", new ImVec2(250, 200));
  }

  protected override renderContent(): void {
    if (ImGui.BeginTabBar("ModTabs")) {
      if (ImGui.BeginTabItem("Controls")) {
        this.renderControlsTab();
        ImGui.EndTabItem();
      }

      if (ImGui.BeginTabItem("Gameplay")) {
        this.renderGameplayTab();
        ImGui.EndTabItem();
      }

      ImGui.EndTabBar();
    }

    // Update game mods every frame regardless of active tab
    this.updateGameMods();
  }

  private renderControlsTab(): void {
    const localCar = this.getLocalCar();
    const canControlCar = localCar !== null;

    if (!canControlCar) {
      ImGui.PushStyleColor(ImGui.Col.Text, ModWindow.DARK_GRAY_COLOR);
      ImGui.BeginDisabled();
    }

    ImGui.Text("Car Speed Multiplier");
    ImGui.SetNextItemWidth(-1);

    ImGui.SliderFloat("##speedMult", this.speedMultiplier, 0.1, 5.0, "%.1fx");

    if (canControlCar && ImGui.IsItemEdited()) {
      this.applySpeedMultiplier();
    }

    if (ImGui.Button("Reset Speed", new ImVec2(-1, 0))) {
      if (canControlCar) {
        this.speedMultiplier[0] = 1.0;
        this.applySpeedMultiplier();
      }
    }

    ImGui.Spacing();
    ImGui.Separator();
    ImGui.Spacing();

    if (ImGui.Checkbox("Infinite Boost", this.infiniteBoost)) {
      if (this.infiniteBoost[0]) {
        console.log("Infinite boost enabled");
      } else {
        console.log("Infinite boost disabled");
      }
    }
    ImGui.TextWrapped("Keeps boost at 100% at all times");

    if (!canControlCar) {
      ImGui.EndDisabled();
      ImGui.PopStyleColor();
    }
  }

  private renderGameplayTab(): void {
    const ball = this.getBall();
    const goal = this.getGoal();
    const canEnableAimbot = ball && goal;

    if (!canEnableAimbot) {
      ImGui.PushStyleColor(ImGui.Col.Text, ModWindow.DARK_GRAY_COLOR);
    }

    const aimbotChanged = ImGui.Checkbox("Aimbot (Auto Score)", this.autoScore);

    if (!canEnableAimbot) {
      ImGui.PopStyleColor();
    }

    if (aimbotChanged) {
      if (canEnableAimbot) {
        this.toggleAutoScore();
      } else {
        this.autoScore[0] = false;
        console.warn("Cannot enable aimbot: Ball or Goal not found");
      }
    }

    ImGui.TextWrapped("Pushes ball to goal");
  }

  private applySpeedMultiplier(): void {
    const localCar = this.getLocalCar();
    if (!localCar) {
      console.warn("Cannot apply speed multiplier: local car not found");
      return;
    }

    // Apply the speed multiplier to top speed and acceleration
    localCar.setTopSpeed(this.baseTopSpeed * this.speedMultiplier[0]);
    localCar.setAcceleration(this.baseAcceleration * this.speedMultiplier[0]);

    console.log(`Speed multiplier set to: ${this.speedMultiplier[0]}`);
  }

  private toggleAutoScore(): void {
    if (this.autoScore[0]) {
      console.log("Aimbot enabled");
    } else {
      console.log("Aimbot disabled");
    }
  }

  private updateGameMods(): void {
    const localCar = this.getLocalCar();
    if (!localCar) return;

    // Apply infinite boost if enabled
    if (this.infiniteBoost[0]) {
      localCar.setBoost(100);
    }

    // Apply auto-score if enabled
    if (this.autoScore[0]) {
      const ball = this.getBall();
      const goal = this.getGoal();

      if (ball && goal) {
        // Calculate goal center position
        const goalCenterX = goal.getX() + 50; // Goal width is ~100, so center is at +50
        const goalCenterY = goal.getY() + 20; // Goal height is ~40, so center is at +20

        const dx = goalCenterX - ball.getX();
        const dy = goalCenterY - ball.getY();
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10) {
          const speed = 3;
          // Move ball towards goal (negative Y direction)
          ball.setVX(-((dx / distance) * speed));
          ball.setVY(-((dy / distance) * speed));
        }

        // Make car follow ball
        const carToBallDx = ball.getX() - localCar.getX();
        const carToBallDy = ball.getY() - localCar.getY();
        const carToBallDistance = Math.sqrt(
          carToBallDx * carToBallDx + carToBallDy * carToBallDy
        );

        if (carToBallDistance > 60) {
          // Calculate angle to ball (add PI to flip direction)
          const angleToTarget = Math.atan2(carToBallDy, carToBallDx) + Math.PI;
          localCar.setAngle(angleToTarget);
          localCar.setSpeed(0.5);
        }
      }
    }
  }

  private getActiveSceneEntities() {
    const scene = this.gameState.getGameFrame().getCurrentScene();
    const subScene = scene?.getSceneManagerService()?.getCurrentScene() ?? null;
    const activeScene = subScene ?? scene;

    if (!activeScene) return null;

    return activeScene.getWorldEntities();
  }

  private getLocalCar(): LocalCarEntityClass | null {
    const worldEntities = this.getActiveSceneEntities();
    if (!worldEntities) return null;

    return (
      worldEntities.find(
        (entity): entity is LocalCarEntityClass =>
          entity instanceof LocalCarEntityClass
      ) ?? null
    );
  }

  private getBall(): BallEntity | null {
    const worldEntities = this.getActiveSceneEntities();
    if (!worldEntities) return null;

    return (
      worldEntities.find(
        (entity): entity is BallEntity => entity instanceof BallEntity
      ) ?? null
    );
  }

  private getGoal(): GoalEntity | null {
    const worldEntities = this.getActiveSceneEntities();
    if (!worldEntities) return null;

    return (
      worldEntities.find(
        (entity): entity is GoalEntity => entity instanceof GoalEntity
      ) ?? null
    );
  }

  public override close(): void {
    super.close();
  }
}
