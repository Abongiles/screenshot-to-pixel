import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { NotebookPen, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiOutput } from "@/components/workmate/ai-output";
import { PageHeader, ResponsibleAiNotice } from "@/components/workmate/page-header";
import { useAi } from "@/lib/use-ai";
import { logActivity } from "@/lib/store";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — WorkMate AI" },
      { name: "description", content: "Turn raw meeting notes into summaries, decisions and action items." },
      { property: "og:title", content: "Meeting Notes Summarizer — WorkMate AI" },
      { property: "og:description", content: "Executive summaries, decisions and action items from your notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeetingsPage,
});

const SAMPLE = `Weekly product sync — 14 Oct
Attendees: Thabo, Lerato, James
- Discussed delays in mobile app release; QA found 3 blocking bugs
- Lerato will fix the login bug by Friday
- Agreed to move launch to 2 November
- Need someone to update the marketing timeline
- James to share customer feedback summary next week`;

function MeetingsPage() {
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");
  const ai = useAi("meeting");

  const generate = async () => {
    if (notes.trim().length < 30) return setErr("Please paste at least a few lines of meeting notes (30+ characters).");
    setErr("");
    const res = await ai.run([{ role: "user", content: `Meeting notes:\n"""\n${notes}\n"""` }]);
    if (res) logActivity("meeting", "Summarized meeting notes");
  };

  return (
    <div>
      <PageHeader title="Meeting Notes Summarizer" description="Get a summary, decisions and action items — without invented owners or dates." icon={<NotebookPen className="h-5 w-5" />} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <label htmlFor="notes" className="text-sm font-medium">Meeting notes</label>
            <Button variant="link" size="sm" onClick={() => setNotes(SAMPLE)}>Use demo notes</Button>
          </div>
          <Textarea id="notes" rows={16} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste your meeting notes or transcript here…" />
          <div className="flex justify-between text-xs text-muted-foreground"><span>{err && <span className="text-destructive">{err}</span>}</span><span>{notes.length} chars</span></div>
          <Button className="w-full" onClick={generate} disabled={ai.loading}>
            <Sparkle className="h-4 w-4" /> {ai.loading ? "Summarizing…" : "Summarize notes"}
          </Button>
        </div>
        <AiOutput title="Summary" {...ai} onRegenerate={generate} onStop={ai.stop} emptyIcon={<NotebookPen className="h-6 w-6" />} emptyText="Your executive summary, discussion points, decisions and action items will appear here." />
      </div>
      <div className="mt-6"><ResponsibleAiNotice compact /></div>
    </div>
  );
}
