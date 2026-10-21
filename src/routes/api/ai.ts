import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";
import { PROMPTS, type AiFeature } from "@/lib/ai/prompts";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
} from "@/lib/ai/run-id.server";

const FEATURES = Object.keys(PROMPTS) as AiFeature[];
const MAX_CHARS = 40000;

function json(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handle(request: Request) {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) return json(503, "AI is not configured: the server is missing its AI key. See README → AI configuration.");

  let body: { feature?: string; messages?: { role: string; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return json(400, "Invalid request body.");
  }
  const feature = body.feature as AiFeature;
  if (!FEATURES.includes(feature)) return json(400, "Unknown feature.");
  const msgs = (body.messages ?? []).filter(
    (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
  );
  if (!msgs.length || !msgs[msgs.length - 1]?.content.trim()) return json(400, "Please provide some input.");
  if (msgs.reduce((n, m) => n + m.content.length, 0) > MAX_CHARS) return json(400, "Input is too long. Please shorten it.");

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  // Peek the first chunk so gateway errors become proper HTTP errors.
  let upstreamError: unknown = null;
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions: PROMPTS[feature],
    messages: msgs.slice(-20) as ModelMessage[],
    abortSignal: request.signal,
    onError: ({ error }) => {
      upstreamError = error;
    },
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const reader = result.textStream[Symbol.asyncIterator]();
  let first: IteratorResult<string>;
  try {
    first = await reader.next();
  } catch (e) {
    upstreamError = e;
    first = { done: true, value: undefined };
  }
  if (upstreamError) {
    const err = upstreamError as { statusCode?: number; message?: string };
    const status = err.statusCode ?? 500;
    const msg =
      status === 429
        ? "AI is busy right now (rate limited). Please wait a moment and try again."
        : status === 402
          ? "AI credits are exhausted for this workspace. Please add credits to continue."
          : status === 403
            ? "AI access was denied for this request."
            : "The AI service failed to respond. Please try again.";
    return json(status, msg);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!first.done && first.value) controller.enqueue(encoder.encode(first.value));
        while (true) {
          const next = await reader.next();
          if (next.done) break;
          controller.enqueue(encoder.encode(next.value));
        }
      } catch {
        controller.enqueue(encoder.encode("\n\n_[The response was interrupted.]_"));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export const Route = createFileRoute("/api/ai")({
  server: { handlers: { POST: ({ request }) => handle(request) } },
});
