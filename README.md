# WorkMate AI — Workplace Productivity Assistant

A CAPACITI AI Skills Acceleration Programme project: one integrated, AI-powered workspace that helps employees write, summarise, plan and research faster.

## Features
- **Dashboard** — welcome message, productivity stats, task progress, upcoming tasks and recent activity.
- **Smart Email Generator** — recipient, subject, purpose, key points and tone (Formal, Friendly, Persuasive, Concise). Edit, regenerate and copy.
- **Meeting Notes Summarizer** — executive summary, discussion points, decisions and an action-item table. Missing owners/deadlines are labelled "Not specified", never invented.
- **AI Task Planner** — add, edit, complete and delete tasks with deadlines, priorities and durations; filter by priority; visual progress; AI-generated daily or weekly schedule.
- **AI Research Assistant** — summary, insights, limitations and recommendations, with every point labelled **[From source]** or **[AI interpretation]**. No invented citations.
- **Workplace AI Chat** — streaming chat with suggested prompts and copy buttons.
- **Settings** — profile, load/remove clearly-marked demo tasks, clear all data.
- **Responsible AI notice** shown throughout.

## Technologies
React 19, TypeScript, TanStack Start (routing + server routes), Tailwind CSS v4, shadcn/ui (Radix, accessible), Vercel AI SDK, Lovable AI Gateway, lucide-react, react-markdown.

## Project structure
```
src/routes/            pages (index = dashboard, email, meetings, tasks, research, chat, settings)
src/routes/api/ai.ts   secure server endpoint that calls the AI model (streaming)
src/lib/ai/prompts.ts  structured system prompt for each feature
src/lib/use-ai.ts      client hook: streaming, loading and error states
src/lib/store.ts       browser persistence for tasks, chat, activity, profile
src/components/workmate  app shell (sidebar/top bar), AI output panel, notices
```

## Setup
```bash
bun install      # or npm install
bun run dev      # http://localhost:8080
```

## AI configuration
All AI calls happen on the server in `src/routes/api/ai.ts`. The key is read from the `LOVABLE_API_KEY` server environment variable and is **never** sent to the browser. On Lovable this is provisioned automatically. If the key is missing, the app shows a clear "AI is not configured" message instead of fake output. Rate-limit (429) and credit (402) errors are shown to the user.

## Data
Tasks, chat history, activity and profile are stored in the browser's localStorage (per device). Demo tasks carry a `demo` flag and a visible "Demo" badge.

## Responsible AI
- AI output may contain errors — every result is labelled as AI-generated and is editable.
- Do not enter sensitive or confidential workplace information without authorisation.
- Important decisions and generated content must be reviewed by a human.
- Prompts instruct the model not to invent facts, owners, deadlines, statistics or citations.

## Version control
Standard `.gitignore` included; connect GitHub from the Lovable editor or `git init && git remote add origin <url>`.
