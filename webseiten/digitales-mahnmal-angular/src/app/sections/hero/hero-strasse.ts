/**
 * Die Straße zwischen den Hochhäusern leert sich.
 *
 * Zuerst die belebte Schlucht. Gesichter bleichen staffelweise aus,
 * hinten zuerst, dann loest sich die Gestalt in die Straße dahinter
 * auf. Am Ende stehen Häuser, Fahrbahn, Wagen und Kübel — ohne Menschen.
 *
 * Bei prefers-reduced-motion oder einem Fehlschlag bleibt das <img>,
 * ausser der Aufruf beginnt schon im Endzustand.
 */

const ZELLE = 4;
const BLOCK = 28;
/** Das Gesicht wird bleich, bevor die Gestalt verschwindet. */
const BLEICH_MS = 1100;
/** Abstand, damit das Bleichen lesbar ist, bevor der Körper geht. */
const VERZUG_MS = 680;
/** Eine Gestalt loest sich über diese Spanne auf. */
const LOESUNG_MS = 1500;
/** Vom vollen Trottoir bis zur leeren Straße. */
const DAUER_MS = 7800;
/** Muss zu object-position in hero.scss passen: die Schlucht, nicht die Kübel. */
const BILD_X = 0.5;
const BILD_Y = 0.72;

/** Dauer, bis die Straße leer ist. Die Zahl wartet darauf. */
export const STRASSEN_DAUER_MS = DAUER_MS;

