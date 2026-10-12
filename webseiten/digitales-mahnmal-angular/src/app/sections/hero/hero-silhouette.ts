/**
 * Macht aus einem Porträt eine leere Silhouette.
 *
 * Der Hintergrund wächst vom oberen Rand ins Bild, solange die Farbe
 * sich nur langsam ändert. Was übrig bleibt, ist die Person — ohne
 * Gesicht, ohne Stoff, nur die Form. Schlägt das fehl, steht eine
 * schlichte Büste in der Kachel.
 *
 * Muss zu object-position in hero.scss passen.
 */

const BILD_X = 0.5;
const BILD_Y = 0.18;
/** Steinhell, damit die leere Form auf Schwarz lesbar bleibt. */
const TON: [number, number, number] = [196, 190, 184];

export function zeichneSilhouette(
  canvas: HTMLCanvasElement,
  bild: HTMLImageElement,
  container: HTMLElement,
): boolean {
  const box = container.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const cw = Math.max(1, Math.round(box.width * dpr));
  const ch = Math.max(1, Math.round(box.height * dpr));
  if (!bild.naturalWidth) {
    return false;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return false;
  }
  canvas.width = cw;
  canvas.height = ch;

  const scale = Math.min(1, 520 / Math.max(cw, ch));
  const aw = Math.max(1, Math.round(cw * scale));
  const ah = Math.max(1, Math.round(ch * scale));
  const klein = document.createElement('canvas');
  klein.width = aw;
  klein.height = ah;
  const ktx = klein.getContext('2d', { willReadFrequently: true });
  if (!ktx) {
    return false;
  }

  zeichneAbdeckend(ktx, bild, aw, ah, BILD_X, BILD_Y);
  let daten: ImageData;
  try {
    daten = ktx.getImageData(0, 0, aw, ah);
  } catch {
    return false;
  }

  const person = personenForm(daten);
  if (!person) {
    ctx.clearRect(0, 0, cw, ch);
    zeichneBueste(ctx, cw, ch);
    return true;
  }

  const weich = weichzeichner(person, aw, ah, Math.max(2, Math.round(Math.min(aw, ah) * 0.012)));
  const ziel = ktx.createImageData(aw, ah);
  const px = ziel.data;
  for (let i = 0; i < weich.length; i += 1) {
    const alpha = weich[i];
    if (alpha < 12) {
      continue;
    }
    const o = i * 4;
    px[o] = TON[0];
    px[o + 1] = TON[1];
    px[o + 2] = TON[2];
    px[o + 3] = alpha;
  }
  ktx.putImageData(ziel, 0, 0);

  ctx.clearRect(0, 0, cw, ch);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(klein, 0, 0, cw, ch);
  return true;
}

/**
 * Der Grund ist die Farbe in den oberen Ecken. Nur Pixel, die ihr
 * nahe sind und vom Rand her zusammenhängen, gelten als Hintergrund.
 * Was übrig bleibt, ist die Person — auch wenn sie fast die ganze
 * Kachel füllt und nur um den Kopf herum Luft bleibt.
 */
function personenForm(bild: ImageData): Uint8Array | null {
  const { width, height, data } = bild;
  const n = width * height;
  const band = Math.max(2, Math.floor(height * 0.05));
  const rand = Math.max(3, Math.floor(width * 0.14));
  const proben = [
    mittel(data, width, 0, rand, 0, band),
    mittel(data, width, width - rand, width, 0, band),
  ];
  /** Eng genug, dass Haut nicht mit einer ähnlich warmen Wand mitgeht. */
  const grenze = 30 * 30;
  const kandidat = new Uint8Array(n);

  for (let p = 0; p < n; p += 1) {
    const i = p * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    for (let k = 0; k < proben.length; k += 1) {
      const probe = proben[k];
      const dr = r - probe[0];
      const dg = g - probe[1];
      const db = b - probe[2];
      if (dr * dr + dg * dg + db * db <= grenze) {
        kandidat[p] = 1;
        break;
      }
    }
  }

  const gesehen = new Uint8Array(n);
  const schlange = new Int32Array(n);
  let kopf = 0;
  let schwanz = 0;

  const hinein = (x: number, y: number): void => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }
    const p = y * width + x;
    if (gesehen[p] || kandidat[p] === 0) {
      return;
    }
    gesehen[p] = 1;
    schlange[schwanz] = p;
    schwanz += 1;
  };

  for (let x = 0; x < width; x += 1) {
    hinein(x, 0);
    hinein(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    hinein(0, y);
    hinein(width - 1, y);
  }

  while (kopf < schwanz) {
    const p = schlange[kopf];
    kopf += 1;
    const x = p % width;
    const y = (p - x) / width;
    hinein(x + 1, y);
    hinein(x - 1, y);
    hinein(x, y + 1);
    hinein(x, y - 1);
  }

  const person = new Uint8Array(n);
  let anteil = 0;
  for (let p = 0; p < n; p += 1) {
    if (gesehen[p] === 0) {
      person[p] = 255;
      anteil += 1;
    }
  }
  anteil /= n;

  let mitte = 0;
  let mitteN = 0;
  const x0 = Math.floor(width * 0.28);
  const x1 = Math.ceil(width * 0.72);
  const y0 = Math.floor(height * 0.12);
  const y1 = Math.ceil(height * 0.48);
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      mitteN += 1;
      if (person[y * width + x]) {
        mitte += 1;
      }
    }
  }

  if (anteil < 0.18 || anteil > 0.97 || mitte / mitteN < 0.5) {
    return null;
  }

  schliesseLoecher(person, width, height);
  return person;
}

