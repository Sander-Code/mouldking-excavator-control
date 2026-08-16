// ===================================================================
// MouldKing excavator - micro:bit setup script
// ===================================================================
// Dit script EENMALIG in de Espruino Web IDE console plakken en runnen.
// Daarna `save()` typen in de console -> blijft in flash staan en start
// vanzelf op elke keer dat de micro:bit spanning krijgt (ook los van USB).
//
// Na save() hoeft dit bestand nooit meer geupload te worden. De
// webpagina (control-panel.html) stuurt vanaf dan simpele JS-statements
// zoals lego.set({a:7,b:0,c:0,d:0}); rechtstreeks over de seriele poort,
// die de al-lopende Espruino REPL gewoon uitvoert.
// ===================================================================

var lego = require("mouldking");
lego.start();

setTimeout(function () {
  print("READY");
}, 1000);

// Nu in de console typen: save()
