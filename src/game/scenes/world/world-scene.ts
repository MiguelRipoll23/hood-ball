import { LocalCarEntity } from "../../entities/local-car-entity.js";
import { GoalEntity } from "../../entities/goal-entity.js";
import { BallEntity } from "../../entities/ball-entity.js";
import { ScoreboardEntity } from "../../entities/scoreboard-entity.js";
import { AlertEntity } from "../../entities/alert-entity.js";
import { ToastEntity } from "../../entities/common/toast-entity.js";
import { HelpEntity } from "../../entities/help-entity.js";
import { MatchLogEntity } from "../../entities/match-log-entity.js";
import { MatchAction } from "../../models/match-action.js";
import { NpcCarEntity } from "../../entities/npc-car-entity.js";
import { BaseCollidingGameScene } from "../../../engine/scenes/base-colliding-game-scene.js";
import { EntityStateType } from "../../../engine/enums/entity-state-type.js";
import { GameEventType } from "../../enums/event-type.js";
import type { SceneType } from "../../../engine/enums/scene-type.js";
import { GameSceneType } from "../../enums/scene-type.js";
import type { PlayerConnectedPayload } from "../../interfaces/events/player-connected-payload-interface.js";
import type { PlayerDisconnectedPayload } from "../../interfaces/events/player-disconnected-payload-interface.js";
import type { MatchmakingControllerContract } from "../../interfaces/services/gameplay/matchmaking-controller-contract-interface.js";
import { ScoreManagerService } from "../../services/gameplay/score-manager-service.js";
import { EventProcessorService } from "../../../engine/services/gameplay/event-processor-service.js";
import { EntityOrchestratorService } from "../../services/gameplay/entity-orchestrator-service.js";
import { SceneTransitionService } from "../../../engine/services/gameplay/scene-transition-service.js";
import { TimerManagerService } from "../../../engine/services/gameplay/timer-manager-service.js";
import { MainScene } from "../main/main-scene.js";
import { MainMenuScene } from "../main/main-menu/main-menu-scene.js";
import { ErrorScene } from "../error/error-scene.js";
import { EventConsumerService } from "../../../engine/services/gameplay/event-consumer-service.js";
import { WorldEntityFactory } from "./world-entity-factory.js";
import { WorldController } from "./world-controller.js";
import { RemoteCarEntity } from "../../entities/remote-car-entity.js";
import { BoostPadEntity } from "../../entities/boost-pad-entity.js";
import { TeamType } from "../../enums/team-type.js";
import { GoalExplosionEntity } from "../../entities/goal-explosion-entity.js";
import { ConfettiEntity } from "../../entities/confetti-entity.js";
import { CarExplosionEntity } from "../../entities/car-explosion-entity.js";
import { WebSocketService } from "../../services/network/websocket-service.js";
import type { SpawnPointEntity } from "../../entities/common/spawn-point-entity.js";
import { SpawnPointService } from "../../services/gameplay/spawn-point-service.js";
import type { MatchmakingServiceContract } from "../../interfaces/services/matchmaking/matchmaking-service-contract-interface.js";
import { ChatService } from "../../services/network/chat-service.js";
import { PlayerModerationService } from "../../services/network/player-moderation-service.js";
import { APIService } from "../../services/network/api-service.js";
import { MatchActionsLogService } from "../../services/gameplay/match-actions-log-service.js";
import { container } from "../../../engine/services/di-container.js";
import { GamePlayer } from "../../models/game-player.js";
import { GameServer } from "../../models/game-server.js";
import { MatchSessionService } from "../../services/session/match-session-service.js";
import { NpcService } from "../../services/gameplay/npc-service.js";
import { BaseMoveableGameEntity } from "../../../engine/entities/base-moveable-game-entity.js";
import { AntiCheatService } from "../../services/security/anti-cheat-service.js";
import type { WorldSceneDependencies } from "./world-scene-dependencies.js";
import { WeatherSystem } from "./systems/weather-system.js";
import { ChatUISystem } from "./systems/chat-ui-system.js";
import type { ChatButtonEntity } from "../../entities/chat-button-entity.js";
import { EngineLogger } from "../../../engine/services/engine-logger.js";

export class WorldScene extends BaseCollidingGameScene {
  private readonly sceneTransitionService: SceneTransitionService;
  private readonly spawnPointService: SpawnPointService;
  private readonly timerManagerService: TimerManagerService;
  private readonly matchmakingService: MatchmakingServiceContract;
  private readonly matchmakingController: MatchmakingControllerContract;
  private readonly eventProcessorService: EventProcessorService;
  private readonly entityOrchestrator: EntityOrchestratorService;
  private readonly chatService: ChatService;
  private readonly gamePlayer: GamePlayer;
  private readonly gameServer: GameServer;
  private readonly matchSessionService: MatchSessionService;
  private readonly matchActionsLogService: MatchActionsLogService;

