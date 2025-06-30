import { LocalCarObject } from "../objects/local-car-object.js";
import { WorldBackgroundObject } from "../objects/backgrounds/world-background-object.js";
import { GoalObject } from "../objects/goal-object.js";
import { BallObject } from "../objects/ball-object.js";
import { ScoreboardObject } from "../objects/scoreboard-object.js";
import { BaseCollidingGameScreen } from "./base/base-colliding-game-screen.js";
import { GameState } from "../models/game-state.js";
import { getConfigurationKey } from "../utils/configuration-utils.js";
import { SCOREBOARD_SECONDS_DURATION } from "../constants/configuration-constants.js";
import { AlertObject } from "../objects/alert-object.js";
import { ToastObject } from "../objects/common/toast-object.js";
import { TeamType } from "../enums/team-type.js";
import { RemoteCarObject } from "../objects/remote-car-object.js";
import { ObjectStateType } from "../enums/object-state-type.js";
import { GamePlayer } from "../models/game-player.js";
import { EventType } from "../enums/event-type.js";
import { RemoteEvent } from "../models/remote-event.js";
import { ScreenType } from "../enums/screen-type.js";
import { MatchStateType } from "../enums/match-state-type.js";
import type { PlayerConnectedPayload } from "../interfaces/events/player-connected-payload.js";
import type { PlayerDisconnectedPayload } from "../interfaces/events/player-disconnected-payload.js";
import { BinaryWriter } from "../utils/binary-writer-utils.js";
import { BinaryReader } from "../utils/binary-reader-utils.js";
import { MatchmakingService } from "../services/matchmaking-service.js";
import { ServiceLocator } from "../services/service-locator.js";
import { EventProcessorService } from "../services/event-processor-service.js";
import { ObjectOrchestratorService } from "../services/object-orchestrator-service.js";
import { ScreenTransitionService } from "../services/screen-transition-service.js";
import { TimerManagerService } from "../services/timer-manager-service.js";

export class WorldScreen extends BaseCollidingGameScreen {
  private readonly COUNTDOWN_START_NUMBER = 4;

  private readonly screenTransitionService: ScreenTransitionService;
  private readonly timerManagerService: TimerManagerService;
  private readonly matchmakingService: MatchmakingService;
  private readonly eventProcessorService: EventProcessorService;
  private readonly objectOrchestrator: ObjectOrchestratorService;

  private scoreboardObject: ScoreboardObject | null = null;
  private localCarObject: LocalCarObject | null = null;
  private ballObject: BallObject | null = null;
  private goalObject: GoalObject | null = null;
  private alertObject: AlertObject | null = null;
  private toastObject: ToastObject | null = null;

  private countdownCurrentNumber = this.COUNTDOWN_START_NUMBER;

  constructor(protected gameState: GameState) {
    super(gameState);
    this.gameState.getGamePlayer().reset();
    this.screenTransitionService = ServiceLocator.get(ScreenTransitionService);
    this.timerManagerService = ServiceLocator.get(TimerManagerService);
    this.matchmakingService = ServiceLocator.get(MatchmakingService);
    this.objectOrchestrator = ServiceLocator.get(ObjectOrchestratorService);
    this.eventProcessorService = ServiceLocator.get(EventProcessorService);
    this.addSyncableObjects();
    this.subscribeToEvents();
  }

  public override load(): void {
    this.createBackgroundObject();
    this.createScoreboardObject();
    this.createPlayerAndLocalCarObjects();
    this.createBallObject();
    this.createGoalObject();
    this.createAlertObject();
    this.createToastObject();
    super.load();
  }

  public override getTypeId(): ScreenType {
    return ScreenType.World;
  }

