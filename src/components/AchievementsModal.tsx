/**
 * Space Invaders: Neon Assault 90s - Achievements Modal
 */

import React from 'react';
import { Achievement } from '../types';
import { Award, Lock, CheckCircle, X } from 'lucide-react';

interface AchievementsModalProps {
  achievements: Achievement[];
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  achievements,
  onClose,
}) => {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div id="modal-achievements" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
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
              <Award className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-pixel text-amber-300 tracking-wider">
                SISTEMA DE LOGROS ARCADE
              </h2>
              <p className="text-xs text-gray-400 font-retro">
                Recompensas y condecoraciones para pilotos espaciales de élite
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-pixel text-gray-400">DESBLOQUEADOS</span>
            <div className="text-base font-pixel text-amber-400">
              {unlockedCount} / {achievements.length}
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-3.5 rounded-lg border flex items-start gap-3 transition-colors ${
                ach.unlocked
                  ? 'bg-amber-950/20 border-amber-500/50 text-white shadow-sm shadow-amber-500/10'
                  : 'bg-black/40 border-gray-800 text-gray-500'
              }`}
            >
              <div
                className={`text-2xl p-2 rounded-lg border shrink-0 ${
                  ach.unlocked
                    ? 'bg-amber-900/40 border-amber-400/60 text-amber-300'
                    : 'bg-gray-900 border-gray-700 grayscale opacity-40'
                }`}
              >
                {ach.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3
                    className={`text-xs font-pixel truncate ${
                      ach.unlocked ? 'text-amber-300' : 'text-gray-400'
                    }`}
                  >
                    {ach.title}
                  </h3>
                  {ach.unlocked ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  )}
                </div>

                <p className="text-xs text-gray-400 font-retro mt-1 leading-relaxed">
                  {ach.description}
                </p>

                {ach.unlockedAt && (
                  <span className="text-[9px] font-pixel text-amber-400/60 mt-1.5 block">
                    Conseguido: {ach.unlockedAt}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
