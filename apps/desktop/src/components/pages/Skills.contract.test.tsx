/**
 * Skills/MCP Contract Tests (§24)
 *
 * Verifies:
 * - Per-agent skill mounts (岗 A != 岗 B)
 * - API endpoints return correct structure
 * - Toggle/Try/Test actions work
 * - No localStorage truth source
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Skills from './Skills';

// Mock API
const mockFetch = vi.fn();

describe('Skills/MCP Contract Tests (§24)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  describe('TC-24-01: Empty agent → show empty state', () => {
    it('should show empty state when no agent selected', () => {
      render(<Skills agentName="" />);

      expect(screen.getByText(/请先选择一个数字员工/i)).toBeInTheDocument();
      expect(screen.getByText(/Skills 和 MCP 按岗挂载/i)).toBeInTheDocument();
    });
  });

  describe('TC-24-02: Load skills from API', () => {
    it('should load skills for agent from API', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/v1/agents/test-agent/skills')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              agent_id: 'test-agent',
              items: [
                {
                  skill_id: 'web-search',
                  name: 'Web Search / 智能检索',
                  version: '1.2.0',
                  summary: '会话内即时检索',
                  enabled: true,
                },
                {
                  skill_id: 'validation-gate',
                  name: 'Validation Gate / 触发审批',
                  version: '0.4.1',
                  summary: 'Chat 内抛审卡 Widget',
                  enabled: false,
                },
              ],
            }),
          });
        }
        if (url.includes('/v1/agents/test-agent/mcp')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              agent_id: 'test-agent',
              items: [],
            }),
          });
        }
        return Promise.reject(new Error('Unexpected fetch'));
      });

      render(<Skills agentName="test-agent" />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Web Search / 智能检索')).toBeInTheDocument();
      expect(screen.getByText('Validation Gate / 触发审批')).toBeInTheDocument();
    });
  });

  describe('TC-24-03: Toggle skill enabled state', () => {
    it('should call PUT endpoint when toggling skill', async () => {
      const user = userEvent.setup();
      let skillEnabled = false;

      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/v1/agents/test-agent/skills') && !options?.method) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              agent_id: 'test-agent',
              items: [
                {
                  skill_id: 'web-search',
                  name: 'Web Search',
                  version: '1.2.0',
                  enabled: skillEnabled,
                },
              ],
            }),
          });
        }
        if (url.includes('/web-search') && options?.method === 'PUT') {
          const body = JSON.parse(options.body as string);
          skillEnabled = body.enabled;
          return Promise.resolve({ ok: true });
        }
        if (url.includes('/mcp')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ agent_id: 'test-agent', items: [] }),
          });
        }
        return Promise.reject(new Error('Unexpected fetch'));
      });

      render(<Skills agentName="test-agent" />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const toggle = screen.getAllByRole('checkbox')[0];
      expect(toggle).not.toBeChecked();

      await user.click(toggle);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/web-search'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ enabled: true }),
          })
        );
      });
    });
  });

  describe('TC-24-04: Try skill fixture', () => {
    it('should try skill and show fixture result', async () => {
      const user = userEvent.setup();

      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/v1/agents/test-agent/skills') && !options?.method) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              agent_id: 'test-agent',
              items: [
                {
                  skill_id: 'web-search',
                  name: 'Web Search',
                  version: '1.2.0',
                  enabled: true,
                },
              ],
            }),
          });
        }
        if (url.includes('/web-search/try') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ok: true,
              message: '✅ Web search fixture: 找到 3 条结果 (模拟)',
            }),
          });
        }
        if (url.includes('/mcp')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ agent_id: 'test-agent', items: [] }),
          });
        }
        return Promise.reject(new Error('Unexpected fetch'));
      });

      render(<Skills agentName="test-agent" />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const tryButton = screen.getByRole('button', { name: /试跑一次/i });
      await user.click(tryButton);

      await waitFor(() => {
        expect(screen.getByText(/找到 3 条结果/)).toBeInTheDocument();
      });
    });
  });

  describe('TC-24-05: Load MCP with status', () => {
    it('should load MCP and show status indicators', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/v1/agents/test-agent/skills')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ agent_id: 'test-agent', items: [] }),
          });
        }
        if (url.includes('/v1/agents/test-agent/mcp')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              agent_id: 'test-agent',
              items: [
                {
                  mcp_id: 'github',
                  name: 'GitHub MCP',
                  enabled: true,
                  status: 'connected',
                  last_checked_at: '2026-09-30T06:00:00Z',
                },
              ],
            }),
          });
        }
        return Promise.reject(new Error('Unexpected fetch'));
      });

      render(<Skills agentName="test-agent" />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('GitHub MCP')).toBeInTheDocument();
      expect(screen.getByText('connected')).toBeInTheDocument();
      expect(screen.getByText(/最后检查:/)).toBeInTheDocument();
    });
  });

  describe('TC-24-06: Per-agent isolation (no localStorage)', () => {
    it('should not use localStorage for skills truth source', async () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/skills')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ agent_id: 'test-agent', items: [] }),
          });
        }
        if (url.includes('/mcp')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ agent_id: 'test-agent', items: [] }),
          });
        }
        return Promise.reject(new Error('Unexpected fetch'));
      });

      render(<Skills agentName="test-agent" />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Should not read/write skills/mcp to localStorage
      expect(getItemSpy).not.toHaveBeenCalledWith(expect.stringMatching(/skill|mcp/i));
      expect(setItemSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/skill|mcp/i),
        expect.anything()
      );

      getItemSpy.mockRestore();
      setItemSpy.mockRestore();
    });
  });
});
