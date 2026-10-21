import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AiOutput } from "@/components/workmate/ai-output";
import { PageHeader, ResponsibleAiNotice } from "@/components/workmate/page-header";
import { useAi } from "@/lib/use-ai";
import { logActivity } from "@/lib/store";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — WorkMate AI" },
      { name: "description", content: "Summaries, insights, limitations and recommendations from questions or articles." },
      { property: "og:title", content: "AI Research Assistant — WorkMate AI" },
      { property: "og:description", content: "Structured research analysis that separates source facts from AI interpretation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const [question, setQuestion] = useState("");
  const [source, setSource] = useState("");
  const [err, setErr] = useState("");
  const ai = useAi("research");

  const generate = async () => {
    if (!question.trim() && source.trim().length < 50) return setErr("Enter a research question, or paste an article (50+ characters).");
    setErr("");
    const content = `Research question: ${question || "(none — analyse the supplied text)"}\n\nSupplied source text:\n${source.trim() ? `"""\n${source}\n"""` : "(none supplied)"}`;
    const res = await ai.run([{ role: "user", content }]);
    if (res) logActivity("research", `Researched: ${(question || "pasted article").slice(0, 60)}`);
  };

  return (
    <div>
      <PageHeader title="AI Research Assistant" description="Structured analysis that labels what came from your source versus AI interpretation." icon={<Search className="h-5 w-5" />} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border bg-card p-5 shadow-card">
          <div className="space-y-1.5">
            <Label htmlFor="q">Research question</Label>
            <Input id="q" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. What are the benefits of hybrid work for small teams?" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="src">Article or source text (optional)</Label>
            <Textarea id="src" rows={12} value={source} onChange={(e) => setSource(e.target.value)} placeholder="Paste an article, report or document excerpt…" />
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <Button className="w-full" onClick={generate} disabled={ai.loading}>
            <Sparkle className="h-4 w-4" /> {ai.loading ? "Analysing…" : "Analyse"}
          </Button>
          <p className="text-xs text-muted-foreground">Look for <strong>[From source]</strong> and <strong>[AI interpretation]</strong> labels in the result. WorkMate AI does not browse the web and will not invent citations.</p>
        </div>
        <AiOutput title="Research brief" {...ai} onRegenerate={generate} onStop={ai.stop} emptyIcon={<Search className="h-6 w-6" />} emptyText="Your structured summary, key insights, limitations and recommendations will appear here." />
      </div>
      <div className="mt-6"><ResponsibleAiNotice compact /></div>
    </div>
  );
}
