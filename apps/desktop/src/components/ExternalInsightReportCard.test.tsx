import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExternalInsightReportCard, { type ExternalInsightFact } from './ExternalInsightReportCard';

describe('ExternalInsightReportCard', () => {
  const mockFacts: ExternalInsightFact[] = [
    {
      bucket: '竞对',
      title: 'Factory CLI v0.228.0 发布',
      summary_zh: 'Factory 发布新版本，包含多项新功能',
      url: 'https://example.com/factory',
      tags: ['TOP互联网/AI公司'],
    },
    {
      bucket: '组织提效',
      title: 'GitHub Copilot 企业设置校验器',
      summary_zh: 'GitHub 上线企业设置校验器',
      url: 'https://example.com/github',
      tags: ['TOP互联网/AI公司'],
    },
    {
      bucket: '前沿模型',
      title: 'iCoder-27B 工业编码模型',
      summary_zh: '上交等院校发布工业编码模型',
      url: 'https://example.com/icoder',
      tags: ['学术研究', 'TOP学校'],
      pdf_url: 'https://example.com/icoder.pdf',
    },
  ];

  it('应该渲染报告卡片标题和徽章', () => {
    render(
      <ExternalInsightReportCard date="2026-09-27" facts={mockFacts} reconcileStatus="PASS" />
    );

    expect(screen.getByText('外搜洞察日报')).toBeInTheDocument();
    expect(screen.getByText('reconcile PASS')).toBeInTheDocument();
    expect(screen.getByText('已审计')).toBeInTheDocument();
    expect(screen.getByText('Routine · Skill')).toBeInTheDocument();
  });

  it('应该在 reconcileStatus 为 FAILED 时不渲染卡片', () => {
    const { container } = render(
      <ExternalInsightReportCard date="2026-09-27" facts={mockFacts} reconcileStatus="FAILED" />
    );

    expect(container.firstChild).toBeNull();
  });

  it('应该默认显示3条摘要要点并包含域名芯片', () => {
    render(
      <ExternalInsightReportCard date="2026-09-27" facts={mockFacts} reconcileStatus="PASS" />
    );

    expect(screen.getByText('Factory CLI v0.228.0 发布')).toBeInTheDocument();
    expect(screen.getByText('GitHub Copilot 企业设置校验器')).toBeInTheDocument();
    expect(screen.getByText('iCoder-27B 工业编码模型')).toBeInTheDocument();
    expect(screen.getAllByText('example.com').length).toBeGreaterThan(0);
  });

  it('应该显示指导部分', () => {
    render(
      <ExternalInsightReportCard date="2026-09-27" facts={mockFacts} reconcileStatus="PASS" />
    );

    expect(screen.getByText('外部→我方→低成本下一步：')).toBeInTheDocument();
    expect(screen.getByText(/建议评估 MCP 协议集成可行性/)).toBeInTheDocument();
  });

  it('应该在折叠状态下不显示详细内容', () => {
    render(
      <ExternalInsightReportCard date="2026-09-27" facts={mockFacts} reconcileStatus="PASS" />
    );

    expect(screen.queryByText('竞对')).not.toBeInTheDocument();
    expect(screen.queryByText('Factory 发布新版本，包含多项新功能')).not.toBeInTheDocument();
  });

  it('应该在点击查看详情按钮后显示详细内容', () => {
    render(
      <ExternalInsightReportCard date="2026-09-27" facts={mockFacts} reconcileStatus="PASS" />
    );

    const viewDetailsBtn = screen.getByText('查看详情');
    fireEvent.click(viewDetailsBtn);

    expect(screen.getByText('竞对')).toBeInTheDocument();
    expect(screen.getByText('组织提效')).toBeInTheDocument();
    expect(screen.getByText('前沿模型')).toBeInTheDocument();
    expect(screen.getByText('Factory 发布新版本，包含多项新功能')).toBeInTheDocument();
  });

  it('应该显示PDF链接（如果存在）', () => {
    render(
      <ExternalInsightReportCard date="2026-09-27" facts={mockFacts} reconcileStatus="PASS" />
    );

    const viewDetailsBtn = screen.getByText('查看详情');
    fireEvent.click(viewDetailsBtn);

    const pdfLinks = screen.getAllByText('PDF');
    expect(pdfLinks.length).toBe(1);
    expect(pdfLinks[0]).toHaveAttribute('href', 'https://example.com/icoder.pdf');
  });

  it('应该显示标签', () => {
    render(
      <ExternalInsightReportCard date="2026-09-27" facts={mockFacts} reconcileStatus="PASS" />
    );

    const viewDetailsBtn = screen.getByText('查看详情');
    fireEvent.click(viewDetailsBtn);

    expect(screen.getAllByText('TOP互联网/AI公司').length).toBeGreaterThan(0);
    expect(screen.getByText('学术研究')).toBeInTheDocument();
    expect(screen.getByText('TOP学校')).toBeInTheDocument();
  });

  it('应该在展开后点击收起详情按钮能够折叠', () => {
    render(
      <ExternalInsightReportCard date="2026-09-27" facts={mockFacts} reconcileStatus="PASS" />
    );

    const viewDetailsBtn = screen.getByText('查看详情');
    fireEvent.click(viewDetailsBtn);

    expect(screen.getByText('竞对')).toBeInTheDocument();

    const collapseBtn = screen.getByText('收起详情');
    fireEvent.click(collapseBtn);

    expect(screen.queryByText('竞对')).not.toBeInTheDocument();
  });

  it('应该渲染查看详情和打开facts按钮', () => {
    render(
      <ExternalInsightReportCard date="2026-09-27" facts={mockFacts} reconcileStatus="PASS" />
    );

    expect(screen.getByText('查看详情')).toBeInTheDocument();
    expect(screen.getByText('打开 facts')).toBeInTheDocument();
  });

  it('应该限制摘要要点最多3条', () => {
    const manyFacts: ExternalInsightFact[] = [
      ...mockFacts,
      {
        bucket: '技术底座',
        title: '第4条',
        summary_zh: '第4条摘要',
        url: 'https://example.com/4',
        tags: ['测试'],
      },
      {
        bucket: '技术底座',
        title: '第5条',
        summary_zh: '第5条摘要',
        url: 'https://example.com/5',
        tags: ['测试'],
      },
    ];

    render(
      <ExternalInsightReportCard date="2026-09-27" facts={manyFacts} reconcileStatus="PASS" />
    );

    expect(screen.getByText('Factory CLI v0.228.0 发布')).toBeInTheDocument();
    expect(screen.getByText('GitHub Copilot 企业设置校验器')).toBeInTheDocument();
    expect(screen.getByText('iCoder-27B 工业编码模型')).toBeInTheDocument();
    expect(screen.queryByText('第4条')).not.toBeInTheDocument();
    expect(screen.queryByText('第5条')).not.toBeInTheDocument();
  });
});
