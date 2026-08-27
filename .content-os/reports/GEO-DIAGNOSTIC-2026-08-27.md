# GEO diagnostic — mexico-invest.com — 2026-08-27

Скорер перенесён с capetown-invest-website (ветка `claude/capetown-content-audit-h6qbx7`,
коммит `90dc5e1`) и адаптирован: валютные регулярки переведены с ранда на
`MXN | US\$ | \$` (5 мест + orphanFigures), unit-правила пересобраны под мусор
этого корпуса, CONTENT_ROOT совпал (`src/content`).

## Размеченные наборы

| Набор | Что это | n |
|---|---|---|
| bad | корпус на коммите `5a8d980` («careful mexico-invest corpus lift — 337/337 ≥90», 10.07.2026; поверх `190be90` c +53 336 строк). Позже вычищен `be71edd` (−51 500 строк) | 132 |
| good | статьи, написанные вручную в августе 2026 (волны 1–2: areas + persona-guides) | 12 |
| mid | честная проза, пережившая чистку июльского мусора и полуавтоматические починки | 7 |

Сигнатура мусора этого сайта: «Insider tip:» ×2 791, «Mexico Invest requests
$280,000 HOA proof in writing…» ×541, «Mexico Invest reviewed N% benchmarks on
\<heading\> files in Q2 2026» ×100+, заголовки, вклеенные в собственные зачины.

## Шаг 4: старый скоринг сломан — цифры по этому сайту

Действующий скорер сайта (`scripts/lib/geo-citability-scorer.mjs`, сумма наград):

| Набор | Старый скорер |
|---|---|
| bad (мусор июльского lift) | **mean 87.6** (min 87, max 89) |
| good (ручной текст) | mean 90.5 |
| mid (честная проза) | **mean 75.1 — ниже мусора на 12.5** |
| Разделение good − bad | **2.9 балла** |

Разделение < 20: рубрика неинформативна. Хуже: честная середина корпуса
упорядочена НИЖЕ мусора — рубрика платит за шаблонные признаки, которые
генератор ставит надёжнее человека. Один нюанс честности: 0/132 мусорных выше
худшей ручной — потому что ручные волны 1–2 писались ПОД эту рубрику и выжали
90+; сама шкала при этом различает классы на 2.9 балла.

## Шаг 5: калибровка нового скорера — пройдена

| Набор | mean | min | max |
|---|---|---|---|
| bad | **0.0** | 0 | **0** (порог ≤25 ✓) |
| good | 63.2 | **58** (порог ≥55 ✓) | 67 |
| mid | 62.0 | 59 | 63 |

Разделение **63.2** (порог ≥35 ✓); 0/132 мусорных выше худшей ручной.
Честная оговорка: good и mid стоят близко (63.2 против 62.0) — mid-статьи
прошли большую ручную чистку и реально неплохи, а good-статьи несут артефакты
старой рубрики, под которую писались. Мусор от честного текста шкала отделяет
с запасом; тонкое различие good/mid на этом корпусе слабое, и это зафиксировано
здесь, а не спрятано.

Адаптация unit-правил (2.3): кейптаунский список (turnaround/awareness/LTV…)
заменён на сигнатуру здешнего мусора — «$X benchmarks on», «$X / N% HOA proof».
Проверено: в bad срабатывает массово, в good и в чистом корпусе — 0 ложных
(«…SAT receipts, HOA proof» в description без цифры перед — не матчится).

## Шаг 6: замер корпуса (354 MDX)

**Среднее 16.8 / 75 · минимум 0 · страниц с нулём 54.**

| Коллекция | n | mean | min | нулей |
|---|---|---|---|---|
| projects | 101 | 10.7 | 0 | 36 |
| areas | 37 | 14.1 | 0 | 4 |
| compare | 36 | 16.3 | 0 | 3 |
| guides | 144 | 18.3 | 0 | 11 |
| news | 28 | 30.1 | 25 | 0 |
| developers | 8 | 33.9 | 25 | 0 |

### Четыре системные причины (в порядке вклада)

1. **Реестра фактов нет** → `provenance 0/10` у всего корпуса и `stamped-figure`
   −4×до 6 почти на каждом файле: «10%» в 178 статьях, «5%» в 146, «$500» в 143,
   «25%» в 130, «$2,500» в 112 — всё несущие цифры сайта (trust fee $500–800,
   ISR 25% нерезидента, management 25%…) без единой записи с источником.
   Это до −34 на файл, снимается заведением `.content-os/facts.json`.
2. **Три штампованных CTA на ~230 страницах** → `template-family` на всех 101
   projects и большинстве guides: «Want three options here with the numbers
   run?» ×113, «Want three comparable buildings run the same way?» ×99,
   «Need this run against your actual numbers?» ×17. Плюс хвост стандартных
   CtaBox-фраз (по 4–7 файлов).
