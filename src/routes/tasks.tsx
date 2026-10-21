import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, ListChecks, Pencil, Plus, Sparkle, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiOutput } from "@/components/workmate/ai-output";
import { PageHeader, ResponsibleAiNotice } from "@/components/workmate/page-header";
import { useAi } from "@/lib/use-ai";
import { logActivity, uid, usePersistent, type Priority, type Task } from "@/lib/store";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — WorkMate AI" },
      { name: "description", content: "Add tasks with priorities and durations and get an AI-generated schedule." },
      { property: "og:title", content: "AI Task Planner — WorkMate AI" },
      { property: "og:description", content: "Organise tasks and generate a daily or weekly plan with AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TasksPage,
});

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];
const badgeCls: Record<Priority, string> = {
  High: "bg-danger-soft text-destructive",
  Medium: "bg-warning-soft text-foreground",
  Low: "bg-success-soft text-success",
};
const empty = { title: "", deadline: "", priority: "Medium" as Priority, duration: 30 };

function TasksPage() {
  const [tasks, setTasks] = usePersistent<Task[]>("tasks", []);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState(empty);
  const [filter, setFilter] = useState<"All" | Priority | "Done">("All");
  const [mode, setMode] = useState<"day" | "week">("day");
  const [hours, setHours] = useState(6);
  const [err, setErr] = useState("");
  const ai = useAi("planner");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setErr("Task title is required.");
    if (form.duration < 5 || form.duration > 1440) return setErr("Duration must be between 5 and 1440 minutes.");
    setErr("");
    setTasks((p) => [{ ...form, title: form.title.trim(), id: uid(), done: false, createdAt: Date.now() }, ...p]);
    logActivity("task", `Added task "${form.title.trim()}"`);
    setForm(empty);
    toast.success("Task added");
  };

  const toggle = (t: Task) => {
    setTasks((p) => p.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)));
    if (!t.done) logActivity("task", `Completed "${t.title}"`);
  };
  const remove = (t: Task) => {
    setTasks((p) => p.filter((x) => x.id !== t.id));
    toast.success("Task deleted");
  };
  const saveEdit = () => {
    if (!edit.title.trim()) return toast.error("Title cannot be empty");
    setTasks((p) => p.map((x) => (x.id === editId ? { ...x, ...edit } : x)));
    setEditId(null);
    toast.success("Task updated");
  };

  const open = tasks.filter((t) => !t.done);
  const done = tasks.length - open.length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const shown = tasks.filter((t) => (filter === "All" ? true : filter === "Done" ? t.done : t.priority === filter));

  const plan = async () => {
    if (!open.length) return toast.error("Add at least one open task to generate a plan.");
    const list = open.map((t) => `- ${t.title} | Priority: ${t.priority} | Duration: ${t.duration} min | Deadline: ${t.deadline || "none"}`).join("\n");
    const content = `Today is ${new Date().toDateString()}. Create a ${mode === "day" ? "schedule for today" : "weekly schedule (Mon–Fri)"} starting at 08:00 with ${hours} available working hours per day.\nTasks:\n${list}`;
    const res = await ai.run([{ role: "user", content }]);
    if (res) logActivity("planner", `Generated a ${mode === "day" ? "daily" : "weekly"} schedule`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="AI Task Planner" description="Track your tasks and let AI build a realistic schedule." icon={<ListChecks className="h-5 w-5" />} />

      <form onSubmit={add} className="grid gap-3 rounded-xl border bg-card p-5 shadow-card md:grid-cols-12 md:items-end">
        <div className="space-y-1.5 md:col-span-5">
          <Label htmlFor="t">Task *</Label>
          <Input id="t" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Draft client proposal" />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="d">Deadline</Label>
          <Input id="d" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
            <SelectTrigger aria-label="Priority"><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="m">Minutes</Label>
          <Input id="m" type="number" min={5} max={1440} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
        </div>
        <Button type="submit" className="md:col-span-1"><Plus className="h-4 w-4" /><span className="md:sr-only">Add</span></Button>
        {err && <p className="text-xs text-destructive md:col-span-12">{err}</p>}
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-semibold">{done} of {tasks.length} complete</span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="mb-4" aria-label="Task progress" />
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-3">
            <TabsList className="flex-wrap">
              {["All", ...PRIORITIES, "Done"].map((f) => <TabsTrigger key={f} value={f}>{f}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          {shown.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{tasks.length ? "No tasks match this filter." : "No tasks yet — add your first task above."}</p>
          ) : (
            <ul className="divide-y">
              {shown.map((t) => (
                <li key={t.id} className="py-3">
                  {editId === t.id ? (
                    <div className="grid gap-2 sm:grid-cols-6">
                      <Input className="sm:col-span-3" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} aria-label="Edit title" />
                      <Input type="date" className="sm:col-span-2" value={edit.deadline} onChange={(e) => setEdit({ ...edit, deadline: e.target.value })} aria-label="Edit deadline" />
                      <Input type="number" value={edit.duration} onChange={(e) => setEdit({ ...edit, duration: Number(e.target.value) })} aria-label="Edit minutes" />
                      <Select value={edit.priority} onValueChange={(v) => setEdit({ ...edit, priority: v as Priority })}>
                        <SelectTrigger className="sm:col-span-2" aria-label="Edit priority"><SelectValue /></SelectTrigger>
                        <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                      <div className="flex gap-2 sm:col-span-4 sm:justify-end">
                        <Button size="sm" onClick={saveEdit}><Check className="h-4 w-4" /> Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditId(null)}><X className="h-4 w-4" /> Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Checkbox checked={t.done} onCheckedChange={() => toggle(t)} aria-label={`Mark ${t.title} complete`} />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-medium ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.title}</p>
                        <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className={`rounded px-1.5 py-0.5 font-medium ${badgeCls[t.priority]}`}>{t.priority}</span>
                          <span>{t.duration} min</span>
                          <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" />{t.deadline || "No deadline"}</span>
                          {t.demo && <Badge variant="outline">Demo</Badge>}
                        </p>
                      </div>
                      <Button size="icon" variant="ghost" aria-label="Edit task" onClick={() => { setEditId(t.id); setEdit({ title: t.title, deadline: t.deadline, priority: t.priority, duration: t.duration }); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Delete task" onClick={() => remove(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-5 shadow-card">
            <div className="space-y-1.5">
              <Label>Plan for</Label>
              <Tabs value={mode} onValueChange={(v) => setMode(v as "day" | "week")}>
                <TabsList><TabsTrigger value="day">Today</TabsTrigger><TabsTrigger value="week">This week</TabsTrigger></TabsList>
              </Tabs>
            </div>
            <div className="w-28 space-y-1.5">
              <Label htmlFor="h">Hours/day</Label>
              <Input id="h" type="number" min={1} max={14} value={hours} onChange={(e) => setHours(Math.min(14, Math.max(1, Number(e.target.value))))} />
            </div>
            <Button onClick={plan} disabled={ai.loading} className="flex-1"><Sparkle className="h-4 w-4" /> {ai.loading ? "Planning…" : "Generate schedule"}</Button>
          </div>
          <AiOutput title="Suggested schedule" {...ai} onRegenerate={plan} onStop={ai.stop} emptyIcon={<CalendarClock className="h-6 w-6" />} emptyText="Add tasks, choose your available time, then generate a schedule." />
        </div>
      </div>
      <ResponsibleAiNotice compact />
    </div>
  );
}
