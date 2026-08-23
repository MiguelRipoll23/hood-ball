import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { AnimationComponent } from "../../engine/components/animation-component.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import type { UserScore } from "../interfaces/responses/user-scores-response-interface.js";
import { RankingTableScript } from "../scripts/ranking-table-script.js";

export class RankingTableEntity extends BaseGameEntity {
  private readonly script: RankingTableScript;

  constructor() {
    super();
    const anim = this.addComponent(new AnimationComponent());
    this.script = new RankingTableScript();
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveAnimation(anim);
  }

  public setRanking(ranking: UserScore[]): void { this.script.ranking = ranking; }
  public fadeIn(seconds: number): void { this.script.fadeIn(seconds); }
}
