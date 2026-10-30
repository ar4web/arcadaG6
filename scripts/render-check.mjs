/**
 * Renders every route through the SSR build inside a happy-dom window.
 * Catches runtime errors (hook order, undefined access, missing providers)
 * that type-checking cannot see. Run with: node scripts/render-check.mjs
 */
import { Window } from 'happy-dom';
import { renderPrimitives, renderRoute, renderWidgets } from '../dist-ssr/entry-server.js';

const ROUTES = [
  '/hr', '/hr/people', '/hr/org', '/hr/leave', '/hr/attendance', '/hr/recruitment',
  '/hr/performance', '/hr/analytics', '/hr/compliance', '/hr/documents', '/hr/settings', '/hr/audit',
  '/me', '/me/leave', '/me/payslips', '/me/attendance', '/me/profile', '/me/expenses', '/me/goals', '/me/documents',
  '/finance', '/finance/payroll', '/finance/expenses', '/finance/invoices', '/finance/compliance', '/finance/reports', '/finance/attendance',
  '/signin', '/help', '/docs', '/nope',
];

const window = new Window({ url: 'http://localhost/' });
globalThis.window = window;
globalThis.document = window.document;
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
globalThis.location = window.location;
globalThis.HTMLElement = window.HTMLElement;
globalThis.Element = window.Element;
globalThis.Node = window.Node;
globalThis.localStorage = window.localStorage;
globalThis.sessionStorage = window.sessionStorage;
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.matchMedia =
  window.matchMedia?.bind(window) ??
  (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);

const errors = [];
const originalError = console.error;
console.error = (...args) => {
  const message = args.map((arg) => (arg instanceof Error ? arg.message : String(arg))).join(' ');
  if (/not wrapped in act|useLayoutEffect does nothing|Warning: ReactDOMServer/.test(message)) return;
  errors.push(message);
};

const SUSPECT = [/\bundefined\b/, /\bNaN\b/, /Invalid Date/, /\[object Object\]/];
const smells = [];
const inspect = (label, html) => {
  for (const pattern of SUSPECT) {
    const match = html.match(pattern);
    if (!match) continue;
    const at = html.indexOf(match[0]);
    smells.push(`${label}: "${match[0]}" near …${html.slice(Math.max(0, at - 60), at + 40).replace(/\s+/g, ' ')}…`);
  }
};

let failed = 0;
for (const route of ROUTES) {
  try {
    const html = renderRoute(route);
    const ok = html.length > 1200;
    if (!ok) failed += 1;
    inspect(route, html);
    process.stdout.write(`${ok ? 'PASS' : 'FAIL'}  ${route.padEnd(22)} ${String(html.length).padStart(7)} chars\n`);
  } catch (error) {
    failed += 1;
    process.stdout.write(`FAIL  ${route.padEnd(22)} THREW\n`);
    originalError(error);
  }
}

// Dashboard widgets with a fully populated analytics snapshot.
try {
  const { html, count } = renderWidgets();
  const ok = html.length > 4000;
  if (!ok) failed += 1;
  inspect('widgets', html);
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'}  ${'widgets (all)'.padEnd(22)} ${String(html.length).padStart(7)} chars  [${count} widgets]\n`);
} catch (error) {
  failed += 1;
  process.stdout.write(`FAIL  ${'widgets (all)'.padEnd(22)} THREW\n`);
  originalError(error);
}

// UI kit primitives (calendar, slider, command, avatars).
try {
  const html = renderPrimitives();
  const ok = html.length > 1500 && html.includes('rdp') || html.includes('grid');
  if (!ok) failed += 1;
  inspect('primitives', html);
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'}  ${'ui primitives'.padEnd(22)} ${String(html.length).padStart(7)} chars\n`);
} catch (error) {
  failed += 1;
  process.stdout.write(`FAIL  ${'ui primitives'.padEnd(22)} THREW\n`);
  originalError(error);
}

if (smells.length) {
  console.log(`\n${smells.length} suspicious render output(s):`);
  for (const smell of [...new Set(smells)].slice(0, 20)) console.log('  -', smell.slice(0, 300));
}

console.error = originalError;
if (errors.length) {
  console.log(`\n${errors.length} console error(s):`);
  for (const message of [...new Set(errors)].slice(0, 15)) console.log('  -', message.slice(0, 300));
}
console.log(failed ? `\n${failed} route(s) failed` : '\nAll routes rendered');
await window.close();
process.exit(failed ? 1 : 0);
