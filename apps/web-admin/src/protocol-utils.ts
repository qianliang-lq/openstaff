import { EventEnvelope } from "@openstaff/protocol";

/**
 * Protocol utilities for admin console
 * Uses @openstaff/protocol for type-safe event handling
 */

export function createEventEnvelope(
  eventType: string,
  payload: unknown,
): EventEnvelope {
  return {
    eventType,
    payload,
    timestamp: Date.now(),
  };
}

export function formatEventType(envelope: EventEnvelope): string {
  return `Event: ${envelope.eventType}`;
}
