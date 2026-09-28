import { EventEnvelope, EventPayload } from "@openstaff/protocol";

/**
 * Protocol utilities for admin console
 * Uses @openstaff/protocol for type-safe event handling
 */

export function createMessageEnvelope(
  eventId: string,
  eventType: string,
  message: string,
): EventEnvelope {
  const payload: EventPayload = {
    type: "Message",
    data: { content: message },
  };
  return {
    eventId,
    eventType,
    timestamp: Date.now(),
    protocolVersion: "1.0",
    payload,
  };
}

export function formatEventType(envelope: EventEnvelope): string {
  return `Event: ${envelope.eventType}`;
}
