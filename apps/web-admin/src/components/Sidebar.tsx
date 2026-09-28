import { PageType } from '../App';
import './Sidebar.css';

interface SidebarProps {
  activePage: PageType;
  onPageChange: (page: PageType) => void;
}

interface NavItem {
  id: PageType;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: 'instances', label: '实例', icon: '📦' },
  { id: 'nodes', label: '节点与运行时', icon: '🖥️' },
  { id: 'observability', label: '观测', icon: '📊' },
  { id: 'audit', label: '审批审计', icon: '📋' },
];

function Sidebar({ activePage, onPageChange }: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="brand">
        <div className="brand-mark">OS</div>
        <div>
          <div className="brand-text">OpenStaff</div>
          <div className="brand-sub">管理后台</div>
        </div>
      </div>

      <nav className="nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onPageChange(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">OpenStaff · FIND 科技红 · v0.1</div>
    </div>
  );
}

export default Sidebar;
