import { useState } from 'react';
import './ValidationGateWidget.css';

function ValidationGateWidget() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const handleApprove = () => {
    console.log('Approved');
    setDismissed(true);
  };

  const handleReject = () => {
    console.log('Rejected');
    setDismissed(true);
  };

  return (
    <div className="validation-gate-widget">
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
        <button className="btn-reject" onClick={handleReject}>
          丢弃
        </button>
        <button className="btn-approve" onClick={handleApprove}>
          通过
        </button>
        <button className="btn-secondary">查看详情审批历史</button>
      </div>
    </div>
  );
}

export default ValidationGateWidget;
