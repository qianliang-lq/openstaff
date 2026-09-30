import { useState } from 'react';
import './Sidebar.css';

const STORAGE_KEY_AGENTS = 'openstaff_agents';
const STORAGE_KEY_ACTIVE = 'openstaff_active_agent';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'busy' | 'idle';
  avatar: string;
  avatarClass: string;
}

const loadAgentsFromStorage = (): Agent[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_AGENTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load agents from storage:', error);
    return [];
  }
};

const saveAgentsToStorage = (agents: Agent[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(agents));
  } catch (error) {
    console.error('Failed to save agents to storage:', error);
  }
};

const saveActiveAgentToStorage = (agentName: string) => {
  try {
    if (agentName) {
      localStorage.setItem(STORAGE_KEY_ACTIVE, agentName);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE);
    }
  } catch (error) {
    console.error('Failed to save active agent to storage:', error);
  }
};

interface SidebarProps {
  activeAgent: string;
  onAgentChange: (agentName: string) => void;
}

interface CreateAgentModalProps {
  onClose: () => void;
  onSave: (agent: Agent) => void;
}

function CreateAgentModal({ onClose, onSave }: CreateAgentModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRole, setSelectedRole] = useState<{
    id: string;
    name: string;
    blurb: string;
    defaultDuty: string;
    presetSkills?: string[];
    icon: string;
  } | null>(null);
  const [name, setName] = useState('');
  const [duty, setDuty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const roleTemplates = [
    {
      id: 'pm',
      name: '产品经理',
      blurb: '基于产品战略和用户研究驱动产品决策',
      defaultDuty:
        '需求挖掘、撰写 PRD、竞品分析、数据驱动决策。协同设计、研发、市场多方推进功能落地；跟踪 OKR，迭代优化用户体验和商业价值。',
      presetSkills: ['web-research', 'doc-brief', 'validation-gate'],
      icon: '产',
    },
    {
      id: 'ops',
      name: '运营专家',
      blurb: '数据分析、用户增长、内容运营',
      defaultDuty:
        '制定运营策略、用户增长、内容策划与发布；数据分析驱动优化；社群管理与用户反馈收集；活动策划与执行。',
      presetSkills: ['web-research', 'voice-memo'],
      icon: '运',
    },
    {
      id: 'rd',
      name: '研发协作',
      blurb: '代码审查、技术支持、API 集成',
      defaultDuty:
        '代码审查与 PR 评审；技术文档编写；API 设计与集成；bug 排查与性能优化；技术方案设计支持。',
      presetSkills: ['spreadsheet-read'],
      icon: '研',
    },
    {
      id: 'blank',
      name: '空白',
      blurb: '自由定义角色和职责',
      defaultDuty: '',
      icon: '空',
    },
  ];

  const handleNext = () => {
    if (step === 1 && selectedRole) {
      setName(selectedRole.name + '数字员工');
      setDuty(selectedRole.defaultDuty);
      setStep(2);
    } else if (step === 2 && name.trim()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !selectedRole) return;

    setIsSubmitting(true);
    setError('');

    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          const forceCreateFail = (
            window as unknown as { __OPENSTAFF_FORCE_CREATE_FAIL__?: boolean }
          ).__OPENSTAFF_FORCE_CREATE_FAIL__;

          if (forceCreateFail) {
            reject(new Error('本地存储失败'));
          } else {
            resolve(true);
          }
        }, 800);
      });

      const newAgent: Agent = {
        id: Date.now().toString(),
        name: name.trim(),
        role: duty.trim() || selectedRole.defaultDuty,
        status: 'idle',
        avatar: name.charAt(0),
        avatarClass: selectedRole.id,
      };

      onSave(newAgent);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建失败，请重试';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const canProceedStep1 = selectedRole !== null;
  const canProceedStep2 = name.trim().length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wizard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wizard-header">
          <h2>创建数字员工</h2>
          <div className="wizard-steps">
            <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">选择模板</span>
            </div>
            <div className="step-line" />
            <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">名称与职责</span>
            </div>
            <div className="step-line" />
            <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">准备沙箱</span>
            </div>
          </div>
        </div>

        <div className="wizard-body">
          {step === 1 && (
            <div className="wizard-step">
              <h3>选择角色模板</h3>
              <p className="step-desc">选择一个适合的角色模板</p>
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
                      <div className="role-desc">{role.blurb}</div>
                      {role.presetSkills && role.presetSkills.length > 0 && (
                        <div className="role-skills">
                          {role.presetSkills.map((skill) => (
                            <span key={skill} className="skill-badge">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedRole?.id === role.id && <div className="role-check">✓</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step">
              <h3>设置名称与职责</h3>
              <p className="step-desc">为您的数字员工命名并定义职责</p>
              <div className="form-field">
                <label htmlFor="agent-name">Agent 名称</label>
                <input
                  id="agent-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：产品经理数字员工"
                  autoFocus
                />
              </div>
              <div className="form-field">
                <label htmlFor="duty">职责描述</label>
                <textarea
                  id="duty"
                  value={duty}
                  onChange={(e) => setDuty(e.target.value)}
                  placeholder="输入或修改职责说明"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--g4)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="wizard-step">
              <h3>准备沙箱</h3>
              <p className="step-desc">即将为该 Agent 创建专属工作环境</p>
              <div className="confirm-info">
                <div className="confirm-row">
                  <span className="confirm-label">名称:</span>
                  <span className="confirm-value">{name}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">角色:</span>
                  <span className="confirm-value">{selectedRole?.name || '未选择'}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">职责:</span>
                  <span className="confirm-value">
                    {duty || selectedRole?.defaultDuty || '未设置'}
                  </span>
                </div>
                {selectedRole?.presetSkills && selectedRole.presetSkills.length > 0 && (
                  <div className="confirm-row">
                    <span className="confirm-label">Skills:</span>
                    <span className="confirm-value">
                      {selectedRole.presetSkills.map((skill) => (
                        <span key={skill} className="skill-badge" style={{ marginRight: '4px' }}>
                          {skill}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
              </div>
              {error && (
                <div className="error-banner">
                  <span className="error-icon">⚠️</span>
                  <span className="error-text">{error}</span>
                  <button
                    onClick={() => setError('')}
                    style={{
                      marginLeft: 'auto',
                      padding: '4px 8px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
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
            <button
              type="button"
              onClick={handleSubmit}
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? '创建中...' : '创建并准备沙箱'}
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
  const [agents, setAgents] = useState<Agent[]>(() => loadAgentsFromStorage());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string>('');

  const handleSaveAgent = (newAgent: Agent) => {
    console.log('Agent created (demo):', newAgent);
    const updatedAgents = [...agents, newAgent];
    setAgents(updatedAgents);
    saveAgentsToStorage(updatedAgents);
    setShowCreateModal(false);
    onAgentChange(newAgent.name);
    saveActiveAgentToStorage(newAgent.name);
    setSuccessToast(`✅ 已创建 ${newAgent.name}`);
    setTimeout(() => setSuccessToast(''), 3000);
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
        <button
          className="add"
          title="创建 Agent"
          aria-label="创建 Agent"
          onClick={() => setShowCreateModal(true)}
        >
          +
        </button>
      </div>

      <div className="agent-list">
        {agents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <div className="empty-text">还没有数字员工</div>
            <div className="empty-hint">点击上方「+」创建</div>
          </div>
        ) : (
          agents.map((agent) => (
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
          ))
        )}
      </div>

      <div className="sidebar-foot">v0.1 讨论稿</div>

      {showCreateModal && (
        <CreateAgentModal onClose={() => setShowCreateModal(false)} onSave={handleSaveAgent} />
      )}

      {successToast && <div className="success-toast">{successToast}</div>}
    </div>
  );
}

export default Sidebar;
