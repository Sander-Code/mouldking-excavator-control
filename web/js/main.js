// ============================================================
// main — bootstrap
// ============================================================
(function(){
  if (!('serial' in navigator)){
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('btnConnect').disabled = true;
      document.getElementById('btnConnect').title = 'Web Serial niet beschikbaar — gebruik Chrome of Edge';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    MotorConfig.load();
    UI.init();
  });
})();
