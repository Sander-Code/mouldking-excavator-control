// ============================================================
// SettingsIO — export/import van de volledige configuratie
// (motor-kanaal-mapping + gamepad/toetsenbord-mapping + hub-registry)
// als één back-up-bestand. Geen bewerk-UI hiervoor nodig — gewoon
// opnieuw exporteren na wijzigingen.
// ============================================================
const SettingsIO = (() => {
  function exportSettings(){
    const payload = {
      schemaVersion: 1,
      exportedAt: Storage.isoTimestamp(),
      motorConfig: MotorConfig.get(),
      gamepadMapping: Mapping.get(),
      hubRegistry: HubManager.getRegistry()
    };
    const filename = 'mouldking-settings_' + Storage.timestampForFilename() + '.json';
    Storage.downloadJSON(payload, filename);
  }

  async function importSettings(){
    const data = await Storage.pickJSONFile();
    if (!data || !data.motorConfig) throw new Error('Bestand mist een geldige "motorConfig"-sectie.');
    MotorConfig.set(data.motorConfig);
    if (data.gamepadMapping) Mapping.set(data.gamepadMapping);
    if (data.hubRegistry) HubManager.setRegistry(data.hubRegistry);
  }

  return { exportSettings, importSettings };
})();
