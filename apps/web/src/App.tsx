import { useEffect, useState } from "react";
import "./App.css";

type HealthStatus = "loading" | "ok" | "error";
type UserRole = "signer" | "speaker" | null;

const API_BASE_URL = "http://localhost:8000";

function App() {
  const [status, setStatus] = useState<HealthStatus>("loading");
  const [role, setRole] = useState<UserRole>(null);
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

  const selectRole = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setConnected(false);
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
          <span className="eyebrow">ACCESSIBLE COMMUNICATION</span>
          <h1>Choose how you<br /><em>communicate.</em></h1>
        </div>
        <p>SignBridge adapts the call to you. Choose your role first, then get only the tools you need to communicate naturally.</p>
      </section>

      <section className="role-picker">
        <div className="picker-heading">
          <div><span className="eyebrow">BEFORE THE CALL</span><strong>How will you communicate?</strong></div>
          {role && <button className="change-role" onClick={() => setRole(null)}>Change role</button>}
        </div>
        <div className="role-options">
          <button className={`role-option ${role === "signer" ? "chosen" : ""}`} onClick={() => selectRole("signer")}>
            <span className="role-icon">✋</span>
            <span><small>I AM</small><strong>Signing</strong><em>Use your camera to sign. SignBridge recognizes your signs and translates them for the other person.</em></span>
            <b>→</b>
          </button>
          <button className={`role-option ${role === "speaker" ? "chosen" : ""}`} onClick={() => selectRole("speaker")}>
            <span className="role-icon microphone-icon">♩</span>
            <span><small>I AM</small><strong>Speaking / listening</strong><em>Use your microphone and captions to communicate with the signing participant.</em></span>
            <b>→</b>
          </button>
        </div>
      </section>

      {role ? (
        <section className="call-card">
          <div className="call-header">
            <div>
              <span className="eyebrow">SIGNBRIDGE CALL · {role === "signer" ? "SIGNING MODE" : "SPEECH MODE"}</span>
              <strong>{connected ? "Conversation in progress" : "Ready to connect"}</strong>
            </div>
            <span className="secure"><span /> Private call</span>
          </div>

          <div className="call-layout">
            <section className="main-participant">
              <div className="participant-heading">
                <div><span className={`role-tag ${role === "signer" ? "signer-tag" : "hearing-tag"}`}>{role === "signer" ? "YOUR ROLE · SIGNER" : "YOUR ROLE · SPEAKER"}</span><h2>{role === "signer" ? "Your signing camera" : "Your speech & listening"}</h2></div>
                <span className="feature-note">{role === "signer" ? "Sign recognition" : "Speech + captions"}</span>
              </div>

              <div className={`video-tile main-video ${role === "signer" ? "signer-tile" : "person-tile"} ${!cameraOn ? "camera-off" : ""}`}>
                <div className="video-label"><span>YOU</span><small>{cameraOn ? "Camera on" : "Camera off"}</small></div>
                {cameraOn ? (role === "signer" ? <div className="avatar-hand">✋</div> : <div className="avatar">Y</div>) : <div className="camera-off-label">Camera is off</div>}
                <div className="video-caption">{role === "signer" ? "Keep your hands visible in frame" : "Your camera preview"}</div>
              </div>

              {role === "signer" ? (
                <div className="recognition-card">
                  <div className="recognition-top"><span className="eyebrow">SIGNBRIDGE RECOGNITION</span><span className="detecting"><span /> Detecting</span></div>
                  <div className="recognized-row"><div><small>DETECTED SIGN</small><strong>Hello</strong></div><div className="confidence"><small>CONFIDENCE</small><strong>96.4%</strong></div></div>
                  <div className="confidence-bar"><span /></div>
                  <p>Your sign becomes text for the other participant. Alphabet recognition is the current Stage 1 model; WLASL extends this toward word recognition.</p>
                </div>
              ) : (
                <div className="speech-card">
                  <div className="speech-top"><span className="eyebrow">YOUR LIVE SPEECH</span><span className="listening"><span /> Listening</span></div>
                  <div className="speech-text">“How are you doing today?”</div>
                  {captionsOn && <p>Live captions keep the conversation visible while you speak and listen.</p>}
                </div>
              )}

              <div className="participant-actions">
                <button className={`action-button ${cameraOn ? "selected" : ""}`} onClick={() => setCameraOn(!cameraOn)}><span>▣</span>{cameraOn ? "Camera on" : "Camera off"}</button>
                {role === "signer" ? <button className="action-button selected"><span>✋</span> Sign detection on</button> : <button className={`action-button ${micOn ? "selected" : ""}`} onClick={() => setMicOn(!micOn)}><span>♩</span>{micOn ? "Microphone on" : "Microphone off"}</button>}
              </div>
            </section>

            <aside className="remote-panel">
              <div className="participant-heading">
                <div><span className="role-tag remote-tag">OTHER PARTICIPANT</span><h2>{role === "signer" ? "Speaking / listening" : "Signing"}</h2></div>
              </div>
              <div className="video-tile remote-video">
                <div className="video-label"><span>OTHER PERSON</span><small>Connected</small></div>
                <div className="avatar">R</div>
                <div className="video-caption">Other participant</div>
              </div>
              <div className="remote-info">
                <span>{role === "signer" ? "Speech" : "Sign recognition"}</span>
                <strong>{role === "signer" ? "Their voice appears as captions here." : "Their signs appear as translated text here."}</strong>
              </div>
              <div className="role-help"><span>i</span><p>You are in <strong>{role === "signer" ? "Signing" : "Speaking / listening"} mode</strong>. Switch roles anytime before starting another call.</p></div>
            </aside>
          </div>

          <section className="conversation">
            <div className="section-heading"><div><span>CONVERSATION</span><small>One shared view for both people</small></div><span className="live-transcript"><span /> Live transcript</span></div>
            <div className="messages">
              <div className="message theirs"><span className="message-name">{role === "signer" ? "OTHER PERSON · SPEECH" : "OTHER PERSON · SIGN TRANSLATED"}</span><p>{role === "signer" ? "How are you doing today?" : "I'm doing well. How about you?"}</p><time>10:42 AM</time></div>
              <div className="message yours"><span className="message-name">YOU · {role === "signer" ? "SIGN TRANSLATED" : "SPEECH"}</span><p>{role === "signer" ? "I'm doing well. How about you?" : "How are you doing today?"}</p><time>10:43 AM</time></div>
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
      ) : (
        <div className="empty-state"><span>01</span><p>Select your role above to enter the call interface.</p></div>
      )}

      <footer><span>SignBridge AI · Accessible communication</span><span>MediaPipe · ML inference · WLASL</span></footer>
    </main>
  );
}

export default App;
