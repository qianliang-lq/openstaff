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
}

function ExternalInsightReportCard({ date, facts }: ExternalInsightReportCardProps) {
  const [expanded, setExpanded] = useState(false);

  const summaryFacts = facts.slice(0, 3);
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

  return (
    <div className="external-insight-report-card">
      <div className="report-header">
        <div className="report-icon">🔍</div>
        <div className="report-title">外部洞察日报 · {date}</div>
        <button
          className="expand-btn"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? '折叠报告' : '展开报告'}
        >
          {expanded ? '折叠' : '展开'}
        </button>
      </div>

      <div className="report-body">
        <div className="report-summary">
          <div className="summary-label">摘要要点：</div>
          <ul className="summary-list">
            {summaryFacts.map((fact, index) => (
              <li key={index} className="summary-item">
                {fact.title}
              </li>
            ))}
          </ul>
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
        <button className="view-full-btn">查看完整报告</button>
      </div>
    </div>
  );
}

export default ExternalInsightReportCard;
