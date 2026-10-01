/**
 * TC-APPROVAL-PILL-INTERACTIVE: 审批 pill 可解除计数
 *
 * 契约测试，验证：
 * - 场景1：点击 pill → 显示审批面板（非 alert）
 * - 场景2：点击「通过」→ 计数变为 0 + Toast 反馈 + pill 状态变为「无待审批」
 * - 场景3：点击「驳回」→ 计数变为 0 + Toast 反馈 + pill 状态变为「无待审批」
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainStage from './MainStage';

describe('TC-APPROVAL-PILL-INTERACTIVE: 审批 pill 可解除计数', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('场景 1: 点击 pill → 显示审批面板（非 alert）', () => {
    it('should show approval panel when pill clicked', async () => {
      const user = userEvent.setup();
      const onTabChange = vi.fn();

      const { container } = render(
        <MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />
      );

      const pill = container.querySelector('.status-pill.wait');
      expect(pill, 'pill 应存在').toBeInTheDocument();
      expect(pill?.textContent, 'pill 初始计数为 1').toContain('等待审批 (1)');

      await user.click(pill as HTMLElement);

      await waitFor(() => {
        const panel = container.querySelector('.approval-panel');
        expect(panel, '点击后应显示审批面板').toBeInTheDocument();
      });

      const panelText = container.textContent || '';
      expect(
        panelText.includes('待审批事项') &&
          panelText.includes('通过') &&
          panelText.includes('驳回'),
        '面板应包含标题和操作按钮'
      ).toBe(true);
    });
  });

  describe('场景 2: 点击「通过」→ 计数变为 0 + Toast + pill 状态变', () => {
    it('should clear approval count and show feedback when approved', async () => {
      const user = userEvent.setup();
      const onTabChange = vi.fn();

      const { container } = render(
        <MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />
      );

      // 1. 打开审批面板
      const pill = container.querySelector('.status-pill.wait') as HTMLElement;
      await user.click(pill);

      await waitFor(() => {
        const panel = container.querySelector('.approval-panel');
        expect(panel).toBeInTheDocument();
      });

      // 2. 点击「通过」
      const approveBtn = container.querySelector('.btn-approve') as HTMLElement;
      expect(approveBtn, '通过按钮应存在').toBeInTheDocument();
      await user.click(approveBtn);

      // 3. 验证面板关闭
      await waitFor(() => {
        const panel = container.querySelector('.approval-panel');
        expect(panel, '面板应关闭').not.toBeInTheDocument();
      });

      // 4. 验证 Toast 反馈
      await waitFor(() => {
        const toast = container.querySelector('.approval-feedback-toast');
        expect(toast, '应显示反馈 Toast').toBeInTheDocument();
        expect(toast?.textContent, 'Toast 应提示通过').toContain('已通过审批');
      });

      // 5. 验证 pill 状态变化
      const approvedPill = container.querySelector('.status-pill.approved');
      expect(approvedPill, 'pill 状态应变为 approved').toBeInTheDocument();
      expect(approvedPill?.textContent, 'pill 文案应变为无待审批').toContain('无待审批');

      const waitPill = container.querySelector('.status-pill.wait');
      expect(waitPill, '原等待 pill 应消失').not.toBeInTheDocument();
    });
  });

  describe('场景 3: 点击「驳回」→ 计数变为 0 + Toast + pill 状态变', () => {
    it('should clear approval count and show feedback when rejected', async () => {
      const user = userEvent.setup();
      const onTabChange = vi.fn();

      const { container } = render(
        <MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />
      );

      // 1. 打开审批面板
      const pill = container.querySelector('.status-pill.wait') as HTMLElement;
      await user.click(pill);

      await waitFor(() => {
        const panel = container.querySelector('.approval-panel');
        expect(panel).toBeInTheDocument();
      });

      // 2. 点击「驳回」
      const rejectBtn = container.querySelector('.btn-reject') as HTMLElement;
      expect(rejectBtn, '驳回按钮应存在').toBeInTheDocument();
      await user.click(rejectBtn);

      // 3. 验证面板关闭
      await waitFor(() => {
        const panel = container.querySelector('.approval-panel');
        expect(panel, '面板应关闭').not.toBeInTheDocument();
      });

      // 4. 验证 Toast 反馈
      await waitFor(() => {
        const toast = container.querySelector('.approval-feedback-toast');
        expect(toast, '应显示反馈 Toast').toBeInTheDocument();
        expect(toast?.textContent, 'Toast 应提示驳回').toContain('已驳回');
      });

      // 5. 验证 pill 状态变化
      const approvedPill = container.querySelector('.status-pill.approved');
      expect(approvedPill, 'pill 状态应变为 approved').toBeInTheDocument();
      expect(approvedPill?.textContent, 'pill 文案应变为无待审批').toContain('无待审批');
    });
  });
});
