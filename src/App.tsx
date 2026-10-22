import React, { useState } from 'react';
import { KolomKolomGame } from './components/KolomKolomGame';
import { PenSelectModal } from './components/PenSelectModal';
import { DifficultyModal } from './components/DifficultyModal';
import { JavaProjectModal } from './components/JavaProjectModal';
import { PenTypeId } from './game/model/PenStats';
import { AIDifficultyLevel } from './game/ai/ComputerAI';

export default function App() {
  const [selectedPen, setSelectedPen] = useState<PenTypeId>('BALANCED');
  const [difficulty, setDifficulty] = useState<AIDifficultyLevel>('MEDIUM');
  const [targetScore, setTargetScore] = useState<number>(10);

  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [penSelectOpen, setPenSelectOpen] = useState(false);
  const [difficultySelectOpen, setDifficultySelectOpen] = useState(false);

  return (
    <main className="w-screen h-screen overflow-hidden bg-stone-950 flex flex-col">
      <KolomKolomGame
        selectedPen={selectedPen}
        difficulty={difficulty}
        targetScore={targetScore}
        onOpenCodeModal={() => setCodeModalOpen(true)}
        onOpenPenSelect={() => setPenSelectOpen(true)}
        onOpenDifficultySelect={() => setDifficultySelectOpen(true)}
      />

      <PenSelectModal
        isOpen={penSelectOpen}
        onClose={() => setPenSelectOpen(false)}
        selectedPen={selectedPen}
        onSelectPen={setSelectedPen}
      />

      <DifficultyModal
        isOpen={difficultySelectOpen}
        onClose={() => setDifficultySelectOpen(false)}
        difficulty={difficulty}
        onSelectDifficulty={setDifficulty}
        targetScore={targetScore}
        onSelectTargetScore={setTargetScore}
      />

      <JavaProjectModal
        isOpen={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
      />
    </main>
  );
}
