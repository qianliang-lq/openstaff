/**
 * 契约测试 - §25 岗间对话发送（ChatStage @ 选择器）
 * TC-25-UI-01: @ 按钮显示并打开岗位选择器
 * TC-25-UI-02: 选择岗位后发送 peer message
 * TC-25-UI-03: 成功显示 Toast「已投递给 {名}」
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import ChatStage from './ChatStage';

const mockFacts: never[] = [];

describe('ChatStage - Peer Message Sending (§25 MVP)', () => {
  let mockAgents: Array<{ id: string; name: string; role: string; persona: string }> = [];
  let mockMessages: Array<{ id: string; role: string; body: string; peer_agent_id?: string }> = [];
  let mockKeys: Record<string, string> = {};

  beforeEach(() => {
    mockAgents = [
      { id: 'agent-1', name: 'Alice', role: 'Product Manager', persona: 'PM' },
      { id: 'agent-2', name: 'Bob', role: 'Engineer', persona: 'Dev' },
    ];
    mockMessages = [];
    mockKeys = { qwen: 'test-qwen-key' };

    global.fetch = vi.fn((input: RequestInfo, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;
      const method = (init?.method || 'GET').toUpperCase();

      console.log('[Mock Fetch]', method, url);

      // API: list agents (must match exact pattern)
      if (url.endsWith('/v1/agents') && method === 'GET') {
        console.log('[Mock Fetch] Returning mockAgents:', mockAgents);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockAgents,
        } as Response);
      }

      // API: list messages
      if (url.includes('/messages') && !url.includes('peer-messages') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockMessages,
        } as Response);
      }

      // API: send peer message (POST /v1/agents/:id/peer-messages)
      if (url.includes('/peer-messages') && method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({}),
        } as Response);
      }

      // Chat endpoint
      if (url.includes('/v1/chat') && method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ message: { content: 'Response from LLM' } }),
        } as Response);
      }

      console.warn('[Mock Fetch] Unmocked:', method, url);
      return Promise.reject(new Error(`Unmocked URL: ${method} ${url}`));
    });

    // Mock Tauri environment
    const mockInvoke = vi.fn(async (cmd: string, args?: { provider?: string; key?: string }) => {
      if (cmd === 'get_provider_key') {
        const provider = args?.provider || '';
        return mockKeys[provider] || null;
      }
      return null;
    });

    (window as never as { __TAURI__: unknown }).__TAURI__ = {
      core: { invoke: mockInvoke },
      tauri: { invoke: mockInvoke },
    };

    // Also set __TAURI_INTERNALS__ for compatibility
    (window as never as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = {
      invoke: mockInvoke,
      metadata: {
        windows: {
          current: { label: 'main' },
        },
        currentWindow: { label: 'main' },
      },
    };
  });

  it('TC-25-UI-01: @ 按钮显示，点击后打开岗位选择器', async () => {
    const user = userEvent.setup();

    render(
      <ChatStage agentName="Alice" mockFacts={mockFacts} hasAgent={true} onCreateAgent={() => {}} />
    );

    await waitFor(
      () => {
        expect(screen.getByPlaceholderText('输入消息...')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(() => {
      expect(screen.getByTitle('@ 选择其他岗位')).toBeInTheDocument();
    });

    const atButton = screen.getByTitle('@ 选择其他岗位');
    await user.click(atButton);

    await waitFor(() => {
      expect(screen.getByText('选择岗位')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument(); // Bob 应该出现
    });
  });

  it('TC-25-UI-02: 选择岗位后，发送 peer message', async () => {
    const user = userEvent.setup();

    render(
      <ChatStage agentName="Alice" mockFacts={mockFacts} hasAgent={true} onCreateAgent={() => {}} />
    );

    await waitFor(
      () => {
        expect(screen.getByPlaceholderText('输入消息...')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(() => {
      expect(screen.getByTitle('@ 选择其他岗位')).toBeInTheDocument();
    });

    // Open picker
    const atButton = screen.getByTitle('@ 选择其他岗位');
    await user.click(atButton);

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    // Select Bob
    const bobItem = screen.getByText('Bob');
    await user.click(bobItem);

    await waitFor(() => {
      expect(screen.queryByText('选择岗位')).not.toBeInTheDocument(); // Picker closed
    });

    // Type message
    const input = screen.getByPlaceholderText(/发送给 Bob/i);
    await user.type(input, 'Hello Bob!');

    // Send
    const sendButton = screen.getByRole('button', { name: /发送/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/agents/agent-1/peer-messages'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ to_agent_id: 'agent-2', body: 'Hello Bob!' }),
        })
      );
    });
  });

  it('TC-25-UI-03: 成功发送 peer message 后显示 Toast「已投递给 {名}」', async () => {
    const user = userEvent.setup();

    render(
      <ChatStage agentName="Alice" mockFacts={mockFacts} hasAgent={true} onCreateAgent={() => {}} />
    );

    await waitFor(
      () => {
        expect(screen.getByPlaceholderText('输入消息...')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(() => {
      expect(screen.getByTitle('@ 选择其他岗位')).toBeInTheDocument();
    });

    // Open picker and select Bob
    const atButton = screen.getByTitle('@ 选择其他岗位');
    await user.click(atButton);

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    const bobItem = screen.getByText('Bob');
    await user.click(bobItem);

    // Type and send
    const input = screen.getByPlaceholderText(/发送给 Bob/i);
    await user.type(input, 'Test message');

    const sendButton = screen.getByRole('button', { name: /发送/i });
    await user.click(sendButton);

    // Check for success toast (message added to chat)
    await waitFor(
      () => {
        const successMsg = screen.queryByText(/已投递给/i);
        expect(successMsg).toBeInTheDocument();
        expect(successMsg?.textContent).toMatch(/Bob/);
      },
      { timeout: 8000 }
    );
  });
});
