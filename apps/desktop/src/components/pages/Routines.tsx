import { useState } from 'react';
import './Routines.css';

interface Routine {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
  tags: string[];
}

function Routines() {
  const [routines] = useState<Routine[]>([
    {
      id: 'external-insight',
      name: '外部洞察日报',
      schedule: 'Cron: 0 9 * * 1-5',
      enabled: true,
      lastRun: '今天 09:02',
      nextRun: '明天 09:00',
      tags: ['已测通过', '审核通过'],
    },
    {
      id: 'standUp',
      name: '行业跑满日报',
      schedule: 'Cron: 0 8,20 * * 1-5',
      enabled: true,
      nextRun: '今天 20:00',
      tags: ['已测通过'],
    },
    {
      id: 'github-issue',
      name: 'GitHub Issue 摆动状态',
      schedule: '工作日 17:30',
      enabled: false,
      nextRun: '-',
      tags: ['开发'],
    },
  ]);

  return (
    <div className="routines-container">
      <div className="routines-header">
        <div>
          <h1>Routines</h1>
          <p className="routines-subtitle">定时任务 · 自动化 Chat 流 · 可编排审核</p>
        </div>
        <button className="btn-primary">+ 创建 Routine</button>
      </div>

      <div className="section">
        <div className="routines-list">
          {routines.map((routine) => (
            <div key={routine.id} className="routine-card">
              <div className="routine-header">
                <div className="routine-info">
                  <h3 className="routine-name">{routine.name}</h3>
                  <p className="routine-schedule">{routine.schedule}</p>
                </div>
                <div className="routine-toggle">
                  <label className="switch">
                    <input type="checkbox" checked={routine.enabled} readOnly />
                    <span className="slider"></span>
                  </label>
                  <span className="routine-status">{routine.enabled ? '启用' : '禁用'}</span>
                </div>
              </div>

              <div className="routine-details">
                <div className="detail-row">
                  <span className="detail-label">上次运行:</span>
                  <span className="detail-value">{routine.lastRun || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">下次运行:</span>
                  <span className="detail-value">{routine.nextRun}</span>
                </div>
              </div>

              <div className="routine-tags">
                {routine.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="routine-actions">
                <button className="btn-secondary">立即运行</button>
                <button className="btn-secondary">编辑</button>
                <button className="btn-secondary">查看日志</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">创建 Routine 模板</h2>
        <div className="template-grid">
          <div className="template-card">
            <div className="template-icon">📅</div>
            <h3 className="template-name">每日报告</h3>
            <p className="template-desc">每天固定时间生成报告</p>
          </div>
          <div className="template-card">
            <div className="template-icon">🔔</div>
            <h3 className="template-name">事件触发</h3>
            <p className="template-desc">GitHub / Slack 事件触发</p>
          </div>
          <div className="template-card">
            <div className="template-icon">⚡</div>
            <h3 className="template-name">高频监控</h3>
            <p className="template-desc">每 5 分钟检查一次</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Routines;
