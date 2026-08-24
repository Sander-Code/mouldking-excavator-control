// ============================================================
// UI — bouwt alle tab-inhoud dynamisch op uit MotorConfig, en wiret
// de globale connectiebalk, tabs, mapping-UI en sequences-UI.
// ============================================================
const UI = (() => {

  // ---------- SVG-schema's (hardcoded per hub, niet uit config afgeleid) ----------
  function hub1Schematic(){
    return `
      <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg">
        <rect x="60" y="210" width="200" height="26" rx="13" fill="none" stroke="#55707f" stroke-width="3"/>
        <circle cx="80" cy="223" r="10" fill="#2c3134" stroke="#55707f" stroke-width="2"/>
        <circle cx="240" cy="223" r="10" fill="#2c3134" stroke="#55707f" stroke-width="2"/>
        <rect x="90" y="185" width="140" height="26" rx="4" fill="#2c3134" stroke="#383e41" stroke-width="2"/>
        <circle class="pivot" data-seg="hub1-pivotRotatie" cx="160" cy="198" r="7" fill="#55707f"/>
        <rect x="100" y="140" width="55" height="46" rx="4" fill="none" stroke="#55707f" stroke-width="3"/>
        <line class="seg" data-seg="hub1-segGiek" x1="180" y1="185" x2="270" y2="90" stroke="#55707f" stroke-width="10" stroke-linecap="round"/>
        <line class="seg" data-seg="hub1-segSteel" x1="270" y1="90" x2="230" y2="40" stroke="#55707f" stroke-width="8" stroke-linecap="round"/>
        <path class="seg" data-seg="hub1-segBak" d="M 230 40 L 205 55 L 210 78 L 235 68 Z" fill="none" stroke="#55707f" stroke-width="6" stroke-linejoin="round"/>
        <circle cx="180" cy="185" r="5" fill="#383e41"/>
        <circle cx="270" cy="90" r="5" fill="#383e41"/>
        <circle cx="230" cy="40" r="5" fill="#383e41"/>
      </svg>`;
  }
  function hub2Schematic(){
    return `
      <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <rect x="120" y="70" width="160" height="40" rx="6" fill="#2c3134" stroke="#383e41" stroke-width="2"/>
        <rect class="track" data-seg="hub2-trackL" x="60" y="55" width="60" height="90" rx="24" fill="#2c3134" stroke="#55707f" stroke-width="3"/>
        <rect class="track" data-seg="hub2-trackR" x="280" y="55" width="60" height="90" rx="24" fill="#2c3134" stroke="#55707f" stroke-width="3"/>
        <text x="90" y="103" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#8b9296">L</text>
        <text x="310" y="103" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#8b9296">R</text>
      </svg>`;
  }

  let instanceCounter = 0;

  function buildHubPanel(role, opts){
    opts = opts || {};
    const uid = 'p' + (instanceCounter++);
    const wrap = document.createElement('div');

    const main = document.createElement('main');
    if (opts.singleCol) main.classList.add('cols-1');

    const paneLeft = document.createElement('div');
    paneLeft.className = 'pane';
    const schemWrap = document.createElement('div');
    schemWrap.className = 'schematic-wrap';
    schemWrap.innerHTML = role === 'hub1' ? hub1Schematic() : hub2Schematic();

    const speedRow = document.createElement('div');
    speedRow.className = 'speed-row';
    const speedInput = document.createElement('input');
    speedInput.type = 'range'; speedInput.min = '1'; speedInput.max = '7'; speedInput.step = '0.25';
    speedInput.value = Speed.get();
    const speedLabel = document.createElement('label'); speedLabel.textContent = 'Kracht';
    const speedVal = document.createElement('span'); speedVal.className = 'speed-val'; speedVal.textContent = Speed.get();
    speedInput.addEventListener('input', () => Speed.set(parseFloat(speedInput.value)));
    Speed.onChange(v => { speedInput.value = v; speedVal.textContent = v.toFixed(2).replace(/\.?0+$/,'') || '0'; });
    speedRow.appendChild(speedLabel); speedRow.appendChild(speedInput); speedRow.appendChild(speedVal);
    schemWrap.appendChild(speedRow);
    paneLeft.appendChild(schemWrap);
    main.appendChild(paneLeft);

    const paneRight = document.createElement('div');
    paneRight.className = 'pane';
    const controls = document.createElement('div');
    const chans = MotorConfig.channelsFor(role);
    controls.className = 'controls' + (chans.length <= 2 ? ' single-col' : '');

    // Combinatieknop "recht vooruit/achteruit" voor hubs met precies 2
    // kanalen (bv. rupsband-aandrijving) — stuurt beide tegelijk aan.
    if (chans.length === 2){
      const [c1, c2] = chans;
      const e1 = MotorConfig.entry(role, c1), e2 = MotorConfig.entry(role, c2);
      const comboCard = document.createElement('div');
      comboCard.className = 'ctrl-card';
      comboCard.innerHTML = `<div class="label">Recht vooruit / achteruit <span class="chan">${c1}+${c2}</span></div>`;
      const comboRow = document.createElement('div'); comboRow.className = 'btn-row';
      const negBtn = document.createElement('button'); negBtn.className = 'hold-btn'; negBtn.textContent = e1.neg;
      const posBtn = document.createElement('button'); posBtn.className = 'hold-btn'; posBtn.textContent = e1.pos;
      function bindComboHold(btn, rawDir){
        const press = (ev) => {
          ev.preventDefault();
          if (!HubManager.isConnected(role)) return;
          btn.classList.add('pressed');
          const val = MotorConfig.effectiveSign(role, c1, rawDir) * Speed.motorValue();
          const val2 = MotorConfig.effectiveSign(role, c2, rawDir) * Speed.motorValue();
          HubManager.setChannel(role, c1, val, e1.seg);
          HubManager.setChannel(role, c2, val2, e2.seg);
        };
        const release = (ev) => {
          ev.preventDefault();
          if (!HubManager.isConnected(role)) return;
          btn.classList.remove('pressed');
          HubManager.setChannel(role, c1, 0, e1.seg);
          HubManager.setChannel(role, c2, 0, e2.seg);
        };
        btn.addEventListener('mousedown', press);
        btn.addEventListener('touchstart', press, { passive:false });
        btn.addEventListener('mouseup', release);
        btn.addEventListener('mouseleave', release);
        btn.addEventListener('touchend', release);
        btn.addEventListener('touchcancel', release);
      }
      bindComboHold(negBtn, -1);
      bindComboHold(posBtn, 1);
      comboRow.appendChild(negBtn); comboRow.appendChild(posBtn);
      comboCard.appendChild(comboRow);
      controls.appendChild(comboCard);
    }

    MotorConfig.channelsFor(role).forEach(chan => {
      const e = MotorConfig.entry(role, chan);
      const card = document.createElement('div');
      card.className = 'ctrl-card';
      card.innerHTML = `<div class="label">${e.label} <span class="chan">${chan}</span></div>`;
      const btnRow = document.createElement('div'); btnRow.className = 'btn-row';

      const negBtn = document.createElement('button'); negBtn.className = 'hold-btn'; negBtn.textContent = e.neg;
      const posBtn = document.createElement('button'); posBtn.className = 'hold-btn'; posBtn.textContent = e.pos;

      function bindHold(btn, rawDir){
        const press = (ev) => {
          ev.preventDefault();
          if (!HubManager.isConnected(role)) return;
          btn.classList.add('pressed');
          const sign = MotorConfig.effectiveSign(role, chan, rawDir);
          HubManager.setChannel(role, chan, sign * Speed.motorValue(), e.seg);
        };
        const release = (ev) => {
          ev.preventDefault();
          if (!HubManager.isConnected(role)) return;
          btn.classList.remove('pressed');
          HubManager.setChannel(role, chan, 0, e.seg);
        };
        btn.addEventListener('mousedown', press);
        btn.addEventListener('touchstart', press, { passive:false });
        btn.addEventListener('mouseup', release);
        btn.addEventListener('mouseleave', release);
        btn.addEventListener('touchend', release);
        btn.addEventListener('touchcancel', release);
      }
      bindHold(negBtn, -1);
      bindHold(posBtn, 1);
      btnRow.appendChild(negBtn); btnRow.appendChild(posBtn);
      card.appendChild(btnRow);
      controls.appendChild(card);
    });
    paneRight.appendChild(controls);

    const stopBtn = document.createElement('button');
    stopBtn.className = 'stop-all'; stopBtn.textContent = '■ Stop alles';
    stopBtn.addEventListener('click', () => HubManager.stopAll(role));
    paneRight.appendChild(stopBtn);

    let logEl = null;
    if (opts.withLog !== false){
      const logHeader = document.createElement('h2'); logHeader.className = 'sect'; logHeader.style.marginTop = '16px'; logHeader.textContent = 'Log';
      logEl = document.createElement('div'); logEl.className = 'log';
      paneRight.appendChild(logHeader);
      paneRight.appendChild(logEl);
      HubManager.onLog((r, msg, cls) => {
        if (r !== role) return;
        const line = document.createElement('div');
        line.className = 'line ' + (cls || '');
        const t = new Date().toLocaleTimeString('nl-NL', { hour12:false });
        line.textContent = '[' + t + '] ' + msg;
        logEl.appendChild(line);
        logEl.scrollTop = logEl.scrollHeight;
        while (logEl.children.length > 150) logEl.removeChild(logEl.firstChild);
      });
    }

    main.appendChild(paneRight);
    wrap.appendChild(main);

    function refreshEnabled(){
      const connected = HubManager.isConnected(role);
      stopBtn.disabled = !connected;
      wrap.querySelectorAll('.hold-btn').forEach(b => b.disabled = !connected);
    }
    HubManager.onChange(refreshEnabled);
    refreshEnabled();

    return wrap;
  }

  // ---------- connectiebalk ----------
  function initConnBar(){
    const btnConnect = document.getElementById('btnConnect');
    const btnSwap = document.getElementById('btnSwap');
    btnConnect.addEventListener('click', () => HubManager.connectNewDevice());
    btnSwap.addEventListener('click', () => HubManager.swapRoles());

    function refresh(){
      ['hub1','hub2'].forEach(role => {
        const dot = document.getElementById('dot' + (role === 'hub1' ? 'Hub1' : 'Hub2'));
        const label = document.getElementById('label' + (role === 'hub1' ? 'Hub1' : 'Hub2'));
        const on = HubManager.isConnected(role);
        dot.classList.toggle('on', on);
        const mac = HubManager.macFor(role);
        label.textContent = on ? ('verbonden' + (mac ? ' (' + mac.slice(-8) + ')' : '')) : 'niet verbonden';
      });
    }
    HubManager.onChange(refresh);
    refresh();
  }

  // ---------- tabs ----------
  function initTabs(){
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      });
    });
  }

  // ---------- Bovenbouw / Rijwerk / Overzicht ----------
  function initHubTabs(){
    document.getElementById('tab-hub1').appendChild(buildHubPanel('hub1', { withLog:true }));
    document.getElementById('tab-hub2').appendChild(buildHubPanel('hub2', { withLog:true }));

    const overzicht = document.getElementById('tab-overzicht');
    const h1 = document.createElement('div'); h1.innerHTML = '<h2 class="sect" style="padding:14px 20px 0;">Bovenbouw</h2>';
    const h2 = document.createElement('div'); h2.innerHTML = '<h2 class="sect" style="padding:14px 20px 0;">Rijwerk</h2>';
    overzicht.appendChild(h1);
    overzicht.appendChild(buildHubPanel('hub1', { withLog:false }));
    overzicht.appendChild(h2);
    overzicht.appendChild(buildHubPanel('hub2', { withLog:false }));

    const stopAllBtn = document.createElement('button');
    stopAllBtn.className = 'stop-all';
    stopAllBtn.style.margin = '0 20px 20px';
    stopAllBtn.style.width = 'calc(100% - 40px)';
    stopAllBtn.textContent = '■ Noodstop (beide hubs)';
    stopAllBtn.addEventListener('click', () => HubManager.stopAllHubs());
    overzicht.appendChild(stopAllBtn);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') HubManager.stopAllHubs();
    });
  }

  // ---------- Controller-tab ----------
  function initControllerTab(){
    const container = document.getElementById('tab-pad');
    Mapping.load();

    const statusBar = document.createElement('div');
    statusBar.className = 'conn-bar';
    statusBar.innerHTML = `
      <span class="status-dot" id="dotPad"></span>
      <span class="status-text" id="statusTextPad" style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-dim);">Geen controller gedetecteerd</span>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-dim);font-family:'JetBrains Mono',monospace;margin-left:auto;">
        <input type="checkbox" id="padEnable" checked> Sturing actief
      </label>
      <button id="padCalibrate">Kalibreer nulpunt</button>
      <button id="padResetMapping" class="danger">Wis mapping</button>
    `;
    container.appendChild(statusBar);

    const main = document.createElement('main');
    const paneL = document.createElement('div'); paneL.className = 'pane';
    const paneR = document.createElement('div'); paneR.className = 'pane';
    paneL.innerHTML = '<h2 class="sect">Assen — beweeg en wijs toe</h2><div id="axisGrid"></div>' +
      '<div class="note">Beweeg stick/trigger/D-pad, herken de bewegende balk, kies een functie. Mapping wordt automatisch onthouden.</div>';
    paneR.innerHTML = '<h2 class="sect">Knoppen — druk en wijs toe</h2><div id="btnGrid"></div>' +
      '<h2 class="sect" style="margin-top:18px;">Noodstop</h2><div id="estopArea"></div>' +
      '<div class="note" id="padDebugId">Controller-ID verschijnt hier zodra gedetecteerd.</div>';
    main.appendChild(paneL); main.appendChild(paneR);
    container.appendChild(main);

    const axisGrid = paneL.querySelector('#axisGrid');
    const btnGrid = paneR.querySelector('#btnGrid');
    const estopArea = paneR.querySelector('#estopArea');
    const padDebugId = paneR.querySelector('#padDebugId');
    const padEnableCb = statusBar.querySelector('#padEnable');
    const dotPad = statusBar.querySelector('#dotPad');
    const statusTextPad = statusBar.querySelector('#statusTextPad');

    const padEnabledRef = { value: true };
    padEnableCb.addEventListener('change', () => { padEnabledRef.value = padEnableCb.checked; });

    statusBar.querySelector('#padResetMapping').addEventListener('click', () => {
      Mapping.reset();
      axisGrid.innerHTML = ''; btnGrid.innerHTML = '';
      axisBlocks = []; btnRows = [];
      renderEstop();
    });
    statusBar.querySelector('#padCalibrate').addEventListener('click', () => {
      const gp = Mapping.getLastGamepad();
      if (!gp) return;
      const m = Mapping.get();
      gp.axes.forEach((v,i) => { if (!m.dpad[i]) m.calib[i] = v; });
      Mapping.save();
    });

    // ---- noodstop chips ----
    function renderEstop(){
      const m = Mapping.get();
      estopArea.innerHTML = '';
      const keyRow = document.createElement('div');
      keyRow.innerHTML = '<div style="font-size:11px;color:var(--text-dim);font-family:\'JetBrains Mono\',monospace;">Toetsenbord-toetsen</div>';
      const keyChips = document.createElement('div'); keyChips.className = 'chip-list';
      m.estop.keys.forEach((k, idx) => {
        const chip = document.createElement('span'); chip.className = 'chip';
        chip.innerHTML = `<span>${k}</span>`;
        const rm = document.createElement('button'); rm.textContent = '✕';
        rm.addEventListener('click', () => { m.estop.keys.splice(idx,1); Mapping.save(); renderEstop(); });
        chip.appendChild(rm); keyChips.appendChild(chip);
      });
      const addKeyBtn = document.createElement('button'); addKeyBtn.textContent = '+ Toets toevoegen';
      addKeyBtn.addEventListener('click', () => {
        addKeyBtn.textContent = 'Druk een toets...';
        Mapping.armCapture((res) => {
          if (res.type === 'key' && !m.estop.keys.includes(res.value)) m.estop.keys.push(res.value);
          Mapping.save(); renderEstop();
        });
      });
      keyRow.appendChild(keyChips); keyRow.appendChild(addKeyBtn);

      const btnRow2 = document.createElement('div'); btnRow2.style.marginTop = '10px';
      btnRow2.innerHTML = '<div style="font-size:11px;color:var(--text-dim);font-family:\'JetBrains Mono\',monospace;">Gamepad-knoppen</div>';
      const btnChips = document.createElement('div'); btnChips.className = 'chip-list';
      m.estop.buttons.forEach((b, idx) => {
        const chip = document.createElement('span'); chip.className = 'chip';
        chip.innerHTML = `<span>B${b}</span>`;
        const rm = document.createElement('button'); rm.textContent = '✕';
        rm.addEventListener('click', () => { m.estop.buttons.splice(idx,1); Mapping.save(); renderEstop(); });
        chip.appendChild(rm); btnChips.appendChild(chip);
      });
      const addBtnBtn = document.createElement('button'); addBtnBtn.textContent = '+ Knop toevoegen';
      addBtnBtn.addEventListener('click', () => {
        addBtnBtn.textContent = 'Druk een knop...';
        Mapping.armCapture((res) => {
          if (res.type === 'button' && !m.estop.buttons.includes(res.value)) m.estop.buttons.push(res.value);
          Mapping.save(); renderEstop();
        });
      });
      btnRow2.appendChild(btnChips); btnRow2.appendChild(addBtnBtn);

      estopArea.appendChild(keyRow);
      estopArea.appendChild(btnRow2);
    }
    renderEstop();

    // ---- assen/knoppen live + mapping ----
    let axisBlocks = [];
    function ensureAxisGrid(count){
      if (axisBlocks.length === count) return;
      axisGrid.innerHTML = ''; axisBlocks = [];
      const m = Mapping.get();
      for (let i = 0; i < count; i++){
        const wrap = document.createElement('div'); wrap.className = 'axis-block';
        wrap.innerHTML = `<div class="axis-label"><span>Axis ${i}</span><span class="axVal">0.00000</span></div>
          <div class="axis-bar-track"><div class="axis-bar-fill"></div></div>`;
        const normalRow = document.createElement('div'); normalRow.className = 'axis-map-row';
        const savedAxis = m.axis[i];
        const select = Mapping.buildAxisSelect(savedAxis);
        select.addEventListener('change', () => {
          if (!select.value) delete m.axis[i];
          else { const [hub,chan] = select.value.split(':'); m.axis[i] = { hub, chan, invert: invertCb.checked }; }
          Mapping.save();
        });
        const invertLabel = document.createElement('label');
        const invertCb = document.createElement('input'); invertCb.type='checkbox'; invertCb.checked = savedAxis ? !!savedAxis.invert : false;
        invertCb.addEventListener('change', () => { if (m.axis[i]){ m.axis[i].invert = invertCb.checked; Mapping.save(); } });
        invertLabel.appendChild(invertCb); invertLabel.appendChild(document.createTextNode('Omkeren'));
        normalRow.appendChild(select); normalRow.appendChild(invertLabel);

        const dpadRow = document.createElement('div'); dpadRow.className = 'axis-map-row'; dpadRow.style.flexWrap='wrap';
        const dpadSaved = m.dpad[i] || {};
        ['up','down','left','right'].forEach(dir => {
          const dirLabel = { up:'Omhoog', down:'Omlaag', left:'Links', right:'Rechts' }[dir];
          const miniWrap = document.createElement('div');
          miniWrap.style.cssText = 'display:flex;flex-direction:column;gap:3px;flex:1 1 45%;';
          const miniLabel = document.createElement('span'); miniLabel.textContent = dirLabel;
          miniLabel.style.cssText = "font-size:10px;color:var(--text-dim);font-family:'JetBrains Mono',monospace;";
          const miniSelect = Mapping.buildButtonSelect(dpadSaved[dir]);
          miniSelect.addEventListener('change', () => {
            if (!m.dpad[i]) m.dpad[i] = {};
            if (!miniSelect.value) delete m.dpad[i][dir];
            else { const [hub,chan,signStr] = miniSelect.value.split(':'); m.dpad[i][dir] = { hub, chan, sign: parseInt(signStr,10) }; }
            Mapping.save();
          });
          miniWrap.appendChild(miniLabel); miniWrap.appendChild(miniSelect); dpadRow.appendChild(miniWrap);
        });

        const toggleLabel = document.createElement('label');
        toggleLabel.style.cssText = "display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-dim);font-family:'JetBrains Mono',monospace;margin-top:6px;";
        const toggleCb = document.createElement('input'); toggleCb.type = 'checkbox';
        const isDpad = !!m.dpad[i];
        toggleCb.checked = isDpad;
        normalRow.style.display = isDpad ? 'none' : 'flex';
        dpadRow.style.display = isDpad ? 'flex' : 'none';
        toggleCb.addEventListener('change', () => {
          if (toggleCb.checked){ delete m.axis[i]; m.dpad[i] = m.dpad[i] || {}; normalRow.style.display='none'; dpadRow.style.display='flex'; }
          else { delete m.dpad[i]; normalRow.style.display='flex'; dpadRow.style.display='none'; }
          Mapping.save();
        });
        toggleLabel.appendChild(toggleCb); toggleLabel.appendChild(document.createTextNode('Dit is een D-pad / hat-switch (4 richtingen)'));

        wrap.appendChild(normalRow); wrap.appendChild(dpadRow); wrap.appendChild(toggleLabel);
        axisGrid.appendChild(wrap);
        axisBlocks.push({ val: wrap.querySelector('.axVal'), bar: wrap.querySelector('.axis-bar-fill') });
      }
    }

    let btnRows = [];
    function ensureButtonGrid(count){
      if (btnRows.length === count) return;
      btnGrid.innerHTML = ''; btnRows = [];
      const m = Mapping.get();
      for (let i = 0; i < count; i++){
        const row = document.createElement('div'); row.className = 'btn-row-map';
        const idx = document.createElement('div'); idx.className = 'btn-idx'; idx.textContent = 'B' + i;
        const saved = m.button[i];
        const select = Mapping.buildButtonSelect(saved);
        select.addEventListener('change', () => {
          if (!select.value) delete m.button[i];
          else {
            const parts = select.value.split(':');
            m.button[i] = { hub: parts[0], chan: parts[1], sign: parseInt(parts[2],10) };
          }
          Mapping.save();
        });
        row.appendChild(idx); row.appendChild(select);
        btnGrid.appendChild(row);
        btnRows.push({ idx });
      }
    }

    Mapping.registerUI({
      updateStatus(gp){
        dotPad.classList.toggle('on', !!gp);
        statusTextPad.textContent = gp ? ('Verbonden: ' + gp.id) : 'Geen controller gedetecteerd (druk een knop in)';
        if (gp) padDebugId.textContent = 'ID: ' + gp.id + ' · assen: ' + gp.axes.length + ' · knoppen: ' + gp.buttons.length + ' · mapping: ' + (gp.mapping || 'n/a');
      },
      updateLive(gp){
        ensureAxisGrid(gp.axes.length);
        gp.axes.forEach((raw,i) => {
          const b = axisBlocks[i]; if (!b) return;
          b.val.textContent = raw.toFixed(5);
          const clamped = Math.max(-1, Math.min(1, raw));
          const pct = clamped * 50;
          b.bar.style.width = Math.abs(pct) + '%';
          b.bar.style.left = pct < 0 ? (50+pct) + '%' : '50%';
        });
        ensureButtonGrid(gp.buttons.length);
        gp.buttons.forEach((b,i) => { const row = btnRows[i]; if (row) row.idx.classList.toggle('pressed', b.pressed || b.value > 0.5); });
      }
    }, padEnabledRef);

    requestAnimationFrame(Mapping.poll);
  }

  // ---------- Sequences-tab ----------
  function initSequencesTab(){
    const container = document.getElementById('tab-seq');
    container.innerHTML = `
      <div class="pane">
        <h2 class="sect">Opnemen</h2>
        <div class="rec-status" id="recStatus">Klaar om op te nemen</div>
        <div class="rec-clock" id="recClock">00:00.0</div>
        <div class="rec-controls">
          <button id="btnRecStart">● Opnemen</button>
          <button id="btnRecPause" disabled>Pauze</button>
          <button id="btnRecResume" disabled>Hervat</button>
          <button id="btnRecStop" disabled class="danger">■ Stop &amp; bewaar</button>
        </div>
        <div class="note">Opname legt beide hubs vast in dezelfde tijdlijn, alleen bij daadwerkelijke veranderingen (geen vaste interval).</div>
      </div>
      <div class="pane">
        <h2 class="sect">Sequences</h2>
        <button id="btnImportSeq">Importeer sequence</button>
        <div class="seq-list" id="seqList" style="margin-top:12px;"></div>
      </div>
    `;

    const recStatus = container.querySelector('#recStatus');
    const recClock = container.querySelector('#recClock');
    const btnStart = container.querySelector('#btnRecStart');
    const btnPause = container.querySelector('#btnRecPause');
    const btnResume = container.querySelector('#btnRecResume');
    const btnStop = container.querySelector('#btnRecStop');
    const seqList = container.querySelector('#seqList');

    function fmtClock(ms){
      const totalSec = ms / 1000;
      const m = Math.floor(totalSec / 60);
      const s = (totalSec % 60).toFixed(1).padStart(4,'0');
      return String(m).padStart(2,'0') + ':' + s;
    }

    let clockTimer = null;
    function tickClock(){ recClock.textContent = fmtClock(SequenceRecorder.elapsedMs()); }

    SequenceRecorder.onChange((state) => {
      recStatus.textContent = state === 'recording' ? 'Bezig met opnemen...' : state === 'paused' ? 'Gepauzeerd' : 'Klaar om op te nemen';
      btnStart.disabled = state !== 'idle';
      btnPause.disabled = state !== 'recording';
      btnResume.disabled = state !== 'paused';
      btnStop.disabled = state === 'idle';
      if (state === 'recording'){ if (!clockTimer) clockTimer = setInterval(tickClock, 100); }
      else { if (clockTimer){ clearInterval(clockTimer); clockTimer = null; } tickClock(); }
    });

    btnStart.addEventListener('click', () => SequenceRecorder.start());
    btnPause.addEventListener('click', () => SequenceRecorder.pause());
    btnResume.addEventListener('click', () => SequenceRecorder.resume());
    btnStop.addEventListener('click', () => {
      const events = SequenceRecorder.stop();
      if (!events || !events.length){ return; }
      const name = prompt('Naam voor deze sequence:', 'sequence-' + Storage.timestampForFilename());
      if (!name) return;
      const seq = { id: 'seq_' + Date.now(), name, createdAt: Storage.isoTimestamp(), events };
      SequenceStore.upsert(seq);
      renderSeqList();
    });

    function renderTimeline(seq){
      const chans = {};
      seq.events.forEach(ev => {
        const key = ev.hub + ':' + ev.chan;
        if (!chans[key]) chans[key] = [];
        chans[key].push(ev);
      });
      const maxT = Math.max(1, ...seq.events.map(e => e.t));
      const wrap = document.createElement('div'); wrap.className = 'timeline';
      Object.keys(chans).forEach(key => {
        const evs = chans[key].sort((a,b) => a.t - b.t);
        const row = document.createElement('div'); row.className = 'timeline-row';
        const label = document.createElement('div'); label.className = 'tl-label'; label.textContent = key;
        const track = document.createElement('div'); track.className = 'tl-track';
        for (let i = 0; i < evs.length; i++){
          if (evs[i].val === 0) continue;
          const startT = evs[i].t;
          const endT = (i+1 < evs.length) ? evs[i+1].t : maxT;
          const block = document.createElement('div'); block.className = 'tl-block';
          block.style.left = (startT / maxT * 100) + '%';
          block.style.width = Math.max(0.5, (endT - startT) / maxT * 100) + '%';
          track.appendChild(block);
        }
        row.appendChild(label); row.appendChild(track);
        wrap.appendChild(row);
      });
      return wrap;
    }

    function renderSeqList(){
      seqList.innerHTML = '';
      const all = SequenceStore.all();
      Object.values(all).sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||'')).forEach(seq => {
        const item = document.createElement('div'); item.className = 'seq-item';
        const duration = seq.events.length ? Math.max(...seq.events.map(e => e.t)) : 0;
        item.innerHTML = `<span class="name">${seq.name}</span><span class="meta">${(duration/1000).toFixed(1)}s · ${seq.events.length} events</span>`;

        const loopLabel = document.createElement('label');
        loopLabel.style.cssText = "display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-dim);font-family:'JetBrains Mono',monospace;";
        const loopCb = document.createElement('input'); loopCb.type = 'checkbox';
        loopLabel.appendChild(loopCb); loopLabel.appendChild(document.createTextNode('loop'));

        const playBtn = document.createElement('button'); playBtn.textContent = '▶ Afspelen';
        playBtn.addEventListener('click', () => {
          if (SequencePlayer.getState() === 'playing'){ SequencePlayer.stop(); playBtn.textContent = '▶ Afspelen'; return; }
          SequencePlayer.play(seq, { loop: loopCb.checked });
          playBtn.textContent = '■ Stop';
        });
        SequencePlayer.onChange(state => { if (state === 'idle') playBtn.textContent = '▶ Afspelen'; });

        const exportBtn = document.createElement('button'); exportBtn.textContent = 'Exporteer';
        exportBtn.addEventListener('click', () => SequenceIO.exportSequence(seq));

        const delBtn = document.createElement('button'); delBtn.className = 'danger'; delBtn.textContent = 'Verwijder';
        delBtn.addEventListener('click', () => {
          if (confirm('Sequence "' + seq.name + '" verwijderen?')){ SequenceStore.remove(seq.id); renderSeqList(); }
        });

        item.appendChild(loopLabel);
        item.appendChild(playBtn);
        item.appendChild(exportBtn);
        item.appendChild(delBtn);
        item.appendChild(renderTimeline(seq));
        seqList.appendChild(item);
      });
      if (!Object.keys(all).length){
        seqList.innerHTML = '<div class="note">Nog geen sequences opgenomen of geïmporteerd.</div>';
      }
    }

    container.querySelector('#btnImportSeq').addEventListener('click', async () => {
      try{
        await SequenceIO.importSequence(async (name) => {
          return new Promise(resolve => {
            const root = document.getElementById('modalRoot');
            root.innerHTML = `
              <div class="modal-backdrop"><div class="modal">
                <h3>Naam bestaat al</h3>
                <p>Er bestaat al een sequence genaamd "${name}". Wat wil je doen?</p>
                <div class="modal-actions">
                  <button id="mCancel">Annuleren</button>
                  <button id="mRename">Hernoemen</button>
                  <button id="mOverwrite" class="danger">Overschrijven</button>
                </div>
              </div></div>`;
            root.querySelector('#mCancel').addEventListener('click', () => { root.innerHTML=''; resolve('cancel'); });
            root.querySelector('#mRename').addEventListener('click', () => { root.innerHTML=''; resolve('rename'); });
            root.querySelector('#mOverwrite').addEventListener('click', () => { root.innerHTML=''; resolve('overwrite'); });
          });
        });
        renderSeqList();
      } catch(e){ alert('Import mislukt: ' + e.message); }
    });

    renderSeqList();
    tickClock();
  }

  // ---------- Instellingen-tab ----------
  function initSettingsTab(){
    const container = document.getElementById('tab-settings');
    container.innerHTML = `
      <div class="pane">
        <h2 class="sect">Configuratie-back-up</h2>
        <p style="font-size:13px;color:var(--text-dim);line-height:1.6;">
          Eén bestand met de motor-kanaal-configuratie (welk kanaal doet wat,
          incl. omkering), de gamepad/toetsenbord-mapping en de hub-herkenning
          (welk MAC-adres bij welke hub hoort). Werkt overal, ongeacht
          computer — de koppeling zit aan de micro:bit-chip zelf vast.
        </p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button id="btnExportSettings">Exporteer instellingen</button>
          <button id="btnImportSettings">Importeer instellingen</button>
        </div>
        <div class="note">Bevat geen kracht-waarde (start altijd op 7) en geen sequences (die exporteer je los, per sequence, op de Sequences-tab).</div>
      </div>
      <div class="pane">
        <h2 class="sect">Resetten</h2>
        <p style="font-size:13px;color:var(--text-dim);line-height:1.6;">
          Zet de motor-kanaal-configuratie terug naar de ingebouwde standaard
          (Bak/Steel/Rotatie/Giek op hub 1, Rups links/rechts op hub 2).
        </p>
        <button id="btnResetMotorConfig" class="danger">Wis motor-kanaal-mapping</button>
      </div>
    `;
    container.querySelector('#btnExportSettings').addEventListener('click', () => SettingsIO.exportSettings());
    container.querySelector('#btnImportSettings').addEventListener('click', async () => {
      try{ await SettingsIO.importSettings(); alert('Instellingen geïmporteerd. Pagina wordt herladen.'); location.reload(); }
      catch(e){ alert('Import mislukt: ' + e.message); }
    });
    container.querySelector('#btnResetMotorConfig').addEventListener('click', () => {
      if (confirm('Motor-kanaal-mapping terugzetten naar standaard?')){ MotorConfig.reset(); alert('Gereset. Pagina wordt herladen.'); location.reload(); }
    });
  }

  function init(){
    initConnBar();
    initTabs();
    initHubTabs();
    initControllerTab();
    initSequencesTab();
    initSettingsTab();
  }

  return { init, buildHubPanel };
})();
