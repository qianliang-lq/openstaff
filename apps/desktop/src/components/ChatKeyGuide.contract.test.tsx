import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import * as tauriUtils from '../utils/tauri';

describe('§16 ChatKeyGuide Contract Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TC-16-01: No agent → must show guide, NOT fake bubbles', () => {
    it('should show banner with "去 Connectors" when no agent exists', () => {
      render(<App />);

      const banner = document.querySelector('.no-agent-banner');
      expect(banner, 'No-agent banner must be visible').toBeInTheDocument();

      const bannerText = screen.getByText(/先去 Connectors 配置模型 Key.*再建岗/i);
      expect(bannerText, 'Banner must contain guide text').toBeInTheDocument();

      const connectorsButton = screen.getByRole('button', { name: /去 Connectors/i });
      expect(connectorsButton, '"去 Connectors" button must exist').toBeInTheDocument();
    });

    it('should show 3-step guide without fake assistant bubbles', () => {
      render(<App />);

      // Check for step markers
      const emptySteps = document.querySelector('.empty-steps');
      expect(emptySteps, 'Empty steps container must be visible').toBeInTheDocument();

      const stepItems = document.querySelectorAll('.step-item');
      expect(stepItems.length, 'Must have 3 steps').toBe(3);

      // Check step content exists
      const stepContent = screen.getByText(/在 Connectors 填写/i);
      expect(stepContent, 'Step description must be visible').toBeInTheDocument();

      // MUST NOT show fake assistant bubbles
      const fakeAssistantBubbles = document.querySelectorAll('.message.assistant');
      expect(
        fakeAssistantBubbles.length,
        'MUST NOT render fake assistant bubbles when no agent exists'
      ).toBe(0);
    });

    it('should have input disabled when no agent exists', () => {
      render(<App />);

      const input = document.querySelector('.chat-input') as HTMLInputElement;
      expect(input, 'Chat input must exist').toBeInTheDocument();
      expect(input?.disabled, 'Chat input must be disabled when no agent').toBe(true);
      expect(input?.placeholder, 'Placeholder must indicate key + agent required').toContain(
        '请先配置 Key 并创建数字员工'
      );

      const sendButton = screen.getByRole('button', { name: /发送/i });
      expect(sendButton, 'Send button must be disabled').toBeDisabled();
    });
  });

  describe('TC-16-02: Click "去 Connectors" → switches to Connectors tab', () => {
    it('should navigate to Connectors tab when clicking "去 Connectors"', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Click the "去 Connectors" button in no-agent banner
      const connectorsButton = screen.getByRole('button', { name: /去 Connectors/i });
      expect(connectorsButton, '"去 Connectors" button must exist').toBeInTheDocument();

      await user.click(connectorsButton);

      await waitFor(
        () => {
          // Check for Connectors tab being active
          const activeTab = document.querySelector('.tab.active');
          expect(
            activeTab,
            'Active tab must exist after clicking "去 Connectors"'
          ).toBeInTheDocument();
          expect(activeTab?.textContent, 'Connectors tab must be active').toContain('Connectors');
        },
        { timeout: 2000 }
      );

      // Also verify Connectors content is visible
      await waitFor(() => {
        const connectorsTitle = screen.getByText(/模型 Key.*BYOK/i);
        expect(connectorsTitle, 'Connectors content must be visible').toBeInTheDocument();
      });
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
        if (url.includes('/v1/agents') && !options?.method) {
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

      // Mock fetch for chat API
      const mockFetch = vi.fn((url: string) => {
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

      global.fetch = mockFetch as unknown as typeof fetch;

      render(<App />);

      // Wait for agent to be active
      await waitFor(() => {
        const activeAgent = document.querySelector('.agent-item.active');
        expect(activeAgent, 'Agent must be active').toBeInTheDocument();
      });

      // Verify chat input is enabled
      const chatInput = document.querySelector('.chat-input') as HTMLInputElement;
      expect(chatInput, 'Chat input must exist').toBeInTheDocument();
      expect(chatInput?.disabled, 'Chat input must be enabled with agent + key').toBe(false);

      // Type and send message
      await user.type(chatInput, '什么是 REST？');
      const sendButton = screen.getByRole('button', { name: /发送/i });
      await user.click(sendButton);

      // Verify fetch was called with correct endpoint
      await waitFor(
        () => {
          expect(mockFetch, 'Must have called chat API').toHaveBeenCalled();

          const chatCalls = mockFetch.mock.calls.filter((call) =>
            (call[0] as string).includes('/v1/chat')
          );
          expect(chatCalls.length, 'Must call /v1/chat endpoint').toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

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

      // Directly write agent to localStorage
      const testAgent = {
        id: `test-agent-fail-${Date.now()}`,
        name: '测试运营专家',
        role: '运营管理',
        status: 'idle',
        avatar: '运',
        avatarClass: 'ops',
      };
      localStorage.setItem('openstaff_agents', JSON.stringify([testAgent]));
      localStorage.setItem('openstaff_active_agent', testAgent.name);

      // Mock Tauri environment and utils
      (window as unknown as { __TAURI__?: object }).__TAURI__ = {};

      vi.spyOn(tauriUtils, 'isTauriEnvironment').mockReturnValue(true);
      vi.spyOn(tauriUtils, 'getProviderKey').mockResolvedValue('sk-test-invalid-key');

      // Mock fetch to return 401 error
      const mockFetch = vi.fn((url: string) => {
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

      global.fetch = mockFetch as unknown as typeof fetch;

      render(<App />);

      // Wait for agent to be active
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
            'Error card must be visible when chat request fails'
          ).toBeInTheDocument();

          // Verify error message contains relevant info
          const errorText = errorCard?.textContent || '';
          expect(errorText, 'Error card must contain error information').toMatch(
            /未配置|失败|401|错误/i
          );
        },
        { timeout: 3000 }
      );

      delete (window as unknown as { __TAURI__?: object }).__TAURI__;
      vi.clearAllMocks();
    });
  });

  describe('TC-16-05: Keys must NOT be saved to localStorage', () => {
    it('should NOT save any keys to localStorage', () => {
      render(<App />);

      // Check localStorage does NOT contain provider keys
      const localStorageKeys = Object.keys(localStorage);
      const hasProviderKeyInLocalStorage = localStorageKeys.some(
        (key) =>
          (key.toLowerCase().includes('key') && !key.includes('openstaff')) ||
          key.toLowerCase().includes('qwen') ||
          key.toLowerCase().includes('glm') ||
          (key.toLowerCase().includes('api') && !key.includes('openstaff'))
      );

      expect(
        hasProviderKeyInLocalStorage,
        'MUST NOT save provider keys (qwen/glm/api key) to localStorage'
      ).toBe(false);

      // Verify agent persistence is allowed (openstaff_agents / openstaff_active_agent)
      // These are OK to be in localStorage
      const allowedKeys = ['openstaff_agents', 'openstaff_active_agent'];
      const allStorageKeys = Object.keys(localStorage);
      const disallowedKeys = allStorageKeys.filter((key) => {
        return (
          !allowedKeys.includes(key) &&
          (key.toLowerCase().includes('key') ||
            key.toLowerCase().includes('qwen') ||
            key.toLowerCase().includes('glm') ||
            key.toLowerCase().includes('provider'))
        );
      });

      expect(
        disallowedKeys.length,
        `localStorage must NOT contain provider keys. Found: ${disallowedKeys.join(', ')}`
      ).toBe(0);
    });
  });
});
