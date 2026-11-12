// =============================================================================
//  interpreter.js – Algorithmen ausführen und als Code darstellen (ohne p5)
// =============================================================================
//  Ein Programm besteht aus Knoten (Struktogramm-Bausteinen):
//    aktion      Küchenarbeit, z. B. „Pfanne auf den Herd stellen“
//    zuw         Zuweisung, z. B. teller = teller + 1
//    ein / aus   Eingabe (z. B. vom Sensor) / Ausgabe
//    wenn        Verzweigung mit ja- und nein-Zweig
//    solange     kopfgesteuerte Schleife (while)
//    wiederhole  fußgesteuerte Schleife (do … while)
//    fuer        Zählschleife (for)
//    jede        Schleife über alle Elemente einer Liste (Array)
//    aufruf      Funktionsaufruf, optional mit Rückgabewert
//    rueckgabe   return
//    leer        noch nicht gefüllte Lücke
//  Ausdrücke werden als Text in C++-Schreibweise angegeben, z. B.
//  "temperatur >= 220" oder "b == \"veggie\"".
// =============================================================================

const MAX_DURCHLAEUFE = 40; // danach gilt eine Schleife als Endlosschleife

class KochFehler extends Error {
  constructor(text, art) {
    super(text);
    this.art = art || "fehler";
  }
}

// -----------------------------------------------------------------------------
// Ausdrücke
// -----------------------------------------------------------------------------
const SCHLUESSELWOERTER = new Set(["true", "false", "und", "oder", "nicht"]);

// Ausdruck in JavaScript übersetzen: Variablen werden über L("name") gelesen
function uebersetze(ausdruck) {
  let js = "";
  let i = 0;
  const s = ausdruck;
  while (i < s.length) {
    const c = s[i];
    if (c === '"') {
      const ende = s.indexOf('"', i + 1);
      js += s.slice(i, ende + 1);
      i = ende + 1;
    } else if (/[A-Za-zÄÖÜäöüß_]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-zÄÖÜäöüß_0-9]/.test(s[j])) {
        j++;
      }
      const wort = s.slice(i, j);
      if (SCHLUESSELWOERTER.has(wort)) {
        js += wort;
      } else {
        js += `L("${wort}")`;
      }
      i = j;
    } else {
      js += c;
      i++;
    }
  }
  return js;
}

const ausdrucksSpeicher = {};
function werte(ausdruck, z) {
  if (!ausdrucksSpeicher[ausdruck]) {
    ausdrucksSpeicher[ausdruck] = new Function("L", `"use strict"; return (${uebersetze(ausdruck)});`);
  }
  const wert = ausdrucksSpeicher[ausdruck]((name) => leseVariable(z, name));
  // Ganzzahl-Division wie in C++ (int / int)
  return typeof wert === "number" && !Number.isInteger(wert) && ausdruck.indexOf("/") >= 0 ? Math.trunc(wert) : wert;
}

// Darstellung im Struktogramm / PAP: ≥ ≤ ≠
function schoen(ausdruck) {
  return String(ausdruck).replace(/>=/g, "≥").replace(/<=/g, "≤").replace(/!=/g, "≠");
}

