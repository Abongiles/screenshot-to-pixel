import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BrainCircuit, Copy, Loader2, MessagesSquare, RotateCcw, SendHorizonal, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBanner, Markdown, copyText } from "@/components/workmate/ai-output";
import { PageHeader } from "@/components/workmate/page-header";
import { useAi, type ChatMsg } from "@/lib/use-ai";
import { logActivity, usePersistent } from "@/lib/store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Workplace AI Chat — WorkMate AI" },
      { name: "description", content: "Ask workplace questions about writing, planning, summarising and research." },
      { property: "og:title", content: "Workplace AI Chat — WorkMate AI" },
      { property: "og:description", content: "Your AI assistant for everyday workplace questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  { label: "Writing", text: "Help me write a polite follow-up to a client who hasn't replied in a week." },
  { label: "Planning", text: "How should I plan a week with three deadlines and back-to-back meetings?" },
  { label: "Summarizing", text: "What's the best structure for summarising a long report for my manager?" },
  { label: "Research", text: "What questions should I ask when researching a new software vendor?" },
];

function ChatPage() {
  const [messages, setMessages] = usePersistent<ChatMsg[]>("chat", []);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<ChatMsg[] | null>(null);
  const ai = useAi("chat");
  const bottom = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const shown = pending ?? messages;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [shown.length, ai.output]);
  useEffect(() => {
    if (!ai.loading) box.current?.focus();
  }, [ai.loading]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || ai.loading) return;
    const next: ChatMsg[] = [...messages, { role: "user", content: t }];
    setInput("");
    setPending(next);
    const res = await ai.run(next);
    setPending(null);
    if (res) {
      setMessages([...next, { role: "assistant", content: res }]);
      logActivity("chat", `Asked AI: ${t.slice(0, 50)}`);
    } else {
      setInput(t);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex items-start justify-between">
        <PageHeader title="Workplace AI Chat" description="Ask anything about writing, planning, summarising or research." icon={<MessagesSquare className="h-5 w-5" />} />
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setMessages([])}><RotateCcw className="h-4 w-4" /> New chat</Button>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border bg-card shadow-card">
        <div className="flex-1 space-y-5 overflow-y-auto p-5" aria-live="polite">
          {shown.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-primary-soft p-4 text-primary"><BrainCircuit className="h-7 w-7" /></div>
              <p className="text-sm text-muted-foreground">Start with a suggestion or type your own question.</p>
              <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s.label} onClick={() => send(s.text)} className="rounded-lg border p-3 text-left text-sm hover:border-primary hover:bg-accent">
                    <span className="text-xs font-semibold text-primary">{s.label}</span>
                    <p className="mt-1 text-foreground">{s.text}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          {shown.map((m, i) => (m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.content}</p>
            </div>
          ) : (
            <AssistantMsg key={i} text={m.content} />
          )))}
          {ai.loading && (ai.output ? <AssistantMsg text={ai.output} /> : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> WorkMate AI is typing…</div>
          ))}
          {ai.error && <ErrorBanner message={ai.error} />}
          <div ref={bottom} />
        </div>
        <form
          className="flex items-end gap-2 border-t p-3"
          onSubmit={(e) => { e.preventDefault(); send(input); }}
        >
          <Textarea
            ref={box}
            autoFocus
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Ask a workplace question… (Shift+Enter for new line)"
            aria-label="Message"
            className="max-h-40 min-h-11 resize-none"
          />
          {ai.loading ? (
            <Button type="button" size="icon" variant="secondary" onClick={ai.stop} aria-label="Stop"><Square className="h-4 w-4" /></Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send"><SendHorizonal className="h-4 w-4" /></Button>
          )}
        </form>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">AI can make mistakes. Don't share confidential information without authorisation, and review important answers.</p>
    </div>
  );
}

function AssistantMsg({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 shrink-0 rounded-lg bg-primary-soft p-1.5 text-primary"><BrainCircuit className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1">
        <Markdown>{text}</Markdown>
        <Button variant="ghost" size="sm" className="mt-1 h-7 px-2 text-xs text-muted-foreground" onClick={() => copyText(text)}><Copy className="h-3 w-3" /> Copy</Button>
      </div>
    </div>
  );
}
