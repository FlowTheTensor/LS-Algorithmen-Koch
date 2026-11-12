// =============================================================================
//  rezepte.js – die sechs Freigabestufen (Rezepte), Lücken, Testfälle, Prüfung
// =============================================================================
//  Jedes Rezept hat
//    luecken     Auswahlmöglichkeiten, die direkt im Struktogramm gewählt werden
//    bau(w)      baut das Programm aus der Auswahl w = {lueckenId: index}
//    testfaelle  Eingaben und Erwartung – ein Rezept funktioniert erst, wenn
//                ALLE Testfälle klappen (Funktionsprüfung)
//    spalten     Spalten der Variablentabelle (Schreibtischtest)
//    kueche()    Startzustand der Küche
//    pruefung()  erzeugt eine Schreibtischtest-Aufgabe für die Freigabeprüfung
// =============================================================================

const SERIE_ZIEL = 5;

// --- kleine Bausteine -----------------------------------------------------
function aktion(txt, cpp, scl, station, f) {
  return { t: "aktion", txt, cpp, scl, station, f };
}
function zuw(ziel, ausdruck, neu, typ) {
  return { t: "zuw", ziel, ausdruck: String(ausdruck), neu: !!neu, typ };
}
function ein(ziel, quelle, f) {
  return { t: "ein", ziel, quelle, f };
}
function aus(ausdruck) {
  return { t: "aus", ausdruck };
}
function wenn(bed, ja, nein) {
  return { t: "wenn", bed, ja, nein: nein || [] };
}
function solange(bed, rumpf) {
  return { t: "solange", bed, rumpf };
}
function wiederhole(bed, rumpf) {
  return { t: "wiederhole", bed, rumpf };
}
function fuer(v, von, bis, rumpf) {
  return { t: "fuer", var: v, von, bis, rumpf };
}
function jede(v, liste, rumpf, typ) {
  return { t: "jede", var: v, liste, rumpf, typ };
}
function aufruf(name, args, ziel, plus, neu) {
  return { t: "aufruf", name, args, ziel, plus: !!plus, neu: !!neu };
}
function rueckgabe(ausdruck) {
  return { t: "rueckgabe", ausdruck: String(ausdruck) };
}
function leer(id) {
  return { t: "leer", luecke: id };
}
// Knoten als Lücke markieren
function L(id, knoten) {
  knoten.luecke = id;
  return knoten;
}

