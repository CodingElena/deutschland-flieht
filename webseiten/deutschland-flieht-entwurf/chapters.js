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

/* Footer „Quellen“ öffnet den Credits-Dialog */
$('#foot-credits')?.addEventListener('click', () => document.getElementById('credits-open')?.click());

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
 * Läuft nur, solange die Zeile offen und sichtbar ist. Handy: keine Szenen.
 * Reduzierte Bewegung: Standbild.
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
    ctx: null, W: 0, H: 0, S: 100, cu: 0, cv: 0, dpr: 1, age: 0, tm: 0,
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
      const w = (o.w === undefined ? 4.4 : o.w) * this.dpr;
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
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash(o.dash ? [o.dash[0] * this.dpr, o.dash[1] * this.dpr] : []);
      ctx.lineDashOffset = (o.dashOff || 0) * this.dpr;
      if (o.shadow !== false && w > 0) {
        build(3.4 * this.dpr, 4.6 * this.dpr);
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
      build(3.4 * this.dpr, 4.6 * this.dpr);
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
      ctx.lineWidth = Math.max(2, w - 9 * this.dpr);
      ctx.stroke();
    },
    text(str, x, y, size, o = {}) {
      const r = out3((this.age - (o.d || 0)) / 0.45);
      if (r <= 0.01) return;
      const ctx = this.ctx;
      const q = this.proj(x, y);
      ctx.setLineDash([]);
      ctx.font = (o.weight || 700) + ' ' + size * this.dpr + 'px ' + SANS;
      ctx.textAlign = o.align || 'center';
      ctx.textBaseline = 'middle';
      const a = r * (o.a === undefined ? 1 : o.a);
      ctx.globalAlpha = a * 0.42;
      ctx.fillStyle = SHADOW + '1)';
      ctx.fillText(str, q[0] + 2.6 * this.dpr, q[1] + 3.4 * this.dpr);
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
  /* 1 · Steuern: Lohn fließt zu Staat (49,3 %) und Netto (50,7 %), unten Vergleich mit OECD-Schnitt (35,1 %) */
  function szeneSteuer() {
    const A = g.tm;
    const bag = { x: -2.0, y: 0.05 }, st = { x: 0.15, y: 0.7 }, wa = { x: 0.15, y: -0.85 };
    const P0 = [bag.x + 0.55, bag.y + 0.35], PS = [st.x - 1.0, st.y - 0.1], PW = [wa.x - 0.75, wa.y + 0.05];
    const CS = [(P0[0] + PS[0]) / 2, 1.55], CW = [(P0[0] + PW[0]) / 2, -0.7];
    for (const [c, end, d] of [[CS, PS, 0.5], [CW, PW, 0.6]]) {
      const pts = [];
      for (let i = 0; i <= 24; i++) pts.push(quad(P0, c, end, i / 24));
      g.shape(pts, { w: 3, a: 0.5, dash: [9, 13], dashOff: -A * 34, d, shadow: false });
    }
    /* Münzen: 49,3 % zum Staat, Rest in die Tasche */
    const T = 1.9, step = 0.42, t0 = 1.0;
    const kmax = Math.floor((A - t0) / step);
    let pulS = 0, pulW = 0, spawn = 0;
    const coinsDraw = [];
    for (let k = Math.max(0, kmax - 9); k <= kmax; k++) {
      const u = (A - t0 - k * step) / T;
      if (u < 0) continue;
      if (u < 0.2) spawn = Math.max(spawn, 1 - u / 0.2);
      const toS = Math.floor((k + 1) * 0.493) > Math.floor(k * 0.493);
      if (u >= 1) {
        const bump = Math.max(0, 1 - ((u - 1) * T) / 0.4);
        if (toS) pulS = Math.max(pulS, bump);
        else pulW = Math.max(pulW, bump);
        continue;
      }
      const e = u * u * (3 - 2 * u) * 0.35 + u * 0.65;
      const pos = quad(P0, toS ? CS : CW, toS ? PS : PW, e);
      coinsDraw.push([pos[0], pos[1], 0.1 * (1 - 0.35 * smooth(0.8, 1, u)), k]);
    }
    /* Staat */
    {
      const s = (1 + 0.035 * pulS) * back((A - 0.2) / 0.7);
      const B = (pts) => xf(pts, st.x, st.y - 0.2 * (s - 1), 0, s);
      g.shape(B([[-0.66, 0.4], [0, 0.95], [0.66, 0.4], [-0.66, 0.4]]), { fill: CREAM, fillA: 0.9, close: true, d: 0.2 });
      g.shape(B(circ(0, 0.58, 0.1, 16)), { w: 2.6, color: DEEP, shadow: false, d: 0.5 });
      g.shape(B(rect(0, 0.3, 1.46, 0.14)), { fill: CREAM, fillA: 0.9, close: true, d: 0.25 });
      for (const cx of [-0.48, -0.16, 0.16, 0.48]) g.shape(B(rect(cx, -0.1, 0.15, 0.6)), { fill: CREAM, fillA: 0.9, close: true, d: 0.3 });
      g.shape(B(rect(0, -0.46, 1.62, 0.13)), { fill: CREAM, fillA: 0.9, close: true, d: 0.35 });
      g.shape(B(rect(0, -0.6, 1.86, 0.13)), { fill: CREAM, fillA: 0.9, close: true, d: 0.4 });
    }
    /* Netto-Portemonnaie */
    {
      const s = (1 + 0.035 * pulW) * back((A - 0.35) / 0.7);
      const B = (pts) => xf(pts, wa.x, wa.y, 0, s);
      const wig = 0.03 * pulW * Math.sin(A * 20);
      g.shape(B(xf(rect(0, 0, 0.5, 0.34), -0.12, 0.4, -0.2 + wig)), { fill: PINK, close: true, d: 0.5 });
      g.shape(B(xf(rect(0, 0, 0.5, 0.34), 0.14, 0.42, 0.14 - wig)), { fill: CREAM, close: true, d: 0.55 });
      g.shape(B(rrect(0, 0, 1.2, 0.76, 0.14)), { fill: CREAM, close: true, d: 0.4 });
      g.shape(B([[-0.6, 0.12], [0.6, 0.12]]), { w: 3, color: DEEP, shadow: false, d: 0.6 });
      g.shape(B(circ(0.4, -0.12, 0.1, 16)), { fill: DEEP, w: 2.4, close: true, d: 0.65 });
    }
    /* Lohnbeutel */
    {
      const sq = 1 + 0.02 * spawn;
      const s = back((A - 0.05) / 0.7);
      const B = (pts) => xf(pts, bag.x, bag.y - 0.1 * (1 - sq), 0, s * 1, s * sq);
      g.shape(B(circ(0, -0.1, 0.52, 40)), { fill: CREAM, close: true, d: 0.05 });
      g.shape(B([[-0.2, 0.36], [-0.34, 0.66], [0.34, 0.66], [0.2, 0.36]]), { fill: CREAM, close: true, d: 0.1 });
      g.shape(B(rrect(0, 0.4, 0.5, 0.1, 0.05)), { fill: DEEP, w: 2.6, close: true, d: 0.2 });
      g.text('€', bag.x, bag.y - 0.1 * (1 - sq) - 0.1 * s, 46, { color: DEEP, d: 0.3 });
    }
    /* fliegende Münzen obenauf */
    for (const [x, y, r, k] of coinsDraw) coin(x, y, r, { a: 1, d: 0 });
    /* Zahlen und Beschriftung */
    const cu = (to, d, dur) => (to * out3((A - d) / dur));
    const fmt = (v) => v.toFixed(1).replace('.', ',');
    g.text(fmt(cu(49.3, 1.0, 2.6)) + ' %', st.x + 1.2, st.y + 0.18, 46, { align: 'left', d: 0.4 });
    g.text('Steuern und Abgaben', st.x + 1.2, st.y - 0.25, 16, { align: 'left', weight: 600, d: 0.6 });
    g.text(fmt(cu(50.7, 1.0, 2.6)) + ' %', wa.x + 1.2, wa.y + 0.18, 46, { align: 'left', d: 0.7 });
    g.text('bleiben netto', wa.x + 1.2, wa.y - 0.25, 16, { align: 'left', weight: 600, d: 0.8 });
    g.text('Bruttolohn', bag.x, -0.95, 18, { weight: 600, d: 0.5 });
    /* Vergleich: Abgabenkeil DE gegen OECD-Schnitt */
    const bars = [{ y: -1.75, v: 49.3, l: 'Abgabenkeil Deutschland', d: 0.9 }, { y: -2.3, v: 35.1, l: 'OECD-Schnitt', d: 1.1 }];
    const bx0 = -2.55, bw = 5.1;
    for (const b of bars) {
      g.shape(rrect(bx0 + bw / 2, b.y, bw, 0.24, 0.12), { w: 3.2, close: true, a: 0.7, d: b.d, shadow: false });
      const f = (b.v / 100) * bw * out3((A - b.d - 0.5) / 1.6);
      if (f > 0.05) g.shape(rrect(bx0 + f / 2, b.y, f, 0.24, 0.12), { fill: CREAM, close: true, w: 0, d: b.d + 0.4, shadow: false });
      g.text(b.l, bx0, b.y + 0.32, 14, { align: 'left', weight: 600, d: b.d + 0.2 });
      g.text(fmt(cu(b.v, b.d + 0.5, 1.6)) + ' %', bx0 + bw, b.y + 0.32, 14, { align: 'right', d: b.d + 0.2 });
    }
  }

  /* 2 · Sozialstaat: Tresor speist Rohre in drei Sparschweine; Münzstapel wachsen */
  function szeneTresor() {
    const A = g.tm;
    const vx = -1.7, vy = 0.05;
    const piggies = [{ x: 1.15, y: 1.0 }, { x: 1.15, y: 0.05 }, { x: 1.15, y: -0.9 }];
    const trunk = [[vx + 0.62, vy], [-0.55, vy]];
    const paths = piggies.map((p) => [[vx + 0.62, vy], [-0.55, vy], [-0.55, p.y + 0.6], [p.x, p.y + 0.6], [p.x, p.y + 0.3]]);
    /* Rohre */
    g.tube(trunk, { d: 0.3, w: 0.2 });
    for (let i = 0; i < 3; i++) g.tube(paths[i].slice(1), { d: 0.5 + i * 0.15, w: 0.2 });
    /* Tresor */
    {
      const s = back((A - 0.05) / 0.7);
      const B = (pts) => xf(pts, vx, vy, 0, s);
      g.shape(B(rrect(0, 0, 1.4, 1.56, 0.14)), { fill: CREAM, close: true, d: 0.05 });
      g.shape(B(rrect(0, 0, 1.12, 1.28, 0.1)), { w: 2.8, color: DEEP, close: true, shadow: false, d: 0.2 });
      g.shape(B(circ(0, 0.02, 0.46, 40)), { fill: '#1a0306', w: 3.6, close: true, d: 0.3 });
      for (let i = 0; i < 24; i++) {
        const a = A * 0.5 + (i / 24) * TAU, l = i % 3 === 0 ? 0.11 : 0.06;
        g.shape(B([[Math.cos(a) * 0.46, Math.sin(a) * 0.46 + 0.02], [Math.cos(a) * (0.46 - l), Math.sin(a) * (0.46 - l) + 0.02]]), { w: 3, shadow: false, d: 0.5 + i * 0.01 });
      }
      for (let i = 0; i < 4; i++) {
        const a = -A * 0.7 + (i / 4) * TAU;
        g.shape(B([[0, 0.02], [Math.cos(a) * 0.28, Math.sin(a) * 0.28 + 0.02]]), { w: 4.2, d: 0.6 });
      }
      g.shape(B(circ(0, 0.02, 0.1, 16)), { fill: CREAM, close: true, d: 0.6 });
      for (const [bx, by] of [[-0.55, 0.62], [0.55, 0.62], [-0.55, -0.62], [0.55, -0.62]]) g.shape(B(circ(bx, by, 0.045, 10)), { fill: DEEP, w: 2.4, close: true, d: 0.4, shadow: false });
      g.shape(B([[-0.5, -0.78], [-0.5, -0.92], [-0.3, -0.92]]), { w: 4, d: 0.3, shadow: false });
      g.shape(B([[0.5, -0.78], [0.5, -0.92], [0.3, -0.92]]), { w: 4, d: 0.3, shadow: false });
    }
    g.text('Pflichtbeiträge', vx, -1.15, 17, { weight: 600, d: 0.6 });
    /* Münzen laufen durch die Rohre */
    const lens = paths.map((pts) => {
      const c = [0];
      for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      return c;
    });
    const posAt = (i, d) => {
      const pts = paths[i], c = lens[i];
      for (let k = 1; k < pts.length; k++) {
        if (d <= c[k]) {
          const f = (d - c[k - 1]) / (c[k] - c[k - 1]);
          return [lerp(pts[k - 1][0], pts[k][0], f), lerp(pts[k - 1][1], pts[k][1], f)];
        }
      }
      return pts[pts.length - 1];
    };
    const speed = 1.15, period = 0.9;
    const arrivals = [0, 0, 0];
    const bump = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      const total = lens[i][lens[i].length - 1];
      const tr = total / speed;
      const tStart = 1.3 + i * 0.3;
      const kmax = Math.floor((A - tStart) / period);
      for (let k = Math.max(0, kmax - Math.ceil(tr / period) - 1); k <= kmax; k++) {
        const t = A - tStart - k * period;
        if (t < 0) continue;
        if (t >= tr) {
          arrivals[i]++;
          bump[i] = Math.max(bump[i], Math.max(0, 1 - (t - tr) / 0.35));
          continue;
        }
        const p = posAt(i, t * speed);
        coin(p[0], p[1], 0.095, { w: 3 });
      }
      arrivals[i] = arrivals[i] + Math.max(0, Math.floor((A - tStart - Math.ceil(tr / period) * period) / period));
    }
    /* Sparschweine */
    piggies.forEach((pg, i) => {
      const sq = bump[i];
      const s = 0.66 * back((A - 0.5 - i * 0.15) / 0.7);
      const sx = s * (1 + 0.07 * sq), sy = s * (1 - 0.1 * sq);
      const B = (pts) => xf(pts, pg.x, pg.y - 0.05 * (1 - sy / s), 0, sx, sy);
      g.shape(B([[-0.2, -0.28], [-0.2, -0.52], [-0.05, -0.52], [-0.05, -0.28]]), { fill: CREAM, close: true, d: 0.7 });
      g.shape(B([[0.18, -0.28], [0.18, -0.52], [0.33, -0.52], [0.33, -0.28]]), { fill: CREAM, close: true, d: 0.7 });
      g.shape(B(ell(0, 0, 0.58, 0.4)), { fill: CREAM, close: true, d: 0.6 });
      g.shape(B([[-0.58, 0.05], [-0.74, 0.12], [-0.7, 0.26], [-0.62, 0.18]]), { w: 3.4, d: 0.9 });
      g.shape(B([[0.2, 0.32], [0.3, 0.55], [0.42, 0.28], [0.2, 0.32]]), { fill: PINK, close: true, d: 0.8 });
      g.shape(B(ell(0.6, -0.04, 0.14, 0.11, 16)), { fill: PINK, close: true, d: 0.8 });
      g.shape(B(circ(0.56, -0.04, 0.02, 6)), { fill: DEEP, w: 2, close: true, shadow: false, d: 0.9 });
      g.shape(B(circ(0.64, -0.04, 0.02, 6)), { fill: DEEP, w: 2, close: true, shadow: false, d: 0.9 });
      g.shape(B(circ(0.34, 0.12, 0.05, 10)), { fill: DEEP, w: 2, close: true, shadow: false, d: 0.9 });
      g.shape(B([[-0.1, 0.4], [0.12, 0.4]]), { w: 4, color: DEEP, shadow: false, d: 0.9 });
      /* Münzturm daneben */
      const n = arrivals[i] > 0 ? ((arrivals[i] - 1) % 6) + 1 : 0;
      for (let k = 0; k < n; k++) {
        const pop = back((A - 0) * 0 + 1);
        g.shape(ell(pg.x + 0.98, pg.y - 0.4 + k * 0.1, 0.2, 0.065, 20), { fill: CREAM, close: true, w: 3, d: 0, a: pop });
      }
    });
    g.text('Privat vorsorgen', 1.15, 2.25, 24, { d: 0.9 });
    g.text('eigenes Vermögen statt Zwang', 1.15, 1.88, 14, { weight: 600, d: 1.1 });
  }

  /* 3 · Rente: Münzstapel brennt; Wippe: 1962 sechs Beitragszahler je Rentner, heute zwei */
  function szeneRente() {
    const A = g.tm;
    const cx = -1.45;
    /* Münzstapel */
    const cyc = (A % 8) / 8;
    const b = 3.3 * smooth(0.08, 0.86, cyc) * (1 - smooth(0.9, 1, cyc));
    const ch = 0.17, rx = 0.62, ry = 0.17, base = -1.1;
    let topY = base;
    for (let k = 0; k < 7; k++) {
      const rem = k >= 3 ? clamp(1 - (b - (6 - k))) : 1;
      const h = ch * rem;
      if (rem <= 0.02) continue;
      const y = base + k * ch;
      const d = 0.1 + k * 0.08;
      g.shape(rect(cx, y + h / 2, rx * 2, h), { fill: CREAM, close: true, d });
      for (const rxx of [-0.4, -0.2, 0, 0.2, 0.4]) g.shape([[cx + rxx * rx * 1.4, y + 0.02], [cx + rxx * rx * 1.4, y + h - 0.02]], { w: 2, color: DEEP, shadow: false, a: 0.5, d: d + 0.2 });
      g.shape(ell(cx, y + h, rx, ry, 30), { fill: WHITE, close: true, w: 3.6, d: d + 0.1 });
      topY = y + h;
    }
    /* Flammen */
    const flame = (x, y, w, hh, ph, fill, o = {}) => {
      const L = [], R = [];
      for (let i = 0; i <= 10; i++) {
        const u = i / 10;
        const sway = Math.sin(A * 3.2 + ph + u * 5) * 0.14 * u + Math.sin(A * 5.1 + ph * 1.3 + u * 8) * 0.05 * u;
        const wd = w * Math.pow(1 - u, 0.8) * (1 + 0.15 * Math.sin(u * 6 + A * 4 + ph));
        L.push([x + sway - wd, y + u * hh]);
        R.push([x + sway + wd, y + u * hh]);
      }
      g.shape(L.concat(R.reverse()), { fill, close: true, ...o });
    };
    const fl = 0.85 + 0.15 * Math.sin(A * 6);
    if (A > 0.6) {
      flame(cx - 0.36, topY, 0.22, 0.95 * fl, 0.4, CREAM, { d: 0.6 });
      flame(cx + 0.36, topY, 0.22, 0.85 * fl, 2.1, CREAM, { d: 0.65 });
      flame(cx, topY, 0.3, 1.35 * fl, 1.3, WHITE, { d: 0.55 });
      flame(cx, topY, 0.18, 0.95 * fl, 3.0, PINK, { d: 0.7, w: 0, shadow: false });
      flame(cx, topY, 0.09, 0.5 * fl, 4.2, '#f4e4dc', { d: 0.75, w: 0, shadow: false });
    }
    for (let s = 0; s < 14; s++) {
      const life = (A * 0.28 + s * 0.137) % 1;
      const px = cx + Math.sin(s * 3.1 + A * 0.8) * 0.55 * (0.3 + life);
      const py = topY + 0.4 + life * 1.5;
      g.shape(xf(rect(0, 0, 0.07, 0.07), px, py, A + s), { fill: CREAM, close: true, w: 0, a: (1 - life) * smooth(0, 0.08, life), shadow: false, d: 0.9 });
    }
    const fmt = (v) => Math.round(v) + ' %';
    g.text(fmt(24 * out3((A - 0.8) / 2.2)), cx, -1.62, 44, { d: 0.5 });
    g.text('des Bundeshaushalts für die Rente', cx, -1.98, 15, { weight: 600, d: 0.8 });
    /* Wippe */
    const fx = 1.25, fy = -0.95;
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
    g.text(showOld > 0.5 ? '1962 · 6 : 1' : 'heute · 2 : 1', fx, 1.25, 30, { d: 0.9, a: 1 });
    g.text('Beitragszahler je Altersrentner', fx, 0.88, 14, { weight: 600, d: 1.1 });
  }

  /* 4 · Unternehmen: Der Formularberg (Bürokratie) wird weggeweht, die Fabrik läuft auf */
  function szeneFabrik() {
    const A = g.tm;
    const C = A % 9;
    const px = -1.95, baseY = -1.0;
    for (let i = 0; i < 7; i++) {
      const ti = 0.8 + i * 0.3;
      const tl = 4.0 + (6 - i) * 0.28;
      const tt = C - ti;
      if (tt < 0) continue;
      let ox = (rnd(i) - 0.5) * 0.1, oy = baseY + 0.07 + i * 0.145 + (1 - back(tt / 0.55)) * 1.5, rot = (rnd(i + 9) - 0.5) * 0.06, al = 1;
      if (C > tl) {
        const u = (C - tl) / 1.3;
        ox += u * (1.5 + rnd(i) * 0.8);
        oy += u * (0.9 + rnd(i + 4) * 0.7) + 0.12 * Math.sin(u * 9);
        rot += u * (2 + rnd(i + 2) * 2);
        al = 1 - smooth(0.55, 1, u);
      }
      if (al <= 0.02) continue;
      g.shape(xf(rect(0, 0, 1.0, 0.125), px + ox, oy, rot), { fill: CREAM, close: true, d: 0, a: al, w: 3.4 });
      g.shape(xf([[-0.38, 0], [0.12, 0]], px + ox, oy, rot), { w: 2.2, color: DEEP, shadow: false, a: al * 0.8, d: 0 });
      if (i % 2 === 0) g.shape(xf(circ(0.34, 0, 0.035, 8), px + ox, oy, rot), { fill: DEEP, close: true, w: 0, shadow: false, a: al, d: 0 });
    }
    g.text('Bürokratie', px, 0.55, 20, { d: 0.9 });
    /* Fabrik */
    const fx = 0.3, fy = -0.6;
    const lit = smooth(4.5, 5.1, C) * (1 - smooth(8.3, 9, C));
    g.shape(rect(fx, fy, 2.3, 0.86), { fill: CREAM, close: true, d: 0.3 });
    for (let i = 0; i < 3; i++) {
      const x0 = fx - 1.15 + i * 0.77;
      g.shape([[x0, fy + 0.43], [x0, fy + 0.85], [x0 + 0.77, fy + 0.43]], { fill: CREAM, close: true, d: 0.4 + i * 0.1 });
    }
    g.shape([[fx + 0.55, fy + 0.43], [fx + 0.55, fy + 1.45], [fx + 0.9, fy + 1.45], [fx + 0.9, fy + 0.43]], { fill: CREAM, close: true, d: 0.5 });
    g.shape([[fx + 0.49, fy + 1.45], [fx + 0.96, fy + 1.45]], { w: 6, d: 0.6 });
    for (let s = 0; s < 4; s++) {
      const life = (A * (0.2 + 0.1 * lit) + s / 4) % 1;
      g.shape(circ(fx + 0.72 + life * 0.5 + Math.sin(A + s) * 0.04, fy + 1.58 + life * 0.8, 0.09 + life * 0.24, 22), { fill: CREAM, fillA: 0.7, close: true, w: 0, a: (1 - life) * 0.9, shadow: false, d: 0.9 });
    }
    for (let i = 0; i < 5; i++) {
      const wx = fx - 0.95 + i * 0.5;
      g.shape(rect(wx, fy + 0.14, 0.3, 0.28), { fill: lit > 0.5 ? '#f4e4dc' : '#1a0306', close: true, w: 3.2, d: 0.7 + i * 0.05, shadow: false });
    }
    g.shape([[fx + 0.1, fy - 0.43], [fx + 0.1, fy - 0.08], [fx + 0.55, fy - 0.08], [fx + 0.55, fy - 0.43]], { w: 3.4, color: DEEP, fill: '#1a0306', d: 0.9, shadow: false });
    /* Zahnräder rechts, greifen ineinander */
    const gear = (cx, cy, r, teeth, rot) => {
      const p = [];
      const n = teeth * 4;
      for (let i = 0; i <= n; i++) {
        const a = rot + (i / n) * TAU;
        const rr = i % 4 === 1 || i % 4 === 2 ? r * 1.17 : r;
        p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
      }
      return p;
    };
    const spin = A * (0.5 + 0.9 * lit);
    g.shape(gear(2.15, -0.42, 0.36, 10, spin), { fill: CREAM, close: true, d: 1.0 });
    g.shape(circ(2.15, -0.42, 0.12, 14), { fill: DEEP, close: true, w: 2.6, d: 1.1, shadow: false });
    g.shape(gear(1.95, 0.2, 0.26, 8, -spin * 1.25 + 0.2), { fill: PINK, close: true, d: 1.1 });
    g.shape(circ(1.95, 0.2, 0.09, 12), { fill: DEEP, close: true, w: 2.4, d: 1.2, shadow: false });
    /* Förderband */
    const dist = C < 4.8 ? 0.12 * C : 0.12 * 4.8 + 0.9 * (C - 4.8);
    g.shape([[-0.95, -1.24], [1.6, -1.24]], { w: 4.4, d: 1.0 });
    for (let k = 0; k < 6; k++) g.shape(circ(-0.85 + k * 0.5, -1.3, 0.06, 10), { fill: CREAM, close: true, w: 2.6, d: 1.0, shadow: false });
    for (let k = 0; k < 5; k++) {
      const u = (dist * 0.35 + k / 5) % 1;
      g.shape(rect(-0.9 + u * 2.4, -1.1, 0.24, 0.2), { fill: PINK, close: true, w: 3, d: 1.1, a: smooth(0, 0.08, u) * (1 - smooth(0.92, 1, u)) });
    }
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
    { x: [-2.55, 2.5], y: [-1.5, 2.4] },
    { x: [-2.2, 2.55], y: [-2.2, 1.55] },
    { x: [-2.6, 2.7], y: [-1.45, 1.9] },
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
    if (!desktop.matches || i === active) {
      if (!desktop.matches) active = -1;
      return;
    }
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
