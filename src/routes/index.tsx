import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, Mail, NotebookPen, Search, MessagesSquare, ListChecks, ArrowRight, Inbox } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ResponsibleAiNotice } from "@/components/workmate/page-header";
import { usePersistent, type Activity, type Profile, type Task } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — WorkMate AI" },
      { name: "description", content: "Your AI workplace productivity dashboard: tasks, activity and quick tools." },
      { property: "og:title", content: "WorkMate AI — Workplace Productivity Assistant" },
      { property: "og:description", content: "Emails, meeting summaries, task plans and research powered by AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const ICONS = { email: Mail, meeting: NotebookPen, planner: ListChecks, research: Search, chat: MessagesSquare, task: CheckCircle2 };

const TOOLS = [
  { to: "/email", title: "Write an email", icon: Mail },
  { to: "/meetings", title: "Summarize a meeting", icon: NotebookPen },
  { to: "/tasks", title: "Plan my day", icon: ListChecks },
  { to: "/research", title: "Research a topic", icon: Search },
] as const;

function Dashboard() {
  const [profile] = usePersistent<Profile>("profile", { name: "Team Member", role: "Employee" });
  const [tasks] = usePersistent<Task[]>("tasks", []);
  const [activity] = usePersistent<Activity[]>("activity", []);
  const [stats] = usePersistent<Record<string, number>>("stats", {});
  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const upcoming = tasks
    .filter((t) => !t.done)
    .sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"))
    .slice(0, 5);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const cards = [
    { label: "Tasks completed", value: `${done}/${tasks.length}`, icon: CheckCircle2 },
    { label: "Emails drafted", value: stats["email"] ?? 0, icon: Mail },
    { label: "Meetings summarized", value: stats["meeting"] ?? 0, icon: NotebookPen },
    { label: "Research & chats", value: (stats["research"] ?? 0) + (stats["chat"] ?? 0), icon: Search },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-hero p-6 text-primary-foreground shadow-card md:p-8">
        <p className="text-sm opacity-80">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">{greet}, {profile.name.split(" ")[0]}</h1>
        <p className="mt-2 max-w-xl text-sm opacity-90">Draft emails, summarise meetings, plan your work and research faster — all in one place.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {TOOLS.map((t) => (
            <Link key={t.to} to={t.to} className="inline-flex items-center gap-2 rounded-lg bg-primary-foreground/15 px-3 py-2 text-sm font-medium hover:bg-primary-foreground/25">
              <t.icon className="h-4 w-4" /> {t.title}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-card p-4 shadow-card">
            <c.icon className="h-5 w-5 text-primary" />
            <p className="mt-3 text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-xl border bg-card p-5 shadow-card lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Upcoming tasks</h2>
            <Link to="/tasks" className="flex items-center gap-1 text-sm text-primary hover:underline">Open planner <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{pct}%</span></div>
            <Progress value={pct} aria-label="Task progress" />
          </div>
          {upcoming.length === 0 ? (
            <Empty text={tasks.length ? "All tasks complete — great work!" : "No tasks yet. Add some in the Task Planner."} />
          ) : (
            <ul className="divide-y">
              {upcoming.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-3 text-sm">
                  <PriorityDot p={t.priority} />
                  <span className="flex-1 font-medium">{t.title}</span>
                  {t.demo && <Badge variant="outline">Demo</Badge>}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{t.deadline || "No deadline"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-card lg:col-span-2">
          <h2 className="mb-4 font-semibold">Recent activity</h2>
          {activity.length === 0 ? (
            <Empty text="Your activity will appear here as you use WorkMate AI." />
          ) : (
            <ul className="space-y-3">
              {activity.slice(0, 7).map((a) => {
                const Icon = ICONS[a.type];
                return (
                  <li key={a.id} className="flex gap-3 text-sm">
                    <span className="rounded-lg bg-primary-soft p-1.5 text-primary"><Icon className="h-4 w-4" /></span>
                    <div>
                      <p>{a.text}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString()}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
      <ResponsibleAiNotice />
    </div>
  );
}

export function PriorityDot({ p }: { p: Task["priority"] }) {
  const cls = p === "High" ? "bg-destructive" : p === "Medium" ? "bg-warning" : "bg-success";
  return <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cls}`} aria-label={`${p} priority`} />;
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
      <Inbox className="h-8 w-8 opacity-50" />
      {text}
    </div>
  );
}
