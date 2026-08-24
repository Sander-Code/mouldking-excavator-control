// ============================================================
// MotorConfig — welk fysiek kanaal (a/b/c/d) hoort bij welke functie,
// per hub, met een invert-optie. Dit was voorheen hardcoded in de UI;
// nu een losse config zodat het meegenomen kan worden in export/import
// en herbruikbaar is voor een ander model/andere bedrading.
// ============================================================
const MotorConfig = (() => {
  const KEY = 'mkg_motor_config_v1';

  const DEFAULT = {
    hub1: {
      a: { label: 'Bak',             neg: 'Openen',    pos: 'Sluiten', invert: false, seg: 'hub1-segBak' },
      b: { label: 'Steel (bak-arm)', neg: 'In',        pos: 'Uit',     invert: false, seg: 'hub1-segSteel' },
      c: { label: 'Rotatie',         neg: 'Links',     pos: 'Rechts',  invert: false, seg: 'hub1-pivotRotatie' },
      d: { label: 'Giek (hoofdarm)', neg: 'Omhoog',    pos: 'Omlaag',  invert: false, seg: 'hub1-segGiek' }
    },
    hub2: {
      a: { label: 'Rups links',  neg: 'Achteruit', pos: 'Vooruit', invert: false, seg: 'hub2-trackL' },
      c: { label: 'Rups rechts', neg: 'Achteruit', pos: 'Vooruit', invert: false, seg: 'hub2-trackR' }
    }
  };

  let config = null;

  function load(){
    const stored = Storage.loadJSON(KEY, null);
    config = stored || JSON.parse(JSON.stringify(DEFAULT));
    return config;
  }
  function save(){ Storage.saveJSON(KEY, config); }
  function get(){ return config; }
  function set(newConfig){ config = newConfig; save(); }
  function reset(){ config = JSON.parse(JSON.stringify(DEFAULT)); save(); }

  function channelsFor(hubId){ return Object.keys(config[hubId] || {}); }
  function entry(hubId, chan){ return config[hubId] && config[hubId][chan]; }

  // Effectief te versturen teken, rekening houdend met invert.
  // rawDir: -1 (neg-richting/knop) of 1 (pos-richting/knop)
  function effectiveSign(hubId, chan, rawDir){
    const e = entry(hubId, chan);
    if (!e) return rawDir;
    return e.invert ? -rawDir : rawDir;
  }

  return { load, save, get, set, reset, channelsFor, entry, effectiveSign, DEFAULT };
})();
