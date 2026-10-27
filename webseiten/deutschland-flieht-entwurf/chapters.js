/* ===========================================================================
 * Pixel-Körnung auf allen schwarzen Flächen
 *
 * Gleiche Optik wie oben auf der Seite (hohe Kontraste, 10 % Deckkraft, rund
 * 10 Bilder pro Sekunde), aber ohne Canvas-Zeichnen pro Bild: Eine einzige
 * Rauschkachel wird einmal erzeugt und per CSS-Sprüngen verschoben. Das kostet
 * keine Rechenzeit im Skript. Nur sichtbare Flächen laufen, reduzierte
 * Bewegung zeigt ein Standbild.
 * ======================================================================== */
(function koernung() {
  const FLAECHEN = ['.emigration', '.sf-sheet', '.pk', '.dev', '.atl', '.foot', '.sh', '.sec', '.cta-band'];
  if (document.documentElement.dataset.koernung) return;
  document.documentElement.dataset.koernung = '1';

  /* Kachel einmal erzeugen: gleiche Helligkeitsstufen wie die Körnung oben */
  const kachel = document.createElement('canvas');
  kachel.width = kachel.height = 512;
  const ctx = kachel.getContext('2d');
  if (!ctx) return;
  const bild = ctx.createImageData(512, 512);
  let seed = 0x5f3759df;
  for (let i = 0; i < bild.data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const s = seed / 4294967296;
    const v = s < 0.23 ? 0 : s < 0.38 ? 80 : s < 0.55 ? 170 : 255;
    bild.data[i] = bild.data[i + 1] = bild.data[i + 2] = v;
    bild.data[i + 3] = 255;
  }
  ctx.putImageData(bild, 0, 0);
  document.documentElement.style.setProperty('--koernung', 'url(' + kachel.toDataURL('image/png') + ')');

  let st = 0;
  addEventListener('scroll', () => {
    document.documentElement.classList.add('is-scrolling');
    clearTimeout(st);
    st = setTimeout(() => document.documentElement.classList.remove('is-scrolling'), 160);
  }, { passive: true });

  const flaechen = [...new Set(FLAECHEN.flatMap((s) => [...document.querySelectorAll(s)]))];
  const live = 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = live
    ? new IntersectionObserver(
        (eintraege) => eintraege.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting)),
        { rootMargin: '120px' },
      )
    : null;
  for (const el of flaechen) {
    const k = document.createElement('i');
    k.className = 'koernung';
    k.setAttribute('aria-hidden', 'true');
    /* .dev hat ein Hintergrundbild als Kind: Körnung kommt darüber (später im DOM), sonst davor */
    if (el.matches('.dev')) el.append(k);
    else el.prepend(k);
    if (io) io.observe(k);
  }
})();

/* ===========================================================================
 * Kapitel 03–06: Auslöser, Ausklapp-Zeilen, Scroll-Kopplung, Wortleuchten (vanilla)
 * ========================================================================= */
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const $ = (selector, root = document) => root.querySelector(selector);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x) => x * x * (3 - 2 * x);

const hero = $('.hero');
const globe = $('.stories-globe');
const chgWrap = $('.chg-wrap');
const chg = $('.chg');
const pk = $('.pk');
const devWrap = $('.dev-wrap');
const atl = $('.atl');

/* --- Einblenden, sobald ein Kapitel ins Bild kommt --------------------------- */
function onceVisible(element, className, margin, target = element) {
  if (!element) return;
  if (reduce.matches || !('IntersectionObserver' in window)) {
    element.classList.add(className);
    return;
  }
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      element.classList.add(className);
    },
    { rootMargin: margin },
  );
  io.observe(target);
}
onceVisible(chg, 'is-in', '0px 0px -22% 0px', chgWrap);
onceVisible(pk, 'is-in', '0px 0px -24% 0px');
onceVisible(devWrap, 'is-in', '0px 0px -18% 0px');
onceVisible(atl, 'is-in', '0px 0px -10% 0px');

/* Karten pendeln erst, nachdem alle eingefallen sind (sonst würde der Einfall neu starten) */
if (pk) {
  const settle = () => pk.classList.add('is-settled');
  if (reduce.matches) settle();
  else {
    const watch = new MutationObserver(() => {
      if (!pk.classList.contains('is-in')) return;
      watch.disconnect();
      setTimeout(settle, 4600);
    });
    watch.observe(pk, { attributes: true, attributeFilter: ['class'] });
  }
}

/* --- Forderungen: Zeilen zum Ausklappen (eine offen) --------------------------- */
const rows = [...document.querySelectorAll('.chg__row')];
rows.forEach((row) => {
  const head = $('.chg__head', row);
  head?.addEventListener('click', () => {
    const open = !row.classList.contains('is-open');
    rows.forEach((other) => {
      other.classList.remove('is-open');
      $('.chg__head', other)?.setAttribute('aria-expanded', 'false');
    });
    if (open) {
      row.classList.add('is-open');
      head.setAttribute('aria-expanded', 'true');
    }
  });
});

/* --- Atlas-Zitat: Wörter einzeln vorbereiten --------------------------------- */
const quote = $('.atl__q');
let words = [];
if (quote) {
  const text = quote.textContent.trim();
  quote.textContent = '';
  quote.setAttribute('aria-label', text);
  words = text.split(/\s+/).map((word, index, all) => {
    const span = document.createElement('span');
    span.className = 'w';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = word + (index < all.length - 1 ? ' ' : '');
    quote.append(span);
    return span;
  });
}

/* ===========================================================================
 * Scroll-Engine: eine Bewegungssprache für alle Übergänge
 *
 *  - Alles läuft über CSS-Variablen (0..1), geschrieben aus EINER Schleife.
 *  - Jede Variable folgt ihrem Zielwert mit Trägheit (ease-out-Gefühl, kein Ruckeln
 *    bei Mausrad-Sprüngen).
 *  - Nur transform/opacity/clip-path/scale/translate werden darüber animiert.
 *  - Reduzierte Bewegung: alle Variablen stehen sofort auf dem Endwert.
 *
 *  Namen:  --ov2  Globus wird überdeckt   --rw   roter Keil rollt auf
 *          --chx  Rot weicht zurück       --pkx  Postkarten weichen zurück
 *          --dve  Papier-Keil kommt       --dvp  Skyline-Parallax   --dvx  Papier weicht
 *          --ae   Atlas kommt             --ap   Atlas-Parallax     --ed   Kantenlinie zeichnet sich
 * ======================================================================== */
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
/* Fortschritt: 0 sobald die Oberkante bei `from` x Fensterhöhe liegt, 1 bei `to` x Fensterhöhe */
const progress = (el, from, to) => {
  const vh = window.innerHeight;
  return clamp((vh * from - el.getBoundingClientRect().top) / (vh * (from - to)));
};

