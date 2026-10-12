// Zugriff auf das Haus-Dokument in Foundry (ein Journaleintrag, auf dem alle Spieler Besitzer sind).
// Der gesamte Spielstand liegt als JSON-Text in einem Flag. So kann jeder Spieler ihn ändern,
// auch wenn der Spielleiter nicht online ist.

import { MODUL_ID, STANDARD_KATALOG, KARTE } from "./daten.mjs";
import * as L from "./logik.mjs";

export function holeKatalog() {
  const katalog = foundry.utils.deepClone(STANDARD_KATALOG);
  const roh = game.settings.get(MODUL_ID, "katalogUeberschreibung");
  if (roh?.trim()) {
    try {
      foundry.utils.mergeObject(katalog, JSON.parse(roh));
    } catch (e) {
      console.warn(`${MODUL_ID} | Katalog-Überschreibung ist kein gültiges JSON`, e);
      ui.notifications.warn("Anwesen: Die Katalog-Überschreibung ist kein gültiges JSON und wird ignoriert.");
    }
  }
  return katalog;
}

export function holeZeitfaktor() {
  return Math.max(0.01, Number(game.settings.get(MODUL_ID, "zeitfaktor")) || 1);
}

export function holeHaus() {
  return game.journal.find((j) => j.getFlag(MODUL_ID, "haus"));
}

export function leseZustand(doc) {
  return JSON.parse(doc.getFlag(MODUL_ID, "zustand"));
}

export function schreibeZustand(doc, z) {
  return doc.setFlag(MODUL_ID, "zustand", JSON.stringify(z));
}

export async function erstelleHaus() {
  const z = L.neuerZustand(holeKatalog(), KARTE, Date.now());
  return JournalEntry.create({
    name: "Das Anwesen (Aufbauspiel)",
    ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
    flags: { [MODUL_ID]: { haus: true, zustand: JSON.stringify(z) } }
  });
}

// Berechnete Ansicht für die Anzeige (wird nicht gespeichert)
export function ansicht(doc) {
  const katalog = holeKatalog();
  const zf = holeZeitfaktor();
  const jetzt = Date.now();
  const z = L.abrechnen(leseZustand(doc), katalog, KARTE, jetzt, zf);
  return { z, katalog, zf, jetzt };
}

// Führt eine Aktion auf dem frisch gelesenen Zustand aus und speichert das Ergebnis.
export async function ausfuehren(aktion) {
  const doc = holeHaus();
  if (!doc) {
    ui.notifications.warn("Das Anwesen wurde noch nicht angelegt.");
    return false;
  }
  if (!doc.canUserModify(game.user, "update")) {
    ui.notifications.warn("Du hast keine Berechtigung, das Anwesen zu ändern.");
    return false;
  }
  const katalog = holeKatalog();
  const zf = holeZeitfaktor();
  const jetzt = Date.now();
  const z = L.abrechnen(leseZustand(doc), katalog, KARTE, jetzt, zf);
  const erg = aktion({ z, katalog, karte: KARTE, jetzt, zf, wer: game.user.name });
  if (!erg.ok) {
    ui.notifications.warn(erg.fehler);
    return false;
  }
  await schreibeZustand(doc, z);
  return true;
}
