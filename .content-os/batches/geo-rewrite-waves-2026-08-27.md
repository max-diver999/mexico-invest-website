# Волны переписывания R0–R5 — mexico-invest.com — план на подтверждение

Базовый замер: 354 MDX, среднее 16.8/75, 54 нуля. Полная диагностика:
`.content-os/reports/GEO-DIAGNOSTIC-2026-08-27.md`.

Принцип: сначала худшее; каждая страница держит тему, которую не держит ни
одна соседняя. Ничего не удаляется, 301 не ставится.

## R0 — инфраструктура провенанса (без переписывания текста)

Пустой реестр обнуляет provenance (0/10) на всех 354 файлах и вешает
stamped-figure до −24 на каждый файл с ходовыми цифрами. Это чинится один раз:

1. `.content-os/facts.json`: ~30 несущих цифр с источниками — SRE-пошлина
   MXN 21,650 (DOF/SRE tarifas), ISR нерезидента 25% брутто (LISR Título V),
   IVA 16%, ISAI-диапазон 2–4.5% (столичный Código Fiscal и州ные), trust fee
   $500–800 (банковские тарифы), management 20–30%, closing 5–8%, 183 дня
   (CFF Art. 9), 50 км / 100 км (Конституция Art. 27), FMM 180 days и т.д.
2. `.content-os/external-claims.json`: ~14 внешних утверждений из волны персон —
   FBAR $10,000, FEIE ~$130,000, prohibited transactions/SDIRA, US CGT 15–23.8%;
   UK CGT 18/24%, IHT £325,000, HMRC SA106; ES Modelo 720 €50,000; FR IFI €1.3M;
   IT IVIE ~1.06%; NL box 3; CA T1135 CAD 100,000 и провинциальные day-counts.
   Каждому reviewBy = 2027-02-27.
3. Три мусорных обрывка июльского lift (обрезанные «Mexico Invest reviewed N%
   benchmarks on…»): `projects/palmilla-san-jose`, `guides/mexico-condo-investment-foreigners`,
   `guides/predial-riviera-maya-rates` — удаляются строки, не страницы.
4. 8 malformed-токенов («management Management» и т.п.) в файлах из диагностики.

Ожидание: mean растёт на десятки пунктов по всему корпусу без единого нового
абзаца — это честные баллы за уже существующую работу, которой не хватало
только источников.

## R1 — каннибалы (9 файлов, в т.ч. худшая пара корпуса)

Причина: FAQ-ответы и worked examples продублированы между гайдом и area;
одна проектная страница написана дважды.

| Файл | Балл | Тезис страницы (что держит только она) |
|---|---|---|
| guides/mexico-city-real-estate-foreigner-guide | 0 | ПРОЦЕСС покупки в CDMX: alcaldía-специфика, сейсмическая документация как шаг диligence, escritura-цепочка; worked example переезжает с Roma Norte на Нарварте/Del Valle |
| areas/mexico-city-roma-condesa | 0 | РЫНОК двух колоний: здания по эпохам, Zone III как ценовой фактор, микроаренда; FAQ переписаны без пересечения с гайдом |
| areas/queretaro | 6 | Вода как гейт сделки: factibilidad, аэрокосмический payroll как драйвер аренды |
| guides/guadalajara-real-estate-investment | 11 | Colonia-механика: почему правильный титул на неправильной улице не сдаётся; студенческая/корпоративная аренда |
| areas/oaxaca-city-real-estate | 18 | INAH-каталог и сейсмика адобе — единственная страница про пересечение наследия и структурной инженерии |
| areas/loreto-baja | 27 | Хрупкость авиамаршрутов и FONATUR-инфраструктура без спроса |
| areas/todos-santos | 36 | Аграрное происхождение земли и вода: dominio pleno как главный риск |
| projects/tao-monte-rocella | 0 | Здание №1 TAO: свои HOA до песо, фаза, поставка, окружение Акумаля |
| projects/tao-santamar-akumal | 0 | Здание №2 TAO: чем Santamar фактически отличается (цифры, а не прилагательные) |

## R2 — нулевые гайды (10 файлов)

Причина: июльский конвейер + дубли между процессными гайдами.

