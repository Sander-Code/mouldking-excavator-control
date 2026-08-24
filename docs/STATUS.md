# Status

Laatste bijgewerkt: na de v3-herbouw (multi-bestand architectuur,
globale verbindingen, mapping-systeem, sequences).
Begin hier als je dit project weer oppakt.

## v3 — grote herbouw, NOG NIET IN DE PRAKTIJK GETEST

De hele webinterface is herbouwd van één bestand (`control-panel.html`)
naar een multi-bestand app (`web/index.html` + `web/js/*.js`). Dit is
**puur op basis van overleg en code-redenatie gebouwd, nog niet met een
echte micro:bit/hub getest** — behandel dit als "klaar om te testen",
niet als "werkt bevestigd". Begin de volgende sessie met testen, niet
met verder bouwen.

### Wat er nieuw in zit

- **Globale, tab-onafhankelijke verbindingen**: connectie zit niet meer
  vast aan een tab. Eén "+ Verbind micro:bit"-knop, overal bereikbaar.
- **Automatische hub-herkenning** via `NRF.getAddress()` — elke
  micro:bit wordt herkend aan zijn vaste BLE MAC-adres, gekoppeld aan
  hub 1/2, onthouden voor volgende keer. **Onzeker punt**: het exacte
  tekstformaat waarin Espruino het adres terugstuurt over serial is
  aangenomen (regex zoekt een quoted string met colons), niet
  geverifieerd tegen echte hardware-output. Als auto-detectie niet
  werkt, is dit de eerste plek om te checken.
- **Onbekende micro:bit** → popup vraagt welke hub-rol.
- **"Wissel hub 1 ↔ hub 2"-knop** als handmatig vangnet.
- **4e tab "Overzicht"**: volledige kopie van hub 1 + hub 2-bediening
  samen op één scherm.
- **Motor-kanaal-configuratie losgetrokken van de UI** (`MotorConfig`)
  — functie + invert per kanaal, geen losse UI om te bewerken (bewust,
  zie eerder overleg), maar wel onderdeel van de instellingen-export.
- **Uitgebreid mapping-systeem** (Controller-tab): naast de bestaande
  as/knop/D-pad-mapping nu ook:
  - **Kracht-stap-mapping** (+0.25/-0.25), overal dezelfde mapping,
    één druk = één stap, geen auto-repeat.
  - **Noodstop-mapping**: losse lijsten van toetsenbord-toetsen én
    gamepad-knoppen, allemaal onafhankelijk triggerend, "voeg toe"
    via capture-modus (volgende toets/knop wordt vastgelegd).
- **Globale, gedeelde Kracht-waarde** (`Speed`) — één waarde, gesynct
  over alle tabs, altijd start op 7 (niet onthouden tussen sessies).
- **Sequences-tab**: event-based opname (alleen bij verandering, geen
  vaste interval), beide hubs in dezelfde tijdlijn, pauzeren/hervatten
  met bevroren klok, vrij lopende opname + handmatige stop, naam geven,
  simpele tijdlijn-visualisatie (blokjes per kanaal), afspelen met
  loop-optie, losse export/import per sequence met datum/tijd in
  bestandsnaam, naamconflict bij import vraagt overschrijven/hernoemen/
  annuleren, verwijderen uit de lijst.
- **Instellingen-tab**: settings-export/import (motor-config +
  gamepad-mapping + hub-registry samen, datum/tijd in bestandsnaam),
  losse "wis motor-kanaal-mapping"-knop.

### Bewuste vereenvoudiging — overdubben (record tijdens playback)

