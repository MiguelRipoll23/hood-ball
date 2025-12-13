import { LocalCarEntity } from "../../entities/local-car-entity.js";
import { GoalEntity } from "../../entities/goal-entity.js";
import { BallEntity } from "../../entities/ball-entity.js";
import { CarEntity } from "../../entities/car-entity.js";
import { ScoreboardEntity } from "../../entities/scoreboard-entity.js";
import { AlertEntity } from "../../entities/alert-entity.js";
import { ToastEntity } from "../../entities/common/toast-entity.js";
import { HelpEntity } from "../../entities/help-entity.js";
import { ChatButtonEntity } from "../../entities/chat-button-entity.js";
import { MatchLogEntity } from "../../entities/match-log-entity.js";
import { MatchAction } from "../../models/match-action.js";
import { NpcCarEntity } from "../../entities/npc-car-entity.js";
import { BaseCollidingGameScene } from "../../../engine/scenes/base-colliding-game-scene.js";
import { GameState } from "../../../engine/models/game-state.js";
import { EntityStateType } from "../../../engine/enums/entity-state-type.js";
import { EventType } from "../../../engine/enums/event-type.js";
import { SceneType } from "../../../engine/enums/scene-type.js";
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
import { container } from "../../../engine/services/di-container.js";
import { EventConsumerService } from "../../../engine/services/gameplay/event-consumer-service.js";
import { WorldEntityFactory } from "./world-entity-factory.js";
import { WorldController } from "./world-controller.js";
import { RemoteCarEntity } from "../../entities/remote-car-entity.js";
import { BoostPadEntity } from "../../entities/boost-pad-entity.js";
import { TeamType } from "../../enums/team-type.js";
import { GoalExplosionEntity } from "../../entities/goal-explosion-entity.js";
import { ConfettiEntity } from "../../entities/confetti-entity.js";
import { SnowEntity } from "../../entities/snow-entity.js";
import { CarExplosionEntity } from "../../entities/car-explosion-entity.js";
import { WebSocketService } from "../../services/network/websocket-service.js";
import type { SpawnPointEntity } from "../../entities/common/spawn-point-entity.js";
import { SpawnPointService } from "../../services/gameplay/spawn-point-service.js";
import type { MatchmakingServiceContract } from "../../interfaces/services/matchmaking/matchmaking-service-contract-interface.js";
import { ChatService } from "../../services/network/chat-service.js";
import { MatchActionsLogService } from "../../services/gameplay/match-actions-log-service.js";
import { gameContext } from "../../context/game-context.js";
import { GamePlayer } from "../../models/game-player.js";
import { GameServer } from "../../models/game-server.js";
import { MatchSessionService } from "../../services/session/match-session-service.js";
import { NpcService } from "../../services/gameplay/npc-service.js";

export class WorldScene extends BaseCollidingGameScene {
  private static readonly SNOW_FRICTION_MULTIPLIER = 0.3; // 70% less friction for icy conditions

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

  private readonly matchActionsLogService: MatchActionsLogService;
  private matchActionsLogUnsubscribe: (() => void) | null = null;

  private scoreManagerService: ScoreManagerService | null = null;
  private worldController: WorldController | null = null;
  private npcService: NpcService | null = null;
  private helpShown = false;

  // Weather state
  private activeWeatherEntity: SnowEntity | null = null;
  private weatherFrictionMultiplier = 1.0;

  private isReplayMode = false;

  constructor(
    protected gameState: GameState,
    eventConsumerService: EventConsumerService,
    sceneTransitionService: SceneTransitionService,
    timerManagerService: TimerManagerService,
    matchmakingService: MatchmakingServiceContract,
    matchmakingController: MatchmakingControllerContract,
    entityOrchestrator: EntityOrchestratorService,
    eventProcessorService: EventProcessorService,
    spawnPointService: SpawnPointService,
    chatService: ChatService,
    matchActionsLogService: MatchActionsLogService,
    replayMode = false
  ) {
    super(gameState, eventConsumerService);
    this.isReplayMode = replayMode;
    this.gamePlayer = gameContext.get(GamePlayer);
    this.gameServer = gameContext.get(GameServer);
    this.matchSessionService = gameContext.get(MatchSessionService);
    this.gamePlayer.reset();
    this.sceneTransitionService = sceneTransitionService;
    this.timerManagerService = timerManagerService;
    this.matchmakingService = matchmakingService;
    this.matchmakingController = matchmakingController;
    this.entityOrchestrator = entityOrchestrator;
    this.eventProcessorService = eventProcessorService;
    this.spawnPointService = spawnPointService;
    this.chatService = chatService;
    this.matchActionsLogService = matchActionsLogService;
    
    // Only clear if service exists (in replay mode, some services may be null)
    if (this.matchActionsLogService) {
      this.matchActionsLogService.clear();
    }
    
    this.addSyncableEntities();
    this.subscribeToEvents();
  }

