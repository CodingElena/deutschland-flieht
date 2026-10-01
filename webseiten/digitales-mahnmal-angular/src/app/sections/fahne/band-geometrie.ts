import { BufferAttribute, BufferGeometry, PlaneGeometry } from 'three';

/**
 * Geometrie des Tuchs.
 *
 * Die Form rechnet der Vertexshader; hier entsteht nur das uv-Raster, das er
 * dafuer abtastet — und, wenn das Tuch brechen soll, die Zuordnung jedes
 * Dreiecks zu einem Bruchstueck.
 *
 * Ein zusammenhaengendes Netz kann nicht in Stuecke fallen: benachbarte
 * Dreiecke teilen ihre Eckpunkte, ein wegkippendes Stueck wuerde die
 * Nachbarn mitziehen. Deshalb wird das Netz fuer den Bruch aufgetrennt
 * (`toNonIndexed`), und jedes Dreieck bekommt in `aStueck` die uv-Mitte
 * seines Stuecks. Im Shader dreht jedes Stueck um genau diesen Punkt.
 *
 * Das kostet die dreifache Zahl an Eckpunkten. Wo kein Bruch gebraucht wird,
 * bleibt das Netz deshalb verbunden.
 *
 * @param segmente     Aufloesung des Rasters: [laengs, quer].
 * @param bruchstuecke Raster der Bruchstuecke [laengs, quer], oder `null`
 *                     fuer ein Tuch, das nur verschleisst.
 */
export function bandGeometrie(
  segmente: readonly [number, number],
  bruchstuecke: readonly [number, number] | null,
): BufferGeometry {
  const raster = new PlaneGeometry(1, 1, segmente[0], segmente[1]);

  if (!bruchstuecke) {
    /* Ohne Bruch wird `aStueck` nie gelesen. Das Attribut muss trotzdem
       vorhanden sein, sonst laeuft der Shader auf ein nicht belegtes
       Attribut. Der eigene uv-Punkt ist der guenstigste Wert dafuer. */
    raster.setAttribute('aStueck', kopie(raster.getAttribute('uv')));
    return raster;
  }

  const geometrie = raster.toNonIndexed();
  raster.dispose();

  const uv = geometrie.getAttribute('uv');
  const mitten = new Float32Array(uv.count * 2);

  /* Drei Eckpunkte je Dreieck, deshalb der Schritt von 3. Ueber welchem
     Stueck ein Dreieck liegt, entscheidet sein Schwerpunkt: so gehoert
     jedes Dreieck zu genau einem Stueck, auch wenn eine Ecke schon auf der
     Grenze zum Nachbarn sitzt. */
  for (let i = 0; i < uv.count; i += 3) {
    const u = (uv.getX(i) + uv.getX(i + 1) + uv.getX(i + 2)) / 3;
    const v = (uv.getY(i) + uv.getY(i + 1) + uv.getY(i + 2)) / 3;

    const mitteU = (Math.floor(u * bruchstuecke[0]) + 0.5) / bruchstuecke[0];
    const mitteV = (Math.floor(v * bruchstuecke[1]) + 0.5) / bruchstuecke[1];

    for (let k = 0; k < 3; k++) {
      mitten[(i + k) * 2] = mitteU;
      mitten[(i + k) * 2 + 1] = mitteV;
    }
  }

  geometrie.setAttribute('aStueck', new BufferAttribute(mitten, 2));
  return geometrie;
}

/** Zweikomponentiges Attribut aus einem vorhandenen kopieren. */
function kopie(quelle: { count: number; getX(i: number): number; getY(i: number): number }): BufferAttribute {
  const werte = new Float32Array(quelle.count * 2);
  for (let i = 0; i < quelle.count; i++) {
    werte[i * 2] = quelle.getX(i);
    werte[i * 2 + 1] = quelle.getY(i);
  }
  return new BufferAttribute(werte, 2);
}
