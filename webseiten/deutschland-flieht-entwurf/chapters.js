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
  const FLAECHEN = ['.emigration', '.sf-sheet', '.pk', '.dev', '.soc', '.atl', '.foot', '.sh', '.sec', '.cta-band', '.und-dann__bild'];
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
    /* Hintergrundbild als Kind: Körnung kommt darüber (später im DOM), sonst davor */
    if (el.matches('.dev, .und-dann__bild')) el.append(k);
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
const cities = $('.cities');
const undDann = $('.und-dann');
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
 *  Namen:  --ov2  Globus wird überdeckt   --rw   roter Keil rollt auf   --kw  Großstädte/„Und dann?“ schieben sich hoch
 *          --chx  Rot weicht zurück       --pkx  Postkarten weichen zurück
 *          --dve  Papier-Keil kommt       --dvp  Skyline-Parallax   --dvx  Papier weicht vor den Unterstützern
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
const MOBILE_OK = ['--rw', '--kw', '--ae', '--ln'];
function track(el, name, get, final = 1, extra = null, snap = false) {
  if (MOBILE && !MOBILE_OK.includes(name)) return;
  const els = extra || (el ? [el] : []);
  if (el && els.length) tracks.push({ el, els, name, get, final, snap, cur: null, last: -1, target: 0 });
}

