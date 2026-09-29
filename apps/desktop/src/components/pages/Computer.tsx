import './Computer.css';

function Computer() {
  return (
    <div className="computer-container">
      <div className="computer-header">
        <h1>Computer</h1>
        <p className="computer-subtitle">沙箱环境 · 命令行 · 文件系统</p>
      </div>

      <div className="section">
        <h2 className="section-title">沙箱状态</h2>
        <div className="sandbox-card">
          <div className="sandbox-header">
            <div className="sandbox-icon">🖥️</div>
            <div className="sandbox-info">
              <div className="sandbox-name">产品经理数字员工 - 沙箱</div>
              <div className="sandbox-status">
                <span className="status-badge running">运行中</span>
              </div>
            </div>
          </div>

          <div className="sandbox-details">
            <div className="detail-row">
              <span className="detail-label">容器ID:</span>
              <span className="detail-value">sandbox-pm-001</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">工作目录:</span>
              <span className="detail-value">/workspace</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">运行时长:</span>
              <span className="detail-value">2h 34m</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">终端</h2>
        <div className="terminal-card">
          <div className="terminal-header">
            <span className="terminal-title">bash</span>
            <div className="terminal-actions">
              <button className="terminal-btn">清屏</button>
              <button className="terminal-btn">重启</button>
            </div>
          </div>
          <div className="terminal-body">
            <div className="terminal-line">
              <span className="terminal-prompt">ubuntu@sandbox:~/workspace$</span>
              <span className="terminal-command">ls -la briefs/</span>
            </div>
            <div className="terminal-output">
              total 8<br />
              drwxr-xr-x 2 ubuntu ubuntu 4096 Sep 28 10:22 .<br />
              drwxr-xr-x 5 ubuntu ubuntu 4096 Sep 28 10:20 ..
              <br />
              -rw-r--r-- 1 ubuntu ubuntu 249 Sep 28 10:22 2026-W39.md
            </div>
            <div className="terminal-line">
              <span className="terminal-prompt">ubuntu@sandbox:~/workspace$</span>
              <span className="terminal-cursor">_</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">文件浏览器</h2>
        <div className="file-browser">
          <div className="file-tree">
            <div className="file-item folder">
              <span className="file-icon">📁</span>
              <span className="file-name">workspace</span>
            </div>
            <div className="file-item folder indent">
              <span className="file-icon">📁</span>
              <span className="file-name">briefs</span>
            </div>
            <div className="file-item file indent-2">
              <span className="file-icon">📄</span>
              <span className="file-name">2026-W39.md</span>
              <span className="file-size">249 B</span>
            </div>
            <div className="file-item folder indent">
              <span className="file-icon">📁</span>
              <span className="file-name">research</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Computer;
