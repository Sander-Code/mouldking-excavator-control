# MouldKing Excavator Control

Eigen webinterface voor de MouldKing 13112 RC-graafmachine (LEGO-compatible
bouwset), als vervanging voor de officiële (onbetrouwbare) app. Bediening
loopt via een micro:bit die het BLE-protocol van de MouldKing-hubs nabootst,
aangestuurd door een browserpagina via de Web Serial API — geen server,
geen cloud, alles lokaal over USB.

## Waarom dit project bestaat

De officiële MouldKing-app werkte niet betrouwbaar. In plaats daarvan sturen
we de hubs rechtstreeks aan via het (gereverse-engineerde) BLE-advertising-
protocol, met een micro:bit als brug tussen browser en graafmachine.

## Hardware

- **Graafmachine**: MouldKing 13112, crawler-graafmachine
- **Hub 1** (bovenbouw): MouldKing 4.0-module (groene sticker "4.0-10"),
  4 motor-aansluitingen — bak, steel, rotatie, giek
- **Hub 2** (rijwerk): 2 motor-aansluitingen — rups links, rups rechts
- **Besturingsbrug**: BBC micro:bit v2, geflasht met Espruino-firmware
- **Optioneel**: Gioteck VX2 bekabelde PS3-stijl controller

Zie [`docs/HARDWARE.md`](docs/HARDWARE.md) voor volledige details en de
kanaal-toewijzing per hub.

## Architectuur

```
[Browser: control-panel.html]
        │  Web Serial (USB)
        ▼
[micro:bit: Espruino + mouldking module]
        │  BLE advertising (nabootsing MouldKing-afstandsbediening)
        ▼
[MouldKing hub] ──► motoren
```

Elke hub heeft zijn eigen onafhankelijke Web Serial-verbinding (eigen tab
in de webpagina). Zie [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) voor
het volledige plaatje, inclusief de gamepad-laag.

## Snel starten

1. **Eenmalig op de micro:bit**: flash Espruino-firmware (zie
   [`docs/HARDWARE.md`](docs/HARDWARE.md)), plak `microbit/microbit-setup.js`
   in de Espruino Web IDE-console, run het, en typ `save()` zodat het
   blijvend in flash staat. Herhaal dit per hub die je wilt aansturen (elke
   hub heeft zijn eigen micro:bit nodig — zie
   [`docs/PROTOCOL.md`](docs/PROTOCOL.md) voor waarom).
2. **Webinterface**: open `web/control-panel.html` in Chrome of Edge
   (Web Serial API vereist, Safari/Firefox werken niet).
3. Klik "Verbind micro:bit" in de gewenste tab, kies de juiste USB-poort.
4. Bedienen met de knoppen, of koppel een gamepad via de "Controller"-tab.

## Status en vervolgstappen

Wat werkt, wat nog niet, en waar we gebleven waren staat in
[`docs/STATUS.md`](docs/STATUS.md) — begin daar als je dit project weer
oppakt.

## Documentatie

- [`docs/HARDWARE.md`](docs/HARDWARE.md) — apparaten, kanalen, IDs
- [`docs/PROTOCOL.md`](docs/PROTOCOL.md) — BLE-protocol, bronnen, waarom
  twee hubs niet op één micro:bit kunnen
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — softwareopbouw
- [`docs/STATUS.md`](docs/STATUS.md) — voortgang, open punten, geparkeerde
  ideeën (Node-RED, macro's, camera/autonomie)

## Licentie

MIT — zie [`LICENSE`](LICENSE).