| Файл | Балл | Тезис |
|---|---|---|
| ampi-license-verify-guide | 0 | Проверка конкретного агента за 15 минут: реестр AMPI vs州ные реестры, что лицензия НЕ доказывает |
| apostille-documents-mexico-property | 0 | Какие документы апостилируются и кем в US/UK/CA, где вступает perito traductor |
| best-areas-invest-mexico-2026 | 0 | Хаб-маршрутизатор по критериям (бюджет/цель/риск) со ссылками — не пересказ area-страниц |
| cfdi-cost-basis-mexico | 0 | CFDI как единственное доказательство базы: сколько ISR стоит ремонт без фактуры |
| cross-border-lender-list | 0 | Почему список кредиторов короткий: реальные условия и 3 работающие альтернативы |
| first-time-foreign-buyer-mexico | 0 | Первая покупка как последовательность решений и ошибок первого раза (не процесс — он в других гайдах) |
| mexico-property-closing-costs-breakdown | 0 | noindex-страница; переписать как единственную полную построчную смету закрытия по штатам (решение о снятии noindex — за тобой) |
| non-resident-mortgage-mexico | 0 | Почему рынок кэшевый: ставки 10–13%, документы, 3 альтернативы финансирования |
| predial-riviera-maya-rates | 0 | Предиаль по муниципалитетам Ривьеры: базы, скидки за раннюю оплату, как читать счёт |
| translation-requirements-mexico-deed | 0 | Что нотариус обязан переводить, что нет, и что из этого стоит денег |

Пара для развода внутри R2: `ampi-license-verify-guide` ↔ `unregistered-broker-mexico` (2) —
первый держит механику проверки, второй — схемы и последствия.

## R3 — projects: 36 нулей в три подволны (R3a/R3b/R3c по 12)

Причина: конвейер — один каркас на 101 файл, 3 штампованных CTA
(«Want three options here with the numbers run?» ×113 и др.), дубли 3–6%
между соседями.

Принцип тезиса для каждой страницы: страница проекта держит ЗДАНИЕ —
точную HOA в песо, режим кондо, фазу и срок поставки, микроположение,
сравнение с 1–2 соседями по цифрам. CTA у каждой страницы свой.
Потезисная детализация каждой подволны — перед её стартом, после чтения
всех 12 страниц (тезисы по непрочитанным зданиям выдумывать не буду).

R3a (первые 12): tao-blue-gardens-pv, tulum-jungle-lofts, zen-tulum,
constelada-tulum, inna-beach-condos, it-building-playa, ocean-village-playa,
playa-emerald-studio, cancun-lagoon-lofts, puerto-cancun-marina,
nuevo-vallarta-bungalows, piedra-de-mar.
R3b: кампече-кластер (bao, campeche-gulf-villas, ikuku, lerma, olea, mukta-369)
+ sole-blu, hacienda-encantada, hard-rock-riviera-maya, hideaways-los-cabos,
la-reserva-querencia, chileno-bay-residences.
R3c: люкс-кластер (four-seasons ×2, montage, pendry, ritz-carlton, st-regis,
rosewood-mandarina, copala/coronado/mavila-quivira).

## R4 — нулевые areas и compare (7) + очистка malformed (8)

| Файл | Балл | Тезис |
|---|---|---|
| areas/playa-del-carmen | 0 | Улично-квартальная механика Playa: почему Centro и Playacar — разные рынки одной цены |
| areas/puerto-vallarta | 0 | Зоны PV по вертикали: Centro/Romántica vs Marina vs Conchas — кто в каком сегменте арендатор |
| areas/tulum-pueblo-east | 0 | Pueblo East как анти-Zama: земля, сервисы, кому он вообще нужен |
| compare/cabo-san-lucas-vs-san-jose-del-cabo | 0 | Одна бухта, два спроса: ночная экономика vs семейный сезон — числа ADR/сезонности |
| compare/pre-construction-vs-resale-tulum | 0 | Цена ожидания: сколько стоит год стройки в Тулуме в скидке и риске |
| compare/punta-mita-vs-los-cabos-luxury | 0 | Люкс-каннибал: клубная модель Punta Mita vs брендовые резиденции Кабо |
| + 8 файлов malformed | 1–36 | точечная чистка удвоенных слов (не переписывание) |

## R5 — хвост 1–14 баллов вне projects (20 файлов)

invest-in-playa-del-carmen (1), mexico-property-for-americans (1),
puerto-vallarta-property-investment-guide (1), remote-notarization-mexico (1),
commercial-property-mexico-foreigner (1), cabo-corridor (1), cancun (1),
nuevo-vallarta (2), mexico-property-taxes-explained (2), peso-mortgage-locals-only (2),
unregistered-broker-mexico (2), invest-in-los-cabos (2, noindex),
mexico-vs-spain-property-investment (3), liability-insurance-str-mexico (3),
cost-of-buying-property-mexico (4), fake-escritura-mexico (4),
hurricane-insurance-bcs (4), mexico-villa-investment (4),
invest-in-puerto-vallarta (5), luxury-investor-cabos-branded (5).
Тезисы — перед стартом волны, по той же дисциплине.

## Порядок и гейты

R0 → R1 → R2 → R3a → R3b → R3c → R4 → R5. После каждой волны: замер каждой
страницы, `validate:content`, перекрёстная проверка новых страниц на дубли
между собой, `geo:calibrate`, `facts:review`, `build`. Коммит с цифрами
«было → стало», пуш в рабочую ветку.

Не делается без отдельного разрешения: удаления, 301, снятие noindex,
изменение порогов скорера под собственный текст.
