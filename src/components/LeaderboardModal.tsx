/**
 * Space Invaders: Neon Assault 90s - Global & Friends Online Leaderboard
 */

import React, { useEffect, useState } from 'react';
import { GameMode, LeaderboardEntry } from '../types';
import { Trophy, Users, Globe, X, Send } from 'lucide-react';

interface LeaderboardModalProps {
  currentMode: GameMode;
  userScore?: number;
  userWave?: number;
  userAccuracy?: number;
  userCognitiveGrade?: string;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  currentMode,
  userScore,
  userWave,
  userAccuracy,
  userCognitiveGrade = 'A',
  onClose,
}) => {
  const [mode, setMode] = useState<GameMode>(currentMode);
  const [filterFriends, setFilterFriends] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Score submission state
  const [pilotName, setPilotName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [mode, filterFriends]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?mode=${mode}&friends=${filterFriends}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setEntries(data.data);
      }
    } catch (err) {
      console.warn('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pilotName.trim() || userScore === undefined || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pilotName.trim().toUpperCase(),
          score: userScore,
          wave: userWave || 1,
          mode,
          accuracy: userAccuracy || 70,
          cognitiveGrade: userCognitiveGrade,
          isFriend: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHasSubmitted(true);
        fetchLeaderboard();
      }
    } catch (err) {
      console.warn('Failed to submit score:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="modal-leaderboard" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
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
            <Trophy className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-pixel text-cyan-300 tracking-wider">
              TABLAS DE CLASIFICACIÓN EN LÍNEA
            </h2>
            <p className="text-xs text-gray-400 font-retro">
              Récords globales y competencias entre amigos sincronizados en tiempo real
            </p>
          </div>
        </div>

        {/* Mode Selector & Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {/* Modes */}
          <div className="flex gap-1 bg-black/50 p-1 rounded-lg border border-white/10">
            {(['classic', 'timeattack', 'coop'] as GameMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 rounded text-xs font-pixel transition-colors cursor-pointer ${
                  mode === m
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {m === 'classic' ? 'CLÁSICO' : m === 'timeattack' ? 'CONTRARRELOJ' : 'COOPERATIVO'}
              </button>
            ))}
          </div>

          {/* Global vs Friends toggle */}
          <div className="flex gap-1 bg-black/50 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setFilterFriends(false)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-pixel cursor-pointer transition-colors ${
                !filterFriends ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              GLOBAL
            </button>
            <button
              onClick={() => setFilterFriends(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-pixel cursor-pointer transition-colors ${
                filterFriends ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              AMIGOS
            </button>
          </div>
        </div>

        {/* Score Submission Banner if coming from a finished run */}
        {userScore !== undefined && userScore > 0 && !hasSubmitted && (
          <form
            onSubmit={handleSubmitScore}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-950/60 to-purple-950/60 border border-cyan-500/40 p-3 rounded-lg mb-4"
          >
            <div className="text-xs font-pixel text-cyan-300 shrink-0">
              TU PUNTUACIÓN: <span className="text-amber-400 font-bold">{userScore.toLocaleString()}</span>
            </div>
            <input
              type="text"
              maxLength={12}
              placeholder="PILOT_TAG"
              value={pilotName}
              onChange={(e) => setPilotName(e.target.value.toUpperCase())}
              className="px-2.5 py-1 bg-black/80 border border-cyan-500/50 rounded text-xs font-pixel text-cyan-200 uppercase focus:outline-hidden focus:border-cyan-300 w-32"
            />
            <button
              type="submit"
              disabled={isSubmitting || !pilotName.trim()}
              className="flex items-center gap-1 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-pixel text-xs rounded font-bold cursor-pointer transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'PUBLICANDO...' : 'REGISTRAR'}
            </button>
          </form>
        )}

        {/* Leaderboard Table */}
        <div className="flex-1 overflow-y-auto border border-white/10 rounded-lg bg-black/50">
          <table className="w-full text-left text-xs font-pixel">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400 sticky top-0">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">PILOTO</th>
                <th className="py-2.5 px-3 text-right">PUNTUACIÓN</th>
                <th className="py-2.5 px-3 text-center">FASE</th>
                <th className="py-2.5 px-3 text-center">PRECISIÓN</th>
                <th className="py-2.5 px-3 text-center">COGNICIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 font-retro">
                    Sincronizando registros estelares...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 font-retro">
                    No hay registros en esta categoría aún. ¡Sé el primero en reclamar la gloria!
                  </td>
                </tr>
              ) : (
                entries.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className={`hover:bg-white/5 transition-colors ${
                      idx === 0
                        ? 'text-amber-400 bg-amber-950/10'
                        : idx === 1
                        ? 'text-cyan-300'
                        : idx === 2
                        ? 'text-rose-300'
                        : 'text-gray-300'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold">
                      {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`}
                    </td>
                    <td className="py-2.5 px-3 flex items-center gap-2">
                      <span>{entry.name}</span>
                      {entry.isFriend && (
                        <span className="text-[9px] px-1 bg-purple-500/30 border border-purple-400/50 rounded text-purple-200">
                          AMIGO
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-300">
                      {entry.score.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center text-cyan-400">{entry.wave}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">{entry.accuracy}%</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-1.5 py-0.5 bg-purple-900/50 border border-purple-500/40 rounded text-[10px] text-purple-300">
                        {entry.cognitiveGrade}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