  public override onTransitionEnd(): void {
    super.onTransitionEnd();

    this.scoreboardObject?.reset();
    this.toastObject?.show("Finding sessions...");
    this.matchmakingService
      .findOrAdvertiseMatch()
      .catch(this.handleMatchmakingError.bind(this));
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    super.update(deltaTimeStamp);

    this.handleMatchState();
    this.detectScoresIfHost();

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

  private handleMatchState(): void {
    const matchState = this.gameState.getMatch()?.getState();

    if (matchState === MatchStateType.InProgress) {
      this.localCarObject?.setActive(true);
      this.scoreboardObject?.setActive(true);
      this.ballObject?.setInactive(false);
    } else {
      // Pause timer if not in progress
      this.scoreboardObject?.setActive(false);
    }

    // Block local car and ball if countdown
    if (matchState === MatchStateType.Countdown) {
      this.ballObject?.setInactive(true);
      this.localCarObject?.setActive(false);
    }
  }

  private addSyncableObjects(): void {
    this.addSyncableObject(RemoteCarObject);
  }

  private createBackgroundObject() {
    const backgroundObject = new WorldBackgroundObject(this.canvas);
    this.sceneObjects.push(backgroundObject);

    backgroundObject.getCollisionHitboxes().forEach((object) => {
      this.sceneObjects.push(object);
    });
  }

  private handleMatchAdvertised(): void {
    if (this.gameState.getMatch()?.getPlayers().length === 1) {
      this.toastObject?.show("Waiting for players...");
    }
  }

  private handlePlayerConnection(payload: PlayerConnectedPayload): void {
    const { player, matchmaking } = payload;

    this.toastObject?.hide();

    if (matchmaking) {
      this.toastObject?.show(`Joined to <em>${player.getName()}</em>`, 2);
      this.updateScoreboard();
    } else {
      this.toastObject?.show(`<em>${player.getName()}</em> joined`, 2);

      const matchState = this.gameState.getMatch()?.getState();

      if (matchState === MatchStateType.WaitingPlayers) {
        this.showCountdown();
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

    this.updateScoreboard();
  }

  private createScoreboardObject() {
    const durationSeconds: number = getConfigurationKey<number>(
      SCOREBOARD_SECONDS_DURATION,
      60,
      this.gameState
    );

    this.scoreboardObject = new ScoreboardObject(this.canvas);
    this.scoreboardObject.setTimerDuration(durationSeconds);
    this.sceneObjects.push(this.scoreboardObject);
  }

  private createBallObject() {
    this.ballObject = new BallObject(0, 0, this.canvas);
    this.ballObject.setCenterPosition();

    this.sceneObjects.push(this.ballObject);
  }

  private createGoalObject() {
    this.goalObject = new GoalObject(this.canvas);
    this.sceneObjects.push(this.goalObject);
  }

  private createPlayerAndLocalCarObjects() {
    const gamePointer = this.gameState.getGamePointer();
    const gameKeyboard = this.gameState.getGameKeyboard();
    const gameGamepad = this.gameState.getGameGamepad();

    this.localCarObject = new LocalCarObject(
      0,
      0,
      1.5708,
      this.canvas,
      gamePointer,
      gameKeyboard,
      gameGamepad
    );

    this.localCarObject.setOwner(this.gameState.getGamePlayer());
    this.localCarObject.setCanvas(this.canvas);
    this.localCarObject.setCenterPosition();

    // Scene
    this.sceneObjects.push(this.localCarObject);

    // UI
    this.uiObjects.push(this.localCarObject.getJoystickObject());
  }

  private createAlertObject() {
    this.alertObject = new AlertObject(this.canvas);
    this.uiObjects.push(this.alertObject);
  }

  private createToastObject() {
    this.toastObject = new ToastObject(this.canvas);
    this.sceneObjects.push(this.toastObject);
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
      this.handleRemoteCountdown.bind(this)
    );

    this.subscribeToRemoteEvent(
      EventType.GoalScored,
      this.handleRemoteGoal.bind(this)
    );

    this.subscribeToRemoteEvent(
      EventType.GameOver,
      this.handleRemoteGameOverStartEvent.bind(this)
    );
  }

  private showCountdown() {
    const match = this.gameState.getMatch();
    const isHost = match?.isHost();

    match?.setState(MatchStateType.Countdown);
    console.log("Countdown tick:", this.countdownCurrentNumber);

    // Reset game every countdown tick
    this.resetForCountdown();

    // Send event to other players
    if (isHost) {
      this.sendCountdownEvent();
    }

    // Show countdown text to players
    if (this.countdownCurrentNumber >= 2) {
      const displayNumber = this.countdownCurrentNumber - 1; // 4→3, 3→2, 2→1
      this.alertObject?.show([displayNumber.toString()], "#FFFF00");
    } else if (this.countdownCurrentNumber === 1) {
      this.alertObject?.show(["GO!"], "#FFFF00");
    } else {
      // Reached 0 → Start the game
      return this.handleCountdownEnd();
    }

    // Schedule next countdown tick
    this.countdownCurrentNumber -= 1;

    if (isHost) {
      this.timerManagerService.createTimer(1, this.showCountdown.bind(this));
    }
  }

  private resetForCountdown() {
    this.ballObject?.reset();
    this.localCarObject?.reset();
  }

  private handleRemoteCountdown(arrayBuffer: ArrayBuffer | null) {
    if (arrayBuffer === null) {
      return console.warn("Array buffer is null");
    }

    // Check if we are receiving a countdown event as host
    if (this.gameState.getMatch()?.isHost()) {
      return console.warn("Host should not receive countdown event");
    }

    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);
    const countdownNumber = binaryReader.unsignedInt8();

    this.countdownCurrentNumber = countdownNumber;
    this.showCountdown();
  }

  private handleCountdownEnd() {
    console.log("Countdown end");
    this.gameState.getMatch()?.setState(MatchStateType.InProgress);

    this.alertObject?.hide();
    this.localCarObject?.reset();
    this.ballObject?.reset();
    this.scoreboardObject?.startTimer();
  }

  private sendCountdownEvent() {
    const arrayBuffer = BinaryWriter.build()
      .unsignedInt8(this.countdownCurrentNumber)
      .toArrayBuffer();

    const countdownEvent = new RemoteEvent(EventType.Countdown);
    countdownEvent.setData(arrayBuffer);

    this.eventProcessorService.sendEvent(countdownEvent);
  }

  private handleWaitingForPlayers(): void {
    this.gameState.getMatch()?.setState(MatchStateType.WaitingPlayers);
    this.scoreboardObject?.stopTimer();
  }

  private detectScoresIfHost(): void {
    const host = this.gameState.getMatch()?.isHost() ?? false;
    const matchState = this.gameState.getMatch()?.getState();

    if (host && matchState === MatchStateType.InProgress) {
      this.detectScores();
      this.detectGameEnd();
    }
  }

  private detectScores(): void {
    if (this.ballObject === null) {
      return;
    }

    const playersCount = this.gameState.getMatch()?.getPlayers().length ?? 0;

    if (playersCount < 2) {
      return;
    }

    const goalScored = this.goalObject
      ?.getCollidingObjects()
      .includes(this.ballObject);

    if (goalScored) {
      this.handleGoalScored();
    }
  }

  private handleGoalScored() {
    const player = this.ballObject?.getLastPlayer() ?? null;

    if (player === null) {
      return console.warn("Player is null");
    }

    // Pause timer
    this.scoreboardObject?.stopTimer();

    // Mark ball as inactive
    this.ballObject?.handleGoalScored();

    // Update match state
    this.gameState.getMatch()?.setState(MatchStateType.GoalScored);

    // Score
    player.sumScore(1);

    // Event
    this.sendGoalEvent(player);

    // Scoreboard
    const goalTeam =
      player === this.gameState.getGamePlayer() ? TeamType.Blue : TeamType.Red;

    if (goalTeam === TeamType.Blue) {
      this.scoreboardObject?.incrementBlueScore();
    } else if (goalTeam === TeamType.Red) {
      this.scoreboardObject?.incrementRedScore();
    }

    // Alert
    this.showGoalAlert(player, goalTeam);

    // Timer
    this.timerManagerService.createTimer(5, this.handleGoalTimeEnd.bind(this));
  }

  private sendGoalEvent(player: GamePlayer) {
    const playerId: string = player.getId();
    const playerScore: number = player.getScore();

    const payload = BinaryWriter.build()
      .fixedLengthString(playerId, 32)
      .unsignedInt8(playerScore)
      .toArrayBuffer();

    const goalEvent = new RemoteEvent(EventType.GoalScored);
    goalEvent.setData(payload);

    this.eventProcessorService.sendEvent(goalEvent);
  }

  private updateScoreboard() {
    const players = this.gameState.getMatch()?.getPlayers() ?? [];

    let totalScore = 0;

    players.forEach((player) => {
      const score = player.getScore();
      if (player === this.gameState.getGamePlayer()) {
        return this.scoreboardObject?.setBlueScore(score);
      }

      totalScore += score;
    });

    this.scoreboardObject?.setRedScore(totalScore);
  }

  private showGoalAlert(
    player: GamePlayer | null | undefined,
    goalTeam: TeamType
  ) {
    const playerName = player?.getName().toUpperCase() || "UNKNOWN";

    let color = "white";

    if (goalTeam === TeamType.Blue) {
      color = "blue";
    } else if (goalTeam === TeamType.Red) {
      color = "red";
    }

    this.alertObject?.show([playerName, "SCORED!"], color);
  }

  private handleRemoteGoal(arrayBuffer: ArrayBuffer | null) {
    if (arrayBuffer === null) {
      return console.warn("Array buffer is null");
    }

    // Check if we are receiving a goal event as host
    if (this.gameState.getMatch()?.isHost()) {
      return console.warn("Host should not receive goal event");
    }

    // Pause timer
    this.scoreboardObject?.stopTimer();

    // Mark ball as inactive
    this.ballObject?.handleGoalScored();

    // Update match state
    this.gameState.getMatch()?.setState(MatchStateType.GoalScored);

    // Score
    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);
    const playerId = binaryReader.fixedLengthString(32);
    const playerScore = binaryReader.unsignedInt8();

    const player = this.gameState.getMatch()?.getPlayer(playerId) ?? null;
    player?.setScore(playerScore);

    // Score
    this.updateScoreboard();

    // Alert
    let team: TeamType = TeamType.Red;

    if (player === this.gameState.getGamePlayer()) {
      team = TeamType.Blue;
    }

    this.showGoalAlert(player, team);
  }