  private scoreboardEntity: ScoreboardEntity | null = null;
  private localCarEntity: LocalCarEntity | null = null;
  private ballEntity: BallEntity | null = null;
  private goalEntity: GoalEntity | null = null;
  private boostPadsEntities: BoostPadEntity[] = [];
  private spawnPointEntities: SpawnPointEntity[] = [];
  private alertEntity: AlertEntity | null = null;
  private toastEntity: ToastEntity | null = null;
  private helpEntity: HelpEntity | null = null;
  private chatButtonEntity: ChatButtonEntity | null = null;
  private matchLogEntity: MatchLogEntity | null = null;
  private npcCarEntity: NpcCarEntity | null = null;

  private matchActionsLogUnsubscribe: (() => void) | null = null;

  private scoreManagerService: ScoreManagerService | null = null;
  private worldController: WorldController | null = null;
  private npcService: NpcService | null = null;
  private helpShown = false;

  /** Extracted weather system: snow effect + icy physics. */
  private readonly weatherSystem = new WeatherSystem();

  /** Extracted chat UI system: chat button, match menu, chat message handling. */
  private readonly chatUISystem = new ChatUISystem();

  private readonly antiCheatService: AntiCheatService | null = null;

  constructor(deps: WorldSceneDependencies) {
    super(deps.gameState, deps.eventConsumerService);
    this.gamePlayer = deps.gamePlayer;
    this.gameServer = deps.gameServer;
    this.matchSessionService = deps.matchSessionService;
    this.gamePlayer.reset();
    this.sceneTransitionService = deps.sceneTransitionService;
    this.timerManagerService = deps.timerManagerService;
    this.matchmakingService = deps.matchmakingService;
    this.matchmakingController = deps.matchmakingController;
    this.entityOrchestrator = deps.entityOrchestrator;
    this.eventProcessorService = deps.eventProcessorService;
    this.spawnPointService = deps.spawnPointService;
    this.chatService = deps.chatService;
    this.matchActionsLogService = deps.matchActionsLogService;

    // Resolve AntiCheatService for per-frame entity checks
    try {
      this.antiCheatService = container.get(AntiCheatService);
    } catch {
      this.antiCheatService = null;
    }

    // Fix for hovering acting as press:
    // Ensure pointer events are cleared automatically after update
    this.clearPointerEventsAutomatically = true;

    this.matchActionsLogService.clear();
    // Clear persisted chat messages so stale messages from previous matches don't appear
    this.chatService.clearMessages();

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
    this.helpEntity = entities.helpEntity;
    this.boostPadsEntities = entities.boostPadsEntities;
    this.spawnPointEntities = entities.spawnPointEntities;

    this.setupMatchLog();

    // Delegate chat UI + match menu setup to the extracted ChatUISystem
    this.setupChatUI();

    this.spawnPointService.setTotalSpawnPoints(
      this.spawnPointEntities.length
    );

    // Set match session service for spawn points to show debug info
    this.spawnPointEntities.forEach((spawnPoint) => {
      spawnPoint.setMatchSessionService(this.matchSessionService);
    });

    this.npcService = new NpcService(
      this.matchSessionService,
      this.spawnPointService,
      this.timerManagerService
    );

    this.worldController = new WorldController({
      spawnPointService: this.spawnPointService,
      timerManagerService: this.timerManagerService,
      eventProcessorService: this.eventProcessorService,
      matchmakingService: this.matchmakingService,
      scoreboardEntity: this.scoreboardEntity,
      ballEntity: this.ballEntity,
      localCarEntity: this.localCarEntity,
      alertEntity: this.alertEntity,
      matchActionsLogService: this.matchActionsLogService,
      boostPadsEntities: this.boostPadsEntities,
      spawnPointEntities: this.spawnPointEntities,
      getEntitiesByOwner: this.getEntitiesByOwner.bind(this),
      npcService: this.npcService!,
      gamePlayer: this.gamePlayer,
      matchSessionService: this.matchSessionService,
    });

    this.scoreManagerService = new ScoreManagerService({
      ballEntity: this.ballEntity,
      goalEntity: this.goalEntity,
      scoreboardUI: this.scoreboardEntity,
      alertEntity: this.alertEntity,
      matchActionsLogService: this.matchActionsLogService,
      timerManagerService: this.timerManagerService,
      eventProcessorService: this.eventProcessorService,
      matchmakingService: this.matchmakingService,
      goalTimeEndCallback: this.worldController.handleGoalTimeEnd.bind(
        this.worldController
      ),
      gameOverEndCallback: () => {
        this.worldController?.handleGameOverEnd();
      },
      explosionCallback: (x: number, y: number, team: TeamType) =>
        this.triggerGoalExplosion(x, y, team),
      gameOverEffectCallback: (won: boolean) =>
        this.handleGameOverEffect(won),
      gamePlayer: this.gamePlayer,
      matchSessionService: this.matchSessionService,
    });

    super.load();
  }

