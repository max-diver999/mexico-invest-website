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
| MDX всего | **337** → **334** после консолидации дублей (6 коллекций) |
| GEO commercial | **90/100, grade A** — **17** файлов с block-level issues |
| `validate:content --all` | ~~**337/337** clean~~ — **не измерено**, см. ниже |
| GSC stage | traction — repatriation, fideicomiso, projects |
| Последний prod commit | 2026-07-28 (site-report log) |

> **Baseline correction (2026-08-21).** `npm run validate:content -- --all` падает с `ERR_MODULE_NOT_FOUND`
> (`scripts/lib/more-content-gate.mjs:13` импортирует `../../../scripts/lib/cloudinary-gate.mjs` — путь
> ведёт за пределы репозитория, файла нет). Гейт никогда не отрабатывал, поэтому «337/337 clean» — не
> измерение. То же значение стоит в `site-passport.yaml`, `programs/mexico-invest.yaml` и
> `src/pages/site-report/index.astro` (`geoSnapshot.validateContentPass`). Чинится одной строкой (CR-1),
> после чего первый реальный прогон становится новым baseline.

**Главный вывод после аудита:** корпус большой, но **машинно-шаблонный**, не зрелый. **39%** прозы
(453 116 из 1 150 982 слов) — предложения, дословно повторяющиеся на других страницах сайта;
**276 из 337** файлов содержат численно невозможное утверждение (срок в долларах, ставка ISR как `$200K`,
net yield как `$265,000`). Boilerplate-H2 «Mexico Invest underwriting show» — не 17 файлов, а **337**.
Пилот = **сначала расчистка корпуса** (волны 1–4), потом код и только потом новые темы.

### Фаза 0 — аудит · **ГОТОВО 2026-08-21**

Ветка: `claude/mexico-invest-audit-uulcad` (харнесс сессии; при мерже переименовать в `cc/mexico-audit-2026-08-21`, если Cursor завязан на префикс `cc/`).

| Артефакт | Что внутри |
|---|---|
| `.content-os/reports/AUDIT-REPORT-2026-08-21.md` | Блоки A (корпус, 337 MDX), B (rendered HTML, 352 стр.), D (GSC, canonical) |
| `.content-os/reports/CODE-AUDIT-2026-08-21.md` | Блок C — сравнение с `florida-estate-website` @ `d0f003c`, 18 находок |
| `.content-os/batches/corpus-cleanup-roadmap-2026-08-21.md` | 7 волн, ~42 PR |
| `.content-os/batches/code-improvements-roadmap-2026-08-21.md` | CR-1…CR-10 с порядком зависимостей |
| `.content-os/batches/content-roadmap-2026-08-21.md` | 50 статей, 10 волн по 5 |
| `.content-os/batches/topics-proposal.json` | те же 50, машиночитаемо; 0 коллизий слагов, 0 нерезолвящихся `relatedSlugs` |

**Топ-6 находок:**

1. **39% прозы дублируется, 82% файлов с несогласованными числами** — блокирует всё остальное.
2. **`validate:content` не работает** — baseline «337/337» никогда не измерялся.
3. **333 из 348 `<title>` обрезаются в выдаче** — `BaseLayout` добавляет `" | Mexico Invest"` (+16 симв.) к титлам средней длины 55. Прямая причина 0.37% CTR на fideicomiso-хабе.
4. **100 страниц `/projects/` рендерят FAQ дважды** — `hasInlineFaqBlock={false}` захардкожен.
5. **1 746 `relatedSlugs` не рендерятся нигде** — компонента нет; во Florida этот же баг уже починен (`src/lib/content-graph.ts`).
6. **0 ссылок на `/get-shortlist/` и `/contact/` внутри текста** на всех 337 страницах.

Живой сайт из окружения Claude Code недоступен (egress-политика блокирует `mexico-invest.com`) — аудит
rendered-слоя сделан по собранному `dist/`, который для статической сборки совпадает с продом.
**Одна ручная проверка нужна от Максима/Cursor:** `curl -I https://www.mexico-invest.com/guides/fideicomiso-mexico-explained/`
— ожидается `308` на apex.

### Фаза 1 — исполнение · **ГОТОВО 2026-08-21** (после «ок» Максима)

Отчёт: `.content-os/reports/CLEANUP-OUTCOME-2026-08-21.md`

**Главное открытие фазы 1: три гейта качества мерили сам шаблон.**

| Гейт | Что он на самом деле поощрял |
|---|---|
| `validate:content` | ничего — падал при каждом запуске, не отработал ни разу |
| `more-content-gate.mjs` | нижние пороги без верхних; половина файла (`runStructuralChecks`) вообще не вызывается |
| `geo-citability-scorer.mjs` | **+45 баллов за фразу «insider tip»**, +20 за любой заголовок-вопрос |
| `geo-citability-audit.mjs` | **hard-fail страницы без строки «insider tip»** |

Генератор писался под эти гейты: «Insider tip:» — 2 839 раз в 336 из 337 файлов,
89% всех H2 были вопросами. Все три гейта починены.

| Метрика | Было | Стало |
|---|---|---|
| Дублированная проза | **39%** | **1%** |
| Файлов с несогласованными единицами | 276/337 | **0** |
| Нарушений originality-гейта | 11 842 | **0** |
| Boilerplate-H2 «underwriting show» | 337 | **0** |
| Тайтлов длиннее 60 симв. | 333 | **0** |
| Дублей FAQ | 100 стр. | **0** |
| Сирот | 57 | **0** |
| Отрендеренных `relatedSlugs` | 0 из 1 746 | **все** |
| Страниц с мостиком к лиду в тексте | **0** | **301** |
| Whole-site audit | 1 P0 + 1 147 P1 | **чисто** |
| Средняя длина статьи | 4 786 сл. | 2 692 сл. |
| H2-вопросов | 89% | 18% |

**GEO-скор: 90/A → 64/C — и это честная цифра, а не регрессия.** «A» держалась на
бонусе +45 за «insider tip»: убрали шаблон — упала метрика, которая его и мерила.
Оставшийся разрыв (`answer 62`, `self 60`) — реальная работа: многие H2 больше не
открываются самодостаточным ответом, потому что этим ответом был сгенерированный
филлер. Переписать открывающие абзацы — следующая волна.

**Открыто намеренно** (детали в CLEANUP-OUTCOME):
answer-first абзацы · фактчек стоимости fideicomiso (ни одна цифра не менялась) ·
`isr-exemption-5-year-rule` возможно смешивает два правила · решение по разделу news ·
ручная проверка 308 на www · `SITE.whatsapp` = +66 (Таиланд) · проверить 6 редиректов
после деплоя · 50 статей контент-плана не начаты (и не должны быть до этого момента).

**СТОП.** PR в main нет, деплоя нет, индексации нет. Всё на ветке
`claude/mexico-invest-audit-uulcad` — ревью и выкладка через Cursor.

## Индексация

Только ключ **`mexico-invest-indexing`**. Никогда MORE Group / invest-gulf. Cursor после «отправляй».
