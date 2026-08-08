import { injectable, inject } from "@needle-di/core";
import { GameEventType } from "../../enums/event-type.js";
import { AntiCheatRuleType } from "../../enums/anti-cheat-rule-type.js";
import { AntiCheatReportingService } from "./anti-cheat-reporting-service.js";
import { MatchSessionService } from "../session/match-session-service.js";
import {
  EVENT_CONSUMER_SERVICE_TOKEN,
  type EventConsumerServiceContract,
} from "../../../engine/interfaces/services/gameplay/event-consumer-service-interface.js";
import type { EventSubscription } from "../../../engine/types/event-subscription.js";
import type { AntiCheatRule } from "../../models/anti-cheat-rule.js";
import {
  evaluateEventRateRules,
  evaluateMovementRules,
} from "../../utils/anti-cheat-utils.js";
import type {
  TrackedEntity,
  MovementSample,
} from "../../utils/anti-cheat-utils.js";

@injectable()
export class AntiCheatMonitorService {
  private rules: readonly AntiCheatRule[] = [];
  private readonly eventWindows = new Map<number, number[]>();
  private readonly movementSamples = new Map<string, MovementSample[]>();
  private readonly localSubscriptions: EventSubscription[] = [];
  private readonly remoteSubscriptions: EventSubscription[] = [];
  private monitoring = false;

  constructor(
    private readonly reporting: AntiCheatReportingService = inject(
      AntiCheatReportingService,
    ),
    private readonly matchSessionService: MatchSessionService = inject(
      MatchSessionService,
    ),
    private readonly eventConsumerService: EventConsumerServiceContract = inject(
      EVENT_CONSUMER_SERVICE_TOKEN,
    ),
  ) {}

  public setRules(rules: readonly AntiCheatRule[]): void {
    this.rules = rules;
  }

  public getRules(): readonly AntiCheatRule[] {
    return this.rules;
  }

  public start(): void {
    if (this.monitoring) return;
    this.monitoring = true;
    this.subscribeToAllEventTypes();
    console.log("[AntiCheat] Monitoring started");
  }

  public stop(): void {
    this.monitoring = false;

    for (const sub of this.localSubscriptions) {
      this.eventConsumerService.unsubscribeFromLocalEvent(sub);
    }
    this.localSubscriptions.length = 0;

    for (const sub of this.remoteSubscriptions) {
      this.eventConsumerService.unsubscribeFromRemoteEvent(sub);
    }
    this.remoteSubscriptions.length = 0;

    this.eventWindows.clear();
    this.movementSamples.clear();
    console.log("[AntiCheat] Monitoring stopped");
  }

  public update(entities: Iterable<TrackedEntity>): void {
    if (!this.monitoring) return;

    const now = Date.now();

    for (const entity of entities) {
      let samples = this.movementSamples.get(entity.id);
      if (!samples) {
        samples = [];
        this.movementSamples.set(entity.id, samples);
      }

      samples.push({ x: entity.x, y: entity.y, timestamp: now });

      const violations = evaluateMovementRules(
        this.rules,
        entity.id,
        entity.ownerId,
        samples,
        now,
      );

      for (const v of violations) {
        this.reporting.reportViolation(v.ruleId, v.reason, v.targetUserId);
      }
    }

    this.pruneMovementSamples(now);
  }

  // -------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------

  private subscribeToAllEventTypes(): void {
    const allValues = Object.values(GameEventType);
    const eventTypes: number[] = [];
    for (const v of allValues) {
      if (typeof v === "number") {
        eventTypes.push(v);
      }
    }

    for (const eventType of eventTypes) {
      const localSub = this.eventConsumerService.subscribeToLocalEvent(
        eventType,
        () => this.onEvent(eventType),
      );
      this.localSubscriptions.push(localSub);

      const remoteSub = this.eventConsumerService.subscribeToRemoteEvent(
        eventType,
        () => this.onEvent(eventType),
      );
      this.remoteSubscriptions.push(remoteSub);
    }
  }

  private onEvent(eventType: number): void {
    const now = Date.now();
    let timestamps = this.eventWindows.get(eventType);
    if (!timestamps) {
      timestamps = [];
      this.eventWindows.set(eventType, timestamps);
    }
    timestamps.push(now);

    const violations = evaluateEventRateRules(
      this.rules,
      eventType,
      timestamps,
      now,
    );

    for (const v of violations) {
      const hostId = this.matchSessionService
        .getMatch()
        ?.getHost()
        ?.getNetworkId();
      this.reporting.reportViolation(v.ruleId, v.reason, hostId ?? undefined);
    }

    this.pruneEventWindows(now);
  }

  // -------------------------------------------------------------------
  // Pruning
  // -------------------------------------------------------------------

  private pruneMovementSamples(now: number): void {
    const maxMs = this.maxMovementWindowMs();
    const cutoff = now - maxMs;

    for (const [, samples] of this.movementSamples) {
      while (samples.length > 0 && samples[0].timestamp < cutoff) {
        samples.shift();
      }
    }

    for (const [key, samples] of this.movementSamples) {
      if (samples.length === 0) this.movementSamples.delete(key);
    }
  }

  private pruneEventWindows(now: number): void {
    const maxMs = this.maxEventWindowMs();
    const cutoff = now - maxMs;

    for (const [, timestamps] of this.eventWindows) {
      while (timestamps.length > 0 && timestamps[0] < cutoff) {
        timestamps.shift();
      }
    }

    for (const [key, timestamps] of this.eventWindows) {
      if (timestamps.length === 0) this.eventWindows.delete(key);
    }
  }

  private maxMovementWindowMs(): number {
    let s = 60;
    for (const rule of this.rules) {
      if (rule.ruleType === AntiCheatRuleType.MovementSpeedLimit) {
        const w = rule.getFieldOrDefault(1, 60);
        if (w > s) s = w;
      }
    }
    return s * 1000;
  }

  private maxEventWindowMs(): number {
    let s = 60;
    for (const rule of this.rules) {
      if (rule.ruleType === AntiCheatRuleType.EventRateLimit) {
        const w = rule.getFieldOrDefault(2, 60);
        if (w > s) s = w;
      }
    }
    return s * 1000;
  }
}
