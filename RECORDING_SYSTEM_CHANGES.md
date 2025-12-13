# Recording System Improvements - Delta Recording Implementation

## Overview

This document describes the improvements made to the RecorderService and MediaPlayerService to implement a modern, efficient delta-based recording system following industry best practices used in modern games.

## What Changed

### Before: Full Frame Recording
The old system recorded **every entity's complete state on every frame**:
- Position, rotation, size, opacity for every entity
- All properties for every entity
- Every frame (60 FPS = ~54,000 frames for 15 minutes)
- Large file sizes (estimated ~500 bytes per entity per frame)

### After: Delta Recording (State Snapshots + Deltas)
The new system follows modern game recording practices:

1. **Initial Snapshot**: Record the complete state of all entities at the start
2. **Spawn/Despawn Events**: Only record when entities are created or removed
3. **Transform Deltas**: Only record position/rotation/velocity changes above threshold
4. **State Deltas**: Only record gameplay property changes (health, ammo, etc.)
5. **Smart Thresholds**: Skip recording changes smaller than:
   - 0.5 pixels for position
   - 0.01 radians for rotation
   - 0.01 for velocity

## File Format Changes

### Version 1.0 (Old Format)
```
HREC Header
Version: 1.0
Metadata: startTime, endTime, totalFrames, fps
For each frame:
  - Complete entity list with all properties
  - Event list
```

### Version 2.0 (New Delta Format)
```
HREC Header
Version: 2.0
Metadata: startTime, endTime, totalFrames, fps
Initial Snapshot: Complete state of all entities
Spawn Events: When entities are created
Despawn Events: When entities are removed
Transform Deltas: Position/rotation changes (with bitflags for efficiency)
State Deltas: Gameplay property changes
Events: Game events
```

## Benefits

### 1. Reduced File Size
- **Estimated 70-90% reduction** for typical gameplay
- Static entities (background, UI) recorded once
- Dynamic entities (cars, ball) only record changes
- Smooth movement = fewer deltas

### 2. Better Performance
- Less data to write during recording
- Less data to read during playback
- Faster seeking through recordings

### 3. Industry Standard
- Matches practices used in:
  - Rocket League replay system
  - Overwatch "Play of the Game"
  - League of Legends replay system
  - Most modern FPS games

## Code Structure

### New Interfaces
Created in `src/engine/interfaces/recording/`:

1. **EntitySnapshot**: Complete entity state (used for initial snapshot)
2. **EntitySpawnEvent**: Entity creation with type and initial properties
3. **EntityDespawnEvent**: Entity removal (just ID and timestamp)
4. **EntityTransformDelta**: Position/rotation/velocity changes
5. **EntityStateDelta**: Gameplay property changes

### RecorderService Changes

**New Data Structures:**
```typescript
- initialSnapshot: EntitySnapshot[]
- spawnEvents: EntitySpawnEvent[]
- despawnEvents: EntityDespawnEvent[]
- transformDeltas: EntityTransformDelta[]
- stateDeltas: EntityStateDelta[]
- recordedEvents: SerializedEvent[]
```

**New Methods:**
- `captureInitialSnapshot()`: Records initial state on first frame
- `recordSpawnDespawnEvents()`: Detects entity creation/removal
- `recordDeltas()`: Detects and records only changes
- `recordEvents()`: Records game events separately

**Key Features:**
- Tracks last known state for each entity
- Compares current state to detect changes
- Only records deltas above threshold
- Maintains backwards compatibility with old format

### MediaPlayerService Changes

**New Data Structures:**
```typescript
- deltaRecordingData: DeltaRecordingData | null
- currentEntityStates: Map<string, EntitySnapshot>
- currentTime: number
- Playback indices for each delta type
```

**New Methods:**
- `loadDeltaFormat()`: Loads version 2.0 recordings
- `initializeDeltaPlayback()`: Sets up initial state from snapshot
- `updateDeltaPlayback()`: Applies deltas as time progresses
- `buildFrameFromDeltaState()`: Converts current state to frame format

**Key Features:**
- Maintains current entity states in memory
- Applies deltas sequentially as playback time advances
- Handles spawn/despawn events dynamically
- Converts to RecordedFrame format for backwards compatibility

## Backwards Compatibility

The system maintains **full backwards compatibility**:
- Old recordings (v1.0) still load and play
- New recordings use v2.0 format
- MediaPlayerService automatically detects version
- Old frame-based playback path preserved
- Debug UI works with both formats

## Usage

### Recording
```typescript
// No changes needed - works the same way
recorderService.startRecording();
// ... gameplay happens ...
recorderService.stopRecording();
recorderService.exportRecording(); // Now exports v2.0 format
```

### Playback
```typescript
// No changes needed - automatically detects format
await mediaPlayerService.loadRecording(file);
mediaPlayerService.play();
// ... playback happens with delta system ...
```

## Performance Metrics

Example for a 5-minute match:
- **Old Format**: ~18,000 frames × 10 entities × 500 bytes = ~90 MB
- **New Format**: 
  - Initial snapshot: 10 entities × 500 bytes = 5 KB
  - Transform deltas: ~5,000 changes × 50 bytes = 250 KB
  - State deltas: ~1,000 changes × 100 bytes = 100 KB
  - Total: ~355 KB (**99.6% reduction**)

Actual reduction depends on:
- Number of entities
- Amount of movement
- Frequency of state changes
- Threshold settings

## Future Improvements

Possible enhancements:
1. **Compression**: Add zlib compression to delta data
2. **Keyframes**: Add periodic full snapshots for faster seeking
3. **Interpolation**: Smooth playback between sparse deltas
4. **Static Entities**: Add metadata to skip certain entity types entirely
5. **Event Replay**: Implement deterministic replay from events only

## Testing

To test the new system:
1. Start a game and enable recording in Debug UI
2. Play for a few minutes with various entities
3. Stop recording and export
4. Compare file size to old recordings
5. Load and play back to verify correctness
6. Check console for delta statistics

## Migration Notes

- Existing recordings remain compatible
- No changes needed in game code
- Debug UI automatically adapts
- Export always uses new format
- Old recordings can be converted by loading and re-exporting
