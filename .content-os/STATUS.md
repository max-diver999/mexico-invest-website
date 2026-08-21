# Content status — mexico-invest.com

> **Единственный файл «где мы сейчас».** Claude Code и Cursor читают его первым после `git pull origin main`.

## Источник правды

- Репозиторий: `max-diver999/mexico-invest-website`, ветка **`main`**
- Программа: `more-group-content-os/programs/mexico-invest.yaml`
- Процесс: `docs/WORKFLOW-GITHUB.md`
- **Цель пилота:** больше лидов с намерением купить в Мексике — полный аудит, улучшения кодом и корпуса, план контента
- **Автономия Claude:** `more-group-content-os/policies/claude-autonomous-decisions.md`

## Content OS pilot — подключён (2026-08-21)

| Артефакт | Путь |
|---|---|
| Паспорт | `.content-os/site-passport.yaml` |
| Analytics snapshot | `more-group-content-os/analytics-snapshots/mexico-invest-website/2026-08-21.json` |
| Приоритеты GSC | `docs/PRIORITY-CTR-LEADS.md` |
| GEO baseline | `docs/CONTENT_QUALITY_AUDIT.md` |
| Живой отчёт | `src/pages/site-report/` |

### Baseline на main (до аудита)

| Сигнал | Значение |
|---|---|
| MDX всего | **337** (6 коллекций) |
| GEO commercial | **90/100, grade A** — **17** файлов с block-level issues |
| `validate:content --all` | **337/337** clean |
| GSC stage | traction — repatriation, fideicomiso, projects |
| Последний prod commit | 2026-07-28 (site-report log) |

**Главный вывод:** корпус большой и зрелый. Пилот = **полный аудит + улучшения кодом** (сравнить с Florida pilot: hubs, nav, link graph) + corpus waves (GEO blocks, CTR) + roadmap новых тем.

### Фаза 0 — аудит

**Ожидается от Claude.** Артефакты → `.content-os/reports/` и `.content-os/batches/`.

После «ок» от Максима — fix batches на `cc/mexico-*`, деплой через Cursor.

## Индексация

Только ключ **`mexico-invest-indexing`**. Никогда MORE Group / invest-gulf. Cursor после «отправляй».
