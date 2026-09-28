import { TabType } from '../App';
import ChatStage from './stages/ChatStage';
import './MainStage.css';

interface MainStageProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface Tab {
  id: TabType;
  label: string;
}

const tabs: Tab[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'computer', label: 'Computer' },
  { id: 'routines', label: 'Routines' },
  { id: 'skills', label: 'Skills' },
  { id: 'connectors', label: 'Connectors' },
  { id: 'memory', label: 'Memory' },
];

function MainStage({ activeTab, onTabChange }: MainStageProps) {
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
        <div className="status-pill wait">
          <span className="pulse"></span>
          等待审批 (1)
        </div>
      </div>

      <div className="stage">
        {activeTab === 'chat' && <ChatStage />}
        {activeTab === 'computer' && <div className="stub-page">Computer 沙箱 (开发中)</div>}
        {activeTab === 'routines' && <div className="stub-page">Routines 任务编排 (开发中)</div>}
        {activeTab === 'skills' && <div className="stub-page">Skills 技能库 (开发中)</div>}
        {activeTab === 'connectors' && <div className="stub-page">Connectors 连接器 (开发中)</div>}
        {activeTab === 'memory' && <div className="stub-page">Memory 记忆与人设 (开发中)</div>}
      </div>
    </div>
  );
}

export default MainStage;
