import { useCallback, useRef, useState } from "react";
import type { AiFeature } from "./ai/prompts";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

/** Streams a real AI response from the server route. */
export function useAi(feature: AiFeature) {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (messages: ChatMsg[], onChunk?: (text: string) => void): Promise<string | null> => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(null);
      setOutput("");
      let text = "";
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feature, messages }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? `Request failed (${res.status}).`);
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += dec.decode(value, { stream: true });
          setOutput(text);
          onChunk?.(text);
        }
        if (!text.trim()) throw new Error("The AI returned an empty response. Please try again.");
        return text;
      } catch (e) {
        if ((e as Error).name === "AbortError") return text || null;
        setError((e as Error).message || "Something went wrong.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [feature],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);
  return { output, setOutput, loading, error, run, stop };
}
