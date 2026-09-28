import { describe, it, expect } from 'vitest';
import { Message, EventEnvelope, EventPayload, isMessage, isEventEnvelope } from './index';

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
  it('creates valid EventEnvelope with Message payload', () => {
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

  it('creates valid EventEnvelope with AgentStateChange payload', () => {
    const envelope: EventEnvelope = {
      eventId: 'e2',
      eventType: 'agent.state',
      timestamp: 1234567890,
      protocolVersion: '1.0',
      payload: {
        type: 'AgentStateChange',
        data: { agent_id: 'agent1', state: 'running' },
      },
    };
    expect(envelope.payload.type).toBe('AgentStateChange');
    if (envelope.payload.type === 'AgentStateChange') {
      expect(envelope.payload.data.agent_id).toBe('agent1');
      expect(envelope.payload.data.state).toBe('running');
    }
  });

  it('validates EventEnvelope type guard', () => {
    const validEnvelope = {
      eventId: 'evt-456',
      eventType: 'test',
      timestamp: 123456789,
      protocolVersion: '1.0',
      payload: { type: 'Message', data: { content: 'test' } },
    };
    const invalidEnvelope1 = {
      type: 'test',
      payload: {},
    };
    const invalidEnvelope2 = {
      eventId: 'e1',
      eventType: 'test',
      timestamp: 'invalid',
      protocolVersion: '1.0',
      payload: { type: 'Message' },
    };

    expect(isEventEnvelope(validEnvelope)).toBe(true);
    expect(isEventEnvelope(invalidEnvelope1)).toBe(false);
    expect(isEventEnvelope(invalidEnvelope2)).toBe(false);
  });

  it.todo('roundtrip test with Rust EventEnvelope serialization');
});
