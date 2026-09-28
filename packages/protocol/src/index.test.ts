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
      eventType: 'test.event',
      payload: { data: 'test' },
      timestamp: Date.now(),
    };
    expect(envelope.eventType).toBe('test.event');
    expect(envelope.payload).toEqual({ data: 'test' });
  });

  it('validates EventEnvelope type guard', () => {
    const validEnvelope = {
      eventType: 'test',
      payload: {},
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
