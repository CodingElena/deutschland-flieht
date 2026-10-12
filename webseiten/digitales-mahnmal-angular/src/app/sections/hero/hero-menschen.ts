/**
 * Das Buero hinter der Scheibe leert sich.
 *
 * Die Aufnahme ist von aussen: ein besetztes Glasbuero bei Nacht.
 * Haut und Kleidung gelten als Personen, Scheibe, Decke und Moebel
 * bleiben stehen. Jede Gruppe loest sich in den Raum dahinter auf,
 * hinten zuerst. Das Buero selbst bleibt sichtbar — nur ein leichter
 * Kaltschimmer legt sich darueber, damit die Leere spuerbar wird.
 * Feiner Regen liegt auf der Scheibe.
 *
 * Bei prefers-reduced-motion oder einem Fehlschlag bleibt das <img>,
 * ausser der Aufruf beginnt schon im Endzustand.
 */

const ZELLE = 6;
const BLOCK = 32;
/** Eine Gruppe loest sich ueber diese Spanne auf, nicht auf einen Schlag. */
const LOESUNG_MS = 1200;
/** Vom vollen Buero bis zur leeren, verregneten Nacht. */
const DAUER_MS = 5600;
/** Muss zu object-position in hero.scss passen. */
const BILD_X = 0.5;
const BILD_Y = 0.46;

/** Dauer, bis das Buero leer ist. Die Zahl wartet darauf. */
export const MENSCHEN_DAUER_MS = DAUER_MS;

