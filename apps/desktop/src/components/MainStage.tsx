import { useState } from 'react';
import { TabType } from '../App';
import ChatStage from './stages/ChatStage';
import Connectors from './Connectors';
import { ExternalInsightFact } from './ExternalInsightReportCard';
import './MainStage.css';

interface MainStageProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeAgent: string;
}

interface Tab {
  id: TabType;
  label: string;
}

interface DemoResponse {
  reconcile_status: string;
  facts?: ExternalInsightFact[];
  summary?: string[];
  artifacts_path: string;
  timestamp: string;
}

const tabs: Tab[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'computer', label: 'Computer' },
  { id: 'routines', label: 'Routines' },
  { id: 'skills', label: 'Skills' },
  { id: 'connectors', label: 'Connectors' },
  { id: 'memory', label: 'Memory' },
];

function MainStage({ activeTab, onTabChange, activeAgent }: MainStageProps) {
  const [demoResponse, setDemoResponse] = useState<DemoResponse | null>(null);
  const [isRunningDemo, setIsRunningDemo] = useState(false);

  const runExternalInsightDemo = async () => {
    setIsRunningDemo(true);
    try {
      const schedulerUrl = 'http://localhost:3002';
      const response = await fetch(`${schedulerUrl}/demo/fire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routine_id: 'external-insight-daily',
          skill_id: 'external-insight-public-search',
          trigger: 'manual',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fire response:', data);

        // Poll runtime for job result
        const runtimeUrl = 'http://localhost:3003';
        let pollAttempts = 0;
        const maxPolls = 10;
        const pollInterval = 1000; // 1 second

        while (pollAttempts < maxPolls) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));

          try {
            const insightResponse = await fetch(`${runtimeUrl}/v1/insights/latest`);
            if (insightResponse.ok) {
              const insightData = await insightResponse.json();
              setDemoResponse(insightData);
              break;
            }
          } catch (error) {
            console.log('Polling attempt', pollAttempts + 1, 'failed:', error);
          }

          pollAttempts++;
        }

        if (pollAttempts >= maxPolls) {
          console.warn('Max polling attempts reached, no result found');
        }
      } else {
        console.error('Fire failed:', await response.text());
        setDemoResponse(null);
      }
    } catch (error) {
      console.error('Failed to fire job:', error);
      setDemoResponse(null);
    } finally {
      setIsRunningDemo(false);
    }
  };

  return (
    <div className="main">
      <div className="tabbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <div className="tab-spacer"></div>
        <button
          onClick={runExternalInsightDemo}
          disabled={isRunningDemo}
          className="demo-btn"
          style={{
            padding: '6px 12px',
            background: isRunningDemo ? '#9ca3af' : '#e11d48',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunningDemo ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            marginRight: '8px',
          }}
        >
          {isRunningDemo ? '运行中...' : '立即跑一次'}
        </button>
        <div className="status-pill wait">
          <span className="pulse"></span>
          等待审批 (1)
        </div>
      </div>

      <div className="stage">
        {activeTab === 'chat' && (
          <ChatStage
            demoResponse={demoResponse}
            agentName={activeAgent}
            onNavigateToConnectors={() => onTabChange('connectors')}
          />
        )}
        {activeTab === 'computer' && <div className="stub-page">Computer 沙箱 (开发中)</div>}
        {activeTab === 'routines' && <div className="stub-page">Routines 任务编排 (开发中)</div>}
        {activeTab === 'skills' && <div className="stub-page">Skills 技能库 (开发中)</div>}
        {activeTab === 'connectors' && <Connectors />}
        {activeTab === 'memory' && <div className="stub-page">Memory 记忆与人设 (开发中)</div>}
      </div>
    </div>
  );
}

export default MainStage;