  public override load(): void {
    // In replay mode, don't create any entities - they'll be spawned from recording
    if (this.isReplayMode) {
      console.log("WorldScene loading in replay mode - skipping entity creation");
      const factory = new WorldEntityFactory(this.gameState, this.canvas);
      // Only create background
      factory.createBackground(this.worldEntities);
      this.loaded = true;
      return;
    }

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
    this.setupChatUI();

    // Set total spawn points created to service
    this.spawnPointService.setTotalSpawnPoints(this.spawnPointEntities.length);

    // Initialize NPC service
    this.npcService = new NpcService(
      this.matchSessionService,
      this.spawnPointService,
      this.timerManagerService
    );

    this.worldController = new WorldController(
      this.spawnPointService,
      this.timerManagerService,
      this.eventProcessorService,
      this.matchmakingService,
      this.scoreboardEntity,
      this.ballEntity,
      this.localCarEntity,
      this.alertEntity,
      this.matchActionsLogService,
      this.boostPadsEntities,
      this.spawnPointEntities,
      this.getEntitiesByOwner.bind(this),
      this.npcService
    );

    this.scoreManagerService = new ScoreManagerService(
      this.ballEntity,
      this.goalEntity,
      this.scoreboardEntity,
      this.alertEntity,
      this.matchActionsLogService,
      this.timerManagerService,
      this.eventProcessorService,
      this.matchmakingService,
      this.worldController.handleGoalTimeEnd.bind(this.worldController),
      () => {
        this.worldController?.handleGameOverEnd();
      },
      (x: number, y: number, team: TeamType) =>
        this.triggerGoalExplosion(x, y, team),
      (won: boolean) => this.handleGameOverEffect(won)
    );

    super.load();
  }

  public override getTypeId(): SceneType {
    return SceneType.World;
  }

  public override onTransitionEnd(): void {
    super.onTransitionEnd();

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
    super.update(deltaTimeStamp);

    // Skip gameplay logic in replay mode - entities are driven by recording data
    if (this.isReplayMode) {
      return;
    }

    // Check if weather effect has ended and reset physics
    if (this.activeWeatherEntity && this.activeWeatherEntity.isRemoved()) {
      this.weatherFrictionMultiplier = 1.0;
      this.applyWeatherPhysics();
      this.activeWeatherEntity = null;
      console.log("Weather effect ended - physics restored to normal");
    }

    // Apply weather physics each frame to ensure newly spawned entities get the correct friction
    if (this.weatherFrictionMultiplier !== 1.0) {
      this.applyWeatherPhysics();
    }

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
    console.error("Matchmaking error", error);
    alert("Could not find or advertise match, returning to main scene menu...");

    this.matchSessionService.setMatch(null);
    void this.returnToMainMenuScene();
  }

