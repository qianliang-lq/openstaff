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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [selectedRole, setSelectedRole] = useState<{
    id: string;
    name: string;
    description: string;
    icon: string;
  } | null>(null);

  const roleTemplates = [
    {
      id: 'pm',
      name: '产品经理',
      description: '需求分析、竞品研究、PRD 编写',
      icon: '产',
    },
    {
      id: 'ops',
      name: '运营专家',
      description: '数据分析、用户增长、内容运营',
      icon: '运',
    },
    {
      id: 'dev',
      name: '研发协作',
      description: '代码审查、技术支持、API 集成',
      icon: '研',
    },
    {
      id: 'custom',
      name: '自定义',
      description: '自由定义角色和职责',
      icon: '自',
    },
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as 1 | 2 | 3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || (!selectedRole && !customRole.trim())) return;

    const finalRole = customRole.trim() || selectedRole?.description || '';
    const roleId = customRole.trim() ? 'custom' : selectedRole?.id || 'custom';

    const newAgent: Agent = {
      id: Date.now().toString(),
      name: name.trim(),
      role: finalRole,
      status: 'idle',
      avatar: name.charAt(0),
      avatarClass: roleId,
    };

    onSave(newAgent);
    onClose();
  };

  const canProceedStep1 = name.trim().length > 0;
  const canProceedStep2 = selectedRole !== null || customRole.trim().length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wizard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wizard-header">
          <h2>创建数字员工</h2>
          <div className="wizard-steps">
            <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">基本信息</span>
            </div>
            <div className="step-line" />
            <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">角色模板</span>
            </div>
            <div className="step-line" />
            <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">确认信息</span>
            </div>
          </div>
        </div>

        <div className="wizard-body">
          {step === 1 && (
            <div className="wizard-step">
              <h3>输入员工名称</h3>
              <p className="step-desc">为您的数字员工起一个名字</p>
              <div className="form-field">
                <label htmlFor="agent-name">Agent 名称</label>
                <input
                  id="agent-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：技术顾问、市场分析师"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step">
              <h3>选择角色模板</h3>
              <p className="step-desc">选择一个适合的角色模板，或自定义</p>
              <div className="role-templates">
                {roleTemplates.map((role) => (
                  <div
                    key={role.id}
                    className={`role-card ${selectedRole?.id === role.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="role-icon">{role.icon}</div>
                    <div className="role-info">
                      <div className="role-name">{role.name}</div>
                      <div className="role-desc">{role.description}</div>
                    </div>
                    {selectedRole?.id === role.id && <div className="role-check">✓</div>}
                  </div>
                ))}
              </div>
              <div className="form-field" style={{ marginTop: '16px' }}>
                <label htmlFor="role-custom">或输入自定义角色</label>
                <input
                  id="role-custom"
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="例如：数据分析师、项目经理"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="wizard-step">
              <h3>确认创建</h3>
              <p className="step-desc">请确认以下信息</p>
              <div className="confirm-info">
                <div className="confirm-row">
                  <span className="confirm-label">名称:</span>
                  <span className="confirm-value">{name}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">角色:</span>
                  <span className="confirm-value">
                    {customRole.trim() || selectedRole?.name || '未选择'}
                  </span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">职责:</span>
                  <span className="confirm-value">
                    {customRole.trim() || selectedRole?.description || '未设置'}
                  </span>
                </div>
              </div>
              <div className="confirm-note">
                将创建本地演示 Agent (fixture)。完整的 Agent 管理功能将在未来版本中实现。
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          {step > 1 && (
            <button type="button" onClick={handleBack} className="back-btn">
              上一步
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="next-btn"
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
            >
              下一步
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} className="submit-btn">
              创建
            </button>
          )}
          <button type="button" onClick={onClose} className="cancel-btn">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ activeAgent, onAgentChange }: SidebarProps) {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSaveAgent = (newAgent: Agent) => {
    console.log('Agent created (demo):', newAgent);
    setAgents((prev) => [...prev, newAgent]);
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
