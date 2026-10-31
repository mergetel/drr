// The DRR model and the share card. The generator and the leaderboard both use
// it, and tests/drr.test.mjs loads it in Node, so nothing here touches the page
// until draw() is handed a canvas.
(function (root) {
  const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "DejaVu Sans", sans-serif';
  const FALLBACK_NAME = 'Stealth Mode Inc.';

  // Each checkbox multiplies MRR. The letters are what the link stores, so
  // never reuse one for a different box: old links would change their number.
  const FLAGS = [
    { k: 'w', label: 'Has a waitlist', short: 'Waitlist', mult: 3, why: 'Demand is demand, even when it can\'t log in yet.' },
    { k: 'g', label: 'Logo is a gradient', short: 'Gradient logo', mult: 2.2, why: 'Investors see two colours and assume two products. Also adds 0.5 to growth.' },
    { k: 's', label: 'Posted the screenshot before the revenue existed', short: 'Screenshot first', mult: 4, why: 'Revenue follows the screenshot. The order is a detail.' },
    { k: 'd', label: 'Domain ends in .ai', short: '.ai domain', mult: 7, why: 'The domain costs more than the product makes, so it must be worth something.' },
    { k: 'u', label: 'Says "we" and it\'s just you', short: 'Royal we', mult: 1.5, why: 'A team of one that sounds like a team of forty.' },
    { k: 'm', label: 'Mercury is in retrograde', short: 'Mercury retrograde', mult: 0.88, why: 'Comms delays. The model is conservative.' },
  ];

  const DEFAULTS = { n: '', r: '', v: 80, a: 23, h: 5, p: 2, f: ['w', 'g'], x: false };

  const VIBES = [
    [0, 'rancid'], [1, 'off'], [21, 'mid'], [41, 'fine, honestly'],
    [61, 'good'], [81, 'immaculate'], [96, 'transcendent'],
  ];
  const vibeWord = (v) => VIBES.filter(([min]) => v >= min).pop()[1];

  function int(raw, lo, hi, fallback) {
    if (raw === null || raw === undefined || String(raw).trim() === '') return fallback;
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(hi, Math.max(lo, Math.round(n)));
  }

  function clean(s) {
    const r = int(s.r, 0, 999999999, null);
    return {
      n: String(s.n || '').slice(0, 24),
      r: r === null ? '' : r,
      v: int(s.v, 0, 100, DEFAULTS.v),
      a: int(s.a, 0, 500, DEFAULTS.a),
      h: int(s.h, 0, 12, DEFAULTS.h),
      p: int(s.p, 0, 30, DEFAULTS.p),
      f: FLAGS.map((f) => f.k).filter((k) => (s.f || []).includes(k)),
      x: Boolean(s.x),
    };
  }

  // An empty hash is a first visit, so it gets the defaults. Any other hash is a
  // permalink, and a key it leaves out means "off" or "use the default".
  function parse(hash) {
    const p = new URLSearchParams(String(hash || '').replace(/^#/, ''));
    if (![...p.keys()].length) return clean(DEFAULTS);
    return clean({
      n: p.get('n'), r: p.get('r'), v: p.get('v'), a: p.get('a'), h: p.get('h'), p: p.get('p'),
      f: (p.get('f') || '').split(''),
      x: p.get('x') === '1',
    });
  }

  function serialize(s) {
    const c = clean(s);
    const p = new URLSearchParams();
    if (c.n) p.set('n', c.n);
    p.set('v', c.v); p.set('a', c.a); p.set('h', c.h); p.set('p', c.p);
    p.set('f', c.f.join(''));
    if (c.x) p.set('x', '1');
    if (c.r !== '') p.set('r', c.r);
    return p.toString();
  }

  // The model. Same inputs, same number, every time.
  function compute(input) {
    const s = clean(input);
    const base = (40 + Math.pow(s.v, 1.6)) / 120;
    const agentic = 1 + s.a / 7;
    const sleep = Math.pow(2, 8 - s.h);
    const pivots = 1 + s.p / 2;
    const flags = FLAGS.filter((f) => s.f.includes(f.k)).reduce((m, f) => m * f.mult, 1);
    const mrr = Math.max(1, Math.round(base * agentic * sleep * pivots * flags));
    const growth = Math.round(Math.min(12, 2 + s.a / 50 + s.p / 4 + s.v / 100 + (s.f.includes('g') ? 0.5 : 0)) * 10) / 10;
    const arr = mrr * 12;
    const years = [];
    let year = arr;
    for (let k = 0; k < 10; k++) { years.push(year); year *= growth; }
    const total = years.reduce((a, b) => a + b, 0);
    return {
      state: s,
      name: s.n.trim() || FALLBACK_NAME,
      mrr, arr, growth, years,
      drr: s.x ? 0 : Math.round(total),
      doom: s.x,
    };
  }

  const SCALES = [
    [1e24, 'septillion'], [1e21, 'sextillion'], [1e18, 'quintillion'], [1e15, 'quadrillion'],
    [1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million'],
  ];

  function words(n) {
    const hit = SCALES.find(([v]) => n >= v);
    if (!hit) return n.toLocaleString('en-US');
    const x = n / hit[0];
    return `${x.toLocaleString('en-US', { maximumFractionDigits: x < 10 ? 2 : x < 100 ? 1 : 0 })} ${hit[1]}`;
  }

  // Every digit while it still fits, then words.
  const money = (n) => (n < 1e15 ? '$' + n.toLocaleString('en-US') : '$' + words(n));
  const short = (n) => (n < 1e6 ? '$' + n.toLocaleString('en-US') : '$' + words(n));

  function hash32(str) {
    let h = 2166136261;
    for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function post(m) {
    if (m.doom) {
      return `Update on ${m.name}: our DRR is $0.\n\nMRR is ${money(m.mrr)}. ARR is ${money(m.arr)}. We just don't think there's going to be a decade.\n\n(DRR is Decennial Recurring Revenue. I made it up.)`;
    }
    return `MRR is so last month. ARR is the new hotness.\n\n${m.name} just crossed ${money(m.drr)} DRR.\n\nThat's Decennial Recurring Revenue. Ten years, compounded at a conservative ${m.growth}x a year. Happy to share the deck.\n\n(I made DRR up. The number too.)`;
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function fit(ctx, text, max) {
    if (ctx.measureText(text).width <= max) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > max) t = t.slice(0, -1);
    return t.trimEnd() + '…';
  }

  // The 1200x630 share card. The MADE UP stamp, the $ axis and the yellow strip
  // are drawn into the image, so a cropped screenshot still reads as a joke.
  function draw(ctx, m, site) {
    const W = 1200, H = 630, s = m.state;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0b0a14');
    bg.addColorStop(1, m.doom ? '#1a0d12' : '#1b1040');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(980, 120, 0, 980, 120, 520);
    glow.addColorStop(0, m.doom ? 'rgba(248,113,113,0.16)' : 'rgba(34,211,238,0.18)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Header: name, the pill, the period.
    ctx.font = `700 30px ${FONT}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(m.name, 56, 66);
    const nameW = ctx.measureText(m.name).width;
    ctx.font = `800 14px ${FONT}`;
    const pill = 'DECENNIAL RECURRING REVENUE';
    const pillW = ctx.measureText(pill).width + 24;
    const pillX = 56 + nameW + 16;
    const pg = ctx.createLinearGradient(pillX, 0, pillX + pillW, 0);
    pg.addColorStop(0, '#22d3ee');
    pg.addColorStop(1, '#a78bfa');
    rr(ctx, pillX, 44, pillW, 28, 14);
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.fillStyle = '#0b0a14';
    ctx.fillText(pill, pillX + 12, 63);
    ctx.font = `500 18px ${FONT}`;
    const period = 'FY27 to FY36 · audited by vibes';
    if (pillX + pillW + 24 + ctx.measureText(period).width < W - 56) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#a29dc4';
      ctx.fillText(period, W - 56, 66);
      ctx.textAlign = 'left';
    }

    // The number.
    const big = m.doom ? '$0' : money(m.drr);
    let size = 112;
    ctx.font = `800 ${size}px ${FONT}`;
    while (size > 52 && ctx.measureText(big).width > 660) {
      size -= 4;
      ctx.font = `800 ${size}px ${FONT}`;
    }
    const bigW = ctx.measureText(big).width;
    if (m.doom) {
      ctx.fillStyle = '#9ca3af';
    } else {
      const ng = ctx.createLinearGradient(50, 0, 50 + bigW, 0);
      ng.addColorStop(0, '#67e8f9');
      ng.addColorStop(1, '#c4b5fd');
      ctx.fillStyle = ng;
    }
    ctx.fillText(big, 50, 180);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `700 34px ${FONT}`;
    ctx.fillText('DRR*', 50 + bigW + 14, 180);

    ctx.font = `600 22px ${FONT}`;
    if (m.doom) {
      ctx.fillStyle = '#fca5a5';
      ctx.fillText('Adjusted for the end of the world. A decade of revenue needs a decade.', 56, 224);
    } else {
      ctx.fillStyle = '#a5f3fc';
      const digits = Math.floor(Math.log10(m.drr)) + 1;
      const line = m.drr >= 1e15 ? `That's a ${digits} digit number. None of the digits are real.`
        : m.drr >= 1e6 ? `About ${words(m.drr)} dollars you haven't made yet.`
          : 'Ten years of revenue you haven\'t made yet.';
      ctx.fillText(line, 56, 224);
    }

    // Where it came from, in small type.
    const chips = [
      [`MRR ${short(m.mrr)}`, 'made up'],
      [`ARR ${short(m.arr)}`, 'MRR x 12'],
      m.doom ? ['DRR $0', 'you ticked the box'] : [`${m.growth}x a year`, 'for ten years'],
    ];
    let cx = 56;
    chips.forEach(([main, sub], i) => {
      ctx.font = `700 17px ${FONT}`;
      const mw = ctx.measureText(main).width;
      ctx.font = `500 15px ${FONT}`;
      const sw = ctx.measureText(sub).width;
      const w = mw + sw + 34;
      rr(ctx, cx, 248, w, 34, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 17px ${FONT}`;
      ctx.fillText(main, cx + 12, 271);
      ctx.fillStyle = '#a29dc4';
      ctx.font = `500 15px ${FONT}`;
      ctx.fillText(sub, cx + 22 + mw, 271);
      cx += w;
      if (i < chips.length - 1) {
        ctx.fillStyle = '#6b6790';
        ctx.font = `700 20px ${FONT}`;
        ctx.fillText('→', cx + 8, 272);
        cx += 36;
      }
    });

    // The decade, one bar a year.
    const x0 = 120, x1 = 700, y0 = 318, y1 = 512;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#6b7280';
    ctx.font = `600 17px ${FONT}`;
    ctx.textAlign = 'right';
    ['$$$$', '$$$', '$$', '$'].forEach((label, i) => {
      const y = y0 + (i / 3) * (y1 - y0);
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      ctx.fillText(label, x0 - 14, y + 6);
    });
    const slot = (x1 - x0) / 10;
    const top = m.years[9];
    ctx.textAlign = 'center';
    m.years.forEach((v, k) => {
      const bx = x0 + k * slot + 6;
      const bw = slot - 12;
      const bh = m.doom ? 3 : Math.max(3, (v / top) * (y1 - y0));
      if (m.doom) {
        ctx.fillStyle = 'rgba(156,163,175,0.5)';
      } else {
        const bg2 = ctx.createLinearGradient(0, y1 - bh, 0, y1);
        bg2.addColorStop(0, '#a78bfa');
        bg2.addColorStop(1, '#22d3ee');
        ctx.fillStyle = bg2;
      }
      rr(ctx, bx, y1 - bh, bw, bh, Math.min(6, bh / 2));
      ctx.fill();
      ctx.fillStyle = '#8b87ad';
      ctx.font = `500 14px ${FONT}`;
      ctx.fillText(`FY${27 + k}`, bx + bw / 2, y1 + 22);
    });
    if (m.doom) {
      ctx.fillStyle = '#fca5a5';
      ctx.font = `700 24px ${FONT}`;
      ctx.fillText('FY27 to FY36: cancelled', (x0 + x1) / 2, (y0 + y1) / 2 + 8);
    }
    ctx.textAlign = 'left';

    // The inputs, so the number shows its work.
    const px = 748, py = 300, pw = W - 56 - px, ph = 248;
    rr(ctx, px, py, pw, ph, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.fillStyle = '#a29dc4';
    ctx.font = `800 13px ${FONT}`;
    ctx.fillText('INPUTS, AUDITED BY VIBES', px + 18, py + 28);
    // The ticked boxes wrap onto a second line rather than vanish.
    ctx.font = `600 16px ${FONT}`;
    const ticked = FLAGS.filter((f) => s.f.includes(f.k)).map((f) => f.short);
    const flagMax = pw - 36 - 70;
    const fits = (t) => ctx.measureText(t).width <= flagMax;
    const rest = ticked.slice();
    const first = [];
    while (rest.length && (!first.length || fits([...first, rest[0]].join(', ') + ','))) first.push(rest.shift());
    const flagLines = [first.join(', ') + (rest.length ? ',' : '')];
    if (rest.length && fits(rest.join(', '))) {
      flagLines.push(rest.join(', '));
    } else if (rest.length) {
      let k = rest.length - 1;
      while (k > 0 && !fits(`${rest.slice(0, k).join(', ')}, +${rest.length - k} more`)) k--;
      flagLines.push(k ? `${rest.slice(0, k).join(', ')}, +${rest.length - k} more` : `+${rest.length} more`);
    }
    const rows = [
      ['Vibes', `${s.v}/100, ${vibeWord(s.v)}`],
      ['Said "agentic"', `${s.a} times this week`],
      ['Slept', `${s.h} hour${s.h === 1 ? '' : 's'}`],
      ['Pivots', String(s.p)],
      ['Also', flagLines[0] || 'nothing ticked'],
      ...(flagLines[1] ? [['', flagLines[1]]] : []),
      ['Actual revenue', `${s.r === '' ? 'not provided' : short(s.r)}, not material`],
      ['AI will kill us all', m.doom ? 'yes' : 'no'],
    ];
    rows.forEach(([label, value], i) => {
      const y = py + 56 + i * 24;
      ctx.font = `500 16px ${FONT}`;
      ctx.fillStyle = '#a29dc4';
      ctx.fillText(label, px + 18, y);
      const room = pw - 36 - (label ? ctx.measureText(label).width + 16 : 0);
      ctx.textAlign = 'right';
      ctx.font = `600 16px ${FONT}`;
      ctx.fillStyle = label.startsWith('AI') && m.doom ? '#fca5a5' : '#ffffff';
      ctx.fillText(fit(ctx, value, room), px + pw - 18, y);
      ctx.textAlign = 'left';
    });

    // The stamp. It sits on top of everything, on purpose.
    ctx.save();
    ctx.translate(1000, 152);
    ctx.rotate((-(6 + (hash32(m.name) % 9)) * Math.PI) / 180);
    ctx.font = `900 64px ${FONT}`;
    const stamp = 'MADE UP';
    const stw = ctx.measureText(stamp).width + 44;
    ctx.globalAlpha = 0.88;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 6;
    rr(ctx, -stw / 2, -46, stw, 92, 10);
    ctx.stroke();
    ctx.lineWidth = 2;
    rr(ctx, -stw / 2 + 9, -37, stw - 18, 74, 6);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stamp, 0, 3);
    ctx.restore();

    // The strip, baked into the PNG.
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, H - 40, W, 40);
    ctx.fillStyle = '#111111';
    ctx.font = `700 17px ${FONT}`;
    ctx.textBaseline = 'middle';
    ctx.fillText('*DRR = Decennial Recurring Revenue. 100% made up. Not revenue.', 56, H - 20);
    ctx.textAlign = 'right';
    ctx.fillText(`DRR generator · ${site}`, W - 56, H - 20);
    ctx.restore();
  }

  // The leaderboard. Every company is made up, and each one's number comes
  // from compute(), so its row and its card always agree. Names fit the
  // card's 24 character field, and the tests check that.
  const COMPANIES = [
    { n: 'Waitlist for a Waitlist', v: 91, a: 140, h: 4, p: 3, f: 'wgsdu', note: 'The waitlist has a waitlist. Nobody has seen the product, which is the product.' },
    { n: 'Agents for Your Agents', v: 77, a: 412, h: 3, p: 1, f: 'dsu', note: 'Said "agentic" 412 times this week. Twice in their sleep, which they didn\'t get much of.' },
    { n: 'Uber for Pivots', v: 64, a: 38, h: 5, p: 22, f: 'wgu', note: 'Twenty-two pivots, and every one of them was the real company.' },
    { n: 'Gradient on a Gradient', v: 99, a: 12, h: 6, p: 0, f: 'gd', note: 'The logo has a gradient. The gradient has a logo.' },
    { n: 'Four Hours of Sleep', v: 58, a: 61, h: 0, p: 4, f: 'su', note: 'Zero hours last night. The model doubles DRR for every hour you skip.' },
    { n: 'Screenshot First', v: 83, a: 27, h: 5, p: 2, f: 'swm', note: 'Posted the revenue chart in March. The revenue is booked for 2029.' },
    { n: 'Cold Plunge as a Service', v: 72, a: 9, h: 7, p: 6, f: 'wg', note: 'Hardware is hard, so they sell the cold.' },
    { n: 'Todo App, but Agentic', v: 45, a: 88, h: 6, p: 1, f: 'd', note: 'The todo app. Again. This time it does the todos.' },
    { n: 'Pre-revenue Forever', v: 70, a: 15, h: 8, p: 9, f: 'wm', note: 'Retrograde hit them hard this quarter.' },
    { n: 'Honest Spreadsheet Co.', v: 30, a: 0, h: 8, p: 0, f: '', note: 'Typed their real numbers into the real box. The model ignored them, as designed.', r: 212 },
    { n: 'Alignment Is Hard LLC', v: 95, a: 300, h: 2, p: 5, f: 'wgsdu', x: true, note: 'Would be first. Ticked the box.' },
    { n: 'Doomscroll Capital', v: 12, a: 66, h: 3, p: 11, f: 'gdm', x: true, note: 'Also ticked the box. Says it\'s priced in.' },
  ].map((c) => ({ ...c, f: c.f.split('') }));

  root.DRR = { FONT, FLAGS, DEFAULTS, COMPANIES, vibeWord, clean, parse, serialize, compute, money, short, words, post, draw };
})(typeof window !== 'undefined' ? window : globalThis);
