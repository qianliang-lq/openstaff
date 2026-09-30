/**
 * TC-DEMO-POLLING-TIMEOUT: Demo fire 成功后轮询超时必须结束 running 状态
 *
 * 契约测试，验证：
 * - 场景1：轮询 10 次未获得有效结果 → 超时错误卡 + isRunning = false
 * - 场景2：轮询第 3 次获得 PASS 结果 → 成功卡 + isRunning = false
 * - 场景3：轮询第 5 次获得 FAILED 结果 → 失败卡 + isRunning = false
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

describe('TC-DEMO-POLLING-TIMEOUT: Demo 轮询超时必须结束 running 状态', () => {
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

  describe('场景 1: 轮询 10 次未获得有效结果 → 超时错误卡', () => {
    it(
      'should show timeout error and stop running after max attempts',
      async () => {
        const user = userEvent.setup();
        let pollCount = 0;

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
              ok: true,
              json: async () => ({ fired: true, job_id: 'test-job-123' }),
            });
          }
          if (url.includes('/v1/insights/latest')) {
            pollCount++;
            return Promise.resolve({
              ok: true,
              json: async () => ({
                reconcile_status: null,
                facts: [],
                timestamp: '2026-09-30',
              }),
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
            expect(errorCard, '超时后应显示错误卡').toBeInTheDocument();
          },
          { timeout: 12000 }
        );

        const errorText = container.textContent || '';
        expect(
          errorText.includes('运行超时') || errorText.includes('10s'),
          '超时错误应明确提示轮询超时时长'
        ).toBe(true);

        expect(
          errorText.includes('Runtime 仍在处理') ||
            errorText.includes('Gateway') ||
            errorText.includes('查看日志'),
          '超时错误应提供排查方向（Runtime/Gateway/日志）'
        ).toBe(true);

        expect(pollCount, '应完成 10 次轮询').toBeGreaterThanOrEqual(10);

        const runningText = container.querySelector('.fire-job-btn')?.textContent;
        expect(runningText?.includes('运行中'), '超时后不应持续显示「运行中」').toBe(false);
      },
      { timeout: 15000 }
    );
  });

  describe('场景 2: 轮询第 3 次获得 PASS 结果 → 成功卡', () => {
    it('should show success message and stop running when PASS result arrives', async () => {
      const user = userEvent.setup();
      let pollCount = 0;

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
            ok: true,
            json: async () => ({ fired: true, job_id: 'test-job-123' }),
          });
        }
        if (url.includes('/v1/insights/latest')) {
          pollCount++;
          if (pollCount >= 3) {
            return Promise.resolve({
              ok: true,
              json: async () => ({
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
              }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => ({
              reconcile_status: null,
              facts: [],
              timestamp: '2026-09-30',
            }),
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
          const successText = container.textContent || '';
          expect(
            successText.includes('运行成功') || successText.includes('已生成'),
            '成功后应显示成功消息'
          ).toBe(true);
        },
        { timeout: 5000 }
      );

      const runningText = container.querySelector('.fire-job-btn')?.textContent;
      expect(runningText?.includes('运行中'), '成功后不应持续显示「运行中」').toBe(false);
    });
  });

  describe('场景 3: 轮询第 5 次获得 FAILED 结果 → 失败卡', () => {
    it('should show failure message and stop running when FAILED result arrives', async () => {
      const user = userEvent.setup();
      let pollCount = 0;

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
            ok: true,
            json: async () => ({ fired: true, job_id: 'test-job-123' }),
          });
        }
        if (url.includes('/v1/insights/latest')) {
          pollCount++;
          if (pollCount >= 5) {
            return Promise.resolve({
              ok: true,
              json: async () => ({
                reconcile_status: 'FAILED',
                facts: [],
                timestamp: '2026-09-30',
              }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => ({
              reconcile_status: null,
              facts: [],
              timestamp: '2026-09-30',
            }),
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
          expect(errorCard, 'FAILED 后应显示错误卡').toBeInTheDocument();
        },
        { timeout: 7000 }
      );

      const errorText = container.textContent || '';
      expect(
        errorText.includes('FAILED') || errorText.includes('未通过审核'),
        'FAILED 错误应明确提示审核失败'
      ).toBe(true);

      const runningText = container.querySelector('.fire-job-btn')?.textContent;
      expect(runningText?.includes('运行中'), 'FAILED 后不应持续显示「运行中」').toBe(false);
    });
  });
});
