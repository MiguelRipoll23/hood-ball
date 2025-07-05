import { LocalCarEntity } from "../../entities/local-car-entity.js";
import { GoalEntity } from "../../entities/goal-entity.js";
import { BallEntity } from "../../entities/ball-entity.js";
import { ScoreboardEntity } from "../../entities/scoreboard-entity.js";
import { AlertEntity } from "../../entities/alert-entity.js";
import { ToastEntity } from "../../entities/common/toast-entity.js";
import { BaseCollidingGameScene } from "../../../core/scenes/base-colliding-game-scene.js";
import { GameState } from "../../../core/models/game-state.js";
import { EntityStateType } from "../../../core/enums/entity-state-type.js";
import { EventType } from "../../enums/event-type.js";
import { SceneType } from "../../enums/scene-type.js";
import { MatchStateType } from "../../enums/match-state-type.js";
import type { PlayerConnectedPayload } from "../../interfaces/events/player-connected-payload.js";
import type { PlayerDisconnectedPayload } from "../../interfaces/events/player-disconnected-payload.js";
import type { IMatchmakingProvider } from "../../interfaces/services/gameplay/matchmaking-provider.js";
import { MatchmakingService } from "../../services/gameplay/matchmaking-service.js";
import { MatchmakingControllerService } from "../../services/gameplay/matchmaking-controller-service.js";
import { ScoreManagerService } from "../../services/gameplay/score-manager-service.js";
import { EventProcessorService } from "../../../core/services/gameplay/event-processor-service.js";
import { EntityOrchestratorService } from "../../services/gameplay/entity-orchestrator-service.js";
import { SceneTransitionService } from "../../../core/services/gameplay/scene-transition-service.js";
import { TimerManagerService } from "../../../core/services/gameplay/timer-manager-service.js";
import { MainScene } from "../main/main-scene.js";
import { MainMenuScene } from "../main/main-menu-scene.js";
import { container } from "../../../core/services/di-container.js";
import { EventConsumerService } from "../../../core/services/gameplay/event-consumer-service.js";
import { WorldEntityFactory } from "./world-entity-factory.js";
import { MatchFlowController } from "./match-flow-controller.js";
import { RemoteCarEntity } from "../../entities/remote-car-entity.js";
import { BoostPadEntity } from "../../entities/boost-pad-entity.js";
import { BinaryReader } from "../../../core/utils/binary-reader-utils.js";
import { TeamType } from "../../enums/team-type.js";
import { CameraService } from "../../../core/services/gameplay/camera-service.js";
import { GoalExplosionEntity } from "../../entities/goal-explosion-entity.js";

export class WorldScene extends BaseCollidingGameScene {
  private readonly sceneTransitionService: SceneTransitionService;
  private readonly timerManagerService: TimerManagerService;
  private readonly matchmakingService: IMatchmakingProvider;
  private readonly matchmakingController: MatchmakingControllerService;
  private readonly eventProcessorService: EventProcessorService;
  private readonly entityOrchestrator: EntityOrchestratorService;
  private readonly cameraService: CameraService;

  private scoreboardEntity: ScoreboardEntity | null = null;
  private localCarEntity: LocalCarEntity | null = null;
  private ballEntity: BallEntity | null = null;
  private goalEntity: GoalEntity | null = null;
  private alertEntity: AlertEntity | null = null;
  private toastEntity: ToastEntity | null = null;
  private scoreManagerService: ScoreManagerService | null = null;
  private matchFlowController: MatchFlowController | null = null;
  private boostPads: BoostPadEntity[] = [];

  constructor(
    protected gameState: GameState,
    eventConsumerService: EventConsumerService
  ) {
    super(gameState, eventConsumerService);
    this.gameState.getGamePlayer().reset();
    this.sceneTransitionService = container.get(SceneTransitionService);
    this.timerManagerService = container.get(TimerManagerService);
    this.matchmakingService = container.get(MatchmakingService);
    this.matchmakingController = container.get(MatchmakingControllerService);
    this.entityOrchestrator = container.get(EntityOrchestratorService);
    this.eventProcessorService = container.get(EventProcessorService);
    this.cameraService = container.get(CameraService);
    this.addSyncableEntities();
    this.subscribeToEvents();
  }

  public override load(): void {
    const factory = new WorldEntityFactory(this.gameState, this.canvas);
    factory.createBackground(this.worldEntities);
    const entities = factory.createWorldEntities(
      this.worldEntities,
      this.uiEntities
    );

    this.scoreboardEntity = entities.scoreboardEntity;
    this.localCarEntity = entities.localCarEntity;
    this.ballEntity = entities.ballEntity;
    this.goalEntity = entities.goalEntity;
    this.alertEntity = entities.alertEntity;
    this.toastEntity = entities.toastEntity;
    this.boostPads = entities.boostPads;

    this.matchFlowController = new MatchFlowController(
      this.gameState,
      this.timerManagerService,
      this.eventProcessorService,
      this.matchmakingService,
      this.scoreboardEntity,
      this.ballEntity,
      this.localCarEntity,
      this.alertEntity,
      this.boostPads
    );

    this.scoreManagerService = new ScoreManagerService(
      this.gameState,
      this.ballEntity,
      this.goalEntity,
      this.scoreboardEntity,
      this.alertEntity,
      this.timerManagerService,
      this.eventProcessorService,
      this.matchmakingService,
      this.matchFlowController.handleGoalTimeEnd.bind(this.matchFlowController),
      () => {
        this.matchFlowController?.handleGameOverEnd();
        void this.returnToMainMenuScene();
      },
      (x: number, y: number, team: TeamType) =>
        this.triggerGoalExplosion(x, y, team)
    );
    super.load();
  }

