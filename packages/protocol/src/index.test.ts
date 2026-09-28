import { describe, it, expect } from 'vitest';
import { Message, EventEnvelope, isMessage, isEventEnvelope } from './index';

describe('Message', () => {
  it('creates valid Message object', () => {
    const msg: Message = {
      content: 'test message',
    };
    expect(msg.content).toBe('test message');
  });

  it('validates Message type guard', () => {
    const validMsg = { content: 'hello' };
    const invalidMsg = { text: 'hello' };

    expect(isMessage(validMsg)).toBe(true);
    expect(isMessage(invalidMsg)).toBe(false);
    expect(isMessage(null)).toBe(false);
    expect(isMessage(undefined)).toBe(false);
  });

  it.todo('roundtrip test with Rust Message serialization');
});

describe('EventEnvelope', () => {
  it('creates valid EventEnvelope object', () => {
    const envelope: EventEnvelope = {
      eventId: 'evt-123',
      eventType: 'test.event',
      timestamp: Date.now(),
      protocolVersion: '1.0',
      payload: { type: 'Message', data: { content: 'hello' } },
    };
    expect(envelope.eventId).toBe('evt-123');
    expect(envelope.eventType).toBe('test.event');
    expect(envelope.protocolVersion).toBe('1.0');
    expect(envelope.payload).toEqual({ type: 'Message', data: { content: 'hello' } });
  });

  it('validates EventEnvelope type guard', () => {
    const validEnvelope = {
      eventId: 'evt-456',
      eventType: 'test',
      timestamp: 123456789,
      protocolVersion: '1.0',
      payload: { type: 'Message', data: { content: 'test' } },
    };
    const invalidEnvelope = {
      type: 'test',
      payload: {},
    };

    expect(isEventEnvelope(validEnvelope)).toBe(true);
    expect(isEventEnvelope(invalidEnvelope)).toBe(false);
  });

  it.todo('roundtrip test with Rust EventEnvelope when implemented');
});
