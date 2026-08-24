// ============================================================
// Storage — generieke localStorage- en bestands-export/import-helpers
// ============================================================
const Storage = (() => {
  function loadJSON(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch(e){ return fallback; }
  }

  function saveJSON(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); }
    catch(e){ console.error('Storage.saveJSON mislukt voor', key, e); }
  }

  // bv. 2026-08-16_143205
  function timestampForFilename(d){
    d = d || new Date();
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate()) +
      '_' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  function isoTimestamp(d){
    return (d || new Date()).toISOString();
  }

  function sanitizeFilename(name){
    const cleaned = (name || 'naamloos').trim()
      .replace(/[^a-zA-Z0-9 _-]/g, '')
      .replace(/\s+/g, '-');
    return cleaned || 'naamloos';
  }

  function downloadJSON(obj, filename){
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function pickJSONFile(){
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file){ reject(new Error('Geen bestand gekozen')); return; }
        const reader = new FileReader();
        reader.onload = () => {
          try{ resolve(JSON.parse(reader.result)); }
          catch(e){ reject(new Error('Ongeldig JSON-bestand: ' + e.message)); }
        };
        reader.onerror = () => reject(new Error('Bestand lezen mislukt'));
        reader.readAsText(file);
      });
      input.click();
    });
  }

  return { loadJSON, saveJSON, timestampForFilename, isoTimestamp, sanitizeFilename, downloadJSON, pickJSONFile };
})();
