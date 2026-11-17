// =============================================================================
//  Algorithmen-Koch · Struktogramme und Programmablaufpläne
//  Ein Küchenroboter kocht nach Rezepten, die als Struktogramm (DIN 66261)
//  geschrieben sind. Lücken im Rezept füllen, probekochen, mit allen
//  Testfällen prüfen – und in der Freigabeprüfung den Schreibtischtest
//  bestehen. Sechs Freigabestufen von der Küchenhilfe bis zum Küchenchef:
//    1 Sequenz · 2 Verzweigung · 3 Zählschleife · 4 Bedingte Schleife ·
//    5 Listen · 6 Funktionen
// =============================================================================
//
//  Dateien
//    interpreter.js  führt Struktogramme Schritt für Schritt aus, erzeugt C++/SCL
//    rezepte.js      die sechs Rezepte mit Lücken, Testfällen und Prüfungsaufgaben
//    ui.js           Knöpfe, Auswahllisten, Eingabefelder
//    sketch.js       Ablauf, Zeichnen (Küche, Struktogramm, PAP, Code, Tabelle)
//
//  Bedienung
//    →        nächster Schritt
//    Leertaste probekochen (automatisch) / anhalten
//    R        Neustart
//
//  Läuft mit p5.js 1.x und 2.x.
//  Hinweis: Alle Schleifen haben geschweifte Klammern – der p5-Web-Editor
//  kommt mit Schleifen ohne Klammern nicht zurecht.
// =============================================================================

// -----------------------------------------------------------------------------
// Layout (logisches Raster 1600 × 900, wird auf die Fenstergröße skaliert)
// -----------------------------------------------------------------------------
const W = 1600;
const LEISTE = 48;
const H_INHALT = 900;
const H = H_INHALT + LEISTE;
let S = 1;

const SCHRIFTEN = {
  titel: ["Quicksand", "Arial"],
  text: ["Inter", "Arial"],
  mono: ["JetBrains Mono", "monospace"],
};
const schriftGeladen = { titel: false, text: false, mono: false };
let TITEL = "Arial";
let SCHRIFT = "Arial";
let MONO = "monospace";

function ladeSchriften() {
  if (!document.fonts || !document.fonts.load) {
    return;
  }
  for (const art of Object.keys(SCHRIFTEN)) {
    const name = SCHRIFTEN[art][0];
    Promise.all([document.fonts.load(`400 16px "${name}"`), document.fonts.load(`700 16px "${name}"`)])
      .then((ergebnis) => {
        if (ergebnis[0].length > 0 && ergebnis[1].length > 0) {
          schriftGeladen[art] = true;
          TITEL = schriftGeladen.titel ? SCHRIFTEN.titel[0] : SCHRIFTEN.titel[1];
          SCHRIFT = schriftGeladen.text ? SCHRIFTEN.text[0] : SCHRIFTEN.text[1];
          MONO = schriftGeladen.mono ? SCHRIFTEN.mono[0] : SCHRIFTEN.mono[1];
        }
      })
      .catch(() => {});
  }
}

const P_KUECHE = { x: 24, y: 84, w: 620, h: 400, titel: "Küche" };
const P_TABELLE = { x: 24, y: 500, w: 620, h: 384, titel: "Variablentabelle · Schreibtischtest" };
const P_REZEPT = { x: 660, y: 84, w: 600, h: 800, titel: "Rezept" };
const P_AUFTRAG = { x: 1276, y: 84, w: 300, h: 560, titel: "Auftrag" };
const P_FREIGABE = { x: 1276, y: 660, w: 300, h: 224, titel: "Freigaben" };
const KOPF_H = 34;

const FARBE_HELL = {
  papier: [251, 249, 245],
  flaeche: [255, 255, 255],
  flaeche2: [243, 238, 230],
  linie: [231, 225, 214],
  text: [29, 29, 28],
  grau: [91, 88, 82],
  blass: [125, 122, 114],
  akzent: [200, 30, 58],
  akzentHell: [228, 0, 43],
  senf: [184, 122, 28],
  gruen: [52, 128, 84],
  blau: [44, 92, 150],
  stahl: [176, 182, 188],
  holz: [196, 160, 118],
  // Flächen und Schrift auf Flächen (für das dunkle Schema nötig)
  textInvers: [255, 255, 255],
  dunkelFlaeche: [29, 29, 28],
  schatten: [29, 29, 28],
  akzentFlaeche: [253, 240, 242],
  akzentLinie: [240, 200, 208],
  rotFlaeche: [251, 225, 230],
  gruenFlaeche: [228, 241, 233],
};

const FARBE_DUNKEL = {
  papier: [22, 22, 21],
  flaeche: [32, 31, 30],
  flaeche2: [44, 42, 40],
  linie: [62, 59, 55],
  text: [236, 232, 224],
  grau: [184, 178, 168],
  blass: [140, 135, 126],
  akzent: [236, 76, 98],
  akzentHell: [255, 64, 92],
  senf: [222, 166, 72],
  gruen: [96, 186, 132],
  blau: [104, 156, 222],
  stahl: [128, 134, 140],
  holz: [138, 108, 76],
  textInvers: [22, 22, 21],
  dunkelFlaeche: [70, 67, 62],
  schatten: [0, 0, 0],
  akzentFlaeche: [52, 27, 32],
  akzentLinie: [104, 44, 56],
  rotFlaeche: [72, 32, 40],
  gruenFlaeche: [30, 54, 41],
};

const FARBE = {};

// --- Farbschema hell/dunkel ---------------------------------------------------
// FARBE enthält immer die aktive Palette. Beim Umschalten werden die Arrays
// in place überschrieben, damit Verweise wie [FARBE.blau, …] gültig bleiben.
// Die Wahl gilt für alle Lernsituationen (gleicher localStorage-Schlüssel).
const FARBSCHEMA_SCHLUESSEL = "jps-lernsituationen-farbschema";
let dunkelModus = false;

function setzeFarbschema(dunkel) {
  dunkelModus = !!dunkel;
  const quelle = dunkelModus ? FARBE_DUNKEL : FARBE_HELL;
  for (const k in quelle) {
    if (FARBE[k]) {
      FARBE[k].splice(0, FARBE[k].length, ...quelle[k]);
    } else {
      FARBE[k] = quelle[k].slice();
    }
  }
  document.documentElement.classList.toggle("dunkelmodus", dunkelModus);
}

