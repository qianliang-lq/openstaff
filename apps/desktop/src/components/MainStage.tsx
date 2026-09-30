import { useState } from 'react';
import { TabType } from '../App';
import ChatStage from './stages/ChatStage';
import Computer from './pages/Computer';
import Routines from './pages/Routines';
import Skills from './pages/Skills';
import Connectors from './Connectors';
import Memory from './pages/Memory';
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
  const [demoError, setDemoError] = useState<string | null>(null);

  // Special handling: Chat and Connectors tabs can show without agent
  // Other tabs require an agent
  if (!activeAgent && activeTab !== 'chat' && activeTab !== 'connectors') {
    return (
      <div className="main">
        <div className="empty-main-state">
          <div className="empty-main-icon">👈</div>
          <div className="empty-main-text">请先创建数字员工</div>
          <div className="empty-main-hint">点击左侧「+」开始</div>
        </div>
      </div>
    );
  }

  const runExternalInsightDemo = async () => {
    setIsRunningDemo(true);
    setDemoError(null);
    setDemoResponse(null);

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

      if (!response.ok) {
        throw new Error(`Scheduler 服务返回错误 (${response.status}): 请确保后端服务正在运行`);
      }

      const data = await response.json();
      console.log('Fire response:', data);

      // Poll runtime for job result
      const runtimeUrl = 'http://localhost:3003';
      let pollAttempts = 0;
      const maxPolls = 10;
      const pollInterval = 1000;
      let foundResult = false;

      while (pollAttempts < maxPolls) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        try {
          const insightResponse = await fetch(`${runtimeUrl}/v1/insights/latest`);
          if (!insightResponse.ok) {
            console.log('Polling attempt', pollAttempts + 1, 'failed: response not ok');
            pollAttempts++;
            continue;
          }

          const insightData = await insightResponse.json();

          if (
            insightData.reconcile_status === 'PASS' &&
            insightData.facts &&
            insightData.facts.length > 0
          ) {
            setDemoResponse(insightData);
            foundResult = true;
            setIsRunningDemo(false);
            return;
          } else if (insightData.reconcile_status === 'FAILED') {
            setDemoError('❌ 任务完成但未通过审核 (reconcile_status: FAILED)');
            setIsRunningDemo(false);
            foundResult = true;
            return;
          }
        } catch (error) {
          console.log('Polling attempt', pollAttempts + 1, 'failed:', error);
          if (pollAttempts === maxPolls - 1) {
            setDemoError(
              `❌ 运行超时 (${maxPolls}s)。任务已触发但结果未及时生成。\n\n可能原因：\n• Runtime 仍在处理（查看日志：\`tail -f /tmp/openstaff-runtime.log\`）\n• Gateway 模型调用超时\n• insights 数据格式不符预期\n\n稍后可手动查询：\`curl http://localhost:3003/v1/insights/latest\``
            );
            setIsRunningDemo(false);
            foundResult = true;
            return;
          }
        }

        pollAttempts++;
      }

      if (!foundResult) {
        setDemoError(
          `❌ 运行超时 (${maxPolls}s)。任务已触发但结果未及时生成。\n\n可能原因：\n• Runtime 仍在处理（查看日志：\`tail -f /tmp/openstaff-runtime.log\`）\n• Gateway 模型调用超时\n• insights 数据格式不符预期\n\n稍后可手动查询：\`curl http://localhost:3003/v1/insights/latest\``
        );
        setIsRunningDemo(false);
      }
    } catch (error) {
      console.error('Failed to fire job:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : '运行失败，请检查后端服务 (Scheduler: 3002, Runtime: 3003)';
      setDemoError(errorMessage);
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
        <div
          className="status-pill wait"
          onClick={() =>
            alert(
              '💡 审批功能\n\n这是演示状态显示。\n\n实际使用时：\n• 点击后会跳转到审批详情页\n• 可查看审批请求内容\n• 可进行通过/驳回操作\n\n当前版本：演示占位'
            )
          }
          style={{ cursor: 'pointer' }}
          title="点击查看审批功能说明"
        >
          <span className="pulse"></span>
          等待审批 (1)
        </div>
      </div>

      {demoError && (
        <div className="demo-error-banner">
          <span className="error-icon">❌</span>
          <span className="error-text">{demoError}</span>
          <button className="error-close" onClick={() => setDemoError(null)}>
            ✕
          </button>
        </div>
      )}

      <div className="stage">
        {activeTab === 'chat' && (
          <ChatStage
            demoResponse={demoResponse}
            agentName={activeAgent}
            hasAgent={!!activeAgent}
            onNavigateToConnectors={() => onTabChange('connectors')}
          />
        )}
        {activeTab === 'computer' && <Computer />}
        {activeTab === 'routines' && <Routines />}
        {activeTab === 'skills' && <Skills agentName={activeAgent} />}
        {activeTab === 'connectors' && <Connectors />}
        {activeTab === 'memory' && <Memory />}
      </div>
    </div>
  );
}

export default MainStage;