// Darstellung in SCL: Variablen mit #, = statt ==, <> statt !=, 'Text'
function sclAusdruck(ausdruck) {
  let out = "";
  let i = 0;
  const s = String(ausdruck);
  while (i < s.length) {
    const c = s[i];
    if (c === '"') {
      const ende = s.indexOf('"', i + 1);
      out += "'" + s.slice(i + 1, ende) + "'";
      i = ende + 1;
    } else if (/[A-Za-zÄÖÜäöüß_]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-zÄÖÜäöüß_0-9]/.test(s[j])) {
        j++;
      }
      const wort = s.slice(i, j);
      if (wort === "true" || wort === "false") {
        out += wort.toUpperCase();
      } else if (s[j] === "(") {
        out += `"${wort}"`; // Funktionsaufruf (FC)
      } else {
        out += "#" + wort;
      }
      i = j;
    } else if (s.startsWith("==", i)) {
      out += "=";
      i += 2;
    } else if (s.startsWith("!=", i)) {
      out += "<>";
      i += 2;
    } else if (s.startsWith("&&", i)) {
      out += "AND";
      i += 2;
    } else if (s.startsWith("||", i)) {
      out += "OR";
      i += 2;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

// -----------------------------------------------------------------------------
// Variablen mit Geltungsbereich: global (Hauptprogramm) und lokal (Funktion)
// -----------------------------------------------------------------------------
function leseVariable(z, name) {
  const rahmen = z.rahmen[z.rahmen.length - 1];
  if (rahmen && Object.prototype.hasOwnProperty.call(rahmen.vars, name)) {
    return rahmen.vars[name];
  }
  if (!rahmen && Object.prototype.hasOwnProperty.call(z.vars, name)) {
    return z.vars[name];
  }
  if (rahmen) {
    throw new KochFehler(`In der Funktion ${rahmen.name}() ist die Variable „${name}“ nicht bekannt – sie gehört zum Hauptprogramm.`, "geltung");
  }
  throw new KochFehler(`Die Variable „${name}“ ist hier nicht bekannt. Wurde sie vorher angelegt?`, "geltung");
}

function schreibeVariable(z, name, wert, neu) {
  const rahmen = z.rahmen[z.rahmen.length - 1];
  if (rahmen) {
    if (!neu && !Object.prototype.hasOwnProperty.call(rahmen.vars, name)) {
      throw new KochFehler(`In der Funktion ${rahmen.name}() gibt es keine Variable „${name}“.`, "geltung");
    }
    rahmen.vars[name] = wert;
    return;
  }
  if (!neu && !Object.prototype.hasOwnProperty.call(z.vars, name)) {
    throw new KochFehler(`Die Variable „${name}“ ist hier nicht bekannt. Wurde sie vorher angelegt?`, "geltung");
  }
  z.vars[name] = wert;
}

function wertText(w) {
  if (w === undefined || w === null) {
    return "–";
  }
  if (typeof w === "string") {
    return `"${w}"`;
  }
  if (typeof w === "boolean") {
    return w ? "true" : "false";
  }
  if (Array.isArray(w)) {
    return "[" + w.map(wertText).join(", ") + "]";
  }
  return String(w);
}

// -----------------------------------------------------------------------------
// Texte der Knoten (Struktogramm / PAP)
// -----------------------------------------------------------------------------
function knotenText(k) {
  switch (k.t) {
    case "aktion":
      return k.txt;
    case "zuw":
      return `${k.ziel} = ${schoen(k.ausdruck)}`;
    case "ein":
      return `Eingabe: ${k.ziel} ← ${k.quelle}`;
    case "aus":
      return `Ausgabe: ${k.ausdruck}`;
    case "wenn":
      return k.bed ? schoen(k.bed) + " ?" : "??? ";
    case "solange":
      return k.bed ? `solange ${schoen(k.bed)}` : "solange ???";
    case "wiederhole":
      return k.bed ? `solange ${schoen(k.bed)}` : "solange ???";
    case "fuer":
      return `für ${k.var} von ${k.von === null || k.von === undefined ? "???" : k.von} bis ${k.bis === null || k.bis === undefined ? "???" : k.bis}`;
    case "jede":
      return k.offen ? "Schleife ???" : `für jede ${k.var} in ${k.liste}`;
    case "aufruf":
      return aufrufText(k);
    case "rueckgabe":
      return `Rückgabe ${k.ausdruck}`;
    case "leer":
      return "???";
    default:
      return "?";
  }
}

function aufrufText(k) {
  const ruf = `${k.name}(${k.args.join(", ")})`;
  if (!k.ziel) {
    return ruf;
  }
  return k.plus ? `${k.ziel} = ${k.ziel} + ${ruf}` : `${k.ziel} = ${ruf}`;
}

// -----------------------------------------------------------------------------
// Code-Erzeugung: Liste von Zeilen {text, knoten, tiefe}
// -----------------------------------------------------------------------------
function cppZeilen(prog) {
  const z = [];
  const zeile = (text, knoten, tiefe) => z.push({ text: "    ".repeat(tiefe) + text, knoten });
  const block = (liste, t) => {
    for (const k of liste) {
      knotenCpp(k, t);
    }
  };
  function knotenCpp(k, t) {
    switch (k.t) {
      case "aktion":
        zeile(k.cpp, k, t);
        break;
      case "zuw":
        zeile(`${k.neu ? (k.typ || "int") + " " : ""}${k.ziel} = ${k.ausdruck};`, k, t);
        break;
      case "ein":
        zeile(`cin >> ${k.ziel};   // ${k.quelle}`, k, t);
        break;
      case "aus":
        zeile(`cout << ${k.ausdruck.split(",").map((s) => s.trim()).join(' << " " << ')} << endl;`, k, t);
        break;
      case "wenn":
        zeile(`if (${k.bed || "???"}) {`, k, t);
        block(k.ja, t + 1);
        if (k.nein && k.nein.length) {
          zeile("} else {", k, t);
          block(k.nein, t + 1);
        }
        zeile("}", k, t);
        break;
      case "solange":
        zeile(`while (${k.bed || "???"}) {`, k, t);
        block(k.rumpf, t + 1);
        zeile("}", k, t);
        break;
      case "wiederhole":
        zeile("do {", k, t);
        block(k.rumpf, t + 1);
        zeile(`} while (${k.bed || "???"});`, k, t);
        break;
      case "fuer":
        zeile(`for (int ${k.var} = ${k.von}; ${k.var} <= ${k.bis}; ${k.var}++) {`, k, t);
        block(k.rumpf, t + 1);
        zeile("}", k, t);
        break;
      case "jede":
        zeile(`for (${k.typ || "string"} ${k.var} : ${k.liste}) {`, k, t);
        block(k.rumpf, t + 1);
        zeile("}", k, t);
        break;
      case "aufruf":
        zeile((k.neu && k.ziel ? "int " : "") + aufrufText(k) + ";", k, t);
        break;
      case "rueckgabe":
        zeile(`return ${k.ausdruck};`, k, t);
        break;
      default:
        zeile("???   // Lücke füllen", k, t);
    }
  }
  for (const f of prog.funktionen || []) {
    zeile(`${f.typ || "int"} ${f.name}(${f.params.map((p) => `${p.typ} ${p.name}`).join(", ")}) {`, null, 0);
    block(f.rumpf, 1);
    zeile("}", null, 0);
    zeile("", null, 0);
  }
  zeile("int main() {", null, 0);
  block(prog.haupt, 1);
  zeile("    return 0;", null, 0);
  zeile("}", null, 0);
  return z;
}

function sclZeilen(prog) {
  const z = [];
  const zeile = (text, knoten, tiefe) => z.push({ text: "    ".repeat(tiefe) + text, knoten });
  const block = (liste, t) => {
    for (const k of liste) {
      knotenScl(k, t);
    }
  };
  function knotenScl(k, t) {
    switch (k.t) {
      case "aktion":
        zeile(k.scl, k, t);
        break;
      case "zuw":
        zeile(`#${k.ziel} := ${sclAusdruck(k.ausdruck)};`, k, t);
        break;
      case "ein":
        zeile(`#${k.ziel} := "${k.quelle.replace(/\s/g, "_")}";`, k, t);
        break;
      case "aus":
        zeile(`"HMI".Anzeige := ${sclAusdruck(k.ausdruck.split(",")[0].trim())};`, k, t);
        break;
      case "wenn":
        zeile(`IF ${k.bed ? sclAusdruck(k.bed) : "???"} THEN`, k, t);
        block(k.ja, t + 1);
        if (k.nein && k.nein.length) {
          zeile("ELSE", k, t);
          block(k.nein, t + 1);
        }
        zeile("END_IF;", k, t);
        break;
      case "solange":
        zeile(`WHILE ${k.bed ? sclAusdruck(k.bed) : "???"} DO`, k, t);
        block(k.rumpf, t + 1);
        zeile("END_WHILE;", k, t);
        break;
      case "wiederhole":
        zeile("REPEAT", k, t);
        block(k.rumpf, t + 1);
        zeile(`UNTIL NOT (${k.bed ? sclAusdruck(k.bed) : "???"})`, k, t);
        zeile("END_REPEAT;", k, t);
        break;
      case "fuer":
        zeile(`FOR #${k.var} := ${sclAusdruck(String(k.von))} TO ${sclAusdruck(String(k.bis))} DO`, k, t);
        block(k.rumpf, t + 1);
        zeile("END_FOR;", k, t);
        break;
      case "jede":
        zeile(`FOR #k := 0 TO #anzahl - 1 DO`, k, t);
        zeile(`#${k.var} := #${k.liste}[#k];`, k, t + 1);
        block(k.rumpf, t + 1);
        zeile("END_FOR;", k, t);
        break;
      case "aufruf": {
        const ruf = `"${k.name}"(${k.args.map((a) => sclAusdruck(a)).join(", ")})`;
        zeile(k.ziel ? `#${k.ziel} := ${k.plus ? "#" + k.ziel + " + " : ""}${ruf};` : ruf + ";", k, t);
        break;
      }
      case "rueckgabe":
        zeile(`#${"RET_VAL"} := ${sclAusdruck(k.ausdruck)};`, k, t);
        zeile("RETURN;", k, t);
        break;
      default:
        zeile("???   // Lücke füllen", k, t);
    }
  }
  for (const f of prog.funktionen || []) {
    zeile(`FUNCTION "${f.name}" : Int`, null, 0);
    zeile(`// Eingänge: ${f.params.map((p) => p.name).join(", ")}`, null, 0);
    zeile("BEGIN", null, 0);
    block(f.rumpf, 1);
    zeile("END_FUNCTION", null, 0);
    zeile("", null, 0);
  }
  zeile(`ORGANIZATION_BLOCK "Main"`, null, 0);
  zeile("BEGIN", null, 0);
  block(prog.haupt, 1);
  zeile("END_ORGANIZATION_BLOCK", null, 0);
  return z;
}

// -----------------------------------------------------------------------------
// Ausführung als Generator: jeder yield ist ein Schritt
// -----------------------------------------------------------------------------
function neuerZustand(eingabe, kueche) {
  return { vars: {}, rahmen: [], eingabe: Object.assign({}, eingabe), k: kueche, ausgabe: [], schritte: 0 };
}

function* fuehreAus(prog, z) {
  yield* fuehreBlock(prog.haupt, z, prog);
}

function* fuehreBlock(liste, z, prog) {
  for (const k of liste) {
    yield* fuehreKnoten(k, z, prog);
  }
}

function* fuehreKnoten(k, z, prog) {
  switch (k.t) {
    case "leer":
      throw new KochFehler("Im Rezept ist noch eine Lücke leer (???). Erst alle Lücken füllen!", "luecke");
    case "aktion":
      if (k.f) {
        k.f(z);
      }
      yield { knoten: k, text: k.txt };
      return;
    case "zuw": {
      const w = werte(k.ausdruck, z);
      schreibeVariable(z, k.ziel, w, !!k.neu);
      yield { knoten: k, text: `${k.ziel} = ${schoen(k.ausdruck)} → ${k.ziel} ist jetzt ${wertText(w)}` };
      return;
    }
    case "ein": {
      const w = z.eingabe[k.ziel];
      schreibeVariable(z, k.ziel, w, true);
      if (k.f) {
        k.f(z, w);
      }
      yield { knoten: k, text: `${k.quelle} liefert ${wertText(w)}` };
      return;
    }
    case "aus": {
      const teile = k.ausdruck.split(",").map((s) => s.trim());
      const werteListe = teile.map((t) => wertText(werte(t, z)));
      z.ausgabe.push(teile.map((t, i) => `${t} = ${werteListe[i]}`).join(", "));
      yield { knoten: k, text: `Ausgabe: ${teile.map((t, i) => `${t} = ${werteListe[i]}`).join(", ")}` };
      return;
    }
    case "wenn": {
      if (!k.bed) {
        throw new KochFehler("Die Bedingung der Verzweigung fehlt noch (???).", "luecke");
      }
      const b = !!werte(k.bed, z);
      yield { knoten: k, text: `Bedingung ${schoen(k.bed)} ist ${b ? "wahr → ja-Zweig" : "falsch → nein-Zweig"}`, zweig: b };
      yield* fuehreBlock(b ? k.ja : k.nein || [], z, prog);
      return;
    }
    case "solange": {
      if (!k.bed) {
        throw new KochFehler("Die Bedingung der Schleife fehlt noch (???).", "luecke");
      }
      let n = 0;
      for (;;) {
        const b = !!werte(k.bed, z);
        yield { knoten: k, text: `Prüfen: ${schoen(k.bed)} ist ${b ? "wahr → Schleife läuft" : "falsch → Schleife endet"}`, zweig: b };
        if (!b) {
          break;
        }
        n++;
        if (n > MAX_DURCHLAEUFE) {
          throw new KochFehler(`Endlosschleife! Nach ${MAX_DURCHLAEUFE} Durchläufen ist ${schoen(k.bed)} immer noch wahr. Der Koch zieht den Notaus.`, "endlos");
        }
        yield* fuehreBlock(k.rumpf, z, prog);
      }
      return;
    }
    case "wiederhole": {
      if (!k.bed) {
        throw new KochFehler("Die Bedingung der Schleife fehlt noch (???).", "luecke");
      }
      let n = 0;
      for (;;) {
        n++;
        if (n > MAX_DURCHLAEUFE) {
          throw new KochFehler(`Endlosschleife! Nach ${MAX_DURCHLAEUFE} Durchläufen ist ${schoen(k.bed)} immer noch wahr. Der Koch zieht den Notaus.`, "endlos");
        }
        yield* fuehreBlock(k.rumpf, z, prog);
        const b = !!werte(k.bed, z);
        yield { knoten: k, text: `Prüfen (am Ende): ${schoen(k.bed)} ist ${b ? "wahr → noch einmal" : "falsch → Schleife endet"}`, zweig: b };
        if (!b) {
          break;
        }
      }
      return;
    }
    case "fuer": {
      if (k.von === null || k.von === undefined || k.bis === null || k.bis === undefined) {
        throw new KochFehler("Start- oder Endwert der Zählschleife fehlt noch (???).", "luecke");
      }
      const von = werte(String(k.von), z);
      const bis = werte(String(k.bis), z);
      schreibeVariable(z, k.var, von, true);
      let n = 0;
      for (;;) {
        const i = leseVariable(z, k.var);
        const b = i <= bis;
        yield { knoten: k, text: `${k.var} = ${i}: ${k.var} ≤ ${bis} ist ${b ? "wahr → Durchlauf" : "falsch → Schleife endet"}`, zweig: b };
        if (!b) {
          break;
        }
        n++;
        if (n > MAX_DURCHLAEUFE) {
          throw new KochFehler("Endlosschleife!", "endlos");
        }
        yield* fuehreBlock(k.rumpf, z, prog);
        schreibeVariable(z, k.var, leseVariable(z, k.var) + 1);
      }
      return;
    }
    case "jede": {
      if (k.offen) {
        throw new KochFehler("Die Schleife ist noch nicht festgelegt (???).", "luecke");
      }
      const liste = werte(k.liste, z);
      for (let i = 0; i < liste.length; i++) {
        schreibeVariable(z, k.var, liste[i], true);
        yield { knoten: k, text: `Element ${i + 1} von ${liste.length}: ${k.var} = ${wertText(liste[i])}`, zweig: true };
        yield* fuehreBlock(k.rumpf, z, prog);
      }
      yield { knoten: k, text: `Alle ${liste.length} Elemente bearbeitet → Schleife endet`, zweig: false };
      return;
    }
    case "aufruf": {
      const f = (prog.funktionen || []).find((x) => x.name === k.name);
      const args = k.args.map((a) => werte(a, z));
      const rahmen = { name: k.name, vars: {} };
      f.params.forEach((p, i) => {
        rahmen.vars[p.name] = args[i];
      });
      z.rahmen.push(rahmen);
      yield { knoten: k, text: `Aufruf ${k.name}(${args.map(wertText).join(", ")}): Die Parameter werden als lokale Variablen angelegt.`, aufruf: true };
      let rueck;
      try {
        yield* fuehreBlock(f.rumpf, z, prog);
      } catch (e) {
        if (e && e.rueckgabe !== undefined) {
          rueck = e.rueckgabe;
        } else {
          throw e;
        }
      }
      z.rahmen.pop();
      if (k.ziel) {
        const alt = k.plus ? leseVariable(z, k.ziel) : 0;
        schreibeVariable(z, k.ziel, (k.plus ? alt : 0) + (rueck === undefined ? 0 : rueck), !!k.neu);
        yield { knoten: k, text: `${k.name}() liefert ${wertText(rueck)} zurück. Die lokalen Variablen verschwinden. ${k.ziel} ist jetzt ${wertText(leseVariable(z, k.ziel))}.` };
      } else {
        yield { knoten: k, text: `${k.name}() ist fertig. ${rueck !== undefined ? `Der Rückgabewert ${wertText(rueck)} wird nicht gespeichert und geht verloren!` : ""}` };
      }
      return;
    }
    case "rueckgabe": {
      const w = werte(k.ausdruck, z);
      yield { knoten: k, text: `Rückgabe ${wertText(w)}` };
      throw { rueckgabe: w };
    }
    default:
      throw new KochFehler("Unbekannter Baustein.");
  }
}

// Programm komplett ausführen (ohne Animation), z. B. für Testfälle
function fuehreKomplett(prog, z, maxSchritte) {
  const gen = fuehreAus(prog, z);
  let n = 0;
  for (;;) {
    const r = gen.next();
    if (r.done) {
      return { ok: true, schritte: n };
    }
    n++;
    if (n > (maxSchritte || 2000)) {
      throw new KochFehler("Zu viele Schritte.", "endlos");
    }
  }
}

// Alle Knoten eines Programms (für Lücken-Markierung)
function alleKnoten(liste, aus) {
  const out = aus || [];
  for (const k of liste) {
    out.push(k);
    for (const feld of ["ja", "nein", "rumpf"]) {
      if (k[feld]) {
        alleKnoten(k[feld], out);
      }
    }
  }
  return out;
}

if (typeof module !== "undefined") {
  module.exports = { KochFehler, werte, schoen, sclAusdruck, knotenText, cppZeilen, sclZeilen, neuerZustand, fuehreAus, fuehreKomplett, wertText, leseVariable, alleKnoten };
}
