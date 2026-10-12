import { MODUL_ID } from "./daten.mjs";
import { AnwesenApp } from "./anwesen-app.mjs";
import { holeHaus, erstelleHaus } from "./haus.mjs";

Hooks.once("init", () => {
  game.settings.register(MODUL_ID, "zeitfaktor", {
    name: "Zeitfaktor (zum Testen)",
    hint: "1 = Echtzeit. Bei 60 vergeht eine Spielstunde in einer echten Minute. Nur zum Ausprobieren ändern, danach wieder auf 1 stellen.",
    scope: "world",
    config: true,
    type: Number,
    default: 1
  });
  game.settings.register(MODUL_ID, "katalogUeberschreibung", {
    name: "Katalog überschreiben (JSON)",
    hint: "Optional. Einzelne Werte des Standard-Katalogs ersetzen, zum Beispiel Kosten, Dauern oder Erträge. Aufbau siehe README.",
    scope: "world",
    config: true,
    type: String,
    default: ""
  });

  game.modules.get(MODUL_ID).api = { oeffnen: () => AnwesenApp.oeffnen(), holeHaus };
});

Hooks.once("ready", async () => {
  if (game.users.activeGM?.isSelf && !holeHaus()) await erstelleHaus();
});

Hooks.on("updateJournalEntry", (doc) => {
  if (doc.getFlag(MODUL_ID, "haus")) AnwesenApp.aktualisieren();
});

Hooks.on("getSceneControlButtons", (controls) => {
  const werkzeug = {
    name: "anwesen",
    title: "Das Anwesen",
    icon: "fa-solid fa-house-chimney",
    order: 99,
    visible: true,
    button: true
  };
  if (Array.isArray(controls)) {
    controls.find((c) => c.name === "token")?.tools.push({ ...werkzeug, onClick: () => AnwesenApp.oeffnen() });
  } else if (controls.tokens?.tools) {
    controls.tokens.tools.anwesen = { ...werkzeug, onChange: () => AnwesenApp.oeffnen() };
  }
});
