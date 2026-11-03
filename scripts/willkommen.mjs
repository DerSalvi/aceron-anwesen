// Willkommensfenster: erscheint beim Einloggen und erklärt die neuen Funktionen.
// Jeder Spieler sieht es einmal pro Version (ANLEITUNG_VERSION hochzählen, damit es erneut erscheint).
// Wieder öffnen: game.modules.get("aceron-anwesen").api.anleitung();

import { MODUL_ID } from "./daten.mjs";

const ANLEITUNG_VERSION = 3;

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
    einleitung: "Kaufen, verkaufen und tauschen: Jeder Ort hat eigene Händler mit eigenem Sortiment und eigenen Preisen. Ihr könnt auch zwischen den Sessions einkaufen gehen.",
    punkte: [
      "<strong>Öffnen:</strong> Laden-Symbol in der Seitenleiste direkt unter „Notizbuch“, Tastenkürzel <kbd>Alt</kbd>+<kbd>H</kbd> oder das Laden-Symbol am Token eines Händlers.",
      "<strong>Nur vor Ort:</strong> Ihr seht die Händler des Ortes, in dem eure Figur gerade ist. Der Ort wechselt automatisch, wenn ihr eine Szene betretet. Zwischen den Sessions gilt der zuletzt besuchte Ort.",
      "<strong>Kaufen:</strong> Karte anklicken für alle Details, dann in den Warenkorb. Dasselbe Ding kostet nicht überall gleich viel, und nicht jeder Händler hat alles.",
      "<strong>Verkaufen:</strong> Reiter „Verkaufen“. Händler zahlen nur einen Teil des Werts, kaufen nur, was zu ihrem Laden passt, und nur so lange ihre Kasse reicht.",
      "<strong>Feilschen:</strong> Einmal pro Händler und Tag mit Überzeugen oder Täuschen. Gelingt es, wird es billiger; geht es schief, wird es teurer.",
      "<strong>Ruf:</strong> Jeder Händler merkt sich eure Figur. Wer oft und ehrlich handelt, wird Stammkunde und zahlt weniger. Wer unangenehm auffällt, bekommt Hausverbot.",
      "<strong>Unbekannte Wirkung:</strong> Bei manchen Gegenständen ist die Wirkung unleserlich. Ein Händler kann sie gegen eine Gebühr begutachten, oder ihr findet es auf andere Weise heraus.",
      "<strong>Bestellungen:</strong> Besondere Waren gibt es nur auf Bestellung. Ihr zahlt sofort und holt die Ware nach der Lieferzeit beim selben Händler ab.",
      "<strong>Scheine und Gebühren:</strong> Manche Orte verlangen einen gültigen Schein, etwa den Passierschein in Midwall. Scheine laufen ab.",
      "<strong>Stehlen:</strong> Möglich, aber riskant (Fingerfertigkeit gegen die Wahrnehmung des Händlers). Wer erwischt wird, verliert Ruf und fliegt raus. Geklaute Ware nimmt nur ein Hehler, und den muss man erst finden.",
      "<strong>Mit Mitspielern tauschen:</strong> Reiter „Tauschen“, Mitspieler im selben Ort auswählen, Gegenstände und Geld anbieten. Beide klicken „Bereit“ und dann „Bestätigen“. Jede Änderung setzt „Bereit“ zurück."
    ]
  },
  {
    icon: "📖",
    titel: "Spielerjournal",
    einleitung: "Euer Wissen über Aceron wächst mit jeder Session. Was ihr notiert, landet nach der Session in der Wissensdatenbank und kommt aufbereitet zurück.",
    punkte: [
      "<strong>Notizen schreiben:</strong> Knopf „Aceron-Notizen“ im Notizbuch oder <kbd>Alt</kbd>+<kbd>N</kbd>. Thema wählen (Ort, NSC, Fraktion, Quest …), Stichpunkt schreiben, mit <kbd>Strg</kbd>+<kbd>Enter</kbd> speichern.",
      "<strong>Wer liest mit:</strong> Für jede Notiz legt ihr fest, wer sie sieht: alle, nur ihr oder ausgewählte Mitspieler. Was eure Figur heimlich erfährt, bleibt so auch geheim.",
      "<strong>Von anderen:</strong> Im Reiter „Von anderen“ seht ihr, was Mitspieler mit euch geteilt haben.",
      "<strong>Nachrichten der Spielleitung:</strong> Schickt euch die Spielleitung eine Nachricht, erscheint oben der Hinweis „Du hast eine Nachricht von der Spielleitung“. Ein Klick darauf öffnet sie. Mit „Ins Journal speichern“ wählt ihr, wohin sie kommt: als Aceron-Notiz (kommt in die Wissensdatenbank), ins eigene Journal „Briefe & Botschaften“ oder in ein Journal eurer Wahl, auch mehreres zugleich. „Später“ und „Verwerfen“ schließen sie nur.",
      "<strong>Posteingang:</strong> Alle Nachrichten liegen im Notizfenster im Reiter „Posteingang“. Von dort könnt ihr sie jederzeit erneut lesen und speichern.",
      "<strong>Gemeinsames Wissen:</strong> Im Notizbuch unter „Aceron · Gemeinsames Wissen“ steht alles, was die ganze Gruppe weiß: Orte, Personen, Fraktionen, Quests. Es wird nach jeder Session ergänzt.",
      "<strong>Privates Wissen:</strong> Unter „Aceron · Privates Wissen“ hat jede Figur ein eigenes Journal mit dem, was nur sie weiß. Das sieht außer euch nur die Spielleitung.",
      "<strong>Auf der Karte:</strong> In den Ortsszenen führt die Nadel in der Mitte direkt zum Eintrag des Ortes."
    ]
  }
];