  private handleGoalTimeEnd() {
    if (this.scoreboardObject?.hasTimerFinished() === true) {
      return;
    }

    this.countdownCurrentNumber = this.COUNTDOWN_START_NUMBER;
    this.showCountdown();
  }

  private detectGameEnd() {
    if (this.gameState.getMatch()?.getState() === MatchStateType.GameOver) {
      return;
    }

    if (this.scoreboardObject?.hasTimerFinished() === true) {
      this.handleTimerEnd();
    }
  }

  private handleTimerEnd(): void {
    // Get all players and find the best player
    const players = this.gameState.getMatch()?.getPlayers() || [];

    // Find the player with the highest score
    let winner = this.gameState.getGamePlayer();

    for (const player of players) {
      if (player.getScore() > winner.getScore()) {
        winner = player;
      }
    }

    // Check for a tie among all players
    const isTie = players.every(
      (player) => player.getScore() === winner.getScore()
    );

    if (isTie) {
      return;
    }

    this.sendGameOverStartEvent(winner);
    this.handleGameOverStart(winner);
  }

  private sendGameOverStartEvent(winner: GamePlayer): void {
    const playerId: string = winner.getId();
    const payload = BinaryWriter.build()
      .fixedLengthString(playerId, 32)
      .toArrayBuffer();

    const gameOverStartEvent = new RemoteEvent(EventType.GameOver);
    gameOverStartEvent.setData(payload);

    this.eventProcessorService.sendEvent(gameOverStartEvent);
  }

