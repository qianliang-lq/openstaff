import { useState } from 'react';
import './Computer.css';

interface ComputerView {
  agentId: string;
  status: 'running' | 'idle' | 'stopped' | 'error';
  workspacePath: string;
  cwd: string;
  recentFiles: { path: string; updatedAt: string }[];
  terminalPreview?: string;
}

interface ComputerProps {
  agentName: string;
}

const mockComputerData: ComputerView = {
  agentId: 'agent-1',
  status: 'idle',
  workspacePath: '/home/agent/workspace',
  cwd: '/home/agent/workspace',
  recentFiles: [
    { path: 'PRD_2026Q3.md', updatedAt: '2026-09-28 15:30' },
    { path: 'competitor_analysis.xlsx', updatedAt: '2026-09-27 14:22' },
    { path: 'meeting_notes.txt', updatedAt: '2026-09-27 10:15' },
  ],
  terminalPreview: '$ ls -la\ntotal 24\ndrwxr-xr-x 3 agent agent 4096 Sep 28 15:30 .',
};

function Computer({ agentName }: ComputerProps) {
  const [data, setData] = useState<ComputerView>(mockComputerData);
  const [loading, setLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setData(mockComputerData);
    setLoading(false);
  };

  const handleOpenWorkspace = () => {
    setCopyFeedback(true);
    navigator.clipboard.writeText(data.workspacePath);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const getStatusBadge = (status: ComputerView['status']) => {
    const statusMap = {
      running: { label: '运行中', className: 'running' },
      idle: { label: '空闲', className: 'idle' },
      stopped: { label: '已停止', className: 'stopped' },
      error: { label: '错误', className: 'error' },
    };
    const { label, className } = statusMap[status];
    return <span className={`status-badge ${className}`}>{label}</span>;
  };

  return (
    <div className="computer-container">
      <div className="computer-header">
        <div>
          <h2>Computer 沙箱</h2>
          <p className="subtitle">{agentName} 的工作区快照</p>
        </div>
        <button onClick={handleRefresh} disabled={loading} className="btn-refresh">
          {loading ? '刷新中...' : '刷新'}
        </button>
      </div>

      <div className="computer-status-bar">
        {getStatusBadge(data.status)}
        <span className="workspace-path">{data.workspacePath}</span>
      </div>

      <div className="computer-section">
        <h3>最近文件</h3>
        {data.recentFiles.length > 0 ? (
          <div className="files-list">
            {data.recentFiles.map((file, idx) => (
              <div key={idx} className="file-item">
                <div className="file-icon">📄</div>
                <div className="file-info">
                  <div className="file-path">{file.path}</div>
                  <div className="file-updated">{file.updatedAt}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">暂无文件</div>
        )}
      </div>

      {data.terminalPreview && (
        <div className="computer-section">
          <h3>终端预览</h3>
          <pre className="terminal-preview">{data.terminalPreview}</pre>
        </div>
      )}

      <div className="computer-actions">
        <button onClick={handleOpenWorkspace} className="btn-primary">
          {copyFeedback ? '路径已复制 ✓' : '打开工作区'}
        </button>
      </div>
    </div>
  );
}

export default Computer;
