import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [greeting, setGreeting] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreeting(await invoke("greet", { name }));
  }

  return (
    <div className="container">
      <h1>OpenStaff Desktop</h1>
      <p>开源数字员工 OS / Open-Source Digital Staff OS</p>

      <div className="row">
        <input
          id="greet-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name..."
        />
        <button type="button" onClick={greet}>
          Greet
        </button>
      </div>

      {greeting && <p>{greeting}</p>}

      <div className="info">
        <h2>Status</h2>
        <p>✅ Tauri + React initialized</p>
        <p>⏳ Chat interface - coming in T1</p>
        <p>⏳ Agent sidebar - coming in T1</p>
        <p>⏳ Approval cards - coming in T3</p>
      </div>
    </div>
  );
}

export default App;
