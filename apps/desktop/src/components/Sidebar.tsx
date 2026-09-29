import { useState } from 'react';
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

interface CreateAgentModalProps {
  onClose: () => void;
  onSave: (agent: Agent) => void;
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

function CreateAgentModal({ onClose, onSave }: CreateAgentModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    const newAgent: Agent = {
      id: Date.now().toString(),
      name: name.trim(),
      role: role.trim(),
      status: 'idle',
      avatar: name.charAt(0),
      avatarClass: 'custom',
    };

    onSave(newAgent);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>创建 Agent</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="agent-name">Agent 名称</label>
            <input
              id="agent-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：技术顾问"
              autoFocus
            />
          </div>
          <div className="form-field">
            <label htmlFor="agent-role">角色描述</label>
            <input
              id="agent-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="例如：技术支持 · API 集成"
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              取消
            </button>
            <button type="submit" className="submit-btn" disabled={!name.trim() || !role.trim()}>
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Sidebar({ activeAgent, onAgentChange }: SidebarProps) {
  const [agents] = useState<Agent[]>(mockAgents);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSaveAgent = (newAgent: Agent) => {
    // Note: Agent creation is demo-only in MVP
    // Full agent management will be implemented in future milestone
    console.log('Agent created (demo):', newAgent);
    setShowCreateModal(false);
    onAgentChange(newAgent.name);
  };
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
        <button className="add" title="创建 Agent" onClick={() => setShowCreateModal(true)}>
          +
        </button>
      </div>

      <div className="agent-list">
        {agents.map((agent) => (
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

      {showCreateModal && (
        <CreateAgentModal onClose={() => setShowCreateModal(false)} onSave={handleSaveAgent} />
      )}
    </div>
  );
}

export default Sidebar;
