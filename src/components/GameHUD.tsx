/**
 * Space Invaders: Neon Assault 90s - Minimalist In-Game HUD Overlay
 */

import React from 'react';
import { GameMode, PlayerShip, CognitiveMetrics } from '../types';
import { Volume2, VolumeX, Pause, Sparkles } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface GameHUDProps {
  p1: PlayerShip;
  p2?: PlayerShip;
  isCoop: boolean;
  score: number;
  wave: number;
  stageTitle?: string;
  gameInspiration?: string;
  mode: GameMode;
  timeAttackRemainingMs: number;
  chronoWarpTimer: number;
  cognitiveMetrics?: CognitiveMetrics;
  onPause: () => void;
  onOpenCognitiveReport: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  p1,
  p2,
  isCoop,
  score,
  wave,
  stageTitle,
  mode,
  timeAttackRemainingMs,
  chronoWarpTimer,
  cognitiveMetrics,
  onPause,
  onOpenCognitiveReport,
}) => {
  const [isMuted, setIsMuted] = React.useState(false);

  const toggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getFlowBadgeColor = (flow?: string) => {
    if (flow === 'Dominio Absoluto') return 'text-amber-400 border-amber-500/50 bg-amber-950/40';
    if (flow === 'Sobrecargado') return 'text-rose-400 border-rose-500/50 bg-rose-950/40';
    return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40';
  };

  return (
    <div id="game-hud-container" className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 select-none">
      {/* Top Banner: Minimalist cyber telemetry */}
      <div className="flex items-start justify-between gap-2">
        {/* Left: Player 1 Status */}
        <div className="flex flex-col gap-1 bg-black/40 backdrop-blur-xs p-2 rounded-lg border border-cyan-500/20 max-w-[240px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-pixel text-cyan-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              P1 {isCoop ? '(CYAN)' : ''}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: Math.max(0, p1.lives) }).map((_, i) => (
                <span key={i} className="text-cyan-400 text-xs">🚀</span>
              ))}
            </div>
          </div>

          {/* Health & Shield bars */}
          <div className="w-full bg-cyan-950/60 rounded-full h-1.5 overflow-hidden border border-cyan-800/40">
            <div
              className="bg-cyan-400 h-full transition-all duration-150"
              style={{ width: `${Math.max(0, Math.min(100, (p1.shield / p1.maxShield) * 100))}%` }}
            />
          </div>
          <div className="w-full bg-rose-950/60 rounded-full h-1 overflow-hidden">
            <div
              className="bg-rose-500 h-full transition-all duration-150"
              style={{ width: `${Math.max(0, Math.min(100, (p1.health / p1.maxHealth) * 100))}%` }}
            />
          </div>

          {/* Weapon badge */}
          <div className="flex items-center justify-between text-[10px] font-pixel text-cyan-300/80 pt-0.5">
            <span className="truncate">{p1.weaponType}</span>
            <span className="text-amber-400 font-bold">LVL {p1.weaponLevel}</span>
          </div>
        </div>

        {/* Center: Score, Wave & Time Attack */}
        <div className="flex flex-col items-center bg-black/50 backdrop-blur-xs px-4 py-1.5 rounded-lg border border-white/10">
          <span className="text-[10px] font-pixel text-gray-400 tracking-wider">PUNTUACIÓN</span>
          <span className="text-xl sm:text-2xl font-pixel text-amber-400 tracking-widest neon-glow-amber">
            {score.toLocaleString()}
          </span>

          <div className="flex items-center gap-3 text-[11px] font-pixel mt-0.5">
            <span className="text-cyan-400">FASE {wave}</span>
            {mode === 'timeattack' && (
              <span className={`px-1.5 py-0.5 rounded ${timeAttackRemainingMs < 30000 ? 'text-red-400 bg-red-950/60 animate-bounce' : 'text-emerald-400 bg-emerald-950/40'}`}>
                ⏱ {formatTime(timeAttackRemainingMs)}
              </span>
            )}
          </div>

          {stageTitle && (
            <span className="text-[9px] font-pixel text-cyan-200/70 mt-1 hidden sm:inline max-w-[240px] truncate text-center">
              {stageTitle}
            </span>
          )}
        </div>

        {/* Right: Cognitive Meter & Quick Controls */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1 pointer-events-auto">
            <button
              id="btn-hud-cognitive"
              onClick={onOpenCognitiveReport}
              title="Analizador Cognitivo"
              className="flex items-center gap-1 px-2 py-1 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 rounded text-[10px] font-pixel text-purple-300 cursor-pointer transition-colors backdrop-blur-xs"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="hidden sm:inline">COGNICIÓN</span>
            </button>

            <button
              id="btn-hud-mute"
              onClick={toggleMute}
              title={isMuted ? 'Activar sonido' : 'Silenciar'}
              className="p-1.5 bg-black/40 hover:bg-white/10 border border-white/20 rounded text-gray-300 cursor-pointer backdrop-blur-xs"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>

            <button
              id="btn-hud-pause"
              onClick={onPause}
              title="Pausar"
              className="p-1.5 bg-black/40 hover:bg-white/10 border border-white/20 rounded text-gray-300 cursor-pointer backdrop-blur-xs"
            >
              <Pause className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>

          {/* Real-time Dynamic Cognitive Telemetry pill */}
          {cognitiveMetrics && (
            <div
              onClick={onOpenCognitiveReport}
              className={`pointer-events-auto cursor-pointer px-2 py-1 rounded border text-[9px] font-pixel flex items-center gap-1.5 backdrop-blur-xs ${getFlowBadgeColor(
                cognitiveMetrics.flowStateRating
              )}`}
            >
              <span>⚡ {cognitiveMetrics.avgReactionTimeMs}ms</span>
              <span className="hidden sm:inline">| {cognitiveMetrics.flowStateRating}</span>
            </div>
          )}

          {/* Player 2 Co-op status on right if active */}
          {isCoop && p2 && (
            <div className="flex flex-col gap-1 bg-black/40 backdrop-blur-xs p-2 rounded-lg border border-pink-500/20 w-40 text-right mt-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: Math.max(0, p2.lives) }).map((_, i) => (
                    <span key={i} className="text-pink-400 text-xs">🚀</span>
                  ))}
                </div>
                <span className="text-xs font-pixel text-pink-400">P2 (MAGENTA)</span>
              </div>
              <div className="w-full bg-pink-950/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-pink-400 h-full transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min(100, (p2.shield / p2.maxShield) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chrono warp active warning */}
      {chronoWarpTimer > 0 && (
        <div className="self-center bg-emerald-950/70 border border-emerald-400/50 px-3 py-1 rounded-full text-emerald-300 font-pixel text-xs tracking-wider animate-pulse backdrop-blur-xs">
          ⏳ DISTORSIÓN TEMPORAL ACTIVA
        </div>
      )}

      {/* Empty bottom space so touch controls and ship visibility are clear */}
      <div className="h-4"></div>
    </div>
  );
};
