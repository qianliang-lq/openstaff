function App() {
  return (
    <div className="container">
      <h1>OpenStaff Admin Console</h1>
      <p>管理控制台 / Administration Console</p>

      <div className="info">
        <h2>Status</h2>
        <p>✅ React + TypeScript initialized</p>
        <p>⏳ Agent management - coming in T1</p>
        <p>⏳ User management - coming in T3</p>
        <p>⏳ Audit logs viewer - coming in T3</p>
        <p>⏳ System metrics - coming in T4</p>
      </div>

      <div className="modules">
        <h2>Planned Modules</h2>
        <ul>
          <li>Agent Directory & Status</li>
          <li>Session Management</li>
          <li>Approval Policy Editor</li>
          <li>Connector Configuration</li>
          <li>Audit Log Browser</li>
          <li>System Health Dashboard</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