3. **Конвейерные project-страницы** (101 файл, 36 нулей): один каркас, дубли
   3–6% между соседями, худшая пара `tao-monte-rocella` ↔ `tao-santamar-akumal`
   делит 97 девятисловных последовательностей.
4. **Каннибализм новых волн**: FAQ-ответы и worked example продублированы между
   гайдом и area-страницей — `mexico-city-roma-condesa` ↔
   `mexico-city-real-estate-foreigner-guide` делят **247** последовательностей
   (9% меньшей страницы); `queretaro` ↔ `guadalajara-real-estate-investment` — 126.

### Худшие 15 файлов

| Файл | Балл | База | Base parts | Штрафы | Гейты |
|---|---|---|---|---|---|
| areas/mexico-city-roma-condesa.mdx | 0 | 60 | op 18 · ev 15 · st 12 · rh 8 · prov 0 | −62 (stamped-figure×6, duplicated-text×1, duplicated-volume×1) | — |
| areas/playa-del-carmen.mdx | 0 | 52 | op 19 · ev 13 · st 8 · rh 6 · prov 0 | −53 (stamped-figure×6, template-family×1, duplicated-text×1) | — |
| areas/puerto-vallarta.mdx | 0 | 49 | op 16 · ev 11 · st 8 · rh 7 · prov 0 | −49 (stamped-figure×6, template-family×1, duplicated-text×1) | — |
| areas/tulum-pueblo-east.mdx | 0 | 49 | op 16 · ev 12 · st 10 · rh 4 · prov 0 | −50 (stamped-figure×4, duplicated-text×1, template-family×1) | — |
| compare/cabo-san-lucas-vs-san-jose-del-cabo.mdx | 0 | 52 | op 16 · ev 13 · st 9 · rh 6 · prov 0 | −52 (stamped-figure×6, template-family×1, hedging×1) | — |
| compare/pre-construction-vs-resale-tulum.mdx | 0 | 51 | op 17 · ev 14 · st 7 · rh 5 · prov 0 | −51 (stamped-figure×6, template-family×1, duplicated-text×1) | — |
| compare/punta-mita-vs-los-cabos-luxury.mdx | 0 | 47 | op 16 · ev 13 · st 8 · rh 4 · prov 0 | −52 (stamped-figure×6, template-family×1, duplicated-text×1) | — |
| guides/ampi-license-verify-guide.mdx | 0 | 53 | op 20 · ev 10 · st 10 · rh 5 · prov 0 | −53 (stamped-figure×2, duplicated-text×1, duplicated-volume×1) | mass-duplication |
| guides/apostille-documents-mexico-property.mdx | 0 | 51 | op 16 · ev 11 · st 9 · rh 7 · prov 0 | −56 (stamped-figure×2, duplicated-text×1, duplicated-volume×1) | mass-duplication |
| guides/best-areas-invest-mexico-2026.mdx | 0 | 54 | op 17 · ev 12 · st 9 · rh 8 · prov 0 | −57 (stamped-figure×6, template-family×1) | — |
| guides/cfdi-cost-basis-mexico.mdx | 0 | 55 | op 18 · ev 13 · st 9 · rh 7 · prov 0 | −71 (stamped-figure×5, duplicated-text×1, duplicated-volume×1) | mass-duplication |
| guides/cross-border-lender-list.mdx | 0 | 54 | op 14 · ev 14 · st 12 · rh 7 · prov 0 | −62 (stamped-figure×6, duplicated-text×1, template-family×1) | — |
| guides/first-time-foreign-buyer-mexico.mdx | 0 | 52 | op 17 · ev 12 · st 9 · rh 7 · prov 0 | −53 (stamped-figure×6, template-family×1, duplicated-text×1) | — |
| guides/mexico-city-real-estate-foreigner-guide.mdx | 0 | 60 | op 18 · ev 15 · st 11 · rh 8 · prov 0 | −81 (stamped-figure×6, duplicated-text×1, duplicated-volume×1) | mass-duplication |
| guides/mexico-property-closing-costs-breakdown.mdx | 0 | 46 | op 15 · ev 13 · st 8 · rh 3 · prov 0 | −49 (stamped-figure×6, template-family×1, duplicated-text×1) | — |

### Каннибалы (порог ≥60 общих 9-грамм, ≤6 владельцев)

| Общих 9-грамм | % меньшей | Пара |
|---|---|---|
| 247 | 9% | areas/mexico-city-roma-condesa ↔ guides/mexico-city-real-estate-foreigner-guide |
| 126 | 6% | areas/queretaro ↔ guides/guadalajara-real-estate-investment |
| 97 | 7% | projects/tao-monte-rocella ↔ projects/tao-santamar-akumal |
| 70 | 3% | areas/queretaro ↔ guides/mexico-city-real-estate-foreigner-guide |
| 62 | 3% | areas/oaxaca-city-real-estate ↔ guides/guadalajara-real-estate-investment |
| 62 | 3% | areas/loreto-baja ↔ areas/todos-santos |

