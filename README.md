# Aceron – Das Anwesen (Foundry-Modul)

Langzeit-Aufbauspiel für das Haus der Gruppe. Die Spieler setzen Räume instand, richten sie für einen Zweck ein, bauen sie aus, werben Arbeiter an und sammeln passive Erträge. Alles läuft in Echtzeit, auch zwischen den Sessions und ohne dass der Spielleiter online sein muss.

Version 0.1.0, getestet gegen Foundry VTT v13.

## Installation

1. Foundry öffnen, im Startmenü unter *Konfiguration* den Pfad der Benutzerdaten ansehen (oder im Windows-Explorer `%localappdata%\FoundryVTT\Data` öffnen).
2. Den Ordner `aceron-anwesen` in `Data\modules\` kopieren, sodass dort `Data\modules\aceron-anwesen\module.json` liegt.
3. Foundry neu starten, die Welt öffnen, unter *Einstellungen → Module verwalten* "Aceron – Das Anwesen" aktivieren.
4. Beim ersten Start legt der Spielleiter-Client automatisch das Haus an (ein Journaleintrag "Das Anwesen (Aufbauspiel)").

Geöffnet wird das Anwesen über das Haus-Symbol in der linken Werkzeugleiste (bei den Token-Werkzeugen) oder per Makro:

```js
game.modules.get("aceron-anwesen").api.oeffnen();
```

## Spielprinzip

- **Räume:** 12 Räume in 3 Etagen (Erdgeschoss mit Hintergarten, Dachgeschoss, Keller). Alle starten verfallen.
- **Instandsetzen → Nutzung wählen → Ausbauen:** Jeder Schritt kostet Ressourcen, bindet Arbeiter und braucht echte Zeit.
- **Arbeiter:** Werden mit Gold angeworben. Ein Auftrag bindet seine Arbeiter bis zur Fertigstellung. Die Zahl der Arbeiter wird durch Schlafplätze begrenzt (Schlafsaal ausbauen).
- **Passive Erträge:** Genutzte Räume füllen einen Puffer, der sich 24 Stunden lang füllt. Danach muss eingesammelt werden. Das Lager hat eine Obergrenze pro Ressource (Lagerraum erhöht sie).
- **Material aus den Sessions:** Über "Einlagern" tragen die Spieler mitgebrachtes Material ein.
- **Protokoll:** Zeigt, wer wann was getan hat.
- **Spielleiter-Werkzeuge:** Vorräte setzen, alle Aufträge sofort beenden, Haus zurücksetzen.

## Einstellungen

- **Zeitfaktor:** 1 = Echtzeit. Zum Testen z. B. 60 setzen (eine Spielstunde pro echter Minute), danach wieder auf 1 stellen.
- **Katalog überschreiben (JSON):** Ersetzt einzelne Werte des Standard-Katalogs aus `scripts/daten.mjs`. Beispiel:

```json
{
  "einstellungen": { "pufferStunden": 48, "startVorrat": { "gold": 1000 } },
  "nutzungen": {
    "schaenke": {
      "stufen": [
        { "kosten": { "gold": 100 }, "dauer": 4, "arbeiter": 2, "produktion": { "gold": 6 } }
      ]
    }
  }
}
```

Hinweis: Listen (`stufen`) werden komplett ersetzt, nicht zusammengeführt. Neue Nutzungen lassen sich im selben Format unter `nutzungen` ergänzen (`art` ist `innen` oder `aussen`).

## Technik

- Der Spielstand liegt als JSON in einem Flag am Journaleintrag. Alle Spieler sind dort Besitzer, damit sie auch ohne Spielleiter speichern können.
- Es gibt keinen laufenden Prozess. Fertige Aufträge und Erträge werden beim Öffnen aus Zeitstempeln berechnet.
- Grenze: Wenn zwei Spieler im selben Moment eine Aktion speichern, gewinnt die letzte. Bei einer Gruppe dieser Größe ist das kaum relevant, sollte aber bekannt sein.
- Die Räume werden als Vektorgrafik gezeichnet. Eigene Bilder pro Raum und Zustand lassen sich später ergänzen.

## Dateien

- `scripts/daten.mjs` – Ressourcen, Gebäude, Kosten, Grundriss
- `scripts/logik.mjs` – Spielregeln, ohne Foundry-Abhängigkeit
- `scripts/haus.mjs` – Speichern und Laden
- `scripts/anwesen-app.mjs` – Fenster und Aktionen
- `templates/anwesen.hbs`, `styles/anwesen.css` – Darstellung
