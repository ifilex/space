/**
 * Space Invaders: Neon Assault 90s - Main Application Component
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameMode,
  GameSettings,
  KeyBindings,
  Achievement,
  AsyncChallenge,
} from './types';
import { GameEngine } from './game/engine';
import { INITIAL_ACHIEVEMENTS } from './game/achievements';
import { GameHUD } from './components/GameHUD';
import { TouchControls } from './components/TouchControls';
import { CognitiveReportModal } from './components/CognitiveReportModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AsyncChallengesModal } from './components/AsyncChallengesModal';
import { AchievementsModal } from './components/AchievementsModal';
import { SettingsModal } from './components/SettingsModal';
import {
  Play,
  Clock,
  Users,
  Trophy,
  Brain,
  Award,
  Settings,
  Swords,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

const DEFAULT_KEYBINDINGS: KeyBindings = {
  p1Left: 'ArrowLeft',
  p1Right: 'ArrowRight',
  p1Up: 'ArrowUp',
  p1Down: 'ArrowDown',
  p1Fire: 'Space',
  p1Emp: 'KeyX',
  p2Left: 'KeyA',
  p2Right: 'KeyD',
  p2Up: 'KeyW',
  p2Down: 'KeyS',
  p2Fire: 'KeyF',
  p2Emp: 'KeyG',
  pause: 'Escape',
};

const DEFAULT_SETTINGS: GameSettings = {
  soundVolume: 0.7,
  musicVolume: 0.5,
  crtEffect: true,
  screenShake: true,
  particlesIntensity: 'epic',
  touchControlsMode: 'auto',
  keyBindings: DEFAULT_KEYBINDINGS,
  gamepadDeadzone: 0.15,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const touchInputRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Settings & pilot profile
  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('space_invaders_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [pilotId, setPilotId] = useState<string>(() => {
    const saved = localStorage.getItem('space_invaders_pilot_id');
    return saved || `PILOT-${Math.floor(1000 + Math.random() * 9000)}`;
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('space_invaders_achievements');
    return saved ? JSON.parse(saved) : INITIAL_ACHIEVEMENTS;
  });

  // UI state
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [currentMode, setCurrentMode] = useState<GameMode>('classic');
  const [isPaused, setIsPaused] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'none' | 'leaderboard' | 'cognitive' | 'challenges' | 'achievements' | 'settings'
  >('none');

  // In-game HUD sync state
  const [hudState, setHudState] = useState({
    score: 0,
    wave: 1,
    stageTitle: '',
    gameInspiration: '',
    timeAttackRemainingMs: 180000,
    chronoWarpTimer: 0,
    p1: null as any,
    p2: null as any,
    cognitiveMetrics: null as any,
  });

  // Active challenge if playing async challenge
  const [activeChallenge, setActiveChallenge] = useState<AsyncChallenge | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('space_invaders_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('space_invaders_pilot_id', pilotId);
  }, [pilotId]);

  useEffect(() => {
    localStorage.setItem('space_invaders_achievements', JSON.stringify(achievements));
  }, [achievements]);

  // Unlock achievement helper
  const unlockAchievement = useCallback((id: string) => {
    setAchievements((prev) =>
      prev.map((a) =>
        a.id === id && !a.unlocked
          ? { ...a, unlocked: true, unlockedAt: new Date().toLocaleDateString() }
          : a
      )
    );
  }, []);

  // Initialize Canvas & Game Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, settings);
    engineRef.current = engine;

    engine.onGameOver = (stats) => {
      setGameState('gameover');
      if (stats.score >= 50000 && stats.mode === 'timeattack') {
        unlockAchievement('speed_demon');
      }
    };

    engine.onWaveComplete = (wave) => {
      if (wave >= 2) unlockAchievement('first_blood');
      if (wave >= 5) unlockAchievement('bydo_slayer');
    };

    const handleResize = () => {
      if (canvasRef.current && engineRef.current) {
        engineRef.current.resize(
          canvasRef.current.parentElement?.clientWidth || 800,
          canvasRef.current.parentElement?.clientHeight || 900
        );
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, []);

  // HUD sync loop
  useEffect(() => {
    const interval = setInterval(() => {
      const eng = engineRef.current;
      if (eng && eng.isRunning) {
        const cogMetrics = eng.cognitive.computeMetrics(eng.p1, eng.p2);
        setHudState({
          score: eng.score,
          wave: eng.wave,
          stageTitle: eng.currentStage?.title || '',
          gameInspiration: eng.currentStage?.gameInspiration || '',
          timeAttackRemainingMs: eng.timeAttackRemainingMs,
          chronoWarpTimer: eng.chronoWarpTimer,
          p1: { ...eng.p1 },
          p2: eng.p2 ? { ...eng.p2 } : null,
          cognitiveMetrics: cogMetrics,
        });

        // Check dynamic achievements
        if (cogMetrics.flowStateRating === 'Dominio Absoluto' && cogMetrics.avgReactionTimeMs < 240) {
          unlockAchievement('cognitive_master');
        }
        if (eng.p1.weaponLevel >= 3) {
          unlockAchievement('max_overclock');
        }
        if (eng.isCoop) {
          unlockAchievement('coop_synergy');
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [unlockAchievement]);

  // Keyboard controls listener
  useEffect(() => {
    const keysPressed = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrows and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      keysPressed.add(e.code);
      const eng = engineRef.current;
      if (!eng || !eng.isRunning) return;

      const kb = settings.keyBindings;

      // Pause toggle
      if (e.code === kb.pause) {
        eng.togglePause();
        setIsPaused(eng.isPaused);
        return;
      }

      // EMP Trigger
      if (e.code === kb.p1Emp) {
        eng.triggerEmp(1);
        unlockAchievement('emp_purification');
      }
      if (eng.isCoop && e.code === kb.p2Emp) {
        eng.triggerEmp(2);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Unified 60Hz input sampling loop (Keyboard, Touch Joystick, and Gamepad)
    const inputInterval = setInterval(() => {
      const eng = engineRef.current;
      if (!eng || !eng.isRunning || eng.isPaused) return;

      const kb = settings.keyBindings;

      // 1. Keyboard primary input
      let p1X = 0;
      let p1Y = 0;
      if (keysPressed.has(kb.p1Left)) p1X -= 1;
      if (keysPressed.has(kb.p1Right)) p1X += 1;
      if (keysPressed.has(kb.p1Up)) p1Y -= 1;
      if (keysPressed.has(kb.p1Down)) p1Y += 1;

      // 2. Touch Virtual Joystick override if dragged
      if (touchInputRef.current.x !== 0 || touchInputRef.current.y !== 0) {
        p1X = touchInputRef.current.x;
        p1Y = touchInputRef.current.y;
      }

      // 3. Gamepad polling (P1 & P2)
      let p2X = 0;
      let p2Y = 0;
      if (keysPressed.has(kb.p2Left)) p2X -= 1;
      if (keysPressed.has(kb.p2Right)) p2X += 1;
      if (keysPressed.has(kb.p2Up)) p2Y -= 1;
      if (keysPressed.has(kb.p2Down)) p2Y += 1;

      if (typeof navigator !== 'undefined' && navigator.getGamepads) {
        const pads = navigator.getGamepads();
        const deadzone = settings.gamepadDeadzone;

        // Gamepad 1 for Player 1
        const pad1 = pads[0];
        if (pad1) {
          let gx = pad1.axes[0] || 0;
          let gy = pad1.axes[1] || 0;

          // D-Pad override
          if (pad1.buttons[14]?.pressed) gx = -1;
          if (pad1.buttons[15]?.pressed) gx = 1;
          if (pad1.buttons[12]?.pressed) gy = -1;
          if (pad1.buttons[13]?.pressed) gy = 1;

          if (Math.abs(gx) > deadzone) p1X = gx;
          if (Math.abs(gy) > deadzone) p1Y = gy;

          // Fire
          if (pad1.buttons[0]?.pressed || pad1.buttons[7]?.pressed) {
            eng.fireWeapon(1);
          }
          // EMP
          if (pad1.buttons[1]?.pressed || pad1.buttons[6]?.pressed) {
            eng.triggerEmp(1);
          }
        }

        // Gamepad 2 for Player 2 (Co-op)
        if (eng.isCoop && pads[1]) {
          const pad2 = pads[1];
          let gx2 = pad2.axes[0] || 0;
          let gy2 = pad2.axes[1] || 0;

          if (pad2.buttons[14]?.pressed) gx2 = -1;
          if (pad2.buttons[15]?.pressed) gx2 = 1;
          if (pad2.buttons[12]?.pressed) gy2 = -1;
          if (pad2.buttons[13]?.pressed) gy2 = 1;

          if (Math.abs(gx2) > deadzone) p2X = gx2;
          if (Math.abs(gy2) > deadzone) p2Y = gy2;

          if (pad2.buttons[0]?.pressed || pad2.buttons[7]?.pressed) {
            eng.fireWeapon(2);
          }
          if (pad2.buttons[1]?.pressed || pad2.buttons[6]?.pressed) {
            eng.triggerEmp(2);
          }
        }
      }

      // Deliver cleanly to engine without competing loop conflicts
      eng.setPlayerInput(1, p1X, p1Y);

      if (keysPressed.has(kb.p1Fire)) {
        eng.fireWeapon(1);
      }

      if (eng.isCoop) {
        eng.setPlayerInput(2, p2X, p2Y);
        if (keysPressed.has(kb.p2Fire)) {
          eng.fireWeapon(2);
        }
      }
    }, 16);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(inputInterval);
    };
  }, [settings.keyBindings, settings.gamepadDeadzone, unlockAchievement]);

  // Start game handler
  const startGame = (mode: GameMode = 'classic', challenge?: AsyncChallenge) => {
    setCurrentMode(mode);
    setActiveChallenge(challenge || null);
    setGameState('playing');
    setIsPaused(false);
    setActiveModal('none');

    if (engineRef.current) {
      engineRef.current.start(mode);
    }
  };

  // Cloud Sync handlers
  const handleCloudSync = async (userPilotId: string) => {
    try {
      const stateToSave = {
        pilotId: userPilotId,
        settings,
        achievements,
        highScore: hudState.score,
      };
      const res = await fetch('/api/cloud-save/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userPilotId, state: stateToSave }),
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch (e) {
      console.warn('Cloud sync error:', e);
      return false;
    }
  };

  const handleCloudRestore = async (userPilotId: string) => {
    try {
      const res = await fetch(`/api/cloud-save/${userPilotId}`);
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.settings) setSettings(data.data.settings);
        if (data.data.achievements) setAchievements(data.data.achievements);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Cloud restore error:', e);
      return false;
    }
  };

  return (
    <main
      id="space-invaders-root"
      className="relative w-screen h-screen bg-black overflow-hidden select-none flex items-center justify-center font-retro"
    >
      {/* Canvas Viewport */}
      <div className="relative w-full h-full flex items-center justify-center">
        <canvas
          id="space-invaders-canvas"
          ref={canvasRef}
          className="w-full h-full block"
        />

        {/* CRT Scanline & Vignette Effect Overlays */}
        {settings.crtEffect && (
          <>
            <div className="crt-overlay absolute inset-0 z-10" />
            <div className="crt-vignette absolute inset-0 z-10" />
          </>
        )}

        {/* Active In-Game Minimalist HUD */}
        {gameState === 'playing' && hudState.p1 && (
          <GameHUD
            p1={hudState.p1}
            p2={hudState.p2}
            isCoop={currentMode === 'coop'}
            score={hudState.score}
            wave={hudState.wave}
            stageTitle={hudState.stageTitle}
            gameInspiration={hudState.gameInspiration}
            mode={currentMode}
            timeAttackRemainingMs={hudState.timeAttackRemainingMs}
            chronoWarpTimer={hudState.chronoWarpTimer}
            cognitiveMetrics={hudState.cognitiveMetrics}
            onPause={() => {
              if (engineRef.current) {
                engineRef.current.togglePause();
                setIsPaused(engineRef.current.isPaused);
              }
            }}
            onOpenCognitiveReport={() => setActiveModal('cognitive')}
          />
        )}

        {/* Transparent Touch Virtual Joystick (Auto-detected on Touch) */}
        {gameState === 'playing' && (
          <TouchControls
            onMove={(x, y) => {
              touchInputRef.current = { x, y };
            }}
            onFire={() => engineRef.current?.fireWeapon(1)}
            onEmp={() => {
              engineRef.current?.triggerEmp(1);
              unlockAchievement('emp_purification');
            }}
            onPause={() => {
              if (engineRef.current) {
                engineRef.current.togglePause();
                setIsPaused(engineRef.current.isPaused);
              }
            }}
            empCount={hudState.p1?.empCount || 0}
            modeSetting={settings.touchControlsMode}
          />
        )}

        {/* Pause Overlay */}
        {gameState === 'playing' && isPaused && (
          <div
            id="pause-screen-overlay"
            className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white"
          >
            <h2 className="text-3xl font-pixel text-amber-400 tracking-widest neon-glow-amber mb-2">
              PAUSA TÁCTICA
            </h2>
            <p className="text-xs text-gray-400 font-retro mb-6">
              Sistemas de combate en suspensión criogénica
            </p>

            <div className="flex flex-col gap-3 w-64">
              <button
                onClick={() => {
                  engineRef.current?.togglePause();
                  setIsPaused(false);
                }}
                className="py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-pixel text-xs rounded-lg font-bold cursor-pointer transition-colors shadow-lg shadow-cyan-500/20"
              >
                REANUDAR MISIÓN
              </button>
              <button
                onClick={() => setActiveModal('settings')}
                className="py-2.5 bg-gray-900 hover:bg-gray-800 border border-cyan-500/30 text-cyan-300 font-pixel text-xs rounded-lg cursor-pointer transition-colors"
              >
                CONFIGURACIÓN
              </button>
              <button
                onClick={() => {
                  engineRef.current?.destroy();
                  setGameState('menu');
                }}
                className="py-2.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 font-pixel text-xs rounded-lg cursor-pointer transition-colors"
              >
                SALIR AL MENÚ
              </button>
            </div>
          </div>
        )}

        {/* Main Menu Screen */}
        {gameState === 'menu' && (
          <div
            id="main-menu-overlay"
            className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white"
          >
            {/* Title Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[10px] font-pixel mb-3">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                RETRO ARCADE 90S EDITION
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-pixel text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-500 tracking-wider">
                SPACE INVADERS
              </h1>
              <p className="text-xs sm:text-sm font-pixel text-amber-400 tracking-widest mt-2 neon-glow-amber">
                NEON ASSAULT
              </p>
            </div>

            {/* Game Mode Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md mb-6">
              {/* Classic Mode */}
              <button
                id="btn-mode-classic"
                onClick={() => startGame('classic')}
                className="flex items-center gap-3 p-4 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/50 to-blue-950/50 hover:border-cyan-400 hover:from-cyan-900/60 hover:to-blue-900/60 text-left transition-all cursor-pointer shadow-lg shadow-cyan-500/10 group"
              >
                <div className="p-3 bg-cyan-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-cyan-400 fill-cyan-400" />
                </div>
                <div>
                  <div className="text-xs font-pixel text-cyan-300">MODO CLÁSICO</div>
                  <div className="text-[11px] text-gray-400 font-retro mt-0.5">
                    Fases inspiradas en los 90s con dificultad adaptativa
                  </div>
                </div>
              </button>

              {/* Time Attack Mode */}
              <button
                id="btn-mode-timeattack"
                onClick={() => startGame('timeattack')}
                className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/50 to-orange-950/50 hover:border-amber-400 hover:from-amber-900/60 hover:to-orange-900/60 text-left transition-all cursor-pointer shadow-lg shadow-amber-500/10 group"
              >
                <div className="p-3 bg-amber-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-pixel text-amber-300">CONTRARRELOJ</div>
                  <div className="text-[11px] text-gray-400 font-retro mt-0.5">
                    3 minutos intensos de frenesí con multiplicador wave rush
                  </div>
                </div>
              </button>

              {/* Local Co-op 2P */}
              <button
                id="btn-mode-coop"
                onClick={() => startGame('coop')}
                className="flex items-center gap-3 p-4 rounded-xl border border-pink-500/40 bg-gradient-to-r from-pink-950/50 to-purple-950/50 hover:border-pink-400 hover:from-pink-900/60 hover:to-purple-900/60 text-left transition-all cursor-pointer shadow-lg shadow-pink-500/10 group"
              >
                <div className="p-3 bg-pink-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <div className="text-xs font-pixel text-pink-300">COOPERATIVO 2P</div>
                  <div className="text-[11px] text-gray-400 font-retro mt-0.5">
                    Dos pilotos simultáneos (Teclado o 2 Gamepads)
                  </div>
                </div>
              </button>

              {/* Async Challenges */}
              <button
                id="btn-mode-challenges"
                onClick={() => setActiveModal('challenges')}
                className="flex items-center gap-3 p-4 rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-950/50 to-indigo-950/50 hover:border-purple-400 hover:from-purple-900/60 hover:to-indigo-900/60 text-left transition-all cursor-pointer shadow-lg shadow-purple-500/10 group"
              >
                <div className="p-3 bg-purple-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <Swords className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-xs font-pixel text-purple-300">DESAFÍOS ASÍNCRONOS</div>
                  <div className="text-[11px] text-gray-400 font-retro mt-0.5">
                    Duelos de records contra fantasmas comunitarios
                  </div>
                </div>
              </button>
            </div>

            {/* Sub-menu bar */}
            <div className="flex flex-wrap justify-center gap-2">
              <button
                id="btn-menu-leaderboard"
                onClick={() => setActiveModal('leaderboard')}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-white/20 rounded-lg text-xs font-pixel text-cyan-300 cursor-pointer transition-colors"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                CLASIFICACIÓN
              </button>

              <button
                id="btn-menu-cognitive"
                onClick={() => setActiveModal('cognitive')}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-white/20 rounded-lg text-xs font-pixel text-purple-300 cursor-pointer transition-colors"
              >
                <Brain className="w-4 h-4 text-purple-400" />
                ANALIZADOR COGNITIVO
              </button>

              <button
                id="btn-menu-achievements"
                onClick={() => setActiveModal('achievements')}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-white/20 rounded-lg text-xs font-pixel text-yellow-300 cursor-pointer transition-colors"
              >
                <Award className="w-4 h-4 text-yellow-400" />
                LOGROS
              </button>

              <button
                id="btn-menu-settings"
                onClick={() => setActiveModal('settings')}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-white/20 rounded-lg text-xs font-pixel text-gray-300 cursor-pointer transition-colors"
              >
                <Settings className="w-4 h-4 text-cyan-400" />
                CONTROLES & MANDOS
              </button>
            </div>

            {/* Pilot ID Pill */}
            <div className="mt-8 text-[11px] font-pixel text-gray-500">
              CÓDIGO DE PILOTO:{' '}
              <span className="text-cyan-400 font-bold">{pilotId}</span>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <div
            id="gameover-overlay"
            className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white"
          >
            <h2 className="text-3xl sm:text-4xl font-pixel text-rose-500 tracking-wider mb-1 animate-pulse">
              MISIÓN FALLIDA
            </h2>
            <p className="text-xs text-gray-400 font-retro mb-6">
              La nave nodriza invasora ha neutralizado la defensa terrestre
            </p>

            {/* Run summary statistics card */}
            <div className="w-full max-w-sm bg-gray-950 border border-rose-500/30 rounded-xl p-5 mb-6 text-center space-y-3 shadow-xl shadow-rose-950/40">
              <div>
                <span className="text-[10px] font-pixel text-gray-400">PUNTUACIÓN FINAL</span>
                <div className="text-3xl font-pixel text-amber-400 neon-glow-amber">
                  {hudState.score.toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-b border-gray-800 py-3 text-xs font-pixel">
                <div>
                  <span className="text-[9px] text-gray-400 block">FASE</span>
                  <span className="text-cyan-400">{hudState.wave}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 block">PRECISIÓN</span>
                  <span className="text-emerald-400">{hudState.cognitiveMetrics?.accuracy || 0}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 block">COGNICIÓN</span>
                  <span className="text-purple-400">
                    {hudState.cognitiveMetrics?.avgReactionTimeMs < 240 ? 'S+' : 'A'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-purple-300 font-retro">
                Arquetipo: {hudState.cognitiveMetrics?.ninetyStyleArchetype || 'Piloto de los 90s'}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <button
                id="btn-gameover-retry"
                onClick={() => startGame(currentMode, activeChallenge || undefined)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-pixel text-xs rounded-lg font-bold cursor-pointer transition-colors shadow-lg shadow-cyan-500/20"
              >
                <RotateCcw className="w-4 h-4" />
                REINTENTAR
              </button>

              <button
                id="btn-gameover-leaderboard"
                onClick={() => setActiveModal('leaderboard')}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-pixel text-xs rounded-lg font-bold cursor-pointer transition-colors shadow-lg shadow-amber-500/20"
              >
                SUBIR RÉCORD
              </button>
            </div>

            <button
              onClick={() => setGameState('menu')}
              className="mt-3 text-xs font-pixel text-gray-400 hover:text-white cursor-pointer transition-colors"
            >
              VOLVER AL MENÚ PRINCIPAL
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal === 'leaderboard' && (
        <LeaderboardModal
          currentMode={currentMode}
          userScore={hudState.score}
          userWave={hudState.wave}
          userAccuracy={hudState.cognitiveMetrics?.accuracy}
          userCognitiveGrade={hudState.cognitiveMetrics?.avgReactionTimeMs < 240 ? 'S+' : 'A'}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'cognitive' && (
        <CognitiveReportModal
          metrics={
            hudState.cognitiveMetrics || {
              reactionTimes: [250, 260],
              avgReactionTimeMs: 255,
              evasionEfficiency: 80,
              accuracy: 75,
              panicFiringRatio: 12,
              stressIndex: 40,
              actionsPerMinute: 110,
              flowStateRating: 'En Flujo Óptimo',
              ninetyStyleArchetype: 'Piloto de Flujo Armónico (Estilo Gradius 1990)',
              recentEvasions: 12,
              recentHitsTaken: 2,
            }
          }
          mode={currentMode}
          wave={hudState.wave}
          score={hudState.score}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'challenges' && (
        <AsyncChallengesModal
          onStartChallenge={(ch) => {
            startGame(ch.mode, ch);
          }}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'achievements' && (
        <AchievementsModal
          achievements={achievements}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings(newSettings)}
          pilotId={pilotId}
          onSyncCloud={handleCloudSync}
          onRestoreCloud={handleCloudRestore}
          onClose={() => setActiveModal('none')}
        />
      )}
    </main>
  );
}
