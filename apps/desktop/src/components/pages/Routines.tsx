import { useState } from 'react';
import './Routines.css';

interface RoutineItem {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  lastRunAt?: string;
  lastStatus?: 'PASS' | 'FAILED' | 'RUNNING' | 'NEVER';
  skillId?: string;
}

interface RoutinesProps {
  agentName: string;
}

const mockRoutines: RoutineItem[] = [
  {
    id: 'routine-1',
    name: '外搜洞察日报',
    schedule: '每日 9:00',
    enabled: true,
    lastRunAt: '2026-09-28 09:00',
    lastStatus: 'PASS',
    skillId: 'external-insight-public-search',
  },
  {
    id: 'routine-2',
    name: '竞品分析周报',
    schedule: '每周一 10:00',
    enabled: true,
    lastRunAt: '2026-09-26 10:00',
    lastStatus: 'PASS',
    skillId: 'competitor-analysis',
  },
  {
    id: 'routine-3',
    name: '团队周报生成',
    schedule: '每周五 17:00',
    enabled: false,
    lastRunAt: undefined,
    lastStatus: 'NEVER',
  },
];

function Routines({ agentName }: RoutinesProps) {
  const [routines, setRoutines] = useState<RoutineItem[]>(mockRoutines);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; message: string } | null>(null);

  const handleRunNow = async (routineId: string) => {
    setRunningId(routineId);
    setFeedback(null);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const success = Math.random() > 0.2;

    if (success) {
      setFeedback({ id: routineId, message: '运行成功 ✓' });
      setRoutines((prev) =>
        prev.map((r) =>
          r.id === routineId
            ? { ...r, lastRunAt: new Date().toLocaleString('zh-CN'), lastStatus: 'PASS' as const }
            : r
        )
      );
    } else {
      setFeedback({ id: routineId, message: '运行失败，请检查后端服务状态' });
    }

    setRunningId(null);
    setTimeout(() => setFeedback(null), 3000);
  };

  const getStatusBadge = (status?: RoutineItem['lastStatus']) => {
    if (!status || status === 'NEVER') {
      return <span className="status-badge never">从未运行</span>;
    }
    const statusMap = {
      PASS: { label: '成功', className: 'pass' },
      FAILED: { label: '失败', className: 'failed' },
      RUNNING: { label: '运行中', className: 'running' },
    };
    const { label, className } = statusMap[status];
    return <span className={`status-badge ${className}`}>{label}</span>;
  };

  return (
    <div className="routines-container">
      <div className="routines-header">
        <div>
          <h2>Routines 任务编排</h2>
          <p className="subtitle">{agentName} 的定时任务</p>
        </div>
        <button className="btn-new" disabled>
          新建 (即将开放)
        </button>
      </div>

      {routines.length > 0 ? (
        <div className="routines-list">
          {routines.map((routine) => (
            <div key={routine.id} className={`routine-card ${!routine.enabled ? 'disabled' : ''}`}>
              <div className="routine-header">
                <div className="routine-info">
                  <h3 className="routine-name">{routine.name}</h3>
                  <div className="routine-meta">
                    <span className="schedule">📅 {routine.schedule}</span>
                    {routine.lastRunAt && (
                      <span className="last-run">上次运行: {routine.lastRunAt}</span>
                    )}
                  </div>
                </div>
                <div className="routine-status">{getStatusBadge(routine.lastStatus)}</div>
              </div>

              <div className="routine-actions">
                <button
                  onClick={() => handleRunNow(routine.id)}
                  disabled={!routine.enabled || runningId === routine.id}
                  className="btn-run"
                >
                  {runningId === routine.id ? '运行中...' : '立即跑一次'}
                </button>
                {feedback && feedback.id === routine.id && (
                  <span
                    className={`feedback ${feedback.message.includes('成功') ? 'success' : 'error'}`}
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
          <div className="empty-icon">📋</div>
          <p>还没有 Routine</p>
          <button className="btn-new-empty" disabled>
            新建 (即将开放)
          </button>
        </div>
      )}
    </div>
  );
}

export default Routines;