function mittel(
  data: Uint8ClampedArray,
  breite: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;
  let zahl = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * breite + x) * 4;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      zahl += 1;
    }
  }
  if (zahl === 0) {
    return [0, 0, 0];
  }
  return [r / zahl, g / zahl, b / zahl];
}

/** Kleine Löcher im Körper schließen, einzelne Pixel am Rand streichen. */
function schliesseLoecher(person: Uint8Array, breite: number, hoehe: number): void {
  const kopie = new Uint8Array(person);
  for (let y = 1; y < hoehe - 1; y += 1) {
    for (let x = 1; x < breite - 1; x += 1) {
      const p = y * breite + x;
      let nachbarn = 0;
      nachbarn += kopie[p - 1] ? 1 : 0;
      nachbarn += kopie[p + 1] ? 1 : 0;
      nachbarn += kopie[p - breite] ? 1 : 0;
      nachbarn += kopie[p + breite] ? 1 : 0;
      if (kopie[p] === 0 && nachbarn >= 3) {
        person[p] = 255;
      } else if (kopie[p] !== 0 && nachbarn <= 1) {
        person[p] = 0;
      }
    }
  }
}

function weichzeichner(
  quelle: Uint8Array,
  breite: number,
  hoehe: number,
  radius: number,
): Uint8Array {
  const tmp = new Float32Array(breite * hoehe);
  const ziel = new Uint8Array(breite * hoehe);
  const span = radius * 2 + 1;

  for (let y = 0; y < hoehe; y += 1) {
    let summe = 0;
    for (let x = -radius; x <= radius; x += 1) {
      summe += quelle[y * breite + Math.min(breite - 1, Math.max(0, x))];
    }
    for (let x = 0; x < breite; x += 1) {
      tmp[y * breite + x] = summe / span;
      const ab = Math.min(breite - 1, x + radius + 1);
      const auf = Math.max(0, x - radius);
      summe += quelle[y * breite + ab] - quelle[y * breite + auf];
    }
  }

  for (let x = 0; x < breite; x += 1) {
    let summe = 0;
    for (let y = -radius; y <= radius; y += 1) {
      summe += tmp[Math.min(hoehe - 1, Math.max(0, y)) * breite + x];
    }
    for (let y = 0; y < hoehe; y += 1) {
      ziel[y * breite + x] = Math.round(summe / span);
      const ab = Math.min(hoehe - 1, y + radius + 1);
      const auf = Math.max(0, y - radius);
      summe += tmp[ab * breite + x] - tmp[auf * breite + x];
    }
  }
  return ziel;
}

/** Kopf und Schultern, wenn aus der Aufnahme keine Form wird. */
function zeichneBueste(ctx: CanvasRenderingContext2D, cw: number, ch: number): void {
  ctx.fillStyle = `rgb(${TON[0]}, ${TON[1]}, ${TON[2]})`;
  const cx = cw * 0.5;
  const kopfR = Math.min(cw, ch) * 0.22;
  const kopfY = ch * 0.32;
  ctx.beginPath();
  ctx.ellipse(cx, kopfY, kopfR * 0.84, kopfR * 1.02, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - kopfR * 0.34, kopfY + kopfR * 0.78, kopfR * 0.68, kopfR * 0.72);
  ctx.beginPath();
  ctx.moveTo(0, ch);
  ctx.quadraticCurveTo(cw * 0.08, ch * 0.58, cx, ch * 0.5);
  ctx.quadraticCurveTo(cw * 0.92, ch * 0.58, cw, ch);
  ctx.closePath();
  ctx.fill();
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
  ctx.drawImage(bild, (cw - dw) * px, (ch - dh) * py, dw, dh);
}
