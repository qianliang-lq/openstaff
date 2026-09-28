import { useState } from 'react';
import './ExternalInsightReportCard.css';

export interface ExternalInsightFact {
  bucket: '竞对' | '组织提效' | '前沿模型' | '技术底座';
  title: string;
  summary_zh: string;
  url: string;
  tags: string[];
  pdf_url?: string;
}

export interface ExternalInsightReportCardProps {
  date: string;
  facts: ExternalInsightFact[];
  factsPath?: string;
  reconcileStatus: 'PASS' | 'FAILED';
}

function ExternalInsightReportCard({
  date: _date,
  facts,
  factsPath,
  reconcileStatus,
}: ExternalInsightReportCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (reconcileStatus === 'FAILED') {
    return null;
  }

  const summaryFacts = facts.slice(0, 3);

  const extractDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return 'unknown';
    }
  };

  const factsByBucket = facts.reduce(
    (acc, fact) => {
      if (!acc[fact.bucket]) {
        acc[fact.bucket] = [];
      }
      acc[fact.bucket].push(fact);
      return acc;
    },
    {} as Record<string, ExternalInsightFact[]>
  );

  const handleOpenFacts = () => {
    if (factsPath) {
      console.log('打开 facts 文件:', factsPath);
    }
  };

  return (
    <div className="external-insight-report-card">
      <div className="report-header">
        <div className="header-top">
          <div className="report-title">外搜洞察日报</div>
          <div className="header-badges">
            <span className="badge badge-success">reconcile PASS</span>
            <span className="badge badge-audited">已审计</span>
          </div>
        </div>
        <div className="report-meta">Routine · Skill</div>
      </div>

      <div className="report-body">
        <div className="report-summary">
          {summaryFacts.map((fact, index) => (
            <div key={index} className="summary-item">
              <span className="summary-bullet">•</span>
              <div className="summary-content">
                <span className="summary-text">{fact.title}</span>
                <span className="domain-chip">{extractDomain(fact.url)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="guidance-section">
          <div className="guidance-label">外部→我方→低成本下一步：</div>
          <div className="guidance-text">
            建议评估 MCP 协议集成可行性，预计可降低 30% 的 API 对接成本
          </div>
        </div>

        {expanded && (
          <div className="report-details">
            {Object.entries(factsByBucket).map(([bucket, bucketFacts]) => (
              <div key={bucket} className="bucket-section">
                <h3 className="bucket-title">{bucket}</h3>
                <div className="bucket-facts">
                  {bucketFacts.map((fact, index) => (
                    <div key={index} className="fact-item">
                      <div className="fact-tags">
                        {fact.tags.map((tag) => (
                          <span key={tag} className="fact-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="fact-title">{fact.title}</div>
                      <div className="fact-summary">{fact.summary_zh}</div>
                      <div className="fact-links">
                        <a
                          href={fact.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="fact-link"
                        >
                          原文链接
                        </a>
                        {fact.pdf_url && (
                          <>
                            <span className="link-separator">·</span>
                            <a
                              href={fact.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="fact-link pdf-link"
                            >
                              PDF
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="report-footer">
        <button className="btn-primary-report" onClick={() => setExpanded(!expanded)}>
          {expanded ? '收起详情' : '查看详情'}
        </button>
        <button className="btn-secondary-report" onClick={handleOpenFacts}>
          打开 facts
        </button>
      </div>
    </div>
  );
}

export default ExternalInsightReportCard;