Het volledige plan voorzag een aparte prioriteitslaag (live input
overrulet playback per kanaal, val terug op playback-waarde bij
loslaten). **Dat is niet gebouwd.** In plaats daarvan: opname luistert
naar dezelfde `setChannel()`-aanroepen als knoppen/gamepad/playback
allemaal gebruiken, en wie *laatst* aanroept "wint" — geen aparte
prioriteitsresolutie. Praktisch gevolg: een handmatige knop loslaten
tijdens overdubben valt terug op 0, niet op wat de lopende sequence op
dat moment voorschreef. Werkt voor de meeste gevallen, maar is een
bewuste v1-kortere-klap. Als dit in de praktijk hinderlijk blijkt, is
de volledige prioriteitslaag de logische volgende stap.

### Nog te doen / te verifiëren bij volgende sessie

- [ ] **Hub 2 hardware-test** met de 2e micro:bit (nog steeds open van
  vorige sessie, nu ook de nieuwe architectuur meteen meetesten)
- [ ] `NRF.getAddress()`-parsing verifiëren tegen echte Espruino-output
- [ ] Onbekende-micro:bit-popup en naamconflict-popup zijn simpele
  eigen modals, geen uitgebreide styling-check gedaan
- [ ] Overdub-gedrag in de praktijk beoordelen (zie hierboven)
- [ ] GitHub Pages-hosting nog niet ingesteld/getest (zie punt 2 in
  eerdere overleg — zou moeten werken zonder wijzigingen, want alles
  is client-side, maar niet bevestigd)
- [ ] Tijdlijn is nu alleen-lezen (blokjes tonen wat er gebeurde) — het
  bewerken van wachttijd tussen stappen (uit later overleg) is niet
  gebouwd

## Werkt en getest (uit eerdere sessie, v2, vóór de herbouw)

- ✅ Micro:bit v2 + Espruino + Web Serial vanuit Chrome op macOS.
- ✅ Hub 1 (bovenbouw): bak, steel, rotatie, giek — alle 4 kanalen
  bevestigd correct.
- ✅ Gioteck VX2-controller gedetecteerd, non-standaard HID-layout
  (`mapping: n/a`, 10 assen/13 knoppen) succesvol omzeild via
  zelf-toe-te-wijzen mapping-UI.

⚠️ Deze bevestigingen golden voor de **oude, single-file** versie
(`control-panel.html`, nu vervangen door `index.html` + `js/`). De
onderliggende logica (protocol, kanalen, mapping-principes) is
ongewijzigd overgenomen, maar de herbouwde code zelf is nieuw en dus
opnieuw te bevestigen.

## Geparkeerd — bewust nog niet opgepakt

- **Node-RED als centrale hub** — besproken, niet gestart.
- **Camerabeeld / autonoom graven** — camerabeeld tonen is een kleine
  stap. Echt autonoom graven vereist eerst hardware-retrofit
  (hoeksensoren) — geen closed-loop besturing mogelijk zonder
  positieterugkoppeling op de motoren.
- **Speed/tempo-schaling tijdens playback** — bewust géén losse
  real-time snelheidsfactor gebouwd; tempo-aanpassing gebeurt door
  wachttijden tussen stappen te wijzigen (handmatig in het JSON-bestand,
  of later via een tijdlijn-editor — nog niet gebouwd).

## Belangrijke ontwerpkeuzes (om niet opnieuw te hoeven uitzoeken)

- Kanaaltoewijzing hub 2 is **a + c**, niet a + d — empirisch vastgesteld.
- Giek: neg-richting (linker knop) = **Omhoog**, pos-richting = **Omlaag**.
- Geen server/backend — bewuste keuze voor eenvoud; browser praat
  rechtstreeks met micro:bit via Web Serial.
- Gamepad-mapping is bewust **niet hardcoded** — zelf-kalibreerbaar
  vanwege non-standaard HID-layout bij de Gioteck VX2.
- Kracht is **niet** hetzelfde als tempo/snelheid: kracht regelt
  motorvermogen binnen een tijdvak, tempo verschuift de tijdvakken zelf.
  Bewust gescheiden gehouden (zie "Geparkeerd" hierboven).
- Opname is event-based (alleen bij verandering), geen vaste-interval
  snapshots — leverde een compacter, beter bewerkbaar bestand op.

