import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import { EventType } from "../enums/event-type.js";
import type { GameEvent } from "../interfaces/events/game-event.js";
import { LocalEvent } from "../models/local-event.js";
import { RemoteEvent } from "../models/remote-event.js";
import { BaseWindow } from "./base-window.js";
import { EventProcessorService } from "../services/event-processor-service.js";
import type { IEventProcessorService } from "../interfaces/services/event-processor-service.js";
import { ServiceLocator } from "../services/service-locator.js";

export class EventInspectorWindow extends BaseWindow {
  private selectedEvent: GameEvent | null = null;
  private readonly eventProcessorService: IEventProcessorService;

  constructor() {
    super("Event inspector", new ImVec2(195, 230));
    this.eventProcessorService = ServiceLocator.get<IEventProcessorService>(EventProcessorService);
    console.log(`${this.constructor.name} created`);
  }

  protected override renderContent(): void {
    if (ImGui.BeginTabBar("##ObjectsTabBar")) {
      this.renderTab("Local", "LocalEventsTable", () =>
        this.getReversedEvents("local")
      );
      this.renderTab("Remote", "RemoteEventsTable", () =>
        this.getReversedEvents("remote")
      );

      ImGui.EndTabBar();
    }
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

    if (ImGui.BeginTable(tableId, 1, tableFlags, new ImVec2(180, 150))) {
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

    if (ImGui.Button("Replay") && this.selectedEvent) {
      this.replayEvent(this.selectedEvent);
    }
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