function zufall(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function waehle(liste) {
  return liste[zufall(0, liste.length - 1)];
}

// Spalte der Variablentabelle für eine Variable
function varSpalte(name, lokal) {
  return {
    name: lokal ? `${name} (lokal)` : name,
    lokal: !!lokal,
    lies: (z) => {
      if (lokal) {
        const r = z.rahmen[z.rahmen.length - 1];
        return r && Object.prototype.hasOwnProperty.call(r.vars, name) ? r.vars[name] : undefined;
      }
      return Object.prototype.hasOwnProperty.call(z.vars, name) ? z.vars[name] : undefined;
    },
  };
}

function kuecheLeer() {
  return {
    station: "start",
    herd: false,
    pfanneAufHerd: false,
    pfanne: "",
    ei: "",
    ofen: null,
    topf: null,
    teller: [],
    tafel: null,
    stapel: 0,
    heizt: false,
    alarm: false,
  };
}

function lv(z, name) {
  return leseVariable(z, name);
}

// =============================================================================
// Stufe 1 · Sequenz – Spiegelei
// =============================================================================
function schritteSpiegelei() {
  return [
    aktion("Pfanne auf den Herd stellen", "pfanneAufHerd();", '"Pfanne_auf_Herd"();', "herd", (z) => {
      z.k.pfanneAufHerd = true;
      z.k.pfanne = "leer";
    }),
    aktion("Herd einschalten", "herdEin();", '"Herd_ein"();', "herd", (z) => {
      z.k.herd = true;
    }),
    aktion("Öl in die Pfanne geben", "oelHinein();", '"Oel_hinein"();', "regal", (z) => {
      if (!z.k.pfanneAufHerd) {
        throw new KochFehler("Das Öl läuft über die Herdplatte – es steht noch gar keine Pfanne darauf!");
      }
      z.k.pfanne = z.k.pfanne === "Ei" ? "Ei + Öl" : "Öl";
    }),
    aktion("Ei aufschlagen und in die Pfanne geben", "eiHinein();", '"Ei_hinein"();', "regal", (z) => {
      if (!z.k.pfanneAufHerd) {
        throw new KochFehler("Platsch! Das Ei landet direkt auf der Herdplatte – erst die Pfanne hinstellen.");
      }
      if (z.k.pfanne !== "Öl") {
        throw new KochFehler("Ohne Öl klebt das Ei sofort in der Pfanne fest. Erst Öl, dann Ei!");
      }
      z.k.pfanne = "Öl + Ei";
      z.k.ei = "roh";
    }),
    aktion("3 Minuten braten", "braten(3);", '"Braten"(Minuten := 3);', "herd", (z) => {
      if (z.k.ei !== "roh") {
        throw new KochFehler("Der Koch brät 3 Minuten lang … eine Pfanne ohne Ei.");
      }
      if (!z.k.herd) {
        throw new KochFehler("3 Minuten gewartet – aber der Herd ist aus. Das Ei ist noch roh!");
      }
      z.k.ei = "gebraten";
      z.k.pfanne = "Spiegelei";
    }),
    aktion("Spiegelei auf den Teller legen", "aufTeller();", '"Auf_Teller"();', "teller", (z) => {
      if (z.k.ei !== "gebraten") {
        throw new KochFehler(z.k.ei === "roh" ? "Iiih, ein rohes Ei auf dem Teller!" : "Es gibt noch nichts, was auf den Teller könnte.");
      }
      z.k.teller.push("ei");
      z.k.pfanne = "leer";
      z.k.ei = "serviert";
    }),
  ];
}

const REZEPT_SEQUENZ = {
  id: "sequenz",
  name: "Sequenz",
  rang: "Küchenhilfe",
  titel: "Spiegelei braten",
  untertitel: "Stufe 1 · Sequenz: Anweisungen der Reihe nach",
  auftrag:
    "Ein Gast bestellt ein Spiegelei. Bringe die sechs Arbeitsschritte in eine Reihenfolge, die funktioniert. Klicke in jedes Feld des Struktogramms und wähle einen Schritt.",
  tipp: "Ein Programm wird Anweisung für Anweisung von oben nach unten ausgeführt. Manche Schritte hängen voneinander ab – andere dürfen getauscht werden.",
  luecken: [1, 2, 3, 4, 5, 6].map((n) => ({ id: "s" + n, label: `Schritt ${n}`, optionen: schritteSpiegelei().map((s) => s.txt) })),
  bau(w) {
    const haupt = [];
    for (let n = 1; n <= 6; n++) {
      const i = w["s" + n];
      haupt.push(i >= 0 ? L("s" + n, schritteSpiegelei()[i]) : leer("s" + n));
    }
    return { haupt };
  },
  kueche: () => kuecheLeer(),
  spalten: [
    { name: "Herd", lies: (z) => (z.k.herd ? "an" : "aus") },
    { name: "Pfanne", lies: (z) => (z.k.pfanneAufHerd ? z.k.pfanne : "im Schrank") },
    { name: "Ei", lies: (z) => z.k.ei || "im Karton" },
    { name: "Teller", lies: (z) => (z.k.teller.length ? "Spiegelei" : "leer") },
  ],
  testfaelle: [
    {
      name: "1 Spiegelei",
      eingabe: {},
      erwartet: (z) => {
        const doppelt = z.k.teller.length > 1;
        if (z.k.teller.length === 1 && !doppelt) {
          return { ok: true, text: "Ein perfektes Spiegelei liegt auf dem Teller." };
        }
        return { ok: false, text: "Auf dem Teller liegt kein Spiegelei." };
      },
    },
  ],
  pruefung() {
    const eier = zufall(2, 4);
    const mehl = waehle([100, 150, 200, 250]);
    const faktor = waehle([50, 100]);
    const haupt = [
      zuw("eier", eier, true),
      zuw("mehl", mehl, true),
      zuw("milch", `eier * ${faktor}`, true),
      zuw("mehl", "mehl + milch / 2"),
      zuw("eier", "eier + 1"),
    ];
    if (Math.random() < 0.5) {
      // Reihenfolge tauschen: eier wird schon vor milch erhöht
      haupt.splice(2, 3, zuw("eier", "eier + 1"), zuw("milch", `eier * ${faktor}`, true), zuw("mehl", "mehl + milch / 2"));
    }
    const frageVar = waehle(["mehl", "milch", "eier"]);
    return {
      prog: { haupt },
      eingabe: {},
      frageVar,
      frage: `Welchen Wert hat „${frageVar}“, wenn das Programm fertig ist?`,
      spalten: [varSpalte("eier"), varSpalte("mehl"), varSpalte("milch")],
    };
  },
};

// =============================================================================
// Stufe 2 · Verzweigung – Pizza-Ofen mit Temperatursensor
// =============================================================================
function aktionenOfen() {
  return [
    aktion("Pizza einschieben", "pizzaEinschieben();", '"Pizza_einschieben"();', "ofen", (z) => {
      z.k.ofen.pizza = true;
      z.k.heizt = false;
    }),
    aktion("weiter vorheizen", "vorheizen();", '"Vorheizen"();', "ofen", (z) => {
      z.k.heizt = true;
    }),
    aktion("Notaus: Ofen abschalten", "notaus();", '"Notaus"();', "ofen", (z) => {
      z.k.alarm = true;
      z.k.heizt = false;
    }),
  ];
}

const BEDINGUNGEN_OFEN = ["temperatur >= 220", "temperatur <= 220", "temperatur == 220"];

const REZEPT_VERZWEIGUNG = {
  id: "verzweigung",
  name: "Verzweigung",
  rang: "Beikoch",
  titel: "Pizza-Ofen mit Sensor",
  untertitel: "Stufe 2 · Verzweigung: wenn … dann … sonst",
  auftrag:
    "Der Temperatursensor im Ofen meldet seinen Wert an den Laborserver. Die Pizza darf erst ab 220 °C hinein, darunter wird weiter vorgeheizt. Über 300 °C greift der Notaus. Fülle die Lücken der inneren Verzweigung.",
  tipp: "Teste mit allen Testfällen – vor allem mit dem Grenzwert 220 °C. Genau an Grenzen passieren die meisten Fehler.",
  luecken: [
    { id: "bed", label: "Bedingung", optionen: BEDINGUNGEN_OFEN.map(schoen) },
    { id: "ja", label: "ja-Zweig", optionen: aktionenOfen().map((a) => a.txt) },
    { id: "nein", label: "nein-Zweig", optionen: aktionenOfen().map((a) => a.txt) },
  ],
  bau(w) {
    const innen = wenn(
      w.bed >= 0 ? BEDINGUNGEN_OFEN[w.bed] : null,
      [w.ja >= 0 ? L("ja", aktionenOfen()[w.ja]) : leer("ja")],
      [w.nein >= 0 ? L("nein", aktionenOfen()[w.nein]) : leer("nein")]
    );
    innen.luecke = "bed";
    return {
      haupt: [
        ein("temperatur", "Ofensensor", (z, t) => {
          z.k.ofen.temp = t;
        }),
        wenn("temperatur > 300", [aktionenOfen()[2]], [innen]),
      ],
    };
  },
  kueche: () => Object.assign(kuecheLeer(), { ofen: { temp: null, pizza: false } }),
  spalten: [
    varSpalte("temperatur"),
    { name: "Pizza", lies: (z) => (z.k.ofen.pizza ? "im Ofen" : "wartet") },
    { name: "Heizung", lies: (z) => (z.k.heizt ? "heizt" : "–") },
    { name: "Notaus", lies: (z) => (z.k.alarm ? "AUS!" : "–") },
  ],
  testfaelle: [180, 220, 250, 320].map((t) => ({
    name: `Sensor meldet ${t} °C`,
    eingabe: { temperatur: t },
    erwartet: (z) => {
      if (t > 300) {
        return z.k.alarm && !z.k.ofen.pizza ? { ok: true, text: "Notaus ausgelöst." } : { ok: false, text: "Über 300 °C muss der Notaus kommen!" };
      }
      if (t >= 220) {
        if (z.k.alarm) {
          return { ok: false, text: `Notaus bei ${t} °C? Der Ofen ist doch in Ordnung.` };
        }
        return z.k.ofen.pizza ? { ok: true, text: "Pizza ist im Ofen." } : { ok: false, text: `Bei ${t} °C müsste die Pizza hinein.` };
      }
      if (z.k.alarm) {
        return { ok: false, text: `Notaus bei ${t} °C? Der Ofen ist doch in Ordnung.` };
      }
      return !z.k.ofen.pizza && z.k.heizt
        ? { ok: true, text: "Richtig: weiter vorheizen." }
        : { ok: false, text: `Bei ${t} °C ist der Ofen zu kalt – die Pizza wird matschig.` };
    },
  })),
  pruefung() {
    const t1 = waehle([200, 210, 220, 230]);
    const t2 = waehle([160, 170, 180, 190]);
    const temp = waehle([t1, t2, t1 + zufall(1, 40), t2 + zufall(1, t1 - t2 - 1), t2 - zufall(1, 30)]);
    const zeiten = [zufall(8, 12), zufall(13, 17), zufall(20, 28)];
    const zusatz = waehle([3, 5]);
    const haupt = [
      ein("temperatur", "Ofensensor"),
      zuw("backzeit", 0, true),
      wenn(`temperatur >= ${t1}`, [zuw("backzeit", zeiten[0])], [
        wenn(`temperatur >= ${t2}`, [zuw("backzeit", zeiten[1])], [zuw("backzeit", zeiten[2])]),
      ]),
      zuw("gesamt", `backzeit + ${zusatz}`, true),
    ];
    const frageVar = waehle(["backzeit", "gesamt"]);
    return {
      prog: { haupt },
      eingabe: { temperatur: temp },
      frageVar,
      frage: `Der Sensor meldet ${temp} °C. Welchen Wert hat „${frageVar}“ am Ende?`,
      spalten: [varSpalte("temperatur"), varSpalte("backzeit"), varSpalte("gesamt")],
    };
  },
};

// =============================================================================
// Stufe 3 · Zählschleife – Pfannkuchen
// =============================================================================
const VON_OPT = ["1", "0", "2"];
const BIS_OPT = ["anzahl", "anzahl - 1", "anzahl + 1"];
const ZAEHL_OPT = [zuw("teller", "teller + 1"), zuw("teller", "1")];

const REZEPT_ZAEHLSCHLEIFE = {
  id: "zaehlschleife",
  name: "Zählschleife",
  rang: "Jungkoch",
  titel: "Pfannkuchen für die Klasse",
  untertitel: "Stufe 3 · Zählschleife: für i von … bis …",
  auftrag:
    "Die Bestellung kommt über das Kassensystem: „anzahl“ Pfannkuchen. Die Schleife soll genau so oft laufen, wie Pfannkuchen bestellt sind, und am Ende soll „teller“ die richtige Zahl anzeigen.",
  tipp: "Zähle nach: Wie oft läuft „für i von 0 bis 3“? Mehrere Lösungen können richtig sein!",
  luecken: [
    { id: "von", label: "Startwert", optionen: VON_OPT.map((v) => `von ${v}`) },
    { id: "bis", label: "Endwert", optionen: BIS_OPT.map((v) => `bis ${v}`) },
    { id: "zaehl", label: "Zählen", optionen: ZAEHL_OPT.map((k) => knotenText(k)) },
  ],
  bau(w) {
    const schleife = fuer("i", w.von >= 0 ? VON_OPT[w.von] : null, w.bis >= 0 ? BIS_OPT[w.bis] : null, [
      aktion("Teig in die Pfanne geben", "teigHinein();", '"Teig_hinein"();', "regal", (z) => {
        z.k.herd = true;
        z.k.pfanneAufHerd = true;
        z.k.pfanne = "Teig";
      }),
      aktion("Pfannkuchen wenden und auf den Stapel", "wendenUndStapeln();", '"Wenden"();', "teller", (z) => {
        z.k.pfanne = "leer";
        z.k.stapel++;
      }),
      w.zaehl >= 0 ? L("zaehl", Object.assign({}, ZAEHL_OPT[w.zaehl])) : leer("zaehl"),
    ]);
    schleife.luecke = "von";
    schleife.luecke2 = "bis";
    return {
      haupt: [
        ein("anzahl", "Kassensystem", (z, n) => {
          z.k.tafel = { titel: "Bestellung", zeilen: [`${n} Pfannkuchen`] };
        }),
        zuw("teller", 0, true),
        schleife,
        aus("teller"),
      ],
    };
  },
  kueche: () => Object.assign(kuecheLeer(), { pfanneAufHerd: true, pfanne: "leer" }),
  spalten: [varSpalte("anzahl"), varSpalte("i"), varSpalte("teller"), { name: "Stapel", lies: (z) => z.k.stapel }],
  testfaelle: [3, 5, 1].map((n) => ({
    name: `${n} Pfannkuchen bestellt`,
    eingabe: { anzahl: n },
    erwartet: (z) => {
      const t = z.vars.teller;
      if (z.k.stapel !== n) {
        return { ok: false, text: `Es wurden ${z.k.stapel} statt ${n} Pfannkuchen gebacken.` };
      }
      if (t !== n) {
        return { ok: false, text: `Stapel stimmt, aber „teller“ zeigt ${t} statt ${n}.` };
      }
      return { ok: true, text: `${n} Pfannkuchen, Zähler stimmt.` };
    },
  })),
  pruefung() {
    const von = zufall(0, 2);
    const bis = zufall(von + 2, 6);
    const art = waehle(["konstant", "i"]);
    const k = zufall(2, 4);
    const rumpf = [art === "konstant" ? zuw("teller", `teller + ${k}`) : zuw("teller", "teller + i"), zuw("runden", "runden + 1")];
    const haupt = [zuw("teller", 0, true), zuw("runden", 0, true), fuer("i", String(von), String(bis), rumpf)];
    const frageVar = waehle(["teller", "runden"]);
    return {
      prog: { haupt },
      eingabe: {},
      frageVar,
      frage: `Welchen Wert hat „${frageVar}“, wenn die Schleife fertig ist?`,
      spalten: [varSpalte("i"), varSpalte("teller"), varSpalte("runden")],
    };
  },
};

// =============================================================================
// Stufe 4 · Bedingte Schleife – Nudelwasser
// =============================================================================
const BED_TOPF = ["temperatur < 100", "temperatur != 100", "temperatur > 100"];
const HEIZ_OPT = [zuw("temperatur", "temperatur + 15"), zuw("temperatur", "temperatur - 15")];

const REZEPT_SCHLEIFE = {
  id: "schleife",
  name: "Bedingte Schleife",
  rang: "Koch",
  titel: "Nudelwasser zum Kochen bringen",
  untertitel: "Stufe 4 · Bedingte Schleife: kopf- oder fußgesteuert",
  auftrag:
    "Der Topfsensor misst die Wassertemperatur. Die Herdplatte soll so lange heizen, bis das Wasser kocht (100 °C) – keine Minute länger, denn Energie kostet Geld. Erst dann kommen die Nudeln hinein.",
  tipp: "Achtung, Endlosschleife: Was passiert, wenn die Bedingung nie falsch wird? Und was ist der Unterschied, wenn das Wasser schon kocht?",
  luecken: [
    { id: "art", label: "Schleifenart", optionen: ["kopfgesteuert (prüfen, dann heizen)", "fußgesteuert (heizen, dann prüfen)"] },
    { id: "bed", label: "Bedingung", optionen: BED_TOPF.map((b) => "solange " + schoen(b)) },
    { id: "heiz", label: "Heizen", optionen: HEIZ_OPT.map((k) => knotenText(k)) },
  ],
  bau(w) {
    const rumpf = [
      aktion("Herdplatte 1 Minute heizen", "heizen(1);", '"Heizen"(Minuten := 1);', "herd", (z) => {
        z.k.herd = true;
      }),
      w.heiz >= 0 ? L("heiz", Object.assign({}, HEIZ_OPT[w.heiz])) : leer("heiz"),
      zuw("minuten", "minuten + 1"),
    ];
    const bed = w.bed >= 0 ? BED_TOPF[w.bed] : null;
    let schleife;
    if (w.art === 1) {
      schleife = wiederhole(bed, rumpf);
    } else {
      schleife = solange(bed, rumpf);
    }
    schleife.luecke = "bed";
    schleife.lueckeArt = "art";
    return {
      haupt: [
        ein("temperatur", "Topfsensor"),
        zuw("minuten", 0, true),
        schleife,
        aktion("Nudeln ins Wasser geben", "nudelnHinein();", '"Nudeln_hinein"();', "herd", (z) => {
          z.k.herd = false;
          z.k.topf.nudeln = true;
          z.k.topf.nudelTemp = lv(z, "temperatur");
        }),
      ],
    };
  },
  kueche: () => Object.assign(kuecheLeer(), { topf: { nudeln: false, nudelTemp: null } }),
  spalten: [varSpalte("temperatur"), varSpalte("minuten"), { name: "Herd", lies: (z) => (z.k.herd ? "heizt" : "aus") }, { name: "Nudeln", lies: (z) => (z.k.topf.nudeln ? "im Topf" : "–") }],
  testfaelle: [20, 65, 100].map((t) => ({
    name: `Wasser hat ${t} °C`,
    eingabe: { temperatur: t },
    erwartet: (z) => {
      const soll = t >= 100 ? 0 : Math.ceil((100 - t) / 15);
      if (!z.k.topf.nudeln) {
        return { ok: false, text: "Die Nudeln sind nie im Topf gelandet." };
      }
      if (z.k.topf.nudelTemp < 100) {
        return { ok: false, text: `Nudeln in ${z.k.topf.nudelTemp} °C warmes Wasser – das gibt Matsch.` };
      }
      if (z.vars.minuten > soll) {
        return { ok: false, text: `${z.vars.minuten} Minuten geheizt, ${soll} hätten gereicht – Energie verschwendet.` };
      }
      return { ok: true, text: `Kocht nach ${soll} Minute${soll === 1 ? "" : "n"}, Nudeln hinein.` };
    },
  })),
  pruefung() {
    const start = waehle([10, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 105]);
    const d = waehle([10, 15, 20, 25]);
    const fuss = Math.random() < 0.4;
    const rumpf = [zuw("temperatur", `temperatur + ${d}`), zuw("minuten", "minuten + 1")];
    const schleife = fuss ? wiederhole("temperatur < 100", rumpf) : solange("temperatur < 100", rumpf);
    const haupt = [ein("temperatur", "Topfsensor"), zuw("minuten", 0, true), schleife];
    const frageVar = waehle(["minuten", "temperatur"]);
    return {
      prog: { haupt },
      eingabe: { temperatur: start },
      frageVar,
      frage: `Der Topfsensor meldet ${start} °C. Welchen Wert hat „${frageVar}“ nach der Schleife?${fuss ? " (Achtung: fußgesteuert!)" : ""}`,
      spalten: [varSpalte("temperatur"), varSpalte("minuten")],
    };
  },
};

// =============================================================================
// Stufe 5 · Listen – Bestellungen abarbeiten
// =============================================================================
const BED_BESTELLUNG = ['b == "veggie"', 'b != "veggie"', "veggie == 0"];
const ZAEHL_VEGGIE = [zuw("veggie", "veggie + 1"), zuw("veggie", "1")];

const REZEPT_LISTE = {
  id: "liste",
  name: "Listen",
  rang: "Sous-Chef",
  titel: "Bestellungen vom Kassensystem",
  untertitel: "Stufe 5 · Schleife über eine Liste (Array) mit Verzweigung",
  auftrag:
    "Das Kassensystem schickt eine Liste von Bestellungen, z. B. [\"veggie\", \"rind\", \"veggie\"]. Für jede Bestellung soll der richtige Burger gebraten und mitgezählt werden – egal, wie lang die Liste ist.",
  tipp: "Eine Liste kann 2, 3 oder 5 Einträge haben. Eine Schleife mit festen Grenzen passt nur zu einer Länge.",
  luecken: [
    { id: "schleife", label: "Schleife", optionen: ["für jede b in bestellungen", "für k von 0 bis 2"] },
    { id: "bed", label: "Bedingung", optionen: BED_BESTELLUNG.map(schoen) },
    { id: "zaehl", label: "Zählen", optionen: ZAEHL_VEGGIE.map((k) => knotenText(k)) },
  ],
  bau(w) {
    const verzweigung = wenn(
      w.bed >= 0 ? BED_BESTELLUNG[w.bed] : null,
      [
        aktion("Gemüse-Burger braten", "brateVeggie();", '"Brate_Veggie"();', "herd", (z) => {
          z.k.teller.push("veggie");
        }),
        w.zaehl >= 0 ? L("zaehl", Object.assign({}, ZAEHL_VEGGIE[w.zaehl])) : leer("zaehl"),
      ],
      [
        aktion("Rindfleisch-Burger braten", "brateRind();", '"Brate_Rind"();', "herd", (z) => {
          z.k.teller.push("rind");
        }),
        zuw("rind", "rind + 1"),
      ]
    );
    verzweigung.luecke = "bed";
    let schleife;
    if (w.schleife === 1) {
      schleife = fuer("k", "0", "2", [zuw("b", "bestellungen[k]", true, "string"), verzweigung]);
    } else if (w.schleife === 0) {
      schleife = jede("b", "bestellungen", [verzweigung]);
    } else {
      schleife = jede("b", "???", [verzweigung]);
      schleife.offen = true;
    }
    schleife.luecke = "schleife";
    return {
      haupt: [
        ein("bestellungen", "Kassensystem", (z, liste) => {
          z.k.tafel = { titel: "Bons", zeilen: liste.map((b, i) => `${i + 1}. ${b}`) };
        }),
        zuw("veggie", 0, true),
        zuw("rind", 0, true),
        schleife,
        aus("veggie, rind"),
      ],
    };
  },
  kueche: () => Object.assign(kuecheLeer(), { pfanneAufHerd: true, pfanne: "leer", herd: true }),
  spalten: [varSpalte("b"), varSpalte("veggie"), varSpalte("rind"), { name: "Burger", lies: (z) => z.k.teller.length }],
  testfaelle: [
    ["veggie", "rind", "veggie"],
    ["rind", "rind", "veggie", "veggie", "veggie"],
    ["veggie", "rind"],
  ].map((liste) => ({
    name: `${liste.length} Bons`,
    eingabe: { bestellungen: liste },
    erwartet: (z) => {
      const v = liste.filter((b) => b === "veggie").length;
      const r = liste.length - v;
      const gebratenV = z.k.teller.filter((b) => b === "veggie").length;
      const gebratenR = z.k.teller.length - gebratenV;
      if (gebratenV !== v || gebratenR !== r) {
        return { ok: false, text: `Gebraten: ${gebratenV} Veggie / ${gebratenR} Rind, bestellt: ${v} / ${r}.` };
      }
      if (z.vars.veggie !== v || z.vars.rind !== r) {
        return { ok: false, text: `Burger stimmen, aber die Zähler zeigen ${z.vars.veggie} / ${z.vars.rind}.` };
      }
      return { ok: true, text: `${v} Veggie, ${r} Rind – alles richtig.` };
    },
  })),
  pruefung() {
    const n = zufall(3, 5);
    const mengen = [];
    for (let i = 0; i < n; i++) {
      mengen.push(zufall(1, 9));
    }
    const g = zufall(3, 6);
    const haupt = [
      ein("mengen", "Kassensystem"),
      zuw("summe", 0, true),
      zuw("gross", 0, true),
      jede("m", "mengen", [zuw("summe", "summe + m"), wenn(`m > ${g}`, [zuw("gross", "gross + 1")], [])], "int"),
    ];
    const frageVar = waehle(["summe", "gross"]);
    return {
      prog: { haupt },
      eingabe: { mengen },
      frageVar,
      frage: `Das Kassensystem schickt mengen = [${mengen.join(", ")}]. Welchen Wert hat „${frageVar}“ am Ende?`,
      spalten: [varSpalte("m"), varSpalte("summe"), varSpalte("gross")],
    };
  },
};

// =============================================================================
// Stufe 6 · Funktionen – Burger-Station mit Parametern und Rückgabewert
// =============================================================================
const RUECK_OPT = [rueckgabe("preis"), rueckgabe("0")];
const INIT_OPT = [zuw("summe", 0, true), zuw("preis", 0, true)];

const REZEPT_FUNKTION = {
  id: "funktion",
  name: "Funktionen",
  rang: "Küchenchef",
  titel: "Burger-Station als Funktion",
  untertitel: "Stufe 6 · Funktionen: Parameter, Rückgabewert, lokale Variablen",
  auftrag:
    "Die Funktion belegen(sorte, kaese) baut einen Burger und gibt seinen Preis zurück: 6 €, mit Käse 7 €. Das Hauptprogramm bestellt einen Rind-Burger (Käse je nach Gast) und einen Veggie-Burger ohne Käse und addiert die Preise.",
  tipp: "Variablen einer Funktion sind lokal: Sie entstehen beim Aufruf und verschwinden bei der Rückgabe. Schau in der Variablentabelle zu!",
  luecken: [
    { id: "init", label: "Startwert", optionen: INIT_OPT.map((k) => (k.neu ? "int " : "") + knotenText(k)) },
    { id: "ruf", label: "Aufruf", optionen: ["summe = summe + belegen(\"rind\", mitKaese)", "belegen(\"rind\", mitKaese)"] },
    { id: "rueck", label: "Rückgabe", optionen: RUECK_OPT.map((k) => knotenText(k)) },
  ],
  bau(w) {
    const rumpf = [
      zuw("preis", 6, true),
      wenn("kaese", [zuw("preis", "preis + 1")], []),
      aktion("Burger belegen", "burgerBelegen(sorte, kaese);", '"Burger_belegen"(#sorte, #kaese);', "teller", (z) => {
        z.k.teller.push(lv(z, "sorte") === "veggie" ? "veggie" : "rind");
        if (lv(z, "kaese")) {
          z.k.kaese = (z.k.kaese || 0) + 1;
        }
      }),
      w.rueck >= 0 ? L("rueck", Object.assign({}, RUECK_OPT[w.rueck])) : leer("rueck"),
    ];
    let ruf;
    if (w.ruf === 0) {
      ruf = aufruf("belegen", ['"rind"', "mitKaese"], "summe", true);
    } else if (w.ruf === 1) {
      ruf = aufruf("belegen", ['"rind"', "mitKaese"], null, false);
    } else {
      ruf = leer("ruf");
    }
    ruf.luecke = "ruf";
    return {
      funktionen: [{ name: "belegen", typ: "int", params: [{ name: "sorte", typ: "string" }, { name: "kaese", typ: "bool" }], rumpf }],
      haupt: [
        ein("mitKaese", "Bestellung"),
        w.init >= 0 ? L("init", Object.assign({}, INIT_OPT[w.init])) : leer("init"),
        ruf,
        aufruf("belegen", ['"veggie"', "false"], "summe", true),
        aus("summe"),
      ],
    };
  },
  kueche: () => Object.assign(kuecheLeer(), { kaese: 0 }),
  spalten: [varSpalte("mitKaese"), varSpalte("summe"), varSpalte("sorte", true), varSpalte("kaese", true), varSpalte("preis", true)],
  testfaelle: [true, false].map((k) => ({
    name: k ? "Gast will Käse" : "Gast ohne Käse",
    eingabe: { mitKaese: k },
    erwartet: (z) => {
      const soll = k ? 13 : 12;
      if (z.k.teller.length !== 2) {
        return { ok: false, text: `Es wurden ${z.k.teller.length} statt 2 Burger gebaut.` };
      }
      if (z.vars.summe !== soll) {
        return { ok: false, text: `Die Summe ist ${z.vars.summe} €, richtig wären ${soll} €.` };
      }
      return { ok: true, text: `2 Burger, zusammen ${soll} €.` };
    },
  })),
  pruefung() {
    const variante = waehle(["doppel", "preis"]);
    if (variante === "doppel") {
      const m = zufall(2, 4);
      const p = zufall(1, 3);
      const n = zufall(1, 5);
      const f = { name: "rechne", typ: "int", params: [{ name: "x", typ: "int" }], rumpf: [zuw("y", `x * ${m}`, true), rueckgabe(`y + ${p}`)] };
      const haupt = [zuw("a", n, true), aufruf("rechne", ["a"], "b", false, true), aufruf("rechne", ["b - a"], "c", false, true)];
      const frageVar = waehle(["b", "c"]);
      return {
        prog: { funktionen: [f], haupt },
        eingabe: {},
        frageVar,
        frage: `Welchen Wert hat „${frageVar}“ am Ende des Hauptprogramms?`,
        spalten: [varSpalte("a"), varSpalte("b"), varSpalte("c"), varSpalte("x", true), varSpalte("y", true)],
      };
    }
    const grenze = zufall(3, 6);
    const rabatt = zufall(1, 3);
    const st = zufall(2, 4);
    const f = {
      name: "preis",
      typ: "int",
      params: [{ name: "menge", typ: "int" }],
      rumpf: [zuw("p", `menge * ${st}`, true), wenn(`menge > ${grenze}`, [zuw("p", `p - ${rabatt}`)], []), rueckgabe("p")],
    };
    const a = zufall(1, 8);
    const b = zufall(1, 8);
    const haupt = [zuw("summe", 0, true), aufruf("preis", [String(a)], "summe", true), aufruf("preis", [String(b)], "summe", true)];
    return {
      prog: { funktionen: [f], haupt },
      eingabe: {},
      frageVar: "summe",
      frage: "Welchen Wert hat „summe“ am Ende des Hauptprogramms?",
      spalten: [varSpalte("summe"), varSpalte("menge", true), varSpalte("p", true)],
    };
  },
};

const REZEPTE = [REZEPT_SEQUENZ, REZEPT_VERZWEIGUNG, REZEPT_ZAEHLSCHLEIFE, REZEPT_SCHLEIFE, REZEPT_LISTE, REZEPT_FUNKTION];

// Prüfungsaufgabe erzeugen und die richtige Antwort ausrechnen
function neuePruefung(stufe) {
  for (let versuch = 0; versuch < 20; versuch++) {
    const a = REZEPTE[stufe].pruefung();
    const z = neuerZustand(a.eingabe, kuecheLeer());
    try {
      fuehreKomplett(a.prog, z);
      a.antwort = z.vars[a.frageVar];
      if (typeof a.antwort === "number") {
        return a;
      }
    } catch (e) {
      // diese Zufallsaufgabe ist ungeeignet – neue würfeln
    }
  }
  throw new Error("Keine Prüfungsaufgabe gefunden");
}

if (typeof module !== "undefined") {
  module.exports = { REZEPTE, SERIE_ZIEL, neuePruefung, kuecheLeer };
}