  public override getTypeId(): SceneType {
    return GameSceneType.World;
  }

  public override onTransitionEnd(): void {
    super.onTransitionEnd();

    // Start anti-cheat monitoring now that the scene is active
    this.antiCheatService?.startMonitoring();

    this.scoreboardEntity?.reset();
    if (!this.helpShown) {
      const text = this.getHelpText();
      this.helpEntity?.show(text, 4);
      this.helpShown = true;
    }
    this.matchmakingController
      .startMatchmaking()
      .catch(this.handleMatchmakingError.bind(this));
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    // Anti-cheat movement checks — must run BEFORE super.update() so that
    // skipInterpolation flags from teleport() calls in the previous frame
    // are still visible (entities clear the flag at the end of update()).
    this.antiCheatService?.update(deltaTimeStamp, this.getAntiCheatTrackedEntities());

    super.update(deltaTimeStamp);

    // Delegate weather physics to WeatherSystem
    this.weatherSystem.update(this.worldEntities);

    this.worldController?.handleCarDemolitions(
      this.worldEntities,
      this.triggerCarExplosion.bind(this)
    );

    this.worldController?.handleMatchState();

    // Always use the normal score detection (works for solo and multiplayer)
    this.scoreManagerService?.detectScoresIfHost();

    this.entityOrchestrator.sendLocalData(this, deltaTimeStamp);
  }

  public override render(context: CanvasRenderingContext2D): void {
    super.render(context);

    // Render debug information from matchmaking service (which internally delegates to webrtc)
    if (this.gameState.isDebugging()) {
      this.matchmakingService.renderDebugInformation(context);
    }
  }

  private handleMatchmakingError(error: Error) {
    EngineLogger.error("WorldScene", "Matchmaking error", error);

    this.matchSessionService.setMatch(null);
    void this.returnToMainMenuScene(
      "Could not find or advertise match, returning to main menu..."
    );
  }

  private addSyncableEntities(): void {
    this.addSyncableEntity(BallEntity);
    this.addSyncableEntity(RemoteCarEntity);
  }

  private handleMatchAdvertised(): void {
    if (this.matchSessionService.getMatch()?.getPlayers().length === 1) {
      // Start solo match with NPC
      this.worldController?.startSoloMatchWithNpc(
        this.canvas,
        (entity: NpcCarEntity) => {
          this.npcCarEntity = entity;
          this.addEntityToSceneLayer(entity);
        }
      );
      this.toastEntity?.show("Waiting for players...");

      // Skip countdown during solo play - start match immediately
      this.worldController?.startSoloMatchImmediately();
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

      // If player joins during a solo match, transition to real match
      if (this.worldController?.isSoloMatch()) {
        // Remove NPC car entity from scene
        if (this.npcCarEntity) {
          const index = this.worldEntities.indexOf(this.npcCarEntity);
          if (index > -1) {
            this.worldEntities.splice(index, 1);
          }
          this.npcCarEntity = null;
        }
        // Start countdown to begin real match (this will reset scores)
        this.worldController?.showCountdown();
      } else {
        // If a player joins back after someone left (real players becoming 2 again)
        const allPlayers =
          this.matchSessionService.getMatch()?.getPlayers() ?? [];
        const realPlayersCount = allPlayers.filter((p) => !p.isNpc()).length;
        if (realPlayersCount === 2) {
          // Resume the timer that was stopped when player left
          this.scoreboardEntity?.startTimer();
          EngineLogger.info("WorldScene", "Player joined - match resumed, timer restarted");
        }
      }
    }

    // Delegate to ChatUISystem for match menu refresh
    this.chatUISystem.refreshPlayers(this.matchSessionService, this.gamePlayer);

    this.matchActionsLogService.addAction(
      MatchAction.playerJoined(player.getNetworkId(), {
        playerName: player.getName(),
      })
    );
  }

