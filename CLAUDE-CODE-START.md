# Claude Code — mexico-invest.com

Environment: **MORE Group Content**  
Repo: **max-diver999/mexico-invest-website**

```bash
git pull origin main
git submodule update --init --recursive
```

Read order:

1. `.content-os/STATUS.md`
2. `.content-os/site-passport.yaml`
3. `more-group-content-os/programs/mexico-invest.yaml`
4. `more-group-content-os/policies/claude-autonomous-decisions.md`
5. `more-group-content-os/policies/corpus-cleanup-mode.md`
6. `more-group-content-os/policies/publishing-gates.md`
7. `docs/PRIORITY-CTR-LEADS.md` + `docs/CONTENT_QUALITY_AUDIT.md`
8. `more-group-content-os/analytics-snapshots/mexico-invest-website/2026-08-21.json`
9. `src/pages/site-report/index.astro`
10. `CLAUDE.md`

Optional code reference (patterns only): recent `florida-estate-website` audit — HubLayout, content-graph, breadcrumbs.

**Full audit prompt (copy to chat):**

```text
Pull main + submodule. mexico-invest.com — Content OS pilot (EN, ~337 MDX, 6 collections).

Прочитай STATUS, site-passport, programs/mexico-invest.yaml, PRIORITY-CTR-LEADS, CONTENT_QUALITY_AUDIT, analytics snapshot, site-report.

GEO 90/100 (grade A), но 17 файлов с block-level issues — часто boilerplate H2 «Mexico Invest underwriting show». Rubric: structure 84, unique 81. validate 337/337 clean. Задача: полный аудит + roadmap улучшений + план будущего контента (после «ок»).

Фаза 0 — четыре блока, потом СТОП:

A) КОРПУС (все 337 MDX): fideicomiso/restricted zone/STR/repatriation кластеры; projects (100) + areas (32) + compare (36). Каннибализация, orphans, FAQ/schema, lead bridges get-shortlist/contact. GEO: переписать слабые underwriting H2 на direct answers.

B) RENDERED HTML: npm run build + audit:rendered:fail + qa:full:quick — hero, alt, JSON-LD, lead forms.

C) КОД: сравни с Florida pilot (hubs, nav, content-graph, breadcrumbs) — что перенести на guides/projects/areas/compare. site-report gaps. CODE-AUDIT + code-improvements-roadmap.

D) GSC: fideicomiso-mexico-explained (542 imp, 0.37% CTR), earthquake-risk, projects cluster (Vidanta, Xcalacoco, Punta Mita). www vs apex canonical.

Артефакты (commit в ветку cc/mexico-audit-*):
- .content-os/reports/AUDIT-REPORT-{date}.md
- .content-os/reports/CODE-AUDIT-{date}.md
- .content-os/batches/corpus-cleanup-roadmap-{date}.md
- .content-os/batches/code-improvements-roadmap-{date}.md
- .content-os/batches/content-roadmap-{date}.md
- topics-proposal.json

СТОП: не пиши MDX массово, не меняй Astro/layouts, не PR на main, не push, не индексация. Жди «ок» от Максима на roadmaps.

Индексация — только Cursor после «отправляй», ключ mexico-invest-indexing ONLY (never soy-braid / invest-gulf).
```
