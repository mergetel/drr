// Loads assets/drr.js the way a browser would, minus the browser, and checks
// the promises the site makes: a link always draws the same number, the AI box
// always gives $0, and nothing overflows into Infinity.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../assets/drr.js', import.meta.url), 'utf8');
const sandbox = { URLSearchParams };
sandbox.window = sandbox;
vm.runInNewContext(src, sandbox);
const DRR = sandbox.DRR;

const all = { n: 'Max Everything', v: 100, a: 500, h: 0, p: 30, f: ['w', 'g', 's', 'd', 'u'], x: false };
const none = { n: 'Min Everything', v: 0, a: 0, h: 12, p: 0, f: [], x: false };

test('an empty hash gets the defaults', () => {
  assert.deepEqual(DRR.parse(''), DRR.clean(DRR.DEFAULTS));
  assert.deepEqual(DRR.parse('#'), DRR.clean(DRR.DEFAULTS));
});

test('a permalink round trips to the same state and the same number', () => {
  for (const s of [DRR.DEFAULTS, all, none, ...DRR.COMPANIES]) {
    const hash = '#' + DRR.serialize(s);
    const back = DRR.parse(hash);
    assert.deepEqual(back, DRR.clean(s), hash);
    assert.equal(DRR.compute(back).drr, DRR.compute(s).drr, hash);
    assert.equal(DRR.serialize(back), DRR.serialize(s), 'serialize is stable');
  }
});

test('this exact link always draws this exact number', () => {
  // Changing the model changes every shared card. If this fails on purpose,
  // say so in the PR, because every old link now shows a different number.
  const m = DRR.compute(DRR.parse('#n=Acme&v=80&a=23&h=5&p=2&f=wg'));
  assert.equal(m.mrr, 4333);
  assert.equal(m.growth, 4.3);
  assert.equal(m.drr, 34051821649);
});

test('AI will kill us all gives $0, whatever else is set', () => {
  for (const s of [DRR.DEFAULTS, all, none, ...DRR.COMPANIES]) {
    const m = DRR.compute({ ...s, x: true });
    assert.equal(m.drr, 0);
    assert.equal(m.doom, true);
    assert.ok(m.mrr >= 1, 'MRR stays on the card');
  }
  assert.equal(DRR.compute(DRR.parse('#v=100&a=500&h=0&p=30&f=wgsdu&x=1')).drr, 0);
});

test('fewer hours slept means more DRR', () => {
  let prev = Infinity;
  for (let h = 0; h <= 12; h++) {
    const d = DRR.compute({ ...DRR.DEFAULTS, h }).drr;
    assert.ok(d < prev, `h=${h}`);
    prev = d;
  }
});

test('the extremes stay finite and positive', () => {
  for (const s of [all, none]) {
    const m = DRR.compute(s);
    assert.ok(Number.isFinite(m.drr) && m.drr > 0, JSON.stringify(m));
  }
  assert.ok(DRR.compute(all).drr > DRR.compute(none).drr);
});

test('junk in the hash is clamped, not trusted', () => {
  const s = DRR.parse('#v=9000&a=-4&h=abc&p=1e9&f=zzwq&x=yes&r=-1&n=' + 'x'.repeat(40));
  assert.equal(s.v, 100);
  assert.equal(s.a, 0);
  assert.equal(s.h, DRR.DEFAULTS.h);
  assert.equal(s.p, 30);
  assert.deepEqual([...s.f], ['w']);
  assert.equal(s.x, false);
  assert.equal(s.r, 0);
  assert.equal(s.n.length, 24);
});

test('actual revenue never changes the number', () => {
  const base = DRR.compute({ ...DRR.DEFAULTS, r: '' }).drr;
  for (const r of [0, 1, 212, 999999999]) assert.equal(DRR.compute({ ...DRR.DEFAULTS, r }).drr, base);
});

test('leaderboard names fit the card, and the two doomed ones are at $0', () => {
  for (const c of DRR.COMPANIES) assert.ok(c.n.length <= 24, c.n);
  const doomed = DRR.COMPANIES.filter((c) => c.x).map((c) => DRR.compute(c).drr);
  assert.deepEqual(Array.from(doomed), [0, 0]);
});

test('flag letters are unique', () => {
  const keys = DRR.FLAGS.map((f) => f.k);
  assert.equal(new Set(keys).size, keys.length);
});

// A canvas that records text instead of drawing it. Enough to prove draw()
// finishes and puts the stamp and the strip into every card.
function fakeCtx() {
  const texts = [];
  let font = '16px sans';
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({}, {
    get(_, key) {
      if (key === 'texts') return texts;
      if (key === 'font') return font;
      if (key === 'fillText') return (t) => texts.push(String(t));
      if (key === 'measureText') return (t) => ({ width: String(t).length * (Number((/(\d+)px/.exec(font) || [])[1]) || 16) * 0.55 });
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient;
      return () => {};
    },
    set(_, key, value) { if (key === 'font') font = value; return true; },
  });
  return ctx;
}

test('every card draws to the end, with its stamp and strip', () => {
  for (const s of [DRR.DEFAULTS, all, none, ...DRR.COMPANIES, { ...all, x: true }, { ...none, f: ['m'] }]) {
    const ctx = fakeCtx();
    const m = DRR.compute(s);
    DRR.draw(ctx, m, 'example.test');
    const t = ctx.texts;
    assert.ok(t.includes('MADE UP'), `${m.name}: stamp`);
    assert.ok(t.some((x) => x.startsWith('*DRR = Decennial Recurring Revenue')), `${m.name}: strip`);
    assert.ok(t.includes('DRR generator · example.test'), `${m.name}: domain`);
    if (m.doom) assert.ok(t.includes('$0'), `${m.name}: $0`);
  }
});
