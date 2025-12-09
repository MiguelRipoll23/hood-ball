import { TitleEntity } from "../../../entities/common/title-entity.js";
import { MenuOptionEntity } from "../../../entities/common/menu-option-entity.js";
import { ServerMessageWindowEntity } from "../../../entities/server-message-window-entity.js";
import { CloseableMessageEntity } from "../../../entities/common/closeable-message-entity.js";
import { OnlinePlayersEntity } from "../../../entities/online-players-entity.js";
import { WelcomeMessageEntity } from "../../../entities/welcome-message-entity.js";
import { ToastEntity } from "../../../entities/common/toast-entity.js";

export interface MainMenuEntities {
  titleEntity: TitleEntity;
  menuOptionEntities: MenuOptionEntity[];
  serverMessageWindowEntity: ServerMessageWindowEntity;
  closeableMessageEntity: CloseableMessageEntity;
  welcomeMessageEntity: WelcomeMessageEntity;
  onlinePlayersEntity: OnlinePlayersEntity;
  toastEntity: ToastEntity;
}

export class MainMenuEntityFactory {
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly menuOptionsText: string[],
    private readonly onlineRequiredButtons: Set<number>
  ) {}

  public createEntities(): MainMenuEntities {
    const titleEntity = new TitleEntity();
    titleEntity.setText("MAIN MENU");

    const menuOptionEntities: MenuOptionEntity[] = [];
    let y = 100;
    for (let i = 0; i < this.menuOptionsText.length; i++) {
      const text = this.menuOptionsText[i];
      const menuOptionEntity = new MenuOptionEntity(this.canvas, i, text);
      menuOptionEntity.setPosition(30, y);

      // Set online connection requirement
      if (this.onlineRequiredButtons.has(i)) {
        menuOptionEntity.setRequiresOnlineConnection(true);
      }

      menuOptionEntities.push(menuOptionEntity);
      y += menuOptionEntity.getHeight() + 30;
    }

    const serverMessageWindowEntity = new ServerMessageWindowEntity(
      this.canvas
    );
    const closeableMessageEntity = new CloseableMessageEntity(this.canvas);
    const welcomeMessageEntity = new WelcomeMessageEntity(this.canvas);
    const onlinePlayersEntity = new OnlinePlayersEntity(this.canvas);
    const toastEntity = new ToastEntity(this.canvas);

    return {
      titleEntity,
      menuOptionEntities,
      serverMessageWindowEntity,
      closeableMessageEntity,
      welcomeMessageEntity,
      onlinePlayersEntity,
      toastEntity,
    };
  }
}
