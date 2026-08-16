# Protocol

## Samenvatting

De MouldKing 4.0-hubs praten **niet** via een normale BLE GATT-verbinding,
maar luisteren naar versleutelde **BLE advertising-pakketten** (broadcast,
geen connectie) — vergelijkbaar met hoe goedkope LEGO Power Functions-
klonen werken. Er is geen officiële documentatie; het protocol is door de
Espruino-community gereverse-engineerd.

## Gebruikte library

We gebruiken het bestaande, kant-en-klare Espruino-module:

- Module: https://www.espruino.com/modules/mouldking.js
- Documentatie: https://www.espruino.com/LEGO+Power+Functions+Clone
- Copyright (C) 2023 Gordon Williams, Espruino — MPL 2.0

Relevante werking (samengevat uit de broncode):

- `exports.DEVICE_ADDRESS = [193, 194, 195, 196, 197]` — een **vaste,
  generieke constante**, niet uniek per hub of afstandsbediening. De
  daadwerkelijke onderscheiding tussen hubs loopt vermoedelijk via het
  BLE MAC-adres van de zender, niet via deze payload-constante.
- `.start()` verstuurt een "pairing"-advertising-pakket. Een hub die op dat
  moment in pairing-mode staat (knopje net ingedrukt) "klikt vast" aan de
  zender.
- `.set({a,b,c,d})` verstuurt de motorstates, elk kanaal -7 (vol achteruit)
  t/m 7 (vol vooruit). **Alle 4 kanalen moeten altijd meegegeven worden** —
  een weggelaten kanaal wordt stilzwijgend op 0 gezet.
- Encryptie: XOR-whitening met vaste tabellen + CRC16, volledig in
  `get_nrf_payload()` — geen aanpassing nodig, gewoon gebruiken.

## Twee hubs op één micro:bit — waarom dat niet werkt

**Geprobeerd en verworpen.** Idee was: `NRF.setAddress()` gebruiken om de
micro:bit onder twee verschillende BLE MAC-identiteiten te laten pairen
(hub 1 op adres X, hub 2 op adres Y), en dan tijdens bediening razendsnel
wisselen tussen beide adressen.

- Werkte niet stabiel in de praktijk (getest, bewegingen onbetrouwbaar/
  haperend).
- Los van de instabiliteit: `NRF.setAddress()` vereist een **softdevice-
  restart**, wat niet instant gaat — te traag voor realtime multiplexen
  tussen twee hubs.
- **Conclusie**: voor gelijktijdige, betrouwbare besturing van 2 hubs zijn
  **2 aparte micro:bits** nodig, elk met hun eigen vaste BLE-identiteit en
  eigen Web Serial-verbinding. Dit is ook hoe de webinterface is opgezet
  (elke hub-tab = eigen onafhankelijke seriële verbinding).

Zie ook: er bestaat een ander, ouder MouldKing-protocol (MK6.0-hub) met een
losse Python/Raspberry Pi-implementatie
([mkconnect-python](https://github.com/J0EK3R/mkconnect-python)) dat wél
tussen meerdere hub-adressen kan wisselen (via `hcitool` op Linux/BlueZ) —
maar dat is een ander protocol dan onze MK **4.0**-module en niet 1-op-1
toepasbaar via Espruino/micro:bit.

## Bekende protocol-variatie

Uit een GitHub-discussie (espruino/EspruinoDocs#727): iemand anders met
exact dezelfde "Mould King 4.0 Powered Module" meldde dat de module niet
werkte — mogelijk een firmware-variant met afwijkende UUID's. Bij ons
werkte de standaardmodule direct (bevestigd: bak bewoog bij eerste test).
Mocht een toekomstige hub/module niet reageren, is dit de eerste plek om
te controleren (scan met `NRF.setScan()` op manufacturer UUID `0xFF00` en
vergelijk met wat de officiële app uitzendt).
