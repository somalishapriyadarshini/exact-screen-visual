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

- Keep PlanPulse demo data and risk calculations in a client-safe module, with shared in-memory state in a root provider; the requested prototype has no backend.
- Use TanStack file routes for the five screens and a shared shell for project navigation, because direct links need distinct pages.
