/**
 * Lichtausfall in der Hero-Skyline.
 *
 * Die Aufnahme ist ein Foto, keine Vektorstadt. Deshalb werden helle
 * Pixel (Fenster) gesucht, zu kleinen Gruppen gebuendelt und nacheinander
 * abgedunkelt. Ein Rest bleibt an: die Stadt stirbt nicht in einem Ruck,
 * sie leert sich.
 *
 * Bei prefers-reduced-motion oder einem Fehlschlag bleibt das <img>.
 */

const ZELLE = 6;
const HELLIGKEIT = 96;
const ANTEIL_AUS = 0.88;
const DAUER_MS = 7000;

interface Licht {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Byte-Offsets in ImageData.data (Schritt 4). */
  pixel: readonly number[];
}

export function planeLichtausfall(opts: {
  canvas: HTMLCanvasElement;
  bild: HTMLImageElement;
  container: HTMLElement;
  signal: AbortSignal;
}): boolean {
  const { canvas, bild, container, signal } = opts;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return false;
  }

  let start: number | null = null;
  let lichter: Licht[] = [];
  let bilddaten: ImageData | null = null;
  let erloschen = 0;
  let frame = 0;

  const messen = (): { breite: number; hoehe: number } => {
    const box = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    return {
      breite: Math.max(1, Math.round(box.width * dpr)),
      hoehe: Math.max(1, Math.round(box.height * dpr)),
    };
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

    lichter = findeLichter(bilddaten);
    mischen(lichter);
    const sollAus = Math.floor(lichter.length * ANTEIL_AUS);
    erloschen = Math.min(sollAus, Math.floor(easing(fortschritt) * sollAus));
    for (let i = 0; i < erloschen; i += 1) {
      loescheLicht(bilddaten, lichter[i]);
    }
    ctx.putImageData(bilddaten, 0, 0);
    return lichter.length > 0;
  };

  const tick = (jetzt: number): void => {
    if (signal.aborted || !bilddaten) {
      return;
    }
    if (start === null) {
      start = jetzt;
    }
    const t = Math.min(1, (jetzt - start) / DAUER_MS);
    const sollAus = Math.floor(lichter.length * ANTEIL_AUS);
    const soll = Math.min(sollAus, Math.floor(easing(t) * sollAus));

    while (erloschen < soll) {
      const licht = lichter[erloschen];
      loescheLicht(bilddaten, licht);
      ctx.putImageData(bilddaten, 0, 0, licht.x, licht.y, licht.w, licht.h);
      erloschen += 1;
    }

    if (t < 1) {
      frame = requestAnimationFrame(tick);
    }
  };

  if (!aufbauen(0)) {
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

  frame = requestAnimationFrame(tick);
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
    });
  }
  return lichter;
}

function istFenster(r: number, g: number, b: number): boolean {
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (y < HELLIGKEIT || y > 248) {
    return false;
  }
  /* Warme Fensterlampen, kein kalter Himmel. */
  return r + g > b * 1.08;
}

function loescheLicht(bilddaten: ImageData, licht: Licht): void {
  const data = bilddaten.data;
  for (const i of licht.pixel) {
    data[i] = Math.round(data[i] * 0.05 + 10);
    data[i + 1] = Math.round(data[i + 1] * 0.04 + 9);
    data[i + 2] = Math.round(data[i + 2] * 0.04 + 8);
  }
}

function easing(t: number): number {
  return 0.5 - 0.5 * Math.cos(t * Math.PI);
}

function mischen<T>(liste: T[]): void {
  for (let i = liste.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = liste[i];
    liste[i] = liste[j];
    liste[j] = tmp;
  }
}