  private handleRemoteGameOverStartEvent(
    arrayBuffer: ArrayBuffer | null
  ): void {
    if (arrayBuffer === null) {
      return console.warn("Array buffer is null");
    }

    // Check if we are receiving a game over event as host
    if (this.gameState.getMatch()?.isHost()) {
      return console.warn("Host should not receive game over event");
    }

    const playerId = new TextDecoder().decode(arrayBuffer);
    const player = this.gameState.getMatch()?.getPlayer(playerId) ?? null;

    this.handleGameOverStart(player);
  }

  private handleGameOverStart(winner: GamePlayer | null) {
    this.gameState.getMatch()?.setState(MatchStateType.GameOver);

    // Determine winner details and show alert
    const playerName = winner?.getName().toUpperCase() ?? "UNKNOWN";
    const playerTeam =
      winner === this.gameState.getGamePlayer() ? "blue" : "red";

    this.alertObject?.show([playerName, "WINS!"], playerTeam);

    // Timer
    this.timerManagerService.createTimer(5, this.handleGameOverEnd.bind(this));

    // Save player scores if host
    if (this.gameState.getMatch()?.isHost()) {
      this.matchmakingService.savePlayerScore();
    }
  }

  private handleGameOverEnd() {
    console.log("Game over end");

    this.matchmakingService.handleGameOver();
    void this.returnToMainMenuScreen();
  }

  private async returnToMainMenuScreen(): Promise<void> {
    const { MainScreen } = await import("./main-screen.js");
    const { MainMenuScreen } = await import(
      "./main-screen/main-menu-screen.js"
    );

    const mainScreen = new MainScreen(this.gameState);
    const mainMenuScreen = new MainMenuScreen(this.gameState, false);

    mainScreen.activateScreen(mainMenuScreen);
    mainScreen.load();

    this.screenTransitionService.fadeOutAndIn(mainScreen, 1, 1);
  }
}
