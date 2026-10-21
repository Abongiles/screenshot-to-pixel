import { ShieldAlert } from "lucide-react";

export function PageHeader({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="rounded-xl bg-primary-soft p-2.5 text-primary">{icon}</div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function ResponsibleAiNotice({ compact = false }: { compact?: boolean }) {
  return (
    <aside className="flex gap-3 rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm text-foreground">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
      <div>
        <p className="font-semibold">Responsible AI notice</p>
        <p className="text-muted-foreground">
          AI output may contain errors.{compact ? " " : <br />}Do not enter sensitive or confidential workplace information without authorisation.
          {compact ? " " : <br />}Always have a human review important decisions and generated content.
        </p>
      </div>
    </aside>
  );
}
