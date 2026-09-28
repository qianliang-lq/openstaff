import ValidationGateWidget from '../ValidationGateWidget';
import './ChatStage.css';

function ChatStage() {
  return (
    <div className="chat-stage">
      <div className="chat-messages">
        <div className="message user">
          <div className="message-bubble">
            请帮我准备产品经理数字员工周报，包含本周完成的 PRD 文档和待办事项
          </div>
        </div>

        <div className="message assistant">
          <div className="message-avatar">产</div>
          <div className="message-content">
            <div className="message-bubble">
              好的，我正在整理本周工作内容。让我先查看本周的工作日志和文档...
            </div>
          </div>
        </div>

        <div className="message assistant">
          <div className="message-avatar">产</div>
          <div className="message-content">
            <div className="message-bubble">
              我准备了一份周报草稿，包含以下内容：
              <ul>
                <li>完成 3 个 PRD 文档编写</li>
                <li>参与 5 次需求评审会议</li>
                <li>更新产品路线图</li>
              </ul>
              需要我执行数据库查询来获取更详细的指标数据吗？
            </div>

            <ValidationGateWidget />
          </div>
        </div>
      </div>

      <div className="chat-input-area">
        <div className="input-wrapper">
          <input type="text" className="chat-input" placeholder="输入消息..." />
          <button className="send-btn">发送</button>
        </div>
      </div>
    </div>
  );
}

export default ChatStage;