function gespeichertesFarbschema() {
  try {
    const v = localStorage.getItem(FARBSCHEMA_SCHLUESSEL);
    if (v === "dunkel" || v === "hell") {
      return v === "dunkel";
    }
  } catch (e) {
    // kein Speicher verfügbar (z. B. privater Modus) – Systemeinstellung nehmen
  }
  return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

setzeFarbschema(gespeichertesFarbschema());


const TEMPO = { langsam: 1300, mittel: 650, schnell: 180 };

// -----------------------------------------------------------------------------
// Zustand
// -----------------------------------------------------------------------------
let stufe = 0;
let modus = "ueben"; // "ueben" oder "pruefung"
let ansicht = "struktogramm"; // struktogramm | pap | cpp | scl
let wahl = {}; // gewählte Lücken {id: index}
let testfall = 0;
let tempo = "mittel";

let lauf = null; // {gen, z, letzter, fertig, fehler, zeilen, prog}
let laufAuto = false;
let letzterSchritt = 0;
let testErgebnisse = null; // [{name, ok, text}]
let erfolgT0 = -1;

let aufgabe = null; // Prüfungsaufgabe
let serie = 0;
let rueckmeldung = null;
let aufloesung = false; // in der Prüfung: Ablauf wird gezeigt
let freigaben = [false, false, false, false, false, false];
let stempel = null;

let lueckenRechtecke = {}; // id → {x, y, w, h} im Struktogramm
let roboterX = 320;
let fehlerMeldung = null;
let cnv;

// =============================================================================
// Start
// =============================================================================
function setup() {
  ladeSchriften();
  const [cw, ch] = zeichenflaeche();
  cnv = createCanvas(cw, ch);
  S = width / W;
  ladeFreigaben();
  erstelleUi();
  cnv.parent(huelle);
  stufeWechseln(0, true);
  layoutUi();
}

function zeichenflaeche() {
  const cw = Math.max(800, Math.min(1600, windowWidth - 24, ((windowHeight - 24) * W) / H));
  return [Math.round(cw), Math.round((cw * H) / W)];
}

function windowResized() {
  const [cw, ch] = zeichenflaeche();
  resizeCanvas(cw, ch);
  S = width / W;
  layoutUi();
}

function draw() {
  try {
    logik();
    background(...FARBE.papier);
    push();
    scale(S);
    zeichneKopf();
    zeichneStufenLeiste();
    push();
    translate(0, LEISTE);
    zeichneStatus();
    zeichneKueche();
    zeichneTabelle();
    zeichneRezept();
    zeichneAuftrag();
    zeichneFreigaben();
    zeichneStempel();
    zeichneFehlerMeldung();
    pop();
    pop();
    aktualisiereUi();
  } catch (err) {
    behandleFehler(err);
  }
}

function behandleFehler(err) {
  console.error(err);
  fehlerMeldung = { text: String((err && err.message) || err), t0: millis() };
  laufAuto = false;
}

function logik() {
  if (laufAuto && lauf && !lauf.fertig && millis() - letzterSchritt > TEMPO[tempo]) {
    schritt();
  }
  if (lauf && lauf.fertig) {
    laufAuto = false;
  }
  // Roboter gleitet zur Station des aktuellen Schritts
  const ziel = stationX(lauf && lauf.z ? lauf.z.k.station : "start");
  roboterX = lerp(roboterX, ziel, 0.12);
}

// =============================================================================
// Stufe, Modus, Lücken
// =============================================================================
function rezept() {
  return REZEPTE[stufe];
}

function stufeWechseln(neu, erzwingen) {
  if (!erzwingen && neu === stufe) {
    return;
  }
  stufe = neu;
  wahl = {};
  for (const l of rezept().luecken) {
    wahl[l.id] = -1;
  }
  testfall = 0;
  zuruecksetzen();
}

function modusWechseln(neu) {
  if (neu === modus) {
    return;
  }
  modus = neu;
  zuruecksetzen();
}

function zuruecksetzen() {
  laufAuto = false;
  testErgebnisse = null;
  erfolgT0 = -1;
  serie = 0;
  rueckmeldung = null;
  aufloesung = false;
  aufgabe = null;
  if (modus === "pruefung") {
    naechsteAufgabe();
  } else {
    neuerLauf();
  }
  if (typeof leereEingaben === "function") {
    leereEingaben();
  }
}

function lueckeGewaehlt(id, index) {
  wahl[id] = index;
  testErgebnisse = null;
  erfolgT0 = -1;
  neuerLauf();
}

function aktuellesProgramm() {
  if (modus === "pruefung") {
    return aufgabe ? aufgabe.prog : { haupt: [] };
  }
  return rezept().bau(wahl);
}

function aktuelleSpalten() {
  return modus === "pruefung" && aufgabe ? aufgabe.spalten : rezept().spalten;
}

// =============================================================================
// Ablauf: Schritt für Schritt
// =============================================================================
function neuerLauf() {
  const prog = aktuellesProgramm();
  let eingabe;
  let kueche;
  if (modus === "pruefung") {
    eingabe = aufgabe ? aufgabe.eingabe : {};
    kueche = kuecheLeer();
  } else {
    eingabe = rezept().testfaelle[testfall].eingabe;
    kueche = rezept().kueche();
  }
  const z = neuerZustand(eingabe, kueche);
  lauf = { prog, z, gen: fuehreAus(prog, z), letzter: null, fertig: false, fehler: null, zeilen: [], ergebnis: null, nr: 0 };
  lauf.zeilen.push(zeilenSchnappschuss("Start", null));
  laufAuto = false;
}

function schritt() {
  if (!lauf || lauf.fertig) {
    return;
  }
  letzterSchritt = millis();
  try {
    const r = lauf.gen.next();
    if (r.done) {
      lauf.fertig = true;
      lauf.letzter = null;
      lauf.z.k.station = "teller";
      pruefeErgebnis();
      return;
    }
    lauf.letzter = r.value;
    lauf.nr++;
    const k = r.value.knoten;
    if (k.station) {
      lauf.z.k.station = k.station;
    } else if (k.t === "ein" || k.t === "aus") {
      lauf.z.k.station = "tafel";
    }
    lauf.zeilen.push(zeilenSchnappschuss(kurzText(k), k));
  } catch (e) {
    lauf.fertig = true;
    lauf.fehler = e instanceof KochFehler ? e : new KochFehler(String((e && e.message) || e));
    if (!(e instanceof KochFehler)) {
      console.error(e);
    }
  }
}

function kurzText(k) {
  if (k.t === "wenn" || k.t === "solange" || k.t === "wiederhole") {
    return (k.t === "wenn" ? "wenn " : "solange ") + schoen(k.bed || "???");
  }
  return knotenText(k);
}

function zeilenSchnappschuss(text, knoten) {
  const werte = aktuelleSpalten().map((s) => {
    try {
      return s.lies(lauf.z);
    } catch (e) {
      return undefined;
    }
  });
  return { nr: lauf.nr, text, knoten, werte };
}

function pruefeErgebnis() {
  if (modus !== "ueben" || lauf.fehler) {
    return;
  }
  lauf.ergebnis = rezept().testfaelle[testfall].erwartet(lauf.z);
}

function autoUmschalten() {
  if (!lauf) {
    return;
  }
  if (lauf.fertig) {
    neuerLauf();
  }
  laufAuto = !laufAuto;
  letzterSchritt = 0;
}

function testfallWechseln(i) {
  testfall = i;
  neuerLauf();
}

// Alle Testfälle ohne Animation durchrechnen
function alleTestfaellePruefen() {
  const rz = rezept();
  testErgebnisse = rz.testfaelle.map((tf) => {
    const z = neuerZustand(tf.eingabe, rz.kueche());
    try {
      fuehreKomplett(rz.bau(wahl), z);
      const e = tf.erwartet(z);
      return { name: tf.name, ok: e.ok, text: e.text };
    } catch (e) {
      return { name: tf.name, ok: false, text: e.message };
    }
  });
  if (testErgebnisse.every((t) => t.ok)) {
    erfolgT0 = millis();
  }
}

// =============================================================================
// Freigabeprüfung (Schreibtischtest)
// =============================================================================
function naechsteAufgabe() {
  aufgabe = neuePruefung(stufe);
  rueckmeldung = null;
  aufloesung = false;
  neuerLauf();
  if (typeof leereEingaben === "function") {
    leereEingaben();
  }
}

function pruefen(eingabe) {
  if (!aufgabe || rueckmeldung) {
    return;
  }
  const txt = String(eingabe).trim().replace(",", ".").replace("−", "-");
  if (txt === "") {
    return;
  }
  const zahl = Number(txt);
  const ok = !isNaN(zahl) && zahl === aufgabe.antwort;
  if (ok) {
    serie++;
    rueckmeldung = { ok: true, text: `Richtig: ${aufgabe.frageVar} = ${aufgabe.antwort}.` };
    if (serie >= SERIE_ZIEL) {
      if (!freigaben[stufe]) {
        freigaben[stufe] = true;
        speichereFreigaben();
      }
      stempel = { stufe, t0: millis() };
      rueckmeldung.text = `Prüfsiegel erteilt: Freigabe als ${rezept().rang}!`;
      serie = 0;
    }
  } else {
    serie = 0;
    rueckmeldung = { ok: false, text: `Leider falsch: ${aufgabe.frageVar} = ${aufgabe.antwort}. Die Serie beginnt von vorn. Schau dir die Auflösung an!` };
  }
}

function zeigeAufloesung() {
  aufloesung = true;
  neuerLauf();
  laufAuto = true;
  letzterSchritt = 0;
}

function ladeFreigaben() {
  try {
    const roh = window.localStorage.getItem("algokoch-freigaben");
    if (roh) {
      const liste = JSON.parse(roh);
      if (Array.isArray(liste) && liste.length === 6) {
        freigaben = liste.map((x) => x === true);
      }
    }
  } catch (e) {
    // kein Speicher verfügbar
  }
}

function speichereFreigaben() {
  try {
    window.localStorage.setItem("algokoch-freigaben", JSON.stringify(freigaben));
  } catch (e) {
    // kein Speicher verfügbar
  }
}

function freigabenZuruecksetzen() {
  freigaben = [false, false, false, false, false, false];
  speichereFreigaben();
}

function keyPressed() {
  if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "SELECT")) {
    return;
  }
  if (modus === "pruefung" && !aufloesung) {
    return;
  }
  if (keyCode === RIGHT_ARROW) {
    if (lauf && lauf.fertig) {
      neuerLauf();
    }
    schritt();
    return false;
  }
  if (key === " ") {
    autoUmschalten();
    return false;
  }
  if (key === "r" || key === "R") {
    neuerLauf();
    return false;
  }
}

// =============================================================================
// Zeichnen: Grundbausteine
// =============================================================================
function panel(p) {
  noStroke();
  fill(...FARBE.schatten, 10);
  rect(p.x + 1, p.y + 3, p.w, p.h, 12);
  fill(...FARBE.flaeche);
  stroke(...FARBE.linie);
  strokeWeight(1);
  rect(p.x, p.y, p.w, p.h, 12);
  stroke(...FARBE.linie);
  line(p.x + 12, p.y + KOPF_H, p.x + p.w - 12, p.y + KOPF_H);
  if (p.titel) {
    noStroke();
    fill(...FARBE.akzentHell);
    circle(p.x + 19, p.y + KOPF_H / 2 + 1, 7);
    fill(...FARBE.text);
    textFont(TITEL);
    textStyle(BOLD);
    textSize(16);
    textAlign(LEFT, CENTER);
    text(p.titel, p.x + 30, p.y + KOPF_H / 2 + 1);
    textStyle(NORMAL);
  }
}

function hell(farbe, anteil) {
  return [lerp(farbe[0], FARBE.flaeche[0], anteil), lerp(farbe[1], FARBE.flaeche[1], anteil), lerp(farbe[2], FARBE.flaeche[2], anteil)];
}

function umbrechen(txt, maxBreite) {
  const zeilen = [];
  for (const absatzText of String(txt).split("\n")) {
    const woerter = absatzText.split(" ");
    let akt = "";
    for (const wort of woerter) {
      const probe = akt ? akt + " " + wort : wort;
      if (textWidth(probe) > maxBreite && akt) {
        zeilen.push(akt);
        akt = wort;
      } else {
        akt = probe;
      }
    }
    zeilen.push(akt);
  }
  return zeilen;
}

function absatz(txt, x, y, breite, groesse, farbe, fett) {
  textFont(SCHRIFT);
  textSize(groesse);
  textStyle(fett ? BOLD : NORMAL);
  textAlign(LEFT, TOP);
  fill(...(farbe || FARBE.text));
  noStroke();
  const zeilen = umbrechen(txt, breite);
  const za = groesse * 1.42;
  for (let i = 0; i < zeilen.length; i++) {
    text(zeilen[i], x, y + i * za);
  }
  textStyle(NORMAL);
  return zeilen.length * za;
}

