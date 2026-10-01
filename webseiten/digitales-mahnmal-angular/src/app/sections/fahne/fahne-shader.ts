/* ===========================================================================
 * Shader der 3D-Deutschlandfahne
 *
 * Die Fahne ist kein flaches Rechteck, sondern ein langes, in sich verdrehtes
 * Tuch, das diagonal ueber die gesamte Breite zieht und an beiden Raendern
 * aus dem Bild laeuft — wie das Tuch in der Referenzvorlage.
 *
 * Die Form entsteht komplett im Vertexshader aus den uv-Koordinaten:
 *   uv.x  Laufrichtung des Bandes (0 = linkes Ende, 1 = rechtes Ende)
 *   uv.y  Querrichtung (0 = Unterkante, 1 = Oberkante)
 *
 * Der Zustand haengt an zwei Groessen, beide 0 bis 1 und beide von aussen
 * gesteuert:
 *   uDirty = 0   sauberes Tuch
 *   uDirty = 1   verdreckt, ausgeblichen, ausgefranst, durchloechert
 *   uBruch = 0   geschlossenes Tuch
 *   uBruch = 1   in Stuecke zerbrochen und weggefallen
 * ========================================================================= */

export const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uDirty;
  uniform float uLength;
  uniform float uWidth;
  uniform float uSchwung;
  uniform float uDrehung;
  uniform float uBruch;
  /* Offene Naehte, ohne dass die Bahnen fallen. 0 = geschlossen. */
  uniform float uRiss;

  /* uv-Mitte des Bruchstuecks, zu dem dieses Dreieck gehoert. Alle Dreiecke
     eines Stuecks tragen denselben Wert — nur deshalb kann das Stueck als
     Ganzes wegkippen, statt sich zu verziehen. */
  attribute vec2 aStueck;

  varying vec2  vUv;
  varying vec3  vNormal;
  varying vec3  vTangent;
  varying vec3  vBlick;
  varying float vTwist;
  varying float vZerfall;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  /* Drehung um eine freie Achse (Rodrigues). Nur der Bruch braucht sie:
     jedes Stueck kippt um seine eigene Achse aus der Flaeche. */
  vec3 drehe(vec3 v, vec3 achse, float winkel) {
    float c = cos(winkel);
    float s = sin(winkel);
    return v * c + cross(achse, v) * s + achse * dot(achse, v) * (1.0 - c);
  }

  /* Punkt des Bandes zu gegebenen uv-Koordinaten.
     Mittellinie + um die Laengsachse verdrehte Querrichtung.
     zeit ist die Wellenphase: uTime fuer das wehende Tuch, 0 fuer die
     ruhige Lage, in die ein geloestes Stueck zuruecksinkt. */
  vec3 punkt(vec2 uv, float zeit) {
    float t = uv.x;
    float v = uv.y - 0.5;

    /* --- Mittellinie ----------------------------------------------------
       Zwei ueberlagerte Schwingungen in Hoehe und Tiefe. Die langsamere
       gibt den grossen Schwung, die schnellere den Stoffcharakter.

       uSchwung daempft beide. Das Band der Sektion hat die ganze Bildhoehe
       zur Verfuegung (1.0); eine Flagge in einem flachen Streifen wuerde mit
       derselben Auslenkung oben und unten aus dem Ausschnitt laufen. */
    float x = (t - 0.5) * uLength;
    float y = (sin(t * 6.6 + zeit * 0.85) * 0.62
            + sin(t * 14.5 - zeit * 1.35) * 0.16) * uSchwung;
    float z = (cos(t * 5.0 - zeit * 1.05) * 0.80
            + sin(t * 11.3 + zeit * 0.70) * 0.20) * uSchwung;

    /* --- Verdrehung um die Laengsachse -----------------------------------
       Das ist der entscheidende Unterschied zum flachen Rechteck: die
       Querrichtung rotiert entlang des Bandes, dadurch dreht sich das Tuch
       in sich und zeigt abwechselnd Vorder- und Rueckseite.

       Die beiden Frequenzen sind bewusst unharmonisch (3.1 zu 1.37): bei
       ganzzahligen Verhaeltnissen entstehen zwei symmetrische Kniffe links
       und rechts der Mitte, und das Band sieht aus wie eine Schleife statt
       wie ein wehendes Tuch. */
    /* Die Amplitude bleibt bewusst unter 90 Grad: kippt das Band ganz auf
       die Kante, verschwindet es dort zu einer Linie und sieht aus, als
       waere es zusammengekniffen. So bleibt immer die Flaeche sichtbar,
       nur unterschiedlich stark geneigt. */
    float twist = sin(t * 6.0 - zeit * 0.95) * 0.78
                + sin(t * 2.65 + zeit * 0.52) * 0.42;

    /* Ein verschlissenes Tuch haengt schwerer und dreht sich unruhiger. */
    twist *= 1.0 + uDirty * 0.30;

    /* Die Verdrehung faellt mit dem Schwung. Beim vollen Schwung des Bandes
       bleibt sie; eine stille Flagge mit kleinem Schwung liegt flacher und
       kippt nicht zur Kante. uDrehung nimmt sie noch einmal zurueck. */
    twist *= mix(0.18, 1.0, uSchwung) * uDrehung;

    /* --- Breite ----------------------------------------------------------
       Nahezu konstant. Eine Verjuengung zu den Enden macht aus dem Banner
       eine spitze Blattform; das Band soll aber am Bildrand abgeschnitten
       wirken, nicht dort auslaufen. Die minimale Schwankung nimmt der Kante
       nur die maschinelle Geradheit. */
    float taper = 1.0 - 0.06 * sin(t * 2.3 + zeit * 0.4);
    float w = uWidth * taper;

    vec3 quer = vec3(0.0, cos(twist), sin(twist)) * (v * w);

    return vec3(x, y, z) + quer;
  }

  /* Weicher Einsatz: ein geloestes Stueck soll anlaufen, nicht losschnellen. */
  float glaetten(float x) {
    return x * x * (3.0 - 2.0 * x);
  }

  /* Zieht die Eckpunkte zur Bahnmitte, damit zwischen den Bahnen eine
     Luecke steht. Die Breite schwankt leicht, der Riss wird nicht zur
     geraden Schnittkante. */
  vec2 gerissen(vec2 stoff) {
    if (uRiss <= 0.0) {
      return stoff;
    }
    /* Gleichmaessig zur Bahnmitte: eine Luecke, kein Zusammenfallen
       der Flaeche zu Streifen. */
    vec2 delta = stoff - aStueck;
    float unruhe = hash(aStueck * 19.4);
    float faktor = mix(1.0, 0.9, uRiss) - unruhe * 0.025 * uRiss;
    return aStueck + delta * faktor;
  }

  void main() {
    vUv = uv;
    vec2 stoffUv = gerissen(uv);

    /* --- Bruch -------------------------------------------------------------
       Das Tuch reisst nicht auf einmal. Jedes Stueck hat eine eigene
       Startschwelle und laeuft dann in sich weich an: erst oeffnet sich
       eine Naht, dann kippt die Bahn leicht und sinkt. Kein Wirbel, kein
       Auseinanderstieben — die Flaeche laesst los.

       Alle Dreiecke eines Stuecks tragen denselben Mittelpunkt, deshalb
       bleibt die Bahn in sich starr. Normale und Faserrichtung drehen mit,
       sonst liegt der Glanz nach dem Kippen noch in der alten Flaeche. */
    float zerfall = 0.0;
    if (uBruch > 0.0) {
      float schwelle = hash(aStueck * 61.7) * 0.66;
      float roh = clamp((uBruch - schwelle) / 0.34, 0.0, 1.0);
      zerfall = glaetten(roh);
    }
    vZerfall = zerfall;

    /* Ein geloestes Stueck hoert auf zu schlagen und sinkt in die ruhige
       Lage zurueck. Der Uebergang ist stetig, sonst wuerde die Bahn springen. */
    vec3 pos = mix(punkt(stoffUv, uTime), punkt(stoffUv, 0.0), zerfall);

    /* Normale ueber finite Differenzen. Bei dieser Kombination aus
       Mittellinie und Verdrehung waere die analytische Ableitung unnoetig
       fehleranfaellig. */
    float e = 0.004;
    vec3 dx = mix(punkt(uv + vec2(e, 0.0), uTime), punkt(uv + vec2(e, 0.0), 0.0), zerfall) - pos;
    vec3 dy = mix(punkt(uv + vec2(0.0, e), uTime), punkt(uv + vec2(0.0, e), 0.0), zerfall) - pos;
    vec3 n = normalize(cross(dx, dy));

    /* Faserrichtung des Gewebes: laengs des Bandes. Sie bestimmt, in
       welche Richtung der Glanz auslaeuft — genau das unterscheidet Satin
       von einer matten Flaeche. */
    vec3 t = normalize(dx);

    if (zerfall > 0.0) {
      vec3 mitte = mix(punkt(aStueck, uTime), punkt(aStueck, 0.0), zerfall);
      vec3 rel = pos - mitte;

      /* Vor allem um die Laengsachse, nur ein wenig zur Seite: die Bahn
         kippt, sie trudelt nicht. */
      vec3 achse = normalize(vec3(
        1.0,
        (hash(aStueck * 27.3 + 4.0) - 0.5) * 0.22,
        (hash(aStueck * 41.7 + 9.0) - 0.5) * 0.18
      ));

      float winkel = zerfall * (0.1 + hash(aStueck * 7.9 + 2.0) * 0.32);
      rel = drehe(rel, achse, winkel);
      n = drehe(n, achse, winkel);
      t = drehe(t, achse, winkel);

      /* Zuerst die Naht, dann das Sinken. Der Fall setzt spaeter ein als
         der Spalt und laeuft quadratisch, damit die Bahn sich loest, bevor
         sie nach unten zieht. */
      float oeffnen = smoothstep(0.0, 0.42, zerfall);
      float sinken = smoothstep(0.18, 1.0, zerfall);
      sinken *= sinken;

      rel *= 1.0 + oeffnen * 0.045;

      float seite = (hash(aStueck * 5.3 + 3.0) - 0.5) * uWidth * 0.16;
      float tiefe = (hash(aStueck * 3.7 + 6.0) - 0.5) * uWidth * 0.07;
      float fall = (0.62 + hash(aStueck * 9.1 + 8.0) * 0.7) * uWidth;

      pos = mitte + rel + vec3(seite * sinken, -fall * sinken, tiefe * oeffnen);
    }

    vNormal = normalize(normalMatrix * n);
    vTangent = normalize(normalMatrix * t);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vBlick = normalize(-mv.xyz);

    vTwist = sin(uv.x * 4.6 - uTime * 0.95);

    gl_Position = projectionMatrix * mv;
  }
