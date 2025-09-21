import { BaseGameScene } from "../../../../core/scenes/base-game-scene.js";
import { MainMenuScene } from "../main-menu/main-menu-scene.js";
import { CryptoService } from "../../../services/security/crypto-service.js";
import { WebSocketService } from "../../../services/network/websocket-service.js";
import { APIService } from "../../../services/network/api-service.js";
import { GameState } from "../../../../core/models/game-state.js";
import { EventType } from "../../../enums/event-type.js";
import { CredentialService } from "../../../services/security/credential-service.js";
import { container } from "../../../../core/services/di-container.js";
import { EventConsumerService } from "@engine/services/events/event-consumer-service.js";
import { LoginEntityFactory } from "./login-entity-factory.js";
import type { LoginEntities } from "./login-entity-factory.js";
import { LoginController } from "./login-controller.js";
import type { ConfigurationType } from "../../../types/configuration-type.js";

export class LoginScene extends BaseGameScene {
  private controller: LoginController;
  private credentialService: CredentialService;
  private entities: LoginEntities | null = null;
  private dialogElement: HTMLDialogElement | null = null;
  private displayNameInputElement: HTMLInputElement | null = null;
  private registerButtonElement: HTMLElement | null = null;
  private signInButtonElement: HTMLElement | null = null;

  constructor(
    gameState: GameState,
    eventConsumerService: EventConsumerService
  ) {
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
    this.dialogElement = document.querySelector(
      "#player-id-dialog"
    ) as HTMLDialogElement | null;
    this.displayNameInputElement = document.querySelector(
      "#display-name-input"
    );
    this.registerButtonElement = document.querySelector("#register-button");
    this.signInButtonElement = document.querySelector("#sign-in-button");
    this.subscribeToEvents();
  }

  public override load(): void {
    const factory = new LoginEntityFactory(this.canvas);
    this.entities = factory.createEntities();

    this.uiEntities.push(
      this.entities.messageEntity,
      this.entities.closeableMessageEntity
    );

    super.load();
  }

  public override onTransitionEnd(): void {
    super.onTransitionEnd();
    this.checkForUpdates();
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.handleErrorCloseableMessageEntity();
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
    this.entities?.messageEntity.hide();
    this.transitionToMainMenuScene();
  }

  private showError(message: string): void {
    this.entities?.messageEntity.setOpacity(0);
    this.entities?.closeableMessageEntity.show(message);
  }

  private handleErrorCloseableMessageEntity(): void {
    if (this.entities?.closeableMessageEntity.isPressed()) {
      window.location.reload();
    }
  }

  private checkForUpdates(): void {
    this.entities?.messageEntity.show("Checking for updates...");

    this.controller
      .checkForUpdates()
      .then((requiresUpdate) => {
        if (requiresUpdate) {
          return this.showError("An update is required to play the game");
        }

        this.entities?.messageEntity.hide();
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
    this.entities?.messageEntity.show("Downloading configuration...");

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

  private async applyConfiguration(
    configuration: ConfigurationType
  ): Promise<void> {
    this.gameState.getGameServer().setConfiguration(configuration);

    console.log("Configuration response (decrypted)", configuration);

    this.connectToServer();
  }

  private connectToServer(): void {
    this.entities?.messageEntity.show("Connecting to the server...");
    this.controller.connectToServer();
  }

  public override resubscribeEvents(): void {
    this.subscribeToEvents();
  }

  private transitionToMainMenuScene(): void {
    const mainMenuScene = new MainMenuScene(
      this.gameState,
      container.get(EventConsumerService),
      true
    );
    mainMenuScene.load();

    this.sceneManagerService
      ?.getTransitionService()
      .crossfade(this.sceneManagerService, mainMenuScene, 0.2);
  }
}
