// Utility functions for enum reverse lookup

export function getEventTypeName(value: number): string {
  for (const key in EventType) {
    if (EventType[key as keyof typeof EventType] === value) {
      return key;
    }
  }
  return String(value);
}

export function getMatchStateTypeName(value: number): string {
  for (const key in MatchStateType) {
    if (MatchStateType[key as keyof typeof MatchStateType] === value) {
      return key;
    }
  }
  return String(value);
}

// Add similar functions for other enums as needed

import { EventType } from "../enums/event-type.js";
import { MatchStateType } from "../enums/match-state-type.js";
