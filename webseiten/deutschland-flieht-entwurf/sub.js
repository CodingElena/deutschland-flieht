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
 * Unterseiten: Menü, Einblenden, Kopfleiste
 * ========================================================================= */
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const $ = (s, r = document) => r.querySelector(s);

/* --- Menü (wie Startseite) ---------------------------------------------------- */
(function menu() {
  const button = document.getElementById('menu-toggle');
  const panel = document.getElementById('site-menu');
  if (!button || !panel) return;
  let timer;
  function setOpen(open) {
    clearTimeout(timer);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    panel.setAttribute('aria-hidden', String(!open));
    document.documentElement.classList.toggle('menu-open', open);
    if (open) {
      panel.hidden = false;
      requestAnimationFrame(() => panel.classList.add('is-open'));
      panel.querySelector('a')?.focus({ preventScroll: true });
    } else {
      panel.classList.remove('is-open');
      timer = setTimeout(() => (panel.hidden = true), 320);
    }
  }
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  panel.addEventListener('click', (e) => {
    if (e.target === panel || e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      button.focus({ preventScroll: true });
    }
  });
})();

/* --- Einblenden beim Scrollen (.rv -> .is-in) ------------------------------------- */
(function reveal() {
  const els = document.querySelectorAll('.rv');
  if (reduce.matches || !('IntersectionObserver' in window)) {
    els.forEach((e) => e.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  els.forEach((e) => io.observe(e));
})();

/* --- Kopfleiste: bekommt einen dunklen Grund, sobald man scrollt -------------------- */
(function header() {
  const bar = $('.site-header--sub');
  if (!bar) return;
  const update = () => bar.classList.toggle('is-solid', window.scrollY > 24);
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

/* Fußzeile einblenden (auf den Unterseiten läuft kapitel.js nicht) */
(function fusszeile() {
  const foot = document.querySelector('.foot');
  if (!foot) return;
  if (!('IntersectionObserver' in window)) return foot.classList.add('is-in');
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    foot.classList.add('is-in');
    io.disconnect();
  }, { rootMargin: '0px 0px 120px 0px' });
  io.observe(foot);
})();
