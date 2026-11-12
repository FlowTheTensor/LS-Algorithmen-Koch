// =============================================================================
//  ui.js – HTML-Bedienelemente über der Zeichenfläche
// =============================================================================
//  Alle Positionen werden im logischen 1600×900-Raster angegeben und beim
//  Ändern der Fenstergröße mitskaliert (siehe layoutUi).
//  Die Auswahlfelder für die Lücken liegen direkt über den Zellen des
//  Struktogramms und wandern mit, wenn sich das Struktogramm verändert.
// =============================================================================

const ui = {};
const uiPositionen = [];
let huelle;

function platziere(el, x, y, w, ...klassen) {
  el.addClass("ui");
  for (const k of klassen) {
    el.addClass(k);
  }
  el.parent(huelle);
  const pos = { el, x, y, w };
  uiPositionen.push(pos);
  el._pos = pos;
  return el;
}

function layoutUi() {
  huelle.style("width", width + "px");
  huelle.style("font-size", 15 * S + "px");
  for (const p of uiPositionen) {
    setzeEl(p);
  }
}

function setzeEl(p) {
  const y = p.y >= 56 && !p.el.hasClass("beispiel") ? p.y + LEISTE : p.y;
  p.el.position(p.x * S, y * S);
  if (p.w) {
    p.el.style("width", p.w * S + "px");
  }
  if (p.h) {
    p.el.style("height", p.h * S + "px");
  }
}

// Position ändern (nur wenn sich etwas ändert)
function setzePos(el, x, y, w, h) {
  const p = el._pos;
  if (Math.abs(p.x - x) > 0.5 || Math.abs(p.y - y) > 0.5 || Math.abs((p.w || 0) - w) > 0.5 || Math.abs((p.h || 0) - (h || 0)) > 0.5) {
    p.x = x;
    p.y = y;
    p.w = w;
    p.h = h;
    setzeEl(p);
  }
}

function zeige(el, sichtbar) {
  const soll = sichtbar ? "" : "none";
  if (el.elt.style.display !== soll) {
    el.elt.style.display = soll;
  }
}

