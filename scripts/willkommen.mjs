// Willkommensfenster: erscheint beim Einloggen und erklärt die neuen Funktionen.
// Jeder Spieler sieht es einmal pro Version (ANLEITUNG_VERSION hochzählen, damit es erneut erscheint).
// Wieder öffnen: game.modules.get("aceron-anwesen").api.anleitung();

import { MODUL_ID } from "./daten.mjs";

const ANLEITUNG_VERSION = 1;

// Abschnitte der Anleitung. Ein Abschnitt ohne Punkte (leere Liste) wird nicht angezeigt.
const ABSCHNITTE = [
  {
    icon: "🏠",
    titel: "Das Anwesen",
    einleitung: "Das geschenkte Haus gehört euch allen. Ihr baut es gemeinsam aus, und es arbeitet für euch, auch zwischen den Sessions.",
    punkte: [
      "<strong>Öffnen:</strong> Haus-Symbol in der linken Werkzeugleiste (bei den Token-Werkzeugen).",
      "<strong>12 Räume auf 3 Etagen:</strong> Erdgeschoss mit Hintergarten, Dachgeschoss und Keller. Alle starten verfallen.",
      "<strong>Ablauf je Raum:</strong> Instandsetzen, dann eine Nutzung wählen (z. B. Küche, Schänke, Schmiede), dann in Stufen ausbauen. Jeder Schritt kostet Ressourcen, bindet Arbeiter und braucht echte Zeit.",
      "<strong>Arbeiter:</strong> Werden mit Gold angeworben und sind während eines Auftrags gebunden. Wie viele ihr haben könnt, hängt von den Schlafplätzen ab (Schlafsaal ausbauen).",
      "<strong>Erträge einsammeln:</strong> Genutzte Räume füllen einen Puffer, der sich 24 Stunden lang füllt. Danach stockt er, also regelmäßig einsammeln. Das Lager hat pro Ressource eine Obergrenze (Lagerraum erhöht sie).",
      "<strong>Einlagern:</strong> Material, das ihr aus Abenteuern mitbringt, tragt ihr hier ins Lager ein.",
      "<strong>Protokoll:</strong> Zeigt, wer wann was getan hat. Alle dürfen Aufträge vergeben, ihr solltet euch also absprechen."
    ]
  },
  {
    icon: "🛒",
    titel: "Händler",
    einleitung: "",
    punkte: [] // wird ergänzt, sobald die Funktion beschrieben ist
  },
  {
    icon: "📖",
    titel: "Spielerjournal",
    einleitung: "",
    punkte: [] // wird ergänzt, sobald die Funktion beschrieben ist
  }
];

function baueInhalt() {
  const abschnitte = ABSCHNITTE.filter((a) => a.punkte.length)
    .map((a) => `
      <section class="aceron-willkommen-abschnitt">
        <h3>${a.icon} ${a.titel}</h3>
        ${a.einleitung ? `<p>${a.einleitung}</p>` : ""}
        <ul>${a.punkte.map((p) => `<li>${p}</li>`).join("")}</ul>
      </section>`)
    .join("");
  return `
    <div class="aceron-willkommen">
      <p>Willkommen zurück in Aceron! Es gibt Neuerungen, die ihr kennen solltet:</p>
      ${abschnitte}
      <p class="hinweis">Diese Anleitung könnt ihr jederzeit über das Makro oder den Chat-Befehl <code>/anleitung</code> erneut öffnen.</p>
    </div>`;
}

export async function zeigeAnleitung() {
  const { DialogV2 } = foundry.applications.api;
  await DialogV2.prompt({
    window: { title: "Neu in Aceron", icon: "fa-solid fa-scroll" },
    position: { width: 560 },
    content: baueInhalt(),
    ok: { label: "Verstanden", icon: "fa-solid fa-check" },
    rejectClose: false
  });
  await game.settings.set(MODUL_ID, "anleitungGesehen", ANLEITUNG_VERSION);
}

Hooks.once("init", () => {
  game.settings.register(MODUL_ID, "anleitungGesehen", {
    scope: "client",
    config: false,
    type: Number,
    default: 0
  });
});

Hooks.once("ready", () => {
  const api = game.modules.get(MODUL_ID).api;
  if (api) api.anleitung = zeigeAnleitung;

  // Der Spielleiter muss die Anleitung nicht sehen, kann sie aber per API öffnen.
  if (game.user.isGM) return;
  if (game.settings.get(MODUL_ID, "anleitungGesehen") >= ANLEITUNG_VERSION) return;
  zeigeAnleitung();
});

Hooks.on("chatMessage", (_log, text) => {
  if (text.trim() !== "/anleitung") return;
  zeigeAnleitung();
  return false;
});
