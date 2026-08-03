import { useEffect, useState } from "react";

type HealthStatus = "loading" | "ok" | "error";

const API_BASE_URL = "http://localhost:8000";

function App() {
  const [status, setStatus] = useState<HealthStatus>("loading");

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
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-slate-900">
      <h1 className="text-3xl font-semibold">SignBridge AI</h1>
      <StatusBadge status={status} />
    </main>
  );
}

function StatusBadge({ status }: { status: HealthStatus }) {
  const styles: Record<HealthStatus, string> = {
    loading: "bg-slate-200 text-slate-600",
    ok: "bg-emerald-100 text-emerald-700",
    error: "bg-red-100 text-red-700",
  };
  const labels: Record<HealthStatus, string> = {
    loading: "Checking API...",
    ok: "API status: ok",
    error: "API unreachable",
  };

  return (
    <span className={`rounded-full px-4 py-1 text-sm font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default App;