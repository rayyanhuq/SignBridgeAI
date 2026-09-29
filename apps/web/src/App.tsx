import { useEffect, useState } from "react";
import "./App.css";

type HealthStatus = "loading" | "ok" | "error";
const API_BASE_URL = "http://localhost:8000";

function App() {
  const [status, setStatus] = useState<HealthStatus>("loading");
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(true);

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

      <section className="intro compact-intro">
        <div>
          <span className="eyebrow">PRIVATE COMMUNICATION</span>
          <h1>Talk naturally.<br /><em>Understand each other.</em></h1>
        </div>
        <p>One call. Two ways to communicate. SignBridge translates between signing and speech so both people can follow the conversation.</p>
      </section>

      <section className="call-card">
        <div className="call-header">
          <div>
            <span className="eyebrow">SIGNBRIDGE CALL</span>
            <strong>{connected ? "Conversation in progress" : "Ready to connect"}</strong>
          </div>
          <span className="secure"><span /> Private call</span>
        </div>

        <div className="participant-grid">
          <section className="participant signer-section">
            <div className="participant-heading">
              <div><span className="role-tag signer-tag">SIGNER</span><h2>Deaf / signing participant</h2></div>
              <span className="feature-note">Camera + sign recognition</span>
            </div>

            <div className={`video-tile signer-tile ${cameraOn ? "" : "camera-off"}`}>
              <div className="video-label"><span>YOU</span><small>{cameraOn ? "Camera on" : "Camera off"}</small></div>
              {cameraOn ? <div className="avatar-hand">✋</div> : <div className="camera-off-label">Camera is off</div>}
              <div className="video-caption">Your signing area</div>
            </div>

            <div className="recognition-card">
              <div className="recognition-top"><span className="eyebrow">SIGNBRIDGE RECOGNITION</span><span className="detecting"><span /> Detecting</span></div>
              <div className="recognized-row"><div><small>DETECTED SIGN</small><strong>Hello</strong></div><div className="confidence"><small>CONFIDENCE</small><strong>96.4%</strong></div></div>
              <div className="confidence-bar"><span /></div>
              <p>Your sign is translated into text for the other participant.</p>
            </div>

            <div className="participant-actions">
              <button className={`action-button ${cameraOn ? "selected" : ""}`} onClick={() => setCameraOn(!cameraOn)}><span>▣</span>{cameraOn ? "Camera on" : "Camera off"}</button>
              <button className="action-button selected"><span>✋</span> Sign detection on</button>
            </div>
          </section>

          <section className="participant hearing-section">
            <div className="participant-heading">
              <div><span className="role-tag hearing-tag">HEARING PARTICIPANT</span><h2>Speech / listening participant</h2></div>
              <span className="feature-note">Microphone + captions</span>
            </div>

            <div className="video-tile person-tile">
              <div className="video-label"><span>OTHER PERSON</span><small>Camera on</small></div>
              <div className="avatar">R</div>
              <div className="video-caption">Other participant</div>
            </div>

            <div className="speech-card">
              <div className="speech-top"><span className="eyebrow">LIVE SPEECH</span><span className="listening"><span /> Listening</span></div>
              <div className="speech-text">“How are you doing today?”</div>
              {captionsOn && <p>Live captions are shown here so the conversation remains easy to follow.</p>}
            </div>

            <div className="participant-actions">
              <button className={`action-button ${micOn ? "selected" : ""}`} onClick={() => setMicOn(!micOn)}><span>♩</span>{micOn ? "Microphone on" : "Microphone off"}</button>
              <button className={`action-button ${captionsOn ? "selected" : ""}`} onClick={() => setCaptionsOn(!captionsOn)}><span>CC</span>{captionsOn ? "Captions on" : "Captions off"}</button>
            </div>
          </section>
        </div>

        <section className="conversation">
          <div className="section-heading"><div><span>CONVERSATION</span><small>Everything translated into one shared view</small></div><span className="live-transcript"><span /> Live transcript</span></div>
          <div className="messages">
            <div className="message theirs"><span className="message-name">OTHER PERSON · SPEECH</span><p>How are you doing today?</p><time>10:42 AM</time></div>
            <div className="message yours"><span className="message-name">YOU · SIGN TRANSLATED</span><p>I'm doing well. How about you?</p><time>10:43 AM</time></div>
          </div>
          <div className="composer">
            <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type a message if you'd rather not speak or sign..." />
            <button onClick={sendMessage}>Send</button>
          </div>
        </section>

        <div className="call-controls">
          <button className="control connect-control" onClick={() => setConnected(!connected)}><span>◉</span>{connected ? "Connected" : "Connect call"}</button>
          <button className={`control ${micOn ? "active-control" : ""}`} onClick={() => setMicOn(!micOn)}><span>♩</span> {micOn ? "Mute" : "Unmute"}</button>
          <button className={`control ${cameraOn ? "active-control" : ""}`} onClick={() => setCameraOn(!cameraOn)}><span>▣</span> {cameraOn ? "Camera" : "Camera off"}</button>
          <button className={`control ${captionsOn ? "active-control" : ""}`} onClick={() => setCaptionsOn(!captionsOn)}><span>CC</span> {captionsOn ? "Captions" : "Captions off"}</button>
          <button className="end-call" onClick={() => setConnected(false)}>End call</button>
        </div>
      </section>

      <footer><span>SignBridge AI · Accessible communication</span><span>MediaPipe · ML inference · WLASL</span></footer>
    </main>
  );
}

export default App;
