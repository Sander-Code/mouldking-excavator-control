// ============================================================
// HubManager — globale, tab-onafhankelijke Web Serial verbindingen.
// Herkent elke micro:bit aan zijn vaste BLE MAC-adres (NRF.getAddress())
// en koppelt die permanent aan een hub-rol (hub1/hub2), zodat je nooit
// handmatig hoeft te kiezen welke poort welke hub is.
// ============================================================
const HubManager = (() => {
  const REGISTRY_KEY = 'mkg_hub_registry_v1'; // { [mac]: 'hub1' | 'hub2' }
  let registry = Storage.loadJSON(REGISTRY_KEY, {});
  function saveRegistry(){ Storage.saveJSON(REGISTRY_KEY, registry); }

  // connections[role] = { port, writer, reader, mac, state:{a,b,c,d,...} }
  const connections = {};
  const changeListeners = [];
  const logListeners = [];

  function onChange(cb){ changeListeners.push(cb); }
  function onLog(cb){ logListeners.push(cb); }
  function notifyChange(){ changeListeners.forEach(cb => cb()); }
  function notifyLog(role, msg, cls){ logListeners.forEach(cb => cb(role, msg, cls)); }

  function isConnected(role){ return !!(connections[role] && connections[role].writer); }
  function macFor(role){ return connections[role] ? connections[role].mac : null; }
  function stateFor(role){ return connections[role] ? connections[role].state : null; }

  // ---------- NRF-adres opvragen als apparaat-identiteit ----------
  async function queryAddress(reader, writer){
    await writer.write(new TextEncoder().encode('NRF.getAddress()\n'));
    const deadline = Date.now() + 3000;
    let buffer = '';
    while (Date.now() < deadline){
      const race = await Promise.race([
        reader.read(),
        new Promise(res => setTimeout(() => res({ value: null, timeout: true }), 300))
      ]);
      if (race && race.value) buffer += race.value;
      const match = buffer.match(/"([0-9a-fA-F:]{17})"/);
      if (match) return match[1].toLowerCase();
      if (race && race.done) break;
    }
    return null; // onbekend adres - besturing werkt nog steeds, alleen geen auto-herkenning
  }

  // ---------- rol-toewijzing vragen als MAC onbekend is ----------
  function promptForRole(mac){
    return new Promise(resolve => {
      const root = document.getElementById('modalRoot');
      root.innerHTML = `
        <div class="modal-backdrop">
          <div class="modal">
            <h3>Welke hub is dit?</h3>
            <p>Deze micro:bit${mac ? ' (' + mac + ')' : ''} is nog niet eerder gekoppeld.
            Kies de rol — dit wordt onthouden voor volgende keer.</p>
            <div class="modal-actions">
              <button id="roleHub1">Hub 1 · Bovenbouw</button>
              <button id="roleHub2">Hub 2 · Rijwerk</button>
            </div>
          </div>
        </div>`;
      root.querySelector('#roleHub1').addEventListener('click', () => { root.innerHTML=''; resolve('hub1'); });
      root.querySelector('#roleHub2').addEventListener('click', () => { root.innerHTML=''; resolve('hub2'); });
    });
  }

  async function connectNewDevice(){
    let port;
    try{
      port = await navigator.serial.requestPort();
    } catch(e){
      return null; // gebruiker annuleerde de picker
    }
    await port.open({ baudRate: 9600 });
    const writer = port.writable.getWriter();
    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable).catch(()=>{});
    const reader = decoder.readable.getReader();

    const mac = await queryAddress(reader, writer);
    let role = mac ? registry[mac] : null;
    if (!role) role = await promptForRole(mac);
    if (mac){ registry[mac] = role; saveRegistry(); }

    if (connections[role] && connections[role].port !== port){
      notifyLog(role, 'Nieuwe verbinding overschrijft bestaande rol-toewijzing.', 'sys');
    }

    connections[role] = { port, writer, reader, mac, state: {} };
    readLoop(role);
    notifyChange();
    notifyLog(role, 'Verbonden' + (mac ? ' (' + mac + ')' : '') + '.', 'sys');
    return role;
  }

  async function readLoop(role){
    const conn = connections[role];
    try{
      while (conn.reader){
        const { value, done } = await conn.reader.read();
        if (done) break;
        if (value){
          value.split(/\r?\n/).forEach(l => { if (l.trim()) notifyLog(role, l.trim(), 'rx'); });
        }
      }
    } catch(e){
      notifyLog(role, 'Leesfout: ' + e.message, 'err');
    } finally {
      if (connections[role] === conn){
        delete connections[role];
        notifyChange();
      }
    }
  }

  function swapRoles(){
    const a = connections.hub1, b = connections.hub2;
    connections.hub1 = b; connections.hub2 = a;
    if (connections.hub1 && connections.hub1.mac) registry[connections.hub1.mac] = 'hub1';
    if (connections.hub2 && connections.hub2.mac) registry[connections.hub2.mac] = 'hub2';
    saveRegistry();
    notifyChange();
  }

  async function rawSend(role, cmd){
    const conn = connections[role];
    if (!conn) return;
    try{ await conn.writer.write(new TextEncoder().encode(cmd)); }
    catch(e){ notifyLog(role, 'Schrijffout: ' + e.message, 'err'); }
  }

  // ---------- kanaal-aansturing ----------
  // recordHook: door SequenceRecorder gezet, wordt aangeroepen bij elke
  // daadwerkelijke wijziging (ongeacht bron: knop, gamepad, of playback)
  let recordHook = null;
  function setRecordHook(fn){ recordHook = fn; }

  function setChannel(role, chan, value, segId){
    const conn = connections[role];
    if (!conn) return;
    if (conn.state[chan] === value) return;
    conn.state[chan] = value;

    const channels = MotorConfig.channelsFor(role);
    const parts = channels.map(c => c + ':' + (conn.state[c] || 0));
    const cmd = 'lego.set({' + parts.join(',') + '});\n';
    rawSend(role, cmd);
    notifyLog(role, cmd.trim(), 'tx');

    if (segId){
      document.querySelectorAll('[data-seg="' + segId + '"]').forEach(el => {
        el.classList.toggle('active', value !== 0);
      });
    }
    if (recordHook) recordHook(role, chan, value);
  }

  function stopAll(role){
    const conn = connections[role];
    if (!conn) return;
    MotorConfig.channelsFor(role).forEach(c => {
      if (conn.state[c] !== 0) setChannel(role, c, 0, MotorConfig.entry(role, c).seg);
    });
  }

  function stopAllHubs(){
    ['hub1','hub2'].forEach(role => { if (isConnected(role)) stopAll(role); });
  }

  function getRegistry(){ return registry; }
  function setRegistry(r){ registry = r || {}; saveRegistry(); }

  return {
    connectNewDevice, swapRoles, isConnected, macFor, stateFor,
    setChannel, stopAll, stopAllHubs, setRecordHook,
    onChange, onLog, connections, getRegistry, setRegistry
  };
})();
