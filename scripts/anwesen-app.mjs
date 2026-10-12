import { MODUL_ID, RESSOURCEN, KARTE } from "./daten.mjs";
import * as L from "./logik.mjs";
import { holeHaus, erstelleHaus, ansicht, ausfuehren } from "./haus.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

const zahl0 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const zahl1 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

const res = (id) => RESSOURCEN[id] ?? { name: id, icon: "❔" };

function dauerText(std) {
  const min = Math.max(1, Math.round(std * 60));
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} Min.`;
  if (m === 0) return `${h} Std.`;
  return `${h} Std. ${m} Min.`;
}

function kostenListe(kosten, vorrat) {
  return Object.entries(kosten).map(([k, v]) => ({
    icon: res(k).icon, name: res(k).name, menge: zahl0.format(v), ok: (vorrat[k] ?? 0) >= v
  }));
}

function ertragText(prod, faktor) {
  const teile = Object.entries(prod ?? {}).map(([k, v]) => `+${zahl1.format(v * faktor)} ${res(k).icon}`);
  return teile.length ? `${teile.join(" ")} pro Std.` : "";
}

function extraText(s) {
  return [s.lager ? `Lagerplatz +${zahl0.format(s.lager)}` : null, s.schlaf ? `Schlafplätze +${s.schlaf}` : null]
    .filter(Boolean).join(" · ");
}

const ZUSTAND_TEXT = { verfallen: "Verfallen", leer: "Leer", genutzt: "In Nutzung", baustelle: "Baustelle" };

export class AnwesenApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static _instanz = null;

  static DEFAULT_OPTIONS = {
    id: "aceron-anwesen",
    classes: ["aceron-anwesen"],
    position: { width: 1040, height: 760 },
    window: { title: "Das Anwesen", icon: "fa-solid fa-house-chimney", resizable: true },
    actions: {
      hausAnlegen: AnwesenApp.hausAnlegen,
      waehleEtage: AnwesenApp.waehleEtage,
      waehleRaum: AnwesenApp.waehleRaum,
      instandsetzen: AnwesenApp.instandsetzen,
      bauen: AnwesenApp.bauen,
      ausbauen: AnwesenApp.ausbauen,
      abbrechen: AnwesenApp.abbrechen,
      einsammeln: AnwesenApp.einsammeln,
      alleEinsammeln: AnwesenApp.alleEinsammeln,
      aufgeben: AnwesenApp.aufgeben,
      umbenennen: AnwesenApp.umbenennen,
      anwerben: AnwesenApp.anwerben,
      einlagern: AnwesenApp.einlagern,
      gmAnpassen: AnwesenApp.gmAnpassen,
      gmFertig: AnwesenApp.gmFertig,
      gmZuruecksetzen: AnwesenApp.gmZuruecksetzen
    }
  };

  static PARTS = {
    haupt: { template: `modules/${MODUL_ID}/templates/anwesen.hbs` }
  };

  static oeffnen() {
    this._instanz ??= new AnwesenApp();
    this._instanz.render({ force: true });
  }

  static aktualisieren() {
    if (this._instanz?.rendered) this._instanz.render();
  }

  etage = "eg";
  raumId = null;

  async _prepareContext() {
    const basis = { istGM: game.user.isGM };
    const doc = holeHaus();
    if (!doc) return { ...basis, keinHaus: true };

    const { z, katalog, zf, jetzt } = ansicht(doc);
    const kap = L.lagerKapazitaet(z, katalog);

    const vorrat = Object.keys(RESSOURCEN).map((id) => ({
      id, ...res(id),
      menge: zahl0.format(Math.floor(z.vorrat[id] ?? 0)),
      max: zahl0.format(kap),
      voll: (z.vorrat[id] ?? 0) >= kap
    }));

    const arbeiter = {
      gesamt: z.arbeiter,
      frei: L.freieArbeiter(z),
      max: L.maxArbeiter(z, katalog),
      kosten: zahl0.format(L.arbeiterKosten(z, katalog))
    };

    const etagenDef = KARTE.etagen.find((e) => e.id === this.etage) ?? KARTE.etagen[0];
    const raeume = KARTE.raeume.filter((d) => d.etage === etagenDef.id).map((def) => this.#raumAnsicht(def, z, katalog, jetzt));
    const deko = etagenDef.deko.map((d) => ({ ...d, tx: d.x + d.w / 2, ty: d.y + d.h / 2 + 5 }));

    let tafel = null;
    if (this.raumId && z.raeume[this.raumId]) tafel = this.#tafel(this.raumId, z, katalog, zf, jetzt);

    const protokoll = z.protokoll.slice(0, 14).map((p) => ({
      zeit: new Date(p.t).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
      wer: p.wer, text: p.text
    }));

    return {
      ...basis,
      vorrat, arbeiter, protokoll, tafel,
      etagen: KARTE.etagen.map((e) => ({ id: e.id, name: e.name, aktiv: e.id === etagenDef.id })),
      karte: { viewBox: etagenDef.viewBox, raeume, deko }
    };
  }

  #raumAnsicht(def, z, katalog, jetzt) {
    const r = z.raeume[def.id];
    const n = r.nutzung ? katalog.nutzungen[r.nutzung] : null;
    const baustelle = !!r.auftrag;
    const klasse = baustelle ? "baustelle" : r.zustand;
    const cx = def.x + def.w / 2;
    const iconY = def.y + def.h / 2 - 14;

    let icon = "🏚️";
    let status = "Verfallen";
    let prozent = 0;
    if (baustelle) {
      icon = "🚧";
      prozent = Math.min(1, (jetzt - r.auftrag.start) / Math.max(1, r.auftrag.ende - r.auftrag.start));
      status = `Noch ${dauerText(Math.max(0, r.auftrag.ende - jetzt) / 3600000)}`;
    } else if (r.zustand === "leer") {
      icon = "🧹";
      status = "Leer, bereit zum Ausbau";
    } else if (r.zustand === "genutzt") {
      icon = n?.icon ?? "🏠";
      status = `${n?.name ?? "Nutzung"} · Stufe ${r.stufe}`;
    }

    const maxStufen = n?.stufen?.length ?? 0;
    const pips = [];
    if (r.zustand === "genutzt") {
      for (let i = 0; i < maxStufen; i++) pips.push({ x: def.x + 16 + i * 13, y: def.y + 16, an: i < r.stufe });
    }

    return {
      id: def.id, name: r.name,
      x: def.x, y: def.y, w: def.w, h: def.h,
      cx, iconY, nameY: iconY + 22, statusY: iconY + 40,
      klasse,
      verfall: klasse === "verfallen",
      baustelle,
      farbe: n?.farbe ?? "#4a4236",
      icon, status, pips,
      balken: baustelle,
      balkenX: def.x + 14, balkenY: def.y + def.h - 12, balkenBreite: Math.max(0, (def.w - 28) * prozent), balkenMax: def.w - 28,
      puffer: Object.values(r.puffer).some((v) => v >= 1),
      pufferX: def.x + def.w - 22, pufferY: def.y + 24,
      gewaehlt: def.id === this.raumId
    };
  }

  #tafel(id, z, katalog, zf, jetzt) {
    const def = KARTE.raeume.find((d) => d.id === id);
    const r = z.raeume[id];
    const g = katalog.groessen[def.groesse];
    const f = g.faktor;
    const n = r.nutzung ? katalog.nutzungen[r.nutzung] : null;
    const etageName = KARTE.etagen.find((e) => e.id === def.etage)?.name ?? "";
    const baustelle = !!r.auftrag;

    const tafel = {
      name: r.name,
      groesseName: g.name,
      ortText: `${etageName}, ${def.art === "aussen" ? "draußen" : "innen"}`,
      zustandText: ZUSTAND_TEXT[baustelle ? "baustelle" : r.zustand],
      istBaustelle: baustelle,
      istVerfallen: !baustelle && r.zustand === "verfallen",
      istLeer: !baustelle && r.zustand === "leer",
      istGenutzt: !baustelle && r.zustand === "genutzt"
    };

    if (baustelle) {
      const a = r.auftrag;
      const proz = Math.min(1, (jetzt - a.start) / Math.max(1, a.ende - a.start));
      const was = a.typ === "instandsetzen" ? "Instandsetzung"
        : `${katalog.nutzungen[a.nutzung]?.name ?? ""} (Stufe ${a.stufe})`;
      tafel.auftrag = {
        was,
        rest: dauerText(Math.max(0, a.ende - jetzt) / 3600000),
        prozent: Math.round(proz * 100),
        arbeiter: a.arbeiter
      };
    }

    if (tafel.istVerfallen) {
      const kosten = L.skaliere(katalog.instandsetzung.kosten, f);
      const grund = L.pruefen(z, kosten, g.instandArbeiter);
      tafel.instand = {
        kosten: kostenListe(kosten, z.vorrat),
        dauerText: dauerText((katalog.instandsetzung.dauer * f) / zf),
        arbeiter: g.instandArbeiter,
        moeglich: !grund, grund: grund ?? ""
      };
    }

    if (tafel.istLeer) {
      tafel.nutzungen = Object.entries(katalog.nutzungen)
        .filter(([, nu]) => nu.art === def.art)
        .map(([nid, nu]) => {
          const s = nu.stufen[0];
          const kosten = L.skaliere(s.kosten, f);
          const grund = L.pruefen(z, kosten, s.arbeiter);
          return {
            id: nid, name: nu.name, icon: nu.icon, beschreibung: nu.beschreibung, farbe: nu.farbe,
            kosten: kostenListe(kosten, z.vorrat),
            dauerText: dauerText((s.dauer * f) / zf),
            arbeiter: s.arbeiter,
            ertrag: ertragText(s.produktion, f * zf), extra: extraText(s),
            moeglich: !grund, grund: grund ?? ""
          };
        });
    }

    if (tafel.istGenutzt && n) {
      const s = L.nutzungsStufe(katalog, r);
      const puffer = Object.entries(r.puffer)
        .filter(([, v]) => v >= 1)
        .map(([k, v]) => ({ icon: res(k).icon, name: res(k).name, menge: zahl0.format(Math.floor(v)) }));
      tafel.aktuell = {
        name: n.name, icon: n.icon, beschreibung: n.beschreibung,
        stufe: r.stufe, max: n.stufen.length,
        ertrag: ertragText(s?.produktion, f * zf), extra: s ? extraText(s) : "",
        puffer, hatPuffer: puffer.length > 0,
        pufferStunden: katalog.einstellungen.pufferStunden
      };
      const naechste = n.stufen[r.stufe];
      if (naechste) {
        const kosten = L.skaliere(naechste.kosten, f);
        const grund = L.pruefen(z, kosten, naechste.arbeiter);
        tafel.ausbau = {
          stufe: r.stufe + 1,
          kosten: kostenListe(kosten, z.vorrat),
          dauerText: dauerText((naechste.dauer * f) / zf),
          arbeiter: naechste.arbeiter,
          ertrag: ertragText(naechste.produktion, f * zf), extra: extraText(naechste),
          moeglich: !grund, grund: grund ?? ""
        };
      }
    }
    return tafel;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this._timer ??= setInterval(() => {
      if (this.rendered) this.render();
    }, 60000);
  }

  async close(options) {
    clearInterval(this._timer);
    this._timer = null;
    return super.close(options);
  }

  // ---- Aktionen ----

  static async hausAnlegen() {
    if (!game.user.isGM) return;
    if (!holeHaus()) await erstelleHaus();
    this.render();
  }

  static waehleEtage(event, target) {
    this.etage = target.dataset.etage;
    this.render();
  }

  static waehleRaum(event, target) {
    this.raumId = target.dataset.raumId;
    this.render();
  }

  static async instandsetzen() {
    const id = this.raumId;
    await ausfuehren((c) => L.instandsetzen(c, id));
  }

  static async bauen(event, target) {
    const id = this.raumId;
    const nutzung = target.dataset.nutzung;
    await ausfuehren((c) => L.nutzungBauen(c, id, nutzung));
  }

  static async ausbauen() {
    const id = this.raumId;
    await ausfuehren((c) => L.ausbauen(c, id));
  }

  static async abbrechen() {
    const id = this.raumId;
    const ja = await DialogV2.confirm({
      window: { title: "Auftrag abbrechen" },
      content: "<p>Der Auftrag wird abgebrochen. Nur ein Teil der Kosten kommt zurück. Fortfahren?</p>",
      rejectClose: false
    });
    if (ja) await ausfuehren((c) => L.abbrechen(c, id));
  }

  static async einsammeln() {
    const id = this.raumId;
    await ausfuehren((c) => L.einsammeln(c, id));
  }

  static async alleEinsammeln() {
    await ausfuehren((c) => L.alleEinsammeln(c));
  }

  static async aufgeben() {
    const id = this.raumId;
    const ja = await DialogV2.confirm({
      window: { title: "Nutzung aufgeben" },
      content: "<p>Die Nutzung samt Ausbaustufe geht verloren, es gibt keine Rückerstattung. Der Raum ist danach leer und kann neu genutzt werden. Fortfahren?</p>",
      rejectClose: false
    });
    if (ja) await ausfuehren((c) => L.nutzungAufgeben(c, id));
  }

  static async umbenennen() {
    const id = this.raumId;
    const doc = holeHaus();
    if (!doc || !id) return;
    const { z } = ansicht(doc);
    const werte = await DialogV2.prompt({
      window: { title: "Raum umbenennen" },
      content: `<div class="form-group"><label>Name</label><div class="form-fields"><input type="text" name="name" value="${foundry.utils.escapeHTML(z.raeume[id].name)}" maxlength="40" autofocus></div></div>`,
      ok: { label: "Speichern", callback: (ev, btn) => new foundry.applications.ux.FormDataExtended(btn.form).object },
      rejectClose: false
    });
    if (werte) await ausfuehren((c) => L.umbenennen(c, id, werte.name));
  }

  static async anwerben() {
    await ausfuehren((c) => L.anwerben(c));
  }

  static async einlagern() {
    const felder = Object.entries(RESSOURCEN).map(([id, r]) =>
      `<div class="form-group"><label>${r.icon} ${r.name}</label><div class="form-fields"><input type="number" name="${id}" value="0" min="0" step="1"></div></div>`
    ).join("");
    const werte = await DialogV2.prompt({
      window: { title: "Material einlagern" },
      content: `<p>Was habt ihr in den Sessions besorgt? Alles Eingelagerte steht dem ganzen Haus zur Verfügung.</p>${felder}`,
      ok: { label: "Einlagern", callback: (ev, btn) => new foundry.applications.ux.FormDataExtended(btn.form).object },
      rejectClose: false
    });
    if (werte) await ausfuehren((c) => L.einlagern(c, werte));
  }

  static async gmAnpassen() {
    if (!game.user.isGM) return;
    const doc = holeHaus();
    if (!doc) return;
    const { z } = ansicht(doc);
    const felder = Object.entries(RESSOURCEN).map(([id, r]) =>
      `<div class="form-group"><label>${r.icon} ${r.name}</label><div class="form-fields"><input type="number" name="${id}" value="${Math.floor(z.vorrat[id] ?? 0)}" min="0" step="1"></div></div>`
    ).join("");
    const werte = await DialogV2.prompt({
      window: { title: "Vorräte setzen (Spielleiter)" },
      content: felder,
      ok: { label: "Setzen", callback: (ev, btn) => new foundry.applications.ux.FormDataExtended(btn.form).object },
      rejectClose: false
    });
    if (werte) await ausfuehren((c) => L.gmSetzeVorrat(c, werte));
  }

  static async gmFertig() {
    if (!game.user.isGM) return;
    await ausfuehren((c) => L.gmFertig(c));
  }

  static async gmZuruecksetzen() {
    if (!game.user.isGM) return;
    const ja = await DialogV2.confirm({
      window: { title: "Anwesen zurücksetzen" },
      content: "<p>Der gesamte Fortschritt (Räume, Vorräte, Arbeiter, Protokoll) wird gelöscht und das Haus beginnt wieder verfallen. Wirklich zurücksetzen?</p>",
      rejectClose: false
    });
    if (!ja) return;
    const doc = holeHaus();
    if (doc) await doc.delete();
    await erstelleHaus();
    this.raumId = null;
    this.render();
  }
}
