import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import { EventType } from "../../engine/enums/event-type.js";
import type { GameEvent } from "../../engine/interfaces/models/game-event-interface.js";
import { LocalEvent } from "../../engine/models/local-event.js";
import { RemoteEvent } from "../../engine/models/remote-event.js";
import { BaseWindow } from "../../engine/debug/base-window.js";
import { BinaryReader } from "../../engine/utils/binary-reader-utils.js";
import { EventProcessorService } from "../../engine/services/gameplay/event-processor-service.js";
import { container } from "../../engine/services/di-container.js";
import { injectable } from "@needle-di/core";

@injectable()
export class EventInspectorWindow extends BaseWindow {
  private selectedEvent: GameEvent | null = null;
  private detailEvent: GameEvent | null = null;
  private shouldOpenDetails = false;
  private readonly eventProcessorService: EventProcessorService;

  constructor() {
    super("Event inspector", new ImVec2(195, 230));
    this.eventProcessorService = container.get(EventProcessorService);
    console.log(`${this.constructor.name} created`);
  }

  protected override renderContent(): void {
    if (ImGui.BeginTabBar("##EntitiesTabBar")) {
      this.renderTab("Local", "LocalEventsTable", () =>
        this.getReversedEvents("local")
      );
      this.renderTab("Remote", "RemoteEventsTable", () =>
        this.getReversedEvents("remote")
      );

      ImGui.EndTabBar();
    }

    this.renderDetailsPopup();
  }

  private renderTab(
    tabName: string,
    tableId: string,
    getEvents: () => GameEvent[]
  ): void {
    if (ImGui.BeginTabItem(tabName)) {
      this.renderEventTable(tableId, getEvents());
      ImGui.EndTabItem();
    }
  }

  private getReversedEvents(type: "local" | "remote"): GameEvent[] {
    const queue =
      type === "local"
        ? this.eventProcessorService.getLocalQueue()
        : this.eventProcessorService.getRemoteQueue();

    return queue.getEvents().toReversed();
  }

  private renderEventTable(tableId: string, events: GameEvent[]): void {
    const tableFlags =
      ImGui.TableFlags.Borders |
      ImGui.TableFlags.RowBg |
      ImGui.TableFlags.Resizable |
      ImGui.TableFlags.ScrollY |
      ImGui.TableFlags.ScrollX |
      ImGui.TableFlags.SizingStretchSame;

    ImGui.BeginGroup();
    if (ImGui.BeginTable(tableId, 1, tableFlags, new ImVec2(220, 150))) {
      events.forEach((event, i) => {
        ImGui.TableNextRow();

        const isConsumed = event.isConsumed();
        const color = isConsumed ? 0xffffffff : 0xff00a5ff;
        const label = `${EventType[event.getType()]}##${tableId}-${i}`;
        const selected = this.selectedEvent === event;

        ImGui.PushStyleColor(ImGui.Col.Text, color);

        ImGui.TableSetColumnIndex(0);
        if (
          ImGui.Selectable(
            label,
            selected,
            ImGui.SelectableFlags.SpanAllColumns
          )
        ) {
          this.selectedEvent = event;
        }

        ImGui.PopStyleColor();
      });

      ImGui.EndTable();
    }

    const hasSelected = this.selectedEvent !== null;
    const hasData =
      this.selectedEvent?.getData() !== null &&
      this.selectedEvent?.getData() !== undefined;

    ImGui.BeginDisabled(!hasData);
    if (ImGui.Button("View") && hasData && this.selectedEvent) {
      this.detailEvent = this.selectedEvent;
      this.shouldOpenDetails = true;
    }
    ImGui.EndDisabled();
    ImGui.SameLine();
    ImGui.BeginDisabled(!hasSelected);
    if (ImGui.Button("Replay") && hasSelected && this.selectedEvent) {
      this.replayEvent(this.selectedEvent);
    }
    ImGui.EndDisabled();
    ImGui.EndGroup();
  }

  private replayEvent(event: GameEvent): void {
    console.log(`Replaying event: ${event.getType()}`);

    const newEvent = this.createEventClone(event);

    if (newEvent instanceof LocalEvent) {
      this.eventProcessorService.getLocalQueue().addEvent(newEvent);
    } else if (newEvent instanceof RemoteEvent) {
      this.eventProcessorService.getRemoteQueue().addEvent(newEvent);
    }
  }

  private renderEventDetails(event: GameEvent): void {
    if (event instanceof LocalEvent) {
      const data = event.getData();
      if (data && typeof data === "object") {
        Object.entries(data as Record<string, unknown>).forEach(
          ([key, value]) => {
            if (value && typeof value === "object") {
              try {
                const json = JSON.stringify(value, null, 2) ?? String(value);
                json.split("\n").forEach((line, idx) => {
                  ImGui.Text(idx === 0 ? `${key}: ${line}` : line);
                });
              } catch {
                ImGui.Text(`${key}: [Object]`);
              }
            } else {
              ImGui.Text(`${key}: ${String(value)}`);
            }
          }
        );
      } else if (data !== null && data !== undefined) {
        ImGui.Text(String(data));
      } else {
        ImGui.Text("No data");
      }
    } else if (event instanceof RemoteEvent) {
      const buffer = event.getData();
      if (buffer) {
        const preview = BinaryReader.fromArrayBuffer(buffer).preview();
        preview.split("\n").forEach((line) => ImGui.Text(line));
      } else {
        ImGui.Text("No data");
      }
    }
  }

  private renderDetailsPopup(): void {
    if (this.shouldOpenDetails) {
      ImGui.OpenPopup("Event Details");
      this.shouldOpenDetails = false;
    }
    const io = ImGui.GetIO();
    ImGui.SetNextWindowPos(
      new ImVec2(io.DisplaySize.x * 0.5, io.DisplaySize.y * 0.5),
      ImGui.Cond.Appearing,
      new ImVec2(0.5, 0.5)
    );
    const open = [true];
    if (
      ImGui.BeginPopupModal(
        "Event Details",
        open,
        ImGui.WindowFlags.AlwaysAutoResize
      )
    ) {
      if (this.detailEvent) {
        this.renderEventDetails(this.detailEvent);
      } else {
        ImGui.Text("No event selected");
      }

      if (ImGui.Button("Close")) {
        ImGui.CloseCurrentPopup();
      }
      ImGui.EndPopup();
    }
    if (!open[0]) {
      this.detailEvent = null;
    }
  }

  private createEventClone(event: GameEvent): GameEvent {
    if (event instanceof LocalEvent) {
      const localClone = new LocalEvent(event.getType());
      localClone.setData(event.getData());
      return localClone;
    }

    if (event instanceof RemoteEvent) {
      const remoteClone = new RemoteEvent(event.getType());
      remoteClone.setData(event.getData());
      return remoteClone;
    }

    throw new Error("Unsupported event type");
  }
}
