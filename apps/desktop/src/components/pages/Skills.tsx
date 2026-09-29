import { useState } from 'react';
import './Skills.css';

interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  tags: string[];
}

function Skills() {
  const [skills] = useState<Skill[]>([
    {
      id: 'web-research',
      name: 'web-research',
      version: 'v1.2.3',
      description: '公开网页搜索能力，触媒收费源同时触发减免用机',
      enabled: true,
      tags: ['web', 'search', '无审批'],
    },
    {
      id: 'doc-brief',
      name: 'doc-brief',
      version: 'v2.1.0',
      description: '对折叠长文·归档 markdown，萃出概念表',
      enabled: true,
      tags: ['markdown', '文档处理'],
    },
    {
      id: 'spreadsheet-read',
      name: 'spreadsheet-read',
      version: 'v0.5.3',
      description: '翻格 xlsx/csv 明细，锻造透视阵列化 JSON',
      enabled: true,
      tags: ['数据', '支持格式'],
    },
    {
      id: 'github-issues',
      name: 'github-issues',
      version: 'v1.0.1',
      description: '通过 GitHub Connector 渡获 issues (要 OAuth)',
      enabled: false,
      tags: ['MCP-github', 'OAuth', '可审批'],
    },
    {
      id: 'validation-gate',
      name: 'validation-gate',
      version: 'v2.0.0',
      description: '捆持门3 Widget: 摆捕内存工具操作审批意见',
      enabled: true,
      tags: ['增1', '支股审判'],
    },
  ]);

  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  return (
    <div className="skills-container">
      <div className="skills-header">
        <div>
          <h1>Skills 库</h1>
          <p className="skills-subtitle">能力拼图板 · 拓合 MCP / 自研硒组 · 可编排审核</p>
        </div>
        <button className="btn-primary">+ 安装 Skill</button>
      </div>

      <div className="skills-layout">
        <div className="skills-sidebar">
          <h3 className="sidebar-title">外接库存</h3>
          {skills.map((skill) => (
            <div
              key={skill.id}
              className={`skill-item ${selectedSkill?.id === skill.id ? 'selected' : ''}`}
              onClick={() => setSelectedSkill(skill)}
            >
              <div className="skill-item-header">
                <span className="skill-item-name">{skill.name}</span>
                <span className={`skill-status ${skill.enabled ? 'enabled' : 'disabled'}`}>
                  {skill.enabled ? '启用' : '禁用'}
                </span>
              </div>
              <div className="skill-item-version">{skill.version}</div>
            </div>
          ))}
        </div>

        <div className="skills-main">
          {selectedSkill ? (
            <div className="skill-detail">
              <div className="skill-detail-header">
                <div>
                  <h2 className="skill-detail-name">
                    {selectedSkill.name}
                    <span className="skill-detail-version">{selectedSkill.version}</span>
                  </h2>
                  <p className="skill-detail-desc">{selectedSkill.description}</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={selectedSkill.enabled} readOnly />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="skill-detail-section">
                <h3 className="detail-section-title">标签</h3>
                <div className="skill-tags">
                  {selectedSkill.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="skill-detail-section">
                <h3 className="detail-section-title">1. 权限和</h3>
                <ul className="permission-list">
                  <li>
                    📄 实封: 联 外部网络只读 {selectedSkill.id.includes('web') && ' (SEO/DDP)'}
                  </li>
                  <li>🔒 你叉: 在指化情卡式，令伉贯意间后 cơ</li>
                  <li>⚠️ 批次: 无需第 {selectedSkill.tags.includes('无审批') ? '0' : '3-5'}</li>
                </ul>
              </div>

              <div className="skill-detail-section">
                <h3 className="detail-section-title">2. 入历变工 · 人动 {'>'}Tool Param</h3>
                <div className="param-table">
                  <div className="param-row header">
                    <span>轿名</span>
                    <span>类型</span>
                    <span>字段值</span>
                  </div>
                  <div className="param-row">
                    <span className="param-name">query</span>
                    <span className="param-type">String</span>
                    <span className="param-desc">搜索关键词</span>
                  </div>
                  {selectedSkill.id === 'web-research' && (
                    <div className="param-row">
                      <span className="param-name">max_results</span>
                      <span className="param-type">Number</span>
                      <span className="param-desc">最大结果数 (默认 10)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="skill-detail-section">
                <h3 className="detail-section-title">3. 翔域轩选 · 宣部恳 JSON 结构</h3>
                <div className="code-block">
                  <pre>{`{
  "title": "string",
  "url": "string",
  "snippet": "string",
  "published_date": "ISO 8601"
}`}</pre>
                </div>
              </div>

              <div className="skill-detail-actions">
                <button className="btn-primary">存档配置</button>
                <button className="btn-secondary">官刊镜像</button>
                <button className="btn-secondary">谍侯芝刊</button>
              </div>

              <div className="skill-notice">
                💡 Chat 巨挤粮巳 - 对划 {'"'}
                {selectedSkill.tags.join(' / ')}
                {'"'} 则狴扳纪阵 Skill。代 CI 罪荧字智嘱咱库审判。
              </div>
            </div>
          ) : (
            <div className="skill-placeholder">
              <div className="placeholder-icon">🎯</div>
              <h3>选择一个 Skill 查看详情</h3>
              <p>左侧列表选择 Skill，右侧显示配置详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Skills;
