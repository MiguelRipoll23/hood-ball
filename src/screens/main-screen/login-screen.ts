import { MessageObject } from "../../objects/common/message-object.js";
import { CryptoService } from "../../services/crypto-service.js";
import { WebSocketService } from "../../services/network/websocket-service.js";
import { APIService } from "../../services/network/api-service.js";
import { BaseGameScreen } from "../base/base-game-screen.js";
import { MainMenuScreen } from "./main-menu-screen.js";
import { CloseableMessageObject } from "../../objects/common/closeable-message-object.js";
import { GameState } from "../../models/game-state.js";
import { EventType } from "../../enums/event-type.js";
import { CredentialService } from "../../services/credential-service.js";
import { ServiceLocator } from "../../services/service-locator.js";

export class LoginScreen extends BaseGameScreen {
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

  constructor(gameState: GameState) {
    super(gameState);
    this.apiService = ServiceLocator.get(APIService);
    this.cryptoService = ServiceLocator.get(CryptoService);
    this.webSocketService = ServiceLocator.get(WebSocketService);
    this.credentialService = ServiceLocator.get(CredentialService);
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
    this.gameState.getGamePointer().setPreventDefault(false);

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
      .catch((error) =>
        this.handleCredentialError(error, this.registerButtonElement!)
      );
  }

  private handleSignInClick(): void {
    if (this.signInButtonElement?.hasAttribute("disabled")) {
      return;
    }

    this.signInButtonElement?.setAttribute("disabled", "true");

    this.credentialService
      .getCredential()
      .catch((error) =>
        this.handleCredentialError(error, this.signInButtonElement!)
      );
  }

  private handleCredentialError(
    error: Error,
    buttonElement: HTMLElement
  ): void {
    console.error(error);

    if (error.name !== "NotAllowedError") {
      alert(error.message);
    }

    buttonElement?.removeAttribute("disabled");
  }

  private downloadConfiguration(): void {
    this.gameState.getGamePointer().setPreventDefault(true);

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
    const mainMenuScreen = new MainMenuScreen(this.gameState, true);
    mainMenuScreen.load();

    this.screenManagerService
      ?.getTransitionService()
      .crossfade(this.screenManagerService, mainMenuScreen, 0.2);
  }
}
