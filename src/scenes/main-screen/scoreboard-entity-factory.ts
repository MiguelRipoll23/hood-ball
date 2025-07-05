import { TitleEntity } from "../../entities/common/title-entity.js";
import { ButtonEntity } from "../../entities/common/button-entity.js";
import { RankingTableEntity } from "../../entities/ranking-table-entity.js";
import { CloseableMessageEntity } from "../../entities/common/closeable-message-entity.js";

export interface ScoreboardEntities {
  title: TitleEntity;
  button: ButtonEntity;
  rankingTable: RankingTableEntity;
  closeableMessage: CloseableMessageEntity;
}

export class ScoreboardEntityFactory {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  public createObjects(): ScoreboardEntities {
    const titleObject = new TitleEntity();
    titleObject.setText("SCOREBOARD");

    const buttonObject = new ButtonEntity(this.canvas, "Back");
    buttonObject.setPosition(this.canvas.width / 2, this.canvas.height - 60 - 20);

    const rankingTableObject = new RankingTableEntity();
    const closeableMessageEntity = new CloseableMessageEntity(this.canvas);

    return {
      title: titleObject,
      button: buttonObject,
      rankingTable: rankingTableObject,
      closeableMessage: closeableMessageEntity,
    };
  }
}