`;

export const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uDirty;
  uniform float uRiss;
  uniform float uLoecher;
  uniform float uGlanz;
  uniform float uSaum;
  uniform float uLength;
  uniform float uWidth;
  uniform vec2  uRaster;
  uniform vec3  uSchwarz;
  uniform vec3  uRot;
  uniform vec3  uGold;

  varying vec2  vUv;
  varying vec3  vNormal;
  varying vec3  vTangent;
  varying vec3  vBlick;
  varying float vTwist;
  varying float vZerfall;

  /* --- Rauschen ---------------------------------------------------------- */

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  /* Eine weiche, unregelmaessige Oeffnung. Der Radius ist in Welteinheiten,
     damit sie nicht zum Schlitz wird. Die Kante laeuft in sich, ohne Franse
     und ohne Kreis. Saat entscheidet, ob sie bei der aktuellen Staerke offen ist. */
  float oeffnung(vec2 uv, vec2 zentrum, float radius, float saat) {
    float los = hash(vec2(saat, 2.3));
    vec2 delta = vec2((uv.x - zentrum.x) * uLength, (uv.y - zentrum.y) * uWidth);
    float winkel = atan(delta.y, delta.x);
    float beule = 0.84
      + 0.2 * sin(winkel * 2.0 + saat * 3.1)
      + 0.12 * sin(winkel * 3.0 - saat);
    float d = length(delta) / beule;
    float kern = 1.0 - smoothstep(radius * 0.35, radius, d);
    if (los > uLoecher * 0.72) {
      kern = 0.0;
    }
    return kern;
  }

  void main() {
    /* --- Schwarz-Rot-Gold ------------------------------------------------
       Die Streifen laufen laengs durch das Band. uv.y = 1 ist oben, also
       von oben nach unten: Schwarz, Rot, Gold. */
    float y = vUv.y;
    vec3 farbe = uGold;
    farbe = mix(farbe, uRot, smoothstep(0.330, 0.337, y));
    farbe = mix(farbe, uSchwarz, smoothstep(0.663, 0.670, y));

    /* --- Gewebe -----------------------------------------------------------
       Feine Koernung in Kett- und Schussrichtung. Das Band ist lang,
       deshalb laengs deutlich hoeher aufgeloest. */
    float kette = noise(vUv * vec2(1400.0, 6.0));
    float schuss = noise(vUv * vec2(6.0, 260.0));
    farbe *= 0.95 + 0.05 * (kette + schuss);

    /* --- Normale mit feinen Falten ----------------------------------------
       Die grosse Wellenform kommt aus dem Vertexshader; hier kommen nur
       die feinen Zuege dazu.

       Entscheidend ist die Form des Rauschens: stark laengs gestreckt
       (Faktor 900 zu 7), sodass duenne, in Faserrichtung verlaufende Zuege
       entstehen. Isotropes Rauschen wuerde runde Flecken erzeugen und die
       Fahne wie ein Tarnmuster aussehen lassen. Die Staerke ist bewusst
       klein — der Glanz soll die Falten zeigen, nicht die Farbe. */
    vec3 n = normalize(vNormal);
    vec3 t = normalize(vTangent);
    if (!gl_FrontFacing) {
      n = -n;
    }
    vec3 bt = normalize(cross(n, t));

    vec2 fs = vec2(900.0, 7.0);
    float e = 0.0016;
    float h0 = fbm(vUv * fs);
    float hx = fbm((vUv + vec2(e, 0.0)) * fs);
    float hy = fbm((vUv + vec2(0.0, e)) * fs);
    n = normalize(n - t * (hx - h0) * 1.1 - bt * (hy - h0) * 2.6);

    /* --- Licht ------------------------------------------------------------ */
    vec3 licht = normalize(vec3(-0.30, 0.62, 0.72));
    vec3 blick = normalize(vBlick);

    /* Stoff streut das Licht in die Tiefe, deshalb ein teilweise
       umgeschlagenes Diffuslicht statt eines harten Terminators. */
    float ndl = dot(n, licht);
    float diffus = mix(max(ndl, 0.0), ndl * 0.5 + 0.5, 0.5);
    float gegen = max(dot(n, normalize(vec3(0.55, -0.35, -0.55))), 0.0);

    /* --- Anisotroper Glanz (Kajiya-Kay) ------------------------------------
       Der entscheidende Punkt fuer glaenzenden Stoff: der Glanz eines
       Gewebes ist nicht rund wie bei Kunststoff, sondern laeuft quer zur
       Faserrichtung in Baendern aus. Genau das macht Satin und Seide
       erkennbar. Dazu ein zweites, breites Band fuer den weichen Schimmer. */
    float tl = dot(t, licht);
    float tv = dot(t, blick);
    float sinTL = sqrt(max(0.0, 1.0 - tl * tl));
    float sinTV = sqrt(max(0.0, 1.0 - tv * tv));
    float basis = max(0.0, sinTL * sinTV - tl * tv);

    float glanzScharf = pow(basis, 34.0);
    float glanzWeich = pow(basis, 7.0);

    /* --- Fresnel ----------------------------------------------------------
       Flach angeschnittener Stoff wirft mehr Licht zurueck. Das gibt dem
       Tuch den seidigen Saum an den weglaufenden Kanten. */
    float fresnel = pow(1.0 - max(dot(n, blick), 0.0), 4.0);

    /* Verschlissener Stoff verliert seinen Glanz — er wird stumpf.
       uGlanz nimmt ihn zusaetzlich zurueck, wo das Tuch Kulisse ist. */
    float glanzstaerke = (1.0 - uDirty * 0.75) * uGlanz;

    /* Sehr zurueckhaltende Verdeckung in den Zuegen. Mehr als das erzeugt
       sichtbare Flecken auf der Flaeche. */
    float ao = mix(0.95, 1.03, h0);

    farbe *= (0.34 + 0.72 * diffus + 0.16 * gegen) * ao;

    vec3 glanzfarbe = mix(vec3(1.0, 0.97, 0.92), farbe * 2.2, 0.4);
    farbe += glanzfarbe * (glanzScharf * 0.85 + glanzWeich * 0.28) * glanzstaerke;
    farbe += vec3(0.62, 0.60, 0.55) * fresnel * 0.22 * glanzstaerke;

    /* Die Rueckseite eines Tuchs ist matter und dunkler — sichtbar
       ueberall dort, wo sich das Band in sich dreht. */
    if (!gl_FrontFacing) {
      farbe *= 0.68;
    }

    /* --- Verschmutzung ----------------------------------------------------
       Grossflaechige Verschmutzung plus feinere Flecken. Das Band ist lang,
       deshalb laengs gestreckt abgetastet. */
    float dreckGrob = fbm(vUv * vec2(9.0, 3.2));
    float dreckFein = fbm(vUv * vec2(28.0, 11.0) + 4.0);

    /* Dosierung: genug, dass die Verschmutzung deutlich sichtbar ist, aber
       nicht so viel, dass Schwarz-Rot-Gold am Ende nicht mehr erkennbar
       waere — die Fahne muss bis zuletzt lesbar bleiben. */
    vec3 dreckton = vec3(0.19, 0.17, 0.13);
    farbe = mix(farbe, dreckton, uDirty * 0.44 * dreckGrob);
    farbe *= 1.0 - uDirty * 0.20 * dreckFein;

    /* Ausbleichen: mit zunehmendem Verschleiss verliert der Stoff Farbe. */
    float luma = dot(farbe, vec3(0.299, 0.587, 0.114));
    farbe = mix(farbe, vec3(luma), uDirty * 0.40);

    /* --- Loecher aus dem Verschleiss --------------------------------------
       Ein langes Banner verschleisst an den Laengskanten zuerst, dazu
       vereinzelte Loecher in der Flaeche. Bewusst zurueckhaltend dosiert:
       am Ende soll eine dreckige, loechrige, aber unverkennbare
       Deutschlandfahne stehen — kein aufgeloester Fetzen. */
    float loch = fbm(vUv * vec2(16.0, 5.5) + 13.0);
    float rand = smoothstep(0.34, 0.5, abs(vUv.y - 0.5));
    float schwelle = uDirty * 0.40 * (0.48 + rand * 0.95);

    if (loch < schwelle) {
      discard;
    }

    /* Ausgefranster, dunkler Saum um jedes Loch und an den Kanten. */
    float saum = smoothstep(schwelle, schwelle + 0.075, loch);
    farbe = mix(farbe * 0.32, farbe, saum);

    /* Leicht transparent: das Band bleibt ein Bildelement und kein Deckel.
       Lettern und Lichtraum scheinen schwach durch, dadurch sitzt die Fahne
       in der Szene statt davor. uSaum zieht die langen Kanten zusaetzlich
       in den Grund aus, damit der Saum nicht als Schnitt im Himmel steht. */
    float dist = abs(vUv.y - 0.5);
    /* uSaum schiebt den Beginn nach innen und nimmt die Kante auf null,
       damit der Saum auslaeuft statt abzuschneiden. */
    float innen = mix(0.24, 0.12, uSaum);
    float kante = mix(0.80, 0.0, uSaum);
    float rand2 = smoothstep(0.5, innen, dist);
    float alpha = mix(kante, 0.93, rand2);

    /* --- Ruhige Loecher ---------------------------------------------------
       Drei Orte, in verschiedenen Streifen und nicht auf einer Linie.
       Klein genug, dass sie im Streifen bleiben. Der Rand ist nur ein
       kurzer, dunkler Saum. */
    if (uLoecher > 0.001) {
      float loch = 0.0;
      loch = max(loch, oeffnung(vUv, vec2(0.31, 0.16), 0.7, 5.8));
      loch = max(loch, oeffnung(vUv, vec2(0.56, 0.50), 0.62, 4.2));
      loch = max(loch, oeffnung(vUv, vec2(0.78, 0.18), 0.48, 6.3));
      float durch = smoothstep(0.08, 0.4, loch);
      float randsaum = smoothstep(0.04, 0.16, loch) * (1.0 - durch);
      if (durch > 0.48) {
        discard;
      }
      alpha *= 1.0 - durch;
      farbe *= mix(1.0, 0.7, randsaum);
    }

    /* --- Risse ------------------------------------------------------------
       Dunkler, ausgefranster Saum an den Bahnkanten. Die Luecke selbst
       kommt aus dem Vertexshader; hier wird die Kante zur Naht, auch auf
       dem schwarzen Streifen, wo eine Luecke im dunklen Grund verschwinden
       wuerde. */
    if (uRiss > 0.001) {
      vec2 zelle = fract(vUv * uRaster);
      float randDist = min(min(zelle.x, 1.0 - zelle.x), min(zelle.y, 1.0 - zelle.y));
      float ausfransen = fbm(vUv * vec2(46.0, 9.0));
      float grenze = mix(0.008, 0.034, ausfransen) * uRiss;
      float riss = 1.0 - smoothstep(0.0, grenze, randDist);
      float franse = smoothstep(grenze * 2.4, grenze * 0.7, randDist) * (1.0 - riss);
      farbe *= mix(1.0, 0.42, riss);
      farbe += vec3(0.48, 0.36, 0.22) * franse * 0.4 * uRiss;
      alpha *= mix(1.0, 0.55, riss);
    }

    /* --- Zerfall ----------------------------------------------------------
       Die Bahn bleibt lange als Stoff lesbar und sinkt erst, dann loest
       sie sich auf. Zu fruehes Abdunkeln liest sich als Verschwinden,
       nicht als Fallen. */
    farbe *= 1.0 - vZerfall * 0.12;
    alpha *= 1.0 - smoothstep(0.78, 1.0, vZerfall);

    gl_FragColor = vec4(farbe, alpha);
  }
`;
