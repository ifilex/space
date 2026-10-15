/**
 * Space Invaders: Neon Assault 90s - Settings, Gamepad Remapping & Cloud Save Modal
 */

import React, { useEffect, useState } from 'react';
import { GameSettings, KeyBindings } from '../types';
import { Settings, Gamepad, Keyboard, Cloud, Volume2, Monitor, X, Check, RefreshCw } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  pilotId: string;
  onSyncCloud: (pilotId: string) => Promise<boolean>;
  onRestoreCloud: (pilotId: string) => Promise<boolean>;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  pilotId,
  onSyncCloud,
  onRestoreCloud,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'gamepad' | 'audio_video' | 'cloud'>('controls');
  const [localSettings, setLocalSettings] = useState<GameSettings>(settings);
  const [remappingKey, setRemappingKey] = useState<keyof KeyBindings | null>(null);
  const [connectedGamepads, setConnectedGamepads] = useState<string[]>([]);
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);
  const [syncIdInput, setSyncIdInput] = useState(pilotId);

  // Poll for connected gamepads
  useEffect(() => {
    const updateGamepads = () => {
      if (typeof navigator !== 'undefined' && navigator.getGamepads) {
        const pads = navigator.getGamepads();
        const names: string[] = [];
        for (let i = 0; i < pads.length; i++) {
          if (pads[i]) {
            names.push(`${pads[i]!.id} (Slot ${i})`);
          }
        }
        setConnectedGamepads(names);
      }
    };

    updateGamepads();
    const interval = setInterval(updateGamepads, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard capture for remapping
  useEffect(() => {
    if (!remappingKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const newBindings = { ...localSettings.keyBindings, [remappingKey]: e.code };
      const updated = { ...localSettings, keyBindings: newBindings };
      setLocalSettings(updated);
      onUpdateSettings(updated);
      setRemappingKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [remappingKey, localSettings, onUpdateSettings]);

  const handleSoundChange = (sfx: number, music: number) => {
    const updated = { ...localSettings, soundVolume: sfx, musicVolume: music };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    soundEngine.setVolumes(sfx, music);
  };

  const handleCloudSync = async () => {
    setCloudStatus('Sincronizando con la nube...');
    const ok = await onSyncCloud(syncIdInput);
    setCloudStatus(ok ? '✅ ¡Datos sincronizados con éxito en la nube!' : '❌ Error al sincronizar.');
  };

  const handleCloudRestore = async () => {
    setCloudStatus('Recuperando datos desde la nube...');
    const ok = await onRestoreCloud(syncIdInput);
    setCloudStatus(ok ? '✅ ¡Progreso restaurado correctamente!' : '❌ No se encontró partida en la nube.');
  };

  return (
    <div id="modal-settings" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-gray-950 border-2 border-cyan-500/60 rounded-xl p-6 shadow-2xl shadow-cyan-500/20 text-white max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-cyan-500/30 pb-4">
          <div className="p-3 bg-cyan-950/60 border border-cyan-500/50 rounded-lg">
            <Settings className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-pixel text-cyan-300 tracking-wider">
              CONFIGURACIÓN Y MANDOS
            </h2>
            <p className="text-xs text-gray-400 font-retro">
              Personaliza controles de teclado, gamepad, visuales retro y guardado en la nube
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-white/10 pb-3 mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('controls')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-pixel transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'controls' ? 'bg-cyan-500 text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            TECLADO
          </button>
          <button
            onClick={() => setActiveTab('gamepad')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-pixel transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'gamepad' ? 'bg-cyan-500 text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Gamepad className="w-3.5 h-3.5" />
            MANDO / GAMEPAD
          </button>
          <button
            onClick={() => setActiveTab('audio_video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-pixel transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'audio_video' ? 'bg-cyan-500 text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            AUDIO & CRT
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-pixel transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'cloud' ? 'bg-cyan-500 text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            NUBE
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Controls Tab */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                <h3 className="text-xs font-pixel text-cyan-400 mb-3">JUGADOR 1 (CYAN)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'p1Left', label: 'Izquierda' },
                    { key: 'p1Right', label: 'Derecha' },
                    { key: 'p1Up', label: 'Arriba' },
                    { key: 'p1Down', label: 'Abajo' },
                    { key: 'p1Fire', label: 'Disparo' },
                    { key: 'p1Emp', label: 'Pulso EMP' },
                  ].map((item) => (
                    <div key={item.key} className="bg-gray-900 border border-gray-800 p-2 rounded flex flex-col gap-1">
                      <span className="text-[10px] text-gray-400 font-retro">{item.label}</span>
                      <button
                        onClick={() => setRemappingKey(item.key as keyof KeyBindings)}
                        className={`px-2 py-1 text-xs font-pixel rounded text-center border cursor-pointer ${
                          remappingKey === item.key
                            ? 'bg-amber-500 text-black border-amber-300 animate-pulse'
                            : 'bg-black/60 text-cyan-300 border-cyan-500/30 hover:border-cyan-400'
                        }`}
                      >
                        {remappingKey === item.key ? 'PRESIONA TECLA' : localSettings.keyBindings[item.key as keyof KeyBindings]}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                <h3 className="text-xs font-pixel text-pink-400 mb-3">JUGADOR 2 - CO-OP (MAGENTA)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'p2Left', label: 'Izquierda' },
                    { key: 'p2Right', label: 'Derecha' },
                    { key: 'p2Up', label: 'Arriba' },
                    { key: 'p2Down', label: 'Abajo' },
                    { key: 'p2Fire', label: 'Disparo' },
                    { key: 'p2Emp', label: 'Pulso EMP' },
                  ].map((item) => (
                    <div key={item.key} className="bg-gray-900 border border-gray-800 p-2 rounded flex flex-col gap-1">
                      <span className="text-[10px] text-gray-400 font-retro">{item.label}</span>
                      <button
                        onClick={() => setRemappingKey(item.key as keyof KeyBindings)}
                        className={`px-2 py-1 text-xs font-pixel rounded text-center border cursor-pointer ${
                          remappingKey === item.key
                            ? 'bg-amber-500 text-black border-amber-300 animate-pulse'
                            : 'bg-black/60 text-pink-300 border-pink-500/30 hover:border-pink-400'
                        }`}
                      >
                        {remappingKey === item.key ? 'PRESIONA TECLA' : localSettings.keyBindings[item.key as keyof KeyBindings]}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Gamepad Tab */}
          {activeTab === 'gamepad' && (
            <div className="space-y-4">
              <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                <h3 className="text-xs font-pixel text-cyan-400 mb-2">MANDOS DETECTADOS</h3>
                {connectedGamepads.length === 0 ? (
                  <div className="py-6 text-center text-gray-500 text-xs font-retro">
                    Conecta un mando USB o Bluetooth (Xbox, PlayStation, 8BitDo o genérico) y presiona cualquier botón para inicializarlo.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {connectedGamepads.map((name, i) => (
                      <div key={i} className="p-3 bg-cyan-950/30 border border-cyan-500/40 rounded flex items-center gap-3">
                        <Gamepad className="w-5 h-5 text-cyan-400" />
                        <span className="text-xs font-pixel text-cyan-200">{name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                <h3 className="text-xs font-pixel text-cyan-400 mb-2">MAPEO ESTÁNDAR DE MANDOS</h3>
                <ul className="text-xs text-gray-300 font-retro space-y-2">
                  <li>🎮 <strong className="text-cyan-300">Stick Analógico Izquierdo / D-Pad:</strong> Movimiento con aceleración</li>
                  <li>⚡ <strong className="text-cyan-300">Botón A / Cruz / Gatillo R2:</strong> Disparo principal continuo</li>
                  <li>💣 <strong className="text-cyan-300">Botón B / Círculo / Gatillo L2:</strong> Pulso de choque EMP</li>
                  <li>⏸️ <strong className="text-cyan-300">Start / Options:</strong> Pausa</li>
                </ul>
              </div>
            </div>
          )}

          {/* Audio & Video Tab */}
          {activeTab === 'audio_video' && (
            <div className="space-y-4">
              <div className="bg-black/50 border border-white/10 rounded-lg p-4 space-y-4">
                <h3 className="text-xs font-pixel text-cyan-400">VOLUMEN DE SONIDO Y MÚSICA</h3>
                <div>
                  <div className="flex justify-between text-xs font-pixel text-gray-400 mb-1">
                    <span>EFECTOS DE SONIDO (SFX)</span>
                    <span className="text-cyan-300">{Math.round(localSettings.soundVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={localSettings.soundVolume}
                    onChange={(e) => handleSoundChange(parseFloat(e.target.value), localSettings.musicVolume)}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-pixel text-gray-400 mb-1">
                    <span>BANDA SONORA DINÁMICA</span>
                    <span className="text-cyan-300">{Math.round(localSettings.musicVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={localSettings.musicVolume}
                    onChange={(e) => handleSoundChange(localSettings.soundVolume, parseFloat(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>

              <div className="bg-black/50 border border-white/10 rounded-lg p-4 space-y-4">
                <h3 className="text-xs font-pixel text-cyan-400">EFECTOS VISUALES RETRO</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-retro text-gray-300">Efecto Filtro CRT (Líneas de Escaneo)</span>
                  <input
                    type="checkbox"
                    checked={localSettings.crtEffect}
                    onChange={(e) => {
                      const updated = { ...localSettings, crtEffect: e.target.checked };
                      setLocalSettings(updated);
                      onUpdateSettings(updated);
                    }}
                    className="w-4 h-4 accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-retro text-gray-300">Vibración de Pantalla (Screen Shake)</span>
                  <input
                    type="checkbox"
                    checked={localSettings.screenShake}
                    onChange={(e) => {
                      const updated = { ...localSettings, screenShake: e.target.checked };
                      setLocalSettings(updated);
                      onUpdateSettings(updated);
                    }}
                    className="w-4 h-4 accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-retro text-gray-300">Controles Táctiles Transparentes</span>
                  <select
                    value={localSettings.touchControlsMode}
                    onChange={(e) => {
                      const updated = {
                        ...localSettings,
                        touchControlsMode: e.target.value as 'auto' | 'always' | 'never',
                      };
                      setLocalSettings(updated);
                      onUpdateSettings(updated);
                    }}
                    className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs font-pixel text-cyan-300"
                  >
                    <option value="auto">Automático (Celulares/Tablets)</option>
                    <option value="always">Siempre Activo</option>
                    <option value="never">Desactivado</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Cloud Save Tab */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <div className="bg-black/50 border border-white/10 rounded-lg p-4 space-y-3">
                <h3 className="text-xs font-pixel text-cyan-400">SINCRONIZACIÓN MULTIPLATAFORMA</h3>
                <p className="text-xs text-gray-300 font-retro leading-relaxed">
                  Guarda tu progreso, logros desbloqueados y récords en la nube para continuar jugando en cualquier
                  computadora, teléfono o tablet mediante tu código de piloto estelar.
                </p>

                <div>
                  <label className="text-[10px] font-pixel text-gray-400">CÓDIGO DE PILOTO ESTELAR</label>
                  <input
                    type="text"
                    value={syncIdInput}
                    onChange={(e) => setSyncIdInput(e.target.value.toUpperCase())}
                    className="w-full mt-1 px-3 py-2 bg-gray-900 border border-cyan-500/50 rounded text-sm font-pixel text-cyan-200 tracking-widest"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={handleCloudSync}
                    className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-pixel text-xs rounded font-bold cursor-pointer"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    SUBIR A LA NUBE
                  </button>

                  <button
                    onClick={handleCloudRestore}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-pixel text-xs rounded font-bold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    RESTAURAR DESDE LA NUBE
                  </button>
                </div>

                {cloudStatus && (
                  <div className="text-xs font-pixel text-amber-300 bg-black/60 p-2.5 rounded border border-amber-500/30">
                    {cloudStatus}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
