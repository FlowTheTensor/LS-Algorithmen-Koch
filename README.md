# Algorithmen-Koch · Struktogramme und PAP

Ein Küchenroboter kocht nach Rezepten, die als **Struktogramm nach DIN 66261** geschrieben sind. In jedem Rezept fehlen Bausteine: Die Lücken werden direkt im Struktogramm gefüllt, dann wird probegekocht – Schritt für Schritt, mit Variablentabelle. Funktioniert das Rezept mit **allen Testfällen**, geht es in die Freigabeprüfung (Schreibtischtest). Sechs Freigabestufen von der *Küchenhilfe* bis zum *Küchenchef*.

Erstellt für den Unterricht an der Jakob-Preh-Schule ([bsnes.de](https://www.bsnes.de)), Fachschule für Elektrotechnik, Fach Informationstechnik, 1. Schuljahr (Lerngebiet 3: Algorithmen entwickeln und codieren).

**Live-Version:** [Hier direkt anschauen](https://flowthetensor.github.io/LS-Algorithmen-Koch/)

---

## Worum geht es?

Ein Algorithmus ist wie ein Rezept: eine eindeutige Folge von Anweisungen, die jemand – oder etwas – Schritt für Schritt ausführt. Der Roboter tut genau das, was im Rezept steht, nicht mehr und nicht weniger. Steht das Öl hinter dem Ei, klebt das Ei fest. Ist die Schleifenbedingung falsch, kocht der Topf über.

Jedes Rezept lässt sich in vier Ansichten zeigen:

| Ansicht | Norm / Sprache | Zweck |
|---|---|---|
| **Struktogramm** | DIN 66261 (Nassi-Shneiderman) | Lücken füllen, Ablauf verfolgen |
| **PAP** | Programmablaufplan nach DIN 66001 | dieselbe Logik als Flussdiagramm |
| **C++** | wie im Unterricht | so sieht das Rezept als Programm aus |
| **SCL** | Structured Control Language (TIA Portal, vereinfacht) | dieselbe Logik auf der SPS – Vorbereitung auf das 2. Schuljahr |

In allen Ansichten wird der gerade ausgeführte Baustein gelb markiert, Lücken sind rot.

Bezug zum **Laborserver**: Die Rezepte arbeiten mit Sensorwerten (Ofen- und Topftemperatur) und Daten vom Kassensystem. Die Anzeigen in der Küche sind mit „→ Laborserver“ beschriftet – genau so werden im 2. Schuljahr Messwerte der Modellanlage verarbeitet.

## Die sechs Freigabestufen

| Stufe | Thema | Rezept | Freigabe als | Was man lernt |
|---|---|---|---|---|
| 1 | Sequenz | Spiegelei braten | Küchenhilfe | Reihenfolge von Anweisungen; manche Schritte hängen voneinander ab, andere sind tauschbar |
| 2 | Verzweigung | Pizza-Ofen mit Sensor | Beikoch | einfache und verschachtelte Verzweigung, Grenzwerte testen (genau 220 °C!) |
| 3 | Zählschleife | Pfannkuchen für die Klasse | Jungkoch | `for`-Schleife, Start- und Endwert, Off-by-one-Fehler |
| 4 | Bedingte Schleife | Nudelwasser zum Kochen bringen | Koch | kopf- und fußgesteuerte Schleife, Endlosschleife |
| 5 | Listen | Bestellungen vom Kassensystem | Sous-Chef | Schleife über eine Liste (Array), Verzweigung in der Schleife, Zähler |
| 6 | Funktionen | Burger-Station als Funktion | Küchenchef | Parameter, Rückgabewert, lokale Variablen, Geltungsbereich |

### Die Lücken je Stufe

| Stufe | Lücken | Typische Fehler, die die Testfälle aufdecken |
|---|---|---|
| 1 | 6 Arbeitsschritte in eine Reihenfolge bringen (4 von 46 656 Reihenfolgen funktionieren) | Ei ohne Öl, Herd aus, Öl ohne Pfanne |
| 2 | Bedingung (≥, ≤, ==), ja- und nein-Zweig | `== 220` klappt nur bei genau 220 °C, `≤` vertauscht die Zweige |
| 3 | Startwert, Endwert, Zähl-Anweisung | `von 0 bis anzahl` backt einen Pfannkuchen zu viel – aber `von 0 bis anzahl − 1` ist richtig |
| 4 | Schleifenart, Bedingung, Heiz-Anweisung | `≠ 100` wird nie falsch (20, 35, … 95, 110): Endlosschleife; fußgesteuert heizt bei 100 °C unnötig eine Minute |
| 5 | Schleife, Bedingung, Zähler | `für k von 0 bis 2` passt nur zu Listen mit genau 3 Bons |
| 6 | Startwert, Aufruf, Rückgabe | `preis = 0` im Hauptprogramm: „summe“ existiert nicht; Rückgabewert nicht gespeichert; `Rückgabe 0` |

## Funktionsprüfung mit Testfällen

Jedes Rezept hat mehrere Testfälle (z. B. Sensor meldet 180 °C, 220 °C, 250 °C, 320 °C). Ein Rezept gilt erst dann als richtig, wenn **alle** Testfälle klappen – das ist die Funktionsprüfung, die der Lehrplan verlangt, ohne dass ein formales Testverfahren nötig ist. „Alle Testfälle prüfen“ rechnet sie ohne Animation durch und zeigt für jeden Testfall ✓ oder ✗ mit Begründung.

## Variablentabelle (Schreibtischtest)

Unten links entsteht beim Probekochen automatisch eine Variablentabelle: eine Zeile pro Schritt, geänderte Werte sind rot markiert. In Stufe 6 erscheinen die **lokalen Variablen** der Funktion (blau) beim Aufruf und verschwinden bei der Rückgabe wieder.

## Freigabeprüfung

Im Modus **Freigabeprüfung** zeigt das Struktogramm ein zufällig erzeugtes kleines Programm zum Thema der Stufe, z. B. eine verschachtelte Verzweigung mit Sensorwert oder eine Funktion, die zweimal aufgerufen wird. Die Frage lautet immer: *Welchen Wert hat die Variable … am Ende?*

- Die Variablentabelle ist abgedeckt – gerechnet wird im Kopf oder auf Papier.
- **5 richtige Antworten in Folge** ergeben das Prüfsiegel der Stufe; ein Fehler setzt die Serie zurück, ebenso „Andere Aufgabe“.
- Nach jeder Antwort kann man sich mit „Auflösung ansehen“ den Ablauf samt Tabelle vorspielen lassen.
- Die Prüfsiegel werden im Browser gespeichert (localStorage). „zurücksetzen“ im Feld *Freigaben* löscht sie.

## Bedienung

| Aktion | Wirkung |
|---|---|
| Stufen-Leiste (Reiter 1–6) | Rezept wechseln, ✓ = Prüfsiegel vorhanden |
| Auswahlfeld im Struktogramm | Lücke füllen (nur in der Ansicht „Struktogramm“) |
| Struktogramm / PAP / C++ / SCL | Ansicht des Rezepts wechseln |
| Testfall | Eingabe für den Probelauf wählen |
| „Schritt“ oder **→** | einen Schritt ausführen |
| „Probekochen“ oder **Leertaste** | automatisch ablaufen lassen / anhalten |
| „Neustart“ oder **R** | Lauf von vorn beginnen |
| Tempo | langsam, mittel, schnell |
| „Alle Testfälle prüfen“ | Funktionsprüfung des Rezepts |
| **Enter** in der Prüfung | Antwort prüfen bzw. nächste Aufgabe |

## Ideen für den Unterricht

- **Einstieg Sequenz:** Ohne Erklärung das Spiegelei-Rezept lösen lassen. Welche Schritte darf man tauschen, welche nicht? Wie viele richtige Reihenfolgen gibt es? (4)
- **Grenzwerte:** In Stufe 2 erst mit 250 °C testen – scheinbar klappt alles. Dann 220 °C. Warum ist der Grenzwert der wichtigste Testfall?
- **Off-by-one:** Stufe 3 mit `von 0 bis anzahl` probekochen und die Pfannkuchen zählen. Welche drei Kombinationen sind richtig?
- **Endlosschleife:** Stufe 4 mit `solange temperatur ≠ 100` laufen lassen. Warum wird die Bedingung nie falsch? Mit welcher Heizleistung hätte es zufällig geklappt?
- **Kopf- oder fußgesteuert:** Testfall „100 °C“ mit beiden Schleifenarten vergleichen. Wann ist eine fußgesteuerte Schleife sinnvoll (z. B. „Benutzereingabe wiederholen, bis sie gültig ist“)?
- **Listen:** Warum klappt `für k von 0 bis 2` beim ersten Testfall, aber nicht bei den anderen? Wie heißt die Schleife in C++ (`for (string b : bestellungen)`)?
- **Geltungsbereich:** In Stufe 6 die Lücke „Startwert“ auf `preis = 0` stellen. Die Fehlermeldung lesen und mit der Variablentabelle erklären.
- **Rückgabewert:** Was passiert, wenn man `belegen(...)` aufruft, ohne das Ergebnis zu speichern?
- **Vom Struktogramm zum Code:** Ein gelöstes Rezept in der C++-Ansicht abschreiben und in der eigenen Entwicklungsumgebung ausführen (Küchenaktionen durch `cout`-Ausgaben ersetzen).
- **Transfer zur SPS:** Dasselbe Rezept in der SCL-Ansicht. Was ist gleich, was anders (`:=`, `#`, `END_IF`)? – Vorbereitung auf die SCL-Stunde am Schuljahresende.
- **Freigabeprüfung als Wiederholung** vor der Schulaufgabe: Wer hat zuerst alle sechs Siegel?

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seite, bindet Schriften, p5.js und die Skripte ein |
| `style.css` | Gestaltung im Corporate Design der Schule |
| `interpreter.js` | führt Struktogramme Schritt für Schritt aus (Generator), Variablen mit Geltungsbereich, erzeugt C++- und SCL-Code – reines JavaScript, ohne p5 |
| `rezepte.js` | die sechs Rezepte: Lücken, Testfälle, Küchenaktionen, Spalten der Variablentabelle, Aufgabengeneratoren der Freigabeprüfung |
| `ui.js` | Knöpfe, Auswahllisten (auch die Lücken im Struktogramm), Eingabefelder |
| `sketch.js` | Ablauf, Zeichnen: Küche, Struktogramm, PAP, Code, Variablentabelle |
| `assets/logo-jps.png` | Logo der Jakob-Preh-Schule |
| `libraries/p5.min.js` | p5.js (lokal, damit die Seite auch offline läuft) |

### Ein eigenes Rezept ergänzen

In `rezepte.js` ein Objekt nach dem Muster der vorhandenen anlegen und in die Liste `REZEPTE` aufnehmen. Ein Rezept besteht aus Bausteinen:

```js
ein("temperatur", "Ofensensor")            // Eingabe
zuw("teller", 0, true)                     // int teller = 0
zuw("teller", "teller + 1")                // teller = teller + 1
wenn("temperatur >= 220", [ ... ], [ ... ]) // Verzweigung
solange("temperatur < 100", [ ... ])        // kopfgesteuerte Schleife
wiederhole("temperatur < 100", [ ... ])     // fußgesteuerte Schleife
fuer("i", "1", "anzahl", [ ... ])           // Zählschleife
jede("b", "bestellungen", [ ... ])          // Schleife über eine Liste
aufruf("belegen", ['"rind"', "mitKaese"], "summe", true)  // summe = summe + belegen(...)
rueckgabe("preis")
aktion("Herd einschalten", "herdEin();", '"Herd_ein"();', "herd", (z) => { z.k.herd = true; })
```

Ausdrücke werden in C++-Schreibweise angegeben. Eine Küchenaktion kann mit `throw new KochFehler("…")` scheitern, wenn eine Voraussetzung fehlt.

## Lokal starten

Am einfachsten in VS Code mit der Erweiterung **Live Server**: Rechtsklick auf `index.html` → „Open with Live Server“.

## Technische Hinweise

- Läuft mit **p5.js 1.x** (lokal mitgeliefert) und **p5.js 2.x**. Dafür verzichtet der Code bewusst auf Funktionen, die sich zwischen den Versionen geändert haben (z. B. `preload`, `loadFont`).
- Die Schriften (Quicksand, Inter, JetBrains Mono) kommen von Google Fonts. Ohne Internet weicht die Seite automatisch auf Systemschriften aus.
- Alle Schleifen haben geschweifte Klammern: Der p5-Web-Editor baut in Schleifen eine Endlosschleifen-Sicherung ein, die bei Schleifen ohne Klammern fehlschlägt.
- Der Interpreter bricht eine Schleife nach 40 Durchläufen ab und meldet eine Endlosschleife.
- Ganzzahl-Division wird wie in C++ abgeschnitten (`7 / 2 = 3`).
- Die SCL-Ansicht ist bewusst vereinfacht (z. B. Ausgabe über `"HMI".Anzeige`, Liste mit Index `#k`) und soll die Struktur zeigen, nicht direkt ins TIA Portal kopiert werden.
- Fehler in `draw()` werden abgefangen und als Hinweis angezeigt, statt das Programm einzufrieren.
