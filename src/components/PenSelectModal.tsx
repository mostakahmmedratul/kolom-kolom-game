import React from 'react';
import { PenTypeId, PEN_TYPES } from '../game/model/PenStats';
import { X, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedPen: PenTypeId;
  onSelectPen: (type: PenTypeId) => void;
}

export const PenSelectModal: React.FC<Props> = ({ isOpen, onClose, selectedPen, onSelectPen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl font-sans">
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Select Your School Pen</h2>
            <p className="text-xs text-stone-400">Each pen features distinct physical mass, friction, and flick recoil</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
          {(Object.keys(PEN_TYPES) as PenTypeId[]).map(typeKey => {
            const pen = PEN_TYPES[typeKey];
            const isEquipped = selectedPen === typeKey;

            return (
              <div
                key={typeKey}
                onClick={() => {
                  onSelectPen(typeKey);
                }}
                className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                  isEquipped
                    ? 'bg-stone-800/80 border-amber-400 ring-1 ring-amber-400/50'
                    : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-bold text-white text-base">{pen.name}</h3>
                    {isEquipped && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="text-[11px] font-medium text-amber-300/80 mb-2">{pen.tagline}</div>
                  <p className="text-xs text-stone-400 leading-relaxed mb-3">{pen.description}</p>

                  {/* Real-time Color Palette Swatch */}
                  <div className="flex items-center justify-between mb-3.5 bg-stone-900/90 px-2.5 py-1.5 rounded-lg border border-stone-800">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full ring-1 ring-white/20 shrink-0"
                        style={{ background: `linear-gradient(135deg, ${pen.colors.primary}, ${pen.colors.accent})` }}
                      />
                      <span className="text-[11px] font-semibold text-stone-200">{pen.colorName}</span>
                    </div>
                    <span className="text-[9px] text-amber-400/90 font-mono uppercase tracking-wider">Live Skin</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-800/80">
                  <div>
                    <div className="flex justify-between text-[11px] text-stone-400 mb-0.5">
                      <span>Mass (Weight)</span>
                      <span className="font-mono text-stone-300">{pen.stats.mass}x</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400"
                        style={{ width: `${(pen.stats.mass / 1.6) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-stone-400 mb-0.5">
                      <span>Glide (Low Friction)</span>
                      <span className="font-mono text-stone-300">{Math.round((3.2 - pen.stats.linearDamping) * 35)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400"
                        style={{ width: `${((3.2 - pen.stats.linearDamping) / 2.0) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-stone-400 mb-0.5">
                      <span>Impulse Recoil</span>
                      <span className="font-mono text-stone-300">{pen.stats.impulseMultiplier}x</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400"
                        style={{ width: `${(pen.stats.impulseMultiplier / 1.2) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