function baueInhalt() {
  const abschnitte = ABSCHNITTE.filter((a) => a.punkte.length)
    .map((a) => `
      <section class="aceron-willkommen-abschnitt">
        <h3><span class="aceron-willkommen-icon">${a.icon}</span>${a.titel}</h3>
        ${a.einleitung ? `<p>${a.einleitung}</p>` : ""}
        <ul>${a.punkte.map((p) => `<li>${p}</li>`).join("")}</ul>
      </section>`)
    .join("");
  return `
    <div class="aceron-willkommen">
      <p class="aceron-willkommen-intro">Willkommen zurück in Aceron! Es gibt Neuerungen, die ihr kennen solltet:</p>
      ${abschnitte}
      <p class="hinweis">Diese Anleitung könnt ihr jederzeit mit dem Chat-Befehl <code>/anleitung</code> wieder öffnen.</p>
    </div>`;
}

export async function zeigeAnleitung() {
  const { DialogV2 } = foundry.applications.api;
  await DialogV2.prompt({
    window: { title: "Neu in Aceron", icon: "fa-solid fa-scroll" },
    classes: ["aceron-willkommen-fenster"],
    position: { width: 620 },
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

// Chat-Befehl /anleitung. Foundry v14 hat dafür eine Befehlsliste (ChatLog.CHAT_COMMANDS);
// das Chatfeld liefert dort HTML ("<p>/anleitung</p>"), deshalb nie den Rohtext vergleichen.
const BEFEHL = /^\/anleitung\s*$/i;
const nurText = (html) => String(html ?? "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

Hooks.once("init", () => {
  const ChatLog = foundry.applications?.sidebar?.tabs?.ChatLog;
  if (ChatLog?.CHAT_COMMANDS) {
    ChatLog.CHAT_COMMANDS.anleitung = { rgx: BEFEHL, fn: () => { zeigeAnleitung(); return false; } };
  }
});

// Rückfall für ältere Foundry-Versionen ohne CHAT_COMMANDS
Hooks.on("chatMessage", (_log, text) => {
  if (foundry.applications?.sidebar?.tabs?.ChatLog?.CHAT_COMMANDS?.anleitung) return;
  if (!BEFEHL.test(nurText(text))) return;
  zeigeAnleitung();
  return false;
});