const tracks = [];
/* Handy: nur Einblendungen (--rw, --ae, --ln) laufen mit; Zurückweichen, Parallax und Abdunkeln entfallen (spart Arbeit pro Bild) */
const MOBILE = matchMedia('(max-width: 760px)').matches;
const MOBILE_OK = ['--rw', '--ae', '--ln'];
function track(el, name, get, final = 1, extra = null, snap = false) {
  if (MOBILE && !MOBILE_OK.includes(name)) return;
  const els = extra || (el ? [el] : []);
  if (el && els.length) tracks.push({ el, els, name, get, final, snap, cur: null, last: -1, target: 0 });
}

track(hero, '--hp', () => clamp(window.scrollY / (hero.offsetHeight * 0.9)), 0);
track(globe, '--ov2', () => smooth(progress(chgWrap, 0.98, 0.36)), 0, [$('.stories-globe__intro'), $('.globe-shell'), $('.sf-dim')].filter(Boolean));
/* Karte -> Globus (vorher in main.js): --ov nur auf den Verbrauchern, --ln auf dem Trenner */
const mapSec = $('.emigration');
const trenner = $('.sf-break');
if (mapSec && globe) {
  const ovEls = [$('.emigration__inner'), $('.emigration__dim')].filter(Boolean);
  const vh0 = () => window.innerHeight;
  track(globe, '--ov', () => { const r = clamp((vh0() - globe.getBoundingClientRect().top) / (vh0() * 0.95)); return smooth(r); }, 0, ovEls, true);
  if (trenner) track(globe, '--ln', () => smooth(clamp((vh0() * 0.94 - globe.getBoundingClientRect().top) / (vh0() * 0.5))), 1, [trenner], true);
}
track(chgWrap, '--rw', () => easeOut(progress(chgWrap, 1.0, 0.4)), 1);
track(chg, '--chx', () => smooth(progress(pk, 1.0, 0.45)), 0);
track(pk, '--pkx', () => smooth(progress(devWrap, 1.0, 0.45)), 0);
track(devWrap, '--dve', () => easeOut(progress(devWrap, 1.0, 0.45)), 1);
track(devWrap, '--dvx', () => smooth(progress(atl, 1.0, 0.45)), 0);
track(
  devWrap,
  '--dvp',
  () => clamp((window.innerHeight - devWrap.getBoundingClientRect().top) / (window.innerHeight + devWrap.offsetHeight)),
  0.5,
);
track(atl, '--ae', () => easeOut(progress(atl, 1.0, 0.3)), 1);
track(
  atl,
  '--ap',
  () => clamp((window.innerHeight - atl.getBoundingClientRect().top) / (window.innerHeight + atl.offsetHeight)),
  0.5,
);
if (pk) {
  track(
    pk,
    '--py',
    () => clamp((pk.getBoundingClientRect().top + pk.offsetHeight / 2 - window.innerHeight / 2) / window.innerHeight, -1, 1) * 0.5 + 0.5,
    0.5,
  );
}
/* Schräge Haarlinien zeichnen sich beim Hereinkommen */
document.querySelectorAll('.edge').forEach((edge) => {
  if (reduce.matches || !('IntersectionObserver' in window)) return edge.classList.add('is-drawn');
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    edge.classList.add('is-drawn');
  }, { rootMargin: '0px 0px -8% 0px' });
  io.observe(edge);
});

let frame = 0;
function tick() {
  let moving = false;
  /* 1. alles lesen (ein Layout), 2. alles schreiben */
  for (const t of tracks) t.target = reduce.matches ? t.final : t.get();
  for (const t of tracks) {
    if (t.cur === null || t.snap) t.cur = t.target;
    else {
      const d = t.target - t.cur;
      if (Math.abs(d) > 0.0006) {
        t.cur += d * 0.17;
        moving = true;
      } else t.cur = t.target;
    }
    if (Math.abs(t.cur - t.last) > 0.0004) {
      const v = t.cur.toFixed(4);
      for (const e of t.els) e.style.setProperty(t.name, v);
      t.last = t.cur;
    }
  }
  if (trenner) trenner.classList.toggle('is-in', reduce.matches || (tracks.find((t) => t.name === '--ln')?.cur ?? 0) > 0.94);

  /* Atlas-Zitat: Wörter leuchten nacheinander, Frage wird unterstrichen */
  if (atl && words.length) {
    const reveal = progress(atl, 0.9, 0.28);
    const lit = reduce.matches ? words.length : Math.round(reveal * words.length * 1.08);
    words.forEach((word, index) => word.classList.toggle('on', index < lit));
    atl.classList.toggle('ask-on', reduce.matches || lit >= words.length);
  }
  frame = moving ? requestAnimationFrame(tick) : 0;
}
function request() {
  if (!frame) frame = requestAnimationFrame(tick);
}
window.addEventListener('scroll', request, { passive: true });
window.addEventListener('resize', request, { passive: true });
tick();

/* Footer blendet ein, sobald er sichtbar wird */
onceVisible($('.foot'), 'is-in', '0px 0px -2% 0px');

/* --- Postkarten: Karte neigt sich zur Maus, Lichtreflex folgt ---------------------- */
if (pk && matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce.matches) {
  pk.querySelectorAll('.pk__unit:not(.pk__unit--bg) .pk__card').forEach((card) => {
    card.addEventListener('pointermove', (ev) => {
      const r = card.getBoundingClientRect();
      const x = clamp((ev.clientX - r.left) / r.width, 0, 1);
      const y = clamp((ev.clientY - r.top) / r.height, 0, 1);
      card.style.setProperty('--ty', ((x - 0.5) * 12).toFixed(2) + 'deg');
      card.style.setProperty('--tx', ((0.5 - y) * 9).toFixed(2) + 'deg');
      card.style.setProperty('--gx', (x * 100).toFixed(0) + '%');
      card.style.setProperty('--gy', (y * 100).toFixed(0) + '%');
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--ty', '0deg');
      card.style.setProperty('--tx', '0deg');
    });
  });
}

/* Karten pendeln nur, solange sie im Bild sind */
if (pk && 'IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => pk.classList.toggle('is-away', !e.isIntersecting), { rootMargin: '100px' }).observe(pk);
}

/* Fadenlänge je Karte (für den gemeinsamen Fall von Faden und Karte) */
if (pk) {
  const setLen = () => pk.querySelectorAll('.pk__unit').forEach((u) => {
    const th = u.querySelector('.pk__thread');
    if (th) u.style.setProperty('--len', th.offsetHeight + 'px');
  });
  setLen();
  addEventListener('resize', setLen, { passive: true });
}

