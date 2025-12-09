import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import { BaseWindow } from "../../engine/debug/base-window.js";
import { MatchStateType } from "../enums/match-state-type.js";
import type { GamePlayer } from "../models/game-player.js";
import { getPingTextColor } from "../utils/ping-utils.js";
import { gameContext } from "../context/game-context.js";
import { MatchSessionService } from "../services/session/match-session-service.js";

export class MatchInspectorWindow extends BaseWindow {
  private static readonly HOST_COLOR = 0xffffff00;

  constructor() {
    super("Match inspector", new ImVec2(450, 300));
    console.log(`${this.constructor.name} created`);
  }

  protected override renderContent(): void {
    const match = gameContext.get(MatchSessionService).getMatch();

    if (match === null) {
      ImGui.Text("No active match.");
      return;
    }

    ImGui.Text(`State: ${MatchStateType[match.getState()]}`);
    ImGui.Text(`Slots: ${match.getPlayers().length}/${match.getTotalSlots()}`);
    const pingMedian = match.getPingMedianMilliseconds();
    ImGui.Text("Ping median (milliseconds):");
    ImGui.SameLine();
    if (pingMedian === null) {
      ImGui.Text("--");
    } else {
      ImGui.PushStyleColor(ImGui.Col.Text, getPingTextColor(pingMedian));
      ImGui.Text(`${pingMedian} ms`);
      ImGui.PopStyleColor();
    }

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
      ImGui.TableFlags.SizingStretchProp;

    if (!ImGui.BeginTable("PlayersTable", 4, tableFlags)) return;

    ImGui.TableSetupColumn("#", ImGui.TableColumnFlags.WidthFixed, 20);
    ImGui.TableSetupColumn("ID", ImGui.TableColumnFlags.WidthStretch);
    ImGui.TableSetupColumn("Name", ImGui.TableColumnFlags.WidthStretch);
    ImGui.TableSetupColumn("Score", ImGui.TableColumnFlags.WidthFixed, 40);

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
