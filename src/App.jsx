import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import useWebRTC from './webrtc'

import React, { useState, useEffect, useRef } from 'react';
// Assume other imports are here

function App() {
  const [count, setCount] = useState(0);

  const { video } = useWebRTC();

  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
        <video ref={video} autoPlay playsInline muted></video> {/* Use the ref here */}
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}
export default App
