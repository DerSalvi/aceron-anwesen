// Spiellogik ohne Foundry-Abhängigkeiten: reine Funktionen auf einem Zustandsobjekt.
// Der Zustand wird nur bei Aktionen gespeichert. Alles andere (fertige Aufträge,
// angesammelte Erträge) wird beim Öffnen aus den Zeitstempeln berechnet.

import { RESSOURCEN } from "./daten.mjs";

const STUNDE = 3600000;

const fehler = (text) => ({ ok: false, fehler: text });
const ok = (text = "") => ({ ok: true, text });
const resName = (id) => RESSOURCEN[id]?.name ?? id;
const resIcon = (id) => RESSOURCEN[id]?.icon ?? "❔";

export function raumDef(karte, id) {
  return karte.raeume.find((r) => r.id === id);
}

export function skaliere(kosten, faktor) {
  const aus = {};
  for (const [k, v] of Object.entries(kosten ?? {})) aus[k] = Math.ceil(v * faktor);
  return aus;
}

export function beschreibe(mengen) {
  return Object.entries(mengen)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${resIcon(k)} ${v}`)
    .join(", ");
}

function neuerRaum(def, jetzt) {
  return { name: def.name, nutzung: null, stufe: 0, zustand: "verfallen", produktionSeit: jetzt, puffer: {}, auftrag: null };
}

export function neuerZustand(katalog, karte, jetzt) {
  const vorrat = {};
  for (const id of Object.keys(RESSOURCEN)) vorrat[id] = 0;
  Object.assign(vorrat, katalog.einstellungen.startVorrat);
  const raeume = {};
  for (const def of karte.raeume) raeume[def.id] = neuerRaum(def, jetzt);
  return { version: 1, gegruendet: jetzt, vorrat, arbeiter: katalog.einstellungen.arbeiterStart, raeume, protokoll: [] };
}

export function protokollieren(z, wer, text, t) {
  z.protokoll.push({ t, wer, text });
  z.protokoll.sort((a, b) => b.t - a.t);
  z.protokoll.length = Math.min(z.protokoll.length, 40);
}

export function nutzungsStufe(katalog, raum) {
  return katalog.nutzungen[raum.nutzung]?.stufen?.[raum.stufe - 1] ?? null;
}

// Ertrag pro Stunde (Spielstunden) eines Raums
export function ertrag(katalog, karte, id, raum) {
  if (raum.zustand !== "genutzt") return {};
  const s = nutzungsStufe(katalog, raum);
  const def = raumDef(karte, id);
  if (!s?.produktion || !def) return {};
  const f = katalog.groessen[def.groesse].faktor;
  return Object.fromEntries(Object.entries(s.produktion).map(([k, v]) => [k, v * f]));
}

export function lagerKapazitaet(z, katalog) {
  let kap = katalog.einstellungen.lagerGrundkapazitaet;
  for (const raum of Object.values(z.raeume)) {
    if (raum.zustand === "genutzt") kap += nutzungsStufe(katalog, raum)?.lager ?? 0;
  }
  return kap;
}

export function maxArbeiter(z, katalog) {
  let n = katalog.einstellungen.arbeiterGrundplaetze;
  for (const raum of Object.values(z.raeume)) {
    if (raum.zustand === "genutzt") n += nutzungsStufe(katalog, raum)?.schlaf ?? 0;
  }
  return n;
}

export function gebundeneArbeiter(z) {
  return Object.values(z.raeume).reduce((s, r) => s + (r.auftrag?.arbeiter ?? 0), 0);
}

export function freieArbeiter(z) {
  return z.arbeiter - gebundeneArbeiter(z);
}

export function arbeiterKosten(z, katalog) {
  const e = katalog.einstellungen;
  return e.arbeiterKostenBasis + e.arbeiterKostenSteigerung * Math.max(0, z.arbeiter - e.arbeiterStart);
}

function fertigstellen(z, katalog, raum, a) {
  if (a.typ === "instandsetzen") {
    raum.zustand = "leer";
    protokollieren(z, "Haus", `„${raum.name}“ ist instand gesetzt.`, a.ende);
  } else {
    raum.nutzung = a.nutzung;
    raum.stufe = a.stufe;
    raum.zustand = "genutzt";
    const n = katalog.nutzungen[a.nutzung]?.name ?? a.nutzung;
    protokollieren(z, "Haus", `„${raum.name}“: ${n} (Stufe ${a.stufe}) ist fertig.`, a.ende);
  }
}

// Rechnet den Zustand bis "jetzt" fort. zf = Zeitfaktor (1 = Echtzeit).
export function abrechnen(z, katalog, karte, jetzt, zf) {
  for (const def of karte.raeume) {
    if (!z.raeume[def.id]) z.raeume[def.id] = neuerRaum(def, jetzt);
  }
  const maxStd = katalog.einstellungen.pufferStunden;
  for (const [id, raum] of Object.entries(z.raeume)) {
    if (!raumDef(karte, id)) continue;
    const aufladen = (bis) => {
      bis = Math.max(bis, raum.produktionSeit);
      const std = ((bis - raum.produktionSeit) / STUNDE) * zf;
      if (std > 0) {
        for (const [res, w] of Object.entries(ertrag(katalog, karte, id, raum))) {
          raum.puffer[res] = Math.min(w * maxStd, (raum.puffer[res] ?? 0) + w * std);
        }
      }
      raum.produktionSeit = bis;
    };
    const a = raum.auftrag;
    if (a && a.ende <= jetzt) {
      aufladen(a.ende);
      fertigstellen(z, katalog, raum, a);
      raum.auftrag = null;
    }
    aufladen(jetzt);
  }
  return z;
}

export function pruefen(z, kosten, arbeiter) {
  for (const [k, v] of Object.entries(kosten)) {
    if ((z.vorrat[k] ?? 0) < v) return `Zu wenig ${resName(k)}`;
  }
  if (freieArbeiter(z) < arbeiter) return `Zu wenige freie Arbeiter (${arbeiter} nötig)`;
  return null;
}

function auftragStarten(c, id, auftrag, kosten, dauerStd, arbeiter, logText) {
  const raum = c.z.raeume[id];
  if (!raum) return fehler("Unbekannter Raum.");
  if (raum.auftrag) return fehler("Hier läuft bereits ein Auftrag.");
  const grund = pruefen(c.z, kosten, arbeiter);
  if (grund) return fehler(grund);
  for (const [k, v] of Object.entries(kosten)) c.z.vorrat[k] -= v;
  raum.auftrag = { ...auftrag, start: c.jetzt, ende: c.jetzt + (dauerStd * STUNDE) / c.zf, arbeiter, kosten };
  protokollieren(c.z, c.wer, logText, c.jetzt);
  return ok();
}

export function instandsetzen(c, id) {
  const raum = c.z.raeume[id];
  const def = raumDef(c.karte, id);
  if (!raum || !def) return fehler("Unbekannter Raum.");
  if (raum.zustand !== "verfallen") return fehler("Dieser Raum ist nicht verfallen.");
  const g = c.katalog.groessen[def.groesse];
  const kosten = skaliere(c.katalog.instandsetzung.kosten, g.faktor);
  return auftragStarten(c, id, { typ: "instandsetzen" }, kosten, c.katalog.instandsetzung.dauer * g.faktor, g.instandArbeiter,
    `Instandsetzung von „${raum.name}“ in Auftrag gegeben.`);
}

export function nutzungBauen(c, id, nutzungId) {
  const raum = c.z.raeume[id];
  const def = raumDef(c.karte, id);
  const n = c.katalog.nutzungen[nutzungId];
  if (!raum || !def || !n) return fehler("Unbekannter Raum oder unbekannte Nutzung.");
  if (raum.zustand !== "leer") return fehler("Der Raum muss leer und instand gesetzt sein.");
  if (n.art !== def.art) return fehler(def.art === "aussen" ? "Das passt nicht nach draußen." : "Das passt nicht in einen Innenraum.");
  const f = c.katalog.groessen[def.groesse].faktor;
  const s = n.stufen[0];
  return auftragStarten(c, id, { typ: "nutzung", nutzung: nutzungId, stufe: 1 }, skaliere(s.kosten, f), s.dauer * f, s.arbeiter,
    `${n.name} in „${raum.name}“ in Auftrag gegeben.`);
}

export function ausbauen(c, id) {
  const raum = c.z.raeume[id];
  const def = raumDef(c.karte, id);
  if (!raum || !def) return fehler("Unbekannter Raum.");
  if (raum.zustand !== "genutzt") return fehler("Hier gibt es nichts auszubauen.");
  const n = c.katalog.nutzungen[raum.nutzung];
  const s = n?.stufen?.[raum.stufe];
  if (!s) return fehler("Die höchste Stufe ist erreicht.");
  const f = c.katalog.groessen[def.groesse].faktor;
  return auftragStarten(c, id, { typ: "ausbau", nutzung: raum.nutzung, stufe: raum.stufe + 1 }, skaliere(s.kosten, f), s.dauer * f, s.arbeiter,
    `${n.name} in „${raum.name}“ wird auf Stufe ${raum.stufe + 1} ausgebaut.`);
}

export function abbrechen(c, id) {
  const raum = c.z.raeume[id];
  if (!raum?.auftrag) return fehler("Hier läuft kein Auftrag.");
  const anteil = c.katalog.einstellungen.abbruchRueckerstattung;
  const zurueck = {};
  for (const [k, v] of Object.entries(raum.auftrag.kosten)) {
    zurueck[k] = Math.floor(v * anteil);
    c.z.vorrat[k] = (c.z.vorrat[k] ?? 0) + zurueck[k];
  }
  raum.auftrag = null;
  protokollieren(c.z, c.wer, `Auftrag in „${raum.name}“ abgebrochen. Zurück: ${beschreibe(zurueck) || "nichts"}.`, c.jetzt);
  return ok();
}

export function nutzungAufgeben(c, id) {
  const raum = c.z.raeume[id];
  if (!raum || raum.zustand !== "genutzt") return fehler("Hier gibt es keine Nutzung.");
  if (raum.auftrag) return fehler("Es läuft noch ein Auftrag.");
  const n = c.katalog.nutzungen[raum.nutzung]?.name ?? raum.nutzung;
  raum.nutzung = null;
  raum.stufe = 0;
  raum.zustand = "leer";
  raum.puffer = {};
  protokollieren(c.z, c.wer, `${n} in „${raum.name}“ aufgegeben. Der Raum ist wieder leer.`, c.jetzt);
  return ok();
}

function einsammelnRaum(c, raum, erhalten) {
  const kap = lagerKapazitaet(c.z, c.katalog);
  for (const [res, menge] of Object.entries(raum.puffer)) {
    const frei = Math.max(0, kap - (c.z.vorrat[res] ?? 0));
    const nimm = Math.min(Math.floor(menge), Math.floor(frei));
    if (nimm > 0) {
      c.z.vorrat[res] = (c.z.vorrat[res] ?? 0) + nimm;
      raum.puffer[res] = menge - nimm;
      erhalten[res] = (erhalten[res] ?? 0) + nimm;
    }
  }
}

export function einsammeln(c, id) {
  const raum = c.z.raeume[id];
  if (!raum) return fehler("Unbekannter Raum.");
  const erhalten = {};
  einsammelnRaum(c, raum, erhalten);
  if (!Object.keys(erhalten).length) return fehler("Es gibt nichts einzusammeln, oder das Lager ist voll.");
  protokollieren(c.z, c.wer, `Eingesammelt in „${raum.name}“: ${beschreibe(erhalten)}`, c.jetzt);
  return ok();
}

export function alleEinsammeln(c) {
  const erhalten = {};
  for (const raum of Object.values(c.z.raeume)) einsammelnRaum(c, raum, erhalten);
  if (!Object.keys(erhalten).length) return fehler("Es gibt nichts einzusammeln, oder das Lager ist voll.");
  protokollieren(c.z, c.wer, `Alles eingesammelt: ${beschreibe(erhalten)}`, c.jetzt);
  return ok();
}

export function anwerben(c) {
  if (c.z.arbeiter >= maxArbeiter(c.z, c.katalog)) return fehler("Es gibt keine freien Schlafplätze mehr. Baut einen Schlafsaal aus.");
  const preis = arbeiterKosten(c.z, c.katalog);
  if ((c.z.vorrat.gold ?? 0) < preis) return fehler("Zu wenig Gold");
  c.z.vorrat.gold -= preis;
  c.z.arbeiter += 1;
  protokollieren(c.z, c.wer, `Neuer Arbeiter angeworben (${preis} 🪙). Jetzt ${c.z.arbeiter}.`, c.jetzt);
  return ok();
}

export function einlagern(c, mengen) {
  const kap = lagerKapazitaet(c.z, c.katalog);
  const gelagert = {};
  for (const [res, n] of Object.entries(mengen)) {
    const wunsch = Math.floor(Number(n) || 0);
    if (wunsch <= 0 || !(res in c.z.vorrat)) continue;
    const nimm = Math.min(wunsch, Math.max(0, kap - c.z.vorrat[res]));
    if (nimm > 0) {
      c.z.vorrat[res] += nimm;
      gelagert[res] = nimm;
    }
  }
  if (!Object.keys(gelagert).length) return fehler("Nichts eingelagert (Menge 0 oder Lager voll).");
  protokollieren(c.z, c.wer, `Eingelagert: ${beschreibe(gelagert)}`, c.jetzt);
  return ok();
}

export function umbenennen(c, id, name) {
  const raum = c.z.raeume[id];
  const neu = String(name ?? "").trim().slice(0, 40);
  if (!raum || !neu) return fehler("Bitte einen Namen eingeben.");
  raum.name = neu;
  return ok();
}

// Spielleiter-Werkzeuge

export function gmSetzeVorrat(c, mengen) {
  for (const [res, n] of Object.entries(mengen)) {
    if (res in c.z.vorrat) c.z.vorrat[res] = Math.max(0, Math.floor(Number(n) || 0));
  }
  protokollieren(c.z, c.wer, "Vorräte vom Spielleiter angepasst.", c.jetzt);
  return ok();
}

export function gmFertig(c) {
  let n = 0;
  for (const raum of Object.values(c.z.raeume)) {
    if (raum.auftrag) {
      raum.auftrag.ende = c.jetzt;
      n++;
    }
  }
  if (!n) return fehler("Es laufen keine Aufträge.");
  abrechnen(c.z, c.katalog, c.karte, c.jetzt, c.zf);
  return ok();
}
