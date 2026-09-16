#!/usr/bin/env node
/**
 * Класс цвета в разметке должен доходить до экрана.
 *
 * Tailwind v4 кладёт свои утилиты в @layer utilities. Правило, написанное ВНЕ слоя, бьёт любое
 * правило внутри слоя независимо от веса селектора. Поэтому одна строка
 *
 *     a { color: var(--color-teal); }
 *
 * вне слоя отменяет class="text-[#d6d3d1]" на каждой ссылке сайта, и разметка врёт: в ней стоит
 * светлый цвет, а рисуется зелёный. Замерено 16.09.2026 на пяти сайтах, в подвалах вышло от 2.26
 * до 4.37 контраста при норме 4.5.
 *
 * Лечится тем, что собственные правила для голых тегов лежат в @layer base. Проверка сторожит,
 * чтобы они туда не выпали обратно.
 *
 *   node scripts/test-css-layers.mjs
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Через pathname нельзя: в пути есть кириллица, и она пришла бы процентными кодами.
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const PAINTS = /(^|[;{])\s*(color|background|background-color)\s*:/;

function sources() {
  const out = [];
  const styles = join(ROOT, 'src/styles');
  if (existsSync(styles)) {
    for (const name of readdirSync(styles)) {
      if (name.endsWith('.css')) out.push({ file: `src/styles/${name}`, css: readFileSync(join(styles, name), 'utf8') });
    }
  }
  // Только глобальные блоки: обычный <style> в Astro привязан к компоненту и с утилитами не спорит.
  for (const dir of ['src/layouts', 'src/components', 'src/pages']) {
    const full = join(ROOT, dir);
    if (!existsSync(full)) continue;
    for (const name of readdirSync(full)) {
      if (!name.endsWith('.astro')) continue;
      const text = readFileSync(join(full, name), 'utf8');
      for (const m of text.matchAll(/<style\s+is:(?:inline|global)[^>]*>([\s\S]*?)<\/style>/g)) {
        // Смещение, чтобы номер строки в отчёте был номером строки в файле, а не в блоке.
        const offset = text.slice(0, m.index + m[0].indexOf(m[1])).split('\n').length - 1;
        out.push({ file: `${dir}/${name}`, css: m[1], offset });
      }
    }
  }
  return out;
}

/*
 * html и body не считаем: их цвет только наследуется, утилита на самом теге body не ставится
 * почти никогда, а критический CSS в шапке на многих сайтах красит body намеренно.
 */
const INHERITED_ONLY = /^(html|body)$/;

/** Селектор считается голым тегом, если в нём нет ни класса, ни идентификатора, ни атрибута. */
function isBareElement(selector) {
  const s = selector.trim();
  if (!s || s.startsWith('@') || s.startsWith('%')) return false;
  if (INHERITED_ONLY.test(s)) return false;
  if (/[.#\[]/.test(s)) return false;
  if (/^(from|to|\d+%)$/.test(s)) return false;
  const stripped = s.replace(/::?[a-z-]+(\([^)]*\))?/gi, '').replace(/[>+~*]/g, ' ').trim();
  if (!stripped) return false;
  return stripped.split(/\s+/).every((part) => /^[a-z][a-z0-9]*$/i.test(part));
}

const errors = [];

for (const { file, css, offset = 0 } of sources()) {
  // Комментарии заменяем переводами строк, а не убираем: иначе номера строк в отчёте уедут.
  const text = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  let i = 0;
  let selectorStart = 0;

  const skipBlock = (from) => {
    let depth = 0;
    let j = from;
    while (j < text.length) {
      if (text[j] === '{') depth++;
      else if (text[j] === '}') { depth--; if (depth === 0) return j + 1; }
      j++;
    }
    return text.length;
  };

  while (i < text.length) {
    const ch = text[i];
    if (ch === '{') {
      const selector = text.slice(selectorStart, i).trim();
      // @layer и печать пропускаем целиком: внутри слоя обычный порядок, печать утилитам не мешает.
      if (/^@layer\b/.test(selector) || /^@media\s+print\b/.test(selector)) {
        i = skipBlock(i);
        selectorStart = i;
        continue;
      }
      // Прочие @-правила прозрачны: правило внутри @media или @supports так же лежит вне слоя.
      if (selector.startsWith('@')) {
        i++;
        selectorStart = i;
        continue;
      }
      const end = skipBlock(i);
      const body = text.slice(i + 1, end - 1);
      if (PAINTS.test(body) && selector.split(',').some(isBareElement)) {
        const line = text.slice(0, selectorStart).split('\n').length + offset;
        errors.push(`${file}:${line}  ${selector.replace(/\s+/g, ' ')} красит тег вне слоя, утилиты Tailwind до него не достанут`);
      }
      i = end;
      selectorStart = i;
      continue;
    }
    if (ch === '}') { i++; selectorStart = i; continue; }
    i++;
  }
}

if (errors.length) {
  for (const e of errors) console.error(`FAIL ${e}`);
  console.error(`\nправил вне слоя: ${errors.length}. Завернуть их в @layer base.`);
  process.exit(1);
}
console.log('ok   собственные правила для голых тегов лежат в слоях, классы цвета работают');
