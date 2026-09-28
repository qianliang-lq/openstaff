import { PageType } from '../App';
import './Topbar.css';

interface TopbarProps {
  currentPage: PageType;
}

const pageLabels: Record<PageType, string> = {
  instances: '实例',
  nodes: '节点与运行时',
  observability: '观测',
  audit: '审批审计',
};

function Topbar({ currentPage }: TopbarProps) {
  return (
    <div className="topbar">
      <div className="breadcrumb">
        <span className="sep">/</span>
        <span className="cur">{pageLabels[currentPage]}</span>
      </div>

      <div className="top-actions">
        <button className="bell" title="通知">
          🔔
          <span className="dot"></span>
        </button>
        <div className="user-info">
          <div className="avatar">钱</div>
          <div className="user-meta">
            <div className="name">钱良</div>
            <div className="role">管理员</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Topbar;