track(hero, '--hp', () => clamp(window.scrollY / (hero.offsetHeight * 0.9)), 0);
track(globe, '--ov2', () => smooth(progress(cities || chgWrap, 0.98, 0.36)), 0, [$('.stories-globe__intro'), $('.globe-shell'), $('.sf-dim')].filter(Boolean));
/* Karte -> Globus (vorher in main.js): --ov nur auf den Verbrauchern, --ln auf dem Trenner */
const mapSec = $('.emigration');
const trenner = $('.sf-break');
if (mapSec && globe) {
  const ovEls = [$('.emigration__inner'), $('.emigration__dim')].filter(Boolean);
  const vh0 = () => window.innerHeight;
  track(globe, '--ov', () => { const r = clamp((vh0() - globe.getBoundingClientRect().top) / (vh0() * 0.95)); return smooth(r); }, 0, ovEls, true);
  if (trenner) track(globe, '--ln', () => smooth(clamp((vh0() * 0.94 - globe.getBoundingClientRect().top) / (vh0() * 0.5))), 1, [trenner], true);
}
track(cities, '--kw', () => easeOut(progress(cities, 1.0, 0.4)), 1);
track(undDann, '--kw', () => easeOut(progress(undDann, 1.0, 0.4)), 1);
track(chgWrap, '--rw', () => easeOut(progress(chgWrap, 1.0, 0.4)), 1);
track(chg, '--chx', () => smooth(progress(pk, 1.0, 0.45)), 0);
track(pk, '--pkx', () => smooth(progress(devWrap, 1.0, 0.45)), 0);
track(devWrap, '--dve', () => easeOut(progress(devWrap, 1.0, 0.45)), 1);
const nachPapier = $('.sup') || atl;
if (nachPapier) track(devWrap, '--dvx', () => smooth(progress(nachPapier, 1.0, 0.45)), 0);
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
 * (Münzen fließen, eine Kettensäge fällt auf Aktenkoffer, Preissäulen wachsen ...).
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
    /* Handy: höheres Feld, Münze größer, Zahlen und Balken weiter auseinander */
    const mobil = !desktop.matches;
    const R = mobil ? 1.12 : 0.98;
    const crackP = smooth(0.35, 1.2, C) * (1 - smooth(6.85, 7.15, C));
    const splitT = smooth(1.12, 1.78, C) * (1 - smooth(6.35, 6.85, C));
    const intro = A < 1.1 ? back((A - 0.02) / 0.68) : 1;
    const shake = C > 1.12 && C < 1.7 ? Math.sin(C * 86) * 0.03 * (1 - (C - 1.12) / 0.58) : 0;
    const cx = 0.04 + shake;
    const cy = mobil ? 0.33 : -0.22;
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
      const gap = splitT * 0.5 * (R / 0.98);
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
    const numY = mobil ? 2.55 : 1.38;
    const capY = mobil ? 1.9 : 1.0;
    g.text(fmt(cu(49.3, 1.15, 1.5)) + ' %', -1.2, numY, 40, { d: 1.05 });
    g.text('Steuern und Abgaben', -1.2, capY, 15, { weight: 600, d: 1.2 });
    g.text(fmt(cu(50.7, 1.15, 1.5)) + ' %', 1.22, numY, 40, { d: 1.15 });
    g.text('bleiben netto', 1.22, capY, 15, { weight: 600, d: 1.3 });
    /* Vergleich: Abgabenkeil DE gegen OECD-Schnitt */
    const bars = [
      { y: mobil ? -1.77 : -1.82, v: 49.3, l: 'Abgabenkeil Deutschland', d: 1.45 },
      { y: mobil ? -2.57 : -2.36, v: 35.1, l: 'OECD-Schnitt', d: 1.65 },
    ];
    const bx0 = -2.55, bw = 5.1;
    for (const b of bars) {
      g.shape(rrect(bx0 + bw / 2, b.y, bw, 0.24, 0.12), { w: 3.2, close: true, a: 0.7, d: b.d, shadow: false });
      const f = (b.v / 100) * bw * out3((A - b.d - 0.35) / 1.35);
      if (f > 0.05) g.shape(rrect(bx0 + f / 2, b.y, f, 0.24, 0.12), { fill: CREAM, close: true, w: 0, d: b.d + 0.3, shadow: false });
      g.text(b.l, bx0, b.y + 0.32, 14, { align: 'left', weight: 600, d: b.d + 0.15 });
      g.text(fmt(cu(b.v, b.d + 0.35, 1.35)) + ' %', bx0 + bw, b.y + 0.32, 14, { align: 'right', d: b.d + 0.15 });
    }
  }

  /* 2 · Sozialstaat: Kuchen der Staatsausgaben, anfangs voll, läuft bis zur Hälfte leer.
     Rente, Pflege und Krankenkasse fliegen als einzelne Buchstaben aus der leeren Hälfte. */
  function szeneTresor() {
    const A = g.tm;
    const CYCLE = 8.8;
    const INTRO = 0.55;
    const C = A < INTRO ? 0 : (A - INTRO) % CYCLE;
    const cx = -0.48;
    const cy = 0.2;
    const R = 1.2;
    const D0 = 1.15;
    const D1 = 3.05;
    const R0 = 6.45;
    const R1 = 7.45;
    const opened = smooth(D0, D1, C) * (1 - smooth(R0, R1, C));
    const slosh = C > D1 && C < D1 + 1.2 ? Math.sin((C - D1) * 11) * 0.014 * (1 - (C - D1) / 1.2) : 0;
    const empty = clamp(opened * 0.5 + (opened > 0.92 ? slosh : 0), 0, 0.53);
    const sweep = empty * TAU;
    const aStart = Math.PI / 2;
    const aEdge = aStart - sweep;
    const filledSpan = TAU - sweep;

    const wedge = (rad) => {
      const pts = [[cx, cy]];
      const steps = Math.max(20, Math.round(58 * filledSpan / TAU));
      for (let i = 0; i <= steps; i++) {
        const a = aEdge - (filledSpan * i) / steps;
        pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
      }
      pts.push([cx, cy]);
      return pts;
    };
    const arcOf = (rad) => {
      const pts = [];
      const steps = Math.max(14, Math.round(42 * filledSpan / TAU));
      for (let i = 0; i <= steps; i++) {
        const a = aEdge - (filledSpan * i) / steps;
        pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
      }
      return pts;
    };
    const rim = (a, rad) => [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];

    if (sweep < 0.05) {
      g.shape(circ(cx, cy, R, 68), { fill: CREAM, close: true, d: 0.04 });
      g.shape(circ(cx, cy, R * 0.68, 48), { w: 2.3, color: DEEP, shadow: false, d: 0.22 });
    } else {
      g.shape(circ(cx, cy, R, 68), { w: 3.3, d: 0, shadow: false });
      g.shape(wedge(R), { fill: CREAM, close: true, w: 3.3, d: 0 });
      g.shape(arcOf(R * 0.68), { w: 2.3, color: DEEP, shadow: false, d: 0 });
      g.shape([rim(aStart, 0.02), rim(aStart, R)], { w: 2.3, color: '#f4f1ec', shadow: false, d: 0 });
      g.shape([rim(aEdge, 0.02), rim(aEdge, R)], { w: 2.3, color: '#f4f1ec', shadow: false, d: 0 });
    }

    const edgeAt = (time) => {
      const op = smooth(D0, D1, time) * (1 - smooth(R0, R1, time));
      return aStart - clamp(op, 0, 1) * Math.PI;
    };
    const glyph = (ch, x, y, size, rot, alpha) => {
      if (alpha < 0.03) return;
      const ctx = g.ctx;
      const q = g.proj(x, y);
      ctx.save();
      ctx.translate(q[0], q[1]);
      ctx.rotate(rot);
      ctx.font = '700 ' + size * g.dpr * g.k + 'px ' + SANS;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = alpha * 0.4;
      ctx.fillStyle = SHADOW + '1)';
      ctx.fillText(ch, 2.2 * g.dpr * g.k, 3 * g.dpr * g.k);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#f4f1ec';
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    };
    const burst = (word, spawn, size) => {
      const life = 1.55;
      const t = C - spawn;
      if (t <= 0 || t > life) return;
      const chars = [...word];
      const n = chars.length;
      const ang = edgeAt(spawn);
      const ox = cx + Math.cos(ang) * (R + 0.06);
      const oy = cy + Math.sin(ang) * (R + 0.02);
      const xMax = g.cu + (g.W * 0.47) / Math.max(1, g.S);
      let px = size * g.dpr * g.k;
      const measure = () => {
        g.ctx.font = '700 ' + px + 'px ' + SANS;
        const gap = px * 0.045 / Math.max(1, g.S);
        const widths = chars.map((ch) => g.ctx.measureText(ch).width / Math.max(1, g.S));
        const total = widths.reduce((sum, w) => sum + w, 0) + gap * (n - 1);
        return { gap, widths, total };
      };
      let layout = measure();
      const room = Math.max(0.35, xMax - ox - 0.08);
      while (layout.total > room && px > 13 * g.dpr * g.k) {
        px *= 0.88;
        layout = measure();
      }
      const u = t / life;
      const shoot = out3(Math.min(1, t / 0.6));
      const fly = shoot * Math.min(0.42, Math.max(0, room - layout.total));
      const alpha = smooth(0, 0.06, t) * (1 - smooth(0.7, 1, u));
      let cursor = 0;
      chars.forEach((ch, i) => {
        const center = cursor + layout.widths[i] / 2;
        cursor += layout.widths[i] + layout.gap;
        const rot = (i % 2 ? 1 : -1) * smooth(0.55, 1, u) * 0.16;
        glyph(ch, ox + center + fly, oy + shoot * 0.03, px / (g.dpr * g.k), rot, alpha);
      });
    };
    burst('Rente', 1.78, 30);
    burst('Pflege', 2.22, 28);
    burst('Krankenkasse', 2.58, 22);

    const cap = smooth(D1 - 0.1, D1 + 0.5, C) * (1 - smooth(R0 - 0.4, R0 + 0.2, C));
    g.text('die Hälfte', cx, cy - R - 0.46, 32, { a: cap, d: 0 });
    g.text('der Staatsausgaben', cx, cy - R - 0.84, 16, { weight: 600, a: cap, d: 0 });
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

  /* 4 · Unternehmen: Kettensäge fällt von oben und zersägt den Stapel Aktenkoffer */
  function szeneFabrik() {
    const A = g.tm;
    const C = A % 9;
    const hh = 0.22;
    const step = 0.48;
    const y0 = -1.14;
    const cases = [
      { x: -0.02, y: y0, w: 1.72, lean: -0.018 },
      { x: 0.03, y: y0 + step, w: 1.58, lean: 0.014 },
      { x: -0.025, y: y0 + step * 2, w: 1.46, lean: -0.01 },
      { x: 0.02, y: y0 + step * 3, w: 1.32, lean: 0.016 },
    ];
    const TIP = 2.95;
    const tipStart = 2.78;
    const tipHit = cases[cases.length - 1].y + hh + 0.2;
    const tipEnd = y0 - hh - 0.2;
    const approach = smooth(0.42, 1.15, C);
    const through = smooth(1.05, 3.55, C);
    const tipPath = lerp(lerp(tipStart, tipHit, approach), tipEnd, through);
    const rise = smooth(4.85, 6.15, C);
    const reform = smooth(6.4, 8.05, C);
    const biting = through > 0.03 && through < 0.99 && rise < 0.08;
    const buzz = biting ? Math.sin(A * 68) * 0.016 : 0;
    const shudder = biting ? Math.sin(A * 68) * 0.007 : 0;
    const sy = lerp(tipPath, tipStart, rise) + TIP + (biting ? Math.sin(A * 84) * 0.006 : 0);
    const sx = buzz;

    const arc = (p, cx, cy, a0, a1, r, n = 4) => {
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n;
        p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    };
    const halfBody = (side, hw) => {
      const r = 0.06;
      const p = [];
      if (side < 0) {
        p.push([0, hh]);
        arc(p, -hw + r, hh - r, Math.PI / 2, Math.PI, r);
        arc(p, -hw + r, -hh + r, Math.PI, Math.PI * 1.5, r);
        p.push([0, -hh]);
      } else {
        p.push([0, -hh]);
        arc(p, hw - r, -hh + r, -Math.PI / 2, 0, r);
        arc(p, hw - r, hh - r, 0, Math.PI / 2, r);
        p.push([0, hh]);
      }
      p.push(p[0]);
      return p;
    };
    const details = (x, y, rot, hw, side, d) => {
      const seam = hh * 0.34;
      const outer = side === 0 ? hw - 0.1 : side * (hw - 0.1);
      const inner = side === 0 ? -hw + 0.1 : side * 0.05;
      g.shape(xf([[inner, seam], [outer, seam]], x, y, rot), { w: 2.2, color: DEEP, shadow: false, d, a: 0.9 });
      const clasps = side === 0 ? [-1, 1] : [side];
      for (const s of clasps) {
        g.shape(xf(rrect(s * hw * 0.46, seam, 0.14, 0.1, 0.03), x, y, rot), { fill: CREAM, close: true, w: 2.4, d });
      }
      const grip = side === 0
        ? [[-0.28, hh - 0.02], [-0.3, hh + 0.07], [-0.1, hh + 0.16], [0.1, hh + 0.16], [0.3, hh + 0.07], [0.28, hh - 0.02]]
        : side < 0
          ? [[-0.28, hh - 0.02], [-0.3, hh + 0.07], [-0.1, hh + 0.16], [0, hh + 0.13]]
          : [[0, hh + 0.13], [0.1, hh + 0.16], [0.3, hh + 0.07], [0.28, hh - 0.02]];
      g.shape(xf(grip, x, y, rot), { w: 4.2, d });
      if (side !== 0) {
        g.shape(xf([[0, hh * 0.72], [0, -hh * 0.78]], x, y, rot), { w: 1.7, color: '#f4f1ec', shadow: false, d, a: 0.75 });
      }
    };

    /* Schwert hinter den Koffern, damit die Schneide in der Schnittfuge sichtbar bleibt */
    const saege = (x, y, part) => {
      const B = (pts) => xf(pts, x, y, -Math.PI / 2);
      if (part === 'bar') {
        g.shape(B(rrect(1.78, 0, 2.34, 0.15, 0.07)), { fill: CREAM, close: true, d: 0.02 });
        g.shape(B(circ(TIP, 0, 0.1, 14)), { fill: CREAM, w: 2.6, close: true, d: 0.08 });
        const phase = (A * 11) % 0.16;
        for (let t = 0.78 + phase; t < TIP - 0.16; t += 0.16) {
          g.shape(B([[t, 0.055], [t + 0.05, 0.15], [t + 0.1, 0.055]]), { w: 2.2, d: 0.1, shadow: false });
          g.shape(B([[t + 0.04, -0.055], [t + 0.09, -0.15], [t + 0.14, -0.055]]), { w: 2.2, d: 0.1, shadow: false });
        }
        const chain = A * 78;
        g.shape(B([[0.78, 0.034], [TIP - 0.16, 0.034]]), { w: 1.8, color: '#f4f1ec', dash: [4, 6], dashOff: -chain, shadow: false, d: 0.12 });
        g.shape(B([[0.78, -0.034], [TIP - 0.16, -0.034]]), { w: 1.8, color: '#f4f1ec', dash: [4, 6], dashOff: chain, shadow: false, d: 0.12 });
      } else {
        g.shape(B([[-0.5, -0.2], [-0.86, -0.22], [-1.0, -0.04], [-1.0, 0.24], [-0.8, 0.4], [-0.46, 0.26]]), { w: 5, d: 0.05 });
        g.shape(B([[-0.5, 0], [-0.74, -0.02], [-0.74, 0.2], [-0.48, 0.16]]), { w: 3.2, color: DEEP, shadow: false, d: 0.1 });
        g.shape(B(rrect(0.02, 0, 1.04, 0.56, 0.12)), { fill: CREAM, close: true, d: 0.02 });
        g.shape(B([[-0.18, 0.22], [-0.24, 0.48], [-0.06, 0.64], [0.34, 0.66], [0.52, 0.46], [0.44, 0.22]]), { w: 5, d: 0.08 });
        g.shape(B([[0.36, 0.16], [0.58, 0.5], [0.76, 0.1]]), { w: 4.2, d: 0.12 });
        g.shape(B(circ(-0.2, -0.02, 0.12, 14)), { w: 2.4, color: DEEP, shadow: false, d: 0.14 });
      }
    };

    g.shape([[-1.4, y0 - hh - 0.1], [1.4, y0 - hh - 0.1]], { w: 4.4, d: 0.02 });
    saege(sx, sy, 'bar');
    cases.forEach((c, i) => {
      const passed = 1 - smooth(c.y - hh * 0.2, c.y + hh + 0.06, tipPath);
      const open = passed * (1 - reform);
      const d = 0.06 + i * 0.07;
      const x = c.x + shudder;
      if (open < 0.04) {
        g.shape(xf(rrect(0, 0, c.w, hh * 2, 0.06), x, c.y, c.lean), { fill: CREAM, close: true, w: 3.6, d });
        details(x, c.y, c.lean, c.w / 2, 0, d);
        return;
      }
      const slide = open * (0.2 + i * 0.07);
      const fall = open * (0.02 + i * 0.06);
      const spin = open * (0.06 + i * 0.1);
      for (const side of [-1, 1]) {
        const hx = x + side * slide;
        const hy = c.y - fall;
        const rot = c.lean + side * spin;
        g.shape(xf(halfBody(side, c.w / 2), hx, hy, rot), { fill: CREAM, close: true, w: 3.6, d });
        details(hx, hy, rot, c.w / 2, side, d);
      }
    });
    saege(sx, sy, 'body');
    const tipY = sy - TIP;
    const stackTop = cases[cases.length - 1].y + hh;
    const stackBot = y0 - hh;
    if (biting && tipY < stackTop + 0.05 && tipY > stackBot - 0.08) {
      for (let s = 0; s < 8; s++) {
        const life = (A * 2.2 + s * 0.13) % 1;
        const side = s % 2 ? 1 : -1;
        g.shape(xf(rect(0, 0, 0.07, 0.032), sx + side * (0.04 + life * 0.58), tipY + (rnd(s + 2) - 0.5) * 0.14 - life * life * 0.45, life * 4 * side), {
          fill: s % 2 ? '#f4f1ec' : CREAM, close: true, w: 0, a: (1 - life) * 0.92, shadow: false, d: 0,
        });
      }
    }
    g.text('Bürokratie', 0, y0 - hh - 0.42, 18, { weight: 600, d: 0.36 });
  }

  /* 5 · Mieten: die Platten landen auf dem Mieter. Je mehr, desto tiefer geht er in die Knie — Atlas */
  function szeneHaus() {
    /* Stapeln etwas zügiger als das allgemeine Tempo 0,6 */
    const A = g.tm < g.age ? 2.2 + (g.age - 2.2) * 0.85 : g.tm;
    const C = A % 13;
    const ground = -1.02;
    const px = -0.06;
    const nOld = 3;
    const n = 6;
    const bw = 1.32;
    const bh = 0.158;
    const ph = 0.132;
    const kx = -2.05;
    const topY = 1.7;
    const tIn = 0.48;
    const per = 1.02;
    const drop = 0.58;
    const lead = 0.2;
    const fade0 = 11.25;
    const fade = 1 - smooth(fade0, 12.45, C);
    const fmt = (v) => Math.round(v).toLocaleString('de-DE') + ' €';
    const fillOf = (k) => (k < nOld ? PINK : CREAM);

    /* Kopf bleibt unter der Last sichtbar, die Knie knicken nach außen */
    const pose = (s) => {
      const t = clamp(s);
      const hipY = ground + lerp(0.9, 0.58, t);
      const shoY = hipY + lerp(0.48, 0.38, t);
      const headR = 0.17;
      const headY = shoY + lerp(0.36, 0.32, t);
      return {
        hipY,
        shoY,
        headY,
        headR,
        plateBottom: headY + headR + 0.035,
        foot: lerp(0.22, 0.46, t),
        knee: lerp(0.2, 0.52, t),
        kneeY: ground + lerp(0.5, 0.26, t),
      };
    };

    let placed = 0;
    let carry = null;
    for (let i = 0; i < n; i++) {
      const tl = C - (tIn + i * per);
      if (tl >= drop) placed += 1;
      else if (tl >= -lead) {
        carry = { i, tl };
        break;
      }
    }
    let dip = 0;
    if (placed > 0) {
      const lt = C - (tIn + (placed - 1) * per + drop);
      if (lt >= 0 && lt < 0.4) dip = Math.sin((lt / 0.4) * Math.PI) * (0.035 + placed * 0.008);
    }
    const anticipate = carry && carry.tl > 0 ? smooth(drop * 0.32, drop, carry.tl) / n : 0;
    const load = placed / n;
    const squat = clamp(load + anticipate + dip + Math.sin(C * 8.2) * 0.01 * smooth(0.4, 1, load));
    const P = pose(squat);
    const lean = Math.sin(C * 1.2) * 0.011 * (0.25 + squat);
    const plateX = (k) => px + lean * k * 1.15;
    const plateY = (k) => P.plateBottom + ph / 2 + k * bh;

    /* Kran setzt die Last ab, der Mieter trägt sie */
    for (const dx of [-0.08, 0.08]) g.shape([[kx + dx, ground], [kx + dx, topY]], { w: 3.6, d: 0.08, a: fade });
    for (let i = 0; i < 7; i++) {
      const y0 = ground + (i * (topY - ground)) / 7;
      const y1 = ground + ((i + 1) * (topY - ground)) / 7;
      g.shape([[kx - 0.08, y0], [kx + 0.08, y1]], { w: 2, a: fade * 0.7, d: 0.1 + i * 0.03, shadow: false });
    }
    g.shape([[kx - 0.42, topY], [px + 0.7, topY]], { w: 4.2, d: 0.2, a: fade });
    g.shape([[kx - 0.42, topY], [kx + 0.28, topY + 0.22], [px + 0.7, topY]], { w: 2.2, a: fade * 0.8, d: 0.28, shadow: false });
    g.shape(rect(kx - 0.28, topY - 0.12, 0.26, 0.2), { fill: DEEP, close: true, w: 2.8, d: 0.32, shadow: false, a: fade });
    g.shape(rect(kx + 0.12, topY + 0.1, 0.24, 0.16), { fill: CREAM, close: true, d: 0.3, a: fade });
    g.shape([[kx - 0.55, ground], [1.7, ground]], { w: 4.6, d: 0.05, a: fade });

    /* Beine knicken mit jeder Lage weiter ein, der Rumpf bleibt ein Körper */
    for (const side of [-1, 1]) {
      const footX = px + side * P.foot;
      const kneeX = px + side * P.knee;
      const hipX = px + side * 0.1;
      g.shape([[footX - 0.07, ground], [footX + 0.09, ground]], { w: 3.8, d: 0.1, a: fade });
      g.shape([[footX, ground + 0.01], [kneeX, P.kneeY], [hipX, P.hipY]], { w: 4.6, d: 0.12, a: fade });
    }
    const torsoH = P.shoY - P.hipY + 0.08;
    g.shape(rrect(px, (P.hipY + P.shoY) / 2, 0.38, torsoH, 0.11), { fill: PINK, close: true, w: 3.6, d: 0.16, a: fade });
    g.shape([[px, P.shoY + 0.02], [px, P.headY - P.headR + 0.02]], { w: 3.6, d: 0.18, a: fade, shadow: false });
    g.shape(circ(px, P.headY, P.headR, 18), { fill: CREAM, w: 3.5, close: true, d: 0.2, a: fade });

    for (let k = 0; k < placed; k++) {
      const x = plateX(k);
      const y = plateY(k);
      g.shape(rrect(x, y, bw, ph, 0.03), { fill: fillOf(k), close: true, w: 3, d: 0, a: fade });
      g.shape([[x - bw / 2 + 0.08, y + ph * 0.22], [x + bw / 2 - 0.08, y + ph * 0.22]], {
        w: 1.7, color: '#f4f1ec', shadow: false, d: 0, a: fade * 0.55,
      });
    }
    if (placed > 0) {
      const lt = C - (tIn + (placed - 1) * per + drop);
      if (lt >= 0 && lt < 0.42 && fade > 0.04) {
        const y0 = P.plateBottom + (placed - 1) * bh;
        for (let s = 0; s < 6; s++) {
          const side = s % 2 ? 1 : -1;
          g.shape(xf(rect(0, 0, 0.05, 0.035), plateX(placed - 1) + side * (0.2 + lt * 0.7), y0 + lt * 0.35 * rnd(s + 3), s + lt * 6), {
            fill: s % 2 ? '#f4e4dc' : fillOf(placed - 1), close: true, w: 0, a: (1 - lt / 0.42) * fade, shadow: false, d: 0,
          });
        }
      }
    }

    /* Arme rahmen den Kopf und stemmen die unterste Platte an den Ecken */
    const handY = P.plateBottom + 0.012;
    for (const side of [-1, 1]) {
      const sho = [px + side * 0.15, P.shoY + 0.04];
      const elbow = [px + side * lerp(0.46, 0.58, squat), P.headY - 0.02];
      const hand = [px + side * (bw / 2 - 0.02), handY];
      g.shape([sho, elbow, hand], { w: 4.4, d: 0.22, a: fade });
      g.shape(circ(hand[0], hand[1], 0.045, 8), { fill: CREAM, w: 2.5, close: true, d: 0.26, a: fade });
    }

    const doneAt = tIn + (n - 1) * per + drop;
    let hookX;
    let hookY;
    if (carry && fade > 0.8) {
      const prevX = carry.i === 0 ? kx + 0.28 : plateX(carry.i - 1);
      const u = clamp((carry.tl + lead) / (drop + lead));
      const travel = smooth(0, 0.4, u);
      const descend = smooth(0.3, 1, u);
      const sway = 0.04 * Math.sin(Math.max(0, carry.tl) * 6.5) * (1 - descend);
      hookX = lerp(prevX, plateX(carry.i), travel) + sway;
      hookY = lerp(1.08, plateY(carry.i), descend);
    } else {
      const sway = 0.025 * Math.sin(C * 1.6);
      const parked = placed === n ? smooth(doneAt, doneAt + 0.65, C) : 0;
      /* Haken zurück unter den Ausleger, weg von der Jahreszahl */
      hookX = lerp(px, kx + 0.18, parked) + sway;
      hookY = lerp(1.18, topY - 0.32, parked);
    }
    g.shape(rect(hookX, topY, 0.15, 0.08), { fill: CREAM, close: true, w: 2.2, d: 0.34, shadow: false, a: fade });
    if (carry && fade > 0.8) {
      const s = out3((carry.tl + lead) / 0.18) * fade;
      g.shape([[hookX, topY], [hookX, hookY + ph / 2]], { w: 2.4, d: 0, shadow: false, a: fade });
      g.shape(rrect(hookX, hookY, bw, ph, 0.03), { fill: fillOf(carry.i), close: true, w: 3, d: 0, a: s });
    } else {
      g.shape([[hookX, topY], [hookX, hookY]], { w: 2.4, d: 0, shadow: false, a: fade });
      g.shape(rect(hookX, hookY, 0.14, 0.08), { fill: CREAM, close: true, w: 2.6, d: 0, a: fade });
    }

    /* 2005 ist die Last, die noch zu stemmen war; darüber wächst 2024 */
    const markY = P.plateBottom + nOld * bh;
    const top = P.plateBottom + placed * bh;
    const oldA = fade * (placed >= nOld ? out3((C - (tIn + (nOld - 1) * per + drop)) / 0.35) : 0);
    if (oldA > 0.04) {
      g.shape([[plateX(nOld - 1) - bw / 2 - 0.05, markY], [-1.0, markY]], {
        w: 1.8, dash: [4, 5], color: '#f4f1ec', shadow: false, d: 0, a: oldA * 0.8,
      });
      g.text('2005', -1.28, markY - 0.02, 14, { weight: 600, d: 0, a: oldA });
      g.text(fmt(1233), -1.28, markY - 0.26, 16, { d: 0, a: oldA });
    }
    const fullA = fade * (placed === n ? Math.min(1, back((C - doneAt) / 0.4)) : 0);
    const rx = px + bw / 2 + 0.82;
    if (fullA > 0.04) {
      g.text('2024', rx, top + 0.18, 13, { weight: 600, d: 0, a: fullA });
      g.text(fmt(2611), rx, top - 0.06, 16, { d: 0, a: fullA });
    }
    g.text('Mieter', px, ground - 0.24, 15, { weight: 600, d: 0.32, a: fade });
    g.text('Baukosten je m²', px, ground - 0.48, 14, { weight: 600, d: 0.4, a: fade });

    {
      const ready = doneAt + 0.18;
      const p = back((C - ready) / 0.48) * (1 - smooth(fade0, fade0 + 0.7, C));
      if (p > 0.04) {
        const pillY = P.plateBottom + (nOld + 0.55) * bh;
        g.shape(xf(rrect(0, 0, 0.92, 0.34, 0.17), rx, pillY, 0, Math.min(1.08, p)), { fill: CREAM, close: true, d: 0 });
        g.text('+112 %', rx, pillY, 15 * Math.min(1, p), { color: DEEP, d: 0, a: Math.min(1, p) });
      }
    }
  }

  const STAT = [4, 6, 4, 4.15, 10.5];
  const SZENEN = [szeneSteuer, szeneTresor, szeneRente, szeneFabrik, szeneHaus];
  const FITS = [
    { x: [-2.65, 2.65], y: [-2.6, 1.75] },
    { x: [-1.95, 2.85], y: [-2.0, 1.7] },
    { x: [-1.9, 1.9], y: [-0.9, 2.15] },
    { x: [-1.85, 1.85], y: [-1.95, 2.62] },
    { x: [-2.55, 2.15], y: [-1.62, 1.88], v: 0.2 },
  ];

  /* ------------------------------------------------------------ Steuerung */
  const canvases = rows.map((row, i) => {
    const panel = row.querySelector('.chg__panel');
    if (!panel) return null;
    const c = document.createElement('canvas');
    c.className = 'chg__scene' + (i === 0 ? ' chg__scene--steuer' : '');
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
    const b = i === 0 && !desktop.matches ? { x: [-2.65, 2.65], y: [-3.15, 2.95] } : FITS[i];
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
