import type {
  MultiplayerGameEntity,
  StaticMultiplayerGameEntity,
} from "../entities/multiplayer-game-entity.js";
import { ScreenType } from "../../enums/screen-type.js";
import type { GameScreen } from "./game-screen.js";
import type { ObjectType } from "../../enums/object-type.js";

export interface MultiplayerScreen extends GameScreen {
  getTypeId(): ScreenType;
  getSyncableObjects(): MultiplayerGameEntity[];
  getSyncableObjectClass(
    typeId: ObjectType
  ): StaticMultiplayerGameEntity | null;
  getSyncableObject(objectId: string): MultiplayerGameEntity | null;
}