  private handlePlayerDisconnection(payload: PlayerDisconnectedPayload): void {
    const { player } = payload;

    this.getEntitiesByOwner(player).forEach((entity) => {
      entity.setState(EntityStateType.Inactive);
    });

    this.toastEntity?.show(`<em>${player.getName()}</em> left`, 2);

    // Delegate to ChatUISystem for match menu refresh
    this.chatUISystem.refreshPlayers(this.matchSessionService, this.gamePlayer);

    // Count only real players (excluding NPCs)
    const allPlayers = this.matchSessionService.getMatch()?.getPlayers() ?? [];
    const realPlayersCount = allPlayers.filter((p) => !p.isNpc()).length;

    // If down to 1 real player, freeze match state
    if (realPlayersCount === 1) {
      this.toastEntity?.show("Waiting for players...");
      // Stop/pause the timer to freeze countdown
      this.scoreboardEntity?.stopTimer();
      EngineLogger.info("WorldScene", "Player left - match frozen, timer stopped");
    }

    this.scoreManagerService?.updateScoreboard();

    this.matchActionsLogService.addAction(
      MatchAction.playerLeft(player.getNetworkId(), {
        playerName: player.getName(),
      })
    );
  }

  private subscribeToEvents(): void {
    this.subscribeToLocalEvents();
    this.subscribeToRemoteEvents();
  }

  private subscribeToLocalEvents(): void {
    this.subscribeToLocalEvent(
      GameEventType.MatchAdvertised,
      this.handleMatchAdvertised.bind(this)
    );

    this.subscribeToLocalEvent(
      GameEventType.MatchmakingStarted,
      this.handleMatchmakingStarted.bind(this)
    );

    this.subscribeToLocalEvent<PlayerConnectedPayload>(
      GameEventType.PlayerConnected,
      this.handlePlayerConnection.bind(this)
    );

    this.subscribeToLocalEvent<PlayerDisconnectedPayload>(
      GameEventType.PlayerDisconnected,
      this.handlePlayerDisconnection.bind(this)
    );

    this.subscribeToLocalEvent(
      GameEventType.ReturnToMainMenu,
      () => void this.returnToMainMenuScene()
    );

    this.subscribeToLocalEvent(
      GameEventType.UserBannedByServer,
      () => this.navigateToErrorScene("You have been banned from the server")
    );

    this.subscribeToLocalEvent(
      GameEventType.UserKickedByServer,
      () => this.navigateToErrorScene("You have been kicked from the server")
    );

    // Delegate snow weather to WeatherSystem
    this.subscribeToLocalEvent(GameEventType.SnowWeather, () => {
      this.weatherSystem.activateSnow(this.canvas, this);
    });
  }

  private subscribeToRemoteEvents(): void {
    this.subscribeToRemoteEvent(
      GameEventType.Countdown,
      (data: ArrayBuffer | null) =>
        this.worldController?.handleRemoteCountdown(data)
    );

    this.subscribeToRemoteEvent(
      GameEventType.GoalScored,
      (data: ArrayBuffer | null) =>
        this.scoreManagerService?.handleRemoteGoal(data)
    );

    this.subscribeToRemoteEvent(
      GameEventType.GameOver,
      (data: ArrayBuffer | null) =>
        this.scoreManagerService?.handleRemoteGameOverStartEvent(data)
    );

    this.subscribeToRemoteEvent(
      GameEventType.BoostPadConsumed,
      (data: ArrayBuffer | null) =>
        this.worldController?.handleRemoteBoostPadConsumed(
          data,
          this.getEntitiesByOwner.bind(this)
        )
    );

    this.subscribeToRemoteEvent(
      GameEventType.CarDemolished,
      (data: ArrayBuffer | null) =>
        this.worldController?.handleRemoteCarDemolished(
          data,
          this.getEntitiesByOwner.bind(this),
          this.triggerCarExplosion.bind(this)
        )
    );

    this.subscribeToRemoteEvent(
      GameEventType.PlayerBanned,
      (data: ArrayBuffer | null) =>
        this.worldController?.handleRemotePlayerBanned(data)
    );
  }

  private setupChatUI(): void {
    const boostMeterEntity = this.localCarEntity?.getBoostMeterEntity();
    if (!boostMeterEntity) {
      EngineLogger.error("WorldScene", "Boost meter entity not found");
      return;
    }

    if (!this.uiEntities.includes(boostMeterEntity)) {
      this.uiEntities.push(boostMeterEntity);
    }

    if (!this.helpEntity) {
      EngineLogger.error("WorldScene", "Help entity not found for chat UI");
      return;
    }

    // Delegate chat UI + match menu setup to ChatUISystem
    this.chatButtonEntity = this.chatUISystem.setup(
      this.canvas,
      boostMeterEntity,
      this.helpEntity,
      this.chatService,
      this.gameState.getGamePointer(),
      this.gameState.getGameKeyboard(),
      container.get(PlayerModerationService),
      container.get(APIService),
      this.matchmakingService,
      this.uiEntities,
      () => this.returnToMainMenuScene(),
    );

    // Connect chat button to local car to disable controls during chat
    if (this.localCarEntity && this.chatButtonEntity) {
      this.localCarEntity.setChatButtonEntity(this.chatButtonEntity);
    }
  }