function kuerze(txt, breite) {
  if (textWidth(txt) <= breite) {
    return txt;
  }
  let t = txt;
  while (t.length > 1 && textWidth(t + "…") > breite) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

function weich(t) {
  const u = constrain(t, 0, 1);
  return u * u * (3 - 2 * u);
}

// =============================================================================
// Kopfzeile, Stufen-Leiste, Status
// =============================================================================
function zeichneKopf() {
  noStroke();
  fill(...FARBE.flaeche);
  rect(0, 0, W, 56);
  stroke(...FARBE.linie);
  strokeWeight(1);
  line(0, 56, W, 56);
  noStroke();
  fill(...FARBE.akzentHell);
  circle(160, 28, 6);
  stroke(...FARBE.akzentHell);
  strokeWeight(3);
  line(170, 34, 180, 22);
  noStroke();
  fill(...FARBE.text);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(21);
  textAlign(LEFT, CENTER);
  text("Algorithmen-Koch", 194, 21);
  textStyle(NORMAL);
  textFont(SCHRIFT);
  textSize(13);
  fill(...FARBE.blass);
  text(rezept().untertitel, 194, 41);
}

function zeichneStufenLeiste() {
  noStroke();
  fill(...FARBE.akzentFlaeche);
  rect(0, 56, W, LEISTE);
  stroke(...FARBE.akzentLinie);
  strokeWeight(1);
  line(0, 56 + LEISTE, W, 56 + LEISTE);
  noStroke();
  fill(...FARBE.akzent);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(15);
  textAlign(LEFT, CENTER);
  text("Stufe", 26, 56 + LEISTE / 2);
  textStyle(NORMAL);
  stroke(...FARBE.akzent);
  strokeWeight(2);
  const px = 26 + textWidth("Stufe") + 10;
  const py = 56 + LEISTE / 2;
  line(px, py - 5, px + 5, py);
  line(px + 5, py, px, py + 5);
  noStroke();
}

function zeichneStatus() {
  noStroke();
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(13);
  textAlign(LEFT, CENTER);
  let txt;
  if (modus === "pruefung") {
    txt = `Freigabeprüfung „${rezept().rang}“: Rechne das Programm im Kopf durch (Schreibtischtest). ${SERIE_ZIEL} richtige Antworten in Folge ergeben das Prüfsiegel.`;
  } else {
    txt = "Lücken direkt im Struktogramm wählen · → Schritt · Leertaste probekochen · R Neustart · „Alle Testfälle prüfen“ testet das Rezept";
  }
  text(txt, 26, 70);
}

// =============================================================================
// Küche
// =============================================================================
const STATIONEN = { start: 330, regal: 110, herd: 330, ofen: 395, teller: 560, tafel: 120 };

function stationX(s) {
  return P_KUECHE.x + (STATIONEN[s] || STATIONEN.start);
}

function zeichneKueche() {
  const p = P_KUECHE;
  panel(p);
  const x0 = p.x;
  const boden = p.y + p.h - 18;
  const z = lauf ? lauf.z : null;
  const k = z ? z.k : kuecheLeer();

  // Fliesen an der Wand
  stroke(240, 236, 228);
  strokeWeight(1);
  for (let yy = p.y + KOPF_H + 20; yy < boden - 110; yy += 22) {
    line(x0 + 12, yy, x0 + p.w - 12, yy);
  }
  // Arbeitsplatte
  noStroke();
  fill(...FARBE.holz);
  rect(x0 + 14, boden - 110, p.w - 28, 12, 3);
  fill(220, 214, 204);
  rect(x0 + 14, boden - 98, p.w - 28, 98, 0, 0, 8, 8);
  stroke(205, 198, 186);
  for (let xx = x0 + 160; xx < x0 + p.w - 20; xx += 150) {
    line(xx, boden - 94, xx, boden - 4);
  }

  zeichneTafel(x0 + 30, p.y + KOPF_H + 12, k, z);
  zeichneRegal(x0 + 34, boden - 232);
  zeichneHerd(x0 + 176, boden - 110, k, z);
  zeichneOfen(x0 + 330, boden - 236, k);
  zeichneTeller(x0 + 476, boden - 110, k);
  push();
  translate(roboterX, boden - 2);
  scale(0.82);
  zeichneRoboter(0, 0);
  pop();
  zeichneSprechblase(boden);
}

function zeichneRegal(x, y) {
  noStroke();
  fill(...FARBE.holz);
  rect(x, y + 40, 110, 6, 2);
  rect(x, y + 90, 110, 6, 2);
  // Zutaten
  fill(245, 236, 210);
  rect(x + 8, y + 12, 22, 28, 3); // Mehl
  fill(...FARBE.senf);
  rect(x + 36, y + 18, 16, 22, 3); // Öl
  fill(...FARBE.flaeche, 250, 240);
  ellipse(x + 70, y + 32, 16, 20); // Ei
  ellipse(x + 88, y + 32, 16, 20);
  fill(...FARBE.gruen);
  ellipse(x + 20, y + 78, 24, 22); // Salat
  fill(...FARBE.akzent);
  circle(x + 48, y + 80, 18); // Tomate
  fill(240, 200, 80);
  rect(x + 66, y + 68, 30, 20, 3); // Käse
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(11);
  textAlign(CENTER, TOP);
  text("Vorrat", x + 55, y + 100);
}

function zeichneHerd(x, yPlatte, k, z) {
  // Herd-Front
  noStroke();
  fill(70, 70, 72);
  rect(x, yPlatte, 120, 108, 4);
  fill(...(k.herd ? [230, 80, 40] : [110, 110, 112]));
  circle(x + 20, yPlatte + 20, 10);
  fill(200);
  textFont(SCHRIFT);
  textSize(10);
  textAlign(LEFT, CENTER);
  text(k.herd ? "an" : "aus", x + 30, yPlatte + 20);
  // Kochplatte
  fill(...(k.herd ? [235, 90, 50] : [60, 60, 60]));
  ellipse(x + 60, yPlatte - 2, 92, 14);

  if (k.topf) {
    // Topf mit Wasser und Temperatursensor
    const temp = z && z.vars.temperatur !== undefined ? z.vars.temperatur : null;
    fill(...FARBE.stahl);
    rect(x + 18, yPlatte - 70, 84, 66, 4, 4, 10, 10);
    fill(150, 196, 230);
    rect(x + 22, yPlatte - 56, 76, 48, 2, 2, 8, 8);
    if (temp !== null && temp >= 100) {
      fill(...FARBE.flaeche, 255, 255, 200);
      for (let i = 0; i < 6; i++) {
        const bx = x + 30 + ((i * 13 + frameCount * 0.8) % 60);
        const by = yPlatte - 20 - ((frameCount * 1.5 + i * 17) % 32);
        circle(bx, by, 6);
      }
      // Dampf
      noFill();
      stroke(200, 200, 200, 150);
      strokeWeight(3);
      for (let i = 0; i < 3; i++) {
        const dx = x + 38 + i * 20;
        bezier(dx, yPlatte - 76, dx - 8, yPlatte - 92, dx + 8, yPlatte - 100, dx, yPlatte - 116);
      }
      noStroke();
    }
    if (k.topf.nudeln) {
      stroke(240, 210, 120);
      strokeWeight(3);
      for (let i = 0; i < 7; i++) {
        line(x + 30 + i * 9, yPlatte - 50, x + 36 + i * 9, yPlatte - 14);
      }
      noStroke();
    }
    sensorAnzeige(x + 60, yPlatte + 58, "T2 Topf", temp, true);
    return;
  }
  if (k.pfanneAufHerd) {
    fill(50, 50, 52);
    rect(x + 14, yPlatte - 20, 92, 16, 2, 2, 12, 12);
    rect(x + 104, yPlatte - 16, 44, 6, 3);
    if (k.pfanne === "Öl" || k.pfanne === "Öl + Ei" || k.pfanne === "Spiegelei") {
      fill(222, 184, 70, 200);
      ellipse(x + 60, yPlatte - 21, 70, 7);
    }
    if (k.pfanne === "Öl + Ei" || k.pfanne === "Spiegelei") {
      fill(...FARBE.flaeche);
      ellipse(x + 60, yPlatte - 24, 54, 12);
      fill(...(k.pfanne === "Spiegelei" ? [245, 170, 30] : [250, 200, 60]));
      ellipse(x + 62, yPlatte - 26, 18, 9);
    }
    if (k.pfanne === "Teig") {
      fill(236, 200, 130);
      ellipse(x + 60, yPlatte - 24, 66, 10);
    }
  }
}

function sensorAnzeige(cx, y, name, wert, hellText) {
  noStroke();
  fill(20, 22, 24);
  rect(cx - 46, y - 14, 92, 28, 6);
  fill(120, 230, 140);
  textFont(MONO);
  textStyle(BOLD);
  textSize(14);
  textAlign(CENTER, CENTER);
  text(wert === null || wert === undefined ? "-- °C" : `${wert} °C`, cx, y + 1);
  textStyle(NORMAL);
  fill(...(hellText ? [210, 210, 210] : FARBE.blass));
  textFont(SCHRIFT);
  textSize(10);
  text(`${name} → Laborserver`, cx, y - 22);
}

function zeichneOfen(x, y, k) {
  noStroke();
  fill(90, 90, 94);
  rect(x, y, 130, 126, 6);
  fill(...(k.heizt ? [255, 140, 60] : k.ofen && k.ofen.pizza ? [255, 190, 110] : [40, 40, 44]));
  rect(x + 12, y + 50, 106, 62, 4);
  if (k.ofen && k.ofen.pizza) {
    fill(230, 170, 90);
    ellipse(x + 65, y + 92, 74, 18);
    fill(...FARBE.akzent);
    ellipse(x + 65, y + 90, 62, 13);
    fill(250, 230, 160);
    circle(x + 52, y + 89, 6);
    circle(x + 74, y + 91, 6);
  }
  if (k.ofen) {
    sensorAnzeige(x + 65, y + 28, "T1 Ofen", k.ofen.temp, true);
  } else {
    fill(200);
    rect(x + 30, y + 16, 70, 6, 3);
  }
  if (k.alarm) {
    const blink = Math.floor(millis() / 300) % 2 === 0;
    fill(...(blink ? FARBE.akzentHell : [120, 20, 30]));
    circle(x + 118, y + 10, 12);
    fill(...FARBE.akzent);
    textFont(TITEL);
    textStyle(BOLD);
    textSize(13);
    textAlign(CENTER, TOP);
    text("NOTAUS", x + 65, y + 132);
    textStyle(NORMAL);
  }
}

function zeichneTeller(x, yPlatte, k) {
  noStroke();
  // Ausgabe-Pass mit Glocke
  fill(...FARBE.flaeche);
  stroke(...FARBE.linie);
  strokeWeight(1);
  ellipse(x + 60, yPlatte - 6, 116, 18);
  noStroke();
  fill(...FARBE.senf);
  arc(x + 112, yPlatte - 10, 22, 22, PI, TWO_PI);
  rect(x + 100, yPlatte - 10, 24, 3);
  let y = yPlatte - 12;
  // Pfannkuchen-Stapel
  for (let i = 0; i < Math.min(k.stapel, 12); i++) {
    fill(...(i % 2 ? [228, 186, 112] : [236, 198, 128]));
    ellipse(x + 60, y - i * 6, 84, 12);
  }
  if (k.stapel > 0) {
    fill(...FARBE.grau);
    textFont(MONO);
    textSize(12);
    textAlign(CENTER, BOTTOM);
    text(`${k.stapel}×`, x + 60, y - Math.min(k.stapel, 12) * 6 - 8);
  }
  // Spiegelei / Burger
  let bx = x + 16;
  for (const item of k.teller) {
    if (item === "ei") {
      fill(...FARBE.flaeche);
      ellipse(x + 60, y - 4, 60, 16);
      fill(245, 170, 30);
      ellipse(x + 62, y - 6, 20, 10);
    } else {
      zeichneBurger(bx, y - 4, item === "veggie");
      bx += 26;
    }
  }
}

function zeichneBurger(x, y, veggie) {
  noStroke();
  fill(214, 160, 82);
  rect(x, y - 6, 24, 7, 2, 2, 4, 4);
  fill(...(veggie ? [90, 150, 70] : [110, 66, 40]));
  rect(x - 1, y - 12, 26, 6, 3);
  fill(240, 200, 80);
  rect(x, y - 14, 24, 3);
  fill(214, 160, 82);
  arc(x + 12, y - 14, 24, 16, PI, TWO_PI);
}

function zeichneTafel(x, y, k, z) {
  noStroke();
  fill(60, 72, 64);
  rect(x, y, 170, 92, 6);
  fill(...FARBE.holz);
  rect(x, y + 88, 170, 6, 2);
  fill(235, 240, 230);
  textFont(SCHRIFT);
  textSize(12);
  textAlign(LEFT, TOP);
  const zeilen = [];
  if (k.tafel) {
    zeilen.push(k.tafel.titel + ":");
    for (const zl of k.tafel.zeilen.slice(0, 4)) {
      zeilen.push(zl);
    }
  } else if (z && Object.keys(z.eingabe).length && lauf.nr > 0) {
    zeilen.push("Eingabe:");
    for (const n of Object.keys(z.eingabe)) {
      zeilen.push(`${n} = ${wertText(z.eingabe[n])}`);
    }
  } else {
    zeilen.push(modus === "pruefung" ? "Schreibtischtest" : "Tagesgericht:");
    zeilen.push(modus === "pruefung" ? "im Kopf rechnen!" : rezept().titel);
  }
  if (z && z.ausgabe.length) {
    zeilen.push("→ " + z.ausgabe[z.ausgabe.length - 1]);
  }
  for (let i = 0; i < Math.min(zeilen.length, 5); i++) {
    text(kuerze(zeilen[i], 150), x + 10, y + 8 + i * 16);
  }
}

function zeichneRoboter(x, yBoden) {
  const fehler = lauf && lauf.fehler;
  const fertigOk = (lauf && lauf.fertig && lauf.ergebnis && lauf.ergebnis.ok) || (erfolgT0 >= 0 && modus === "ueben");
  const wippen = laufAuto ? Math.sin(millis() / 120) * 2 : 0;
  push();
  translate(x, yBoden + wippen);
  noStroke();
  // Räder
  fill(60);
  circle(-14, -6, 14);
  circle(14, -6, 14);
  // Körper
  fill(...(fehler ? [235, 205, 205] : [226, 230, 234]));
  stroke(150, 156, 162);
  strokeWeight(1.5);
  rect(-24, -64, 48, 54, 10);
  // Schürze
  noStroke();
  fill(...FARBE.akzent);
  rect(-16, -44, 32, 30, 4);
  fill(255);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(9);
  textAlign(CENTER, CENTER);
  text("JPS", 0, -30);
  textStyle(NORMAL);
  // Kopf mit Display
  fill(226, 230, 234);
  stroke(150, 156, 162);
  rect(-20, -98, 40, 32, 8);
  noStroke();
  fill(30, 40, 50);
  rect(-15, -93, 30, 20, 5);
  fill(...(fehler ? [255, 110, 110] : [120, 230, 160]));
  if (fehler) {
    textFont(MONO);
    textSize(12);
    textAlign(CENTER, CENTER);
    text("x  x", 0, -84);
  } else if (fertigOk) {
    textFont(MONO);
    textSize(12);
    textAlign(CENTER, CENTER);
    text("^  ^", 0, -83);
  } else {
    circle(-6, -84, 5);
    circle(6, -84, 5);
  }
  // Kochmütze
  fill(...FARBE.flaeche);
  stroke(220);
  rect(-14, -110, 28, 14, 2);
  ellipse(-8, -116, 18, 16);
  ellipse(8, -116, 18, 16);
  ellipse(0, -122, 20, 18);
  // Arme
  stroke(150, 156, 162);
  strokeWeight(4);
  const arm = laufAuto ? Math.sin(millis() / 150) * 8 : 0;
  line(-24, -50, -36, -36 - arm);
  line(24, -50, 36, -36 + arm);
  // Schweißtropfen bei Fehler
  if (fehler) {
    noStroke();
    fill(120, 180, 240);
    ellipse(26, -96, 6, 9);
  }
  pop();
}

function zeichneSprechblase(boden) {
  let txt = null;
  let farbe = FARBE.text;
  if (lauf && lauf.fehler) {
    txt = lauf.fehler.message;
    farbe = FARBE.akzent;
  } else if (lauf && lauf.letzter) {
    txt = lauf.letzter.text;
  } else if (lauf && lauf.fertig) {
    if (lauf.ergebnis) {
      txt = (lauf.ergebnis.ok ? "Fertig! " : "Hmm … ") + lauf.ergebnis.text;
      farbe = lauf.ergebnis.ok ? FARBE.gruen : FARBE.akzent;
    } else {
      txt = "Fertig!";
    }
  } else if (modus === "pruefung" && !aufloesung) {
    txt = "Was kommt heraus? Erst rechnen, dann die Auflösung ansehen.";
  } else {
    txt = "Bereit. → für einen Schritt oder „Probekochen“.";
  }
  if (erfolgT0 >= 0 && modus === "ueben" && (!lauf || lauf.nr === 0)) {
    txt = "Alle Testfälle bestanden – das Rezept funktioniert! Jetzt die Freigabeprüfung ablegen.";
    farbe = FARBE.gruen;
  }
  const p = P_KUECHE;
  const bx = p.x + 216;
  const by = p.y + KOPF_H + 12;
  const bw = p.w - 232;
  textFont(SCHRIFT);
  textSize(13);
  const zeilen = umbrechen(txt, bw - 24).slice(0, 3);
  const bh = zeilen.length * 18 + 16;
  noStroke();
  fill(...hell(farbe, 0.92));
  stroke(...hell(farbe, 0.6));
  strokeWeight(1.5);
  rect(bx, by, bw, bh, 10);
  // Spitze zum Roboter
  const sx = constrain(roboterX, bx + 20, bx + bw - 20);
  noStroke();
  fill(...hell(farbe, 0.92));
  triangle(sx - 8, by + bh - 1, sx + 8, by + bh - 1, sx, by + bh + 10);
  fill(...farbe);
  textAlign(LEFT, TOP);
  for (let i = 0; i < zeilen.length; i++) {
    text(zeilen[i], bx + 12, by + 8 + i * 18);
  }
}

// =============================================================================
// Variablentabelle (Schreibtischtest)
// =============================================================================
function zeichneTabelle() {
  const p = P_TABELLE;
  panel(p);
  const spalten = aktuelleSpalten();
  const x = p.x + 14;
  const y = p.y + KOPF_H + 8;
  const nrB = 34;
  const textB = 220;
  const restB = p.w - 28 - nrB - textB;
  const spB = restB / Math.max(1, spalten.length);
  const zeilenH = 22;

  // Kopf
  noStroke();
  fill(...FARBE.flaeche2);
  rect(x, y, p.w - 28, 26, 4);
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textStyle(BOLD);
  textSize(12);
  textAlign(LEFT, CENTER);
  text("#", x + 8, y + 13);
  text("Schritt", x + nrB + 6, y + 13);
  spalten.forEach((s, i) => {
    fill(...(s.lokal ? FARBE.blau : FARBE.grau));
    textAlign(CENTER, CENTER);
    text(kuerze(s.name.replace(" (lokal)", ""), spB - 6), x + nrB + textB + spB * (i + 0.5), y + 13);
  });
  textStyle(NORMAL);
  if (spalten.some((s) => s.lokal)) {
    fill(...FARBE.blau);
    textFont(SCHRIFT);
    textSize(11);
    textAlign(RIGHT, CENTER);
    text("blau = lokale Variable der Funktion (– = existiert gerade nicht)", p.x + p.w - 16, p.y + KOPF_H / 2 + 1);
  }

  if (modus === "pruefung" && !aufloesung) {
    absatz("Die Tabelle ist abgedeckt: Lege selbst eine Variablentabelle auf Papier an und rechne das Programm Schritt für Schritt durch. Nach deiner Antwort kannst du die Auflösung ansehen.", x + 10, y + 46, p.w - 48, 14, FARBE.grau);
    return;
  }
  if (!lauf) {
    return;
  }
  const maxZeilen = Math.floor((p.h - KOPF_H - 50) / zeilenH);
  const zeilen = lauf.zeilen;
  const start = Math.max(0, zeilen.length - maxZeilen);
  for (let r = start; r < zeilen.length; r++) {
    const zy = y + 30 + (r - start) * zeilenH;
    const z = zeilen[r];
    const letzte = r === zeilen.length - 1;
    noStroke();
    if (letzte && lauf.nr > 0) {
      fill(...hell(FARBE.senf, 0.82));
      rect(x, zy, p.w - 28, zeilenH - 2, 3);
    } else if (r % 2 === 0) {
      fill(...FARBE.papier);
      rect(x, zy, p.w - 28, zeilenH - 2, 3);
    }
    fill(...FARBE.blass);
    textFont(MONO);
    textSize(11.5);
    textAlign(LEFT, CENTER);
    text(String(z.nr), x + 8, zy + zeilenH / 2 - 1);
    fill(...FARBE.text);
    textFont(SCHRIFT);
    textSize(12);
    text(kuerze(z.text, textB - 10), x + nrB + 6, zy + zeilenH / 2 - 1);
    const vorher = r > 0 ? zeilen[r - 1].werte : null;
    z.werte.forEach((w, i) => {
      const geaendert = vorher && wertText(vorher[i]) !== wertText(w);
      const cx = x + nrB + textB + spB * (i + 0.5);
      if (geaendert) {
        fill(...hell(FARBE.akzent, 0.85));
        rect(cx - spB / 2 + 3, zy + 1, spB - 6, zeilenH - 4, 3);
      }
      fill(...(geaendert ? FARBE.akzent : w === undefined ? FARBE.blass : FARBE.text));
      textFont(MONO);
      textStyle(geaendert ? BOLD : NORMAL);
      textSize(12);
      textAlign(CENTER, CENTER);
      text(kuerze(typeof w === "string" && !spalten[i].name.match(/^[a-z]/) ? w : wertText(w), spB - 8), cx, zy + zeilenH / 2 - 1);
      textStyle(NORMAL);
    });
  }
}

// =============================================================================
// Rezept: Struktogramm, PAP oder Code
// =============================================================================
function zeichneRezept() {
  const p = P_REZEPT;
  panel(p);
  lueckenRechtecke = {};
  const prog = lauf ? lauf.prog : aktuellesProgramm();
  const aktiv = lauf && lauf.letzter ? lauf.letzter.knoten : null;
  const fehlerKnoten = null;
  const bereich = { x: p.x + 20, y: p.y + KOPF_H + 16, w: p.w - 40, h: p.h - KOPF_H - 30 };
  if (ansicht === "struktogramm") {
    zeichneStruktogrammAnsicht(prog, bereich, aktiv);
  } else if (ansicht === "pap") {
    zeichnePapAnsicht(prog, bereich, aktiv);
  } else {
    zeichneCodeAnsicht(prog, bereich, aktiv, ansicht);
  }
  return fehlerKnoten;
}

// -----------------------------------------------------------------------------
// Struktogramm nach DIN 66261
// -----------------------------------------------------------------------------
const SG = { zeile: 17, rand: 8, kopf: 30 };

function zeichneStruktogrammAnsicht(prog, b, aktiv) {
  let y = b.y;
  const bloecke = [];
  for (const f of prog.funktionen || []) {
    bloecke.push({ titel: funktionKopf(f), liste: f.rumpf });
  }
  bloecke.push({ titel: prog.funktionen && prog.funktionen.length ? "Hauptprogramm" : rezeptTitel(), liste: prog.haupt });
  // Höhe messen, ggf. verkleinern
  let gesamt = 0;
  for (const bl of bloecke) {
    gesamt += 28 + sgBlock(bl.liste, 0, 0, b.w, null, false) + 18;
  }
  const faktor = Math.min(1, b.h / gesamt);
  push();
  translate(b.x, b.y);
  scale(faktor);
  y = 0;
  for (const bl of bloecke) {
    noStroke();
    fill(...FARBE.text);
    textFont(TITEL);
    textStyle(BOLD);
    textSize(15);
    textAlign(LEFT, TOP);
    text(bl.titel, 0, y);
    textStyle(NORMAL);
    y += 26;
    const h = sgBlock(bl.liste, 0, y, b.w / faktor > b.w ? b.w : b.w, aktiv, true, { x: b.x, y: b.y, f: faktor });
    noFill();
    stroke(...FARBE.text);
    strokeWeight(2);
    rect(0, y, b.w, h);
    y += h + 18;
  }
  pop();
}

function rezeptTitel() {
  return modus === "pruefung" ? "Programm" : rezept().titel;
}

// Zellen-Hintergrund je nach Zustand
function sgFuellung(k, aktiv) {
  if (k === aktiv) {
    return hell(FARBE.senf, 0.62);
  }
  if (k.t === "leer") {
    return hell(FARBE.akzent, 0.9);
  }
  if (k.luecke && modus === "ueben") {
    return hell(FARBE.akzent, 0.95);
  }
  return FARBE.flaeche;
}

function sgText(txt, x, y, w, zeichnen, mono) {
  textFont(mono ? MONO : SCHRIFT);
  textSize(13.5);
  const zeilen = umbrechen(txt, w - 2 * SG.rand);
  if (zeichnen) {
    noStroke();
    fill(...FARBE.text);
    textAlign(LEFT, TOP);
    for (let i = 0; i < zeilen.length; i++) {
      text(zeilen[i], x + SG.rand, y + 7 + i * SG.zeile);
    }
  }
  return zeilen.length * SG.zeile + 14;
}

// Merkt sich eine Lücke für das darübergelegte Auswahlfeld
function merkeLuecke(id, x, y, w, h, t) {
  if (!t) {
    return;
  }
  lueckenRechtecke[id] = { x: t.x + x * t.f, y: t.y + y * t.f, w: w * t.f, h: h * t.f };
}

function sgBlock(liste, x, y, w, aktiv, zeichnen, t) {
  let h = 0;
  for (const k of liste) {
    h += sgKnoten(k, x, y + h, w, aktiv, zeichnen, t);
  }
  if (liste.length === 0) {
    if (zeichnen) {
      noStroke();
      fill(...FARBE.blass);
      textFont(SCHRIFT);
      textSize(13);
      textAlign(CENTER, CENTER);
      text("∅", x + w / 2, y + 14);
    }
    h = 28;
  }
  return h;
}

function sgRahmen(x, y, w, h, fuellung) {
  fill(...fuellung);
  stroke(...FARBE.text);
  strokeWeight(1.2);
  rect(x, y, w, h);
}

function sgKnoten(k, x, y, w, aktiv, zeichnen, t) {
  const luecke = modus === "ueben" ? k.luecke : null;
  // Zusatzzeile für die Wahl der Schleifenart (Stufe 4)
  if (k.lueckeArt && modus === "ueben") {
    const hArt = 36;
    if (zeichnen) {
      sgRahmen(x, y, w, hArt, hell(FARBE.akzent, 0.95));
      noStroke();
      fill(...FARBE.grau);
      textFont(SCHRIFT);
      textSize(12);
      textAlign(LEFT, CENTER);
      text("Schleifenart:", x + 8, y + hArt / 2);
      merkeLuecke(k.lueckeArt, x + 92, y + 5, w - 100, hArt - 10, t);
    }
    return hArt + sgKnoten(Object.assign({}, k, { lueckeArt: null, _original: k }), x, y + hArt, w, aktiv, zeichnen, t);
  }
  const original = k._original || k;
  const istAktiv = original === aktiv;
  const fuell = sgFuellung(original, aktiv);

  if (k.t === "aktion" || k.t === "zuw" || k.t === "ein" || k.t === "aus" || k.t === "rueckgabe" || k.t === "leer") {
    const txt = knotenText(k);
    const h = Math.max(luecke ? 40 : 32, sgText(txt, x, y, w, false, k.t !== "aktion"));
    if (zeichnen) {
      sgRahmen(x, y, w, h, istAktiv ? fuell : fuell);
      sgText(txt, x, y + (h - sgText(txt, x, y, w, false, k.t !== "aktion")) / 2, w, true, k.t !== "aktion");
      if (luecke) {
        merkeLuecke(luecke, x + 4, y + 4, w - 8, h - 8, t);
      }
    }
    return h;
  }
  if (k.t === "aufruf") {
    const txt = knotenText(k);
    const h = Math.max(luecke ? 40 : 34, sgText(txt, x + 10, y, w - 20, false, true));
    if (zeichnen) {
      sgRahmen(x, y, w, h, fuell);
      stroke(...FARBE.text);
      line(x + 8, y, x + 8, y + h);
      line(x + w - 8, y, x + w - 8, y + h);
      sgText(txt, x + 10, y + (h - sgText(txt, x + 10, y, w - 20, false, true)) / 2, w - 20, true, true);
      if (luecke) {
        merkeLuecke(luecke, x + 12, y + 4, w - 24, h - 8, t);
      }
    }
    return h;
  }
  if (k.t === "wenn") {
    const kopfH = 52;
    const links = w / 2;
    const hJa = sgBlock(k.ja, x, 0, links, aktiv, false, t);
    const hNein = sgBlock(k.nein, x + links, 0, w - links, aktiv, false, t);
    const hUnten = Math.max(hJa, hNein);
    if (zeichnen) {
      sgRahmen(x, y, w, kopfH, fuell);
      stroke(...FARBE.text);
      strokeWeight(1.2);
      line(x, y, x + links, y + kopfH);
      line(x + w, y, x + links, y + kopfH);
      noStroke();
      fill(...FARBE.text);
      textFont(MONO);
      textSize(13.5);
      textAlign(CENTER, TOP);
      text(k.bed ? schoen(k.bed) : "???", x + links, y + 6);
      textFont(SCHRIFT);
      textSize(12);
      fill(...FARBE.gruen);
      textAlign(LEFT, BOTTOM);
      text("ja", x + 8, y + kopfH - 4);
      fill(...FARBE.akzent);
      textAlign(RIGHT, BOTTOM);
      text("nein", x + w - 8, y + kopfH - 4);
      if (luecke) {
        merkeLuecke(luecke, x + w * 0.27, y + 3, w * 0.46, 24, t);
      }
      // Hervorhebung des gewählten Zweigs
      if (istAktiv && lauf && lauf.letzter) {
        noStroke();
        fill(...(lauf.letzter.zweig ? FARBE.gruen : FARBE.akzent), 60);
        rect(lauf.letzter.zweig ? x : x + links, y + kopfH, lauf.letzter.zweig ? links : w - links, hUnten);
      }
      const yy = y + kopfH;
      noFill();
      stroke(...FARBE.text);
      rect(x, yy, links, hUnten);
      rect(x + links, yy, w - links, hUnten);
      sgBlock(k.ja, x, yy, links, aktiv, true, t);
      sgBlock(k.nein, x + links, yy, w - links, aktiv, true, t);
      // Lücken-Füllung bei kurzem Zweig: Rest unterhalb auffüllen
      noFill();
      stroke(...FARBE.text);
      rect(x, yy, links, hUnten);
      rect(x + links, yy, w - links, hUnten);
    }
    return kopfH + hUnten;
  }
  if (k.t === "solange" || k.t === "fuer" || k.t === "jede") {
    const kopfTxt = knotenText(k);
    const kopfH = Math.max(luecke ? 40 : 32, sgText(kopfTxt, x, y, w, false, true));
    const einzug = 34;
    const hRumpf = sgBlock(k.rumpf, x + einzug, 0, w - einzug, aktiv, false, t);
    if (zeichnen) {
      sgRahmen(x, y, w, kopfH + hRumpf, fuell);
      sgText(kopfTxt, x, y + (kopfH - sgText(kopfTxt, x, y, w, false, true)) / 2, w, true, true);
      if (luecke) {
        if (k.t === "fuer" && k.luecke2) {
          noStroke();
          fill(...FARBE.text);
          textFont(MONO);
          textSize(13.5);
          textAlign(LEFT, CENTER);
          sgRahmen(x, y, w, kopfH, fuell);
          fill(...FARBE.text);
          noStroke();
          // „Von Ganzzahl i = [Start] [bis Ende], SW = +1“
          const vorne = fuerKopf(k).trim();
          const hinten = fuerSchritt(k);
          text(vorne, x + 8, y + kopfH / 2);
          const xL = x + 8 + textWidth(vorne) + 6;
          const wHinten = textWidth(hinten) + 10;
          const rest = x + w - wHinten - xL;
          const wVon = rest * 0.45;
          merkeLuecke(luecke, xL, y + 5, wVon, kopfH - 10, t);
          merkeLuecke(k.luecke2, xL + wVon + 6, y + 5, rest - wVon - 6, kopfH - 10, t);
          text(hinten, x + w - wHinten + 2, y + kopfH / 2);
        } else {
          merkeLuecke(luecke, x + 4, y + 4, w - 8, kopfH - 8, t);
        }
      }
      sgBlock(k.rumpf, x + einzug, y + kopfH, w - einzug, aktiv, true, t);
      noFill();
      stroke(...FARBE.text);
      rect(x + einzug, y + kopfH, w - einzug, hRumpf);
    }
    return kopfH + hRumpf;
  }
  if (k.t === "wiederhole") {
    const fussTxt = knotenText(k);
    const fussH = Math.max(luecke ? 40 : 32, sgText(fussTxt, x, y, w, false, true));
    const einzug = 34;
    const hRumpf = sgBlock(k.rumpf, x + einzug, 0, w - einzug, aktiv, false, t);
    if (zeichnen) {
      sgRahmen(x, y, w, hRumpf + fussH, fuell);
      sgBlock(k.rumpf, x + einzug, y, w - einzug, aktiv, true, t);
      noFill();
      stroke(...FARBE.text);
      rect(x + einzug, y, w - einzug, hRumpf);
      sgText(fussTxt, x, y + hRumpf + (fussH - sgText(fussTxt, x, y, w, false, true)) / 2, w, true, true);
      if (luecke) {
        merkeLuecke(luecke, x + 4, y + hRumpf + 4, w - 8, fussH - 8, t);
      }
    }
    return hRumpf + fussH;
  }
  return 0;
}

// -----------------------------------------------------------------------------
// Programmablaufplan (PAP) nach DIN 66001
// -----------------------------------------------------------------------------
const PAP = { boxW: 210, rauteW: 210, rauteH: 60, abstand: 22, schleifeRand: 34 };

function papText(txt, maxW) {
  textFont(MONO);
  textSize(12.5);
  return umbrechen(txt, maxW - 16);
}

// Maß eines Blocks: {w, h, achse} (achse = x-Position der Mittellinie relativ zum Block)
function papMass(liste) {
  let w = PAP.boxW;
  let h = 0;
  let achse = PAP.boxW / 2;
  const teile = liste.map((k) => papKnotenMass(k));
  // gemeinsame Achse: maximale linke Hälfte
  let links = 0;
  let rechts = 0;
  for (const m of teile) {
    links = Math.max(links, m.achse);
    rechts = Math.max(rechts, m.w - m.achse);
    h += m.h + PAP.abstand;
  }
  if (teile.length) {
    w = links + rechts;
    achse = links;
  } else {
    h = 20;
  }
  return { w, h, achse, teile };
}

function papKnotenMass(k) {
  if (k.t === "wenn") {
    const ja = papMass(k.ja);
    const nein = papMass(k.nein);
    const w = Math.max(ja.w + nein.w + 30, PAP.rauteW + 40);
    return { w, h: PAP.rauteH + 26 + Math.max(ja.h, nein.h) + 14, achse: w / 2, ja, nein };
  }
  if (k.t === "solange" || k.t === "fuer" || k.t === "jede" || k.t === "wiederhole") {
    const rumpf = papMass(k.rumpf);
    const innenW = Math.max(rumpf.w, PAP.rauteW);
    const w = innenW + 2 * PAP.schleifeRand;
    let extra = 0;
    if (k.t === "fuer") {
      extra = 2 * (36 + PAP.abstand);
    }
    if (k.t === "jede") {
      extra = 36 + PAP.abstand;
    }
    return { w, h: PAP.rauteH + PAP.abstand + rumpf.h + extra + 20, achse: PAP.schleifeRand + innenW / 2, rumpf, innenW };
  }
  const zeilen = papText(knotenText(k), PAP.boxW);
  return { w: PAP.boxW, h: Math.max(34, zeilen.length * 16 + 14), achse: PAP.boxW / 2, zeilen };
}

function papPfeil(x1, y1, x2, y2) {
  stroke(...FARBE.text);
  strokeWeight(1.3);
  line(x1, y1, x2, y2);
  const a = atan2(y2 - y1, x2 - x1);
  push();
  translate(x2, y2);
  rotate(a);
  noStroke();
  fill(...FARBE.text);
  triangle(0, 0, -8, -4, -8, 4);
  pop();
}

function papLinie(punkte, mitPfeil) {
  stroke(...FARBE.text);
  strokeWeight(1.3);
  noFill();
  for (let i = 0; i < punkte.length - 1; i++) {
    if (mitPfeil && i === punkte.length - 2) {
      papPfeil(punkte[i][0], punkte[i][1], punkte[i + 1][0], punkte[i + 1][1]);
    } else {
      line(punkte[i][0], punkte[i][1], punkte[i + 1][0], punkte[i + 1][1]);
    }
  }
}

function papTerminator(cx, y, txt) {
  textFont(SCHRIFT);
  textSize(13);
  const w = Math.max(90, textWidth(txt) + 30);
  fill(...FARBE.flaeche2);
  stroke(...FARBE.text);
  strokeWeight(1.3);
  rect(cx - w / 2, y, w, 30, 15);
  noStroke();
  fill(...FARBE.text);
  textAlign(CENTER, CENTER);
  text(txt, cx, y + 15);
}

function papRaute(cx, y, txt, fuell) {
  const w = PAP.rauteW;
  const h = PAP.rauteH;
  fill(...fuell);
  stroke(...FARBE.text);
  strokeWeight(1.3);
  quad(cx, y, cx + w / 2, y + h / 2, cx, y + h, cx - w / 2, y + h / 2);
  noStroke();
  fill(...FARBE.text);
  textFont(MONO);
  textSize(12);
  textAlign(CENTER, CENTER);
  text(kuerze(txt, w * 0.62), cx, y + h / 2);
}

function papBox(cx, y, m, k, fuell) {
  const w = m.w;
  fill(...fuell);
  stroke(...FARBE.text);
  strokeWeight(1.3);
  if (k.t === "ein" || k.t === "aus") {
    quad(cx - w / 2 + 12, y, cx + w / 2 + 6, y, cx + w / 2 - 12, y + m.h, cx - w / 2 - 6, y + m.h);
  } else {
    rect(cx - w / 2, y, w, m.h);
    if (k.t === "aufruf") {
      line(cx - w / 2 + 8, y, cx - w / 2 + 8, y + m.h);
      line(cx + w / 2 - 8, y, cx + w / 2 - 8, y + m.h);
    }
  }
  noStroke();
  fill(...FARBE.text);
  textFont(k.t === "aktion" ? SCHRIFT : MONO);
  textSize(12.5);
  textAlign(CENTER, TOP);
  for (let i = 0; i < m.zeilen.length; i++) {
    text(m.zeilen[i], cx, y + 7 + i * 16);
  }
}

function papFuellung(k, aktiv) {
  if (k === aktiv) {
    return hell(FARBE.senf, 0.62);
  }
  if (k.t === "leer" || (k.luecke && modus === "ueben")) {
    return hell(FARBE.akzent, 0.9);
  }
  return FARBE.flaeche;
}

// zeichnet einen Block mit Mittellinie bei cx ab y; liefert die Endhöhe
function papZeichneBlock(liste, m, cx, y, aktiv) {
  let yy = y;
  liste.forEach((k, i) => {
    const km = m.teile[i];
    papZeichneKnoten(k, km, cx, yy, aktiv);
    yy += km.h;
    if (i < liste.length - 1) {
      papPfeil(cx, yy, cx, yy + PAP.abstand);
    }
    yy += PAP.abstand;
  });
  return yy - PAP.abstand;
}

function papZeichneKnoten(k, m, cx, y, aktiv) {
  const fuell = papFuellung(k, aktiv);
  if (k.t === "wenn") {
    papRaute(cx, y, k.bed ? schoen(k.bed) + " ?" : "???", fuell);
    const xJa = cx - m.w / 2 + m.ja.w / 2;
    const xNein = cx + m.w / 2 - m.nein.w / 2;
    const yZweig = y + PAP.rauteH + 26;
    papLinie([[cx - PAP.rauteW / 2, y + PAP.rauteH / 2], [xJa, y + PAP.rauteH / 2], [xJa, yZweig]], true);
    papLinie([[cx + PAP.rauteW / 2, y + PAP.rauteH / 2], [xNein, y + PAP.rauteH / 2], [xNein, yZweig]], true);
    noStroke();
    fill(...FARBE.gruen);
    textFont(SCHRIFT);
    textSize(11);
    textAlign(RIGHT, BOTTOM);
    text("ja", cx - PAP.rauteW / 2 - 4, y + PAP.rauteH / 2 - 2);
    fill(...FARBE.akzent);
    textAlign(LEFT, BOTTOM);
    text("nein", cx + PAP.rauteW / 2 + 4, y + PAP.rauteH / 2 - 2);
    const yEnde = y + m.h - 6;
    let e1 = yZweig;
    if (k.ja.length) {
      e1 = papZeichneBlock(k.ja, m.ja, xJa, yZweig, aktiv);
    }
    let e2 = yZweig;
    if (k.nein.length) {
      e2 = papZeichneBlock(k.nein, m.nein, xNein, yZweig, aktiv);
    }
    papLinie([[xJa, e1], [xJa, yEnde], [cx, yEnde]], false);
    papLinie([[xNein, e2], [xNein, yEnde], [cx, yEnde]], false);
    stroke(...FARBE.text);
    line(cx, yEnde, cx, y + m.h);
    return;
  }
  if (k.t === "solange" || k.t === "fuer" || k.t === "jede") {
    const links = cx - m.innenW / 2 - PAP.schleifeRand / 2;
    const rechts = cx + m.innenW / 2 + PAP.schleifeRand / 2;
    let yy = y;
    if (k.t === "fuer") {
      papBox(cx, yy, { w: PAP.boxW, h: 36, zeilen: [`${typName("int")} ${k.var} ${PFEIL} ${k.von === null ? "???" : k.von}`] }, { t: "zuw" }, fuell);
      yy += 36;
      papPfeil(cx, yy, cx, yy + PAP.abstand);
      yy += PAP.abstand;
    }
    const yRaute = yy;
    let bed;
    if (k.t === "fuer") {
      bed = `${k.var} ${schoen(fuerVergleich(k))} ${k.bis === null ? "???" : k.bis} ?`;
    } else if (k.t === "jede") {
      bed = k.offen ? "???" : `noch ein Element in ${k.liste}?`;
    } else {
      bed = k.bed ? schoen(k.bed) + " ?" : "???";
    }
    papRaute(cx, yRaute, bed, fuell);
    yy += PAP.rauteH;
    noStroke();
    fill(...FARBE.gruen);
    textFont(SCHRIFT);
    textSize(11);
    textAlign(LEFT, TOP);
    text("ja", cx + 6, yy + 2);
    papPfeil(cx, yy, cx, yy + PAP.abstand);
    yy += PAP.abstand;
    if (k.t === "jede") {
      papBox(cx, yy, { w: PAP.boxW, h: 36, zeilen: [`${k.var} ${PFEIL} nächstes Element`] }, { t: "zuw" }, FARBE.flaeche);
      yy += 36;
      papPfeil(cx, yy, cx, yy + PAP.abstand);
      yy += PAP.abstand;
    }
    let ende = yy;
    if (k.rumpf.length) {
      ende = papZeichneBlock(k.rumpf, m.rumpf, cx, yy, aktiv);
    }
    if (k.t === "fuer") {
      papPfeil(cx, ende, cx, ende + PAP.abstand);
      ende += PAP.abstand;
      papBox(cx, ende, { w: PAP.boxW, h: 36, zeilen: [`${k.var} ${PFEIL} ${fuerWeiter(k)}`] }, { t: "zuw" }, FARBE.flaeche);
      ende += 36;
    }
    // Rücksprung links nach oben
    papLinie([[cx, ende], [cx, ende + 10], [links, ende + 10], [links, yRaute - 10], [cx, yRaute - 10], [cx, yRaute]], true);
    // nein: rechts heraus und unten weiter
    papLinie([[cx + PAP.rauteW / 2, yRaute + PAP.rauteH / 2], [rechts, yRaute + PAP.rauteH / 2], [rechts, y + m.h - 4], [cx, y + m.h - 4], [cx, y + m.h]], false);
    noStroke();
    fill(...FARBE.akzent);
    textFont(SCHRIFT);
    textSize(11);
    textAlign(LEFT, BOTTOM);
    text("nein", cx + PAP.rauteW / 2 + 4, yRaute + PAP.rauteH / 2 - 2);
    return;
  }
  if (k.t === "wiederhole") {
    const links = cx - m.innenW / 2 - PAP.schleifeRand / 2;
    const yStart = y;
    let ende = y;
    if (k.rumpf.length) {
      ende = papZeichneBlock(k.rumpf, m.rumpf, cx, y, aktiv);
    }
    papPfeil(cx, ende, cx, ende + PAP.abstand);
    const yRaute = ende + PAP.abstand;
    papRaute(cx, yRaute, k.bed ? schoen(k.bed) + " ?" : "???", fuell);
    papLinie([[cx - PAP.rauteW / 2, yRaute + PAP.rauteH / 2], [links, yRaute + PAP.rauteH / 2], [links, yStart - 8], [cx, yStart - 8], [cx, yStart]], true);
    noStroke();
    fill(...FARBE.gruen);
    textFont(SCHRIFT);
    textSize(11);
    textAlign(RIGHT, BOTTOM);
    text("ja", cx - PAP.rauteW / 2 - 4, yRaute + PAP.rauteH / 2 - 2);
    fill(...FARBE.akzent);
    textAlign(LEFT, TOP);
    text("nein", cx + 6, yRaute + PAP.rauteH + 2);
    stroke(...FARBE.text);
    line(cx, yRaute + PAP.rauteH, cx, y + m.h);
    return;
  }
  papBox(cx, y, m, k, fuell);
}

function zeichnePapAnsicht(prog, b, aktiv) {
  const teile = [];
  for (const f of prog.funktionen || []) {
    teile.push({ start: funktionKopf(f, false), ende: "Rücksprung", liste: f.rumpf });
  }
  teile.push({ start: "Start", ende: "Ende", liste: prog.haupt });
  const masse = teile.map((tl) => papMass(tl.liste));
  // Spaltenbreite: der Funktionskopf mit Datentypen kann breiter sein als der Ablauf
  textFont(SCHRIFT);
  textSize(13);
  const breiten = teile.map((tl, i) => Math.max(masse[i].w, textWidth(tl.start) + 30));
  // nebeneinander anordnen
  const gesamtW = breiten.reduce((s, w) => s + w + 40, -40) + 20;
  const gesamtH = Math.max(...masse.map((m) => m.h)) + 30 + 30 + 2 * PAP.abstand + 10;
  const faktor = Math.min(1, b.w / gesamtW, b.h / gesamtH);
  push();
  translate(b.x + (b.w - gesamtW * faktor) / 2, b.y);
  scale(faktor);
  let x = 10;
  teile.forEach((tl, i) => {
    const m = masse[i];
    const cx = x + (breiten[i] - m.w) / 2 + m.achse;
    papTerminator(cx, 0, tl.start);
    papPfeil(cx, 30, cx, 30 + PAP.abstand);
    let ende = 30 + PAP.abstand;
    if (tl.liste.length) {
      ende = papZeichneBlock(tl.liste, m, cx, ende, aktiv);
    }
    papPfeil(cx, ende, cx, ende + PAP.abstand);
    papTerminator(cx, ende + PAP.abstand, tl.ende);
    x += breiten[i] + 40;
  });
  pop();
}

// -----------------------------------------------------------------------------
// Code-Ansicht (C++ oder SCL)
// -----------------------------------------------------------------------------
function zeichneCodeAnsicht(prog, b, aktiv, art) {
  const zeilen = art === "cpp" ? cppZeilen(prog) : sclZeilen(prog);
  const zeilenH = 20;
  const faktor = Math.min(1, (b.h - 40) / (zeilen.length * zeilenH));
  push();
  translate(b.x, b.y);
  scale(faktor);
  const gesehen = new Set();
  for (let i = 0; i < zeilen.length; i++) {
    const zl = zeilen[i];
    const y = i * zeilenH;
    const erste = zl.knoten && !gesehen.has(zl.knoten);
    if (zl.knoten) {
      gesehen.add(zl.knoten);
    }
    const lueckeHier = erste && (zl.knoten.t === "leer" || (zl.knoten.luecke && modus === "ueben"));
    if (aktiv && zl.knoten === aktiv && erste) {
      noStroke();
      fill(...hell(FARBE.senf, 0.62));
      rect(-6, y - 2, b.w / faktor + 12, zeilenH, 3);
    } else if (lueckeHier) {
      noStroke();
      fill(...hell(FARBE.akzent, 0.9));
      rect(-6, y - 2, b.w / faktor + 12, zeilenH, 3);
    }
    noStroke();
    fill(...FARBE.blass);
    textFont(MONO);
    textSize(12);
    textAlign(RIGHT, TOP);
    text(String(i + 1), 26, y + 1);
    fill(...codeFarbe(zl.text));
    textAlign(LEFT, TOP);
    textSize(13.5);
    text(zl.text, 40, y);
  }
  pop();
  noStroke();
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(12);
  textAlign(LEFT, BOTTOM);
  const hinweis =
    art === "cpp"
      ? "C++ wie im Unterricht (Küchenaktionen sind eigene Funktionen, z. B. herdEin())."
      : "SCL (Structured Control Language) für die SPS im TIA Portal – vereinfacht. Gleiche Logik, andere Schreibweise!";
  absatz(hinweis, b.x, b.y + b.h - 34, b.w, 12, FARBE.blass);
}

function codeFarbe(txt) {
  const t = txt.trim();
  if (t.startsWith("//")) {
    return FARBE.blass;
  }
  if (/^(if|else|while|for|do|return|int|bool|string|IF|ELSE|END_|WHILE|FOR|REPEAT|UNTIL|FUNCTION|ORGANIZATION_BLOCK|BEGIN|\})/.test(t)) {
    return FARBE.blau;
  }
  return FARBE.text;
}

