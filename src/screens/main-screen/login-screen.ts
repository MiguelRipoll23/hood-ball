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
import { CredentialService } from "../../services/credential-service.js";

export class LoginScreen extends BaseGameScreen {
  private gameState: GameState;
  private apiService: APIService;
  private cryptoService: CryptoService;
  private webSocketService: WebSocketService;
  private credentialService: CredentialService;

  private messageObject: MessageObject | null = null;
  private errorCloseableMessageObject: CloseableMessageObject | null = null;

  private dialogElement: HTMLDialogElement | null = null;
  private displayNameInputElement: HTMLInputElement | null = null;
  private registerButtonElement: HTMLElement | null = null;
  private signInButtonElement: HTMLElement | null = null;

  constructor(gameController: GameController) {
    super(gameController);
    this.gameState = gameController.getGameState();
    this.apiService = gameController.getAPIService();
    this.cryptoService = gameController.getCryptoService();
    this.webSocketService = gameController.getWebSocketService();
    this.credentialService = new CredentialService(gameController);
    this.dialogElement = document.querySelector("dialog");
    this.displayNameInputElement = document.querySelector(
      "#display-name-input"
    );
    this.registerButtonElement = document.querySelector("#register-button");
    this.signInButtonElement = document.querySelector("#sign-in-button");
    this.subscribeToEvents();
  }

  public override load(): void {
    this.loadMessageObject();
    this.loadCloseableMessageObject();

    super.load();
  }

  public override onTransitionEnd(): void {
    super.onTransitionEnd();
    this.checkForUpdates();
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.handleErrorCloseableMessageObject();
    super.update(deltaTimeStamp);
  }

  private subscribeToEvents(): void {
    this.subscribeToLocalEvents();
  }

  private subscribeToLocalEvents(): void {
    this.subscribeToLocalEvent(
      EventType.ServerAuthenticated,
      this.downloadConfiguration.bind(this)
    );

    this.subscribeToLocalEvent(
      EventType.ServerConnected,
      this.handleServerConnectedEvent.bind(this)
    );
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
        this.showError("Failed to check for updates");
      });
  }

  private showDialog(): void {
    this.gameController.getGamePointer().setPreventDefault(false);

    this.displayNameInputElement?.addEventListener(
      "input",
      this.handleDisplayNameInputEvent.bind(this)
    );

    this.registerButtonElement?.addEventListener("pointerup", () => {
      const username = this.displayNameInputElement?.value ?? "";
      this.handleRegisterClick(username);
    });

    this.signInButtonElement?.addEventListener("pointerup", () => {
      this.handleSignInClick();
    });

    this.dialogElement?.showModal();
  }

  private handleDisplayNameInputEvent(): void {
    if (this.displayNameInputElement?.value.trim() === "") {
      this.registerButtonElement?.setAttribute("disabled", "true");
    } else {
      this.registerButtonElement?.removeAttribute("disabled");
    }
  }

  private handleRegisterClick(username: string): void {
    if (this.registerButtonElement?.hasAttribute("disabled")) {
      return;
    }

    this.registerButtonElement?.setAttribute("disabled", "true");

    this.credentialService
      .createCredential(username, username)
      .catch((error) => {
        console.error(error);
        alert(error.message);
        this.registerButtonElement?.removeAttribute("disabled");
      });
  }

  private async handleSignInClick(): Promise<void> {
    if (this.signInButtonElement?.hasAttribute("disabled")) {
      return;
    }

    this.signInButtonElement?.setAttribute("disabled", "true");

    this.credentialService.getCredential().catch((error) => {
      console.error(error);
      alert(error.message);
      this.signInButtonElement?.removeAttribute("disabled");
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
        this.showError("Failed to fetch configuration");
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
    mainMenuScreen.load();

    this.screenManagerService
      ?.getTransitionService()
      .crossfade(mainMenuScreen, 0.2);
  }
}
