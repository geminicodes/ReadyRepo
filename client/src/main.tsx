import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

function renderFatal(err: unknown) {
  const root = document.getElementById("root");
  if (!root) return;
  const msg = err instanceof Error ? err.message : String(err);
  root.innerHTML = `
    <div style="min-height: 100vh; display: grid; place-items: center; padding: 24px;">
      <div style="max-width: 720px; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #e5e7eb;">
        <h1 style="font-size: 18px; font-weight: 700; margin: 0 0 8px;">App failed to start</h1>
        <p style="margin: 0 0 12px; opacity: 0.9;">Open DevTools Console for details.</p>
        <pre style="white-space: pre-wrap; background: rgba(255,255,255,0.06); padding: 12px; border-radius: 12px; overflow: auto;">${msg}</pre>
      </div>
    </div>
  `;
}

window.addEventListener("error", (e) => {
  renderFatal((e as ErrorEvent).error ?? (e as ErrorEvent).message);
});
window.addEventListener("unhandledrejection", (e) => {
  renderFatal((e as PromiseRejectionEvent).reason);
});

const el = document.getElementById("root");
if (!el) {
  renderFatal(new Error("Missing #root element"));
} else {
  createRoot(el).render(<App />);
}