// =============================================================================
// Auftrag (rechts oben)
// =============================================================================
function zeichneAuftrag() {
  const p = P_AUFTRAG;
  p.titel = modus === "pruefung" ? "Freigabeprüfung" : "Auftrag";
  panel(p);
  const x = p.x + 18;
  const b = p.w - 36;
  let y = p.y + KOPF_H + 14;
  if (modus === "pruefung") {
    zeichnePruefungInfo(x, y, b);
    return;
  }
  const rz = rezept();
  y += absatz(rz.titel, x, y, b, 16, FARBE.text, true) + 6;
  y += absatz(rz.auftrag, x, y, b, 13, FARBE.text) + 8;
  absatz("Tipp: " + rz.tipp, x, y, b, 12, FARBE.blass);
  // Beschriftungen der Knöpfe
  noStroke();
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(12);
  textAlign(LEFT, BOTTOM);
  text("Testfall (Eingabe für den Probelauf)", x, 404);
  // Ergebnisse aller Testfälle
  if (testErgebnisse) {
    let yy = 572;
    for (const e of testErgebnisse) {
      noStroke();
      fill(...(e.ok ? FARBE.gruen : FARBE.akzent));
      textFont(SCHRIFT);
      textStyle(BOLD);
      textSize(12);
      textAlign(LEFT, TOP);
      text(`${e.ok ? "✓" : "✗"} ${e.name}`, x, yy);
      textStyle(NORMAL);
      yy += 15;
      fill(...FARBE.grau);
      textSize(11);
      const zeilen = umbrechen(e.text, b - 12).slice(0, 2);
      for (const zl of zeilen) {
        text(zl, x + 12, yy);
        yy += 13;
      }
      yy += 3;
      if (yy > p.y + p.h - 4) {
        break;
      }
    }
  }
}

