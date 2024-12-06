import {
  MultiplayerGameObject,
  StaticMultiplayerGameObject,
} from "../object/multiplayer-game-object.js";
import { ScreenType } from "../../enums/screen-type.js";
import { GameScreen } from "./game-screen.js";

export interface MultiplayerScreen extends GameScreen {
  getTypeId(): ScreenType;
  getSyncableObjects(): MultiplayerGameObject[];
  getSyncableObjectClass(typeId: number): StaticMultiplayerGameObject | null;
  getSyncableObject(objectId: string): MultiplayerGameObject | null;
}
