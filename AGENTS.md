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

## Architecture
- Use TanStack file routes and a shared AppShell for workspace pages, so navigation and page metadata remain consistent.
- Store identity-independent profiles and protected roles separately; role grants require verified administrator authorization to prevent self-promotion.
- Enforce campus team constraints inside authenticated server functions, never in browser configuration, so protected rules cannot leak through normal results.
- Keep the allocation engine browser-safe and independently tested for guest trials; authenticated campus generation retrieves rules only server-side.
- Store sessions and immutable generation history in Cloud with owner/read-only-sharing policies; do not use browser storage for persistent classroom data.
- Build exports from public team DTOs only, so private constraint metadata never enters downloads.
