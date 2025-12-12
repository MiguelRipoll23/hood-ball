# Entity Recording and Playback System

## Overview

The entity recording and playback system allows the game to record gameplay and play it back with actual rendered entities instead of placeholder graphics. This system uses a decorator-based entity registration approach combined with generic serialization.

## Key Components

### 1. Entity Registration (`@RegisterEntity` decorator)

The `@RegisterEntity` decorator registers entity classes globally so they can be instantiated during playback without needing prior instances.

#### Usage:

```typescript
import { RegisterEntity } from "../../engine/decorators/register-entity.js";

@RegisterEntity
export class MyEntity extends BaseGameEntity {
  // Entity implementation
}
```

### 2. Serializable Entity Interface

Entities should implement the `SerializableEntity` interface to provide custom serialization logic:

```typescript
export interface SerializableEntity {
  serializeForRecording(): Record<string, unknown>;
  deserializeFromRecording(data: Record<string, unknown>): void;
}
```

Base classes (`BaseGameEntity`, `BaseMoveableGameEntity`) provide default implementations that can be extended.

### 3. Custom Serialization

Override the serialization methods in your entity class to include entity-specific properties:

```typescript
@RegisterEntity
export class MyEntity extends BaseMoveableGameEntity {
  private speed: number = 0;
  private health: number = 100;

  public override serializeForRecording(): Record<string, unknown> {
    return {
      ...super.serializeForRecording(), // Include base properties
      speed: this.speed,
      health: this.health,
    };
  }

  public override deserializeFromRecording(data: Record<string, unknown>): void {
    super.deserializeFromRecording(data); // Apply base properties
    if (typeof data.speed === "number") this.speed = data.speed;
    if (typeof data.health === "number") this.health = data.health;
  }
}
```

## Adding New Entities to Recording System

### Step 1: Add `@RegisterEntity` decorator

```typescript
import { RegisterEntity } from "../../engine/decorators/register-entity.js";

@RegisterEntity
export class NewEntity extends BaseGameEntity {
  // ...
}
```

### Step 2: Make constructor parameters optional

The media player needs to instantiate entities without constructor arguments:

```typescript
constructor(x?: number, y?: number) {
  super();
  this.x = x ?? 0;
  this.y = y ?? 0;
}
```

### Step 3: Implement custom serialization

Add `serializeForRecording` and `deserializeFromRecording` methods to handle entity-specific state.

### Step 4: Import entity in registration check

Add your entity to `src/engine/decorators/entity-registration-check.ts`:

```typescript
import "../../game/entities/new-entity.js";
```

## How It Works

### Recording Phase

1. `RecorderService.recordFrame()` is called each frame
2. For each entity, `serializeForRecording()` is called to capture state
3. Serialized data is stored in the recording file

### Playback Phase

1. `MediaPlayerService` loads a recording file
2. For each frame, it processes serialized entities
3. For each entity:
   - Check entity cache for existing instance
   - If not cached, look up constructor from entity registry
   - Create new instance with default constructor
   - Call `deserializeFromRecording()` to apply recorded state
   - Cache the entity for subsequent frames
4. Render the entity using its normal `render()` method

### Fallback Rendering

If an entity cannot be instantiated (not registered or constructor fails), the media player falls back to rendering a simple blue rectangle with the entity type label.

## Registered Entities

The following entities are currently registered for recording/playback:

- `BallEntity` - The game ball with physics
- `CarEntity` - Player cars (both local and remote)
- `BoostPadEntity` - Boost pads on the field
- `GoalEntity` - Goal areas
- `ScoreboardEntity` - Score display

## Best Practices

1. **Always register entities**: Use `@RegisterEntity` on any entity that should appear in recordings
2. **Handle missing constructor parameters**: Make constructor parameters optional with default values
3. **Serialize minimal state**: Only serialize properties needed for visual representation
4. **Test serialization**: Verify that deserialized entities render correctly
5. **Handle nulls gracefully**: Check for null/undefined when accessing canvas or other dependencies

## Debugging

To see registered entities at runtime, check the console log during application startup:

```
[Entity Registry] 5 entities registered for recording playback:
  - BallEntity
  - CarEntity
  - BoostPadEntity
  - GoalEntity
  - ScoreboardEntity
```

## Future Enhancements

Potential improvements to the system:

1. **Lazy loading**: Load entity modules on-demand during playback
2. **Versioning**: Handle different entity versions in recordings
3. **Compression**: Optimize serialized data size
4. **Partial updates**: Only serialize changed properties between frames
5. **Entity pools**: Reuse entity instances for better performance