function zeichnePruefungInfo(x, y, b) {
  y += absatz(`Schreibtischtest · ${rezept().rang}`, x, y, b, 16, FARBE.text, true) + 8;
  if (aufgabe) {
    y += absatz(aufgabe.frage, x, y, b, 14, FARBE.text) + 6;
  }
  // Rückmeldung
  if (rueckmeldung) {
    const farbe = rueckmeldung.ok ? FARBE.gruen : FARBE.akzent;
    const yy = 366;
    textFont(SCHRIFT);
    textSize(13);
    textStyle(BOLD);
    const zeilen = umbrechen(rueckmeldung.text, b - 22);
    noStroke();
    fill(...hell(farbe, 0.88));
    rect(x, yy, b, zeilen.length * 18 + 16, 8);
    fill(...farbe);
    textAlign(LEFT, TOP);
    textStyle(BOLD);
    for (let i = 0; i < zeilen.length; i++) {
      text(zeilen[i], x + 10, yy + 8 + i * 18);
    }
    textStyle(NORMAL);
  }
  // Serie als Kochmützen
  const yh = 556;
  const abstand = b / SERIE_ZIEL;
  for (let i = 0; i < SERIE_ZIEL; i++) {
    const cx = x + abstand * (i + 0.5);
    const an = i < serie;
    noStroke();
    fill(...(an ? FARBE.flaeche : FARBE.flaeche2));
    stroke(...(an ? FARBE.gruen : FARBE.linie));
    strokeWeight(an ? 2 : 1);
    rect(cx - 13, yh + 4, 26, 12, 2);
    ellipse(cx - 7, yh - 2, 16, 14);
    ellipse(cx + 7, yh - 2, 16, 14);
    ellipse(cx, yh - 8, 18, 16);
  }
  noStroke();
  fill(...FARBE.grau);
  textFont(MONO);
  textSize(12);
  textAlign(CENTER, TOP);
  text(`${serie} / ${SERIE_ZIEL} in Folge`, x + b / 2, yh + 22);
}

