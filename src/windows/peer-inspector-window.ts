import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import type { GameController } from "../models/game-controller.js";
import { BaseWindow } from "./base-window.js";

export class PeerInspectorWindow extends BaseWindow {
  private static readonly COLOR_CONNECTED = 0xff00ff00;
  private static readonly COLOR_DISCONNECTED = 0xffff0000;

  constructor(private gameController: GameController) {
    super("Peer inspector", new ImVec2(400, 300));
    console.log(`${this.constructor.name} created`);
  }

  public render(): void {
    super.render();

    const peers = this.gameController.getWebRTCService().getPeers();

    ImGui.Text("Total: " + peers.length);
    ImGui.Separator();

    const tableFlags =
      ImGui.TableFlags.Borders |
      ImGui.TableFlags.RowBg |
      ImGui.TableFlags.Resizable |
      ImGui.TableFlags.ScrollY |
      ImGui.TableFlags.ScrollX |
      ImGui.TableFlags.SizingStretchSame;

    if (ImGui.BeginTable("PeersTable", 3, tableFlags)) {
      ImGui.TableSetupColumn("Token / Name");
      ImGui.TableSetupColumn("Ping (ms)");
      ImGui.TableSetupColumn("Status");
      ImGui.TableHeadersRow();

      for (const peer of peers) {
        ImGui.TableNextRow();

        ImGui.TableSetColumnIndex(0);
        ImGui.Text(peer.getName());

        ImGui.TableSetColumnIndex(1);
        ImGui.Text(`${peer.getPingTime().toFixed(0)}`);

        ImGui.TableSetColumnIndex(2);
        const isConnected = peer.isConnected();
        const color = isConnected
          ? PeerInspectorWindow.COLOR_CONNECTED
          : PeerInspectorWindow.COLOR_DISCONNECTED;
        ImGui.PushStyleColor(ImGui.Col.Text, color);
        ImGui.Text(isConnected ? "Connected" : "Disconnected");
        ImGui.PopStyleColor();
      }

      ImGui.EndTable();
    }

    ImGui.End();
  }
}
