import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import type { GameController } from "../models/game-controller.js";
import { BaseWindow } from "./base-window.js";

export class PeerInspectorWindow extends BaseWindow {
  private static readonly COLOR_CONNECTED_STATE = 0xff00ff00;
  private static readonly COLOR_OTHER_STATE = 0xffffffff;

  constructor(private gameController: GameController) {
    super("Peer inspector", new ImVec2(500, 300));
    console.log(`${this.constructor.name} created`);
  }

  protected override renderContent(): void {
    const peers = this.gameController.getWebRTCService().getPeers();

    ImGui.Text("Total: " + peers.length);

    const tableFlags =
      ImGui.TableFlags.Borders |
      ImGui.TableFlags.RowBg |
      ImGui.TableFlags.Resizable |
      ImGui.TableFlags.ScrollY |
      ImGui.TableFlags.ScrollX |
      ImGui.TableFlags.SizingStretchSame;

    if (ImGui.BeginTable("PeersTable", 3, tableFlags)) {
      ImGui.TableSetupColumn("Token / ID");
      ImGui.TableSetupColumn("Ping (ms)");
      ImGui.TableSetupColumn("State");
      ImGui.TableHeadersRow();

      for (const peer of peers) {
        ImGui.TableNextRow();

        ImGui.TableSetColumnIndex(0);
        ImGui.Text(peer.getPlayer()?.getId() ?? peer.getToken());

        ImGui.TableSetColumnIndex(1);
        ImGui.Text(`${peer.getPingTime().toFixed(0)}`);

        ImGui.TableSetColumnIndex(2);
        const isConnected = peer.isConnected();
        const color = isConnected
          ? PeerInspectorWindow.COLOR_CONNECTED_STATE
          : PeerInspectorWindow.COLOR_OTHER_STATE;
        ImGui.PushStyleColor(ImGui.Col.Text, color);
        ImGui.Text(peer.getConnectionState().toUpperCase());
        ImGui.PopStyleColor();
      }

      ImGui.EndTable();
    }
  }
}