  private addSyncableEntities(): void {
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
      }
    }

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

    const playersCount =
      this.matchSessionService.getMatch()?.getPlayers().length ?? 0;

    // If down to 1 player, just show waiting message but stay in current state
    if (playersCount === 1) {
      this.toastEntity?.show("Waiting for players...");
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

    this.subscribeToLocalEvent(
      EventType.ReturnToMainMenu,
      () => void this.returnToMainMenuScene()
    );

    this.subscribeToLocalEvent(EventType.SnowWeather, () => {
      this.activateSnowWeather();
    });
  }

  private subscribeToRemoteEvents(): void {
    this.subscribeToRemoteEvent(
      EventType.Countdown,
      (data: ArrayBuffer | null) =>
        this.worldController?.handleRemoteCountdown(data)
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
      (data: ArrayBuffer | null) =>
        this.worldController?.handleRemoteBoostPadConsumed(
          data,
          this.getEntitiesByOwner.bind(this)
        )
    );

    this.subscribeToRemoteEvent(
      EventType.CarDemolished,
      (data: ArrayBuffer | null) =>
        this.worldController?.handleRemoteCarDemolished(
          data,
          this.getEntitiesByOwner.bind(this),
          this.triggerCarExplosion.bind(this)
        )
    );
  }

  private setupChatUI(): void {
    const chatInputElement = document.querySelector(
      "#chat-input"
    ) as HTMLInputElement | null;

    if (!chatInputElement) {
      console.error("Chat input element not found");
      return;
    }

    // Make chat input visible now that the game has started
    chatInputElement.removeAttribute("hidden");

    const boostMeterEntity = this.localCarEntity?.getBoostMeterEntity();
    if (!boostMeterEntity) {
      console.error("Boost meter entity not found");
      return;
    }

    if (!this.uiEntities.includes(boostMeterEntity)) {
      this.uiEntities.push(boostMeterEntity);
    }

    const initialMsgs = this.chatService.getMessages();
    if (initialMsgs.length > 0) {
      const recentMessages = initialMsgs.slice(-5);
      recentMessages.forEach((message) => {
        this.matchActionsLogService.addAction(
          MatchAction.chatMessage(message.getUserId(), message.getText(), {
            timestamp: message.getTimestamp(),
          })
        );
      });
    }

    this.chatButtonEntity = new ChatButtonEntity(
      boostMeterEntity,
      chatInputElement,
      this.chatService,
      this.gameState.getGamePointer(),
      this.gameState.getGameKeyboard(),
      this.helpEntity as HelpEntity
    );
    this.uiEntities.push(this.chatButtonEntity);

    // Connect chat button to local car to disable controls during chat
    if (this.localCarEntity) {
      this.localCarEntity.setChatButtonEntity(this.chatButtonEntity);
    }
  }

  private setupMatchLog(): void {
    if (this.matchLogEntity) {
      return;
    }
    this.matchLogEntity = new MatchLogEntity(this.canvas);
    this.uiEntities.push(this.matchLogEntity);
    this.matchActionsLogUnsubscribe = this.matchActionsLogService.onChange(
      (actions) => this.matchLogEntity?.show(actions)
    );
  }

  private triggerGoalExplosion(x: number, y: number, team: TeamType): void {
    const explosion = new GoalExplosionEntity(this.canvas, x, y, team);
    this.addEntityToSceneLayer(explosion);
    // Make the shake last a bit longer for added impact
    this.cameraService.shake(3, 8);
  }

  private triggerCarExplosion(x: number, y: number): void {
    const explosion = new CarExplosionEntity(x, y);
    this.addEntityToSceneLayer(explosion);
    // Slightly longer shake for demolition impact
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

  private async returnToMainMenuScene(): Promise<void> {
    const mainScene = new MainScene();
    const mainMenuScene = new MainMenuScene(
      this.gameState,
      container.get(EventConsumerService),
      false
    );

    if (!this.gameServer.isConnected()) {
      try {
        container.get(WebSocketService).connectToServer();
      } catch (error) {
        console.error("Failed to reconnect to server", error);
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

  private activateSnowWeather(): void {
    // Remove any existing weather effect
    if (this.activeWeatherEntity) {
      this.activeWeatherEntity.setRemoved(true);
    }

    // Create snow effect
    const snowEntity = new SnowEntity(this.canvas);
    this.addEntityToSceneLayer(snowEntity);
    this.activeWeatherEntity = snowEntity;

    // Set icy physics - very slippery
    this.weatherFrictionMultiplier = WorldScene.SNOW_FRICTION_MULTIPLIER;
    this.applyWeatherPhysics();

    console.log("Snow weather activated - icy conditions!");
  }

  private applyWeatherPhysics(): void {
    // Apply reduced friction to all cars and the ball
    this.worldEntities.forEach((entity) => {
      if (entity instanceof CarEntity || entity instanceof BallEntity) {
        entity.setWeatherFrictionMultiplier(this.weatherFrictionMultiplier);
      }
    });
  }

  public override dispose(): void {
    // Hide chat input when leaving the game scene
    const chatInputElement = document.querySelector(
      "#chat-input"
    ) as HTMLInputElement | null;

    if (chatInputElement) {
      chatInputElement.setAttribute("hidden", "");
    }

    this.matchActionsLogUnsubscribe?.();
    this.matchActionsLogUnsubscribe = null;
    this.matchActionsLogService.clear();

    // Remove NPC car if present
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
