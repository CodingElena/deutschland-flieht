import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Mesh,
  MathUtils,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three';

import { bandGeometrie } from './band-geometrie';
import { BANNER_SEKTION, Fahnenschnitt, Fahnenzustand } from './fahne-schnitt';
import { FRAGMENT_SHADER, VERTEX_SHADER } from './fahne-shader';

/** Oeffnungswinkel der Kamera. Steht hier, weil der Abstand daraus folgt. */
const BLICKWINKEL = 42;

/**
 * WebGL-Leinwand mit der wehenden Deutschlandfahne.
 *
 * Die Komponente rendert nur. Was das Tuch ist, steht in `schnitt`; wie es
 * gerade aussieht, in `zustand` — beides rechnet die Sektion oder der
 * Seitenkopf aus ihrem eigenen Scroll-Fortschritt.
 *
 * Ruecksichten, die hier eingebaut sind:
 *   - Die Renderschleife laeuft nur, solange die Leinwand sichtbar ist,
 *     das Tuch wehen soll und vom Tuch noch etwas uebrig ist.
 *   - Bei prefers-reduced-motion oder einem stillen Schnitt steht die Zeit
 *     still; die Fahne bleibt in einer ruhigen Pose.
 *   - Alle GPU-Ressourcen werden beim Zerstoeren wieder freigegeben.
 */
