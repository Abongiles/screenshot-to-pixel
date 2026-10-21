import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Check, Copy, Pencil, RefreshCw, Eye, Loader2, AlertCircle, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Could not copy — please select and copy manually.");
  }
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-ai text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-danger-soft p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

interface Props {
  title: string;
  output: string;
  setOutput: (v: string) => void;
  loading: boolean;
  error: string | null;
  onRegenerate?: () => void;
  onStop?: () => void;
  emptyText: string;
  emptyIcon: React.ReactNode;
}

export function AiOutput({ title, output, setOutput, loading, error, onRegenerate, onStop, emptyText, emptyIcon }: Props) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <section className="flex min-h-[420px] flex-col rounded-xl border bg-card shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
        <h2 className="flex items-center gap-2 font-semibold">
          {title}
          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" aria-label="Generating" />}
        </h2>
        <div className="flex gap-1">
          {loading && onStop && (
            <Button size="sm" variant="ghost" onClick={onStop}>
              <Square className="h-4 w-4" /> Stop
            </Button>
          )}
          {output && !loading && (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing((e) => !e)}>
                {editing ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                {editing ? "Preview" : "Edit"}
              </Button>
              {onRegenerate && (
                <Button size="sm" variant="ghost" onClick={onRegenerate}>
                  <RefreshCw className="h-4 w-4" /> Regenerate
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await copyText(output);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy
              </Button>
            </>
          )}
        </div>
      </header>
      <div className="flex-1 p-5">
        {error && <ErrorBanner message={error} />}
        {!output && !loading && !error && (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
            <div className="rounded-full bg-primary-soft p-4 text-primary">{emptyIcon}</div>
            <p className="max-w-xs text-sm">{emptyText}</p>
          </div>
        )}
        {loading && !output && (
          <div className="space-y-3 py-2" aria-live="polite">
            {[90, 75, 85, 60].map((w) => (
              <div key={w} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
            ))}
            <p className="pt-2 text-xs text-muted-foreground">WorkMate AI is thinking…</p>
          </div>
        )}
        {output &&
          (editing ? (
            <Textarea value={output} onChange={(e) => setOutput(e.target.value)} className="min-h-[360px] font-mono text-sm" aria-label="Edit generated output" />
          ) : (
            <Markdown>{output}</Markdown>
          ))}
      </div>
      {output && !loading && (
        <p className="border-t px-5 py-2 text-xs text-muted-foreground">AI-generated — review before using.</p>
      )}
    </section>
  );
}