### Прочие дефекты, найденные скорером

- **3 мусорных обрывка июльского lift пережили чистку**: обрезанные предложения
  «Mexico Invest reviewed 60% benchmarks on What should buyers verify on…» в
  `projects/palmilla-san-jose` :192, `guides/mexico-condo-investment-foreigners` :90,
  `guides/predial-riviera-maya-rates` :201.
- **8 файлов с malformed-токенами** (удвоенное слово через регистр: «management
  Management», «market Market»; « , »): playacar, mexico-vs-arizona-retirement,
  puerto-morelos-vs-playa-del-carmen, how-to-buy-mexico-property-remotely,
  invest-in-riviera-maya, mexico-restricted-zone-explained,
  non-resident-tax-id-rfc-guide, property-managers-playa-del-carmen-compared.
- **19 news-заметок короче 600 слов** (гейт too-short-to-score, cap 25) — размер
  жанра, в волны переписывания не берём.
- 10 файлов под гейтом mass-duplication (>10% дублей), 3 — unit-mismatch.

## Замечание о сравнении со старой шкалой

Старая шкала «90/100» и новая «16.8/75» не сравнимы: старая была суммой наград
и оплачивалась шаблонами, новая — потолок, опускаемый уликами машинности, с
абсолютным максимумом 75 у детерминированной части. Ручные статьи августа при
requireRegistry=false дают 58–67; в полном корпусе их тянут вниз только
пустой реестр и собственные каннибал-дубли.

---

## R0 выполнена (2026-08-27)

| Метрика | До R0 | После R0 |
|---|---|---|
| Среднее по корпусу | 16.8 | **35.3** |
| Страниц с нулём | 54 | **4** (все — конвейерные projects, работа R1/R3) |
| Худшая коллекция | projects 10.7 | projects 24.9 |
| Калибровка | 63.2 | **66.2** (мусор max 0, ручной min 58) |

Что сделано: `.content-os/facts.json` — 40 записей (статутные цифры со
ссылками на LISR/CFF/CPEUM/Ley de Migración/кодексы, модельные — с честной
пометкой «site model/survey»); `.content-os/external-claims.json` — 15
утверждений (US 6, GB 3, ES/FR/IT/NL по 1, CA 2), reviewBy 2027-02-27;
удалены 3 обрывка июльского мусора («Mexico Invest reviewed N% benchmarks
on…»); починены 2 реальных дефекта « , »; правило malformed починено с
замером (см. docs/GEO-SCORING.md): 8 ложных срабатываний на границах блоков
сняты, мусор по-прежнему ловится в 75/132 файлах.

Реестр покрывает 33/364 несущих цифр (9%) — гейт unregistered-claims
взводится на 80%, наполнение продолжается по мере волн.

## R1 выполнена (2026-08-27) — каннибалы

Корпус: mean 35.3 → **36.2**, нулей 4 → **1** (copala-quivira, материал R3).
Все пары волны разведены до ≤5 общих 9-грамм, включая перекрёстную проверку
девяти новых страниц между собой.

| Файл | Было → стало | Что теперь держит только он |
|---|---|---|
| guides/mexico-city-real-estate-foreigner-guide | 6 → **63** | процесс покупки города; worked example переехал в Del Valle/Nápoles |
| areas/mexico-city-roma-condesa | 26 → **63** | рынок двух колоний: эпохи застройки, ценовой спред 2017+, Roma-пример |
| areas/queretaro | 33 → **56** | вода как гейт сделки; корпоративная аренда как индустриальный лизинг |
| guides/guadalajara-real-estate-investment | 34 → **53** | colonia-механика (каноническая траст-таблица осталась здесь) |
| areas/oaxaca-city-real-estate | 45 → **61** | один штат — два режима (Highway 175); INAH×сейсмика |
| areas/loreto-baja | 49 → **60** | хрупкость маршрутов; FONATUR-наследство в трубах |
| areas/todos-santos | 55 → **61** | аграрный файл из четырёх бумаг |
| projects/tao-monte-rocella | 0 → **61** | вид как контрактный термин на фазируемом склоне El Tezal |
| projects/tao-santamar-akumal | 0 → **61** | черепаший залив: спрос и регуляторная цена; enrolment clause |

Худшая пара корпуса (247 общих 9-грамм) разведена до 0; внутри area-файла
Roma-Condesa попутно удалена трижды повторённая сейсмическая механика —
остаток старых патчей. TAO-пара переписана с разными каркасами (138 → 0).

Гейты: validate 354/354, calibration passed, facts:review clean,
build + rendered audit 0.
