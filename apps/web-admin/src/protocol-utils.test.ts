import { describe, it, expect } from "vitest";
import { createMessageEnvelope, formatEventType } from "./protocol-utils";

describe("protocol-utils", () => {
  it("creates message envelope using @openstaff/protocol", () => {
    const envelope = createMessageEnvelope("e1", "test.message", "hello");
    expect(envelope.eventId).toBe("e1");
    expect(envelope.eventType).toBe("test.message");
    expect(envelope.protocolVersion).toBe("1.0");
    expect(envelope.timestamp).toBeDefined();
    expect(envelope.payload.type).toBe("Message");
    if (envelope.payload.type === "Message") {
      expect(envelope.payload.data.content).toBe("hello");
    }
  });

  it("formats event type", () => {
    const envelope = createMessageEnvelope("e2", "agent.created", "test");
    expect(formatEventType(envelope)).toBe("Event: agent.created");
  });
});
