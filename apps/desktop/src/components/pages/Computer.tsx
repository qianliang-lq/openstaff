import { useState, useEffect } from 'react';
import './Computer.css';

interface FsNode {
  name: string;
  path: string;
  kind: 'dir' | 'file';
  children?: FsNode[];
}

interface ComputerView {
  agentId: string;
  sandboxLabel: string;
  nodeId: string;
  status: 'running' | 'idle' | 'stopped' | 'error';
  tree: FsNode;
  selectedPath: string | null;
  terminalLines: string[];
  metrics?: {
    cpuPct: number;
    memMb: number;
    diskUsedGb: number;
    diskTotalGb: number;
  };
}

interface ComputerProps {
  agentName: string;
}

async function loadComputerData(agentId: string): Promise<ComputerView | null> {
  try {
    const response = await fetch('/fixtures/computer.json');
    if (!response.ok) return null;
    const data = await response.json();
    return data[agentId] || null;
  } catch (error) {
    console.error('Failed to load computer data:', error);
    return null;
  }
}

function Computer({ agentName }: ComputerProps) {
  const [data, setData] = useState<ComputerView | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    const agentId = agentName === '产品经理数字员工' ? 'agent-1' : 'agent-2';
    loadComputerData(agentId).then((computerData) => {
      if (computerData) {
        setData(computerData);
        setSelectedPath(computerData.selectedPath);
      }
    });
  }, [agentName]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const handleFileClick = (node: FsNode) => {
    if (node.kind === 'file') {
      setSelectedPath(node.path);
      showToast(`已选中 ${node.path}`);
    }
  };

  const handleOpenWorkspace = () => {
    if (data) {
      showToast('路径已复制');
      navigator.clipboard.writeText(data.tree.path);
    }
  };

  const renderTree = (node: FsNode, level: number = 0): JSX.Element => {
    const isSelected = selectedPath === node.path;
    const isRoot = level === 0;

    return (
      <div key={node.path} className="tree-node">
        <div
          className={`tree-item ${isSelected ? 'selected' : ''} ${isRoot ? 'root' : ''}`}
          style={{ paddingLeft: `${level * 20}px` }}
          onClick={() => {
            if (isRoot) {
              handleOpenWorkspace();
            } else if (node.kind === 'file') {
              handleFileClick(node);
            }
          }}
        >
          <span className="tree-icon">{node.kind === 'dir' ? '📁' : '📄'}</span>
          <span className="tree-name">{node.name}</span>
        </div>
        {node.children && node.children.map((child) => renderTree(child, level + 1))}
      </div>
    );
  };

  if (!data) {
    return (
      <div className="computer-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="computer-container">
      <div className="computer-header-badge">
        <span className="sandbox-label">{data.sandboxLabel}</span>
        <span className="node-id">{data.nodeId}</span>
      </div>

      <div className="computer-layout">
        <div className="workspace-panel">
          <h3>Workspace</h3>
          <div className="workspace-tree">{renderTree(data.tree)}</div>
        </div>

        <div className="terminal-panel">
          <h3>终端（只读）</h3>
          <div className="terminal-content">
            {data.terminalLines.map((line, idx) => (
              <div key={idx} className="terminal-line">
                {line}
              </div>
            ))}
          </div>

          {data.metrics && (
            <div className="metrics-bar">
              <div className="metric-item">
                <span className="metric-label">CPU</span>
                <span className="metric-value">{data.metrics.cpuPct}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">MEM</span>
                <span className="metric-value">{data.metrics.memMb}MB</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">DISK</span>
                <span className="metric-value">
                  {data.metrics.diskUsedGb}GB / {data.metrics.diskTotalGb}GB
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="computer-actions">
        <button onClick={handleOpenWorkspace} className="btn-primary">
          打开工作区
        </button>
      </div>

      {toastMessage && <div className="toast-message">{toastMessage}</div>}
    </div>
  );
}

export default Computer;
