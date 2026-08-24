// ============================================================
// Sequences — event-based opname/afspelen.
// Opname legt alleen een regel vast bij een daadwerkelijke wijziging
// (via HubManager.setRecordHook, dus ongeacht bron: knop, gamepad of
// een lopende afspeel-sequence — dat maakt "overdubben" mogelijk).
// Vereenvoudiging t.o.v. het volledige plan: er is geen aparte
// live/playback-prioriteitslaag; wie *laatst* setChannel aanroept
// "wint". In de praktijk betekent dit dat het loslaten van een
// handmatige knop tijdens overdubben terugvalt op 0 i.p.v. op de
// waarde die de sequence op dat moment voorschrijft. Werkt voor de
// meeste gevallen, maar is een bewuste v1-vereenvoudiging.
// ============================================================
const SequenceStore = (() => {
  const KEY = 'mkg_sequences_v1';
  function all(){ return Storage.loadJSON(KEY, {}); }
  function save(map){ Storage.saveJSON(KEY, map); }
  function get(id){ return all()[id]; }
  function upsert(seq){ const m = all(); m[seq.id] = seq; save(m); }
  function remove(id){ const m = all(); delete m[id]; save(m); }
  function findByName(name){ return Object.values(all()).find(s => s.name === name); }
  return { all, get, upsert, remove, findByName };
})();

const SequenceRecorder = (() => {
  let state = 'idle'; // idle | recording | paused
  let events = [];
  let startTime = 0;
  let pausedAccum = 0;
  let pauseStartedAt = 0;
  let listeners = [];

  function onChange(cb){ listeners.push(cb); }
  function notify(){ listeners.forEach(cb => cb(state)); }

  function now(){ return performance.now(); }

  function elapsedMs(){
    if (state === 'recording') return now() - startTime - pausedAccum;
    if (state === 'paused') return pauseStartedAt - startTime - pausedAccum;
    return 0;
  }

  function onChannelChange(hub, chan, val){
    if (state !== 'recording') return;
    events.push({ t: Math.round(elapsedMs()), hub, chan, val });
  }

  function start(){
    events = [];
    startTime = now();
    pausedAccum = 0;
    state = 'recording';
    HubManager.setRecordHook(onChannelChange);
    notify();
  }

  function pause(){
    if (state !== 'recording') return;
    pauseStartedAt = now();
    state = 'paused';
    notify();
  }

  function resume(){
    if (state !== 'paused') return;
    pausedAccum += now() - pauseStartedAt;
    state = 'recording';
    notify();
  }

  function stop(){
    if (state === 'idle') return null;
    HubManager.setRecordHook(null);
    state = 'idle';
    const result = events.slice();
    notify();
    return result;
  }

  function getState(){ return state; }

  return { start, pause, resume, stop, getState, elapsedMs, onChange };
})();

const SequencePlayer = (() => {
  let state = 'idle'; // idle | playing
  let timeouts = [];
  let loop = false;
  let currentSeq = null;
  let listeners = [];

  function onChange(cb){ listeners.push(cb); }
  function notify(){ listeners.forEach(cb => cb(state)); }

  function clearTimeouts(){ timeouts.forEach(t => clearTimeout(t)); timeouts = []; }

  function play(seq, opts){
    stop(); // eerst alles opruimen
    currentSeq = seq;
    loop = !!(opts && opts.loop);
    state = 'playing';
    notify();
    scheduleAll();
  }

  function scheduleAll(){
    if (!currentSeq) return;
    const hubsUsed = new Set();
    currentSeq.events.forEach(ev => {
      hubsUsed.add(ev.hub);
      const seg = Mapping.targetSeg(ev.hub, ev.chan);
      const id = setTimeout(() => {
        if (HubManager.isConnected(ev.hub)) HubManager.setChannel(ev.hub, ev.chan, ev.val, seg);
      }, ev.t);
      timeouts.push(id);
    });
    const lastT = currentSeq.events.length ? Math.max(...currentSeq.events.map(e => e.t)) : 0;
    const endId = setTimeout(() => {
      if (loop && state === 'playing'){
        scheduleAll();
      } else {
        hubsUsed.forEach(h => { if (HubManager.isConnected(h)) HubManager.stopAll(h); });
        state = 'idle';
        notify();
      }
    }, lastT + 200);
    timeouts.push(endId);
  }

  function stop(){
    clearTimeouts();
    if (currentSeq){
      const hubsUsed = new Set(currentSeq.events.map(e => e.hub));
      hubsUsed.forEach(h => { if (HubManager.isConnected(h)) HubManager.stopAll(h); });
    }
    state = 'idle';
    notify();
  }

  function getState(){ return state; }

  return { play, stop, getState, onChange };
})();
window.SequencePlayer = SequencePlayer; // door Mapping/Recorder gebruikt voor noodstop-koppeling

// ---------- export/import ----------
const SequenceIO = (() => {
  function exportSequence(seq){
    const payload = {
      schemaVersion: 1,
      name: seq.name,
      createdAt: seq.createdAt,
      exportedAt: Storage.isoTimestamp(),
      events: seq.events
    };
    const filename = Storage.sanitizeFilename(seq.name) + '_' + Storage.timestampForFilename() + '.json';
    Storage.downloadJSON(payload, filename);
  }

  async function importSequence(onConflict){
    const data = await Storage.pickJSONFile();
    if (!data || !Array.isArray(data.events)) throw new Error('Bestand mist een geldige "events"-lijst.');
    let name = data.name || 'geïmporteerd';
    const existing = SequenceStore.findByName(name);
    if (existing){
      const action = await onConflict(name); // 'overwrite' | 'rename' | 'cancel'
      if (action === 'cancel') return null;
      if (action === 'rename') name = name + ' (' + Storage.timestampForFilename() + ')';
      if (action === 'overwrite'){
        SequenceStore.remove(existing.id);
      }
    }
    const seq = {
      id: 'seq_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
      name,
      createdAt: data.createdAt || Storage.isoTimestamp(),
      events: data.events
    };
    SequenceStore.upsert(seq);
    return seq;
  }

  return { exportSequence, importSequence };
})();