// =============================================================================
// Freigaben
// =============================================================================
function zeichneFreigaben() {
  const p = P_FREIGABE;
  panel(p);
  const x = p.x + 16;
  const y = p.y + KOPF_H + 8;
  REZEPTE.forEach((rz, i) => {
    const zy = y + i * 28;
    const ok = freigaben[i];
    if (ok) {
      noStroke();
      fill(...FARBE.akzent);
      circle(x + 11, zy + 11, 20);
      fill(255);
      textFont(SCHRIFT);
      textStyle(BOLD);
      textSize(12);
      textAlign(CENTER, CENTER);
      text("✓", x + 11, zy + 12);
      textStyle(NORMAL);
    } else {
      noFill();
      stroke(...FARBE.linie);
      strokeWeight(2);
      drawingContext.setLineDash([3, 3]);
      circle(x + 11, zy + 11, 20);
      drawingContext.setLineDash([]);
    }
    noStroke();
    fill(...(i === stufe ? FARBE.akzent : ok ? FARBE.text : FARBE.blass));
    textFont(SCHRIFT);
    textStyle(i === stufe ? BOLD : NORMAL);
    textSize(13);
    textAlign(LEFT, CENTER);
    text(`${i + 1} · ${rz.name}`, x + 28, zy + 11);
    textStyle(NORMAL);
    fill(...(ok ? FARBE.grau : FARBE.blass));
    textSize(12);
    textAlign(RIGHT, CENTER);
    text(rz.rang, p.x + p.w - 16, zy + 11);
  });
  const anzahl = freigaben.filter((f) => f).length;
  noStroke();
  textFont(SCHRIFT);
  textSize(11);
  textAlign(LEFT, TOP);
  fill(...(anzahl === 6 ? FARBE.akzent : FARBE.blass));
  text(anzahl === 6 ? "Alle Freigaben: Küchenchef der Laborkantine!" : `${anzahl} von 6 Prüfsiegeln`, x, y + 6 * 28 + 2);
}

