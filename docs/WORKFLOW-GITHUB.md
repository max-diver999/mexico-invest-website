# GitHub workflow — mexico-invest.com pilot

## Repos

| Repo | Role |
|---|---|
| `max-diver999/mexico-invest-website` | Site + `.content-os` |
| `max-diver999/more-group-content-os` | Registry, program, snapshots, policies (submodule) |

## Claude

1. Branch `cc/mexico-audit-YYYYMMDD` from `main`
2. Phase 0 artifacts only — no mass MDX, no layout refactors
3. Open PR to `main` when audit complete; **do not merge**

## Cursor (after Maxim «ок» + fix batches)

1. Review PR / merge with git identity `max-diver999 <maks.shchegolev@gmail.com>`
2. `npm run validate:content -- --changed` → build → `qa:full:quick`
3. Push → Vercel
4. Indexing **only** on explicit «отправляй» — preflight `project_id == mexico-invest-indexing`

## Submodule update

```bash
cd mexico-invest-website
git submodule update --remote more-group-content-os
git add more-group-content-os && git commit -m "chore: bump content-os submodule"
```

## Indexing warning

Never use MORE Group key (`soy-braid-491510-c2`) or invest-gulf key for mexico-invest.com. See `mexico-invest-indexing-isolation.mdc`.
