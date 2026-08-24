// ============================================================
// Mapping — gamepad- en toetsenbord-mapping.
// Doelen (TARGETS) worden dynamisch opgebouwd uit MotorConfig, zodat
// dit automatisch meebeweegt met een aangepaste kanaal-configuratie.
// Naast motor-kanalen zijn er twee speciale doelen: kracht +0.25/-0.25
// (overal dezelfde mapping, werkt op de gedeelde Speed-waarde) en
// noodstop (los systeem: lijst van toetsen + lijst van gamepad-knoppen).
// ============================================================
const Mapping = (() => {
  const STORAGE_KEY = 'mkg_gamepad_mapping_v2';
  const DEADZONE = 0.15;

  // mapping: { axis:{i:{hub,chan,invert}}, button:{i:{target}}, dpad:{i:{up,down,left,right}},
  //            calib:{i:offset}, estop:{keys:[], buttons:[]} }
  let mapping = { axis:{}, button:{}, dpad:{}, calib:{}, estop:{ keys:[], buttons:[] } };

  function load(){
    const stored = Storage.loadJSON(STORAGE_KEY, null);
    mapping = stored || { axis:{}, button:{}, dpad:{}, calib:{}, estop:{ keys:[], buttons:[] } };
    if (!mapping.estop) mapping.estop = { keys:[], buttons:[] };
  }
  function save(){ Storage.saveJSON(STORAGE_KEY, mapping); }
  function get(){ return mapping; }
  function set(m){ mapping = m; if (!mapping.estop) mapping.estop = { keys:[], buttons:[] }; save(); }
  function reset(){ mapping = { axis:{}, button:{}, dpad:{}, calib:{}, estop:{ keys:[], buttons:[] } }; save(); }

  function buildTargets(){
    const targets = [];
    ['hub1','hub2'].forEach(hubId => {
      MotorConfig.channelsFor(hubId).forEach(chan => {
        const e = MotorConfig.entry(hubId, chan);
        targets.push({
          hub: hubId, chan,
          label: (hubId === 'hub1' ? 'Hub1' : 'Hub2') + ' · ' + e.label,
          neg: e.neg, pos: e.pos, seg: e.seg
        });
      });
    });
    return targets;
  }

  function buildAxisSelect(current){
    const sel = document.createElement('select');
    sel.className = 'map-select';
    const optNone = document.createElement('option');
    optNone.value = ''; optNone.textContent = 'Geen';
    sel.appendChild(optNone);
    buildTargets().forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.hub + ':' + t.chan;
      opt.textContent = t.label;
      sel.appendChild(opt);
    });
    if (current) sel.value = current.hub + ':' + current.chan;
    return sel;
  }

  function buildButtonSelect(current){
    const sel = document.createElement('select');
    sel.className = 'map-select';
    const optNone = document.createElement('option');
    optNone.value = ''; optNone.textContent = 'Geen';
    sel.appendChild(optNone);
    buildTargets().forEach(t => {
      const optNeg = document.createElement('option');
      optNeg.value = t.hub + ':' + t.chan + ':-1';
      optNeg.textContent = t.label + ' · ' + t.neg;
      sel.appendChild(optNeg);
      const optPos = document.createElement('option');
      optPos.value = t.hub + ':' + t.chan + ':1';
      optPos.textContent = t.label + ' · ' + t.pos;
      sel.appendChild(optPos);
    });
    const optSpeedUp = document.createElement('option');
    optSpeedUp.value = 'speed::1'; optSpeedUp.textContent = 'Kracht · +0.25';
    sel.appendChild(optSpeedUp);
    const optSpeedDown = document.createElement('option');
    optSpeedDown.value = 'speed::-1'; optSpeedDown.textContent = 'Kracht · -0.25';
    sel.appendChild(optSpeedDown);

    if (current) sel.value = current.hub + ':' + current.chan + ':' + current.sign;
    return sel;
  }

  function targetSeg(hub, chan){
    const t = buildTargets().find(t => t.hub === hub && t.chan === chan);
    return t ? t.seg : null;
  }

  function applyDeadzone(v){
    if (Math.abs(v) < DEADZONE) return 0;
    const sign = v < 0 ? -1 : 1;
    return sign * (Math.abs(v) - DEADZONE) / (1 - DEADZONE);
  }

  function decodeHat(raw){
    const idx = Math.round((raw + 1) * 3.5);
    return {
      up:    idx === 0 || idx === 1 || idx === 7,
      right: idx === 1 || idx === 2 || idx === 3,
      down:  idx === 3 || idx === 4 || idx === 5,
      left:  idx === 5 || idx === 6 || idx === 7
    };
  }

  // ---------- edge-detectie voor "één druk = één stap" op kracht ----------
  const prevButtonPressed = {};   // per button-index
  const prevDpadDir = {};         // per "axisIndex:dir"

  function handleStepTarget(hub, chan, sign, wasPressed, isPressed){
    if (hub === 'speed' && isPressed && !wasPressed){
      Speed.step(sign * 0.25);
    }
  }

  function applyButtonTarget(m, isPressed, wasPressed, speedVal){
    if (!m) return null;
    if (m.hub === 'speed'){
      handleStepTarget('speed', null, m.sign, wasPressed, isPressed);
      return null;
    }
    return isPressed ? { hub: m.hub, chan: m.chan, val: m.sign * speedVal } : null;
  }

  // ---------- noodstop ----------
  let captureCallback = null; // als actief: volgende toets/knop wordt toegevoegd
  function armCapture(cb){ captureCallback = cb; }

  function checkKeyboardEstop(e){
    if (captureCallback){
      captureCallback({ type:'key', value:e.key });
      captureCallback = null;
      e.preventDefault();
      return;
    }
    if (mapping.estop.keys.includes(e.key)){
      HubManager.stopAllHubs();
      if (window.SequencePlayer) SequencePlayer.stop();
    }
  }
  document.addEventListener('keydown', checkKeyboardEstop);

  // ---------- hoofdlus ----------
  let lastGp = null;
  let uiRefs = null; // gezet door buildControllerUI, voor live debug-weergave
  let padEnabled = { value: true };

  function poll(){
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = Array.from(pads).find(p => p && p.connected);

    if (uiRefs) uiRefs.updateStatus(gp);

    if (!gp){ requestAnimationFrame(poll); return; }
    lastGp = gp;

    if (uiRefs) uiRefs.updateLive(gp);

    // noodstop via gamepad-knoppen
    gp.buttons.forEach((b, i) => {
      const pressed = b.pressed || b.value > 0.5;
      if (captureCallback && pressed && !prevButtonPressed[i]){
        captureCallback({ type:'button', value:i });
        captureCallback = null;
      }
      if (pressed && mapping.estop.buttons.includes(i)){
        HubManager.stopAllHubs();
        if (window.SequencePlayer) SequencePlayer.stop();
      }
    });

    if (padEnabled.value){
      const speedVal = Speed.motorValue();
      const desired = {};
      ['hub1','hub2'].forEach(h => { desired[h] = {}; MotorConfig.channelsFor(h).forEach(c => desired[h][c] = 0); });

      // continue as-mappingen
      Object.keys(mapping.axis).forEach(i => {
        const m = mapping.axis[i];
        const raw = gp.axes[i];
        if (raw === undefined) return;
        const offset = mapping.calib[i] || 0;
        let v = applyDeadzone(raw - offset);
        if (m.invert) v = -v;
        const val = Math.round(v * speedVal);
        if (desired[m.hub] && (m.chan in desired[m.hub])) desired[m.hub][m.chan] += val;
      });

      // D-pad / hat-switch assen
      Object.keys(mapping.dpad).forEach(i => {
        const raw = gp.axes[i];
        if (raw === undefined) return;
        const dirs = decodeHat(raw);
        const dpadMap = mapping.dpad[i];
        ['up','down','left','right'].forEach(dir => {
          const m = dpadMap[dir];
          if (!m) return;
          const key = i + ':' + dir;
          const isPressed = dirs[dir];
          const wasPressed = !!prevDpadDir[key];
          const contrib = applyButtonTarget(m, isPressed, wasPressed, speedVal);
          if (contrib && desired[contrib.hub]) desired[contrib.hub][contrib.chan] += contrib.val;
          prevDpadDir[key] = isPressed;
        });
      });

      // losse knoppen
      gp.buttons.forEach((b, i) => {
        const m = mapping.button[i];
        if (!m) return;
        const isPressed = b.pressed || b.value > 0.5;
        const wasPressed = !!prevButtonPressed[i];
        const contrib = applyButtonTarget(m, isPressed, wasPressed, speedVal);
        if (contrib && desired[contrib.hub]) desired[contrib.hub][contrib.chan] += contrib.val;
      });

      ['hub1','hub2'].forEach(hubId => {
        if (!HubManager.isConnected(hubId)) return;
        Object.keys(desired[hubId]).forEach(chan => {
          const val = Math.max(-7, Math.min(7, desired[hubId][chan]));
          HubManager.setChannel(hubId, chan, val, targetSeg(hubId, chan));
        });
      });
    }

    gp.buttons.forEach((b, i) => { prevButtonPressed[i] = b.pressed || b.value > 0.5; });

    requestAnimationFrame(poll);
  }

  function registerUI(refs, enabledRef){ uiRefs = refs; padEnabled = enabledRef; }
  function getLastGamepad(){ return lastGp; }

  return {
    load, save, get, set, reset, buildTargets, buildAxisSelect, buildButtonSelect,
    targetSeg, applyDeadzone, decodeHat, poll, registerUI, getLastGamepad,
    armCapture
  };
})();
