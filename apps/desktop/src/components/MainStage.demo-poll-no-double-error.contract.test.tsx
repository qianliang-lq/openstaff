/**
 * TC-MAINSTAGE-DEMO-POLL-NO-DOUBLE: 顶栏 Demo poll catch 不叠卡 + job_status 移除验证
 *
 * 契约测试，验证：
 * - 场景1：轮询成功获得 PASS + facts → 出 insights，不出超时卡
 * - 场景2：轮询超时（10 次无结果）→ 只出一张超时卡，不叠加
 * - 场景3：轮询 FAILED → 立即出失败卡，不继续轮询或叠超时
 *
 * 注：PR #9 之后流程变更说明
 * -------------------------------
 * 旧流程（PR #9 之前）：
 * - MainStage 顶栏有「立即跑一次」按钮（非 Demo）→ 调用 /demo/scheduler → 轮询 /demo/status
 * - Demo 按钮在 ChatStage
 *
 * 新流程（PR #9 之后）：
 * - MainStage 顶栏只有「点火 Demo」按钮 → 直接调用 BFF demo/fire → 轮询 insights/latest
 * - ChatStage 也有「立即跑一次 (Demo)」按钮，同样流程
 * - 样例按钮与点火隔离，整卡 JSON 入库
 *
 * 原意图（轮询不重复报错）在新流程下仍有效：
 * - MainStage.runExternalInsightDemo 包含完整轮询逻辑
 * - 轮询超时/失败时通过 setDemoError 设置错误，只应显示一张错误卡
 * - 但测试需要重新设计以匹配新流程（BFF 鉴权、ChatStage 依赖等）
 *
 * 当前状态：测试框架已更新（按钮选择器、fetch mock），但测试环境隔离性问题导致失败
 * - 问题：MainStage 渲染时会渲染 ChatStage（activeTab='chat'），ChatStage mount 会加载 agents/messages
 * - 解决方案待优化：需要更完整的 fixture 或 integration test 环境
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainStage from './MainStage';
import * as tauriUtils from '../utils/tauri';
import * as api from '../utils/api';

vi.mock('../utils/tauri', async () => {
  const actual = await vi.importActual<typeof import('../utils/tauri')>('../utils/tauri');
  return {
    ...actual,
    isTauriEnvironment: vi.fn(),
    getProviderKey: vi.fn(),
    saveProviderKey: vi.fn(),
    deleteProviderKey: vi.fn(),
  };
});

vi.mock('../utils/api', async () => {
  const actual = await vi.importActual<typeof import('../utils/api')>('../utils/api');
  return {
    ...actual,
    fireDemoJob: vi.fn(),
    getLatestInsight: vi.fn(),
    listAgents: vi.fn(),
    listMessages: vi.fn(),
  };
});

describe('TC-MAINSTAGE-DEMO-POLL-NO-DOUBLE: 顶栏 Demo 不叠卡 + job_status 移除', () => {
  const mockIsTauriEnvironment = vi.mocked(tauriUtils.isTauriEnvironment);
  const mockGetProviderKey = vi.mocked(tauriUtils.getProviderKey);
  const mockFireDemoJob = vi.mocked(api.fireDemoJob);
  const mockGetLatestInsight = vi.mocked(api.getLatestInsight);
  const mockListAgents = vi.mocked(api.listAgents);
  const mockListMessages = vi.mocked(api.listMessages);

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTauriEnvironment.mockReturnValue(true);
    mockGetProviderKey.mockImplementation(async (provider: string) => {
      if (provider === 'qwen') {
        return 'sk-mock-qwen-key-12345';
      }
      return null;
    });

    // Mock basic APIs
    mockListAgents.mockResolvedValue([
      {
        id: 'agent-test-uuid',
        name: '测试员工',
        role: 'pm',
        status: 'idle',
      },
    ]);
    mockListMessages.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('场景 1: 轮询成功获得 PASS + facts → 不出超时错误', () => {
    it(
      'should not show timeout error when PASS result arrives',
      async () => {
        const user = userEvent.setup();
        const onTabChange = vi.fn();

        // Mock demo/fire 成功
        mockFireDemoJob.mockResolvedValue({ fired: true, job_id: 'test-job-123' } as any);

        // Mock insights/latest 返回 PASS
        mockGetLatestInsight.mockResolvedValue({
          reconcile_status: 'PASS',
          facts: [
            {
              bucket: '竞对',
              title: 'Test Insight',
              summary_zh: 'Test summary',
              url: 'https://example.com',
              tags: ['test'],
            },
          ],
          timestamp: '2026-09-30',
        } as any);

        render(<MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />);

        // 新流程：MainStage 顶栏「点火 Demo」按钮
        const fireButton = Array.from(document.querySelectorAll('button')).find(
          (btn) => btn.textContent?.includes('点火 Demo')
        );
        expect(fireButton, '应找到「点火 Demo」按钮').toBeTruthy();

        await user.click(fireButton as HTMLElement);

        // Wait for polling to complete
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const errorBanner = document.querySelector('.demo-error-banner');
        expect(errorBanner, '成功后不应显示超时错误').toBeNull();

        const fireButtonAfter = Array.from(document.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('点火 Demo')
        );
        expect(
          fireButtonAfter?.textContent?.includes('运行中'),
          '成功后不应持续显示「运行中」'
        ).toBe(false);
      },
      { timeout: 10000 }
    );
  });

  describe('场景 2: 轮询超时 → 只出一张超时卡', () => {
    it(
      'should show only one timeout error card after max polls',
      async () => {
        const user = userEvent.setup();
        const onTabChange = vi.fn();
        let pollCount = 0;

        // Mock demo/fire 成功
        mockFireDemoJob.mockResolvedValue({ fired: true, job_id: 'test-job-123' } as any);

        // Mock insights/latest 始终返回 null（超时）
        mockGetLatestInsight.mockImplementation(async () => {
          pollCount++;
          return {
            reconcile_status: null,
            facts: [],
            timestamp: '2026-09-30',
          } as any;
        });

        render(<MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />);

        // 新流程：MainStage 顶栏「点火 Demo」按钮
        const fireButton = Array.from(document.querySelectorAll('button')).find(
          (btn) => btn.textContent?.includes('点火 Demo')
        );
        expect(fireButton, '应找到「点火 Demo」按钮').toBeTruthy();

        await user.click(fireButton as HTMLElement);

        await waitFor(
          () => {
            const errorBanner = document.querySelector('.demo-error-banner');
            expect(errorBanner, '超时后应显示错误卡').toBeInTheDocument();
          },
          { timeout: 12000 }
        );

        const errorBanners = document.querySelectorAll('.demo-error-banner');
        expect(errorBanners.length, '只应显示一张超时错误卡').toBe(1);

        const errorText = document.querySelector('.error-text')?.textContent || '';
        expect(
          errorText.includes('运行超时') || errorText.includes('10s') || errorText.includes('10'),
          '超时错误应明确提示轮询超时'
        ).toBe(true);

        expect(pollCount, '应完成 10 次轮询').toBeGreaterThanOrEqual(10);
      },
      { timeout: 15000 }
    );
  });

  describe('场景 3: 轮询 FAILED → 立即出失败卡', () => {
    it(
      'should show failure error immediately when FAILED result arrives',
      async () => {
        const user = userEvent.setup();
        const onTabChange = vi.fn();

        // Mock demo/fire 成功
        mockFireDemoJob.mockResolvedValue({ fired: true, job_id: 'test-job-123' } as any);

        // Mock insights/latest 返回 FAILED
        mockGetLatestInsight.mockResolvedValue({
          reconcile_status: 'FAILED',
          facts: [],
          timestamp: '2026-09-30',
        } as any);

        render(<MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />);

        // 新流程：MainStage 顶栏「点火 Demo」按钮
        const fireButton = Array.from(document.querySelectorAll('button')).find(
          (btn) => btn.textContent?.includes('点火 Demo')
        );
        expect(fireButton, '应找到「点火 Demo」按钮').toBeTruthy();

        await user.click(fireButton as HTMLElement);

        await waitFor(
          () => {
            const errorBanner = document.querySelector('.demo-error-banner');
            expect(errorBanner, 'FAILED 后应显示错误卡').toBeInTheDocument();
          },
          { timeout: 5000 }
        );

        const errorText = document.querySelector('.error-text')?.textContent || '';
        expect(
          errorText.includes('FAILED') || errorText.includes('未通过审核') || errorText.includes('reconcile_status'),
          'FAILED 错误应明确提示审核失败'
        ).toBe(true);

        const errorBanners = document.querySelectorAll('.demo-error-banner');
        expect(errorBanners.length, '只应显示一张失败错误卡').toBe(1);
      },
      { timeout: 10000 }
    );
  });
});