export function planeStrassenleere(opts: {
  canvas: HTMLCanvasElement;
  bild: HTMLImageElement;
  container: HTMLElement;
  signal: AbortSignal;
  /** 0 beginnt bei der vollen Straße, 1 zeigt die schon leere Straße. */
  anfang?: number;
  /** Einmal, wenn der leere Endzustand gezeichnet ist. */
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
  let platte: Uint8ClampedArray | null = null;
  let person: Uint8Array | null = null;
  let gesicht: Uint8Array | null = null;
  let starts: Float32Array | null = null;
  let liste: Uint32Array | null = null;
  let bilddaten: ImageData | null = null;
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
    const deckel = 1400;
    const verhaeltnis = Math.min(1, deckel / Math.max(1, box.width));
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25) * verhaeltnis;
    return {
      cw: Math.max(1, Math.round(box.width * dpr)),
      ch: Math.max(1, Math.round(box.height * dpr)),
    };
  };

  const wendeAn = (elapsed: number): void => {
    if (!bilddaten || !original || !platte || !person || !gesicht || !starts || !liste) {
      return;
    }
    const data = bilddaten.data;
    const fenster = liste.length;
    for (let n = 0; n < fenster; n += 1) {
      const p = liste[n];
      const i = p * 4;
      const t = elapsed - starts[p];
      const bleicht = loesung(t / BLEICH_MS) * (gesicht[p] / 255);
      const loest = loesung((t - VERZUG_MS) / LOESUNG_MS) * (person[p] / 255);
      let r = original[i];
      let g = original[i + 1];
      let b = original[i + 2];
      if (bleicht > 0) {
        const pale = insBleiche(r, g, b);
        r += (pale[0] - r) * bleicht;
        g += (pale[1] - g) * bleicht;
        b += (pale[2] - b) * bleicht;
      }
      if (loest > 0) {
        r += (platte[i] - r) * loest;
        g += (platte[i + 1] - g) * loest;
        b += (platte[i + 2] - b) * loest;
      }
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
    ctx.putImageData(bilddaten, 0, 0);
  };

  const aufbauen = (fortschritt = 0): boolean => {
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
    const masken = findeFremde(bilddaten);
    if (masken.anteil < 0.004 || masken.anteil > 0.5) {
      return false;
    }
    person = weich(masken.koerper, breite, hoehe, 4);
    gesicht = weich(masken.gesichter, breite, hoehe, 3);
    platte = leerePlatte(original, person, breite, hoehe);

    const bloeckeX = Math.ceil(breite / BLOCK);
    const bloeckeY = Math.ceil(hoehe / BLOCK);
    const blockStart = new Float32Array(bloeckeX * bloeckeY);
    const spanne = DAUER_MS - VERZUG_MS - LOESUNG_MS;
    for (let by = 0; by < bloeckeY; by += 1) {
      for (let bx = 0; bx < bloeckeX; bx += 1) {
        const yn = (by * BLOCK + BLOCK / 2) / hoehe;
        /* Hinten (kleiner yn) zuerst, vorne zuletzt. Etwas Streuung,
           damit keine Zeile auf einen Schlag umkippt. */
        const tiefe = Math.min(1, Math.max(0, (yn - 0.18) / 0.78));
        const streu = (rausch(bx, by) - 0.5) * 0.16;
        blockStart[by * bloeckeX + bx] = Math.min(1, Math.max(0, tiefe + streu)) * spanne;
      }
    }

    starts = new Float32Array(breite * hoehe);
    const index: number[] = [];
    for (let p = 0; p < person.length; p += 1) {
      if (person[p] < 12 && gesicht[p] < 12) {
        continue;
      }
      const x = p % breite;
      const y = Math.floor(p / breite);
      starts[p] = blockStart[Math.floor(y / BLOCK) * bloeckeX + Math.floor(x / BLOCK)];
      index.push(p);
    }
    liste = Uint32Array.from(index);
    wendeAn(Math.min(1, Math.max(0, fortschritt)) * DAUER_MS);
    return liste.length > 0;
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
      frame = requestAnimationFrame(tick);
      return;
    }
    wendeAn(DAUER_MS);
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

function loesung(t: number): number {
  if (t <= 0) {
    return 0;
  }
  if (t >= 1) {
    return 1;
  }
  return t * t * (3 - 2 * t);
}

/** Gesicht zur Knochenfarbe, ein Rest der eigenen Farbe bleibt im Ton. */
function insBleiche(r: number, g: number, b: number): [number, number, number] {
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const zielR = 236;
  const zielG = 230;
  const zielB = 220;
  const t = 0.9;
  return [
    klemme(y * (1 - t) + zielR * t),
    klemme(y * (1 - t) + zielG * t),
    klemme(y * (1 - t) + zielB * t),
  ];
}

function klemme(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

interface Masken {
  koerper: Uint8Array;
  gesichter: Uint8Array;
  anteil: number;
}

/**
 * Nur Menschen. Häuser, Fahrbahn, Wagen, Pflanzen und der Himmel
 * bleiben stehen — eine zu weite Maske frisst die Schlucht mit auf.
 */
function findeFremde(bilddaten: ImageData): Masken {
  const { width, height, data } = bilddaten;
  const spalten = Math.ceil(width / ZELLE);
  const zeilen = Math.ceil(height / ZELLE);
  const zellen = spalten * zeilen;
  const summeR = new Float64Array(zellen);
  const summeG = new Float64Array(zellen);
  const summeB = new Float64Array(zellen);
  const summeY = new Float64Array(zellen);
  const summeY2 = new Float64Array(zellen);
  const anzahl = new Uint16Array(zellen);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const z = Math.floor(y / ZELLE) * spalten + Math.floor(x / ZELLE);
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

  const pflanze = new Uint8Array(zellen);
  const belag = new Uint8Array(zellen);
  const haut = new Uint8Array(zellen);

  for (let z = 0; z < zellen; z += 1) {
    const n = anzahl[z];
    if (n < 4) {
      continue;
    }
    const r = summeR[z] / n;
    const g = summeG[z] / n;
    const b = summeB[z] / n;
    const lum = summeY[z] / n;
    const varianz = summeY2[z] / n - lum * lum;
    const gx = z % spalten;
    const gy = Math.floor(z / spalten);
    const xn = (gx + 0.5) / spalten;
    const yn = (gy + 0.5) / zeilen;
    const aufDemGehweg = xn < 0.36 || xn > 0.64;
    if (istPflanze(r, g, b) || istBluete(r, g, b, lum)) {
      pflanze[z] = 1;
      continue;
    }
    /* Stein vor Haut, sonst werden Fassaden und Kübel zu Gesichtern. */
    if (istBelag(lum, varianz, r, g, b)) {
      belag[z] = 1;
      continue;
    }
    /* Nur auf den Gehwegen unter der Brücke. Die Fahrbahn
       bleibt, sonst werden Wagen zu Gestalten. */
    if (istHaut(r, g, b, lum) && yn > 0.55 && aufDemGehweg) {
      haut[z] = 1;
    }
  }

  /* Eine Fassade aus warmem Stein ist kein Gesicht. Echte Gesichter
     bleiben kleine Flecken. */
  const hautId = new Int32Array(zellen);
  const hautFlaeche: number[] = [0];
  let hautLauf = 1;
  const hautStapel: number[] = [];
  for (let z = 0; z < zellen; z += 1) {
    if (haut[z] === 0 || hautId[z] !== 0) {
      continue;
    }
    hautId[z] = hautLauf;
    hautStapel.push(z);
    let zahl = 0;
    while (hautStapel.length > 0) {
      const cur = hautStapel.pop() as number;
      zahl += 1;
      const gx = cur % spalten;
      const nachbarn = [cur - 1, cur + 1, cur - spalten, cur + spalten];
      for (const nz of nachbarn) {
        if (nz < 0 || nz >= zellen || haut[nz] === 0 || hautId[nz] !== 0) {
          continue;
        }
        if (Math.abs((nz % spalten) - gx) > 1) {
          continue;
        }
        hautId[nz] = hautLauf;
        hautStapel.push(nz);
      }
    }
    hautFlaeche[hautLauf] = zahl;
    hautLauf += 1;
  }
  for (let z = 0; z < zellen; z += 1) {
    const id = hautId[z];
    if (id !== 0 && hautFlaeche[id] > 90) {
      haut[z] = 0;
    }
  }

  const koerperZelle = new Uint8Array(zellen);
  for (let z = 0; z < zellen; z += 1) {
    if (haut[z] === 0) {
      continue;
    }
    const gx = z % spalten;
    const gy = Math.floor(z / spalten);
    const yn = (gy + 0.5) / zeilen;
    /* Unten sind die Leute größer. Gehweg und Beete bleiben stehen,
       damit die Lücken nicht zu einem Fleck zusammenwachsen. */
    const tief = Math.round(4 + yn * 22);
    const breitMax = yn > 0.62 ? 3 : 2;
    for (let oy = -2; oy <= tief; oy += 1) {
      const breit = oy <= 1 ? 1 : breitMax;
      for (let ox = -breit; ox <= breit; ox += 1) {
        const nx = gx + ox;
        const ny = gy + oy;
        if (nx < 0 || ny < 0 || nx >= spalten || ny >= zeilen) {
          continue;
        }
        if ((ny + 0.5) / zeilen < 0.52) {
          continue;
        }
        const nxn = (nx + 0.5) / spalten;
        if (nxn > 0.36 && nxn < 0.64) {
          continue;
        }
        const nz = ny * spalten + nx;
        if (pflanze[nz] === 1 || belag[nz] === 1) {
          continue;
        }
        koerperZelle[nz] = 1;
      }
    }
  }

  /* Ein Laden oder eine Fassade ist größer als ein Mensch. */
  const koerperId = new Int32Array(zellen);
  const koerperFlaeche: number[] = [0];
  let koerperLauf = 1;
  const koerperStapel: number[] = [];
  for (let z = 0; z < zellen; z += 1) {
    if (koerperZelle[z] === 0 || koerperId[z] !== 0) {
      continue;
    }
    koerperId[z] = koerperLauf;
    koerperStapel.push(z);
    let zahl = 0;
    while (koerperStapel.length > 0) {
      const cur = koerperStapel.pop() as number;
      zahl += 1;
      const cx = cur % spalten;
      const nachbarn = [cur - 1, cur + 1, cur - spalten, cur + spalten];
      for (const nz of nachbarn) {
        if (nz < 0 || nz >= zellen || koerperZelle[nz] === 0 || koerperId[nz] !== 0) {
          continue;
        }
        if (Math.abs((nz % spalten) - cx) > 1) {
          continue;
        }
        koerperId[nz] = koerperLauf;
        koerperStapel.push(nz);
      }
    }
    koerperFlaeche[koerperLauf] = zahl;
    koerperLauf += 1;
  }
  for (let z = 0; z < zellen; z += 1) {
    const id = koerperId[z];
    if (id !== 0 && koerperFlaeche[id] > 420) {
      koerperZelle[z] = 0;
    }
  }

  const gesichtZelle = new Uint8Array(zellen);
  for (let z = 0; z < zellen; z += 1) {
    if (haut[z] === 0) {
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
        const nz = ny * spalten + nx;
        if (pflanze[nz] === 1) {
          continue;
        }
        gesichtZelle[nz] = 1;
      }
    }
  }

  const koerper = new Uint8Array(width * height);
  const gesichter = new Uint8Array(width * height);
  let personPixel = 0;
  for (let z = 0; z < zellen; z += 1) {
    if (koerperZelle[z] === 0 && gesichtZelle[z] === 0) {
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
        const p = y * width + x;
        if (koerperZelle[z] === 1) {
          koerper[p] = 255;
          personPixel += 1;
        }
        if (gesichtZelle[z] === 1) {
          gesichter[p] = 255;
        }
      }
    }
  }

  /* Steigt die Maske in die Fassaden, bleibt das Foto. Eine zu hohe
     Maske schmiert Stein und Schaufenster, statt die Straße zu leeren. */
  let hoch = 0;
  for (let p = 0; p < koerper.length; p += 1) {
    if (koerper[p] === 0) {
      continue;
    }
    if (Math.floor(p / width) / height < 0.78) {
      hoch += 1;
    }
  }
  if (personPixel === 0 || hoch / personPixel > 0.25) {
    return { koerper, gesichter, anteil: 0 };
  }

  return { koerper, gesichter, anteil: personPixel / (width * height) };
}

