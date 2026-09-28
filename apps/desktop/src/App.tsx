import { useState } from 'react';
import Titlebar from './components/Titlebar';
import Sidebar from './components/Sidebar';
import MainStage from './components/MainStage';
import './App.css';

export type TabType = 'chat' | 'computer' | 'routines' | 'skills' | 'connectors' | 'memory';

function App() {
  const [activeAgent, setActiveAgent] = useState('产品经理开发工具');
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  return (
    <div className="app">
      <Titlebar />
      <div className="body">
        <Sidebar activeAgent={activeAgent} onAgentChange={setActiveAgent} />
        <MainStage activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

export default App;
