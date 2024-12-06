import { MessageObject } from "../../objects/common/message-object.js";
import { CryptoService } from "../../services/crypto-service.js";
import { WebSocketService } from "../../services/websocket-service.js";
import { APIService } from "../../services/api-service.js";
import { BaseGameScreen } from "../base/base-game-screen.js";
import { MainMenuScreen } from "./main-menu-screen.js";
import { GameController } from "../../models/game-controller.js";
import { CloseableMessageObject } from "../../objects/common/closeable-message-object.js";
import { GameState } from "../../models/game-state.js";
import { EventType } from "../../enums/event-type.js";
import { EventProcessorService } from "../../services/event-processor-service.js";
import { CredentialService } from "../../services/credential-service.js";

export class LoginScreen extends BaseGameScreen {
  private gameState: GameState;
  private apiService: APIService;
  private cryptoService: CryptoService;
  private webSocketService: WebSocketService;
  private eventProcessorService: EventProcessorService;
  private credentialService: CredentialService;

  private messageObject: MessageObject | null = null;
  private errorCloseableMessageObject: CloseableMessageObject | null = null;

  private dialogElement: HTMLDialogElement | null = null;

  constructor(gameController: GameController) {
    super(gameController);

    this.gameState = gameController.getGameState();
    this.apiService = gameController.getApiService();
    this.cryptoService = gameController.getCryptoService();
    this.webSocketService = gameController.getWebSocketService();
    this.eventProcessorService = gameController.getEventProcessorService();
    this.credentialService = new CredentialService(gameController);

    this.dialogElement = document.querySelector("dialog");
  }

  public override loadObjects(): void {
    this.loadMessageObject();
    this.loadCloseableMessageObject();

    super.loadObjects();
  }

  public override hasTransitionFinished(): void {
    super.hasTransitionFinished();
    this.checkForUpdates();
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.listenForEvents();
    this.handleErrorCloseableMessageObject();
    super.update(deltaTimeStamp);
  }

  private handleServerConnectedEvent(): void {
    this.messageObject?.hide();
    this.transitionToMainMenuScreen();
  }

  private loadMessageObject(): void {
    this.messageObject = new MessageObject(this.canvas);
    this.uiObjects.push(this.messageObject);
  }

  private loadCloseableMessageObject(): void {
    this.errorCloseableMessageObject = new CloseableMessageObject(this.canvas);
    this.uiObjects.push(this.errorCloseableMessageObject);
  }

  private showError(message: string): void {
    this.messageObject?.setOpacity(0);
    this.errorCloseableMessageObject?.show(message);
  }

  private handleErrorCloseableMessageObject(): void {
    if (this.errorCloseableMessageObject?.isPressed()) {
      window.location.reload();
    }
  }

  private checkForUpdates(): void {
    this.messageObject?.show("Checking for updates...");

    this.apiService
      .checkForUpdates()
      .then((requiresUpdate) => {
        if (requiresUpdate) {
          return this.showError("An update is required to play the game");
        }

        this.messageObject?.hide();
        this.showDialog();
      })
      .catch((error) => {
        console.error(error);
        this.showError("An error occurred while checking for updates");
      });
  }

  private showDialog(): void {
    //this.credentialService.showAutofillUI();
    this.gameController.getGamePointer().setPreventDefault(false);

    const usernameElement: HTMLInputElement | null =
      document.querySelector("#username-input");

    const registerButton = document.querySelector("#register-button");

    registerButton?.addEventListener("pointerup", () => {
      const username = usernameElement?.value ?? "";
      this.handleRegisterClick(username);
    });

    const signInButton = document.querySelector("#sign-in-button");

    signInButton?.addEventListener("pointerup", () => {
      this.handleSignInClick();
    });

    this.dialogElement?.showModal();
  }

  private handleRegisterClick(username: string): void {
    if (username.trim() === "") {
      return;
    }

    this.credentialService
      .createCredential(username, username)
      .catch((error) => {
        console.error(error);
        alert(error.message);
      });
  }

  private async handleSignInClick(): Promise<void> {
    this.credentialService.getCredential().catch((error) => {
      console.error(error);
      alert(error.message);
    });
  }

  private downloadConfiguration(): void {
    this.gameController.getGamePointer().setPreventDefault(true);

    this.dialogElement?.close();
    this.messageObject?.show("Downloading configuration...");

    this.apiService
      .getConfiguration()
      .then(async (configurationResponse: ArrayBuffer) => {
        await this.applyConfiguration(configurationResponse);
      })
      .catch((error) => {
        console.error(error);
        this.showError("An error occurred while downloading configuration");
      });
  }

  private async applyConfiguration(
    configurationResponse: ArrayBuffer
  ): Promise<void> {
    const decryptedResponse = await this.cryptoService.decryptResponse(
      configurationResponse
    );

    const configuration = JSON.parse(decryptedResponse);
    this.gameState.getGameServer().setConfiguration(configuration);

    console.log("Configuration response (decrypted)", configuration);

    this.connectToServer();
  }

  private connectToServer(): void {
    this.messageObject?.show("Connecting to the server...");
    this.webSocketService.connectToServer();
  }

  private transitionToMainMenuScreen(): void {
    const mainMenuScreen = new MainMenuScreen(this.gameController, true);
    mainMenuScreen.loadObjects();

    this.screenManagerService
      ?.getTransitionService()
      .crossfade(mainMenuScreen, 0.2);
  }

  private listenForEvents(): void {
    this.eventProcessorService.listenLocalEvent(
      EventType.ServerAuthenticated,
      this.downloadConfiguration.bind(this)
    );

    this.eventProcessorService.listenLocalEvent(
      EventType.ServerConnected,
      this.handleServerConnectedEvent.bind(this)
    );
  }
}
