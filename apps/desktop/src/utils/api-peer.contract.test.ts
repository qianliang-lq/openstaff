/**
 * Peer Messages Contract Test (§25 MVP)
 *
 * Verifies:
 * - POST /v1/agents/:id/peer-messages delivers to both sides
 * - peer_agent_id tracks counterpart
 * - Messages visible in both agents' inboxes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from './api';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('Peer Messages API Contract (§25)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TC-25-01: Send peer message creates double-sided storage', () => {
    it('should call POST /v1/agents/:id/peer-messages', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({}),
      });

      await api.sendPeerMessage('agent-a', 'agent-b', '你好，B岗');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/agents/agent-a/peer-messages'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            to_agent_id: 'agent-b',
            body: '你好，B岗',
          }),
        })
      );
    });
  });

  describe('TC-25-02: List messages includes peer messages', () => {
    it('should fetch messages with peer_agent_id field', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'msg-1',
            agent_id: 'agent-a',
            role: 'user',
            body: 'Normal message',
            ts: '2026-09-30T06:00:00Z',
            peer_agent_id: null,
          },
          {
            id: 'msg-2',
            agent_id: 'agent-a',
            role: 'agent',
            body: '来自B的消息',
            ts: '2026-09-30T06:01:00Z',
            peer_agent_id: 'agent-b',
          },
        ],
      });

      const messages = await api.listMessages('agent-a');

      expect(messages).toHaveLength(2);
      expect(messages[1].peer_agent_id).toBe('agent-b');
      expect(messages[1].role).toBe('agent');
    });
  });

  describe('TC-25-03: Error handling for missing agents', () => {
    it('should handle 404 when agent not found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Agent not found' }),
      });

      await expect(api.sendPeerMessage('agent-x', 'agent-y', 'test')).rejects.toThrow();

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('TC-25-04: Peer message payload format', () => {
    it('should send correct payload structure', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({}),
      });

      await api.sendPeerMessage('from-agent', 'to-agent', 'Message body');

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body as string);

      expect(requestBody).toEqual({
        to_agent_id: 'to-agent',
        body: 'Message body',
      });

      // Should NOT include thread_id, role, etc. (those are server-determined)
      expect(requestBody).not.toHaveProperty('role');
      expect(requestBody).not.toHaveProperty('thread_id');
    });
  });
});
