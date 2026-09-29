import { useEffect, useState } from "react";
import "./App.css";

type HealthStatus = "loading" | "ok" | "error";
const API_BASE_URL = "http://localhost:8000";

function App() {
  const [status, setStatus] = useState<HealthStatus>("loading");
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
  }, []);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessage("");
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">S</span><span>SignBridge</span></div>
        <div className="call-state">
          <span className={`status-dot ${status === "error" ? "status-error" : ""}`} />
          {connected ? "Call connected" : status === "ok" ? "System ready" : status === "loading" ? "Connecting" : "API offline"}
        </div>
      </header>

      <section className="intro">
        <div>
          <span className="eyebrow">PRIVATE COMMUNICATION</span>
          <h1>Talk naturally.<br /><em>Understand each other.</em></h1>
        </div>
        <p>SignBridge helps two people communicate across sign language and speech in one simple conversation.</p>
      </section>

      <section className="call-card">
        <div className="call-header">
          <div>
            <span className="eyebrow">SIGNBRIDGE CALL</span>
            <strong>{connected ? "Conversation in progress" : "Ready to connect"}</strong>
          </div>
          <span className="secure"><span /> Private</span>
        </div>

        <div className="video-grid">
          <div className="video-tile signer-tile">
            <div className="video-label"><span>YOU</span><small>Signing</small></div>
            <div className="avatar-hand">✋</div>
            <div className="video-caption">Camera preview</div>
          </div>
          <div className="video-tile person-tile">
            <div className="video-label"><span>OTHER PERSON</span><small>Speaking</small></div>
            <div className="avatar">R</div>
            <div className="video-caption">Camera preview</div>
          </div>
        </div>

        <div className="translation-strip">
          <div className="translation-title"><span className="pulse" /> SIGNBRIDGE TRANSLATION</div>
          <div className="translation-content">
            <span className="translation-icon">✋</span>
            <div>
              <small>YOU</small>
              <strong>“Hello, how are you?”</strong>
            </div>
            <span className="translation-arrow">→</span>
            <div className="translated-response">
              <small>TRANSLATED</small>
              <strong>Hello, how are you?</strong>
            </div>
          </div>
        </div>

        <div className="conversation">
          <div className="section-heading"><span>CONVERSATION</span><small>Live transcript</small></div>
          <div className="messages">
            <div className="message theirs"><span className="message-name">OTHER PERSON</span><p>How are you doing today?</p><time>10:42 AM</time></div>
            <div className="message yours"><span className="message-name">YOU · TRANSLATED</span><p>I'm doing well. How about you?</p><time>10:43 AM</time></div>
          </div>
          <div className="composer">
            <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type a message to communicate..." />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>

        <div className="call-controls">
          <button className="control" onClick={() => setConnected(!connected)}><span>◉</span>{connected ? "Connected" : "Connect"}</button>
          <button className="control"><span>♩</span> Microphone</button>
          <button className="control"><span>▣</span> Camera</button>
          <button className="control captions"><span>CC</span> Captions</button>
          <button className="end-call" onClick={() => setConnected(false)}>End call</button>
        </div>
      </section>

      <footer><span>SignBridge AI · Accessible communication</span><span>MediaPipe · ML inference · WLASL</span></footer>
    </main>
  );
}

export default App;
