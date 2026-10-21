<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- All AI calls go through the single streaming server route `src/routes/api/ai.ts` with per-feature prompts in `src/lib/ai/prompts.ts` — keeps the key server-side and prompts in one place.
- User data (tasks, chat, activity, profile) persists in localStorage via `src/lib/store.ts` — no login is required for this app.
