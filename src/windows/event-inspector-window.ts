import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import type { GameController } from "../models/game-controller.js";
import { EventType } from "../enums/event-type.js";
import type { GameEvent } from "../interfaces/events/game-event.js";
import { LocalEvent } from "../models/local-event.js";
import { RemoteEvent } from "../models/remote-event.js";
import { BaseWindow } from "./base-window.js";

export class EventInspectorWindow extends BaseWindow {
  private selectedEvent: GameEvent | null = null;

  constructor(private gameController: GameController) {
    super("Event inspector", new ImVec2(330, 300));
    console.log(`${this.constructor.name} created`);
  }

  public render(): void {
    super.render();

    if (ImGui.BeginTabBar("##ObjectsTabBar")) {
      if (ImGui.BeginTabItem("Local")) {
        const localEvents = this.gameController
          .getEventProcessorService()
          .getLocalQueue()
          .getEvents()
          .toReversed();
        this.renderEventTable("LocalEventsTable", localEvents);
        ImGui.EndTabItem();
      }

      if (ImGui.BeginTabItem("Remote")) {
        const remoteEvents = this.gameController
          .getEventProcessorService()
          .getRemoteQueue()
          .getEvents()
          .toReversed();
        this.renderEventTable("RemoteEventsTable", remoteEvents);
        ImGui.EndTabItem();
      }

      ImGui.EndTabBar();
    }

    ImGui.End();
  }

  private renderEventTable(tableId: string, events: GameEvent[]): void {
    const dateNow = Date.now();

    const tableFlags =
      ImGui.TableFlags.Borders |
      ImGui.TableFlags.RowBg |
      ImGui.TableFlags.Resizable |
      ImGui.TableFlags.ScrollY |
      ImGui.TableFlags.ScrollX |
      ImGui.TableFlags.SizingFixedFit;

    ImGui.Text("Consumed");
    ImGui.SameLine(0, 20);
    ImGui.PushStyleColor(ImGui.Col.Text, 0xff00a5ff);
    ImGui.Text("Pending");
    ImGui.PopStyleColor();
    ImGui.Separator();

    if (ImGui.BeginTable(tableId, 2, tableFlags, new ImVec2(315, 200))) {
      ImGui.TableSetupColumn("Type");
      ImGui.TableSetupColumn("Consumed At");
      ImGui.TableHeadersRow();

      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const isConsumed = event.isConsumed();
        const consumedAt = event.getConsumedAt();
        const relativeConsumedAt =
          isConsumed && consumedAt !== null
            ? this.getRelativeTime(consumedAt, dateNow)
            : "N/A";

        const color = isConsumed ? 0xffffffff : 0xff00a5ff; // white or orange

        ImGui.TableNextRow();

        // Push color for entire row
        ImGui.PushStyleColor(ImGui.Col.Text, color);

        // Column 0: Type with selectable
        ImGui.TableSetColumnIndex(0);
        const label = `${EventType[event.getType()]}##${tableId}-${i}`;
        const selected = this.selectedEvent === event;
        if (
          ImGui.Selectable(
            label,
            selected,
            ImGui.SelectableFlags.SpanAllColumns
          )
        ) {
          this.selectedEvent = event;
        }

        // Column 1: Consumed At text
        ImGui.TableSetColumnIndex(1);
        ImGui.Text(relativeConsumedAt);

        ImGui.PopStyleColor();
      }

      ImGui.EndTable();
    }

    if (ImGui.Button("Replay") && this.selectedEvent) {
      this.replayEvent(this.selectedEvent);
    }
  }

  private getRelativeTime(timestamp: number, now: number): string {
    const seconds = Math.floor((now - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  private replayEvent(event: GameEvent): void {
    console.log(`Replaying event: ${event.getType()}`);

    if (event instanceof LocalEvent) {
      const localEvent = new LocalEvent(event.getType());
      localEvent.setData(event.getData());

      this.gameController
        .getEventProcessorService()
        .getLocalQueue()
        .addEvent(localEvent);
    } else if (event instanceof RemoteEvent) {
      const remoteEvent = new RemoteEvent(event.getType());
      remoteEvent.setData(event.getData());

      this.gameController
        .getEventProcessorService()
        .getRemoteQueue()
        .addEvent(remoteEvent);
    }
  }
}
