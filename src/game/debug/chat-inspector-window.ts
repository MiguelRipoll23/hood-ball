import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import { BaseWindow } from "../../core/debug/base-window.js";
import { ChatService } from "../services/network/chat-service.js";
import { container } from "../../core/services/di-container.js";
import { injectable } from "@needle-di/core";

@injectable()
export class ChatInspectorWindow extends BaseWindow {
  private readonly chatService: ChatService;

  constructor() {
    super("Chat inspector", new ImVec2(300, 200));
    this.chatService = container.get(ChatService);
  }

  protected override renderContent(): void {
    const messages = this.chatService.getMessages();

    ImGui.BeginChild("ChatLog", new ImVec2(0, 150), true);
    messages.forEach((msg) => ImGui.TextWrapped(msg));
    ImGui.EndChild();

    if (ImGui.Button("Clear")) {
      this.chatService.clearMessages();
    }
  }
}
