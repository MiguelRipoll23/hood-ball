import type {
  MultiplayerGameObject,
  StaticMultiplayerGameObject,
} from "../object/multiplayer-game-object.js";
import { ScreenType } from "../../enums/screen-type.js";
import type { GameScreen } from "./game-screen.js";
import type { ObjectType } from "../../enums/object-type.js";

export interface MultiplayerScreen extends GameScreen {
  getTypeId(): ScreenType;
  getSyncableObjects(): MultiplayerGameObject[];
  getSyncableObjectClass(
    typeId: ObjectType
  ): StaticMultiplayerGameObject | null;
  getSyncableObject(objectId: string): MultiplayerGameObject | null;
}
