// ============================================================
// Speed — één globale "Kracht"-waarde (1-7, decimalen toegestaan
// voor de +0.25/-0.25 stap-mapping), gedeeld door alle tabs.
// Begint elke sessie altijd op 7 (bewuste keuze, niet onthouden).
// ============================================================
const Speed = (() => {
  const MIN = 1, MAX = 7, START = 7;
  let value = START;
  const listeners = [];

  function get(){ return value; }

  function set(v){
    value = Math.max(MIN, Math.min(MAX, v));
    listeners.forEach(cb => cb(value));
  }

  function step(delta){ set(value + delta); }

  // waarde die daadwerkelijk naar de motor gaat (heel getal)
  function motorValue(){ return Math.round(value); }

  function onChange(cb){ listeners.push(cb); }

  return { get, set, step, motorValue, onChange, MIN, MAX };
})();
