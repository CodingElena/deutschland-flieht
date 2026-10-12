/**
 * Lichtausfall in der Hero-Skyline.
 *
 * Die Aufnahme ist ein Foto, keine Vektorstadt. Helle Pixel (Fenster)
 * werden gesucht, zu kleinen Gruppen gebuendelt und als Welle von den
 * Tuermen nach unten geloescht: oben zuerst, dann bricht der Rest nach.
 * Jedes Fenster flammt einmal warm auf und ist danach dunkel. Ein Rest
 * ganz unten bleibt an — die Stadt ist nicht zu Ende, sie leert sich.
 *
 * Bei prefers-reduced-motion oder einem Fehlschlag bleibt das <img>.
 */

const ZELLE = 6;
const HELLIGKEIT = 96;
const ANTEIL_AUS = 0.96;
/** Kurz aufflammen, dann aus. Die Wortmarke trifft in diese Welle. */
const FLACKER_MS = 48;
/** Die Tuerme halten kurz, dann kippt die Stadt. */
const DAUER_MS = 2000;

/** Dauer des Lichtausfalls. Die Zahl wartet darauf. */
export const LICHT_DAUER_MS = DAUER_MS;

interface Licht {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Byte-Offsets in ImageData.data (Schritt 4). */
  pixel: readonly number[];
  geflackert: boolean;
}

export function planeLichtausfall(opts: {
  canvas: HTMLCanvasElement;
  bild: HTMLImageElement;
  container: HTMLElement;
  signal: AbortSignal;
  /** 0 beginnt bei vollen Fenstern, 1 zeigt den schon leeren Zustand. */
  anfang?: number;
  /** Einmal, wenn der Endzustand gezeichnet ist. */
  onFertig?: () => void;
}): boolean {
  const { canvas, bild, container, signal, onFertig } = opts;
  const anfang = Math.min(1, Math.max(0, opts.anfang ?? 0));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return false;
  }

  let start: number | null = null;
  let lichter: Licht[] = [];
  let bilddaten: ImageData | null = null;
  let original: Uint8ClampedArray | null = null;
  let totZeiger = 0;
  let frame = 0;
  let fertigGemeldet = false;

  const meldeFertig = (): void => {
    if (fertigGemeldet || signal.aborted) {
      return;
    }
    fertigGemeldet = true;
    onFertig?.();
  };

  const messen = (): { breite: number; hoehe: number } => {
    const box = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    return {
      breite: Math.max(1, Math.round(box.width * dpr)),
      hoehe: Math.max(1, Math.round(box.height * dpr)),
    };
  };

  const wendeAn = (elapsed: number): void => {
    if (!bilddaten || !original) {
      return;
    }
    const grenze = Math.floor(lichter.length * ANTEIL_AUS);
    const fenster = DAUER_MS - FLACKER_MS;
    let dirty = false;

    while (totZeiger < grenze && elapsed >= beginn(totZeiger, grenze, fenster) + FLACKER_MS) {
      loescheLicht(bilddaten, original, lichter[totZeiger]);
      totZeiger += 1;
      dirty = true;
    }

    for (let i = totZeiger; i < grenze; i += 1) {
      if (elapsed < beginn(i, grenze, fenster)) {
        break;
      }
      const licht = lichter[i];
      if (licht.geflackert) {
        continue;
      }
      flackereLicht(bilddaten, original, licht);
      licht.geflackert = true;
      dirty = true;
    }

    if (dirty) {
      ctx.putImageData(bilddaten, 0, 0);
    }
  };

  const aufbauen = (fortschritt = 0): boolean => {
    const { breite, hoehe } = messen();
    canvas.width = breite;
    canvas.height = hoehe;
    zeichneAbdeckend(ctx, bild, breite, hoehe, 0.5, 0.48);

    try {
      bilddaten = ctx.getImageData(0, 0, breite, hoehe);
    } catch {
      return false;
    }

    original = new Uint8ClampedArray(bilddaten.data);
    lichter = findeLichter(bilddaten);
    alsWelle(lichter, hoehe);
    totZeiger = 0;
    wendeAn(Math.min(1, Math.max(0, fortschritt)) * DAUER_MS);
    return lichter.length > 0;
  };

  const tick = (jetzt: number): void => {
    if (signal.aborted || !bilddaten) {
      return;
    }
    if (start === null) {
      start = jetzt;
    }
    const elapsed = Math.min(DAUER_MS, jetzt - start);
    wendeAn(elapsed);

    if (elapsed < DAUER_MS) {
      frame = requestAnimationFrame(tick);
      return;
    }
    meldeFertig();
  };

  if (!aufbauen(anfang)) {
    return false;
  }

  const beobachter = new ResizeObserver(() => {
    if (signal.aborted || start === null) {
      return;
    }
    const t = Math.min(1, (performance.now() - start) / DAUER_MS);
    aufbauen(t);
  });
  beobachter.observe(container);

  if (anfang >= 1) {
    start = performance.now() - DAUER_MS;
    meldeFertig();
  } else {
    frame = requestAnimationFrame(tick);
  }
  signal.addEventListener(
    'abort',
    () => {
      cancelAnimationFrame(frame);
      beobachter.disconnect();
    },
    { once: true },
  );

  return true;
}

