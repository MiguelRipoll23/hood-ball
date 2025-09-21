import { TitleEntity } from "../../../entities/common/title-entity.js";
import { ButtonEntity } from "../../../entities/common/button-entity.js";
import { RankingTableEntity } from "../../../entities/ranking-table-entity.js";
import { CloseableMessageEntity } from "../../../entities/common/closeable-message-entity.js";

export interface ScoreboardEntities {
  titleEntity: TitleEntity;
  buttonEntity: ButtonEntity;
  rankingTableEntity: RankingTableEntity;
  closeableMessageEntity: CloseableMessageEntity;
}

export class ScoreboardEntityFactory {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  public createEntities(): ScoreboardEntities {
    const titleEntity = new TitleEntity();
    titleEntity.setText("SCOREBOARD");

    const buttonEntity = new ButtonEntity(this.canvas, "Back");
    buttonEntity.setPosition(
      this.canvas.width / 2,
      this.canvas.height - 60 - 20
    );

    const rankingTableEntity = new RankingTableEntity();
    const closeableMessageEntity = new CloseableMessageEntity(this.canvas);

    return {
      titleEntity,
      buttonEntity,
      rankingTableEntity,
      closeableMessageEntity,
    };
  }
}
