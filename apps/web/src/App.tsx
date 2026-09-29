import { useEffect, useState } from "react";
import "./App.css";

type HealthStatus = "loading" | "ok" | "error";

const API_BASE_URL = "http://localhost:8000";

function App() {
  const [status, setStatus] = useState<HealthStatus>("loading");
  const [mode, setMode] = useState<"alphabet" | "words">("alphabet");
  const [sentence, setSentence] = useState("HELLO");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((res) => {
        if (!res.ok) throw new Error(`Unexpected status ${res.status}`);
        return res.json();
      })
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">S</span><span>SignBridge</span></div>
        <div className="status"><span className={`status-dot ${status === "error" ? "status-error" : ""}`} /> {status === "ok" ? "System ready" : status === "loading" ? "Connecting" : "API offline"}</div>
      </header>

      <section className="hero">
        <div className="eyebrow">LIVE TRANSLATION</div>
        <h1>Sign language,<br /><em>made understood.</em></h1>
        <p>Turn hand signs into letters, words, and meaningful communication in real time.</p>
      </section>

      <section className="workspace">
        <div className="camera-panel">
          <div className="panel-top"><span>CAMERA</span><span className={running ? "live live-on" : "live"}>{running ? "● LIVE" : "READY"}</span></div>
          <div className="camera-frame">
            <div className="corner tl" /><div className="corner tr" /><div className="corner bl" /><div className="corner br" />
            <div className="hand-placeholder">✋</div>
            <div className="camera-message">Camera preview</div>
          </div>
          <button className="primary-button" onClick={() => setRunning(!running)}>{running ? "Stop camera" : "Start camera"}</button>
        </div>

        <div className="translation-panel">
          <div className="mode-switch">
            <button className={mode === "alphabet" ? "active" : ""} onClick={() => setMode("alphabet")}>Alphabet</button>
            <button className={mode === "words" ? "active" : ""} onClick={() => setMode("words")}>Words</button>
          </div>

          <div className="prediction">
            <span className="label">CURRENT {mode === "alphabet" ? "SIGN" : "WORD"}</span>
            <div className="letter">{mode === "alphabet" ? "A" : "HELLO"}</div>
            <div className="confidence"><span>Confidence</span><strong>99.9%</strong></div>
            <div className="confidence-bar"><span /></div>
          </div>

          <div className="translation">
            <span className="label">TRANSLATION</span>
            <div className="sentence">{sentence || "Start signing..."}</div>
            <div className="controls">
              <button onClick={() => setSentence(sentence + " ")}>Space</button>
              <button onClick={() => setSentence(sentence.slice(0, -1))}>Delete</button>
              <button onClick={() => setSentence("")}>Clear</button>
            </div>
          </div>
        </div>
      </section>

      <footer><span>Stage 1 · ASL recognition</span><span>MediaPipe · ML inference</span></footer>
    </main>
  );
}

export default App;
