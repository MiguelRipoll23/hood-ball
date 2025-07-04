import { BaseGameScreen } from "../../core/scenes/base-game-screen.js";
import { MainMenuScreen } from "./main-menu-screen.js";
import { CryptoService } from "../../services/security/crypto-service.js";
import { WebSocketService } from "../../services/network/websocket-service.js";
import { APIService } from "../../services/network/api-service.js";
import { GameState } from "../../core/services/game-state.js";
import { EventType } from "../../enums/event-type.js";
import { CredentialService } from "../../services/security/credential-service.js";
import { container } from "../../core/services/di-container.js";
import { EventConsumerService } from "../../core/services/event-consumer-service.js";
import { LoginObjectFactory } from "./login-object-factory.js";
import type { LoginObjects } from "./login-object-factory.js";
import { LoginController } from "./login-controller.js";

export class LoginScreen extends BaseGameScreen {
  private controller: LoginController;
  private credentialService: CredentialService;
  private objects: LoginObjects | null = null;
  private dialogElement: HTMLDialogElement | null = null;
  private displayNameInputElement: HTMLInputElement | null = null;
  private registerButtonElement: HTMLElement | null = null;
  private signInButtonElement: HTMLElement | null = null;

  constructor(gameState: GameState, eventConsumerService: EventConsumerService) {
    super(gameState, eventConsumerService);
    const apiService = container.get(APIService);
    const cryptoService = container.get(CryptoService);
    const webSocketService = container.get(WebSocketService);
    this.controller = new LoginController(
      apiService,
      cryptoService,
      webSocketService
    );
    this.credentialService = container.get(CredentialService);
    this.dialogElement = document.querySelector("dialog");
    this.displayNameInputElement = document.querySelector(
      "#display-name-input"
    );
    this.registerButtonElement = document.querySelector("#register-button");
    this.signInButtonElement = document.querySelector("#sign-in-button");
    this.subscribeToEvents();
  }

  public override load(): void {
    const factory = new LoginObjectFactory(this.canvas);
    this.objects = factory.createObjects();

    this.uiObjects.push(this.objects.message, this.objects.closeableMessage);

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
    this.objects?.message.hide();
    this.transitionToMainMenuScreen();
  }

  private showError(message: string): void {
    this.objects?.message.setOpacity(0);
    this.objects?.closeableMessage.show(message);
  }

  private handleErrorCloseableMessageObject(): void {
    if (this.objects?.closeableMessage.isPressed()) {
      window.location.reload();
    }
  }

  private checkForUpdates(): void {
    this.objects?.message.show("Checking for updates...");

    this.controller
      .checkForUpdates()
      .then((requiresUpdate) => {
        if (requiresUpdate) {
          return this.showError("An update is required to play the game");
        }

        this.objects?.message.hide();
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
    this.objects?.message.show("Downloading configuration...");

    this.controller
      .downloadConfiguration()
      .then(async (configuration) => {
        await this.applyConfiguration(configuration);
      })
      .catch((error) => {
        console.error(error);
        this.showError("Failed to fetch configuration");
      });
  }

  private async applyConfiguration(configuration: any): Promise<void> {
    this.gameState.getGameServer().setConfiguration(configuration);

    console.log("Configuration response (decrypted)", configuration);

    this.connectToServer();
  }

  private connectToServer(): void {
    this.objects?.message.show("Connecting to the server...");
    this.controller.connectToServer();
  }

  private transitionToMainMenuScreen(): void {
    const mainMenuScreen = new MainMenuScreen(
      this.gameState,
      container.get(EventConsumerService),
      true
    );
    mainMenuScreen.load();

    this.screenManagerService
      ?.getTransitionService()
      .crossfade(this.screenManagerService, mainMenuScreen, 0.2);
  }
}
