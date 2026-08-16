# Hardware

## Graafmachine

MouldKing 13112 — crawler-graafmachine met 2 accubanken / hubs, 6 motoren
in totaal.

## Hub 1 — bovenbouw (MouldKing 4.0-module)

- Herkenning: groene sticker met tekst **"4.0-10"**, Micro-USB-poort,
  knopje met ledje erin (blijft knipperen na indrukken totdat gepaird)
- 4 motor-aansluitingen (4-pins connectors)
- Gebruikt in dit project via het Espruino `mouldking`-module
  (zie [`PROTOCOL.md`](PROTOCOL.md))

| Kanaal | Functie | Richting `-` | Richting `+` |
|---|---|---|---|
| `a` | Bak | Openen | Sluiten |
| `b` | Steel (bak-arm) | In | Uit |
| `c` | Rotatie (zwenken bovenbouw) | Links | Rechts |
| `d` | Giek (hoofdarm) | Omhoog | Omlaag |

## Hub 2 — rijwerk / tracks

- 2 motor-aansluitingen, bevestigd op kanalen **a** en **c** (niet a/d —
  dat is empirisch vastgesteld, niet aangenomen)
- **Nog niet hardware-getest** — zie [`STATUS.md`](STATUS.md)

| Kanaal | Functie | Richting `-` | Richting `+` |
|---|---|---|---|
| `a` | Rups links | Achteruit | Vooruit |
| `c` | Rups rechts | Achteruit | Vooruit |

Combinatieknop "Recht vooruit/achteruit" in de webinterface stuurt a en c
gelijktijdig dezelfde richting aan.

## Besturingsbrug — BBC micro:bit

- **Versie in gebruik**: micro:bit **v2** (herkenbaar aan het
  luidspreker-icoon en microfoongaatje op de achterkant, in tegenstelling
  tot v1)
- Nordic **nRF52833** (v2) — BLE-capabel, vereist voor dit project
- Firmware: **Espruino** (niet de standaard MakeCode/MicroPython-firmware
  die er origineel op staat) — `.hex` van espruino.com/MicroBit
- **Belangrijke beperking**: 1 micro:bit = 1 BLE-radio = kan maar met 1 hub
  tegelijk stabiel pairen. Voor 2 hubs simultaan zijn 2 micro:bits nodig
  (zie [`PROTOCOL.md`](PROTOCOL.md) voor de mislukte poging om dit met één
  micro:bit op te lossen via MAC-adres-wisseling)

## Optionele controller — Gioteck VX2 (bekabeld)

- USB Vendor ID: `25f0`, Product ID: `83c3`
- **Geen** echte Sony DualShock 3 — generieke "plug and play" HID-gamepad,
  geen activatie-quirk nodig
- Browser rapporteert **`mapping: n/a`** (geen "standaard" Gamepad-layout)
  met **10 assen** en **13 knoppen** — dus niet de gebruikelijke 4-assen
  aanname die bij de meeste moderne controllers werkt
- Axis 9 bleek een **hat-switch** (D-pad), rustwaarde `1.28571` = centrum
  (genormaliseerd via `idx/3.5 - 1`, idx 0–7 = 8 richtingen, idx 8 =
  gecentreerd)
- Exacte as/knop-indeling voor links/rechts stick, triggers e.d. is niet
  hard vastgelegd in dit document — daarvoor bestaat de zelf-toe-te-wijzen
  mapping-UI in de "Controller"-tab (met `localStorage`-opslag), zodat elke
  nieuwe/andere controller zonder codewijziging te kalibreren is
