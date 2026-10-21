import { useCallback, useEffect, useState } from "react";

// Small localStorage-backed store. Values sync across components via a custom event.
const EVT = "workmate-store";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(`workmate:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T) {
  window.localStorage.setItem(`workmate:${key}`, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(EVT, { detail: key }));
}

export function usePersistent<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    setValue(read(key, fallback));
    const onChange = (e: Event) => {
      if ((e as CustomEvent).detail === key) setValue(read(key, fallback));
    };
    window.addEventListener(EVT, onChange);
    return () => window.removeEventListener(EVT, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = read(key, fallback);
      const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeStore(key, v);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [value, update] as const;
}

export type Priority = "High" | "Medium" | "Low";
export interface Task {
  id: string;
  title: string;
  deadline: string;
  priority: Priority;
  duration: number; // minutes
  done: boolean;
  demo?: boolean;
  createdAt: number;
}
export interface Activity {
  id: string;
  type: "email" | "meeting" | "planner" | "research" | "chat" | "task";
  text: string;
  at: number;
}
export interface Profile {
  name: string;
  role: string;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function logActivity(type: Activity["type"], text: string) {
  const list = read<Activity[]>("activity", []);
  writeStore("activity", [{ id: uid(), type, text, at: Date.now() }, ...list].slice(0, 30));
  if (type !== "task") {
    const stats = read<Record<string, number>>("stats", {});
    writeStore("stats", { ...stats, [type]: (stats[type] ?? 0) + 1 });
  }
}

export const DEMO_TASKS: Omit<Task, "id" | "createdAt">[] = [
  { title: "Prepare Q4 project status report", deadline: "", priority: "High", duration: 90, done: false, demo: true },
  { title: "Reply to client onboarding emails", deadline: "", priority: "Medium", duration: 30, done: false, demo: true },
  { title: "Review team timesheets", deadline: "", priority: "Low", duration: 20, done: true, demo: true },
];