function erstelleUi() {
  huelle = createDiv();
  huelle.addClass("huelle");

  // --- Kopfzeile -------------------------------------------------------------
  ui.logo = platziere(createImg("assets/logo-jps.png", "Logo der Jakob-Preh-Schule"), 14, 3, 122, "logo");
  ui.modusUeben = platziere(createButton("Kochen · üben"), 1182, 12, 190, "kopf");
  ui.modusUeben.mousePressed(() => {
    modusWechseln("ueben");
    ui.modusUeben.elt.blur();
  });
  ui.modusPruef = platziere(createButton("Freigabeprüfung"), 1380, 12, 196, "kopf");
  ui.modusPruef.mousePressed(() => {
    modusWechseln("pruefung");
    ui.modusPruef.elt.blur();
  });

  // --- Stufen-Leiste -----------------------------------------------------------
  ui.stufen = [];
  let bx = 104;
  REZEPTE.forEach((rz, i) => {
    const text = `${i + 1} · ${rz.name}`;
    const b = 48 + text.length * 8.4;
    const knopf = platziere(createButton(text), bx, 63, b, "beispiel");
    knopf.attribute("title", `Freigabestufe ${i + 1}: ${rz.rang}`);
    knopf.mousePressed(() => {
      stufeWechseln(i);
      knopf.elt.blur();
    });
    ui.stufen.push(knopf);
    bx += b + 10;
  });

  // --- Ansicht des Rezepts -----------------------------------------------------
  ui.ansichten = {};
  const ansichten = [
    ["struktogramm", "Struktogramm", 116],
    ["pap", "PAP", 60],
    ["cpp", "C++", 58],
    ["scl", "SCL", 58],
  ];
  let ax = 660 + 600 - 12 - ansichten.reduce((s, a) => s + a[2] + 6, -6);
  for (const [id, text, b] of ansichten) {
    const knopf = platziere(createButton(text), ax, 89, b, "klein", "kopf");
    knopf.mousePressed(() => {
      ansicht = id;
      knopf.elt.blur();
    });
    ui.ansichten[id] = knopf;
    ax += b + 6;
  }

  // --- Lücken: Auswahlfelder im Struktogramm -----------------------------------
  ui.luecken = [];
  for (let i = 0; i < 6; i++) {
    const sel = platziere(createSelect(), 0, 0, 100, "luecke");
    sel.changed(() => {
      if (sel._id) {
        lueckeGewaehlt(sel._id, parseInt(sel.value(), 10));
      }
      sel.elt.blur();
    });
    ui.luecken.push(sel);
  }

  // --- Üben: Ablauf ------------------------------------------------------------
  ui.testfall = platziere(createSelect(), 1294, 410, 264);
  ui.testfall.changed(() => {
    testfallWechseln(parseInt(ui.testfall.value(), 10));
    ui.testfall.elt.blur();
  });
  ui.schritt = platziere(createButton("Schritt ▶ (→)"), 1294, 452, 128, "dunkel");
  ui.schritt.mousePressed(() => {
    if (lauf && lauf.fertig) {
      neuerLauf();
    }
    schritt();
    ui.schritt.elt.blur();
  });
  ui.auto = platziere(createButton("▶ Probekochen"), 1430, 452, 128, "primaer");
  ui.auto.mousePressed(() => {
    autoUmschalten();
    ui.auto.elt.blur();
  });
  ui.neu = platziere(createButton("↺ Neustart (R)"), 1294, 494, 128);
  ui.neu.mousePressed(() => {
    neuerLauf();
    ui.neu.elt.blur();
  });
  ui.tempo = platziere(createSelect(), 1430, 496, 128);
  for (const t of ["langsam", "mittel", "schnell"]) {
    ui.tempo.option("Tempo: " + t, t);
  }
  ui.tempo.selected(tempo);
  ui.tempo.changed(() => {
    tempo = ui.tempo.value();
    ui.tempo.elt.blur();
  });
  ui.alleTests = platziere(createButton("✓ Alle Testfälle prüfen"), 1294, 536, 264, "primaer");
  ui.alleTests.mousePressed(() => {
    alleTestfaellePruefen();
    ui.alleTests.elt.blur();
  });

  // --- Prüfung -------------------------------------------------------------------
  ui.antwort = platziere(createInput(""), 1294, 318, 150, "feld");
  ui.antwort.attribute("placeholder", "Antwort");
  ui.antwort.attribute("autocomplete", "off");
  ui.antwort.elt.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      pruefAktion();
    }
  });
  ui.pruefen = platziere(createButton("Prüfen ✓"), 1452, 316, 106, "primaer");
  ui.pruefen.mousePressed(() => {
    pruefAktion();
    ui.pruefen.elt.blur();
  });
  ui.aufloesung = platziere(createButton("▶ Auflösung ansehen"), 1294, 450, 264, "dunkel");
  ui.aufloesung.mousePressed(() => {
    zeigeAufloesung();
    ui.aufloesung.elt.blur();
  });
  ui.naechste = platziere(createButton("Nächste Aufgabe ▶ (Enter)"), 1294, 492, 264, "primaer");
  ui.naechste.mousePressed(() => {
    naechsteAufgabe();
    ui.antwort.elt.focus();
    ui.naechste.elt.blur();
  });
  ui.andere = platziere(createButton("Andere Aufgabe"), 1356, 604, 140, "klein");
  ui.andere.attribute("title", "Neue Aufgabe – die Serie beginnt dabei von vorn");
  ui.andere.mousePressed(() => {
    serie = 0;
    naechsteAufgabe();
    ui.andere.elt.blur();
  });

  // --- Freigaben -----------------------------------------------------------------
  ui.reset = platziere(createButton("zurücksetzen"), 1462, 665, 104, "klein");
  ui.reset.attribute("title", "Alle Prüfsiegel löschen (z. B. für die nächste Klasse)");
  ui.reset.mousePressed(() => {
    if (window.confirm("Alle Prüfsiegel löschen?")) {
      freigabenZuruecksetzen();
    }
    ui.reset.elt.blur();
  });
}

