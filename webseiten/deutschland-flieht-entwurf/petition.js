/* ===========================================================================
 * Petitionsformular (Demo-Modus, es gibt kein Backend)
 * Zwei Schritte: 1 · Unterschrift (kurz), 2 · freiwillige Geschichte (öffnet sich bei
 * „ausgewandert“ oder „denke darüber nach“). Nichts wird versendet.
 * ========================================================================= */
const $ = (id) => document.getElementById(id);
const FEHLER = {
  vorname: 'Bitte trag deinen Vornamen ein.',
  nachname: 'Bitte trag deinen Nachnamen ein.',
  email: 'Bitte eine gültige E-Mail-Adresse angeben, an sie geht die Bestätigung.',
  plz: 'Die Postleitzahl besteht aus fünf Ziffern.',
  profil: 'Bitte einen vollständigen Link angeben, zum Beispiel https://instagram.com/name.',
  geschichte: 'Zum Veröffentlichen brauchen wir deine Geschichte, ein Satz genügt.',
  einwilligung: 'Ohne Einwilligung dürfen wir das nicht annehmen.',
};
const form = $('pt-form');
if (form) {
  const f = {
    vorname: $('pt-vorname'), nachname: $('pt-nachname'), email: $('pt-email'), plz: $('pt-plz'),
    land: $('pt-land'), geschichte: $('pt-geschichte'), profil1: $('pt-profil1'), profil2: $('pt-profil2'), profil3: $('pt-profil3'),
    einwilligung: $('pt-einwilligung'), sonstigesMotiv: $('pt-motiv-sonstiges'), sonstiges: $('pt-sonstiges'),
  };
  let versucht = false;
  const beruehrt = new Set();
  const wahl = () => form.querySelector('input[name="auswanderung"]:checked')?.value || 'nein';
  const offen = () => wahl() !== 'nein';
  const veroeff = () => form.querySelector('input[name="veroeff"]:checked')?.value || 'nein';
  const urlOk = (v) => { try { const u = new URL(v.trim()); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; } };

  function pruefen() {
    const e = {};
    if (!f.vorname.value.trim()) e.vorname = FEHLER.vorname;
    if (!f.nachname.value.trim()) e.nachname = FEHLER.nachname;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value)) e.email = FEHLER.email;
    if (!/^\d{5}$/.test(f.plz.value)) e.plz = FEHLER.plz;
    if (offen() && veroeff() !== 'nein' && !f.geschichte.value.trim()) e.geschichte = FEHLER.geschichte;
    if (offen() && veroeff() === 'name') for (const id of ['profil1', 'profil2', 'profil3']) if (f[id].value.trim() && !urlOk(f[id].value)) e[id] = FEHLER.profil;
    if (!f.einwilligung.checked) e.einwilligung = FEHLER.einwilligung;
    return e;
  }

  function fehlerzeile(id) {
    return document.getElementById('pt-' + id + '-fehler');
  }

  function aktualisieren() {
    $('pt-geschichte-box').hidden = !offen();
    $('pt-land-label').textContent = wahl() === 'ja' ? 'Wohin bist du gegangen?' : 'Wohin zieht es dich?';
    $('pt-profile-box').hidden = !(offen() && veroeff() === 'name');
    $('pt-sonstiges-feld').hidden = !f.sonstigesMotiv.checked;

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
    const ef = $('pt-einwilligung-f');
    ef.hidden = !(e.einwilligung && versucht);
    ef.textContent = e.einwilligung || '';

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
  form.addEventListener('change', aktualisieren);
  for (const id of Object.keys(f)) f[id]?.addEventListener('blur', () => {
    beruehrt.add(id);
    aktualisieren();
  });

  /* Absenden (Demo: nichts wird gesendet) */
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    versucht = true;
    aktualisieren();
    const e = pruefen();
    const erster = Object.keys(e)[0];
    if (erster) {
      f[erster]?.focus();
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

  /* „Ergänze deine eigene“ kommt mit ?teilnahme=geschichte */
  if (new URLSearchParams(location.search).get('teilnahme') === 'geschichte') $('pt-aw-ja').checked = true;
  aktualisieren();
}

/* Handy: feste Schaltfläche „Jetzt unterschreiben“, solange das Formular nicht im Bild ist */
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

/* Formularkarte klebt am Rand; ist sie höher als das Fenster, klebt sie unten statt oben (sonst wäre das Ende nicht erreichbar) */
(function klebend() {
  const karte = $('formular');
  if (!karte) return;
  const setzen = () => {
    const vh = window.innerHeight;
    karte.style.top = Math.min(84, vh - karte.offsetHeight - 24) + 'px';
  };
  setzen();
  window.addEventListener('resize', setzen, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(setzen).observe(karte);
})();