@Component({
  selector: 'app-fahnen-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas
    #leinwand
    class="leinwand"
    [attr.role]="beschreibung() ? 'img' : null"
    [attr.aria-label]="beschreibung() || null"
    [attr.aria-hidden]="beschreibung() ? null : 'true'"
  ></canvas>`,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .leinwand {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class FahnenCanvas {
  /** Schnitt des Tuchs. Wird beim Aufbau einmal gelesen. */
  readonly schnitt = input<Fahnenschnitt>(BANNER_SEKTION);
  /** Verschleiss, Bruch und Lage — folgt dem Scrollen. */
  readonly zustand = input.required<Fahnenzustand>();
  /** Beschreibung fuer Screenreader. Leer = reine Kulisse. */
  readonly beschreibung = input('');

  private readonly leinwand = viewChild.required<ElementRef<HTMLCanvasElement>>('leinwand');
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  private renderer?: WebGLRenderer;
  private szene?: Scene;
  private kamera?: PerspectiveCamera;
  private mesh?: Mesh<BufferGeometry, ShaderMaterial>;
  private laeuft = false;
  private frame = 0;
  private startzeit = 0;
  private ruhig = false;
  /** Ob die Leinwand im Bild steht. Aus dem IntersectionObserver. */
  private imBild = false;
  /** Versatz der Tuchmitte, der aus `kopfabstand` und Bildhoehe folgt. */
  private rahmenversatz = 0;

  constructor() {
    afterNextRender(() => this.aufbauen());

    /* Der Zustand wirkt direkt auf Uniforms und Lage. Bei reduzierter
       Bewegung ist er der einzige Ausloeser fuers Rendern. */
    effect(() => {
      this.zustandSetzen(this.zustand());
      this.laufZustandPruefen();
    });
  }

  private aufbauen(): void {
    const canvas = this.leinwand().nativeElement;
    const schnitt = this.schnitt();

    this.ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      /* Ohne WebGL bleibt die Stelle einfach ohne Fahne — Text und
         Typografie tragen die Aussage weiterhin. */
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    this.renderer = renderer;

    this.szene = new Scene();

    this.kamera = new PerspectiveCamera(BLICKWINKEL, 1, 0.1, 100);

    /* Die tatsaechliche Form entsteht im Vertexshader; die Geometrie liefert
       nur das uv-Raster und die Zuordnung zu den Bruchstuecken. */
    const geometrie = bandGeometrie(schnitt.segmente, schnitt.bruchstuecke);

    const material = new ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      side: DoubleSide,
      /* Das Band ist leicht durchscheinend. depthWrite bleibt an, sonst
         sortieren sich die Lagen bei Selbstueberschneidung falsch. */
      transparent: true,
      depthWrite: true,
      uniforms: {
        uTime: { value: 0 },
        uDirty: { value: 0 },
        uBruch: { value: 0 },
        uLength: { value: schnitt.laenge },
        uWidth: { value: schnitt.breite },
        uSchwung: { value: schnitt.schwung },
        uDrehung: { value: schnitt.drehung },
        uRiss: { value: schnitt.riss },
        uLoecher: { value: schnitt.loecher },
        uGlanz: { value: schnitt.glanz },
        uSaum: { value: schnitt.saum },
        uRaster: {
          value: new Vector2(schnitt.bruchstuecke?.[0] ?? 1, schnitt.bruchstuecke?.[1] ?? 1),
        },
        /* Gedaempftes Schwarz-Rot-Gold: eine voll gesaettigte Fahne wuerde
           gegen die Putty-Ink-Palette der Seite anschreien. Der Ton ist der
           einer echten, gealterten Fahne.
           Fuer die amtlichen Farben hier ersetzen durch:
           0x000000 / 0xdd0000 / 0xffce00 */
        uSchwarz: { value: new Color(0x14120f) },
        uRot: { value: new Color(0x8c2f24) },
        uGold: { value: new Color(0xb8912f) },
      },
    });

    this.mesh = new Mesh(geometrie, material);
    this.szene.add(this.mesh);

    this.groesseAnpassen();
    this.zustandSetzen(this.zustand());

    const resize = (): void => {
      this.groesseAnpassen();
      this.einmalRendern();
    };
    window.addEventListener('resize', resize, { passive: true });

    /* Rechenzeit nur ausgeben, solange die Leinwand wirklich zu sehen ist. */
    const beobachter = new IntersectionObserver(
      ([eintrag]) => {
        this.imBild = eintrag.isIntersecting;
        this.laufZustandPruefen();
      },
      { rootMargin: '10% 0px' },
    );
    beobachter.observe(this.host.nativeElement);

    this.einmalRendern();

    this.destroyRef.onDestroy(() => {
      this.stoppen();
      beobachter.disconnect();
      window.removeEventListener('resize', resize);
      geometrie.dispose();
      material.dispose();
      renderer.dispose();
    });
  }

  /** Uebertraegt Verschleiss, Bruch und Lage auf Uniforms und Mesh. */
  private zustandSetzen(zustand: Fahnenzustand): void {
    const mesh = this.mesh;
    if (!mesh) {
      return;
    }

    mesh.material.uniforms['uDirty'].value = zustand.verschleiss;
    mesh.material.uniforms['uBruch'].value = zustand.bruch;

    mesh.position.x = zustand.x;
    mesh.position.y = zustand.y + this.rahmenversatz;
    mesh.rotation.z = zustand.neigung;
    mesh.rotation.x = zustand.kippung;
  }

  private groesseAnpassen(): void {
    const renderer = this.renderer;
    const kamera = this.kamera;
    if (!renderer || !kamera) {
      return;
    }
    const el = this.host.nativeElement;
    const b = el.clientWidth || 1;
    const h = el.clientHeight || 1;

    renderer.setSize(b, h, false);
    kamera.aspect = b / h;

    /* Der Abstand folgt aus dem gewuenschten Hoehenanteil des Tuchs: so
       bleibt es in jedem Fenster gleich gross im Bild, statt mit der
       Leinwand zu wachsen. */
    const schnitt = this.schnitt();
    const anteil = schnitt.hoehenanteil[b / h < 1 ? 0 : 1];
    const bildhoehe = schnitt.breite / anteil;
    kamera.position.z =
      bildhoehe / (2 * Math.tan(MathUtils.degToRad(BLICKWINKEL) / 2));
    kamera.updateProjectionMatrix();

    /* Der Kopfabstand ist in Bildhoehen angegeben und wird hier zu einem
       Versatz in Welteinheiten. */
    this.rahmenversatz = bildhoehe * (0.5 - schnitt.kopfabstand);
    this.zustandSetzen(this.zustand());
  }

  /**
   * Entscheidet, ob die Schleife laufen muss.
   *
   * Sie laeuft nur im Bild, nur wenn das Tuch wehen soll, und nur solange
   * vom Tuch etwas uebrig ist — eine stille Flagge waere sonst dauerhaft
   * am Rechnen.
   */
  private laufZustandPruefen(): void {
    const noetig = this.imBild && !this.ruhig && this.schnitt().wehen && this.zustand().bruch < 1;

    if (noetig) {
      this.starten();
      return;
    }

    this.stoppen();
    if (this.imBild) {
      this.einmalRendern();
    }
  }

  private starten(): void {
    if (this.laeuft) {
      return;
    }
    this.laeuft = true;
    this.startzeit ||= performance.now();

    const schleife = (jetzt: number): void => {
      if (!this.laeuft) {
        return;
      }
      const mesh = this.mesh;
      if (mesh) {
        mesh.material.uniforms['uTime'].value = (jetzt - this.startzeit) / 1000;
      }
      this.einmalRendern();
      this.frame = requestAnimationFrame(schleife);
    };

    this.frame = requestAnimationFrame(schleife);
  }

  private stoppen(): void {
    this.laeuft = false;
    if (this.frame !== 0) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }

  private einmalRendern(): void {
    if (this.renderer && this.szene && this.kamera) {
      this.renderer.render(this.szene, this.kamera);
    }
  }
}
