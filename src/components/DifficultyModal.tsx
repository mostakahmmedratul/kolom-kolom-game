import React from 'react';
import { AIDifficultyLevel, AI_DIFFICULTIES } from '../game/ai/ComputerAI';
import { X, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  difficulty: AIDifficultyLevel;
  onSelectDifficulty: (diff: AIDifficultyLevel) => void;
  targetScore: number;
  onSelectTargetScore: (score: number) => void;
}

export const DifficultyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  difficulty,
  onSelectDifficulty,
  targetScore,
  onSelectTargetScore,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl font-sans">
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Match Setup & AI Bot</h2>
            <p className="text-xs text-stone-400">Configure opponent strategy and match point ceiling</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Difficulty Selection */}
        <div className="py-4">
          <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
            Opponent Difficulty
          </label>
          <div className="space-y-2">
            {(Object.keys(AI_DIFFICULTIES) as AIDifficultyLevel[]).map(key => {
              const item = AI_DIFFICULTIES[key];
              const isSelected = difficulty === key;
              return (
                <div
                  key={key}
                  onClick={() => onSelectDifficulty(key)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-stone-800/80 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{item.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 font-mono">
                        {key}
                      </span>
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5">{item.tagline}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Target Score Selection */}
        <div className="py-4 border-t border-stone-800/80">
          <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
            Target Match Score
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[10, 15].map(pts => (
              <button
                key={pts}
                onClick={() => onSelectTargetScore(pts)}
                className={`py-3 rounded-xl border font-mono font-bold text-base transition-all cursor-pointer ${
                  targetScore === pts
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40'
                    : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                }`}
              >
                {pts} Points
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-white transition-colors cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
