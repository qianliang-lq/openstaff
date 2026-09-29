import { useState } from 'react';
import './ValidationGateWidget.css';

function ValidationGateWidget() {
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'revised' | null>(null);

  const handleApprove = () => {
    console.log('Approved');
    setDecision('approved');
  };

  const handleReject = () => {
    console.log('Rejected');
    setDecision('rejected');
  };

  const handleRevise = () => {
    console.log('Revise requested');
    setDecision('revised');
  };

  if (decision) {
    return (
      <div className="gate-result-bubble">
        <span className="result-icon">
          {decision === 'approved' ? '✅' : decision === 'rejected' ? '❌' : '✏️'}
        </span>
        <span className="result-text">
          {decision === 'approved' && '已通过验证'}
          {decision === 'rejected' && '已驳回操作'}
          {decision === 'revised' && '请修改意见后重新提交'}
        </span>
      </div>
    );
  }

  return (
    <div className="validation-gate-widget validation-gate-card">
      <div className="widget-header">
        <div className="widget-icon">⚠️</div>
        <div className="widget-title">验证闸门 Widget</div>
        <div className="widget-badge">validation gate · v1.2.0</div>
      </div>

      <div className="widget-body">
        <div className="widget-question">是否具备数据支撑的逻辑闭环？</div>
        <div className="widget-desc">
          Agent 准备执行外部 API 调用以获取数据。请确认以下条件：
          <ul>
            <li>检验：计划的数据获取策略（亚马逊数据 API）</li>
            <li>逻辑：是否有 fallback 方案；本地 CSV 存底</li>
            <li>闸门策略：公司批准运营分析工具（距到期还有 3 天）</li>
          </ul>
        </div>
      </div>

      <div className="widget-actions">
        <button className="btn-reject" onClick={handleReject} role="button" aria-label="Reject">
          驳回
        </button>
        <button className="btn-approve" onClick={handleApprove} role="button" aria-label="Pass">
          通过
        </button>
        <button className="btn-secondary" onClick={handleRevise} role="button" aria-label="Revise">
          改意见
        </button>
      </div>
    </div>
  );
}

export default ValidationGateWidget;
