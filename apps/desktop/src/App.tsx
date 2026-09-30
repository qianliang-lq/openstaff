import { useState } from 'react';
import Sidebar from './components/Sidebar';
import MainStage from './components/MainStage';
import './App.css';

export type TabType = 'chat' | 'computer' | 'routines' | 'skills' | 'connectors' | 'memory';

function App() {
  const [activeAgent, setActiveAgent] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  return (
    <div className="app">
      <div className="body">
        <Sidebar activeAgent={activeAgent} onAgentChange={setActiveAgent} />
        <MainStage activeTab={activeTab} onTabChange={setActiveTab} activeAgent={activeAgent} />
      </div>
    </div>
  );
}

export default App;
