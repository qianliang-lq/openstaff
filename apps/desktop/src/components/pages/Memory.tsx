import './Memory.css';

function Memory() {
  return (
    <div className="memory-container">
      <div className="memory-header">
        <h1>Memory</h1>
        <p className="memory-subtitle">人格 Profile + 记忆 · 问门记录 · 可编辑汇总</p>
      </div>

      <div className="memory-layout">
        <div className="memory-section profile-section">
          <h2 className="section-title">Profile · 人设</h2>
          <div className="profile-card">
            <div className="profile-field">
              <label className="field-label">外显:</label>
              <p className="field-value">产品经理数字员工，服务于 FIND 开发者平台与产品线。</p>
            </div>
            <div className="profile-field">
              <label className="field-label">管权:</label>
              <p className="field-value">产品经理、需求拼图、国库需期、统贸目时。</p>
            </div>
            <div className="profile-field">
              <label className="field-label">说风:</label>
              <p className="field-value">专业、清晰、无代码贱。用「」无用&ldquo;&rdquo;。</p>
            </div>
            <div className="profile-field">
              <label className="field-label">好贱:</label>
              <p className="field-value">
                代码产品划。优后兼载不清保伃拆扁讯时即
                PRD开放浴顿吗代指南铺时。田论拥文长抄不堡陈字。
              </p>
            </div>
            <div className="profile-actions">
              <button className="btn-secondary">编辑 Profile</button>
            </div>
          </div>
        </div>

        <div className="memory-section log-section">
          <div className="section-header">
            <h2 className="section-title">Log · 间门记录 / 洛回赏览</h2>
            <button className="btn-link">刷新</button>
          </div>

          <div className="log-list">
            <div className="log-item">
              <div className="log-header">
                <div className="log-meta">
                  <span className="log-date">今天 11:52</span>
                  <span className="log-dot">·</span>
                  <span className="log-type">间门1批录</span>
                  <span className="log-dot">·</span>
                  <span className="log-routine">Routine</span>
                </div>
                <button className="log-expand-btn">展开</button>
              </div>
              <div className="log-content">
                <p className="log-text">
                  今天买古交拿记录 Chat 记-24h. 埝·宁 reconcile PASS·尚以时选配坐拉 2041
                </p>
              </div>
            </div>

            <div className="log-item">
              <div className="log-header">
                <div className="log-meta">
                  <span className="log-date">今天 09:02</span>
                  <span className="log-dot">·</span>
                  <span className="log-type">间门1批录</span>
                  <span className="log-dot">·</span>
                  <span className="log-routine">外部洞察日报</span>
                </div>
                <button className="log-expand-btn">展开</button>
              </div>
              <div className="log-content">
                <p className="log-text">
                  盯戳曲 industry.public-search 蒜 reconcile PASS 批本证时 #8421
                </p>
              </div>
            </div>

            <div className="log-item">
              <div className="log-header">
                <div className="log-meta">
                  <span className="log-date">昨天 17:38</span>
                  <span className="log-dot">·</span>
                  <span className="log-type">上当排</span>
                </div>
                <button className="log-expand-btn">展开</button>
              </div>
              <div className="log-content">
                <p className="log-text">毅杆 Slack 控室芝荘白号公 转 actor 转级</p>
              </div>
            </div>

            <div className="log-item">
              <div className="log-header">
                <div className="log-meta">
                  <span className="log-date">09-22</span>
                  <span className="log-dot">·</span>
                  <span className="log-type">会议总结</span>
                </div>
                <button className="log-expand-btn">展开</button>
              </div>
              <div className="log-content">
                <p className="log-text">
                  用户相栅:「协幣/吊汉/工贤陈」三杆甄碟纹·代 cơ 赋贯寨志脏总括。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Memory;
