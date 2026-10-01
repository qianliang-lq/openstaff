/**
 * TC-MEMORY-INTERACTIVE: Memory 添加笔记真反馈
 *
 * 契约测试，验证：
 * - 场景1：点击「添加笔记」→ 显示模态框
 * - 场景2：填写标题+内容+点击「添加」→ 笔记出现在列表 + feedback banner
 * - 场景3：空标题或空内容点击「添加」→ 显示验证失败反馈
 * - 场景4：点击「取消」→ 模态框关闭且不添加笔记
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Memory from './Memory';

describe('TC-MEMORY-INTERACTIVE: Memory 添加笔记真反馈', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('场景 1: 点击「添加笔记」→ 显示模态框', () => {
    it('should show modal when add button clicked', async () => {
      const user = userEvent.setup();

      const { container } = render(<Memory agentName="测试产品经理" />);

      const addBtn = container.querySelector('.btn-add') as HTMLElement;
      expect(addBtn, '添加按钮应存在').toBeInTheDocument();

      await user.click(addBtn);

      await waitFor(() => {
        const modal = container.querySelector('.modal-overlay');
        expect(modal, '应显示模态框').toBeInTheDocument();
      });

      const modalText = container.textContent || '';
      expect(modalText.includes('添加笔记'), '模态框应包含标题').toBe(true);
      expect(modalText.includes('标题'), '模态框应包含标题输入框').toBe(true);
      expect(modalText.includes('内容'), '模态框应包含内容输入框').toBe(true);
    });
  });

  describe('场景 2: 填写+添加 → 笔记出现 + feedback', () => {
    it('should add note to list and show feedback banner when submitted', async () => {
      const user = userEvent.setup();

      const { container } = render(<Memory agentName="测试产品经理" />);

      // 1. 打开模态框
      const addBtn = container.querySelector('.btn-add') as HTMLElement;
      await user.click(addBtn);

      await waitFor(() => {
        const modal = container.querySelector('.modal-overlay');
        expect(modal).toBeInTheDocument();
      });

      // 2. 填写标题和内容
      const titleInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      const contentTextarea = container.querySelector('textarea') as HTMLTextAreaElement;

      await user.type(titleInput, '测试笔记标题');
      await user.type(contentTextarea, '这是测试笔记内容');

      // 3. 点击添加
      const confirmBtn = container.querySelector('.btn-confirm') as HTMLElement;
      await user.click(confirmBtn);

      // 4. 验证模态框关闭
      await waitFor(() => {
        const modal = container.querySelector('.modal-overlay');
        expect(modal, '模态框应关闭').not.toBeInTheDocument();
      });

      // 5. 验证 feedback banner 显示
      await waitFor(() => {
        const feedback = container.querySelector('.feedback-banner');
        expect(feedback, '应显示反馈 banner').toBeInTheDocument();
        expect(feedback?.textContent, 'banner 应提示添加成功').toContain('添加成功');
      });

      // 6. 验证笔记出现在列表
      const memoryItems = container.querySelectorAll('.memory-item');
      const hasNewNote = Array.from(memoryItems).some((item) =>
        item.textContent?.includes('测试笔记标题')
      );
      expect(hasNewNote, '新笔记应出现在列表中').toBe(true);
    });
  });

  describe('场景 3: 空标题或空内容 → 验证失败反馈', () => {
    it('should show validation error when title or body is empty', async () => {
      const user = userEvent.setup();

      const { container } = render(<Memory agentName="测试产品经理" />);

      // 1. 打开模态框
      const addBtn = container.querySelector('.btn-add') as HTMLElement;
      await user.click(addBtn);

      await waitFor(() => {
        const modal = container.querySelector('.modal-overlay');
        expect(modal).toBeInTheDocument();
      });

      // 2. 不填写内容直接点击添加
      const confirmBtn = container.querySelector('.btn-confirm') as HTMLElement;
      await user.click(confirmBtn);

      // 3. 验证反馈显示
      await waitFor(() => {
        const feedback = container.querySelector('.feedback-banner');
        expect(feedback, '应显示验证失败反馈').toBeInTheDocument();
        expect(feedback?.textContent, '反馈应提示标题和内容不能为空').toContain(
          '标题和内容不能为空'
        );
      });

      // 4. 验证模态框仍然打开
      const modal = container.querySelector('.modal-overlay');
      expect(modal, '验证失败时模态框应保持打开').toBeInTheDocument();
    });
  });

  describe('场景 4: 点击「取消」→ 模态框关闭且不添加', () => {
    it('should close modal without adding note when cancel clicked', async () => {
      const user = userEvent.setup();

      const { container } = render(<Memory agentName="测试产品经理" />);

      // 1. 记录初始笔记数量
      const initialItems = container.querySelectorAll('.memory-item').length;

      // 2. 打开模态框并填写内容
      const addBtn = container.querySelector('.btn-add') as HTMLElement;
      await user.click(addBtn);

      await waitFor(() => {
        const modal = container.querySelector('.modal-overlay');
        expect(modal).toBeInTheDocument();
      });

      const titleInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      await user.type(titleInput, '不应添加的笔记');

      // 3. 点击取消
      const cancelBtn = container.querySelector('.btn-cancel') as HTMLElement;
      await user.click(cancelBtn);

      // 4. 验证模态框关闭
      await waitFor(() => {
        const modal = container.querySelector('.modal-overlay');
        expect(modal, '模态框应关闭').not.toBeInTheDocument();
      });

      // 5. 验证笔记数量未增加
      const finalItems = container.querySelectorAll('.memory-item').length;
      expect(finalItems, '取消后笔记数量不应增加').toBe(initialItems);
    });
  });
});
