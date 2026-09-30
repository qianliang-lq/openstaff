import { useEffect, useState } from 'react';
import * as api from '../../utils/api';
import './SkillsStage.css';

interface Props {
  activeAgent: string;
}

export default function SkillsStage({ activeAgent }: Props) {
  const [skills, setSkills] = useState<api.AgentSkill[]>([]);
  const [mcps, setMcps] = useState<api.AgentMcp[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [isLoadingMcp, setIsLoadingMcp] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!activeAgent) {
      setIsLoadingSkills(false);
      setIsLoadingMcp(false);
      return;
    }

    loadSkills();
    loadMcp();
  }, [activeAgent]);

  const loadSkills = async () => {
    if (!activeAgent) return;

    setIsLoadingSkills(true);
    try {
      const response = await api.listAgentSkills(activeAgent);
      setSkills(response.items);
    } catch (error) {
      console.error('Failed to load skills:', error);
      showToast('加载 Skills 失败', 'error');
    } finally {
      setIsLoadingSkills(false);
    }
  };

  const loadMcp = async () => {
    if (!activeAgent) return;

    setIsLoadingMcp(true);
    try {
      const response = await api.listAgentMcp(activeAgent);
      setMcps(response.items);
    } catch (error) {
      console.error('Failed to load MCP:', error);
      showToast('加载 MCP 失败', 'error');
    } finally {
      setIsLoadingMcp(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleSkill = async (skillId: string, currentEnabled: boolean) => {
    if (!activeAgent) return;

    try {
      await api.updateAgentSkill(activeAgent, skillId, !currentEnabled);
      await loadSkills();
      showToast(
        `Skill ${!currentEnabled ? '已启用' : '已禁用'}`,
        'success'
      );
    } catch (error) {
      console.error('Failed to toggle skill:', error);
      showToast('更新 Skill 失败', 'error');
    }
  };

  const handleTrySkill = async (skillId: string) => {
    if (!activeAgent) return;

    try {
      const response = await api.tryAgentSkill(activeAgent, skillId);
      showToast(response.message, response.ok ? 'success' : 'error');
    } catch (error) {
      console.error('Failed to try skill:', error);
      showToast('试跑失败', 'error');
    }
  };

  const handleToggleMcp = async (mcpId: string, currentEnabled: boolean) => {
    if (!activeAgent) return;

    try {
      await api.updateAgentMcp(activeAgent, mcpId, !currentEnabled);
      await loadMcp();
      showToast(
        `MCP ${!currentEnabled ? '已启用' : '已禁用'}`,
        'success'
      );
    } catch (error) {
      console.error('Failed to toggle MCP:', error);
      showToast('更新 MCP 失败', 'error');
    }
  };

  const handleTestMcp = async (mcpId: string) => {
    if (!activeAgent) return;

    try {
      const response = await api.testAgentMcp(activeAgent, mcpId);
      await loadMcp();
      showToast(response.message, response.ok ? 'success' : 'error');
    } catch (error) {
      console.error('Failed to test MCP:', error);
      showToast('测试失败', 'error');
    }
  };

  if (!activeAgent) {
    return (
      <div className="skills-stage">
        <div className="empty-state">
          <div className="empty-icon">🔌</div>
          <div className="empty-text">请先选择一个数字员工</div>
          <div className="empty-hint">Skills 和 MCP 按岗挂载</div>
        </div>
      </div>
    );
  }

  return (
    <div className="skills-stage">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="skills-section">
        <div className="section-header">
          <h2>本岗 Skills</h2>
          <span className="section-hint">启用的 Skill 会注入该岗对话</span>
        </div>

        {isLoadingSkills ? (
          <div className="loading">加载中...</div>
        ) : (
          <div className="skills-list">
            {skills.map((skill) => (
              <div key={skill.skill_id} className="skill-card">
                <div className="skill-header">
                  <div className="skill-info">
                    <div className="skill-name">{skill.name}</div>
                    <div className="skill-version">v{skill.version}</div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={skill.enabled}
                      onChange={() => handleToggleSkill(skill.skill_id, skill.enabled)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                {skill.summary && <div className="skill-summary">{skill.summary}</div>}
                <div className="skill-actions">
                  <button
                    className="btn-try"
                    onClick={() => handleTrySkill(skill.skill_id)}
                    disabled={!skill.enabled}
                  >
                    试跑一次
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mcp-section">
        <div className="section-header">
          <h2>本岗 MCP</h2>
          <span className="section-hint">Model Context Protocol 连接器</span>
        </div>

        {isLoadingMcp ? (
          <div className="loading">加载中...</div>
        ) : (
          <div className="mcp-list">
            {mcps.map((mcp) => (
              <div key={mcp.mcp_id} className="mcp-card">
                <div className="mcp-header">
                  <div className="mcp-info">
                    <div className="mcp-name">{mcp.name}</div>
                    <div className={`mcp-status status-${mcp.status}`}>{mcp.status}</div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={mcp.enabled}
                      onChange={() => handleToggleMcp(mcp.mcp_id, mcp.enabled)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                {mcp.summary && <div className="mcp-summary">{mcp.summary}</div>}
                {mcp.last_checked_at && (
                  <div className="mcp-last-checked">
                    最后检查: {new Date(mcp.last_checked_at).toLocaleString()}
                  </div>
                )}
                <div className="mcp-actions">
                  <button className="btn-test" onClick={() => handleTestMcp(mcp.mcp_id)}>
                    测一下
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
