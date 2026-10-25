# Deutschland flieht – aktueller VPS-Entwurf

Vollständiger statischer Stand von https://derreichenbaecher.de/deutschland-flieht-entwurf/, am 25. Oktober 2026 direkt vom VPS übernommen. Die Startseite auf dem VPS wurde zuletzt am 24. Oktober 2026 geändert.

## Enthalten

Alle 33 Dateien aus dem Website-Verzeichnis: Startseite, Karten, Daten, Animationen, Bilder, Schriften sowie die Unterseiten `petition/`, `entwicklungen/`, `quellen/`, `impressum/` und `datenschutz/`. Die Website-Dateien wurden bytegenau übernommen; ihre SHA-256-Prüfsummen stehen in `VPS-SNAPSHOT.sha256`.

## Lokal ansehen

Im übergeordneten Ordner `webseiten/` starten:

```sh
python -m http.server 8080
```

Dann http://localhost:8080/deutschland-flieht-entwurf/ öffnen. Ein Build-Schritt ist nicht erforderlich. Enthalten ist der auf dem VPS ausgelieferte HTML-, CSS- und JavaScript-Stand.

## Prüfsummen vergleichen

Im Ordner dieser Website unter Linux oder macOS:

```sh
sha256sum -c VPS-SNAPSHOT.sha256
```

## Umfang

Dieser Snapshot enthält die ausgelieferten Website-Dateien. Serverkonfiguration, Anmeldung, TLS-Zertifikate, Zugangsdaten und private Daten liegen außerhalb dieses Snapshots. Ein produktiver Petitionsversand oder eine Datenbank wird durch das Klonen nicht eingerichtet; die Petition entspricht dem übernommenen Entwurfsstand.

Die separate Branch `vps-entwurf-2026-10-24` ergänzt diesen Ordner und erhält die bestehenden Projekte im Repository.
