# Architectuur

## Overzicht

```
[Browser: control-panel.html]
   ├── Tab "Bovenbouw"  ──Web Serial (USB)──► micro:bit #1 ──BLE──► Hub 1
   ├── Tab "Rijwerk"    ──Web Serial (USB)──► micro:bit #2 ──BLE──► Hub 2
   └── Tab "Controller" ──Gamepad API──► leest lokale USB-controller,
                          vertaalt naar dezelfde lego.set()-commando's
```

Geen server, geen backend — alles draait client-side in de browser.
`control-panel.html` is een volledig zelfstandig bestand (HTML/CSS/JS in
één), te openen door 'm gewoon te dubbelklikken.

## Waarom Web Serial i.p.v. Web Bluetooth

De micro:bit praat via USB-CDC (seriële poort over USB), niet via een BLE
GATT-verbinding met de browser. De browser praat dus "gewoon tekst" tegen
de micro:bit; de micro:bit vertaalt dat naar BLE-advertising richting de
hub. Web Serial (`navigator.serial`) is hiervoor de juiste API, ondersteund
in Chrome/Edge op zowel macOS als Windows.

## Waarom platte JS-statements over serial i.p.v. een eigen protocol

De micro:bit draait continu een levende Espruino REPL. In plaats van een
eigen tekst-protocol te verzinnen en op de micro:bit te parsen, stuurt de
browser gewoon letterlijke JavaScript-statements die de REPL al begrijpt:

```js
lego.set({a:7,b:0,c:0,d:0});
```

Voordeel: geen firmware-aanpassing nodig na de initiële
`microbit-setup.js` — nieuwe functionaliteit toevoegen (bv. macro's,
gamepad-mapping) is puur browser-side werk.

## `control-panel.html` — opbouw

Eén bestand, drie tabs, elk onafhankelijk:

- **Tab "Bovenbouw"** (hub 1): press-and-hold knoppen per kanaal, SVG-
  schema van de graafarm dat live het actieve onderdeel oplicht,
  krachtsregelaar (1–7), noodstop, live commando-log.
- **Tab "Rijwerk"** (hub 2): zelfde patroon, plus een combinatieknop voor
  "recht vooruit/achteruit" die kanaal a+c tegelijk aanstuurt.
- **Tab "Controller"**: Gamepad API-integratie met **zelf toe te wijzen
  mapping** (niet hardcoded) — noodzakelijk omdat niet elke controller
  dezelfde as/knop-indeling rapporteert (zie
  [`HARDWARE.md`](HARDWARE.md)). Bevat:
  - Live debug-weergave van alle assen/knoppen die de controller stuurt
  - Per as: dropdown naar een hub-kanaal + "omkeren"-optie, óf D-pad/hat-
    switch-modus (4 losse richtingen)
  - Per knop: dropdown naar een hub-kanaal + richting
  - Kalibratieknop (compenseert stick-drift/rustpositie-afwijking)
  - Mapping wordt automatisch bewaard in `localStorage`

### JS-structuur (`control-panel.html`)

- `createHub(hubId, channels)` — fabrieksfunctie, geeft een volledig
  onafhankelijke hub-controller terug (eigen Web Serial-poort, eigen state,
  eigen knoppen). Hub 1 en hub 2 zijn twee losse instanties hiervan.
  Retourneert `{ stopAll, setChannel, isConnected }` zodat de gamepad-laag
  er ook commando's naartoe kan sturen zonder de knoppen-UI te dupliceren.
- Losse IIFE voor de gamepad-integratie: pollt `navigator.getGamepads()`
  via `requestAnimationFrame`, past de door de gebruiker ingestelde mapping
  toe, en roept `hub.setChannel()` aan op precies dezelfde manier als een
  handmatige knopdruk zou doen.

## Bekende technische beperking

`lego.set()` verstuurt altijd alle 4 kanalen van een hub in één keer (zie
[`PROTOCOL.md`](PROTOCOL.md)) — de state-objecten in `createHub` houden
daarom altijd de volledige set bij, nooit een los kanaal.
