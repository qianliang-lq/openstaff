import { describe, it, expect } from 'vitest';
import { createMessage, formatMessage } from './protocol-utils';

describe('protocol-utils', () => {
  it('creates message using @openstaff/protocol', () => {
    const msg = createMessage('test');
    expect(msg.content).toBe('test');
  });

  it('formats message', () => {
    const msg = createMessage('hello');
    expect(formatMessage(msg)).toBe('Message: hello');
  });
});
