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
 * EventPayload - corresponds to Rust openstaff_protocol::EventPayload
 * Tagged union matching Rust #[serde(tag = "type", content = "data")]
 */
export type EventPayload =
  | { type: "Message"; data: Message }
  | { type: "AgentStateChange"; data: { agent_id: string; state: string } }
  | { type: "ToolCall"; data: { tool_name: string; args: unknown } }
  | { type: "ApprovalRequest"; data: { request_id: string; action: string } };

/**
 * EventEnvelope - corresponds to Rust openstaff_protocol::EventEnvelope
 * JSON fields are camelCase due to Rust #[serde(rename_all = "camelCase")]
 */
export interface EventEnvelope {
  eventId: string;
  eventType: string;
  timestamp: number;
  protocolVersion: string;
  payload: EventPayload;
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
    'eventId' in obj &&
    typeof (obj as EventEnvelope).eventId === 'string' &&
    'eventType' in obj &&
    typeof (obj as EventEnvelope).eventType === 'string' &&
    'timestamp' in obj &&
    typeof (obj as EventEnvelope).timestamp === 'number' &&
    'protocolVersion' in obj &&
    typeof (obj as EventEnvelope).protocolVersion === 'string' &&
    'payload' in obj &&
    typeof (obj as EventEnvelope).payload === 'object' &&
    (obj as EventEnvelope).payload !== null &&
    'type' in (obj as EventEnvelope).payload
  );
}
