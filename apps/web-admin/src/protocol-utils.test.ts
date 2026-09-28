import { describe, it, expect } from "vitest";
import { createEventEnvelope, formatEventType } from "./protocol-utils";

describe("protocol-utils", () => {
  it("creates event envelope using @openstaff/protocol", () => {
    const envelope = createEventEnvelope("test.event", { data: "test" });
    expect(envelope.eventType).toBe("test.event");
    expect(envelope.payload).toEqual({ data: "test" });
    expect(envelope.timestamp).toBeDefined();
  });

  it("formats event type", () => {
    const envelope = createEventEnvelope("agent.created", {});
    expect(formatEventType(envelope)).toBe("Event: agent.created");
  });
});
