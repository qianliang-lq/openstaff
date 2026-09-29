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
    id: 'skill-1',
    name: '外搜洞察',
    description: '公开数据检索与洞察生成 (external-insight-public-search)',
    tags: ['检索', '低门槛'],
    enabled: true,
    source: 'bundled',
  },
  {
    id: 'skill-2',
    name: 'Web 搜索',
    description: '互联网实时搜索与信息聚合',
    tags: ['检索', '实时'],
    enabled: true,
    source: 'bundled',
  },
  {
    id: 'skill-3',
    name: '文件操作',
    description: '读写本地文件、管理工作区文档',
    tags: ['文件系统', '需审批'],
    enabled: false,
    source: 'bundled',
  },
  {
    id: 'skill-4',
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

  return (
    <div className="skills-container">
      <div className="skills-header">
        <div>
          <h2>Skills 技能库</h2>
          <p className="subtitle">{agentName} 的可用能力</p>
        </div>
      </div>

      {skills.length > 0 ? (
        <div className="skills-grid">
          {skills.map((skill) => (
            <div key={skill.id} className={`skill-card ${!skill.enabled ? 'disabled' : ''}`}>
              <div className="skill-header">
                <div className="skill-icon">{skill.source === 'bundled' ? '📦' : '🔧'}</div>
                <div className="skill-main">
                  <h3 className="skill-name">{skill.name}</h3>
                  <p className="skill-description">{skill.description}</p>
                </div>
              </div>

              <div className="skill-tags">
                {skill.tags.map((tag, idx) => (
                  <span key={idx} className="skill-tag">
                    {tag}
                  </span>
                ))}
              </div>

              {expandedId === skill.id && (
                <div className="skill-details">
                  <h4>详细信息</h4>
                  <ul>
                    <li>来源: {skill.source === 'bundled' ? '内置' : '本地'}</li>
                    <li>状态: {skill.enabled ? '已启用' : '已停用'}</li>
                    <li>
                      门槛:{' '}
                      {skill.tags.includes('需审批') ? '高风险操作需审批' : '低门槛，自动执行'}
                    </li>
                  </ul>
                </div>
              )}

              <div className="skill-actions">
                <button onClick={() => handleExpand(skill.id)} className="btn-details">
                  {expandedId === skill.id ? '收起' : '查看详情'}
                </button>
                <button onClick={() => handleToggle(skill.id)} className="btn-toggle">
                  {skill.enabled ? '停用' : '启用'}
                </button>
                {feedback && feedback.id === skill.id && (
                  <span className="feedback">{feedback.message}</span>
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