export function planeMenschenleere(opts: {
  canvas: HTMLCanvasElement;
  bild: HTMLImageElement;
  container: HTMLElement;
  signal: AbortSignal;
  /** 0 beginnt beim vollen Buero, 1 zeigt die schon leere Nacht. */
  anfang?: number;
  /** Einmal, wenn der Endzustand der Leute gezeichnet ist. Der Regen laeuft weiter. */
  onFertig?: () => void;
}): boolean {
  const { canvas, bild, container, signal, onFertig } = opts;
  const anfang = Math.min(1, Math.max(0, opts.anfang ?? 0));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return false;
  }

  let start: number | null = null;
  let original: Uint8ClampedArray | null = null;
  let stein: Uint8ClampedArray | null = null;
  let maske: Uint16Array | null = null;
  let dichte: Uint8Array | null = null;
  let starts: Float32Array | null = null;
  let bilddaten: ImageData | null = null;
  let ende: ImageData | null = null;
  let breite = 0;
  let hoehe = 0;
  let frame = 0;
  let fertigGemeldet = false;

  const meldeFertig = (): void => {
    if (fertigGemeldet || signal.aborted) {
      return;
    }
    fertigGemeldet = true;
    onFertig?.();
  };

  const messen = (): { cw: number; ch: number } => {
    const box = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    return {
      cw: Math.max(1, Math.round(box.width * dpr)),
      ch: Math.max(1, Math.round(box.height * dpr)),
    };
  };

  const wendeAn = (elapsed: number): void => {
    if (!bilddaten || !original || !stein || !maske || !dichte || !starts) {
      return;
    }
    /* Maximal 50 %: das Buero bleibt, nur der Ton kippt leicht ins Kalte. */
    const menge = Math.pow(Math.min(1, Math.max(0, elapsed / DAUER_MS)), 1.2) * 0.5;
    const data = bilddaten.data;
    const n = breite * hoehe;

    for (let p = 0; p < n; p += 1) {
      const i = p * 4;
      const gewicht = dichte[p] / 255;
      let u = 0;
      if (gewicht > 0) {
        u = loesung((elapsed - starts[maske[p]]) / LOESUNG_MS) * gewicht;
      }
      let r = original[i] + (stein[i] - original[i]) * u;
      let g = original[i + 1] + (stein[i + 1] - original[i + 1]) * u;
      let b = original[i + 2] + (stein[i + 2] - original[i + 2]) * u;
      if (menge > 0) {
        const yn = Math.floor(p / breite) / hoehe;
        const xn = (p % breite) / breite;
        const leer = insOede(r, g, b, xn, yn);
        r += (leer[0] - r) * menge;
        g += (leer[1] - g) * menge;
        b += (leer[2] - b) * menge;
      }
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
    ctx.putImageData(bilddaten, 0, 0);
  };

  const aufbauen = (fortschritt = 0): boolean => {
    ende = null;
    const mass = messen();
    breite = mass.cw;
    hoehe = mass.ch;
    canvas.width = breite;
    canvas.height = hoehe;
    zeichneAbdeckend(ctx, bild, breite, hoehe, BILD_X, BILD_Y);

    try {
      bilddaten = ctx.getImageData(0, 0, breite, hoehe);
    } catch {
      return false;
    }

    original = new Uint8ClampedArray(bilddaten.data);
    const befund = findePersonen(bilddaten);
    if (befund.anteil < 0.012) {
      return false;
    }
    dichte = weich(befund.roh, breite, hoehe, 22);
    const verwischt = weichRgb(original, breite, hoehe, 26);
    stein = new Uint8ClampedArray(verwischt);
    for (let p = 0; p < dichte.length; p += 1) {
      if (dichte[p] === 0) {
        continue;
      }
      const i = p * 4;
      /* Nah am verwischten Hintergrund: leicht gedimmt und leicht
         entsaettigt, damit die Stelle nicht springt, sondern aussieht
         wie ein leerer Platz hinter der Scheibe. */
      stein[i] = verwischt[i] * 0.72 + 16;
      stein[i + 1] = verwischt[i + 1] * 0.74 + 18;
      stein[i + 2] = verwischt[i + 2] * 0.78 + 22;
    }

    const bloeckeX = Math.ceil(breite / BLOCK);
    const bloeckeY = Math.ceil(hoehe / BLOCK);
    maske = new Uint16Array(breite * hoehe);
    starts = new Float32Array(bloeckeX * bloeckeY + 1);
    const fenster = DAUER_MS - LOESUNG_MS;
    for (let by = 0; by < bloeckeY; by += 1) {
      for (let bx = 0; bx < bloeckeX; bx += 1) {
        const id = by * bloeckeX + bx + 1;
        const yn = (by * BLOCK + BLOCK / 2) / hoehe;
        const anteil = Math.min(1, Math.max(0, yn * 0.62 + rausch(bx, by) * 0.38));
        starts[id] = anteil * fenster;
      }
    }
    for (let p = 0; p < maske.length; p += 1) {
      const x = p % breite;
      const y = Math.floor(p / breite);
      const bx = Math.floor(x / BLOCK);
      const by = Math.floor(y / BLOCK);
      maske[p] = by * bloeckeX + bx + 1;
    }
    wendeAn(Math.min(1, Math.max(0, fortschritt)) * DAUER_MS);
    return true;
  };

  const tick = (jetzt: number): void => {
    if (signal.aborted || !bilddaten) {
      return;
    }
    if (start === null) {
      start = jetzt;
    }
    const elapsed = jetzt - start;
    if (elapsed < DAUER_MS) {
      wendeAn(elapsed);
    } else if (bilddaten) {
      if (!ende) {
        wendeAn(DAUER_MS);
        ende = new ImageData(new Uint8ClampedArray(bilddaten.data), breite, hoehe);
      } else {
        bilddaten.data.set(ende.data);
        ctx.putImageData(bilddaten, 0, 0);
      }
      meldeFertig();
    }
    zeichneRegen(ctx, breite, hoehe, Math.min(1, elapsed / DAUER_MS), elapsed);
    frame = requestAnimationFrame(tick);
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
    zeichneRegen(ctx, breite, hoehe, 1, 0);
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

function loesung(t: number): number {
  if (t <= 0) {
    return 0;
  }
  if (t >= 1) {
    return 1;
  }
  return t * t * (3 - 2 * t);
}

/** Leichte Kuehlung: das Buero bleibt, nur ein Hauch kaelter und stiller. */
function insOede(r: number, g: number, b: number, _xn: number, _yn: number): [number, number, number] {
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  /* Farbe grossteils behalten, nur leicht entsaettigen. */
  let rr = y + (r - y) * 0.78;
  let gg = y + (g - y) * 0.80;
  let bb = y + (b - y) * 0.86;
  /* Minimaler Kaltschimmer: Rot leicht zurueck, Blau leicht vor. */
  rr *= 0.96;
  bb *= 1.03;
  /* Deckenlichter einen Tick dimmen — die Waerme geht, nicht das Licht. */
  if (y > 196) {
    rr *= 0.93;
    gg *= 0.94;
    bb *= 0.95;
  }
  return [clamp(rr), clamp(gg), clamp(bb)];
}

/** Feiner Regen auf der Scheibe. Dezent, damit das ausgebleichte Buero lesbar bleibt. */
function zeichneRegen(
  ctx: CanvasRenderingContext2D,
  breite: number,
  hoehe: number,
  menge: number,
  zeit: number,
): void {
  const staerke = Math.max(0, (menge - 0.2) / 0.8);
  if (staerke <= 0) {
    return;
  }
  ctx.save();
  /* Kaum abdunkeln — nur ein Hauch, damit das Ausbleichen nicht verschluckt wird. */
  ctx.fillStyle = `rgba(120, 130, 140, ${0.03 * staerke})`;
  ctx.fillRect(0, 0, breite, hoehe);

  const anzahl = Math.round(50 + staerke * 110);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < anzahl; i += 1) {
    const spur = rausch(i, 3);
    const tempo = 0.55 + spur * 0.9;
    const x = (rausch(i, 1) * (breite + 80) + zeit * tempo * 0.22) % (breite + 80) - 40;
    const y = (rausch(i, 2) * (hoehe + 140) + zeit * tempo * 0.72) % (hoehe + 140) - 70;
    const laenge = 8 + spur * 18 * staerke;
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2.4, y + laenge);
  }
  ctx.strokeStyle = `rgba(200, 210, 218, ${0.1 + staerke * 0.16})`;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.beginPath();
  const tropfen = Math.round(10 + staerke * 16);
  for (let i = 0; i < tropfen; i += 1) {
    const spur = rausch(i, 9);
    const x = (rausch(i, 7) * breite + zeit * 0.08) % breite;
    const y = (rausch(i, 8) * hoehe + zeit * (0.28 + spur * 0.2)) % hoehe;
    ctx.moveTo(x, y);
    ctx.lineTo(x - 0.8, y + 5 + spur * 4);
  }
  ctx.strokeStyle = `rgba(216, 222, 228, ${0.14 + staerke * 0.2})`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

interface Befund {
  roh: Uint8Array;
  anteil: number;
  /** Ersatzfarbe je Pixel, nur dort gesetzt, wo eine Person stand. */
  fuellung: Uint8ClampedArray;
}

function findePersonen(bilddaten: ImageData): Befund {
  const { width, height, data } = bilddaten;
  const spalten = Math.ceil(width / ZELLE);
  const zeilen = Math.ceil(height / ZELLE);
  const summeR = new Float64Array(spalten * zeilen);
  const summeG = new Float64Array(spalten * zeilen);
  const summeB = new Float64Array(spalten * zeilen);
  const summeY = new Float64Array(spalten * zeilen);
  const summeY2 = new Float64Array(spalten * zeilen);
  const anzahl = new Uint16Array(spalten * zeilen);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const gx = Math.floor(x / ZELLE);
      const gy = Math.floor(y / ZELLE);
      const z = gy * spalten + gx;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      summeR[z] += r;
      summeG[z] += g;
      summeB[z] += b;
      summeY[z] += lum;
      summeY2[z] += lum * lum;
      anzahl[z] += 1;
    }
  }

  const roh = new Uint8Array(width * height);
  const zelle = new Uint8Array(anzahl.length);
  let personen = 0;

  for (let z = 0; z < anzahl.length; z += 1) {
    const n = anzahl[z];
    if (n < 4) {
      continue;
    }
    const r = summeR[z] / n;
    const g = summeG[z] / n;
    const b = summeB[z] / n;
    const lum = summeY[z] / n;
    const varianz = summeY2[z] / n - lum * lum;
    if (!istPerson(r, g, b, lum, varianz)) {
      continue;
    }
    const gx = z % spalten;
    const gy = Math.floor(z / spalten);
    const x0 = gx * ZELLE;
    const y0 = gy * ZELLE;
    const x1 = Math.min(width, x0 + ZELLE);
    const y1 = Math.min(height, y0 + ZELLE);
    zelle[z] = 1;
  }

  /* Etwas aufweiten, damit Hemd und Jacke nicht als Schleier stehen bleiben. */
  const weit = new Uint8Array(zelle.length);
  for (let z = 0; z < zelle.length; z += 1) {
    if (zelle[z] === 0) {
      continue;
    }
    const gx = z % spalten;
    const gy = Math.floor(z / spalten);
    for (let oy = -2; oy <= 2; oy += 1) {
      for (let ox = -2; ox <= 2; ox += 1) {
        const nx = gx + ox;
        const ny = gy + oy;
        if (nx < 0 || ny < 0 || nx >= spalten || ny >= zeilen) {
          continue;
        }
        weit[ny * spalten + nx] = 1;
      }
    }
  }

  for (let z = 0; z < weit.length; z += 1) {
    if (weit[z] === 0) {
      continue;
    }
    const gx = z % spalten;
    const gy = Math.floor(z / spalten);
    const x0 = gx * ZELLE;
    const y0 = gy * ZELLE;
    const x1 = Math.min(width, x0 + ZELLE);
    const y1 = Math.min(height, y0 + ZELLE);
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        roh[y * width + x] = 255;
        personen += 1;
      }
    }
  }

  const fuellung = new Uint8ClampedArray(width * height * 4);
  for (let z = 0; z < weit.length; z += 1) {
    if (weit[z] === 0) {
      continue;
    }
    const gx = z % spalten;
    const gy = Math.floor(z / spalten);
    let sr = 0;
    let sg = 0;
    let sb = 0;
    let sn = 0;
    for (let ring = 3; ring <= 7 && sn < 6; ring += 1) {
      for (let oy = -ring; oy <= ring; oy += 1) {
        for (let ox = -ring; ox <= ring; ox += 1) {
          if (Math.max(Math.abs(ox), Math.abs(oy)) !== ring) {
            continue;
          }
          const nx = gx + ox;
          const ny = gy + oy;
          if (nx < 0 || ny < 0 || nx >= spalten || ny >= zeilen) {
            continue;
          }
          const nz = ny * spalten + nx;
          if (weit[nz] !== 0 || anzahl[nz] < 4) {
            continue;
          }
          const nn = anzahl[nz];
          sr += summeR[nz] / nn;
          sg += summeG[nz] / nn;
          sb += summeB[nz] / nn;
          sn += 1;
        }
      }
    }
    if (sn === 0) {
      sr = 28;
      sg = 32;
      sb = 38;
    } else {
      sr /= sn;
      sg /= sn;
      sb /= sn;
    }
    const x0 = gx * ZELLE;
    const y0 = gy * ZELLE;
    const x1 = Math.min(width, x0 + ZELLE);
    const y1 = Math.min(height, y0 + ZELLE);
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const i = (y * width + x) * 4;
        fuellung[i] = clamp(sr);
        fuellung[i + 1] = clamp(sg);
        fuellung[i + 2] = clamp(sb);
        fuellung[i + 3] = 255;
      }
    }
  }

  return { roh, anteil: personen / (width * height), fuellung };
}

