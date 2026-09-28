/**
 * TypeScript protocol definitions for OpenStaff
 * Symmetrical with Rust crates/protocol
 */

/**
 * Message struct - corresponds to Rust openstaff_protocol::Message
 */
export interface Message {
  content: string;
}

/**
 * EventEnvelope stub - placeholder for future event routing
 * Will be expanded when Rust side implements EventEnvelope
 */
export interface EventEnvelope {
  eventType: string;
  payload: unknown;
  timestamp?: number;
}

/**
 * Type guard for Message
 */
export function isMessage(obj: unknown): obj is Message {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'content' in obj &&
    typeof (obj as Message).content === 'string'
  );
}

/**
 * Type guard for EventEnvelope
 */
export function isEventEnvelope(obj: unknown): obj is EventEnvelope {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'eventType' in obj &&
    typeof (obj as EventEnvelope).eventType === 'string' &&
    'payload' in obj
  );
}
