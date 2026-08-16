# Status

Laatste bijgewerkt: initiële versie, na de eerste ontwikkelsessie.
Begin hier als je dit project weer oppakt.

## Werkt en getest

- ✅ Micro:bit v2 geflasht met Espruino, verbinding via Web Serial vanuit
  Chrome op macOS bevestigd werkend.
- ✅ Hub 1 (bovenbouw) volledig functioneel: bak, steel, rotatie, giek —
  alle 4 kanalen getest en bevestigd correcte richting (giek-richting was
  in eerste instantie omgedraaid, inmiddels gecorrigeerd).
- ✅ Webinterface met press-and-hold bediening, SVG-schema, krachtsregelaar,
  noodstop, live log.
- ✅ Tab-structuur met onafhankelijke Web Serial-verbindingen per hub.
- ✅ Gioteck VX2-controller: gedetecteerd, live debug-weergave (assen +
  knoppen) werkt, mapping-UI met `localStorage`-opslag werkt, D-pad/hat-
  switch-decodering (axis 9) geïmplementeerd, kalibratieknop voor stick-
  drift toegevoegd.

## Gebouwd maar nog niet hardware-bevestigd

- ⚠️ **Hub 2 (rijwerk)** — UI volledig klaar (tab, losse rups-knoppen,
  combinatie-knop "recht vooruit/achteruit"), maar **nog niet getest** met
  een fysieke 2e micro:bit. Reden: pogingen om hub 2 via dezelfde micro:bit
  als hub 1 aan te sturen (MAC-adres-wisseling) bleken onbetrouwbaar — zie
  [`PROTOCOL.md`](PROTOCOL.md). Volgende stap: 2e micro:bit aanschaffen,
  `microbit-setup.js` erop zetten, testen via de "Rijwerk"-tab.
- ⚠️ **Gamepad-mapping naar echte functies** — de mapping-UI werkt, maar de
  daadwerkelijke toewijzing (welke stick/knop bestuurt welke functie) is
  nog niet door de gebruiker afgerond/gevalideerd op de graafmachine zelf.
- ⚠️ **"Doorbewegen na loslaten" van de sticks** — kalibratieknop
  toegevoegd als mogelijke oplossing (stick-drift-compensatie), nog niet
  bevestigd of dit het probleem oplost. Alternatieve verklaring: mechanisch
  uitlopen van de motor zelf (geen actieve rem) — te onderscheiden via de
  Log-tab (komt de stop-opdracht direct na loslaten, of is er vertraging).

## Geparkeerd — bewust nog niet opgepakt

Besproken, met concrete vervolgstappen indien gewenst, maar geen werk aan
verricht:

- **Node-RED als centrale hub** — besproken als alternatief voor de
  browser-als-eigenaar-van-de-seriële-verbinding. Zou macro/sequencer-werk
  vereenvoudigen en logging naar de bestaande Grafana/Loki-stack mogelijk
  maken. Vereist Node-RED serial-node + MQTT/HTTP-brug. Niet gestart.
- **Programma's opnemen/afspelen (macro's)** — ingeschat als
  laagdrempelig te bouwen (state-log + timing-replay, opslag in
  `localStorage`). Niet gestart.
- **Camerabeeld / autonoom graven** — camerabeeld tonen is een kleine stap
  (`getUserMedia`). Echt autonoom graven is **niet haalbaar zonder
  hardware-aanpassing**: de motoren hebben geen positieterugkoppeling
  (encoders/potmeters), dus geen closed-loop besturing mogelijk zonder
  eerst hoeksensoren te retrofitten. Zie gespreksgeschiedenis voor het
  volledige stappenplan als dit ooit wordt opgepakt.

## Belangrijke ontwerpkeuzes (om niet opnieuw te hoeven uitzoeken)

- Kanaaltoewijzing hub 2 is **a + c**, niet a + d — empirisch vastgesteld,
  niet een aanname.
- Giek-richting: knop "Omhoog" = kanaal-waarde **-1**, "Omlaag" = **+1**
  (tegenovergesteld aan de eerste, verkeerde implementatie).
- Geen server/backend — bewuste keuze voor eenvoud; browser praat
  rechtstreeks met micro:bit via Web Serial.
- Gamepad-mapping is bewust **niet hardcoded** — de Gioteck VX2 bleek een
  non-standaard HID-layout (`mapping: n/a`) te hebben, dus een
  zelf-kalibreerbare UI was noodzakelijk, niet een nice-to-have.