function istPerson(r: number, g: number, b: number, lum: number, varianz: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  if (lum < 42 || lum > 215) {
    return false;
  }
  /* Pflanzen an der Fensterbank bleiben. */
  if (g > r + 10 && g > b + 8 && g > 60) {
    return false;
  }
  /* Deckenraster und helle Wand. */
  if (lum > 188 && sat < 0.1 && varianz < 700) {
    return false;
  }
  /* Flacher Boden, Tisch, Scheibe. */
  if (varianz < 90 && sat < 0.09) {
    return false;
  }
  const haut = r > 80 && r >= g - 6 && r - b > 12 && sat > 0.08 && lum < 200;
  if (haut) {
    return true;
  }
  /* Hemd: hell, aber nicht das flache Deckenlicht. */
  if (lum > 130 && lum < 210 && varianz > 160 && sat < 0.22) {
    return true;
  }
  if (lum < 175 && sat > 0.09 && varianz > 120) {
    return true;
  }
  /* Dunkle Jacke. Die Sprosse ist dunkler und flacher und faellt oben raus. */
  return lum >= 34 && lum < 120 && varianz > 180;
}

function rausch(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Kastenweichzeichner, damit aus den Zellen keine Quadrate werden. */
function weich(quell: Uint8Array, breite: number, hoehe: number, radius: number): Uint8Array {
  const tmp = new Float32Array(breite * hoehe);
  const ziel = new Uint8Array(breite * hoehe);
  const span = radius * 2 + 1;
  for (let y = 0; y < hoehe; y += 1) {
    let summe = 0;
    for (let x = -radius; x <= radius; x += 1) {
      summe += quell[y * breite + Math.min(breite - 1, Math.max(0, x))];
    }
    for (let x = 0; x < breite; x += 1) {
      tmp[y * breite + x] = summe / span;
      const ab = Math.min(breite - 1, x + radius + 1);
      const auf = Math.max(0, x - radius);
      summe += quell[y * breite + ab] - quell[y * breite + auf];
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

function weichRgb(
  quell: Uint8ClampedArray,
  breite: number,
  hoehe: number,
  radius: number,
): Uint8ClampedArray {
  const tmp = new Float32Array(breite * hoehe * 3);
  const ziel = new Uint8ClampedArray(quell.length);
  const span = radius * 2 + 1;

  for (let y = 0; y < hoehe; y += 1) {
    let sr = 0;
    let sg = 0;
    let sb = 0;
    const zeile = y * breite;
    for (let x = -radius; x <= radius; x += 1) {
      const i = (zeile + Math.min(breite - 1, Math.max(0, x))) * 4;
      sr += quell[i];
      sg += quell[i + 1];
      sb += quell[i + 2];
    }
    for (let x = 0; x < breite; x += 1) {
      const o = (zeile + x) * 3;
      tmp[o] = sr / span;
      tmp[o + 1] = sg / span;
      tmp[o + 2] = sb / span;
      const ab = (zeile + Math.min(breite - 1, x + radius + 1)) * 4;
      const auf = (zeile + Math.max(0, x - radius)) * 4;
      sr += quell[ab] - quell[auf];
      sg += quell[ab + 1] - quell[auf + 1];
      sb += quell[ab + 2] - quell[auf + 2];
    }
  }

  for (let x = 0; x < breite; x += 1) {
    let sr = 0;
    let sg = 0;
    let sb = 0;
    for (let y = -radius; y <= radius; y += 1) {
      const o = (Math.min(hoehe - 1, Math.max(0, y)) * breite + x) * 3;
      sr += tmp[o];
      sg += tmp[o + 1];
      sb += tmp[o + 2];
    }
    for (let y = 0; y < hoehe; y += 1) {
      const i = (y * breite + x) * 4;
      ziel[i] = sr / span;
      ziel[i + 1] = sg / span;
      ziel[i + 2] = sb / span;
      ziel[i + 3] = 255;
      const ab = (Math.min(hoehe - 1, y + radius + 1) * breite + x) * 3;
      const auf = (Math.max(0, y - radius) * breite + x) * 3;
      sr += tmp[ab] - tmp[auf];
      sg += tmp[ab + 1] - tmp[auf + 1];
      sb += tmp[ab + 2] - tmp[auf + 2];
    }
  }
  return ziel;
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
