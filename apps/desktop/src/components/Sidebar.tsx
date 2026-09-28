import './Sidebar.css';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'busy' | 'idle';
  avatar: string;
  avatarClass: string;
}

interface SidebarProps {
  activeAgent: string;
  onAgentChange: (agentName: string) => void;
}

const mockAgents: Agent[] = [
  {
    id: '1',
    name: '产品经理数字员工',
    role: 'PRD · 跑Routine',
    status: 'online',
    avatar: '产',
    avatarClass: 'pm',
  },
  {
    id: '2',
    name: '运营专家',
    role: 'NRT Routine',
    status: 'busy',
    avatar: '运',
    avatarClass: 'ops',
  },
  {
    id: '3',
    name: '研发协作',
    role: '待命',
    status: 'idle',
    avatar: '研',
    avatarClass: 'dev',
  },
];

function Sidebar({ activeAgent, onAgentChange }: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="brand">
        <div className="brand-mark">OS</div>
        <div>
          <div className="brand-text">OpenStaff</div>
          <div className="brand-sub">开源数字员工</div>
        </div>
      </div>

      <div className="section-label">
        Agents
        <button className="add" title="创建 Agent">
          +
        </button>
      </div>

      <div className="agent-list">
        {mockAgents.map((agent) => (
          <div
            key={agent.id}
            className={`agent-item ${activeAgent === agent.name ? 'active' : ''}`}
            onClick={() => onAgentChange(agent.name)}
          >
            <div className={`agent-av ${agent.avatarClass}`}>
              {agent.avatar}
              <span className={`status-dot ${agent.status}`}></span>
            </div>
            <div className="agent-meta">
              <div className="agent-name">{agent.name}</div>
              <div className="agent-status">{agent.role}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-foot">v0.1 讨论稿</div>
    </div>
  );
}

export default Sidebar;
