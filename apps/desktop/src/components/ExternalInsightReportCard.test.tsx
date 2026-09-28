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

  it('应该渲染报告卡片标题和日期', () => {
    render(<ExternalInsightReportCard date="2026-09-27" facts={mockFacts} />);

    expect(screen.getByText(/外部洞察日报.*2026-09-27/)).toBeInTheDocument();
  });

  it('应该默认显示3条摘要要点', () => {
    render(<ExternalInsightReportCard date="2026-09-27" facts={mockFacts} />);

    expect(screen.getByText('Factory CLI v0.228.0 发布')).toBeInTheDocument();
    expect(screen.getByText('GitHub Copilot 企业设置校验器')).toBeInTheDocument();
    expect(screen.getByText('iCoder-27B 工业编码模型')).toBeInTheDocument();
  });

  it('应该在折叠状态下不显示详细内容', () => {
    render(<ExternalInsightReportCard date="2026-09-27" facts={mockFacts} />);

    expect(screen.queryByText('竞对')).not.toBeInTheDocument();
    expect(screen.queryByText('Factory 发布新版本，包含多项新功能')).not.toBeInTheDocument();
  });

  it('应该在点击展开按钮后显示详细内容', () => {
    render(<ExternalInsightReportCard date="2026-09-27" facts={mockFacts} />);

    const expandBtn = screen.getByRole('button', { name: /展开报告/ });
    fireEvent.click(expandBtn);

    expect(screen.getByText('竞对')).toBeInTheDocument();
    expect(screen.getByText('组织提效')).toBeInTheDocument();
    expect(screen.getByText('前沿模型')).toBeInTheDocument();
    expect(screen.getByText('Factory 发布新版本，包含多项新功能')).toBeInTheDocument();
  });

  it('应该显示PDF链接（如果存在）', () => {
    render(<ExternalInsightReportCard date="2026-09-27" facts={mockFacts} />);

    const expandBtn = screen.getByRole('button', { name: /展开报告/ });
    fireEvent.click(expandBtn);

    const pdfLinks = screen.getAllByText('PDF');
    expect(pdfLinks.length).toBe(1);
    expect(pdfLinks[0]).toHaveAttribute('href', 'https://example.com/icoder.pdf');
  });

  it('应该显示标签', () => {
    render(<ExternalInsightReportCard date="2026-09-27" facts={mockFacts} />);

    const expandBtn = screen.getByRole('button', { name: /展开报告/ });
    fireEvent.click(expandBtn);

    expect(screen.getAllByText('TOP互联网/AI公司').length).toBeGreaterThan(0);
    expect(screen.getByText('学术研究')).toBeInTheDocument();
    expect(screen.getByText('TOP学校')).toBeInTheDocument();
  });

  it('应该在展开后点击折叠按钮能够折叠', () => {
    render(<ExternalInsightReportCard date="2026-09-27" facts={mockFacts} />);

    const expandBtn = screen.getByRole('button', { name: /展开报告/ });
    fireEvent.click(expandBtn);

    expect(screen.getByText('竞对')).toBeInTheDocument();

    const collapseBtn = screen.getByRole('button', { name: /折叠报告/ });
    fireEvent.click(collapseBtn);

    expect(screen.queryByText('竞对')).not.toBeInTheDocument();
  });

  it('应该渲染查看完整报告按钮', () => {
    render(<ExternalInsightReportCard date="2026-09-27" facts={mockFacts} />);

    expect(screen.getByText('查看完整报告')).toBeInTheDocument();
  });
});