  private setupMatchLog(): void {
    if (this.matchLogEntity) {
      return;
    }
    this.matchLogEntity = new MatchLogEntity(
      this.canvas,
      this.matchSessionService,
      this.gamePlayer
    );
    this.uiEntities.push(this.matchLogEntity);
    this.matchActionsLogUnsubscribe = this.matchActionsLogService.onChange(
      (actions) => this.matchLogEntity?.show(actions)
    );
  }

  private triggerGoalExplosion(x: number, y: number, team: TeamType): void {
    const explosion = new GoalExplosionEntity(this.canvas, x, y, team);
    this.addEntityToSceneLayer(explosion);
    this.cameraService.shake(3, 8);
  }

  private triggerCarExplosion(x: number, y: number): void {
    const explosion = new CarExplosionEntity(x, y);
    this.addEntityToSceneLayer(explosion);
    this.cameraService.shake(1.5, 5);
  }

  private handleGameOverEffect(won: boolean): void {
    if (won) {
      const confetti = new ConfettiEntity(this.canvas);
      this.addEntityToSceneLayer(confetti);
    }
  }

  private getHelpText(): string {
    const driveControls = this.isMobile()
      ? "your first finger"
      : "the WASD or arrow keys";
    const boostControls = this.isMobile()
      ? "your second finger"
      : "shift or space keys";
    return `Drive with ${driveControls}.\nBoost using ${boostControls}.`;
  }

  private isMobile(): boolean {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  public override resubscribeEvents(): void {
    this.subscribeToEvents();
  }

  private async returnToMainMenuScene(errorMessage?: string): Promise<void> {
    const mainScene = new MainScene();
    const mainMenuScene = new MainMenuScene(
      this.gameState,
      container.get(EventConsumerService),
      false
    );
    if (errorMessage) {
      mainMenuScene.setPendingMessage(errorMessage);
    }
    if (!this.gameServer.isConnected()) {
      try {
        container.get(WebSocketService).connectToServer();
      } catch (error) {
        EngineLogger.error("WorldScene", "Failed to reconnect to server", error);
      }
    }
    mainScene.activateScene(mainMenuScene);
    mainScene.load();
    this.sceneTransitionService.fadeOutAndIn(
      this.gameState.getGameFrame(),
      mainScene,
      1,
      1
    );
  }

  private navigateToErrorScene(errorMessage: string): void {
    EngineLogger.info("WorldScene", "Navigating to error scene:", errorMessage);
    this.matchmakingService.leaveMatch().catch((error) => {
      EngineLogger.error("WorldScene", "Error leaving match during kick:", error);
    });
    this.dispose();
    const mainScene = new MainScene();
    const errorScene = new ErrorScene(errorMessage);
    mainScene.activateScene(errorScene);
    mainScene.load();
    this.sceneTransitionService.fadeOutAndIn(
      this.gameState.getGameFrame(),
      mainScene,
      1,
      1
    );
  }

  private *getAntiCheatTrackedEntities(): Generator<{
    id: string;
    x: number;
    y: number;
    ownerId: string;
    typeId: number;
    skipInterpolation: boolean;
  }> {
    for (const entity of this.worldEntities) {
      if (!(entity instanceof BaseMoveableGameEntity)) {
        continue;
      }
      const ownerId = entity.getOwner()?.getNetworkId();
      const typeId = entity.getTypeId();
      if (ownerId && typeId !== null) {
        yield {
          id: entity.getId(),
          x: entity.getX(),
          y: entity.getY(),
          ownerId,
          typeId,
          skipInterpolation: entity.wasSkipInterpolationSet(),
        };
      }
    }
  }

  public override dispose(): void {
    this.antiCheatService?.stopMonitoring();
    this.chatUISystem.dispose();
    this.matchActionsLogUnsubscribe?.();
    this.matchActionsLogUnsubscribe = null;
    this.matchActionsLogService.clear();
    if (this.npcService) {
      this.npcService.removeNpcCar((entity) => {
        const index = this.worldEntities.indexOf(entity);
        if (index > -1) {
          this.worldEntities.splice(index, 1);
        }
      });
    }
    super.dispose();
  }
}

