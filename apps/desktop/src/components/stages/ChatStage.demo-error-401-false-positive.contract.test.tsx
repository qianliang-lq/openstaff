/**
 * Contract Test: TC-DEMO-ERROR-401-FALSE-POSITIVE
 *
 * 验收标准：
 * 1. 已配置 Key 时，Demo「立即跑一次」失败（network/unknown）不得渲染「未配置模型 Key」401 卡
 * 2. 真正缺 Key 时（401 errorType），才显示「未配置模型 Key」引导卡
 *
 * 契约：错误卡片根据 errorType 区分展示
 * - errorType === '401' → 「未配置模型 Key」+ 去配置按钮
 * - errorType !== '401' → 显示实际错误内容 + 重试按钮（不含 Key 引导）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatStage from './ChatStage';
import * as tauriUtils from '../../utils/tauri';

// Mock Tauri utils module
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

describe('TC-DEMO-ERROR-401-FALSE-POSITIVE: Demo fire 失败不误报 401 Key 缺失', () => {
  const mockIsTauriEnvironment = vi.mocked(tauriUtils.isTauriEnvironment);
  const mockGetProviderKey = vi.mocked(tauriUtils.getProviderKey);

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTauriEnvironment.mockReturnValue(true);
    mockGetProviderKey.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('场景 1: 已配 Key + Demo fire network 失败 → 不显示「未配置模型 Key」', () => {
    it('should show generic error instead of "未配置模型 Key" when demo fire fails', async () => {
      const user = userEvent.setup();

      mockGetProviderKey.mockImplementation(async (provider: string) => {
        if (provider === 'qwen') {
          return 'sk-mock-qwen-key-12345';
        }
        return null;
      });

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

      await waitFor(
        () => {
          const statusPill = container.querySelector('.status-pill.configured');
          expect(statusPill).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const fireButton = container.querySelector('.fire-job-btn') as HTMLButtonElement;
      await user.click(fireButton);

      await waitFor(
        () => {
          const errorCard = container.querySelector('.error-card');
          expect(errorCard, 'Demo fire 失败应显示错误卡').toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      const errorCard = container.querySelector('.error-card');

      const errorTitle = errorCard?.querySelector('.error-title');
      expect(errorTitle?.textContent).not.toMatch(/未配置模型 Key/i);
      expect(errorTitle?.textContent).toMatch(/运行失败/i);

      const errorCode = errorCard?.querySelector('.error-code');
      if (errorCode) {
        expect(errorCode.textContent).not.toBe('401');
      }

      const errorBody = errorCard?.querySelector('.error-body');
      expect(errorBody?.textContent).not.toMatch(/Gateway 无法认证|去 Connectors 配置/i);

      const gotoConfigButton = errorCard?.querySelector('.btn-goto-config');
      expect(gotoConfigButton).toBeNull();
    });
  });

  describe('场景 2: 真正缺 Key → 必须显示「未配置模型 Key」引导', () => {
    it('should show key missing banner and empty state when no key configured', async () => {
      mockGetProviderKey.mockResolvedValue(null);

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
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' }),
        });
      }) as typeof fetch;

      const { container } = render(
        <ChatStage
          agentName="测试产品经理"
          onNavigateToConnectors={() => {}}
          onNavigateToSkills={() => {}}
        />
      );

      await vi.waitFor(
        () => {
          const noKeyBanner = container.querySelector('.no-key-banner');
          expect(noKeyBanner, '缺 Key 横幅必须存在').toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      const emptyState = container.querySelector('.chat-empty-state');
      expect(emptyState, '空状态引导卡必须存在').toBeInTheDocument();
    });
  });

  describe('场景 3: 已配 Key → 不出现 Key 缺失横幅', () => {
    it('should NOT show key missing banner when key is configured', async () => {
      mockGetProviderKey.mockImplementation(async (provider: string) => {
        if (provider === 'qwen') {
          return 'sk-mock-qwen-key-67890';
        }
        return null;
      });

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
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'Not found' }),
        });
      }) as typeof fetch;

      const { container } = render(
        <ChatStage
          agentName="测试产品经理"
          onNavigateToConnectors={() => {}}
          onNavigateToSkills={() => {}}
        />
      );

      await vi.waitFor(
        () => {
          const statusPill = container.querySelector('.status-pill.configured');
          expect(statusPill, 'Key 已配置状态指示器应该存在').toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const noKeyBanner = container.querySelector('.no-key-banner');
      expect(noKeyBanner, '不应出现 Key 缺失横幅（Key 已配置）').toBeNull();
    });
  });
});