function pruefAktion() {
  if (rueckmeldung) {
    naechsteAufgabe();
    ui.antwort.elt.focus();
    return;
  }
  pruefen(ui.antwort.value());
}

function leereEingaben() {
  if (ui.antwort) {
    ui.antwort.value("");
  }
}

// Auswahllisten für Testfälle und Lücken neu befüllen (bei Stufenwechsel)
let befuelltFuer = -1;
function befuelleAuswahl() {
  if (befuelltFuer === stufe) {
    return;
  }
  befuelltFuer = stufe;
  const rz = REZEPTE[stufe];
  ui.testfall.elt.innerHTML = "";
  rz.testfaelle.forEach((tf, i) => ui.testfall.option(tf.name, String(i)));
  ui.testfall.selected(String(testfall));
  ui.luecken.forEach((sel, i) => {
    sel.elt.innerHTML = "";
    const l = rz.luecken[i];
    sel._id = l ? l.id : null;
    if (l) {
      sel.option(`${l.label}: wählen …`, "-1");
      l.optionen.forEach((o, j) => sel.option(o, String(j)));
      sel.attribute("title", l.label);
    }
  });
}

// --- kleine Helfer, damit das DOM nur bei echten Änderungen angefasst wird ---
function beschrifte(el, html) {
  if (el._html !== html) {
    el.html(html);
    el._html = html;
  }
}

function sperre(el, gesperrt) {
  if (el.elt.disabled !== gesperrt) {
    el.elt.disabled = gesperrt;
  }
}

function klasse(el, name, an) {
  if (an) {
    el.addClass(name);
  } else {
    el.removeClass(name);
  }
}

function aktualisiereUi() {
  befuelleAuswahl();
  const ueben = modus === "ueben";

  klasse(ui.modusUeben, "aktiv", ueben);
  klasse(ui.modusPruef, "aktiv", !ueben);
  ui.stufen.forEach((k, i) => {
    klasse(k, "aktiv", i === stufe);
    beschrifte(k, `${i + 1} · ${REZEPTE[i].name}${freigaben[i] ? " ✓" : ""}`);
  });
  for (const id of Object.keys(ui.ansichten)) {
    klasse(ui.ansichten[id], "aktiv", ansicht === id);
  }

  // Lücken-Auswahl nur im Übungsmodus und in der Struktogramm-Ansicht
  ui.luecken.forEach((sel) => {
    const r = sel._id ? lueckenRechtecke[sel._id] : null;
    const sichtbar = ueben && ansicht === "struktogramm" && !!r;
    zeige(sel, sichtbar);
    if (sichtbar) {
      setzePos(sel, r.x, r.y, r.w, r.h);
      const soll = String(wahl[sel._id]);
      if (sel.value() !== soll) {
        sel.selected(soll);
      }
      klasse(sel, "offen", wahl[sel._id] < 0);
      sperre(sel, laufAuto);
    }
  });

  // Üben
  for (const el of [ui.testfall, ui.schritt, ui.auto, ui.neu, ui.tempo, ui.alleTests]) {
    zeige(el, ueben);
  }
  if (ueben) {
    if (ui.testfall.value() !== String(testfall)) {
      ui.testfall.selected(String(testfall));
    }
    beschrifte(ui.auto, laufAuto ? "■ Anhalten" : "▶ Probekochen");
    klasse(ui.auto, "primaer", !laufAuto);
    klasse(ui.auto, "dunkel", laufAuto);
    sperre(ui.schritt, laufAuto);
    beschrifte(ui.schritt, lauf && lauf.fertig ? "↺ Nochmal" : "Schritt ▶ (→)");
  }

  // Prüfung
  zeige(ui.antwort, !ueben);
  zeige(ui.pruefen, !ueben);
  zeige(ui.aufloesung, !ueben && !!rueckmeldung);
  zeige(ui.naechste, !ueben && !!rueckmeldung);
  zeige(ui.andere, !ueben);
  if (!ueben) {
    sperre(ui.antwort, !!rueckmeldung);
    sperre(ui.pruefen, !!rueckmeldung);
    sperre(ui.aufloesung, laufAuto);
  }
}
