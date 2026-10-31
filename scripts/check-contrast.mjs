/**
 * WCAG contrast audit for the design tokens in src/index.css.
 *
 * Parses the raw token blocks, resolves `var()` and `color-mix()` chains, and
 * checks the pairs the UI actually renders. Run with `npm run check:contrast`.
 */
import { readFileSync } from 'node:fs';

const css = readFileSync(process.argv[2] ?? 'src/index.css', 'utf8');

function block(selector) {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) return {};
  const end = css.indexOf('\n}', start);
  const body = css.slice(start, end);
  const tokens = {};
  for (const match of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

const themes = {
  dark: { ...block(':root'), ...block('[data-hc=\'true\']') },
  light: { ...block(':root'), ...block('[data-theme=\'light\']') },
  'light-hc': { ...block(':root'), ...block('[data-theme=\'light\']'), ...block('[data-theme=\'light\'][data-hc=\'true\']') },
};

const hexToRgb = (hex) => {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

const channel = (value) => {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

const contrast = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

function resolve(tokens, name, depth = 0) {
  if (depth > 8) throw new Error(`resolution loop at ${name}`);
  const raw = tokens[name];
  if (!raw) throw new Error(`missing token ${name}`);

  const value = raw.trim();

  const mix = value.match(/^color-mix\(in srgb,\s*(.+?)\s+(\d+)%,\s*(.+)\)$/);
  if (mix) {
    const a = resolveValue(tokens, mix[1], depth + 1);
    const b = resolveValue(tokens, mix[3], depth + 1);
    const t = Number(mix[2]) / 100;
    return a.map((c, i) => Math.round(c * t + b[i] * (1 - t)));
  }

  return resolveValue(tokens, value, depth + 1);
}

function resolveValue(tokens, value, depth) {
  const varMatch = value.match(/^var\((--[a-z0-9-]+)\)$/);
  if (varMatch) return resolve(tokens, varMatch[1], depth);
  if (value.startsWith('#')) return hexToRgb(value);
  const rgb = value.match(/^(\d+)\s+(\d+)\s+(\d+)$/);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  throw new Error(`unsupported value: ${value}`);
}

/** [foreground, background, minimum ratio, usage] */
const PAIRS = [
  ['--ink', '--canvas', 7, 'body text on canvas'],
  ['--ink', '--surface', 7, 'body text on cards'],
  ['--ink-2', '--surface', 4.5, 'secondary text on cards'],
  ['--ink-3', '--surface', 4.5, 'muted text on cards'],
  ['--ink-4', '--surface', 3, 'metadata on cards'],
  ['--primary-contrast', '--primary', 4.5, 'primary button label'],
  ['--accent-contrast', '--accent', 4.5, 'accent button label'],
  ['--accent-2-contrast', '--accent-2', 4.5, 'secondary (orange) button label'],
  ['--primary', '--surface', 3, 'link and active icon'],
  ['--primary-ink', '--primary-soft', 4.5, 'sidebar active item'],
  ['--success-ink', '--success-soft', 4.5, 'success badge'],
  ['--warning-ink', '--warning-soft', 4.5, 'warning badge'],
  ['--danger-ink', '--danger-soft', 4.5, 'danger badge'],
  ['--info-ink', '--info-soft', 4.5, 'info badge'],
  ['--accent-ink', '--accent-soft', 4.5, 'accent badge'],
];

let failures = 0;
for (const [themeName, tokens] of Object.entries(themes)) {
  console.log(`\n${themeName}`);
  for (const [fg, bg, min, usage] of PAIRS) {
    let ratio;
    try {
      ratio = contrast(resolve(tokens, fg), resolve(tokens, bg));
    } catch (error) {
      failures += 1;
      console.log(`  ERR  ${fg} on ${bg} — ${error.message}`);
      continue;
    }
    const ok = ratio >= min;
    if (!ok) failures += 1;
    console.log(`  ${ok ? 'PASS' : 'FAIL'} ${ratio.toFixed(2).padStart(6)} : 1  (min ${min})  ${fg} on ${bg} — ${usage}`);
  }
}

console.log(failures ? `\n${failures} contrast failure(s)` : '\nAll contrast checks passed');
process.exit(failures ? 1 : 0);