  public override getTypeId(): SceneType {
    return SceneType.World;
  }

  public override onTransitionEnd(): void {
    super.onTransitionEnd();

    this.scoreboardEntity?.reset();
    this.matchmakingController
      .startMatchmaking()
      .catch(this.handleMatchmakingError.bind(this));
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    super.update(deltaTimeStamp);

    this.matchFlowController?.handleMatchState();
    this.scoreManagerService?.detectScoresIfHost();

    this.entityOrchestrator.sendLocalData(this, deltaTimeStamp);
  }

  private handleMatchmakingError(error: Error) {
    console.error("Matchmaking error", error);

    alert("Could not find or advertise match, returning to main scene menu...");

    this.gameState.setMatch(null);
    void this.returnToMainMenuScene();
  }

  private addSyncableEntities(): void {
    this.addSyncableEntity(RemoteCarEntity);
  }

  private handleMatchAdvertised(): void {
    if (this.gameState.getMatch()?.getPlayers().length === 1) {
      this.toastEntity?.show("Waiting for players...");
    }
  }

  private handleMatchmakingStarted(): void {
    this.toastEntity?.show("Finding sessions...");
  }

  private handlePlayerConnection(payload: PlayerConnectedPayload): void {
    const { player, matchmaking } = payload;

    this.toastEntity?.hide();

    if (matchmaking) {
      this.toastEntity?.show(`Joined to <em>${player.getName()}</em>`, 2);
      this.scoreManagerService?.updateScoreboard();
    } else {
      this.toastEntity?.show(`<em>${player.getName()}</em> joined`, 2);

      const matchState = this.gameState.getMatch()?.getState();

      if (matchState === MatchStateType.WaitingPlayers) {
        this.matchFlowController?.showCountdown();
      }
    }
  }

  private handlePlayerDisconnection(payload: PlayerDisconnectedPayload): void {
    const { player } = payload;

    this.getEntitiesByOwner(player).forEach((entity) => {
      entity.setState(EntityStateType.Inactive);
    });

    this.toastEntity?.show(`<em>${player.getName()}</em> left`, 2);

    const playersCount = this.gameState.getMatch()?.getPlayers().length ?? 0;

    if (playersCount === 1) {
      this.handleWaitingForPlayers();
    }

    this.scoreManagerService?.updateScoreboard();
  }

  private subscribeToEvents(): void {
    this.subscribeToLocalEvents();
    this.subscribeToRemoteEvents();
  }

  private subscribeToLocalEvents(): void {
    this.subscribeToLocalEvent(
      EventType.MatchAdvertised,
      this.handleMatchAdvertised.bind(this)
    );

    this.subscribeToLocalEvent(
      EventType.MatchmakingStarted,
      this.handleMatchmakingStarted.bind(this)
    );

    this.subscribeToLocalEvent<PlayerConnectedPayload>(
      EventType.PlayerConnected,
      this.handlePlayerConnection.bind(this)
    );

    this.subscribeToLocalEvent<PlayerDisconnectedPayload>(
      EventType.PlayerDisconnected,
      this.handlePlayerDisconnection.bind(this)
    );
  }

  private subscribeToRemoteEvents(): void {
    this.subscribeToRemoteEvent(
      EventType.Countdown,
      (data: ArrayBuffer | null) =>
        this.matchFlowController?.handleRemoteCountdown(data)
    );

    this.subscribeToRemoteEvent(
      EventType.GoalScored,
      (data: ArrayBuffer | null) =>
        this.scoreManagerService?.handleRemoteGoal(data)
    );

    this.subscribeToRemoteEvent(
      EventType.GameOver,
      (data: ArrayBuffer | null) =>
        this.scoreManagerService?.handleRemoteGameOverStartEvent(data)
    );

    this.subscribeToRemoteEvent(
      EventType.BoostPadConsumed,
      (data: ArrayBuffer | null) => this.handleRemoteBoostPadConsumed(data)
    );
  }

  private handleWaitingForPlayers(): void {
    this.matchFlowController?.handleWaitingForPlayers();
  }
  private handleRemoteBoostPadConsumed(data: ArrayBuffer | null): void {
    if (data === null) {
      console.warn("Array buffer is null");
      return;
    }

    if (this.gameState.getMatch()?.isHost()) {
      console.warn("Host should not receive boost pad event");
      return;
    }

    const binaryReader = BinaryReader.fromArrayBuffer(data);
    const index = binaryReader.unsignedInt8();

    if (index < 0 || index >= this.boostPads.length) {
      console.warn(`Invalid boost pad index: ${index}`);
      return;
    }

    const pad = this.boostPads[index];
    pad.forceConsume();
  }

  private triggerGoalExplosion(x: number, y: number, team: TeamType): void {
    const explosion = new GoalExplosionEntity(this.canvas, x, y, team);
    this.addEntityToSceneLayer(explosion);
    this.cameraService.shake(0.3, 8);
  }

  private async returnToMainMenuScene(): Promise<void> {
    const mainScene = new MainScene(
      this.gameState,
      container.get(EventConsumerService)
    );
    const mainMenuScene = new MainMenuScene(
      this.gameState,
      container.get(EventConsumerService),
      false
    );

    mainScene.activateScene(mainMenuScene);
    mainScene.load();

    this.sceneTransitionService.fadeOutAndIn(
      this.gameState.getGameFrame(),
      mainScene,
      1,
      1
    );
  }
}
