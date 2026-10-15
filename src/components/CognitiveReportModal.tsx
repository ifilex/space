/**
 * Space Invaders: Neon Assault 90s - Cognitive Behavioral Performance Analyzer Modal
 */

import React, { useState } from 'react';
import { CognitiveMetrics, GameMode } from '../types';
import { Sparkles, Brain, Activity, Target, Shield, Gauge, X, Cpu } from 'lucide-react';

interface CognitiveReportModalProps {
  metrics: CognitiveMetrics;
  mode: GameMode;
  wave: number;
  score: number;
  onClose: () => void;
}

export const CognitiveReportModal: React.FC<CognitiveReportModalProps> = ({
  metrics,
  mode,
  wave,
  score,
  onClose,
}) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const requestAiDebrief = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/cognitive-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          wave,
          score,
          accuracy: metrics.accuracy,
          mode,
        }),
      });
      const data = await res.json();
      if (data.success && data.aiNarrative) {
        setAiReport(data.aiNarrative);
      } else {
        setAiReport(data.adaptationAdvice || 'Compensación cibernética completada con éxito.');
      }
    } catch (e) {
      console.warn('AI analysis error, using fallback:', e);
      setAiReport(
        `TELEMETRÍA COGNITIVA ACTIVA: Patrón ${metrics.ninetyStyleArchetype} validado. Respuesta motriz de ${metrics.avgReactionTimeMs}ms registrada con precisión del ${metrics.accuracy}%. Compensación de oleadas 90s ajustada dinámicamente.`
      );
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div id="modal-cognitive-report" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-gray-950 border-2 border-purple-500/60 rounded-xl p-6 shadow-2xl shadow-purple-500/20 text-white max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-purple-500/30 pb-4">
          <div className="p-3 bg-purple-950/60 border border-purple-500/50 rounded-lg">
            <Brain className="w-7 h-7 text-purple-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-pixel text-purple-300 tracking-wider">
              ANALIZADOR DE CONDUCTA COGNITIVA
            </h2>
            <p className="text-xs text-gray-400 font-retro">
              Monitoreo psicométrico de reflejos y adaptación dinámica a niveles clásicos de los 90s
            </p>
          </div>
        </div>

        {/* Primary Diagnosis Banner */}
        <div className="bg-purple-950/30 border border-purple-500/40 rounded-lg p-4 mb-6">
          <span className="text-[10px] font-pixel text-purple-400 tracking-wider uppercase">
            ARQUETIPO DETECTADO (AÑOS 90)
          </span>
          <div className="text-lg font-pixel text-amber-300 mt-1">
            {metrics.ninetyStyleArchetype}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-300 font-retro">Estado Neurocinético:</span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-pixel ${
                metrics.flowStateRating === 'Dominio Absoluto'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : metrics.flowStateRating === 'Sobrecargado'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {metrics.flowStateRating}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {/* Reaction Latency */}
          <div className="bg-black/60 border border-cyan-500/30 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span className="font-pixel text-[9px]">REACCIÓN</span>
            </div>
            <div className="text-xl font-pixel text-cyan-300">
              {metrics.avgReactionTimeMs} <span className="text-xs">ms</span>
            </div>
            <div className="text-[10px] text-gray-400 font-retro mt-1">
              {metrics.avgReactionTimeMs < 240 ? '⚡ Reflejos Pro' : 'Estándar Arcade'}
            </div>
          </div>

          {/* Evasion Efficiency */}
          <div className="bg-black/60 border border-emerald-500/30 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span className="font-pixel text-[9px]">EVASIÓN</span>
            </div>
            <div className="text-xl font-pixel text-emerald-300">
              {metrics.evasionEfficiency}%
            </div>
            <div className="text-[10px] text-gray-400 font-retro mt-1">
              {metrics.recentEvasions} esquivas exitosas
            </div>
          </div>

          {/* Accuracy */}
          <div className="bg-black/60 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs mb-1">
              <Target className="w-3.5 h-3.5" />
              <span className="font-pixel text-[9px]">PRECISIÓN</span>
            </div>
            <div className="text-xl font-pixel text-amber-300">
              {metrics.accuracy}%
            </div>
            <div className="text-[10px] text-gray-400 font-retro mt-1">
              {metrics.panicFiringRatio}% ráfaga ciega
            </div>
          </div>

          {/* APM & Stress Index */}
          <div className="bg-black/60 border border-rose-500/30 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-rose-400 text-xs mb-1">
              <Gauge className="w-3.5 h-3.5" />
              <span className="font-pixel text-[9px]">ESTRÉS</span>
            </div>
            <div className="text-xl font-pixel text-rose-300">
              {metrics.stressIndex}/100
            </div>
            <div className="text-[10px] text-gray-400 font-retro mt-1">
              {metrics.actionsPerMinute} acciones/min
            </div>
          </div>
        </div>

        {/* Dynamic Difficulty Adaptation (DDA) explanation */}
        <div className="bg-black/40 border border-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2 text-sm font-pixel text-cyan-300">
            <Cpu className="w-4 h-4 text-cyan-400" />
            SISTEMA DE DIFICULTAD DINÁMICA ACTIVO
          </div>
          <p className="text-xs text-gray-300 leading-relaxed font-retro">
            El motor del juego analiza tu tiempo de respuesta ante proyectiles y tu tasa de acierto para calibrar
            la velocidad de los invasores, los patrones de vuelo estilo Galaga/Contra y la probabilidad de
            aparición de power-ups. Si estás bajo sobrecarga sensorial, se despliegan más escudos protectores;
            si estás en estado de flujo absoluto, la cadencia enemiga se incrementa para desafiar tu maestría.
          </p>
        </div>

        {/* AI Tactical Debriefing */}
        <div className="bg-gradient-to-r from-purple-950/40 to-blue-950/40 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-pixel text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              EVALUACIÓN TÁCTICA DE LA COMPUTADORA CENTRAL
            </span>
            {!aiReport && (
              <button
                id="btn-request-ai-report"
                onClick={requestAiDebrief}
                disabled={isLoadingAi}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-pixel cursor-pointer transition-colors disabled:opacity-50"
              >
                {isLoadingAi ? 'CALCULANDO...' : 'GENERAR INFORME AI'}
              </button>
            )}
          </div>

          <div className="text-xs text-gray-300 font-retro italic bg-black/50 p-3 rounded border border-purple-500/20 min-h-[48px] flex items-center">
            {aiReport ? (
              <span>"{aiReport}"</span>
            ) : (
              <span className="text-gray-500">
                Haz clic en "Generar Informe AI" para obtener el informe táctico retro detallado generado por la IA para tu próxima incursión.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