/** Wann Licht `index` aufflammt. Erst langsam, dann kippt die Front. */
function beginn(index: number, grenze: number, fenster: number): number {
  if (grenze <= 1) {
    return 0;
  }
  const anteil = index / (grenze - 1);
  return fenster * Math.pow(anteil, 0.54);
}

/** object-fit: cover plus object-position als Anteile 0–1. */
function zeichneAbdeckend(
  ctx: CanvasRenderingContext2D,
  bild: HTMLImageElement,
  cw: number,
  ch: number,
  px: number,
  py: number,
): void {
  const ir = bild.naturalWidth / bild.naturalHeight;
  const cr = cw / ch;
  let dw: number;
  let dh: number;
  if (ir > cr) {
    dh = ch;
    dw = ch * ir;
  } else {
    dw = cw;
    dh = cw / ir;
  }
  const dx = (cw - dw) * px;
  const dy = (ch - dh) * py;
  ctx.drawImage(bild, dx, dy, dw, dh);
}

function findeLichter(bilddaten: ImageData): Licht[] {
  const { width, height, data } = bilddaten;
  const spalten = Math.ceil(width / ZELLE);
  const zeilen = Math.ceil(height / ZELLE);
  const gruppen: number[][] = Array.from({ length: spalten * zeilen }, () => []);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (!istFenster(data[i], data[i + 1], data[i + 2])) {
        continue;
      }
      const gx = Math.floor(x / ZELLE);
      const gy = Math.floor(y / ZELLE);
      gruppen[gy * spalten + gx].push(i);
    }
  }

  const lichter: Licht[] = [];
  for (let g = 0; g < gruppen.length; g += 1) {
    const pixel = gruppen[g];
    if (pixel.length < 2) {
      continue;
    }
    const gx = g % spalten;
    const gy = Math.floor(g / spalten);
    lichter.push({
      x: gx * ZELLE,
      y: gy * ZELLE,
      w: Math.min(ZELLE + 1, width - gx * ZELLE),
      h: Math.min(ZELLE + 1, height - gy * ZELLE),
      pixel,
      geflackert: false,
    });
  }
  return lichter;
}

/** Von den Tuermen nach unten. Innerhalb einer Zeile bleibt die Ordnung zufaellig. */
function alsWelle(lichter: Licht[], hoehe: number): void {
  const band = Math.max(8, Math.round(hoehe * 0.045));
  const los = lichter.map(() => Math.random());
  const reihe = lichter.map((licht, index) => ({ licht, index }));
  reihe.sort((a, b) => {
    const bandA = Math.floor(a.licht.y / band);
    const bandB = Math.floor(b.licht.y / band);
    if (bandA !== bandB) {
      return bandA - bandB;
    }
    return los[a.index] - los[b.index];
  });
  for (let i = 0; i < reihe.length; i += 1) {
    lichter[i] = reihe[i].licht;
  }
}

function istFenster(r: number, g: number, b: number): boolean {
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (y < HELLIGKEIT || y > 248) {
    return false;
  }
  /* Warme Fensterlampen, kein kalter Himmel. */
  return r + g > b * 1.08;
}

function flackereLicht(bilddaten: ImageData, original: Uint8ClampedArray, licht: Licht): void {
  const data = bilddaten.data;
  for (const i of licht.pixel) {
    data[i] = Math.min(255, original[i] + 110);
    data[i + 1] = Math.min(255, Math.round(original[i + 1] * 0.7 + 28));
    data[i + 2] = Math.round(original[i + 2] * 0.28);
  }
}

function loescheLicht(bilddaten: ImageData, original: Uint8ClampedArray, licht: Licht): void {
  const data = bilddaten.data;
  for (const i of licht.pixel) {
    data[i] = Math.round(original[i] * 0.03 + 7);
    data[i + 1] = Math.round(original[i + 1] * 0.025 + 6);
    data[i + 2] = Math.round(original[i + 2] * 0.02 + 5);
  }
}
