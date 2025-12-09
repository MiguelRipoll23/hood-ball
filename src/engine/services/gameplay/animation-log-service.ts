import { injectable } from "@needle-di/core";
import type { AnimatableEntity } from "../../interfaces/entities/animatable-entity.js";
import type { EntityAnimationService } from "./entity-animation-service.js";
import { AnimationType } from "../../enums/animation-type.js";

export type AnimationLogItem = {
  entityName: string;
  type: AnimationType;
  progress: number;
  finished: boolean;
};

@injectable()
export class AnimationLogService {
  private readonly entries: AnimationLogItem[] = [];
  private readonly map = new Map<EntityAnimationService, AnimationLogItem>();

  public register(
    service: EntityAnimationService,
    entity: AnimatableEntity,
    type: AnimationType
  ): void {
    const entry: AnimationLogItem = {
      entityName: entity.constructor.name,
      type,
      progress: 0,
      finished: false,
    };
    this.entries.push(entry);
    this.map.set(service, entry);
  }

  public update(
    service: EntityAnimationService,
    progress: number,
    finished: boolean
  ): void {
    const entry = this.map.get(service);
    if (!entry) return;
    entry.progress = progress;
    if (finished) {
      entry.finished = true;
      this.map.delete(service);
    }
  }

  public getEntries(): AnimationLogItem[] {
    return this.entries;
  }

  public clear(): void {
    this.entries.length = 0;
    this.map.clear();
  }
}