function istPflanze(r: number, g: number, b: number): boolean {
  return g > r + 10 && g > b + 8 && g > 55;
}

function istHaut(r: number, g: number, b: number, lum: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  /* Kalkstein liegt knapp daneben: Haut ist deutlich röter als Grün. */
  if (lum < 80 || lum > 200 || sat < 0.2 || sat > 0.5) {
    return false;
  }
  return r > 120 && r > g + 15 && r > b + 28 && g > 60;
}

/** Rot und Orange der Beete. Haut ist matter und hat mehr Blau. */
function istBluete(r: number, g: number, b: number, lum: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  return r > 125 && r > g + 10 && r > b + 32 && sat > 0.25 && lum > 45;
}

/** Asphalt, Beton, steinerne Kübel: flach und entsättigt. */
function istBelag(lum: number, varianz: number, r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  return sat < 0.12 && lum > 72 && lum < 210 && varianz < 280;
}

/**
 * Hinter den Leuten liegt die Straße, nicht ein Schleier.
 * Löcher werden aus den Pixeln gefüllt, die stehen bleiben.
 */
function leerePlatte(
  quell: Uint8ClampedArray,
  person: Uint8Array,
  breite: number,
  hoehe: number,
): Uint8ClampedArray {
  const schritt = 2;
  const sw = Math.ceil(breite / schritt);
  const sh = Math.ceil(hoehe / schritt);
  const klein = sw * sh;
  const farbe = new Float32Array(klein * 3);
  const belegt = new Uint8Array(klein);
  const summe = new Float32Array(klein * 3);
  const zaehl = new Uint16Array(klein);

  for (let y = 0; y < hoehe; y += 1) {
    for (let x = 0; x < breite; x += 1) {
      const p = y * breite + x;
      if (person[p] > 40) {
        continue;
      }
      const i = p * 4;
      const r = quell[i];
      const g = quell[i + 1];
      const b = quell[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      /* Unten nur Stein und Asphalt als Füllung, sonst bluten Blüten
         und Wagen in die Lücken. */
      if (y / hoehe > 0.26 && sat > 0.16) {
        continue;
      }
      const s = Math.floor(y / schritt) * sw + Math.floor(x / schritt);
      const o = s * 3;
      summe[o] += quell[i];
      summe[o + 1] += quell[i + 1];
      summe[o + 2] += quell[i + 2];
      zaehl[s] += 1;
    }
  }
  for (let s = 0; s < klein; s += 1) {
    if (zaehl[s] === 0) {
      continue;
    }
    const o = s * 3;
    farbe[o] = summe[o] / zaehl[s];
    farbe[o + 1] = summe[o + 1] / zaehl[s];
    farbe[o + 2] = summe[o + 2] / zaehl[s];
    belegt[s] = 1;
  }

  const dist = new Float32Array(klein);
  for (let s = 0; s < klein; s += 1) {
    dist[s] = belegt[s] === 1 ? 0 : 1e6;
  }
  let sprung = 1;
  while (sprung < sw || sprung < sh) {
    sprung *= 2;
  }
  for (; sprung >= 1; sprung = Math.floor(sprung / 2)) {
    for (let y = 0; y < sh; y += 1) {
      for (let x = 0; x < sw; x += 1) {
        const s = y * sw + x;
        let beste = dist[s];
        let br = farbe[s * 3];
        let bg = farbe[s * 3 + 1];
        let bb = farbe[s * 3 + 2];
        for (let oy = -1; oy <= 1; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            if (ox === 0 && oy === 0) {
              continue;
            }
            const nx = x + ox * sprung;
            const ny = y + oy * sprung;
            if (nx < 0 || ny < 0 || nx >= sw || ny >= sh) {
              continue;
            }
            const ns = ny * sw + nx;
            const nd = dist[ns] + sprung * (ox !== 0 && oy !== 0 ? 1.4 : 1);
            if (nd < beste) {
              beste = nd;
              br = farbe[ns * 3];
              bg = farbe[ns * 3 + 1];
              bb = farbe[ns * 3 + 2];
            }
          }
        }
        dist[s] = beste;
        farbe[s * 3] = br;
        farbe[s * 3 + 1] = bg;
        farbe[s * 3 + 2] = bb;
      }
    }
  }

  const platte = new Uint8ClampedArray(quell);
  for (let y = 0; y < hoehe; y += 1) {
    for (let x = 0; x < breite; x += 1) {
      const p = y * breite + x;
      if (person[p] < 8) {
        continue;
      }
      const s = Math.floor(y / schritt) * sw + Math.floor(x / schritt);
      const o = s * 3;
      const i = p * 4;
      const korn = (rausch(x, y) - 0.5) * 14;
      platte[i] = klemme(farbe[o] + korn);
      platte[i + 1] = klemme(farbe[o + 1] + korn);
      platte[i + 2] = klemme(farbe[o + 2] + korn);
    }
  }
  return platte;
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
