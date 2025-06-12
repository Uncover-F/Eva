/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useRef, useState, useEffect } from "react";
import "./App.scss";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import { Altair } from "./components/altair/Altair";
import ControlTray from "./components/control-tray/ControlTray";
import cn from "classnames";

const API_KEY_ENV = process.env.REACT_APP_GEMINI_API_KEY as string;

function getStoredApiKey() {
  return "";
}

function setStoredApiKey(key: string) {
  // No-op: no longer using localStorage
}

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  // Only use .env key by default, override if user sets a custom key in this session
  const [apiKey, setApiKey] = useState<string>(API_KEY_ENV || "");
  const [showApiInput, setShowApiInput] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setApiKey(API_KEY_ENV || "");
  }, []);

  const handleApiKeySave = () => {
    if (!inputValue.trim()) {
      setApiKey(API_KEY_ENV || "");
    } else {
      setApiKey(inputValue);
    }
    setShowApiInput(false);
    setInputValue("");
  };

  return (
    <div className="App">
      <LiveAPIProvider url={uri} apiKey={apiKey}>
        <div className="streaming-console">
          <button
            className="btn"
            style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}
            onClick={() => setShowApiInput((v) => !v)}
          >
            {showApiInput ? "Close API Key Input" : "Set API Key"}
          </button>
          {showApiInput && (
            <div className="api-key-modal">
              <label htmlFor="api-key-input">Custom API Key</label>
              <div className="api-key-input-row">
                <input
                  id="api-key-input"
                  className="api-key-input"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter your API key"
                  autoFocus
                />
                <button className="btn" onClick={handleApiKeySave}>Save</button>
              </div>
            </div>
          )}
          <main>
            <div className="main-app-area">
              {/* APP goes here */}
              <Altair />
              <video
                className={cn("stream", {
                  hidden: !videoRef.current || !videoStream,
                })}
                ref={videoRef}
                autoPlay
                playsInline
              />
            </div>
            <ControlTray
              videoRef={videoRef}
              supportsVideo={true}
              onVideoStreamChange={setVideoStream}
            >
              {/* put your own buttons here */}
            </ControlTray>
          </main>
        </div>
      </LiveAPIProvider>
    </div>
  );
}

export default App;
