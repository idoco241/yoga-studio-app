import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'system-ui' }}>
    <div style={{ textAlign: 'center', color: '#6B7563' }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>RS Yoga</div>
      <div style={{ fontSize: 14, color: '#8B8278' }}>Run <code>npx expo start --web</code> for the full app</div>
    </div>
  </div>
);
