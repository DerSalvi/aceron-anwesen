// Alle Spielwerte und der Grundriss des Hauses.
// Gebäude, Kosten und Dauern lassen sich hier ändern – oder ohne Code über die
// Moduleinstellung "Katalog überschreiben" (siehe README).

export const MODUL_ID = "aceron-anwesen";

export const RESSOURCEN = {
  gold: { name: "Gold", icon: "🪙" },
  holz: { name: "Holz", icon: "🪵" },
  stein: { name: "Stein", icon: "🪨" },
  eisen: { name: "Eisen", icon: "⛓️" },
  stoff: { name: "Stoff", icon: "🧵" },
  nahrung: { name: "Nahrung", icon: "🍖" }
};

// Kurzschreibweise für eine Ausbaustufe: Kosten, Dauer in Stunden, benötigte Arbeiter
const S = (kosten, dauer, arbeiter, extra = {}) => ({ kosten, dauer, arbeiter, ...extra });

export const STANDARD_KATALOG = {
  einstellungen: {
    pufferStunden: 24, // so lange füllt sich der Ertrag eines Raums, bis er eingesammelt werden muss
    lagerGrundkapazitaet: 500, // Lagerplatz pro Ressource ohne Lagerraum
    arbeiterStart: 2,
    arbeiterGrundplaetze: 2, // Schlafplätze ohne Schlafsaal
    arbeiterKostenBasis: 40, // Gold für den ersten neuen Arbeiter
    arbeiterKostenSteigerung: 20, // Aufschlag pro weiterem Arbeiter
    abbruchRueckerstattung: 0.5,
    startVorrat: { gold: 250, holz: 80, stein: 60, eisen: 10, stoff: 20, nahrung: 20 }
  },

  // faktor skaliert Kosten, Dauer und Ertrag. instandArbeiter = Arbeiter für die Instandsetzung.
  groessen: {
    klein: { name: "Klein", faktor: 1, instandArbeiter: 2 },
    mittel: { name: "Mittel", faktor: 1.5, instandArbeiter: 2 },
    gross: { name: "Groß", faktor: 2.5, instandArbeiter: 3 }
  },

  instandsetzung: { kosten: { gold: 80, holz: 25, stein: 15 }, dauer: 4 },

  nutzungen: {
    schlafsaal: {
      name: "Schlafsaal", icon: "🛏️", farbe: "#5f7aa8", art: "innen",
      beschreibung: "Betten für Arbeiter. Mehr Schlafplätze erlauben mehr Arbeiter.",
      stufen: [
        S({ gold: 120, holz: 40, stoff: 20 }, 6, 2, { schlaf: 2 }),
        S({ gold: 260, holz: 90, stoff: 50 }, 12, 2, { schlaf: 4 }),
        S({ gold: 520, holz: 160, stoff: 110 }, 24, 3, { schlaf: 7 })
      ]
    },
    lager: {
      name: "Lagerraum", icon: "📦", farbe: "#8a7350", art: "innen",
      beschreibung: "Erhöht den Lagerplatz für alle Ressourcen.",
      stufen: [
        S({ gold: 100, holz: 60, stein: 20 }, 6, 2, { lager: 500 }),
        S({ gold: 220, holz: 140, stein: 60, eisen: 10 }, 12, 2, { lager: 1500 }),
        S({ gold: 450, holz: 260, stein: 140, eisen: 40 }, 24, 3, { lager: 3500 })
      ]
    },
    kueche: {
      name: "Küche", icon: "🍲", farbe: "#b5683c", art: "innen",
      beschreibung: "Erzeugt Nahrung.",
      stufen: [
        S({ gold: 90, holz: 30, stein: 30, eisen: 5 }, 6, 2, { produktion: { nahrung: 2 } }),
        S({ gold: 200, holz: 70, stein: 70, eisen: 15 }, 12, 2, { produktion: { nahrung: 4 } }),
        S({ gold: 420, holz: 130, stein: 140, eisen: 35 }, 24, 3, { produktion: { nahrung: 7 } })
      ]
    },
    werkstatt: {
      name: "Werkstatt", icon: "🔨", farbe: "#a07a3a", art: "innen",
      beschreibung: "Handwerkliche Aufträge bringen stetig Gold.",
      stufen: [
        S({ gold: 110, holz: 70, eisen: 10 }, 8, 2, { produktion: { gold: 3 } }),
        S({ gold: 240, holz: 150, eisen: 30 }, 16, 2, { produktion: { gold: 5 } }),
        S({ gold: 480, holz: 280, eisen: 70 }, 30, 3, { produktion: { gold: 9 } })
      ]
    },
    schmiede: {
      name: "Schmiede", icon: "⚒️", farbe: "#7d7d86", art: "innen",
      beschreibung: "Erzeugt Eisen und etwas Gold.",
      stufen: [
        S({ gold: 150, stein: 80, eisen: 20 }, 8, 2, { produktion: { eisen: 1, gold: 2 } }),
        S({ gold: 320, stein: 160, eisen: 60 }, 16, 3, { produktion: { eisen: 2, gold: 4 } }),
        S({ gold: 650, stein: 300, eisen: 130 }, 30, 3, { produktion: { eisen: 4, gold: 7 } })
      ]
    },
    schaenke: {
      name: "Schänke", icon: "🍺", farbe: "#c28b2c", art: "innen",
      beschreibung: "Gäste lassen regelmäßig Gold da.",
      stufen: [
        S({ gold: 160, holz: 80, stoff: 30, nahrung: 30 }, 8, 2, { produktion: { gold: 4 } }),
        S({ gold: 340, holz: 160, stoff: 70, nahrung: 60 }, 16, 3, { produktion: { gold: 7 } }),
        S({ gold: 700, holz: 300, stoff: 140, nahrung: 120 }, 30, 3, { produktion: { gold: 12 } })
      ]
    },
    bibliothek: {
      name: "Bibliothek", icon: "📚", farbe: "#7b5ea7", art: "innen",
      beschreibung: "Abschriften und Auskünfte bringen Gold.",
      stufen: [
        S({ gold: 130, holz: 70, stoff: 40 }, 8, 2, { produktion: { gold: 2 } }),
        S({ gold: 290, holz: 150, stoff: 90 }, 16, 2, { produktion: { gold: 4 } }),
        S({ gold: 580, holz: 280, stoff: 180 }, 30, 3, { produktion: { gold: 7 } })
      ]
    },
    labor: {
      name: "Alchemielabor", icon: "🧪", farbe: "#4a9a7a", art: "innen",
      beschreibung: "Tränke und Tinkturen für den Verkauf.",
      stufen: [
        S({ gold: 180, stein: 60, eisen: 25 }, 10, 2, { produktion: { gold: 3 } }),
        S({ gold: 380, stein: 120, eisen: 60 }, 20, 3, { produktion: { gold: 6 } }),
        S({ gold: 760, stein: 240, eisen: 120 }, 36, 3, { produktion: { gold: 11 } })
      ]
    },
    heilstube: {
      name: "Heilstube", icon: "🩹", farbe: "#c05a5a", art: "innen",
      beschreibung: "Patienten zahlen für Behandlung.",
      stufen: [
        S({ gold: 140, stoff: 60, stein: 40 }, 8, 2, { produktion: { gold: 3 } }),
        S({ gold: 300, stoff: 120, stein: 90 }, 16, 2, { produktion: { gold: 6 } }),
        S({ gold: 600, stoff: 220, stein: 180 }, 30, 3, { produktion: { gold: 10 } })
      ]
    },
    gemuesegarten: {
      name: "Gemüsegarten", icon: "🥕", farbe: "#5f9a47", art: "aussen",
      beschreibung: "Erzeugt Nahrung.",
      stufen: [
        S({ gold: 60, holz: 30, nahrung: 5 }, 4, 2, { produktion: { nahrung: 3 } }),
        S({ gold: 130, holz: 70, stein: 20 }, 10, 2, { produktion: { nahrung: 6 } }),
        S({ gold: 260, holz: 140, stein: 50 }, 20, 3, { produktion: { nahrung: 10 } })
      ]
    },
    kraeutergarten: {
      name: "Kräutergarten", icon: "🌿", farbe: "#3f8a5a", art: "aussen",
      beschreibung: "Heil- und Gewürzkräuter bringen Gold.",
      stufen: [
        S({ gold: 70, holz: 25 }, 4, 2, { produktion: { gold: 2 } }),
        S({ gold: 150, holz: 60, stein: 15 }, 10, 2, { produktion: { gold: 4 } }),
        S({ gold: 300, holz: 120, stein: 40 }, 20, 2, { produktion: { gold: 7 } })
      ]
    },
    holzplatz: {
      name: "Holzplatz", icon: "🪓", farbe: "#8a6a3a", art: "aussen",
      beschreibung: "Erzeugt Holz.",
      stufen: [
        S({ gold: 80, eisen: 5 }, 4, 2, { produktion: { holz: 2 } }),
        S({ gold: 170, eisen: 15, stein: 20 }, 10, 2, { produktion: { holz: 4 } }),
        S({ gold: 340, eisen: 35, stein: 50 }, 20, 3, { produktion: { holz: 7 } })
      ]
    }
  }
};

