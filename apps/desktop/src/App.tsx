import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MainStage from './components/MainStage';
import './App.css';

export type TabType = 'chat' | 'computer' | 'routines' | 'skills' | 'connectors' | 'memory';

const loadActiveAgentFromStorage = (): string => {
  try {
    return localStorage.getItem('openstaff_active_agent') || '';
  } catch (error) {
    return '';
  }
};

const saveActiveAgentToStorage = (agentName: string) => {
  try {
    if (agentName) {
      localStorage.setItem('openstaff_active_agent', agentName);
    } else {
      localStorage.removeItem('openstaff_active_agent');
    }
  } catch (error) {
    console.error('Failed to save active agent:', error);
  }
};

function App() {
  const [activeAgent, setActiveAgent] = useState(() => loadActiveAgentFromStorage());
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  useEffect(() => {
    saveActiveAgentToStorage(activeAgent);
  }, [activeAgent]);

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
