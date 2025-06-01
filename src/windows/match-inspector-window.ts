import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import type { GameController } from "../models/game-controller";
import { BaseWindow } from "./base-window";
import { MatchStateType } from "../enums/match-state-type";
import type { GamePlayer } from "../models/game-player";

export class MatchInspectorWindow extends BaseWindow {
  private static readonly HOST_COLOR = 0xffffff00;

  constructor(private gameController: GameController) {
    super("Match inspector", new ImVec2(500, 300));
    console.log(`${this.constructor.name} created`);
  }

  protected override renderContent(): void {
    const match = this.gameController.getGameState().getMatch();

    if (match === null) {
      ImGui.Text("No active match.");
      return;
    }

    ImGui.Text(`State: ${MatchStateType[match.getState()]}`);
    ImGui.Text(`Slots: ${match.getPlayers().length}/${match.getTotalSlots()}`);

    if (ImGui.CollapsingHeader("Attributes", ImGui.TreeNodeFlags.DefaultOpen)) {
      this.renderMatchAttributes(match.getAttributes());
    }

    if (
      ImGui.CollapsingHeader("Player list", ImGui.TreeNodeFlags.DefaultOpen)
    ) {
      ImGui.PushStyleColor(ImGui.Col.Text, MatchInspectorWindow.HOST_COLOR);
      ImGui.Text("Host");
      ImGui.PopStyleColor();
      ImGui.SameLine(0, 20);
      ImGui.Text("Player");

      this.renderPlayersTable(match.getPlayers());
    }
  }

  private renderMatchAttributes(attributes: Record<string, any>) {
    for (const [key, value] of Object.entries(attributes)) {
      ImGui.Text(`${key}: ${value}`);
    }
  }

  private renderPlayersTable(players: GamePlayer[]) {
    const tableFlags =
      ImGui.TableFlags.BordersOuter |
      ImGui.TableFlags.RowBg |
      ImGui.TableFlags.Resizable |
      ImGui.TableFlags.ScrollY |
      ImGui.TableFlags.ScrollX |
      ImGui.TableFlags.SizingFixedFit;

    if (!ImGui.BeginTable("PlayersTable", 4, tableFlags)) return;

    ImGui.TableSetupColumn("#");
    ImGui.TableSetupColumn("ID");
    ImGui.TableSetupColumn("Name");
    ImGui.TableSetupColumn("Score");
    ImGui.TableHeadersRow();

    players.forEach((player, index) => {
      const isHost = player.isHost();
      ImGui.TableNextRow();

      const columns = [
        () => ImGui.Text((index + 1).toString()),
        () => ImGui.Text(player.getId()),
        () => ImGui.Text(player.getName()),
        () => ImGui.Text(player.getScore().toString()),
      ];

      columns.forEach((renderColumn, colIndex) => {
        ImGui.TableSetColumnIndex(colIndex);

        if (isHost)
          ImGui.PushStyleColor(ImGui.Col.Text, MatchInspectorWindow.HOST_COLOR);
        renderColumn();
        if (isHost) ImGui.PopStyleColor();
      });
    });

    ImGui.EndTable();
  }
}
