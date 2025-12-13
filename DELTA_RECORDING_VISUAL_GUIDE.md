# Delta Recording System - Visual Guide

## Recording Flow Comparison

### OLD SYSTEM (v1.0) - Full Frame Recording
```
Frame 0: [Car1{x:100,y:200,angle:0,...}, Ball{x:400,y:300,...}, UI{...}, BG{...}] + Events
Frame 1: [Car1{x:101,y:200,angle:0.01,...}, Ball{x:401,y:300,...}, UI{...}, BG{...}] + Events
Frame 2: [Car1{x:102,y:200,angle:0.02,...}, Ball{x:402,y:300,...}, UI{...}, BG{...}] + Events
...
Frame 54000: [Car1{x:5400,y:200,angle:54,...}, Ball{x:5800,y:300,...}, UI{...}, BG{...}] + Events

Total: 54,000 frames × 10 entities × 500 bytes = ~270 MB
```

### NEW SYSTEM (v2.0) - Delta Recording
```
Initial Snapshot (Frame 0):
  Car1{x:100, y:200, angle:0, vx:1, vy:0, boost:100, ...}
  Ball{x:400, y:300, vx:0, vy:0, ...}
  UI{...}
  Background{...}

During Recording (only changes):
  t=16ms:  Car1 transform: {x:101, angle:0.01}
  t=32ms:  Car1 transform: {x:102, angle:0.02}
  t=48ms:  Car1 transform: {x:103, angle:0.03}
  t=1000ms: Car1 state: {boost:95}
  t=1500ms: Ball transform: {x:405, y:310, vx:5, vy:10}
  t=2000ms: Spawn: NpcCar{x:200, y:100, type:"NpcCarEntity", ...}
  t=5000ms: Despawn: NpcCar
  ...

Total: ~5,000 changes × 50 bytes = ~250 KB (99% reduction!)
```

## Data Structure Visualization

### Initial Snapshot
```typescript
{
  id: "Ball_abc123",
  type: "BallEntity",
  x: 400, y: 300,
  width: 40, height: 40,
  angle: 0,
  velocityX: 0, velocityY: 0,
  visible: true, opacity: 1,
  properties: { inactive: false }
}
```

### Transform Delta (only changed values)
```typescript
{
  timestamp: 1500,
  id: "Ball_abc123",
  x: 405,        // Changed (> 0.5px threshold)
  y: 310,        // Changed
  velocityX: 5,  // Changed
  velocityY: 10  // Changed
  // angle not included - didn't change enough
}
```

### State Delta (only changed properties)
```typescript
{
  timestamp: 5000,
  id: "Car_xyz789",
  properties: {
    boost: 75,      // Changed from 100
    boosting: true  // Changed from false
    // speed, health, etc. not included - didn't change
  }
}
```

### Spawn Event
```typescript
{
  timestamp: 2000,
  id: "NpcCar_def456",
  type: "NpcCarEntity",
  x: 200, y: 100,
  width: 50, height: 50,
  angle: 1.57,
  properties: { team: "red", speed: 0 }
}
```

### Despawn Event
```typescript
{
  timestamp: 5000,
  id: "NpcCar_def456"
}
```

## Playback Reconstruction

### How Playback Works
```
1. Load initial snapshot → Create all entities in starting positions
2. Advance time → Apply deltas chronologically:
   
   currentTime = 0ms
   entityStates = { Ball: {x:400, y:300}, Car: {x:100, y:200}, ... }
   
   currentTime = 1500ms
   Apply transform delta: Ball x→405, y→310
   entityStates = { Ball: {x:405, y:310}, Car: {x:100, y:200}, ... }
   
   currentTime = 2000ms
   Apply spawn: NpcCar created
   entityStates = { Ball: {x:405, y:310}, Car: {x:100, y:200}, NpcCar: {x:200, y:100}, ... }
   
   currentTime = 5000ms
   Apply despawn: NpcCar removed
   Apply state delta: Car boost→75
   entityStates = { Ball: {x:405, y:310}, Car: {x:100, y:200, boost:75}, ... }
```

## Binary Format Layout

### Old Format (v1.0)
```
[HREC] [1.0] [Metadata]
  Frame 0: [timestamp][entities: E1, E2, E3, ...][events]
  Frame 1: [timestamp][entities: E1, E2, E3, ...][events]
  Frame 2: [timestamp][entities: E1, E2, E3, ...][events]
  ...
```

### New Format (v2.0)
```
[HREC] [2.0] [Metadata]
  Initial Snapshot: [count][E1 full state][E2 full state]...
  Spawn Events: [count][spawn1][spawn2]...
  Despawn Events: [count][despawn1][despawn2]...
  Transform Deltas: [count][delta1][delta2]...  ← Bitflags for present fields
  State Deltas: [count][delta1][delta2]...
  Events: [count][event1][event2]...
```

## Thresholds Explained

### Why Thresholds?
Tiny changes don't matter visually, so we skip them:

```
Position: 0.5 pixels
  Frame 1: x = 100.0
  Frame 2: x = 100.3  ← Skip (< 0.5px)
  Frame 3: x = 100.6  ← Record! (≥ 0.5px from last recorded)

Rotation: 0.01 radians (~0.57 degrees)
  Frame 1: angle = 0.000
  Frame 2: angle = 0.005  ← Skip
  Frame 3: angle = 0.012  ← Record!

Velocity: 0.01 units
  Frame 1: vx = 1.000
  Frame 2: vx = 1.005  ← Skip
  Frame 3: vx = 1.015  ← Record!
```

## Real-World Example

### Scenario: Car moves smoothly across screen
```
Old System (every frame @ 60fps):
  Frame 0: x=100
  Frame 1: x=101
  Frame 2: x=102
  ...
  Frame 60: x=160
  → 61 records = 30.5 KB

New System (with 0.5px threshold):
  Snapshot: x=100
  t=16ms: x=101  (1.0px change)
  t=32ms: x=102  (1.0px change)
  t=48ms: x=103  (1.0px change)
  ...
  t=960ms: x=160 (1.0px change)
  → 61 records = 3.05 KB (90% reduction)
```

### Scenario: Static background
```
Old System:
  Every frame records: {type:"BackgroundEntity", x:0, y:0, ...}
  54,000 frames × 200 bytes = 10.8 MB

New System:
  Initial snapshot: {type:"BackgroundEntity", x:0, y:0, ...}
  No deltas (never changes!)
  → 200 bytes (99.998% reduction)
```

## Benefits Summary

| Aspect | Old System | New System | Improvement |
|--------|-----------|------------|-------------|
| **File Size** | 90-270 MB | 300 KB - 5 MB | 95-99% smaller |
| **Static Entities** | Recorded every frame | Recorded once | 99.99% reduction |
| **Smooth Movement** | Full state each frame | Deltas when needed | 70-90% reduction |
| **Fast Seeking** | Linear scan | Jump to time | Much faster |
| **Memory Usage** | All frames in RAM | Only deltas | 95% less |

## Implementation Notes

### Entity ID Management
- Uses existing entity IDs when available
- Falls back to: `{ClassName}_{random}`
- Cached in WeakMap for stability

### Change Detection
- Compares current vs last recorded state
- Applies thresholds per property type
- Simple equality for primitives
- JSON comparison for objects (when needed)

### Bitflags for Efficiency
Transform deltas use bitflags to indicate present fields:
```
0x01 = x present
0x02 = y present
0x04 = angle present
0x08 = velocityX present
0x10 = velocityY present

Example: flags=0x0D (binary: 01101) means x, angle, velocityX present
```

This saves 4-16 bytes per delta by only writing changed values!
