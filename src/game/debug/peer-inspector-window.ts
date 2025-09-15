import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import { BaseWindow } from "../../core/debug/base-window.js";
import { WebRTCService } from "../services/network/webrtc-service.js";
import { container } from "../../core/services/di-container.js";
import { injectable } from "@needle-di/core";
import { getPingTextColor } from "../utils/ping-utils.js";

@injectable()
export class PeerInspectorWindow extends BaseWindow {
  private static readonly COLOR_CONNECTED_STATE = 0xff00ff00;
  private static readonly COLOR_OTHER_STATE = 0xffffffff;

  private readonly webrtcService: WebRTCService;

  constructor() {
    super("Peer inspector", new ImVec2(500, 300));
    this.webrtcService = container.get(WebRTCService);
    console.log(`${this.constructor.name} created`);
  }

  protected override renderContent(): void {
    const peers = this.webrtcService.getPeers();

    ImGui.Text("Total: " + peers.length);

    const tableFlags =
      ImGui.TableFlags.Borders |
      ImGui.TableFlags.RowBg |
      ImGui.TableFlags.Resizable |
      ImGui.TableFlags.ScrollY |
      ImGui.TableFlags.ScrollX |
      ImGui.TableFlags.SizingStretchProp;

    if (ImGui.BeginTable("PeersTable", 3, tableFlags)) {
      ImGui.TableSetupColumn("Token / ID", ImGui.TableColumnFlags.WidthStretch);
      ImGui.TableSetupColumn(
        "Ping (ms)",
        ImGui.TableColumnFlags.WidthFixed,
        80
      );
      ImGui.TableSetupColumn("State", ImGui.TableColumnFlags.WidthFixed, 100);

      ImGui.TableHeadersRow();

      for (const peer of peers) {
        ImGui.TableNextRow();

        ImGui.TableSetColumnIndex(0);
        ImGui.Text(peer.getPlayer()?.getId() ?? peer.getToken());

        const pingTime = peer.getPingTime();

        ImGui.TableSetColumnIndex(1);
        if (pingTime === null) {
          ImGui.Text("--");
        } else {
          ImGui.PushStyleColor(ImGui.Col.Text, getPingTextColor(pingTime));
          ImGui.Text(pingTime.toFixed(0));
          ImGui.PopStyleColor();
        }

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
