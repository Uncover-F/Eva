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
import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { useEffect, useRef, useState, memo } from "react";
import vegaEmbed from "vega-embed";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { ToolCall } from "../../multimodal-live-types";
import "./Altair.scss";

const declaration: FunctionDeclaration = {
  name: "render_altair",
  description: "Displays an altair graph in json format.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      json_graph: {
        type: SchemaType.STRING,
        description:
          "JSON STRING representation of the graph to render. Must be a string, not a json object",
      },
    },
    required: ["json_graph"],
  },
};

function AltairComponent() {
  const [jsonString, setJSONString] = useState<string>("");
  const [returnedText, setReturnedText] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const { client, setConfig, connected } = useLiveAPIContext();


  useEffect(() => {
    setConfig({
      model: "models/gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: "audio",
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Kore",
            },
          },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: 'You are Eva, a helpful desktop assistant. You act human and show emotion. You do not constantly resay or verify what the user is saying. You take action.',
          },
        ],
      },
      tools: [
        { googleSearch: {} },
        { functionDeclarations: [declaration] },
      ],
    });
  }, [setConfig]);

  useEffect(() => {
    const onToolCall = (toolCall: ToolCall) => {
      console.log(`got toolcall`, toolCall);
      setReturnedText("");
      const fc = toolCall.functionCalls.find(
        (fc) => fc.name === declaration.name,
      );
      if (fc) {
        const str = (fc.args as any).json_graph;
        setJSONString(str);
      }
      if (toolCall.functionCalls.length) {
        setTimeout(
          () =>
            client.sendToolResponse({
              functionResponses: toolCall.functionCalls.map((fc) => ({
                response: { output: { sucess: true } },
                id: fc.id,
              })),
            }),
          200,
        );
      }
    };
    client.on("toolcall", onToolCall);

    let lastModelTurnIndex: number | null = null;
    const onContent = (content: any) => {
      if (content && content.modelTurn && content.modelTurn.parts) {
        if (lastModelTurnIndex !== content.modelTurn.index) {
          lastModelTurnIndex = content.modelTurn.index;
          setReturnedText("");
        }
        const textParts = content.modelTurn.parts
          .filter((part: any) => part.text)
          .map((part: any) => part.text)
          .join(" ");
        setReturnedText((prevText) => (prevText ? prevText + " " + textParts : textParts));
      }
    };
    client.on("content", onContent);

    return () => {
      client.off("toolcall", onToolCall);
      client.off("content", onContent);
    };
  }, [client]);

  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embedRef.current && jsonString) {
      vegaEmbed(embedRef.current, JSON.parse(jsonString));
    }
  }, [embedRef, jsonString]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!connected) return;
    if (inputText.trim() === "") return;
    setReturnedText("");
    setJSONString("");
    client.send([{ text: inputText }]);
    setInputText("");
  };

  const handleClear = () => {
    setReturnedText("");
    setJSONString("");
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="altair-input-form">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type your input here..."
          className="altair-input"
          disabled={!connected}
        />
        <button type="submit" className="altair-submit-btn" disabled={!connected}>
          Send
        </button>
        <button type="button" className="altair-clear-btn" onClick={handleClear}>
          Clear
        </button>
      </form>
      <div className="vega-embed" ref={embedRef} />
      {returnedText && (
        <div className="returned-text">
          <h3>Returned Text:</h3>
          <p>{returnedText}</p>
        </div>
      )}
    </>
  );
}

export const Altair = memo(AltairComponent);