/* Bilder früh in den Speicher holen (sonst fehlen Karten/Statue beim Hochscrollen, bis sie neu dekodiert sind) */
(function vorladen() {
  const urls = ['assets/postkarte-1.webp?v=4','assets/postkarte-2.webp?v=4','assets/postkarte-3.webp?v=4','assets/postkarte-4.webp?v=4','assets/postkarte-5.webp?v=4','assets/atlas.webp','assets/berlin-skyline.svg'];
  const run = () => urls.forEach((u) => {
    const i = new Image();
    i.decoding = 'async';
    i.src = './' + u;
    i.decode?.().catch(() => {});
  });
  const start = () => ('requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 3000 }) : setTimeout(run, 1500));
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
})();

/* ===========================================================================
 * Forderungen: 2D-Animationen beim Aufklappen (nur Desktop)
 *
 * Ein kleiner eigener Renderer (Canvas 2D, ohne Bibliothek) für flache, kräftige
 * Illustrationen: dicke weiße Linien, cremefarbene Flächen, tiefroter Versatzschatten
 * (kein Leuchten). Jede Forderung erzählt eine kleine Geschichte als Endlosschleife
 * (Münzen fließen, Papier stapelt sich und wird zersägt, ein Haus wächst ...).
 * Beim Aufklappen zeichnet sich die Szene, danach läuft die Handlung.
 * Desktop: links neben dem Text. Handy: über dem Text, etwas feiner gezeichnet.
 * Läuft nur, solange die Zeile offen ist. Reduzierte Bewegung: Standbild.
 * ======================================================================== */
(function chgSzenen() {
  const rows = [...document.querySelectorAll('.chg__row')];
  if (!rows.length) return;
  const desktop = matchMedia('(min-width: 761px)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = (a, b, x) => {
    const t = clamp((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const out3 = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const back = (x) => {
    const t = clamp(x), c1 = 1.9, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  const rnd = (i) => {
    const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';
  const WHITE = '#c9161f', CREAM = '#7c0a11', DEEP = '#e0454d', PINK = '#a8101a', SHADOW = 'rgba(60,0,6,';
  if (document.fonts && document.fonts.load) {
    document.fonts.load('700 30px Inter');
    document.fonts.load('600 14px Inter');
  }

  /* --------------------------------------------------------------- Geometrie */
  const circ = (cx, cy, r, n = 34) => {
    const p = [];
    for (let i = 0; i <= n; i++) p.push([cx + Math.cos((i / n) * TAU) * r, cy + Math.sin((i / n) * TAU) * r]);
    return p;
  };
  const ell = (cx, cy, rx, ry, n = 34) => {
    const p = [];
    for (let i = 0; i <= n; i++) p.push([cx + Math.cos((i / n) * TAU) * rx, cy + Math.sin((i / n) * TAU) * ry]);
    return p;
  };
  const rect = (cx, cy, w, h) => [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2], [cx - w / 2, cy - h / 2]];
  const rrect = (cx, cy, w, h, r) => {
    const p = [];
    const corners = [[cx + w / 2 - r, cy + h / 2 - r, 0], [cx - w / 2 + r, cy + h / 2 - r, 0.25], [cx - w / 2 + r, cy - h / 2 + r, 0.5], [cx + w / 2 - r, cy - h / 2 + r, 0.75]];
    for (const [x, y, s] of corners) for (let i = 0; i <= 5; i++) p.push([x + Math.cos((s + (i / 5) * 0.25) * TAU) * r, y + Math.sin((s + (i / 5) * 0.25) * TAU) * r]);
    p.push(p[0]);
    return p;
  };
  const xf = (pts, x, y, rot = 0, sx = 1, sy = sx) => {
    const c = Math.cos(rot), s = Math.sin(rot);
    return pts.map(([px, py]) => [x + px * sx * c - py * sy * s, y + px * sx * s + py * sy * c]);
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const quad = (p0, p1, p2, u) => {
    const a = 1 - u;
    return [a * a * p0[0] + 2 * a * u * p1[0] + u * u * p2[0], a * a * p0[1] + 2 * a * u * p1[1] + u * u * p2[1]];
  };

  /* ---------------------------------------------------------------- Renderer */
  const g = {
    ctx: null, W: 0, H: 0, S: 100, cu: 0, cv: 0, dpr: 1, k: 1, age: 0, tm: 0,
    proj(x, y) {
      return [this.W / 2 + (x - this.cu) * this.S, this.H / 2 + (-y - this.cv) * this.S];
    },
    /* Form: Linienzug/Polygon; o: w (Linienstärke), fill, fillA, a, d (Verzögerung s), dur, dash, close, shadow, color */
    shape(pts, o = {}) {
      if (pts.length < 2) return;
      const r = out3((this.age - (o.d || 0)) / (o.dur || 0.6));
      if (r <= 0.001) return;
      const a = o.a === undefined ? 1 : o.a;
      if (a <= 0.01) return;
      const ctx = this.ctx;
      const P = pts.map((q) => this.proj(q[0], q[1]));
      const segs = P.length - 1;
      const upto = r * segs;
      const w = (o.w === undefined ? 4.4 : o.w) * this.dpr * this.k;
      const full = r >= 0.999;
      const build = (ox, oy) => {
        ctx.beginPath();
        ctx.moveTo(P[0][0] + ox, P[0][1] + oy);
        for (let i = 1; i <= segs; i++) {
          if (i <= upto) ctx.lineTo(P[i][0] + ox, P[i][1] + oy);
          else {
            const f = upto - (i - 1);
            if (f > 0) ctx.lineTo(P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f + ox, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f + oy);
            break;
          }
        }
        if (o.close && full) ctx.closePath();
      };
      ctx.lineCap = o.cap || 'round';
      ctx.lineJoin = o.join || 'round';
      ctx.miterLimit = 2.6;
      ctx.setLineDash(o.dash ? [o.dash[0] * this.dpr * this.k, o.dash[1] * this.dpr * this.k] : []);
      ctx.lineDashOffset = (o.dashOff || 0) * this.dpr * this.k;
      if (o.shadow !== false && w > 0) {
        build(3.4 * this.dpr * this.k, 4.6 * this.dpr * this.k);
        if (o.fill && full) {
          ctx.globalAlpha = a * 0.34;
          ctx.fillStyle = SHADOW + '1)';
          ctx.fill();
        }
        ctx.globalAlpha = a * 0.42;
        ctx.strokeStyle = SHADOW + '1)';
        ctx.lineWidth = w;
        ctx.stroke();
      }
      build(0, 0);
      if (o.fill) {
        ctx.globalAlpha = a * (o.fillA === undefined ? 1 : o.fillA) * smooth(0.55, 1, r);
        ctx.fillStyle = o.fill;
        ctx.fill();
      }
      if (w > 0) {
        ctx.globalAlpha = a;
        ctx.strokeStyle = o.color || WHITE;
        ctx.lineWidth = w;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    },
    /* dicke Röhre (Rohr): helle Wand, dunkle Füllung */
    tube(pts, o = {}) {
      const r = out3((this.age - (o.d || 0)) / (o.dur || 0.8));
      if (r <= 0.001) return;
      const ctx = this.ctx;
      const P = pts.map((q) => this.proj(q[0], q[1]));
      const segs = P.length - 1;
      const upto = r * segs;
      const build = (ox, oy) => {
        ctx.beginPath();
        ctx.moveTo(P[0][0] + ox, P[0][1] + oy);
        for (let i = 1; i <= segs; i++) {
          if (i <= upto) ctx.lineTo(P[i][0] + ox, P[i][1] + oy);
          else {
            const f = upto - (i - 1);
            if (f > 0) ctx.lineTo(P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f + ox, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f + oy);
            break;
          }
        }
      };
      const w = (o.w || 0.2) * this.S;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([]);
      build(3.4 * this.dpr * this.k, 4.6 * this.dpr * this.k);
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = SHADOW + '1)';
      ctx.lineWidth = w;
      ctx.stroke();
      ctx.globalAlpha = 1;
      build(0, 0);
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = w;
      ctx.stroke();
      ctx.strokeStyle = '#1a0306';
      ctx.lineWidth = Math.max(2 * this.k, w - 9 * this.dpr * this.k);
      ctx.stroke();
    },
    text(str, x, y, size, o = {}) {
      const r = out3((this.age - (o.d || 0)) / 0.45);
      if (r <= 0.01) return;
      const ctx = this.ctx;
      const q = this.proj(x, y);
      ctx.setLineDash([]);
      ctx.font = (o.weight || 700) + ' ' + size * this.dpr * this.k + 'px ' + SANS;
      ctx.textAlign = o.align || 'center';
      ctx.textBaseline = 'middle';
      const a = r * (o.a === undefined ? 1 : o.a);
      ctx.globalAlpha = a * 0.42;
      ctx.fillStyle = SHADOW + '1)';
      ctx.fillText(str, q[0] + 2.6 * this.dpr * this.k, q[1] + 3.4 * this.dpr * this.k);
      ctx.globalAlpha = a;
      ctx.fillStyle = o.color || '#f4f1ec';
      ctx.fillText(str, q[0], q[1]);
      ctx.globalAlpha = 1;
    },
  };

  /* Wiederverwendbare Figuren ------------------------------------------------ */
  const coin = (x, y, r, o = {}) => {
    g.shape(circ(x, y, r, 24), { fill: CREAM, w: 3.4, close: true, ...o });
    g.shape(circ(x, y, r * 0.62, 20), { w: 2.2, color: DEEP, shadow: false, a: o.a, d: o.d });
  };
  const person = (x, y, s, o = {}) => {
    const lean = o.lean || 0;
    g.shape(xf([[-0.08, 0], [-0.1, -0.3]], x, y, 0, s), { w: 3.6, a: o.a, d: o.d, shadow: false });
    g.shape(xf([[0.08, 0], [0.1, -0.3]], x, y, 0, s), { w: 3.6, a: o.a, d: o.d, shadow: false });
    g.shape(xf(rrect(0, 0.17, 0.3, 0.4, 0.11), x, y, lean, s), { fill: o.fill || PINK, w: 3.6, close: true, a: o.a, d: o.d });
    g.shape(xf(circ(0, 0.62, 0.12, 18), x, y, lean, s), { fill: CREAM, w: 3.6, close: true, a: o.a, d: o.d });
  };

  /* ------------------------------------------------------------------ Szenen */
  /* 1 · Steuern: ein Euro reißt mittig auf (49,3 % / 50,7 %), unten Vergleich mit OECD-Schnitt (35,1 %) */
  function szeneSteuer() {
    const A = g.tm;
    const CYCLE = 7.2;
    const C = A < 0.75 ? 0 : (A - 0.75) % CYCLE;
    const R = 0.98;
    const crackP = smooth(0.35, 1.2, C) * (1 - smooth(6.85, 7.15, C));
    const splitT = smooth(1.12, 1.78, C) * (1 - smooth(6.35, 6.85, C));
    const intro = A < 1.1 ? back((A - 0.02) / 0.68) : 1;
    const shake = C > 1.12 && C < 1.7 ? Math.sin(C * 86) * 0.03 * (1 - (C - 1.12) / 0.58) : 0;
    const cx = 0.04 + shake;
    const cy = -0.22;
    const yTip = R - Math.min(1, crackP) * 2 * R;
    const jagN = [
      [0, 1], [-0.06, 0.72], [0.08, 0.46], [-0.09, 0.18], [0.05, -0.08],
      [-0.1, -0.36], [0.07, -0.62], [-0.04, -0.84], [0, -1],
    ].map(([x, y]) => [x * R, y * R]);
    const revealed = () => {
      const pts = [jagN[0]];
      for (let i = 1; i < jagN.length; i++) {
        const a = jagN[i - 1], b = jagN[i];
        if (b[1] >= yTip - 0.0001) pts.push(b);
        else {
          const f = (a[1] - yTip) / (a[1] - b[1] || 1);
          pts.push([lerp(a[0], b[0], clamp(f)), yTip]);
          break;
        }
      }
      return pts;
    };
    const halfOf = (side, rad) => {
      const pts = [];
      const n = 34;
      const a0 = Math.PI / 2;
      const a1 = side < 0 ? Math.PI * 1.5 : -Math.PI / 2;
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n;
        pts.push([Math.cos(a) * rad, Math.sin(a) * rad]);
      }
      for (let i = jagN.length - 1; i >= 0; i--) pts.push(jagN[i]);
      pts.push(pts[0]);
      return pts;
    };
    const arcOf = (side, rad) => {
      const pts = [];
      const n = 26;
      const a0 = Math.PI / 2;
      const a1 = side < 0 ? Math.PI * 1.5 : -Math.PI / 2;
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n;
        pts.push([Math.cos(a) * rad, Math.sin(a) * rad]);
      }
      return pts;
    };
    /* Euro sitzt im Münzteil und wird an der Bruchkante abgeschnitten */
    const euroIn = (clipPts, x, y, rot, alpha, scale) => {
      if (alpha < 0.02 || scale < 0.02) return;
      const ctx = g.ctx;
      const P = clipPts.map((q) => g.proj(q[0], q[1]));
      const o = g.proj(x, y);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(P[0][0], P[0][1]);
      for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]);
      ctx.clip();
      ctx.font = '700 ' + 1.16 * R * scale * g.S + 'px ' + SANS;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(o[0], o[1]);
      ctx.rotate(-rot);
      ctx.globalAlpha = alpha * 0.42;
      ctx.fillStyle = SHADOW + '1)';
      ctx.fillText('€', 2.6 * g.dpr * g.k, 3.4 * g.dpr * g.k);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#f4f1ec';
      ctx.fillText('€', 0, 0);
      ctx.restore();
    };
    const tear = (pts) => {
      g.shape(pts, { w: 3.4, color: '#140206', shadow: false, d: 0 });
      g.shape(pts, { w: 1.35, color: '#f4f1ec', shadow: false, d: 0 });
    };

    if (splitT < 0.025) {
      const rad = R * intro * (1 + 0.028 * Math.sin(Math.min(crackP, 1) * Math.PI));
      if (rad > 0.04) {
        g.shape(circ(cx, cy, rad, 52), { fill: CREAM, close: true, d: 0.04 });
        g.shape(circ(cx, cy, rad * 0.73, 40), { w: 2.5, color: DEEP, shadow: false, d: 0.2 });
        euroIn(circ(cx, cy, rad * 0.92, 40), cx, cy, 0, out3((g.age - 0.25) / 0.4), intro);
        if (crackP > 0.03) tear(revealed().map(([x, y]) => [cx + x * (rad / R), cy + y * (rad / R)]));
      }
    } else {
      const gap = splitT * 0.5;
      const wob = splitT > 0.9 ? Math.sin(A * 20) * 0.012 : 0;
      const pose = (side) => ({
        ox: side * (gap + wob),
        oy: (side < 0 ? -0.07 : -0.02) * splitT + side * wob * 0.35,
        rot: side * splitT * (side < 0 ? 0.2 : 0.08),
      });
      /* dunkle Spalte zwischen den Bruchkanten */
      {
        const L = pose(-1), Rr = pose(1);
        const leftEdge = xf(jagN, cx + L.ox, cy + L.oy, L.rot);
        const rightEdge = xf(jagN, cx + Rr.ox, cy + Rr.oy, Rr.rot);
        g.shape(leftEdge.concat(rightEdge.slice().reverse()), { fill: '#140206', w: 0, close: true, d: 0, shadow: false, a: smooth(0.08, 0.45, splitT) });
      }
      const drawHalf = (side) => {
        const p = pose(side);
        const world = xf(halfOf(side, R), cx + p.ox, cy + p.oy, p.rot);
        g.shape(world, { fill: CREAM, close: true, d: 0 });
        euroIn(world, cx + p.ox, cy + p.oy, p.rot, 1, 1);
        g.shape(xf(arcOf(side, R * 0.73), cx + p.ox, cy + p.oy, p.rot), { w: 2.5, color: DEEP, shadow: false, d: 0 });
        tear(xf(jagN, cx + p.ox, cy + p.oy, p.rot));
      };
      drawHalf(-1);
      drawHalf(1);
      /* feine Folgerisse, bleiben an der jeweiligen Hälfte */
      const hairs = [
        { side: -1, pts: [[-0.02, 0.42], [-0.28, 0.56], [-0.36, 0.46]] },
        { side: 1, pts: [[0.04, -0.16], [0.26, -0.3], [0.2, -0.44]] },
        { side: -1, pts: [[-0.04, -0.5], [-0.24, -0.64]] },
      ];
      for (const h of hairs) {
        const p = pose(h.side);
        g.shape(xf(h.pts.map(([x, y]) => [x * R, y * R]), cx + p.ox, cy + p.oy, p.rot), {
          w: 1.7, color: '#f4f1ec', shadow: false, d: 0, a: smooth(0.15, 0.55, splitT) * 0.8,
        });
      }
    }

    /* Splitter fliegen aus dem Riss, ein Brocken bricht oben ab */
    if (C > 1.08 && C < 3.6) {
      const life = (C - 1.08) / 1.7;
      for (let s = 0; s < 8; s++) {
        const dir = s % 2 === 0 ? -1 : 1;
        const along = (rnd(s + 1) - 0.5) * 1.35;
        const speed = 0.35 + rnd(s + 4) * 0.7;
        const x = cx + dir * (0.08 + life * speed);
        const y = cy + along * 0.38 - life * life * (0.45 + rnd(s + 6) * 0.7);
        const rot = (C * 5 + s) * dir;
        const a = (1 - smooth(0.42, 1, life)) * smooth(0, 0.05, life);
        const sz = 0.05 + rnd(s + 2) * 0.05;
        const chip = [[0, sz], [-sz * 0.8, -sz * 0.5], [sz * 0.65, -sz * 0.35]];
        g.shape(xf(chip, x, y, rot), { fill: '#f4f1ec', close: true, w: 0, a, d: 0, shadow: false });
      }
      const u = clamp((C - 1.12) / 2.1);
      const shard = [[0, 0.18], [-0.11, 0.02], [-0.02, -0.12], [0.12, 0.04]];
      g.shape(xf(shard, cx + 0.12 + u * 0.45, cy + R * 0.72 - u * 1.15, u * 2.2), {
        fill: CREAM, close: true, w: 2.2, a: (1 - smooth(0.62, 1, u)) * smooth(0, 0.08, u), d: 0,
      });
    }

    const cu = (to, d, dur) => (to * out3((A - d) / dur));
    const fmt = (v) => v.toFixed(1).replace('.', ',');
    g.text(fmt(cu(49.3, 1.15, 1.5)) + ' %', -1.2, 1.38, 40, { d: 1.05 });
    g.text('Steuern und Abgaben', -1.2, 1.0, 15, { weight: 600, d: 1.2 });
    g.text(fmt(cu(50.7, 1.15, 1.5)) + ' %', 1.22, 1.38, 40, { d: 1.15 });
    g.text('bleiben netto', 1.22, 1.0, 15, { weight: 600, d: 1.3 });
    /* Vergleich: Abgabenkeil DE gegen OECD-Schnitt */
    const bars = [{ y: -1.82, v: 49.3, l: 'Abgabenkeil Deutschland', d: 1.45 }, { y: -2.36, v: 35.1, l: 'OECD-Schnitt', d: 1.65 }];
    const bx0 = -2.55, bw = 5.1;
    for (const b of bars) {
      g.shape(rrect(bx0 + bw / 2, b.y, bw, 0.24, 0.12), { w: 3.2, close: true, a: 0.7, d: b.d, shadow: false });
      const f = (b.v / 100) * bw * out3((A - b.d - 0.35) / 1.35);
      if (f > 0.05) g.shape(rrect(bx0 + f / 2, b.y, f, 0.24, 0.12), { fill: CREAM, close: true, w: 0, d: b.d + 0.3, shadow: false });
      g.text(b.l, bx0, b.y + 0.32, 14, { align: 'left', weight: 600, d: b.d + 0.15 });
      g.text(fmt(cu(b.v, b.d + 0.35, 1.35)) + ' %', bx0 + bw, b.y + 0.32, 14, { align: 'right', d: b.d + 0.15 });
    }
  }

  /* 2 · Sozialstaat: etwa 52 % der Staatsausgaben 2025 sind Sozialleistungen (Destatis, vorläufig) */
  function szeneTresor() {
    const A = g.tm;
    const x0 = -2.45, bw = 4.9, by = 0.12, bh = 0.56;
    const share = 0.52;
    const grow = back((A - 0.45) / 1.35);
    const shown = Math.min(share * Math.max(grow, 0), 0.96);
    const p = out3((A - 0.4) / 1.5);
    g.text(Math.round(52 * p) + ' %', 0, 1.5, 48, { d: 0.15 });
    g.text('der Staatsausgaben', 0, 1.02, 16, { weight: 600, d: 0.35 });
    g.text('für Sozialleistungen', 0, 0.7, 16, { weight: 600, d: 0.48 });
    g.shape(rrect(x0 + bw / 2, by, bw, bh, 0.18), { w: 3.2, close: true, a: 0.75, d: 0.2, shadow: false });
    const f = bw * shown;
    if (f > 0.08) g.shape(rrect(x0 + f / 2, by, f, bh, Math.min(0.18, f / 2)), { fill: CREAM, close: true, w: 2.4, d: 0 });
    const mid = x0 + bw * 0.5;
    g.shape([[mid, by - bh / 2 - 0.07], [mid, by + bh / 2 + 0.07]], { w: 1.7, color: '#f4f1ec', shadow: false, d: 0.75, a: 0.95 });
    g.text('Sozialleistungen', x0, by - 0.55, 14, { align: 'left', weight: 600, d: 0.9 });
    g.text('übrige Ausgaben', x0 + bw, by - 0.55, 14, { align: 'right', weight: 600, d: 1.0 });
    const items = ['Renten und Pensionen', 'Arbeitslosengeld I', 'Bürgergeld', 'soziale Sachleistungen'];
    items.forEach((label, i) => {
      g.text(label, x0, -0.95 - i * 0.36, 15, { align: 'left', weight: 600, d: 1.05 + i * 0.1 });
    });
    g.text('2.249 Mrd. € · 2025, vorläufig', 0, -2.52, 14, { weight: 600, d: 1.5 });
  }

  /* 3 · Rente: Wippe, 1962 sechs Beitragszahler je Rentner, heute zwei */
  function szeneRente() {
    const A = g.tm;
    /* Wippe */
    const fx = 0, fy = -0.35;
    const C = A % 10;
    const leaveT = [3.0, 3.5, 4.0, 4.5];
    const heavy = smooth(3.2, 5.8, C) * (1 - smooth(9.2, 10, C));
    const theta = -0.3 * heavy + 0.025 * Math.sin(A * 1.5) * (1 - heavy);
    const plank = (lx, ly) => [fx + lx * Math.cos(theta) - ly * Math.sin(theta), fy + 0.16 + lx * Math.sin(theta) + ly * Math.cos(theta)];
    g.shape([[fx - 0.34, fy - 0.2], [fx, fy + 0.12], [fx + 0.34, fy - 0.2], [fx - 0.34, fy - 0.2]], { fill: CREAM, close: true, d: 0.4 });
    g.shape(xf(rrect(0, 0, 2.7, 0.16, 0.08), fx, fy + 0.2, theta), { fill: CREAM, close: true, d: 0.5 });
    g.shape(circ(fx, fy + 0.2, 0.05, 10), { fill: DEEP, close: true, w: 2, shadow: false, d: 0.8 });
    const workers = [-1.15, -0.93, -0.71, -0.49, -0.27, -0.05];
    workers.forEach((lx, i) => {
      const order = 5 - i;
      const gone = order < 4 ? leaveT[order] : Infinity;
      const base = plank(lx, 0.14);
      let pos = base, rot = theta, al = 1;
      if (C >= 9.3) al = smooth(9.3, 10, C);
      else if (C >= gone) {
        const tl = C - gone;
        if (tl > 1.4) return;
        pos = [base[0] - 0.9 * tl * (1 + order * 0.15), base[1] + 1.1 * tl - 3.2 * tl * tl];
        rot = -tl * 2.4;
        al = 1 - smooth(0.7, 1.4, tl);
        if (al <= 0.02) return;
      }
      person(pos[0], pos[1], 0.78, { lean: rot, d: 0.7 + i * 0.08, a: al });
    });
    {
      const p = plank(0.98, 0.14);
      person(p[0], p[1], 0.95, { lean: theta, d: 1.2, fill: CREAM });
      const c0 = plank(1.14, 0.14), c1 = plank(1.14, 0.7);
      g.shape([c0, c1, plank(1.04, 0.74)], { w: 4, d: 1.4 });
    }
    const showOld = 1 - smooth(3.2, 3.7, C) * (1 - smooth(9.3, 9.8, C));
    g.text(showOld > 0.5 ? '1962' : 'heute', fx, 1.92, 34, { d: 0.9, a: 1 });
    g.text(showOld > 0.5 ? '6 : 1' : '2 : 1', fx, 1.48, 34, { d: 0.9, a: 1 });
    g.text('Beitragszahler je Altersrentner', fx, 1.02, 15, { weight: 600, d: 1.1 });
  }

  /* 4 · Unternehmen: Kettensäge schneidet den Aktenstapel „Bürokratie“ durch */
  function szeneFabrik() {
    const A = g.tm;
    const C = A % 9;
    const drive = smooth(0.35, 3.15, C) * (1 - smooth(7.55, 8.45, C));
    const toss = smooth(3.05, 4.5, C) * (1 - smooth(7.35, 8.3, C));
    const stackX = 0.7;
    const sw = 1.9;
    const sh = 0.11;
    const step = 0.14;
    const buzz = drive > 0.05 && drive < 0.98 && toss < 0.4 ? Math.sin(A * 64) * 0.011 : 0;
    const sx = lerp(-2.62, -0.4, drive);
    const sy = -0.18 + buzz;
    const blatt = (x, y, rot, d) => {
      g.shape(xf(rrect(0, 0, sw, sh, 0.025), x, y, rot), { fill: CREAM, close: true, w: 2.6, d });
      g.shape(xf([[-sw * 0.34, 0.012], [sw * 0.2, 0.012]], x, y, rot), { w: 1.5, color: DEEP, shadow: false, d, a: 0.8 });
      g.shape(xf([[-sw * 0.34, -0.022], [-sw * 0.04, -0.022]], x, y, rot), { w: 1.3, color: DEEP, shadow: false, d, a: 0.5 });
    };
    for (let i = 0; i < 4; i++) blatt(stackX + i * 0.012, -0.835 + i * step, 0, 0.04 + i * 0.04);
    const saege = (x, y) => {
      const B = (pts) => xf(pts, x, y, 0);
      g.shape(B([[-0.5, -0.2], [-0.86, -0.22], [-1.0, -0.04], [-1.0, 0.24], [-0.8, 0.4], [-0.46, 0.26]]), { w: 5, d: 0.08 });
      g.shape(B([[-0.5, 0], [-0.74, -0.02], [-0.74, 0.2], [-0.48, 0.16]]), { w: 3.2, color: DEEP, shadow: false, d: 0.14 });
      g.shape(B(rrect(0.02, 0, 1.04, 0.56, 0.12)), { fill: CREAM, close: true, d: 0.05 });
      g.shape(B([[-0.18, 0.22], [-0.24, 0.48], [-0.06, 0.64], [0.34, 0.66], [0.52, 0.46], [0.44, 0.22]]), { w: 5, d: 0.12 });
      g.shape(B([[0.36, 0.16], [0.58, 0.5], [0.76, 0.1]]), { w: 4.2, d: 0.18 });
      g.shape(B(circ(-0.2, -0.02, 0.12, 14)), { w: 2.4, color: DEEP, shadow: false, d: 0.2 });
      g.shape(B(rrect(1.48, 0, 1.78, 0.15, 0.07)), { fill: CREAM, close: true, d: 0.1 });
      g.shape(B(circ(2.3, 0, 0.095, 14)), { fill: CREAM, w: 2.6, close: true, d: 0.18 });
      const phase = (A * 10) % 0.16;
      for (let t = 0.72 + phase; t < 2.16; t += 0.16) {
        g.shape(B([[t, 0.06], [t + 0.05, 0.15], [t + 0.1, 0.06]]), { w: 2.2, d: 0.22, shadow: false });
        g.shape(B([[t + 0.04, -0.06], [t + 0.09, -0.15], [t + 0.14, -0.06]]), { w: 2.2, d: 0.22, shadow: false });
      }
      const chain = A * 72;
      g.shape(B([[0.74, 0.034], [2.12, 0.034]]), { w: 1.8, color: '#f4f1ec', dash: [4, 6], dashOff: -chain, shadow: false, d: 0.24 });
      g.shape(B([[0.74, -0.034], [2.12, -0.034]]), { w: 1.8, color: '#f4f1ec', dash: [4, 6], dashOff: chain, shadow: false, d: 0.24 });
    };
    saege(sx, sy);
    for (let i = 0; i < 5; i++) {
      blatt(
        stackX + toss * (0.16 + i * 0.13),
        0.04 + i * step + toss * (0.06 + i * 0.045),
        toss * (0.06 + i * 0.055),
        0.1 + i * 0.04,
      );
    }
    if (drive > 0.08 && drive < 0.98 && toss < 0.65) {
      const tipx = sx + 2.3;
      const tipy = sy;
      for (let s = 0; s < 8; s++) {
        const life = (A * 1.8 + s * 0.13) % 1;
        const up = s % 2 ? 1 : -1;
        g.shape(xf(rect(0, 0, 0.08, 0.038), tipx + life * 0.5, tipy + (rnd(s + 4) - 0.5) * 0.22 + up * life * 0.42, life * 4), {
          fill: s % 2 ? '#f4f1ec' : CREAM, close: true, w: 0, a: (1 - life) * 0.9, shadow: false, d: 0,
        });
      }
    }
    g.text('Bürokratie', stackX, -1.16, 18, { weight: 600, d: 0.28 });
  }

  /* 5 · Wohnungsbau: Kran setzt Geschoss für Geschoss, Preissäulen 2005 gegen 2024 */
  function szeneHaus() {
    const A = g.tm;
    const C = A % 13;
    const bx = -0.25, bw = 1.7, fh = 0.34, fl = 6, by0 = -1.2;
    const kx = -1.85;
    const tIn = 1.0, per = 1.4;
    /* Kran */
    const topY = 1.42;
    for (const dx of [-0.11, 0.11]) g.shape([[kx + dx, by0], [kx + dx, topY]], { w: 4, d: 0.1 });
    for (let i = 0; i < 12; i++) g.shape([[kx - 0.11, by0 + (i * (topY - by0)) / 12], [kx + 0.11, by0 + ((i + 1) * (topY - by0)) / 12]], { w: 2.4, a: 0.7, d: 0.1 + i * 0.03, shadow: false });
    g.shape([[kx - 0.7, topY], [kx + 2.1, topY]], { w: 4.4, d: 0.3 });
    g.shape([[kx - 0.7, topY], [kx, topY + 0.35], [kx + 2.1, topY]], { w: 2.6, a: 0.8, d: 0.4, shadow: false });
    g.shape(rect(kx - 0.55, topY - 0.14, 0.34, 0.26), { fill: DEEP, close: true, w: 3, d: 0.5, shadow: false });
    g.shape(rect(kx, topY + 0.1, 0.34, 0.26), { fill: CREAM, close: true, d: 0.4 });
    /* Geschosse und Last */
    let hookX = bx, hookY = 1.4, carrying = false, carryFloor = -1, sway = 0;
    for (let k = 0; k < fl; k++) {
      const t0 = tIn + k * per;
      const tl = C - t0;
      const landY = by0 + (k + 1) * fh;
      const y0 = by0 + k * fh;
      if (tl >= 0.9 || (A >= 13 && C > t0 + 0.9)) {
        const lt = C - t0 - 0.9;
        const pop = lt < 0.4 ? 1 + 0.06 * Math.sin(lt * 14) * (1 - lt / 0.4) : 1;
        const al = C > 12 ? 1 - smooth(12, 13, C) : 1;
        g.shape(rect(bx, y0 + (fh * pop) / 2, bw, fh * pop), { fill: CREAM, close: true, d: 0, a: al });
        for (let i = 0; i < 4; i++) {
          const wl = smooth(t0 + 1.1 + i * 0.1, t0 + 1.5 + i * 0.1, C);
          g.shape(rect(bx - bw / 2 + 0.24 + i * 0.4, y0 + fh * 0.5, 0.2, 0.17), { fill: wl > 0.5 && (i + k) % 3 !== 0 ? '#f4e4dc' : '#1a0306', close: true, w: 2.6, d: 0, a: al, shadow: false });
        }
        if (lt >= 0 && lt < 0.5) {
          for (let s = 0; s < 6; s++) g.shape(xf(rect(0, 0, 0.05, 0.05), bx + (rnd(s + k) - 0.5) * bw, landY - 0.05 + lt * 0.6 * rnd(s), s + lt * 8), { fill: CREAM, close: true, w: 0, a: 1 - lt / 0.5, shadow: false, d: 0 });
        }
      } else if (tl >= -0.3) {
        carrying = true;
        carryFloor = k;
        const u = clamp(tl / 0.9);
        hookY = lerp(1.02, landY + 0.17, smooth(0, 1, u));
        sway = 0.22 * Math.sin(Math.max(0, tl) * 5) * (1 - u);
        hookX = bx + sway;
      }
    }
    if (carrying) {
      const s = out3((C - (tIn + carryFloor * per) + 0.3) / 0.3);
      g.shape([[hookX, topY], [hookX, hookY + 0.17]], { w: 2.8, d: 0, shadow: false });
      g.shape(rect(hookX, hookY, bw, fh), { fill: CREAM, close: true, d: 0, a: s });
    } else {
      g.shape([[bx, topY], [bx, 1.0]], { w: 2.8, d: 0, shadow: false });
      g.shape(rect(bx, 0.92, 0.2, 0.14), { fill: CREAM, close: true, w: 3, d: 0 });
    }
    {
      const done = tIn + fl * per;
      const f = back((C - done) / 0.6);
      if (C > done && C < 12.2) {
        const top = by0 + fl * fh;
        g.shape([[bx - bw / 2 - 0.1, top], [bx, top + 0.45 * f], [bx + bw / 2 + 0.1, top]], { fill: PINK, close: true, d: 0 });
        g.shape([[bx + 0.45, top + 0.2], [bx + 0.45, top + 0.5 * f]], { w: 4, d: 0 });
      }
    }
    g.shape([[-2.3, by0], [2.45, by0]], { w: 5, d: 0.1 });
    /* Preissäulen */
    const barBase = by0;
    const bars = [{ x: 1.4, h: 0.62, v: 1233, y: '2005', d: 0.8 }, { x: 2.05, h: 1.31, v: 2611, y: '2024', d: 1.1 }];
    const fmt = (v) => Math.round(v).toLocaleString('de-DE') + ' €';
    for (const b of bars) {
      const grow = out3((A - b.d - 0.4) / 1.4);
      const h = b.h * grow;
      if (h > 0.02) g.shape(rect(b.x, barBase + h / 2, 0.52, h), { fill: b.v > 2000 ? CREAM : PINK, close: true, d: b.d + 0.4 });
      g.text(fmt(b.v * grow), b.x, barBase + h + 0.3, 17, { d: b.d + 0.4 });
      g.text(b.y, b.x, barBase - 0.3, 15, { weight: 600, d: b.d });
    }
    {
      const p = back((A - 3.2) / 0.6);
      if (A > 3.2) {
        g.shape(xf(rrect(0, 0, 0.9, 0.4, 0.2), 1.72, 0.8, 0, p), { fill: CREAM, close: true, d: 0 });
        g.text('+112 %', 1.72, 0.8, 20 * p, { color: DEEP, d: 0 });
      }
    }
    g.text('Baukosten je m²', 1.72, 1.2, 17, { weight: 600, d: 0.9 });
  }

  const STAT = [4, 6, 4, 7.6, 10.5];
  const SZENEN = [szeneSteuer, szeneTresor, szeneRente, szeneFabrik, szeneHaus];
  const FITS = [
    { x: [-2.65, 2.65], y: [-2.6, 1.75] },
    { x: [-2.6, 2.6], y: [-2.75, 1.85] },
    { x: [-1.9, 1.9], y: [-0.9, 2.15] },
    { x: [-1.7, 2.6], y: [-1.4, 1.32] },
    { x: [-2.55, 2.55], y: [-1.5, 1.8], v: 0.8 },
  ];

  /* ------------------------------------------------------------ Steuerung */
  const canvases = rows.map((row) => {
    const panel = row.querySelector('.chg__panel');
    if (!panel) return null;
    const c = document.createElement('canvas');
    c.className = 'chg__scene';
    c.setAttribute('aria-hidden', 'true');
    panel.prepend(c);
    return c;
  });

  let active = -1;
  let frame = 0;
  let openedAt = 0;

  function draw(i, now, staticFrame) {
    const c = canvases[i];
    if (!c) return;
    const r = c.getBoundingClientRect();
    g.dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(2, Math.round(r.width * g.dpr)), h = Math.max(2, Math.round(r.height * g.dpr));
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    g.W = c.width;
    g.H = c.height;
    const ctx = c.getContext('2d');
    g.ctx = ctx;
    ctx.clearRect(0, 0, c.width, c.height);
    g.age = staticFrame ? STAT[i] : (now - openedAt) / 1000;
    /* Handlung läuft nach dem Aufbau ruhiger (Tempo 0,6) */
    g.tm = g.age < 2.2 || staticFrame ? g.age : 2.2 + (g.age - 2.2) * 0.6;
    const b = FITS[i];
    g.S = Math.min((g.W * 0.96) / (b.x[1] - b.x[0]), (g.H * 0.95) / (b.y[1] - b.y[0]));
    /* Auf dem Handy ist die Fläche kleiner: Striche und Schrift etwas feiner, Desktop bleibt unverändert */
    g.k = desktop.matches ? 1 : Math.min(1, Math.max(0.75, r.width / 560));
    g.cu = (b.x[0] + b.x[1]) / 2;
    /* oben ausrichten (kleiner Rand), nicht mittig: sonst hängt die Szene unter dem Text */
    const sceneH = (b.y[1] - b.y[0]) * g.S;
    const top = Math.min((g.H - sceneH) / 2, 0.04 * g.H);
    const margin = lerp(top, Math.max(0, (g.H - sceneH) / 2), b.v || 0);
    g.cv = -b.y[1] + (g.H / 2 - margin) / g.S;
    SZENEN[i]();
  }

  function loop(now) {
    frame = 0;
    if (active < 0 || document.hidden) return;
    draw(active, now, false);
    frame = requestAnimationFrame(loop);
  }

  function sync() {
    const i = rows.findIndex((r) => r.classList.contains('is-open'));
    if (i === active) return;
    active = i;
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    if (i < 0) return;
    openedAt = performance.now();
    if (reduce.matches) {
      requestAnimationFrame(() => draw(i, 0, true));
      return;
    }
    frame = requestAnimationFrame(loop);
  }

  const mo = new MutationObserver(sync);
  rows.forEach((r) => mo.observe(r, { attributes: true, attributeFilter: ['class'] }));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && active >= 0 && !frame && !reduce.matches) frame = requestAnimationFrame(loop);
  });
  window.addEventListener('resize', () => {
    if (active >= 0 && reduce.matches) draw(active, 0, true);
  }, { passive: true });
})();
