import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import * as tauriUtils from '../utils/tauri';

// Mock fetch
const mockFetch = vi.fn();

describe('§16 ChatKeyGuide Contract Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TC-16-01: No agent → must show guide, NOT fake bubbles', () => {
    it('should show banner with "去 Connectors" when no agent exists', () => {
      // Mock empty agents from API
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      render(<App />);

      const banner = document.querySelector('.no-agent-banner');
      expect(banner, 'No-agent banner must be visible').toBeInTheDocument();

      const bannerText = screen.getByText(/先去 Connectors 配置模型 Key.*再建岗/i);
      expect(bannerText, 'Banner must contain guide text').toBeInTheDocument();

      const connectorsButton = screen.getByRole('button', { name: /去 Connectors/i });
      expect(connectorsButton, '"去 Connectors" button must exist').toBeInTheDocument();
    });

    it('should show 3-step guide without fake assistant bubbles', () => {
      // Mock empty agents from API
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      render(<App />);

      // Check for step markers
      const emptySteps = document.querySelector('.empty-steps');
      expect(emptySteps, 'Empty steps container must be visible').toBeInTheDocument();

      const stepItems = document.querySelectorAll('.step-item');
      expect(stepItems.length, 'Must have 3 steps').toBe(3);

      // Must NOT show placeholder assistant bubbles
      const assistantBubbles = document.querySelectorAll('.message.assistant');
      expect(
        assistantBubbles.length,
        'No placeholder assistant messages should exist'
      ).toBe(0);
    });
  });

  describe('TC-16-02: Has agent but no BYOK Key → input disabled + key prompt', () => {
    it('should disable input and show BYOK key prompt', async () => {
      // Mock agent from API
      const testAgent = {
        id: `test-agent-${Date.now()}`,
        name: '测试产品经理',
        template_id: 'pm',
        duty: '产品管理',
        status: 'idle',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/v1/agents') && (!options?.method || options.method === 'GET')) {
          return Promise.resolve({
            ok: true,
            json: async () => [testAgent],
          });
        }
        if (url.includes('/messages')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        return Promise.reject(new Error('Unexpected fetch'));
      });

      localStorage.setItem('openstaff_active_agent', testAgent.name);

      vi.spyOn(tauriUtils, 'isTauriEnvironment').mockReturnValue(false);
      vi.spyOn(tauriUtils, 'getProviderKey').mockResolvedValue(null);

      render(<App />);

      const chatInput = document.querySelector('.chat-input') as HTMLInputElement;
      expect(chatInput, 'Chat input must exist').toBeInTheDocument();

      await waitFor(() => {
        expect(chatInput?.disabled, 'Chat input must be disabled without key').toBe(true);
      });

      const banner = document.querySelector('.no-key-banner');
      expect(banner, 'No-key banner must be visible').toBeInTheDocument();

      // Verify actual UI text: "未配置模型 Key，无法开始对话"
      const bannerText = screen.getByText(/未配置模型 Key.*无法开始对话/i);
      expect(bannerText, 'Banner must contain key prompt').toBeInTheDocument();

      // Verify "去 Connectors 配置" button exists in the banner
      const gotoButton = banner.querySelector('.btn-goto-connectors');
      expect(gotoButton, 'Go to Connectors button must exist').toBeInTheDocument();
      expect(gotoButton?.textContent, 'Button text must match UI').toMatch(/去 Connectors 配置/i);
    });
  });

  describe('TC-16-03: Has agent + stub chat 200 → assistant bubble appears', () => {
    it('should send real chat request and show assistant response', async () => {
      const user = userEvent.setup();

      // Mock agent from API
      const testAgent = {
        id: `test-agent-${Date.now()}`,
        name: '测试产品经理',
        template_id: 'pm',
        duty: '产品管理',
        status: 'idle',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/v1/agents') && (!options?.method || options.method === 'GET')) {
          return Promise.resolve({
            ok: true,
            json: async () => [testAgent],
          });
        }
        if (url.includes('/messages')) {
          if (options?.method === 'POST') {
            return Promise.resolve({
              ok: true,
              json: async () => ({
                id: `msg-${Date.now()}`,
                agent_id: testAgent.id,
                role: 'user',
                body: 'test',
                ts: new Date().toISOString(),
              }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/v1/chat')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              message: {
                content: 'REST 是 Representational State Transfer 的缩写，一种架构风格。',
              },
            }),
          });
        }
        return Promise.reject(new Error('Unexpected fetch'));
      });

      localStorage.setItem('openstaff_active_agent', testAgent.name);

      // Mock Tauri environment and utils
      (window as unknown as { __TAURI__?: object }).__TAURI__ = {};

      vi.spyOn(tauriUtils, 'isTauriEnvironment').mockReturnValue(true);
      vi.spyOn(tauriUtils, 'getProviderKey').mockResolvedValue('sk-test-key-from-tauri');

      render(<App />);

      // Wait for API load and agent to be active
      await waitFor(
        () => {
          const agentItems = document.querySelectorAll('.agent-item');
          expect(agentItems.length, 'Should have 1 agent from API').toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      await waitFor(() => {
        const activeAgent = document.querySelector('.agent-item.active');
        expect(activeAgent, 'Agent must be active').toBeInTheDocument();
      });

      // Verify chat input is enabled
      const chatInput = document.querySelector('.chat-input') as HTMLInputElement;
      expect(chatInput, 'Chat input must exist').toBeInTheDocument();
      expect(chatInput?.disabled, 'Chat input must be enabled with agent + key').toBe(false);

      // Type and send message
      await user.type(chatInput, '什么是 REST?');

      const sendButton = screen.getByRole('button', { name: /发送/i });
      await user.click(sendButton);

      // Verify assistant response appears
      await waitFor(
        () => {
          const assistantBubbles = document.querySelectorAll('.message.assistant');
          expect(
            assistantBubbles.length,
            'Assistant bubble must appear after response'
          ).toBeGreaterThan(0);

          const responseText = screen.getByText(/REST 是 Representational State Transfer/i);
          expect(responseText, 'Assistant response text must be visible').toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      delete (window as unknown as { __TAURI__?: object }).__TAURI__;
      vi.clearAllMocks();
    });
  });

  describe('TC-16-04: Chat fails → error banner visible', () => {
    it('should show error card when chat request fails', async () => {
      const user = userEvent.setup();

      // Mock agent from API
      const testAgent = {
        id: `test-agent-fail-${Date.now()}`,
        name: '测试运营专家',
        template_id: 'ops',
        duty: '运营管理',
        status: 'idle',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/v1/agents') && (!options?.method || options.method === 'GET')) {
          return Promise.resolve({
            ok: true,
            json: async () => [testAgent],
          });
        }
        if (url.includes('/messages')) {
          if (options?.method === 'POST') {
            return Promise.resolve({
              ok: true,
              json: async () => ({
                id: `msg-${Date.now()}`,
                agent_id: testAgent.id,
                role: 'user',
                body: 'test',
                ts: new Date().toISOString(),
              }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/v1/chat')) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: async () => ({
              error: 'Invalid API key',
            }),
          });
        }
        return Promise.reject(new Error('Unexpected fetch'));
      });

      localStorage.setItem('openstaff_active_agent', testAgent.name);

      // Mock Tauri environment and utils
      (window as unknown as { __TAURI__?: object }).__TAURI__ = {};

      vi.spyOn(tauriUtils, 'isTauriEnvironment').mockReturnValue(true);
      vi.spyOn(tauriUtils, 'getProviderKey').mockResolvedValue('sk-test-invalid-key');

      render(<App />);

      // Wait for API load and agent to be active
      await waitFor(
        () => {
          const agentItems = document.querySelectorAll('.agent-item');
          expect(agentItems.length, 'Should have 1 agent from API').toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      await waitFor(() => {
        const activeAgent = document.querySelector('.agent-item.active');
        expect(activeAgent, 'Agent must be active').toBeInTheDocument();
      });

      // Type and send message
      const chatInput = document.querySelector('.chat-input') as HTMLInputElement;
      await user.type(chatInput, '测试错误处理');

      const sendButton = screen.getByRole('button', { name: /发送/i });
      await user.click(sendButton);

      // Verify error card appears
      await waitFor(
        () => {
          const errorCard = document.querySelector('.error-card');
          expect(
            errorCard,
            'Error card must appear after failed request'
          ).toBeInTheDocument();

          const errorText = screen.getByText(/请求失败|Invalid API key|错误/i);
          expect(errorText, 'Error message must be visible').toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      delete (window as unknown as { __TAURI__?: object }).__TAURI__;
      vi.clearAllMocks();
    });
  });
});
