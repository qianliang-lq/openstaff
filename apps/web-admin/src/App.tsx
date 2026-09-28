import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import InstancesPage from './pages/InstancesPage';
import './App.css';

export type PageType = 'instances' | 'nodes' | 'observability' | 'audit';

function App() {
  const [activePage, setActivePage] = useState<PageType>('instances');

  return (
    <div className="app">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <div className="main">
        <Topbar currentPage={activePage} />
        <div className="content">
          {activePage === 'instances' && <InstancesPage />}
          {activePage === 'nodes' && <div className="stub-page">节点与运行时 (开发中)</div>}
          {activePage === 'observability' && <div className="stub-page">观测 (开发中)</div>}
          {activePage === 'audit' && <div className="stub-page">审批审计 (开发中)</div>}
        </div>
      </div>
    </div>
  );
}

export default App;
