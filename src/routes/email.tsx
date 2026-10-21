import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AiOutput } from "@/components/workmate/ai-output";
import { PageHeader, ResponsibleAiNotice } from "@/components/workmate/page-header";
import { useAi } from "@/lib/use-ai";
import { logActivity } from "@/lib/store";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — WorkMate AI" },
      { name: "description", content: "Generate professional emails in a formal, friendly, persuasive or concise tone." },
      { property: "og:title", content: "Smart Email Generator — WorkMate AI" },
      { property: "og:description", content: "Write complete professional emails in seconds with AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmailPage,
});

const TONES = ["Formal", "Friendly", "Persuasive", "Concise"] as const;

function EmailPage() {
  const [f, setF] = useState({ recipient: "", subject: "", purpose: "", points: "" });
  const [tone, setTone] = useState<string>("Formal");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const ai = useAi("email");

  const generate = async () => {
    const e: Record<string, string> = {};
    if (!f.recipient.trim()) e["recipient"] = "Recipient is required.";
    if (!f.purpose.trim()) e["purpose"] = "Describe the purpose of the email.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const prompt = `Recipient: ${f.recipient}\nSubject: ${f.subject || "(suggest one)"}\nPurpose: ${f.purpose}\nKey points:\n${f.points || "(none provided)"}\nTone: ${tone}`;
    const res = await ai.run([{ role: "user", content: prompt }]);
    if (res) logActivity("email", `Drafted an email to ${f.recipient}`);
  };

  const field = (k: keyof typeof f, label: string, el: React.ReactNode) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      {el}
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <div>
      <PageHeader title="Smart Email Generator" description="Turn a few notes into a polished, ready-to-send email." icon={<Mail className="h-5 w-5" />} />
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-xl border bg-card p-5 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            generate();
          }}
        >
          {field("recipient", "Recipient *", <Input id="recipient" placeholder="e.g. Sarah, Head of Finance" value={f.recipient} onChange={(e) => setF({ ...f, recipient: e.target.value })} />)}
          {field("subject", "Subject", <Input id="subject" placeholder="Optional — AI can suggest one" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />)}
          {field("purpose", "Purpose *", <Input id="purpose" placeholder="e.g. Request approval for Q4 budget" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} />)}
          {field("points", "Key points", <Textarea id="points" rows={5} placeholder="One point per line" value={f.points} onChange={(e) => setF({ ...f, points: e.target.value })} />)}
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <ToggleGroup type="single" value={tone} onValueChange={(v) => v && setTone(v)} variant="outline" className="flex-wrap justify-start">
              {TONES.map((t) => (
                <ToggleGroupItem key={t} value={t} className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t}</ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <Button type="submit" className="w-full" disabled={ai.loading}>
            <Sparkle className="h-4 w-4" /> {ai.loading ? "Generating…" : "Generate email"}
          </Button>
        </form>
        <AiOutput title="Your email" {...ai} onRegenerate={generate} onStop={ai.stop} emptyIcon={<Mail className="h-6 w-6" />} emptyText="Fill in the details and click Generate. Your email will appear here, ready to edit and copy." />
      </div>
      <div className="mt-6"><ResponsibleAiNotice compact /></div>
    </div>
  );
}
