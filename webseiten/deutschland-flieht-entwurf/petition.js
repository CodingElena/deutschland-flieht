/* ===========================================================================
 * Petitionsformular (Demo-Modus, es gibt kein Backend)
 * Zwei Wege: unterschreiben (Geschichte freiwillig) oder nur die Geschichte,
 * wenn schon unterschrieben. Bild und Gehaltsabrechnung sind freiwillig.
 * Nichts wird versendet, Dateien verlassen den Rechner nicht.
 * ========================================================================= */
const $ = (id) => document.getElementById(id);
const MAX_DATEI = 8 * 1024 * 1024;
const LEER = {
  bild: 'Bild wählen · JPG, PNG oder WebP, höchstens 8 MB',
  gehalt: 'Abrechnung wählen · PDF, JPG, PNG oder WebP, höchstens 8 MB',
};
const FEHLER = {
  vorname: 'Bitte trag deinen Vornamen ein.',
  nachname: 'Bitte trag deinen Nachnamen ein.',
  email: 'Bitte eine gültige E-Mail-Adresse angeben, an sie geht die Bestätigung.',
  emailGeschichte: 'Bitte eine gültige E-Mail-Adresse angeben, dieselbe wie bei der Unterschrift.',
  plz: 'Die Postleitzahl besteht aus fünf Ziffern.',
  profil: 'Bitte einen vollständigen Link angeben, zum Beispiel https://instagram.com/name.',
  geschichte: 'Zum Veröffentlichen brauchen wir deine Geschichte, ein Satz genügt.',
  geschichtePflicht: 'Schreib deine Geschichte, ein Satz genügt.',
  auswanderung: 'Für eine Geschichte wähl „ausgewandert“ oder „ich denke darüber nach“.',
  einwilligung: 'Ohne Einwilligung dürfen wir das nicht annehmen.',
  bild: 'Das Bild muss ein JPG, PNG oder WebP sein, höchstens 8 MB.',
  gehalt: 'Die Gehaltsabrechnung muss ein PDF, JPG, PNG oder WebP sein, höchstens 8 MB.',
};
const EINWILLIGUNG = {
  unterschrift: 'Ich bin damit einverstanden, dass meine Angaben zum Zweck dieser Petition verarbeitet und an die genannten Adressaten übergeben werden. Die Einwilligung kann ich jederzeit formlos widerrufen. *',
  mitGeschichte: 'Ich bin damit einverstanden, dass meine Angaben zum Zweck dieser Petition verarbeitet und an die genannten Adressaten übergeben werden. Freiwillig mitgeschickte Dateien gehören dazu; eine Gehaltsabrechnung wird anonymisiert veröffentlicht, sodass keine Zuordnung zur Person möglich ist. Die Einwilligung kann ich jederzeit formlos widerrufen. *',
  nurGeschichte: 'Ich bin damit einverstanden, dass meine Geschichte und freiwillig mitgeschickte Dateien zum Zweck dieser Petition verarbeitet werden. Veröffentlicht wird nur, was ich oben freigebe. Eine Gehaltsabrechnung wird anonymisiert veröffentlicht, sodass keine Zuordnung zur Person möglich ist. Die Einwilligung kann ich jederzeit formlos widerrufen. *',
};
const form = $('pt-form');
if (form) {
  const f = {
    vorname: $('pt-vorname'), nachname: $('pt-nachname'), email: $('pt-email'), plz: $('pt-plz'),
    land: $('pt-land'), geschichte: $('pt-geschichte'), profil1: $('pt-profil1'), profil2: $('pt-profil2'), profil3: $('pt-profil3'),
    einwilligung: $('pt-einwilligung'), sonstigesMotiv: $('pt-motiv-sonstiges'), sonstiges: $('pt-sonstiges'),
    bild: $('pt-bild'), gehalt: $('pt-gehalt'), auswanderung: $('pt-aw-ja'),
  };
  const dateien = {
    bild: { typen: ['image/jpeg', 'image/png', 'image/webp'], endungen: ['jpg', 'jpeg', 'png', 'webp'] },
    gehalt: { typen: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], endungen: ['pdf', 'jpg', 'jpeg', 'png', 'webp'] },
  };
  let versucht = false;
  let bildUrl = '';
  let bildStand = '';
  let gehaltStand = '';
  const beruehrt = new Set();
  const nurGeschichte = () => form.querySelector('input[name="weg"]:checked')?.value === 'geschichte';
  const wahl = () => form.querySelector('input[name="auswanderung"]:checked')?.value || 'nein';
  const offen = () => wahl() !== 'nein';
  const veroeff = () => form.querySelector('input[name="veroeff"]:checked')?.value || 'nein';
  const urlOk = (v) => { try { const u = new URL(v.trim()); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; } };
  const endung = (name) => name.split('.').pop()?.toLowerCase() || '';

  function dateiUngueltig(id) {
    const file = f[id].files?.[0];
    if (!file) return false;
    const regel = dateien[id];
    const typOk = regel.typen.includes(file.type) || regel.endungen.includes(endung(file.name));
    return !typOk || file.size < 1 || file.size > MAX_DATEI;
  }

  function pruefen() {
    const e = {};
    const nur = nurGeschichte();
    if (!f.vorname.value.trim()) e.vorname = FEHLER.vorname;
    if (!f.nachname.value.trim()) e.nachname = FEHLER.nachname;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value)) e.email = nur ? FEHLER.emailGeschichte : FEHLER.email;
    if (!nur && !/^\d{5}$/.test(f.plz.value)) e.plz = FEHLER.plz;
    if (nur && !offen()) e.auswanderung = FEHLER.auswanderung;
    if (offen() && nur && !f.geschichte.value.trim()) e.geschichte = FEHLER.geschichtePflicht;
    else if (offen() && !nur && veroeff() !== 'nein' && !f.geschichte.value.trim()) e.geschichte = FEHLER.geschichte;
    if (offen() && veroeff() === 'name') for (const id of ['profil1', 'profil2', 'profil3']) if (f[id].value.trim() && !urlOk(f[id].value)) e[id] = FEHLER.profil;
    if (offen() && dateiUngueltig('bild')) e.bild = FEHLER.bild;
    if (offen() && dateiUngueltig('gehalt')) e.gehalt = FEHLER.gehalt;
    if (!f.einwilligung.checked) e.einwilligung = FEHLER.einwilligung;
    return e;
  }

  function fehlerzeile(id) {
    return document.getElementById('pt-' + id + '-fehler');
  }

  function dateiStand(file) {
    return file ? file.name + ':' + file.size + ':' + file.lastModified : '';
  }

  function zeigeDateien() {
    const bild = f.bild.files?.[0];
    const gehalt = f.gehalt.files?.[0];
    const naechstesBild = dateiStand(bild);
    const naechstesGehalt = dateiStand(gehalt);
    $('pt-bild-weg').hidden = !bild;
    $('pt-gehalt-weg').hidden = !gehalt;
    if (naechstesGehalt !== gehaltStand) {
      gehaltStand = naechstesGehalt;
      $('pt-gehalt-text').textContent = gehalt ? gehalt.name : LEER.gehalt;
    }
    if (naechstesBild === bildStand) return;
    bildStand = naechstesBild;
    if (bildUrl) URL.revokeObjectURL(bildUrl);
    bildUrl = '';
    const vorschau = $('pt-bild-vorschau');
    if (bild && !dateiUngueltig('bild')) {
      bildUrl = URL.createObjectURL(bild);
      vorschau.src = bildUrl;
      vorschau.hidden = false;
      $('pt-bild-text').textContent = bild.name;
    } else {
      vorschau.removeAttribute('src');
      vorschau.hidden = true;
      $('pt-bild-text').textContent = bild ? bild.name : LEER.bild;
    }
  }

  function dateiAblegen(zone, input) {
    zone.addEventListener('dragover', (ev) => {
      ev.preventDefault();
      zone.classList.add('is-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('is-over'));
    zone.addEventListener('drop', (ev) => {
      ev.preventDefault();
      zone.classList.remove('is-over');
      const file = ev.dataTransfer?.files?.[0];
      if (!file) return;
      const liste = new DataTransfer();
      liste.items.add(file);
      input.files = liste.files;
      beruehrt.add(input.id === 'pt-bild' ? 'bild' : 'gehalt');
      aktualisieren();
    });
  }

  function aktualisieren() {
    const nur = nurGeschichte();
    const auf = offen();
    $('pt-titel').textContent = nur ? 'Geschichte einreichen' : 'Jetzt unterschreiben';
    $('pt-karte-sub').textContent = nur
      ? 'Du hast schon unterschrieben. Hier schickst du nur deine Geschichte. Mit * markierte Felder sind Pflicht.'
      : 'Das dauert eine Minute. Die Geschichte ist freiwillig. Mit * markierte Felder sind Pflicht.';
    $('pt-legende-person').textContent = nur ? '1 · Zu deiner Unterschrift' : '1 · Deine Unterschrift';
    $('pt-legende-geschichte').textContent = nur ? '2 · Deine Geschichte' : '2 · Deine Geschichte (freiwillig)';
    $('pt-email-hint').textContent = nur
      ? 'Dieselbe Adresse wie bei der Unterschrift. Wird nicht veröffentlicht.'
      : 'Für die Bestätigung. Wird nicht veröffentlicht.';
    $('pt-plz-feld').hidden = nur;
    $('pt-geschichte-box').hidden = !auf;
    $('pt-geschichte-pflicht').hidden = !nur;
    $('pt-land-label').textContent = wahl() === 'ja' ? 'Wohin bist du gegangen?' : 'Wohin zieht es dich?';
    $('pt-profile-box').hidden = !(auf && veroeff() === 'name');
    $('pt-sonstiges-feld').hidden = !f.sonstigesMotiv.checked;
    $('pt-einwilligung-text').textContent = nur ? EINWILLIGUNG.nurGeschichte : (auf ? EINWILLIGUNG.mitGeschichte : EINWILLIGUNG.unterschrift);
    const aktion = nur ? 'Geschichte einreichen' : 'Unterschreiben';
    $('pt-absenden').textContent = aktion;
    const mobil = $('pt-mobilbar-link');
    if (mobil) mobil.textContent = nur ? 'Geschichte einreichen' : 'Jetzt unterschreiben';
    zeigeDateien();

    const e = pruefen();
    for (const id of ['vorname', 'nachname', 'email', 'plz', 'geschichte', 'profil1', 'profil2', 'profil3']) {
      const input = f[id];
      let p = fehlerzeile(id);
      const zeigen = e[id] && (versucht || beruehrt.has(id));
      input.setAttribute('aria-invalid', zeigen ? 'true' : 'false');
      if (zeigen) {
        if (!p) {
          p = document.createElement('p');
          p.className = 'fehler';
          p.id = 'pt-' + id + '-fehler';
          input.insertAdjacentElement('afterend', p);
          input.setAttribute('aria-describedby', p.id);
        }
        p.textContent = e[id];
      } else if (p) {
        p.remove();
        input.removeAttribute('aria-describedby');
      }
    }
    for (const id of ['bild', 'gehalt']) {
      const input = f[id];
      const zone = $('pt-' + id + '-zone');
      let p = fehlerzeile(id);
      const zeigen = e[id] && (versucht || beruehrt.has(id));
      input.setAttribute('aria-invalid', zeigen ? 'true' : 'false');
      zone.classList.toggle('is-invalid', !!zeigen);
      if (zeigen) {
        if (!p) {
          p = document.createElement('p');
          p.className = 'fehler';
          p.id = 'pt-' + id + '-fehler';
          zone.insertAdjacentElement('afterend', p);
        }
        p.textContent = e[id];
      } else if (p) p.remove();
    }
    const ef = $('pt-einwilligung-f');
    ef.hidden = !(e.einwilligung && versucht);
    ef.textContent = e.einwilligung || '';
    const af = $('pt-auswanderung-f');
    af.hidden = !(e.auswanderung && versucht);
    af.textContent = e.auswanderung || '';

    const box = $('pt-fehlerbox');
    const liste = $('pt-fehlerliste');
    liste.replaceChildren();
    if (versucht && Object.keys(e).length) {
      for (const [feld, text] of Object.entries(e)) {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = text;
        b.addEventListener('click', () => f[feld]?.focus());
        li.append(b);
        liste.append(li);
      }
      box.hidden = false;
    } else box.hidden = true;
    $('pt-zeichen').textContent = 1200 - f.geschichte.value.length + ' Zeichen frei';
  }

  form.addEventListener('input', aktualisieren);
  form.addEventListener('change', (ev) => {
    if (ev.target?.id === 'pt-bild' || ev.target?.id === 'pt-gehalt') beruehrt.add(ev.target.id === 'pt-bild' ? 'bild' : 'gehalt');
    if (ev.target?.name === 'weg' && ev.target.value === 'geschichte' && wahl() === 'nein') $('pt-aw-ja').checked = true;
    aktualisieren();
  });
  for (const id of Object.keys(f)) f[id]?.addEventListener('blur', () => {
    beruehrt.add(id);
    aktualisieren();
  });
  for (const id of ['bild', 'gehalt']) {
    $('pt-' + id + '-weg').addEventListener('click', () => {
      f[id].value = '';
      beruehrt.add(id);
      aktualisieren();
    });
    dateiAblegen($('pt-' + id + '-zone'), f[id]);
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    versucht = true;
    aktualisieren();
    const e = pruefen();
    const erster = Object.keys(e)[0];
    if (erster) {
      (erster === 'auswanderung' ? $('pt-aw-ja') : f[erster])?.focus();
      $('pt-fehlerbox').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
      return;
    }
    form.hidden = true;
    $('pt-quittung').hidden = false;
    $('formular').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
  $('pt-zurueck').addEventListener('click', () => {
    $('pt-quittung').hidden = true;
    form.hidden = false;
  });

  if (new URLSearchParams(location.search).get('teilnahme') === 'geschichte') {
    $('pt-weg-geschichte').checked = true;
    $('pt-aw-ja').checked = true;
    requestAnimationFrame(() => {
      if (window.innerWidth <= 980) {
        $('formular').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      }
    });
  }
  aktualisieren();
}

/* Handy: feste Schaltfläche, solange das Formular nicht im Bild ist */
(function mobilbar() {
  const bar = $('pt-mobilbar');
  const ziel = $('formular');
  if (!bar || !ziel || !('IntersectionObserver' in window)) return;
  let hero = true;
  let formular = false;
  const sync = () => bar.classList.toggle('is-on', !hero && !formular);
  new IntersectionObserver(([e]) => {
    formular = e.isIntersecting;
    sync();
  }, { threshold: 0.08 }).observe(ziel);
  const sh = document.querySelector('.sh');
  if (sh)
    new IntersectionObserver(([e]) => {
      hero = e.isIntersecting;
      sync();
    }, { threshold: 0.35 }).observe(sh);
})();

/* Link auf einen Abschnitt im Petitionstext öffnet die Klappe */
(function textOeffnen() {
  const falt = $('pt-falt');
  if (!falt) return;
  const oeffnen = () => {
    const id = location.hash.slice(1);
    if (!id) return;
    const ziel = document.getElementById(id);
    if (ziel && (ziel === falt || falt.contains(ziel))) falt.open = true;
  };
  oeffnen();
  window.addEventListener('hashchange', oeffnen);
})();
