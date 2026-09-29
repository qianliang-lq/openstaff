import { useState } from 'react';
import './Skills.css';

interface SkillItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  enabled: boolean;
  source: 'bundled' | 'local';
}

interface SkillsProps {
  agentName: string;
}

const mockSkills: SkillItem[] = [
  {
    id: 'external-insight-public-search',
    name: '外搜洞察',
    description: '公开数据检索与洞察生成 (定时 Routine 日报)',
    tags: ['检索', '定时任务'],
    enabled: true,
    source: 'bundled',
  },
  {
    id: 'web-search',
    name: 'Web Search / 联网检索',
    description: '会话内即时检索 · 经 Gateway 出站 · 全量审计',
    tags: ['网络: outbound', '经 Gateway', '全量审计', '非 OAuth'],
    enabled: true,
    source: 'bundled',
  },
  {
    id: 'file-operations',
    name: '文件操作',
    description: '读写本地文件、管理工作区文档',
    tags: ['文件系统', '需审批'],
    enabled: false,
    source: 'bundled',
  },
  {
    id: 'code-interpreter',
    name: '代码解释器',
    description: 'Python 代码执行与数据分析',
    tags: ['编程', '数据分析', '需审批'],
    enabled: false,
    source: 'local',
  },
];

function Skills({ agentName }: SkillsProps) {
  const [skills, setSkills] = useState<SkillItem[]>(mockSkills);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; message: string } | null>(null);
  const [runningTest, setRunningTest] = useState<string | null>(null);

  const handleToggle = (skillId: string) => {
    setSkills((prev) => prev.map((s) => (s.id === skillId ? { ...s, enabled: !s.enabled } : s)));
    const skill = skills.find((s) => s.id === skillId);
    const newState = !skill?.enabled;
    setFeedback({
      id: skillId,
      message: newState ? '已启用 ✓' : '已停用',
    });
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleExpand = (skillId: string) => {
    setExpandedId(expandedId === skillId ? null : skillId);
  };

  const handleTestRun = async (skillId: string) => {
    setRunningTest(skillId);
    setFeedback(null);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const success = Math.random() > 0.2;
    if (success) {
      setFeedback({
        id: skillId,
        message: '✓ 测试成功: 找到 3 条相关结果',
      });
    } else {
      setFeedback({
        id: skillId,
        message: '✗ 测试失败: Gateway 未响应',
      });
    }

    setRunningTest(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleGoToChat = (skillId: string) => {
    setFeedback({
      id: skillId,
      message: '💬 已跳转到 Chat，请输入问题',
    });
    setTimeout(() => setFeedback(null), 2000);
  };

  const renderWebSearchDetails = () => (
    <div className="skill-details web-search-details">
      <div className="detail-section">
        <h4>何时触发</h4>
        <div className="trigger-blocks">
          <div className="trigger-block">
            <div className="trigger-icon">👤</div>
            <div className="trigger-text">用户要求事实/时效/引用</div>
          </div>
          <div className="trigger-block">
            <div className="trigger-icon">📝</div>
            <div className="trigger-text">上下文信息缺口</div>
          </div>
          <div className="trigger-block">
            <div className="trigger-icon">🔧</div>
            <div className="trigger-text">手动试跑测试</div>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h4>权限与出站</h4>
        <div className="outbound-flow">
          <div className="flow-step">Agent</div>
          <div className="flow-arrow">→</div>
          <div className="flow-step highlight">Gateway</div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">搜索引擎</div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">审计</div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">Chat 引用</div>
        </div>
        <p className="flow-note">所有出站流量只经 Gateway，全量审计，无需单独配置搜索 API Key</p>
      </div>

      <div className="detail-section">
        <h4>与外搜洞察的区别</h4>
        <div className="comparison-grid">
          <div className="comparison-card current">
            <div className="comparison-title">Web Search（本技能）</div>
            <ul>
              <li>会话内即时检索</li>
              <li>用户手动触发或 Agent 按需调用</li>
              <li>结果直接引用到对话中</li>
            </ul>
          </div>
          <div className="comparison-card other">
            <div className="comparison-title">外搜洞察（Routine）</div>
            <ul>
              <li>定时任务日报</li>
              <li>每日 9:00 自动运行</li>
              <li>生成结构化洞察报告</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="detail-callout">
        <div className="callout-icon">ℹ️</div>
        <div className="callout-text">
          <strong>不是 Connectors OAuth</strong> — Web Search 不需要在 Connectors 配置单独的搜索引擎
          API Key，所有搜索请求统一经过 Gateway 审计出站。
        </div>
      </div>
    </div>
  );

  const renderStandardDetails = (skill: SkillItem) => (
    <div className="skill-details">
      <h4>详细信息</h4>
      <ul>
        <li>来源: {skill.source === 'bundled' ? '内置' : '本地'}</li>
        <li>状态: {skill.enabled ? '已启用' : '已停用'}</li>
        <li>门槛: {skill.tags.includes('需审批') ? '高风险操作需审批' : '低门槛，自动执行'}</li>
      </ul>
    </div>
  );

  return (
    <div className="skills-container">
      <div className="skills-header">
        <div>
          <h2>Skills 技能库</h2>
          <p className="subtitle">{agentName} 的可用能力</p>
        </div>
      </div>

      <div className="skills-info-banner">
        <div className="info-icon">📚</div>
        <div className="info-text">
          Skills 赋予 Agent 执行任务的能力。启用后，Agent 可在会话中按需调用。
        </div>
      </div>

      {skills.length > 0 ? (
        <div className="skills-list">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className={`skill-card ${!skill.enabled ? 'disabled' : ''} ${skill.id === 'web-search' ? 'featured' : ''}`}
            >
              <div className="skill-header">
                <div className="skill-icon">
                  {skill.id === 'web-search' ? '🌐' : skill.source === 'bundled' ? '📦' : '🔧'}
                </div>
                <div className="skill-main">
                  <h3 className="skill-name">{skill.name}</h3>
                  <p className="skill-description">{skill.description}</p>
                </div>
                <div className="skill-toggle-wrapper">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={skill.enabled}
                      onChange={() => handleToggle(skill.id)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="skill-tags">
                {skill.tags.map((tag, idx) => (
                  <span key={idx} className="skill-tag">
                    {tag}
                  </span>
                ))}
              </div>

              {expandedId === skill.id &&
                (skill.id === 'web-search'
                  ? renderWebSearchDetails()
                  : renderStandardDetails(skill))}

              <div className="skill-actions">
                <button onClick={() => handleExpand(skill.id)} className="btn-details">
                  {expandedId === skill.id ? '收起详情' : '查看详情'}
                </button>
                {skill.id === 'web-search' && skill.enabled && (
                  <>
                    <button
                      onClick={() => handleTestRun(skill.id)}
                      disabled={runningTest === skill.id}
                      className="btn-test-run"
                    >
                      {runningTest === skill.id ? '运行中...' : '试跑一次'}
                    </button>
                    <button onClick={() => handleGoToChat(skill.id)} className="btn-go-chat">
                      在 Chat 里提问
                    </button>
                  </>
                )}
                {feedback && feedback.id === skill.id && (
                  <span
                    className={`feedback ${feedback.message.includes('✓') ? 'success' : feedback.message.includes('✗') ? 'error' : ''}`}
                  >
                    {feedback.message}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🛠️</div>
          <p>暂无技能</p>
        </div>
      )}
    </div>
  );
}

export default Skills;
