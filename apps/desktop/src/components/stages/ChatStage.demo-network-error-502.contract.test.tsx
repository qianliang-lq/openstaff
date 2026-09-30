/**
 * TC-DEMO-ERROR-502-DIFFERENTIATE: Demo fire 返回 502/503 时区分下游服务未就绪 vs 连接失败
 *
 * 契约测试，验证错误文案准确区分：
 * - 场景1：fetch 连接失败 (TypeError) → 提示无法连接到 Scheduler
 * - 场景2：Scheduler 返回 502 Bad Gateway → 提示下游 Runtime 服务未就绪
 * - 场景3：Scheduler 返回 503 Service Unavailable → 提示下游服务不可用
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatStage from './ChatStage';
import * as tauriUtils from '../../utils/tauri';

vi.mock('../../utils/tauri', async () => {
  const actual = await vi.importActual<typeof import('../../utils/tauri')>('../../utils/tauri');
  return {
    ...actual,
    isTauriEnvironment: vi.fn(),
    getProviderKey: vi.fn(),
    saveProviderKey: vi.fn(),
    deleteProviderKey: vi.fn(),
  };
});

describe('TC-DEMO-ERROR-502-DIFFERENTIATE: Demo fire 错误区分 502/503 vs 连接失败', () => {
  const mockIsTauriEnvironment = vi.mocked(tauriUtils.isTauriEnvironment);
  const mockGetProviderKey = vi.mocked(tauriUtils.getProviderKey);

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTauriEnvironment.mockReturnValue(true);
    mockGetProviderKey.mockImplementation(async (provider: string) => {
      if (provider === 'qwen') {
        return 'sk-mock-qwen-key-12345';
      }
      return null;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('场景 1: fetch 连接失败 → 提示无法连接到 Scheduler', () => {
    it('should show connection error when fetch fails with TypeError', async () => {
      const user = userEvent.setup();

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/v1/agents')) {
          return Promise.resolve({
            ok: true,
            json: async () => [
              {
                id: 'agent-test-uuid',
                name: '测试产品经理',
                template_id: 'pm',
                duty: '产品管理',
                status: 'idle',
              },
            ],
          });
        }
        if (url.includes('/v1/messages')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/demo/fire')) {
          return Promise.reject(new TypeError('Failed to fetch'));
        }
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Service unavailable' }),
        });
      }) as typeof fetch;

      const { container } = render(
        <ChatStage
          agentName="测试产品经理"
          onNavigateToConnectors={() => {}}
          onNavigateToSkills={() => {}}
        />
      );

      const fireButton = container.querySelector('.fire-job-btn') as HTMLButtonElement;
      await user.click(fireButton);

      await waitFor(
        () => {
          const errorCard = container.querySelector('.error-card');
          expect(errorCard, 'fetch 失败应显示错误卡').toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      const errorText = container.textContent || '';
      expect(
        errorText.includes('无法连接到 Scheduler') || errorText.includes('pnpm tauri:dev'),
        'TypeError 应提示无法连接到 Scheduler，给出启动命令'
      ).toBe(true);

      expect(
        errorText.includes('502') || errorText.includes('503'),
        'TypeError 不应显示 502/503 状态码'
      ).toBe(false);
    });
  });

  describe('场景 2: Scheduler 返回 502 → 提示下游 Runtime 服务未就绪', () => {
    it('should show downstream service error when Scheduler returns 502', async () => {
      const user = userEvent.setup();

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/v1/agents')) {
          return Promise.resolve({
            ok: true,
            json: async () => [
              {
                id: 'agent-test-uuid',
                name: '测试产品经理',
                template_id: 'pm',
                duty: '产品管理',
                status: 'idle',
              },
            ],
          });
        }
        if (url.includes('/v1/messages')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/demo/fire')) {
          return Promise.resolve({
            ok: false,
            status: 502,
            text: async () => JSON.stringify({ error: 'Runtime not ready' }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Service unavailable' }),
        });
      }) as typeof fetch;

      const { container } = render(
        <ChatStage
          agentName="测试产品经理"
          onNavigateToConnectors={() => {}}
          onNavigateToSkills={() => {}}
        />
      );

      const fireButton = container.querySelector('.fire-job-btn') as HTMLButtonElement;
      await user.click(fireButton);

      await waitFor(
        () => {
          const errorCard = container.querySelector('.error-card');
          expect(errorCard, 'Scheduler 返回 502 应显示错误卡').toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      const errorText = container.textContent || '';
      expect(
        errorText.includes('502') && (errorText.includes('下游') || errorText.includes('Runtime')),
        '502 错误应明确提示下游 Runtime 服务未就绪'
      ).toBe(true);

      expect(
        errorText.includes('无法连接到 Scheduler'),
        '502 错误不应误报为 Scheduler 本身连接失败'
      ).toBe(false);
    });
  });

  describe('场景 3: Scheduler 返回 503 → 提示下游服务不可用', () => {
    it('should show downstream service unavailable when Scheduler returns 503', async () => {
      const user = userEvent.setup();

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/v1/agents')) {
          return Promise.resolve({
            ok: true,
            json: async () => [
              {
                id: 'agent-test-uuid',
                name: '测试产品经理',
                template_id: 'pm',
                duty: '产品管理',
                status: 'idle',
              },
            ],
          });
        }
        if (url.includes('/v1/messages')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/demo/fire')) {
          return Promise.resolve({
            ok: false,
            status: 503,
            text: async () => 'Service Unavailable',
          });
        }
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Service unavailable' }),
        });
      }) as typeof fetch;

      const { container } = render(
        <ChatStage
          agentName="测试产品经理"
          onNavigateToConnectors={() => {}}
          onNavigateToSkills={() => {}}
        />
      );

      const fireButton = container.querySelector('.fire-job-btn') as HTMLButtonElement;
      await user.click(fireButton);

      await waitFor(
        () => {
          const errorCard = container.querySelector('.error-card');
          expect(errorCard, 'Scheduler 返回 503 应显示错误卡').toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      const errorText = container.textContent || '';
      expect(
        errorText.includes('503') && (errorText.includes('下游') || errorText.includes('Runtime')),
        '503 错误应明确提示下游服务未就绪'
      ).toBe(true);

      expect(
        errorText.includes('无法连接到 Scheduler'),
        '503 错误不应误报为 Scheduler 本身连接失败'
      ).toBe(false);
    });
  });
});
