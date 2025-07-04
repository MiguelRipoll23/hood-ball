import { LocalCarObject } from "../../objects/local-car-object.js";
import { GoalObject } from "../../objects/goal-object.js";
import { BallObject } from "../../objects/ball-object.js";
import { ScoreboardObject } from "../../objects/scoreboard-object.js";
import { AlertObject } from "../../objects/alert-object.js";
import { ToastObject } from "../../objects/common/toast-object.js";
import { BaseCollidingGameScreen } from "../base/base-colliding-game-screen.js";
import { GameState } from "../../models/game-state.js";
import { RemoteCarObject } from "../../objects/remote-car-object.js";
import { ObjectStateType } from "../../enums/object-state-type.js";
import { EventType } from "../../enums/event-type.js";
import { ScreenType } from "../../enums/screen-type.js";
import { MatchStateType } from "../../enums/match-state-type.js";
import type { PlayerConnectedPayload } from "../../interfaces/events/player-connected-payload.js";
import type { PlayerDisconnectedPayload } from "../../interfaces/events/player-disconnected-payload.js";
import type { IMatchmakingProvider } from "../../interfaces/services/matchmaking-provider.js";
import { MatchmakingService } from "../../services/gameplay/matchmaking-service.js";
import { MatchmakingControllerService } from "../../services/gameplay/matchmaking-controller-service.js";
import { ScoreManagerService } from "../../services/gameplay/score-manager-service.js";
import { EventProcessorService } from "../../services/gameplay/event-processor-service.js";
import { ObjectOrchestratorService } from "../../services/gameplay/object-orchestrator-service.js";
import { ScreenTransitionService } from "../../services/ui/screen-transition-service.js";
import { TimerManagerService } from "../../services/gameplay/timer-manager-service.js";
import { MainScreen } from "../main-screen/main-screen.js";
import { MainMenuScreen } from "../main-screen/main-menu-screen.js";
import { container } from "../../services/di-container.js";
import { EventConsumerService } from "../../services/gameplay/event-consumer-service.js";
import { WorldObjectFactory } from "./world-object-factory.js";
import { MatchFlowController } from "./match-flow-controller.js";

export class WorldScreen extends BaseCollidingGameScreen {

  private readonly screenTransitionService: ScreenTransitionService;
  private readonly timerManagerService: TimerManagerService;
  private readonly matchmakingService: IMatchmakingProvider;
  private readonly matchmakingController: MatchmakingControllerService;
  private readonly eventProcessorService: EventProcessorService;
  private readonly objectOrchestrator: ObjectOrchestratorService;

  private scoreboardObject: ScoreboardObject | null = null;
  private localCarObject: LocalCarObject | null = null;
  private ballObject: BallObject | null = null;
  private goalObject: GoalObject | null = null;
  private alertObject: AlertObject | null = null;
  private toastObject: ToastObject | null = null;
  private scoreManagerService: ScoreManagerService | null = null;
  private matchFlowController: MatchFlowController | null = null;

  constructor(protected gameState: GameState, eventConsumerService: EventConsumerService) {
    super(gameState, eventConsumerService);
    this.gameState.getGamePlayer().reset();
    this.screenTransitionService = container.get(ScreenTransitionService);
    this.timerManagerService = container.get(TimerManagerService);
    this.matchmakingService = container.get(MatchmakingService);
    this.matchmakingController = container.get(
      MatchmakingControllerService
    );
    this.objectOrchestrator = container.get(ObjectOrchestratorService);
    this.eventProcessorService = container.get(EventProcessorService);
    this.addSyncableObjects();
    this.subscribeToEvents();
  }

  public override load(): void {
    const factory = new WorldObjectFactory(this.gameState, this.canvas);
    factory.createBackground(this.sceneObjects);
    const objects = factory.createWorldObjects(this.sceneObjects, this.uiObjects);

    this.scoreboardObject = objects.scoreboard;
    this.localCarObject = objects.localCar;
    this.ballObject = objects.ball;
    this.goalObject = objects.goal;
    this.alertObject = objects.alert;
    this.toastObject = objects.toast;

    this.matchFlowController = new MatchFlowController(
      this.gameState,
      this.timerManagerService,
      this.eventProcessorService,
      this.matchmakingService,
      this.scoreboardObject,
      this.ballObject,
      this.localCarObject,
      this.alertObject
    );

    this.scoreManagerService = new ScoreManagerService(
      this.gameState,
      this.ballObject,
      this.goalObject,
      this.scoreboardObject,
      this.alertObject,
      this.timerManagerService,
      this.eventProcessorService,
      this.matchmakingService,
      this.matchFlowController.handleGoalTimeEnd.bind(this.matchFlowController),
      () => {
        this.matchFlowController?.handleGameOverEnd();
        void this.returnToMainMenuScreen();
      }
    );
    super.load();
  }

  public override getTypeId(): ScreenType {
    return ScreenType.World;
  }

  public override onTransitionEnd(): void {
    super.onTransitionEnd();

    this.scoreboardObject?.reset();
    this.matchmakingController
      .startMatchmaking()
      .catch(this.handleMatchmakingError.bind(this));
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    super.update(deltaTimeStamp);

    this.matchFlowController?.handleMatchState();
    this.scoreManagerService?.detectScoresIfHost();

    this.objectOrchestrator.sendLocalData(this, deltaTimeStamp);
  }

  private handleMatchmakingError(error: Error) {
    console.error("Matchmaking error", error);

    alert(
      "Could not find or advertise match, returning to main screen menu..."
    );

    this.gameState.setMatch(null);
    void this.returnToMainMenuScreen();
  }

  private addSyncableObjects(): void {
    this.addSyncableObject(RemoteCarObject);
  }

  private handleMatchAdvertised(): void {
    if (this.gameState.getMatch()?.getPlayers().length === 1) {
      this.toastObject?.show("Waiting for players...");
    }
  }

  private handleMatchmakingStarted(): void {
    this.toastObject?.show("Finding sessions...");
  }

  private handlePlayerConnection(payload: PlayerConnectedPayload): void {
    const { player, matchmaking } = payload;

    this.toastObject?.hide();

    if (matchmaking) {
      this.toastObject?.show(`Joined to <em>${player.getName()}</em>`, 2);
      this.scoreManagerService?.updateScoreboard();
    } else {
      this.toastObject?.show(`<em>${player.getName()}</em> joined`, 2);

      const matchState = this.gameState.getMatch()?.getState();

      if (matchState === MatchStateType.WaitingPlayers) {
        this.matchFlowController?.showCountdown();
      }
    }
  }

  private handlePlayerDisconnection(payload: PlayerDisconnectedPayload): void {
    const { player } = payload;

    this.getObjectsByOwner(player).forEach((object) => {
      object.setState(ObjectStateType.Inactive);
    });

    this.toastObject?.show(`<em>${player.getName()}</em> left`, 2);

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
  }

  private handleWaitingForPlayers(): void {
    this.matchFlowController?.handleWaitingForPlayers();
  }

  private async returnToMainMenuScreen(): Promise<void> {
    const mainScreen = new MainScreen(
      this.gameState,
      container.get(EventConsumerService)
    );
    const mainMenuScreen = new MainMenuScreen(
      this.gameState,
      container.get(EventConsumerService),
      false
    );

    mainScreen.activateScreen(mainMenuScreen);
    mainScreen.load();

    this.screenTransitionService.fadeOutAndIn(
      this.gameState.getGameFrame(),
      mainScreen,
      1,
      1
    );
  }
}
