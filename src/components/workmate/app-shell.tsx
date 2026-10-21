import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, Mail, NotebookPen, ListChecks, Search, MessagesSquare, Settings, Bell, BrainCircuit,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePersistent, type Activity, type Profile } from "@/lib/store";

export const NAV = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Email Generator", url: "/email", icon: Mail },
  { title: "Meeting Summarizer", url: "/meetings", icon: NotebookPen },
  { title: "Task Planner", url: "/tasks", icon: ListChecks },
  { title: "Research Assistant", url: "/research", icon: Search },
  { title: "AI Chat", url: "/chat", icon: MessagesSquare },
  { title: "Settings", url: "/settings", icon: Settings },
] as const;

function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { setOpenMobile } = useSidebar();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <p className="font-bold text-sidebar-accent-foreground">WorkMate AI</p>
            <p className="text-xs">Productivity Assistant</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={path === item.url} tooltip={item.title}>
                    <Link to={item.url} onClick={() => setOpenMobile(false)}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <p className="px-2 pb-2 text-xs group-data-[collapsible=icon]:hidden">CAPACITI AI Skills Acceleration Programme</p>
      </SidebarFooter>
    </Sidebar>
  );
}

function TopBar() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [profile] = usePersistent<Profile>("profile", { name: "Team Member", role: "Employee" });
  const [activity] = usePersistent<Activity[]>("activity", []);
  const matches = q ? NAV.filter((n) => n.title.toLowerCase().includes(q.toLowerCase())) : [];
  const initials = profile.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur">
      <SidebarTrigger />
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && matches[0]) {
              navigate({ to: matches[0].url });
              setQ("");
            }
          }}
          placeholder="Search tools…"
          aria-label="Search tools"
          className="pl-9"
        />
        {matches.length > 0 && (
          <ul className="absolute left-0 right-0 top-11 rounded-lg border bg-popover p-1 shadow-card">
            {matches.map((m) => (
              <li key={m.url}>
                <Link to={m.url} onClick={() => setQ("")} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
                  <m.icon className="h-4 w-4 text-primary" /> {m.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Popover>
          <PopoverTrigger className="relative rounded-full p-2 hover:bg-accent" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {activity.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <p className="mb-2 text-sm font-semibold">Recent notifications</p>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {activity.slice(0, 5).map((a) => (
                  <li key={a.id} className="text-muted-foreground">{a.text}</li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>
        <Link to="/settings" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-accent">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{initials}</span>
          <span className="hidden text-sm font-medium sm:block">{profile.name}</span>
        </Link>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
