/**
 * TC-CHATSTAGE-DEMO-TOGGLE: Chat「显示演示内容」切换真反馈
 *
 * 契约测试，验证：
 * - 场景1：初始状态按钮显示「显示演示内容」+ 演示块不可见
 * - 场景2：点击按钮 → 按钮文案变为「隐藏演示内容」+ 演示块可见
 * - 场景3：再次点击 → 按钮文案恢复「显示演示内容」+ 演示块隐藏
 * - 场景4：演示块包含外部洞察报告卡片
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

describe('TC-CHATSTAGE-DEMO-TOGGLE: Chat「显示演示内容」切换真反馈', () => {
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
      return Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Service unavailable' }),
      });
    }) as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('场景 1: 初始状态按钮显示「显示演示内容」+ 演示块不可见', () => {
    it('should show toggle button with correct initial text', async () => {
      const { container } = render(
        <ChatStage
          agentName="测试产品经理"
          onNavigateToConnectors={() => {}}
          onNavigateToSkills={() => {}}
        />
      );

      await waitFor(() => {
        const toggleBtn = container.querySelector('.toggle-demo-btn');
        expect(toggleBtn, '切换按钮应存在').toBeInTheDocument();
        expect(toggleBtn?.textContent, '初始文案应为「显示演示内容」').toBe('显示演示内容');
      });

      // 验证演示块不可见（外部洞察报告相关内容）
      const externalInsightText = container.textContent || '';
      expect(
        externalInsightText.includes('外部洞察') && externalInsightText.includes('Factory CLI'),
        '初始状态演示块不应可见'
      ).toBe(false);
    });
  });

  describe('场景 2: 点击按钮 → 文案变「隐藏」+ 演示块可见', () => {
    it('should show demo content when toggle button clicked', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <ChatStage
          agentName="测试产品经理"
          onNavigateToConnectors={() => {}}
          onNavigateToSkills={() => {}}
        />
      );

      await waitFor(() => {
        const toggleBtn = container.querySelector('.toggle-demo-btn');
        expect(toggleBtn).toBeInTheDocument();
      });

      // 点击按钮
      const toggleBtn = container.querySelector('.toggle-demo-btn') as HTMLElement;
      await user.click(toggleBtn);

      // 验证按钮文案变化
      await waitFor(() => {
        expect(toggleBtn.textContent, '按钮文案应变为「隐藏演示内容」').toBe('隐藏演示内容');
      });

      // 验证演示块可见
      await waitFor(() => {
        const contentText = container.textContent || '';
        expect(
          contentText.includes('外部洞察') || contentText.includes('Factory'),
          '演示内容应可见'
        ).toBe(true);
      });
    });
  });

  describe('场景 3: 再次点击 → 文案恢复「显示」+ 演示块隐藏', () => {
    it('should hide demo content when toggle button clicked again', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <ChatStage
          agentName="测试产品经理"
          onNavigateToConnectors={() => {}}
          onNavigateToSkills={() => {}}
        />
      );

      await waitFor(() => {
        const toggleBtn = container.querySelector('.toggle-demo-btn');
        expect(toggleBtn).toBeInTheDocument();
      });

      const toggleBtn = container.querySelector('.toggle-demo-btn') as HTMLElement;

      // 第一次点击 - 显示
      await user.click(toggleBtn);
      await waitFor(() => {
        expect(toggleBtn.textContent).toBe('隐藏演示内容');
      });

      // 第二次点击 - 隐藏
      await user.click(toggleBtn);
      await waitFor(() => {
        expect(toggleBtn.textContent, '按钮文案应恢复为「显示演示内容」').toBe('显示演示内容');
      });

      // 验证演示块隐藏（演示相关的特定内容不应出现在主聊天区）
      // 注意：mock facts 可能在 state 中但不渲染在演示块外
      const messagesArea = container.querySelector('.chat-messages');
      const visibleDemoBlock = messagesArea?.querySelector('.external-insight-report-card');
      expect(visibleDemoBlock, '演示块应隐藏').not.toBeInTheDocument();
    });
  });

  describe('场景 4: 演示块包含外部洞察报告卡片', () => {
    it('should show external insight report card in demo block', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <ChatStage
          agentName="测试产品经理"
          onNavigateToConnectors={() => {}}
          onNavigateToSkills={() => {}}
        />
      );

      await waitFor(() => {
        const toggleBtn = container.querySelector('.toggle-demo-btn');
        expect(toggleBtn).toBeInTheDocument();
      });

      // 点击显示演示内容
      const toggleBtn = container.querySelector('.toggle-demo-btn') as HTMLElement;
      await user.click(toggleBtn);

      // 验证外部洞察报告卡片存在
      await waitFor(() => {
        const reportCard = container.querySelector('.external-insight-report-card');
        expect(reportCard, '应显示外部洞察报告卡片').toBeInTheDocument();
      });

      const contentText = container.textContent || '';
      expect(
        contentText.includes('Factory') || contentText.includes('GitHub'),
        '演示内容应包含实际洞察条目'
      ).toBe(true);
    });
  });
});
