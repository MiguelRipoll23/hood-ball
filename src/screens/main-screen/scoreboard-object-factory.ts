import { TitleObject } from "../../objects/common/title-object.js";
import { ButtonObject } from "../../objects/common/button-object.js";
import { RankingTableObject } from "../../objects/ranking-table-object.js";
import { CloseableMessageObject } from "../../objects/common/closeable-message-object.js";

export interface ScoreboardObjects {
  title: TitleObject;
  button: ButtonObject;
  rankingTable: RankingTableObject;
  closeableMessage: CloseableMessageObject;
}

export class ScoreboardObjectFactory {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  public createObjects(): ScoreboardObjects {
    const titleObject = new TitleObject();
    titleObject.setText("SCOREBOARD");

    const buttonObject = new ButtonObject(this.canvas, "Back");
    buttonObject.setPosition(this.canvas.width / 2, this.canvas.height - 60 - 20);

    const rankingTableObject = new RankingTableObject();
    const closeableMessageObject = new CloseableMessageObject(this.canvas);

    return {
      title: titleObject,
      button: buttonObject,
      rankingTable: rankingTableObject,
      closeableMessage: closeableMessageObject,
    };
  }
}