function zeichneStempel() {
  if (!stempel) {
    return;
  }
  const t = millis() - stempel.t0;
  if (t > 3200) {
    stempel = null;
    return;
  }
  const p = P_KUECHE;
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2 + 10;
  const fall = 1 - weich(t / 300);
  const alpha = t > 2600 ? map(t, 2600, 3200, 255, 0) : 255;
  push();
  translate(cx, cy);
  rotate(-0.18);
  scale(1 + fall * 1.5);
  noFill();
  stroke(...FARBE.akzent, alpha);
  strokeWeight(7);
  circle(0, 0, 240);
  strokeWeight(2.5);
  circle(0, 0, 212);
  noStroke();
  fill(...FARBE.akzent, alpha);
  textFont(TITEL);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  textSize(30);
  text("FREIGEGEBEN", 0, -8);
  textSize(16);
  text(REZEPTE[stempel.stufe].rang.toUpperCase(), 0, 26);
  textSize(11);
  text("Laborkantine · Algorithmen-Koch", 0, 54);
  textStyle(NORMAL);
  pop();
}

function zeichneFehlerMeldung() {
  if (!fehlerMeldung || millis() - fehlerMeldung.t0 > 8000) {
    return;
  }
  noStroke();
  fill(...FARBE.akzent, 235);
  rect(24, 846, 620, 34, 8);
  fill(255);
  textFont(SCHRIFT);
  textSize(13);
  textAlign(LEFT, CENTER);
  text(kuerze("Interner Fehler (bitte neu laden): " + fehlerMeldung.text, 596), 36, 863);
}
