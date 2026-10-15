/**
 * Space Invaders: Neon Assault 90s - Asynchronous Multiplayer Challenges
 */

import React, { useEffect, useState } from 'react';
import { AsyncChallenge, GameMode } from '../types';
import { Swords, Plus, Play, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AsyncChallengesModalProps {
  onStartChallenge: (challenge: AsyncChallenge) => void;
  onClose: () => void;
}

export const AsyncChallengesModal: React.FC<AsyncChallengesModalProps> = ({
  onStartChallenge,
  onClose,
}) => {
  const [challenges, setChallenges] = useState<AsyncChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [targetScore, setTargetScore] = useState(60000);
  const [targetWave, setTargetWave] = useState(6);
  const [mode, setMode] = useState<GameMode>('classic');
  const [accuracyReq, setAccuracyReq] = useState(75);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/challenges');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setChallenges(data.data);
      }
    } catch (e) {
      console.warn('Error loading challenges:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !creatorName.trim()) return;

    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          creatorName,
          targetScore,
          targetWave,
          mode,
          accuracyRequirement: accuracyReq,
          cognitiveProfile: 'Evasión y Reflejos 90s',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateForm(false);
        fetchChallenges();
      }
    } catch (err) {
      console.warn('Failed to create challenge:', err);
    }
  };

  return (
    <div id="modal-async-challenges" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-gray-950 border-2 border-amber-500/60 rounded-xl p-6 shadow-2xl shadow-amber-500/20 text-white max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 border-b border-amber-500/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-950/60 border border-amber-500/50 rounded-lg">
              <Swords className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-pixel text-amber-300 tracking-wider">
                DESAFÍOS ASÍNCRONOS
              </h2>
              <p className="text-xs text-gray-400 font-retro">
                Compite contra los registros fantasma y parámetros cognitivos de otros pilotos
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-pixel text-xs rounded font-bold cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            {showCreateForm ? 'CANCELAR' : 'CREAR DESAFÍO'}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <form
            onSubmit={handleCreateChallenge}
            className="bg-black/70 border border-amber-500/40 p-4 rounded-lg mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <div>
              <label className="text-[10px] font-pixel text-gray-400">TÍTULO DEL DESAFÍO</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Incursión Contra 90s"
                className="w-full mt-1 px-2.5 py-1.5 bg-gray-900 border border-amber-500/40 rounded text-xs font-pixel text-amber-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-pixel text-gray-400">TU NOMBRE DE PILOTO</label>
              <input
                type="text"
                required
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value.toUpperCase())}
                placeholder="PILOT_TAG"
                className="w-full mt-1 px-2.5 py-1.5 bg-gray-900 border border-amber-500/40 rounded text-xs font-pixel text-amber-200 uppercase"
              />
            </div>
            <div>
              <label className="text-[10px] font-pixel text-gray-400">PUNTUACIÓN META</label>
              <input
                type="number"
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                className="w-full mt-1 px-2.5 py-1.5 bg-gray-900 border border-amber-500/40 rounded text-xs font-pixel text-amber-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-pixel text-gray-400">OLEADA META</label>
              <input
                type="number"
                value={targetWave}
                onChange={(e) => setTargetWave(Number(e.target.value))}
                className="w-full mt-1 px-2.5 py-1.5 bg-gray-900 border border-amber-500/40 rounded text-xs font-pixel text-amber-200"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-pixel text-xs rounded font-bold cursor-pointer"
              >
                PUBLICAR DESAFÍO EN LA RED
              </button>
            </div>
          </form>
        )}

        {/* Challenges List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-12 text-center text-gray-400 font-retro">
              Sincronizando protocolos de duelo asíncrono...
            </div>
          ) : (
            challenges.map((ch) => (
              <div
                key={ch.id}
                className="bg-black/50 border border-amber-500/30 hover:border-amber-400/60 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-pixel text-amber-300">{ch.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-950 border border-amber-500/40 rounded text-amber-400 font-pixel uppercase">
                      {ch.mode}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-retro mt-1">
                    Creado por <span className="text-cyan-300 font-pixel">{ch.creatorName}</span> • Perfil: {ch.cognitiveProfile}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-pixel text-gray-300 mt-2">
                    <span className="text-amber-400">🎯 Meta: {ch.targetScore.toLocaleString()} pts</span>
                    <span className="text-cyan-400">🌊 Fase: {ch.targetWave}</span>
                    <span className="text-emerald-400">⚡ Precisión: &gt;{ch.accuracyRequirement}%</span>
                  </div>
                </div>

                <button
                  onClick={() => onStartChallenge(ch)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-pixel text-xs rounded font-bold cursor-pointer shadow-lg shadow-amber-500/20 shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  DESAFIAR
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
