import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import { BaseWindow } from "../../core/debug/base-window.js";
import { ChatService } from "../services/network/chat-service.js";
import { container } from "../../core/services/di-container.js";
import { injectable } from "@needle-di/core";

@injectable()
export class ChatInspectorWindow extends BaseWindow {
  private readonly chatService: ChatService;
  private inputText: string = "";

  constructor() {
    super("Chat inspector", new ImVec2(300, 250));
    this.chatService = container.get(ChatService);
  }

  protected override renderContent(): void {
    const messages = this.chatService.getMessages();
    ImGui.BeginChild("ChatLog", new ImVec2(0, 150), true);
    messages.forEach((msg) => ImGui.TextWrapped(msg));
    ImGui.EndChild();

    const inputRef = [this.inputText];
    ImGui.SetNextItemWidth(-Number.MIN_VALUE);
    if (ImGui.InputText("##chatInput", inputRef, 256)) {
      this.inputText = inputRef[0];
    }
    const buttonWidth =
      (ImGui.GetContentRegionAvail().x - ImGui.GetStyle().ItemSpacing.x) / 2;

    if (
      ImGui.Button("Send", new ImVec2(buttonWidth, 0)) &&
      this.inputText.trim() !== ""
    ) {
      this.chatService.sendMessage(this.inputText.trim());
      this.inputText = "";
    }
    ImGui.SameLine();
    if (ImGui.Button("Clear", new ImVec2(buttonWidth, 0))) {
      this.chatService.clearMessages();
    }
  }
}
