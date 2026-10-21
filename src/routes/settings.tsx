import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings, Database, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, ResponsibleAiNotice } from "@/components/workmate/page-header";
import { DEMO_TASKS, uid, usePersistent, writeStore, type Profile, type Task } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — WorkMate AI" },
      { name: "description", content: "Manage your WorkMate AI profile, demo data and stored records." },
      { property: "og:title", content: "Settings — WorkMate AI" },
      { property: "og:description", content: "Profile and data settings for WorkMate AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [profile, setProfile] = usePersistent<Profile>("profile", { name: "Team Member", role: "Employee" });
  const [draft, setDraft] = useState(profile);
  const [tasks, setTasks] = usePersistent<Task[]>("tasks", []);
  useEffect(() => setDraft(profile), [profile]);
  const demoCount = tasks.filter((t) => t.demo).length;

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Settings" description="Your profile and locally stored data." icon={<Settings className="h-5 w-5" />} />
      <form
        className="space-y-4 rounded-xl border bg-card p-5 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.name.trim()) return toast.error("Name is required");
          setProfile({ name: draft.name.trim(), role: draft.role.trim() });
          toast.success("Profile saved");
        }}
      >
        <h2 className="font-semibold">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="n">Name</Label><Input id="n" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="r">Role</Label><Input id="r" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} /></div>
        </div>
        <Button type="submit">Save profile</Button>
      </form>

      <section className="space-y-4 rounded-xl border bg-card p-5 shadow-card">
        <h2 className="flex items-center gap-2 font-semibold"><Database className="h-4 w-4" /> Data</h2>
        <p className="text-sm text-muted-foreground">Your tasks, chat and activity are saved in this browser. Demo tasks are clearly marked with a "Demo" badge.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={demoCount > 0} onClick={() => { setTasks((p) => [...DEMO_TASKS.map((t) => ({ ...t, id: uid(), createdAt: Date.now() })), ...p]); toast.success("Demo tasks loaded"); }}>Load demo tasks</Button>
          <Button variant="outline" disabled={!demoCount} onClick={() => { setTasks((p) => p.filter((t) => !t.demo)); toast.success("Demo tasks removed"); }}>Remove demo tasks ({demoCount})</Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!confirm("Delete all tasks, chat history and activity? This cannot be undone.")) return;
              ["tasks", "chat", "activity", "stats"].forEach((k) => writeStore(k, k === "stats" ? {} : []));
              toast.success("All data cleared");
            }}
          ><Trash2 className="h-4 w-4" /> Clear all data</Button>
        </div>
      </section>
      <ResponsibleAiNotice />
    </div>
  );
}