// Grundriss. Koordinaten gelten im SVG (viewBox 600 x 440), Eingang liegt unten.
export const KARTE = {
  etagen: [
    {
      id: "eg", name: "Erdgeschoss & Garten", viewBox: "0 0 600 440",
      deko: [
        { typ: "kamin", x: 270, y: 108, w: 60, h: 16, text: "🔥" },
        { typ: "tuer", x: 362, y: 99, w: 34, h: 12, text: "🚪" },
        { typ: "tuer", x: 238, y: 424, w: 52, h: 12, text: "🚪" }
      ]
    },
    { id: "dg", name: "Dachgeschoss", viewBox: "0 0 600 440", deko: [] },
    { id: "keller", name: "Keller", viewBox: "0 0 600 440", deko: [] }
  ],
  raeume: [
    { id: "garten", name: "Hintergarten", etage: "eg", art: "aussen", groesse: "gross", x: 10, y: 8, w: 580, h: 88 },
    { id: "haupthalle", name: "Haupthalle", etage: "eg", art: "innen", groesse: "gross", x: 190, y: 105, w: 220, h: 325 },
    { id: "links_hinten", name: "Seitenraum links hinten", etage: "eg", art: "innen", groesse: "mittel", x: 10, y: 105, w: 175, h: 155 },
    { id: "links_vorn", name: "Seitenraum links vorne", etage: "eg", art: "innen", groesse: "mittel", x: 10, y: 265, w: 175, h: 165 },
    { id: "rechts_hinten", name: "Seitenraum rechts hinten", etage: "eg", art: "innen", groesse: "klein", x: 415, y: 105, w: 175, h: 105 },
    { id: "rechts_vorn", name: "Seitenraum rechts vorne", etage: "eg", art: "innen", groesse: "klein", x: 415, y: 215, w: 175, h: 110 },
    { id: "eingangsraum", name: "Raum am Eingang", etage: "eg", art: "innen", groesse: "klein", x: 415, y: 330, w: 175, h: 100 },

    { id: "bar", name: "Dachgeschoss-Bar", etage: "dg", art: "innen", groesse: "gross", x: 10, y: 10, w: 380, h: 420 },
    { id: "dachkammer", name: "Dachkammer", etage: "dg", art: "innen", groesse: "mittel", x: 400, y: 10, w: 190, h: 200 },

    { id: "op_saal", name: "Alter OP-Saal", etage: "keller", art: "innen", groesse: "gross", x: 10, y: 10, w: 370, h: 420 },
    { id: "keller_1", name: "Kellerraum 1", etage: "keller", art: "innen", groesse: "klein", x: 390, y: 10, w: 200, h: 205 },
    { id: "keller_2", name: "Kellerraum 2", etage: "keller", art: "innen", groesse: "klein", x: 390, y: 225, w: 200, h: 205 }
  ]
};
