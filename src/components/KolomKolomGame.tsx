import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Pen } from '../game/model/Pen';
import { PenTypeId, PEN_TYPES } from '../game/model/PenStats';
import { AIDifficultyLevel, AI_DIFFICULTIES, ComputerAI } from '../game/ai/ComputerAI';
import { BenchBounds, PhysicsEngine } from '../game/physics/PhysicsEngine';
import { Vector2D } from '../game/physics/Vector2D';
import { sounds } from '../game/audio/SoundSynthesizer';
import { Volume2, VolumeX, Pause, Play, RotateCcw, HelpCircle, Code, Award } from 'lucide-react';

export type GameScreen = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
export type TurnPhase = 'HUMAN_AIMING' | 'HUMAN_RESOLVING' | 'COMPUTER_THINKING' | 'COMPUTER_RESOLVING' | 'ROUND_RESOLVED';

interface Props {
  selectedPen: PenTypeId;
  difficulty: AIDifficultyLevel;
  targetScore: number;
  onOpenCodeModal: () => void;
  onOpenPenSelect: () => void;
  onOpenDifficultySelect: () => void;
}

export const KolomKolomGame: React.FC<Props> = ({
  selectedPen,
  difficulty,
  targetScore,
  onOpenCodeModal,
  onOpenPenSelect,
  onOpenDifficultySelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [humanScore, setHumanScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('HUMAN_AIMING');
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState<null | { winner: 'HUMAN' | 'BOT'; finalHuman: number; finalBot: number }>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Drag aiming state
  const isAimingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragCurrentRef = useRef<{ x: number; y: number } | null>(null);

  // Simulation references (isolated from React state for 60fps)
  const pensRef = useRef<Pen[]>([]);
  const benchRef = useRef<BenchBounds>({ x: 80, y: 70, width: 1120, height: 580, bevelMargin: 24 });
  const turnPhaseRef = useRef<TurnPhase>('HUMAN_AIMING');
  const roundScoredRef = useRef(false);
  const botTimerRef = useRef(0);
  const resetTimerRef = useRef(0);
  const isResettingRef = useRef(false);
  const isPausedRef = useRef(false);

  // Sync refs with state
  useEffect(() => {
    turnPhaseRef.current = turnPhase;
  }, [turnPhase]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Setup Bench and Pens
  const initGameWorld = useCallback((w: number, h: number) => {
    const marginX = Math.max(40, w * 0.06);
    const marginY = Math.max(40, h * 0.08);
    const benchW = w - marginX * 2;
    const benchH = h - marginY * 2;

    benchRef.current = {
      x: marginX,
      y: marginY,
      width: benchW,
      height: benchH,
      bevelMargin: 22,
    };

    const centerY = marginY + benchH * 0.5;
    const leftX = marginX + benchW * 0.28;
    const rightX = marginX + benchW * 0.72;

    const human = new Pen(
      'HUMAN',
      'You',
      selectedPen,
      '#1d4ed8',
      '#1e40af',
      new Vector2D(leftX, centerY),
      0
    );

    const bot = new Pen(
      'BOT',
      'Opponent',
      'BALANCED',
      '#dc2626',
      '#991b1b',
      new Vector2D(rightX, centerY),
      Math.PI
    );

    pensRef.current = [human, bot];
    roundScoredRef.current = false;
    isResettingRef.current = false;
    resetTimerRef.current = 0;
    botTimerRef.current = 0;
  }, [selectedPen]);

  const resetRound = useCallback(() => {
    const bench = benchRef.current;
    const centerY = bench.y + bench.height * 0.5;
    const leftX = bench.x + bench.width * 0.28;
    const rightX = bench.x + bench.width * 0.72;

    const human = pensRef.current.find(p => p.id === 'HUMAN');
    const bot = pensRef.current.find(p => p.id === 'BOT');

    if (human && bot) {
      human.penType = selectedPen;
      human.reset(new Vector2D(leftX, centerY), 0);
      bot.reset(new Vector2D(rightX, centerY), Math.PI);
    }

    roundScoredRef.current = false;
    isResettingRef.current = false;
    resetTimerRef.current = 0;
    botTimerRef.current = 0;
    setTurnPhase('HUMAN_AIMING');
  }, [selectedPen]);

  const startNewMatch = useCallback(() => {
    setHumanScore(0);
    setBotScore(0);
    setGameOver(null);
    setIsPaused(false);
    resetRound();
  }, [resetRound]);

  // Main 60fps Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      initGameWorld(w, h);
    };

    resize();
    window.addEventListener('resize', resize);

    const physics = new PhysicsEngine(
      (_p1, _p2, relSpeed) => sounds.playImpact(relSpeed),
      () => sounds.playFall()
    );

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05); // clamp delta

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.scale(dpr, dpr);

        const w = canvas.width / dpr;
        const h = canvas.height / dpr;

        // Update Physics & Turn Rules
        if (!isPausedRef.current && !gameOver) {
          physics.update(pensRef.current, benchRef.current, dt);

          const human = pensRef.current.find(p => p.id === 'HUMAN');
          const bot = pensRef.current.find(p => p.id === 'BOT');

          if (human && bot) {
            // Check round reset timer
            if (isResettingRef.current) {
              resetTimerRef.current += dt;
              if (resetTimerRef.current >= 1.4) {
                resetRound();
              }
            } else {
              // Current turn handling
              const currentPhase = turnPhaseRef.current;

              if (currentPhase === 'HUMAN_RESOLVING') {
                const humanDone = human.outOfBounds ? human.fallComplete : human.isAtRest();
                const botDone = bot.outOfBounds ? bot.fallComplete : bot.isAtRest();

                if (humanDone && botDone) {
                  evaluateRoundEnd(human, bot, true);
                }
              } else if (currentPhase === 'COMPUTER_THINKING') {
                botTimerRef.current += dt;
                if (botTimerRef.current >= 0.7) {
                  botTimerRef.current = 0;
                  const shot = ComputerAI.calculateShot(bot, human, benchRef.current, difficulty);
                  bot.applyDirectImpulse(shot);
                  sounds.playFlick(shot.length() / 750);
                  setTurnPhase('COMPUTER_RESOLVING');
                }
              } else if (currentPhase === 'COMPUTER_RESOLVING') {
                const humanDone = human.outOfBounds ? human.fallComplete : human.isAtRest();
                const botDone = bot.outOfBounds ? bot.fallComplete : bot.isAtRest();

                if (humanDone && botDone) {
                  evaluateRoundEnd(human, bot, false);
                }
              }
            }
          }
        }

        // Render World
        renderScene(ctx, w, h);

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [initGameWorld, difficulty, resetRound, gameOver]);

  // Turn Outcome Evaluation
  const evaluateRoundEnd = (human: Pen, bot: Pen, wasHumanTurn: boolean) => {
    if (human.outOfBounds || bot.outOfBounds) {
      if (!roundScoredRef.current) {
        roundScoredRef.current = true;
        let newH = humanScore;
        let newB = botScore;

        if (human.outOfBounds && bot.outOfBounds) {
          // Draw/scratch
        } else if (bot.outOfBounds) {
          newH += 1;
          setHumanScore(newH);
          sounds.playPoint(true);
        } else if (human.outOfBounds) {
          newB += 1;
          setBotScore(newB);
          sounds.playPoint(false);
        }

        if (newH >= targetScore || newB >= targetScore) {
          setGameOver({
            winner: newH > newB ? 'HUMAN' : 'BOT',
            finalHuman: newH,
            finalBot: newB,
          });
          if (newH > newB) {
            sounds.playVictory();
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          }
        } else {
          isResettingRef.current = true;
          resetTimerRef.current = 0;
          setTurnPhase('ROUND_RESOLVED');
        }
      }
    } else {
      // No pen fell off, switch turn
      if (wasHumanTurn) {
        setTurnPhase('COMPUTER_THINKING');
        botTimerRef.current = 0;
      } else {
        setTurnPhase('HUMAN_AIMING');
      }
    }
  };

  // Rendering Routines
  const renderScene = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const bench = benchRef.current;

    // 1. Room Floor background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#1c1511');
    bgGrad.addColorStop(1, '#0e0b08');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Wooden Bench Drop Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(bench.x + 14, bench.y + 18, bench.width, bench.height, 24);
    ctx.fill();
    ctx.restore();

    // 3. Wooden Bench Surface
    ctx.save();
    const woodGrad = ctx.createLinearGradient(bench.x, bench.y, bench.x + bench.width, bench.y + bench.height);
    woodGrad.addColorStop(0, '#b87943');
    woodGrad.addColorStop(0.5, '#a46535');
    woodGrad.addColorStop(1, '#8e5229');
    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.roundRect(bench.x, bench.y, bench.width, bench.height, 20);
    ctx.fill();

    // Wood Grain lines
    ctx.clip();
    ctx.strokeStyle = 'rgba(92, 50, 22, 0.2)';
    ctx.lineWidth = 1.5;
    for (let y = bench.y; y < bench.y + bench.height; y += 4.5) {
      const wave = Math.sin(y * 0.04) * 10 + Math.cos(y * 0.015) * 6;
      ctx.beginPath();
      ctx.moveTo(bench.x, y);
      ctx.lineTo(bench.x + bench.width, y + wave);
      ctx.stroke();
    }

    // Plank Seams
    ctx.strokeStyle = 'rgba(65, 33, 14, 0.35)';
    ctx.lineWidth = 2;
    const plankH = bench.height / 3;
    ctx.beginPath();
    ctx.moveTo(bench.x, bench.y + plankH);
    ctx.lineTo(bench.x + bench.width, bench.y + plankH);
    ctx.moveTo(bench.x, bench.y + plankH * 2);
    ctx.lineTo(bench.x + bench.width, bench.y + plankH * 2);
    ctx.stroke();

    // Subtle school carvings / doodles
    ctx.strokeStyle = 'rgba(75, 40, 18, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bench.x + 140, bench.y + 100);
    ctx.lineTo(bench.x + 180, bench.y + 95);
    ctx.lineTo(bench.x + 175, bench.y + 120);
    ctx.stroke();

    // Bench Edge Bevel Highlight
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(240, 190, 140, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(bench.x, bench.y, bench.width, bench.height, 20);
    ctx.stroke();

    // Inner Playable Boundary Guide
    const pLeft = bench.x + bench.bevelMargin;
    const pTop = bench.y + bench.bevelMargin;
    const pW = bench.width - bench.bevelMargin * 2;
    const pH = bench.height - bench.bevelMargin * 2;

    ctx.strokeStyle = 'rgba(70, 35, 15, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(pLeft, pTop, pW, pH);
    ctx.setLineDash([]);
    ctx.restore();

    // 4. Render Pens
    for (const pen of pensRef.current) {
      renderPen(ctx, pen);
    }

    // 5. Render Aiming Slingshot & Gauge
    if (isAimingRef.current && dragCurrentRef.current && turnPhaseRef.current === 'HUMAN_AIMING') {
      const human = pensRef.current.find(p => p.id === 'HUMAN');
      if (human) {
        renderAiming(ctx, human.position, dragCurrentRef.current);
      }
    }
  };

  const renderPen = (ctx: CanvasRenderingContext2D, pen: Pen) => {
    ctx.save();
    ctx.translate(pen.position.x, pen.position.y);

    if (pen.outOfBounds) {
      const prog = pen.fallProgress;
      const alpha = Math.max(0, 1 - prog * 0.9);
      ctx.globalAlpha = alpha;
      const scale = 1 - prog * 0.35;
      ctx.scale(scale, scale);
      ctx.translate(0, prog * 45);
    }

    ctx.rotate(pen.angle);

    const len = pen.stats.length;
    const width = pen.stats.width;
    const halfL = len * 0.5;
    const halfW = width * 0.5;

    // Drop Shadow
    if (!pen.outOfBounds) {
      ctx.save();
      ctx.translate(8, 10);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
      ctx.beginPath();
      ctx.roundRect(-halfL, -halfW * 1.1, len, width * 1.1, 8);
      ctx.fill();
      ctx.restore();
    }

    // Barrel
    const barrelGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
    barrelGrad.addColorStop(0, pen.primaryColor);
    barrelGrad.addColorStop(1, pen.accentColor);
    ctx.fillStyle = barrelGrad;
    ctx.beginPath();
    ctx.roundRect(-halfL + 25, -halfW, len - 55, width, 5);
    ctx.fill();

    // Cylindrical Specular Glint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(-halfL + 27, -halfW + 1.5, len - 59, width * 0.28);

    // Visible Internal Ink Cartridge
    ctx.fillStyle = 'rgba(15, 20, 25, 0.6)';
    ctx.fillRect(-halfL + 35, -halfW * 0.18, len - 75, width * 0.36);

    // Front Grip Ribs
    ctx.fillStyle = '#22262d';
    ctx.beginPath();
    ctx.roundRect(halfL - 42, -halfW * 0.95, 22, width * 0.9, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    for (let gx = halfL - 40; gx <= halfL - 24; gx += 4.5) {
      ctx.beginPath();
      ctx.moveTo(gx, -halfW * 0.85);
      ctx.lineTo(gx, halfW * 0.85);
      ctx.stroke();
    }

    // Chrome/Brass Conical Nib
    ctx.save();
    const nibGrad = ctx.createLinearGradient(halfL - 20, -halfW, halfL - 3, halfW);
    nibGrad.addColorStop(0, '#e2e8f0');
    nibGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = nibGrad;
    ctx.beginPath();
    ctx.moveTo(halfL - 20, -halfW * 0.8);
    ctx.lineTo(halfL - 3, -halfW * 0.25);
    ctx.lineTo(halfL - 3, halfW * 0.25);
    ctx.lineTo(halfL - 20, halfW * 0.8);
    ctx.closePath();
    ctx.fill();

    // Tungsten Carbide Ball Tip
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(halfL - 2, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Back Cap & Metal Clip
    ctx.fillStyle = pen.accentColor;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW * 0.95, 25, width * 0.9, 6);
    ctx.fill();

    // Metal Clip
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-halfL + 6, -halfW - 3.5, 34, 3.5);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-halfL + 6, -halfW - 3.5, 34, 3.5);

    // Label Indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(pen.id === 'HUMAN' ? 'YOU' : 'BOT', -halfL + 32, 3.5);

    ctx.restore();
  };

  const renderAiming = (
    ctx: CanvasRenderingContext2D,
    penPos: Vector2D,
    mousePos: { x: number; y: number }
  ) => {
    // Slingshot drag: pulling away shoots towards opposite vector
    const dx = penPos.x - mousePos.x;
    const dy = penPos.y - mousePos.y;
    const dragLen = Math.sqrt(dx * dx + dy * dy);
    if (dragLen < 6) return;

    const maxDrag = 260;
    const powerFrac = Math.min(1, dragLen / maxDrag);
    const angle = Math.atan2(dy, dx);

    ctx.save();
    // Trajectory Dotted Line
    const lineLen = Math.min(dragLen * 1.6, 360);
    const endX = penPos.x + Math.cos(angle) * lineLen;
    const endY = penPos.y + Math.sin(angle) * lineLen;

    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = powerFrac > 0.75 ? '#f97316' : '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(penPos.x, penPos.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Arrowhead
    ctx.setLineDash([]);
    ctx.fillStyle = powerFrac > 0.75 ? '#ea580c' : '#0284c7';
    const arrowSize = 14;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - arrowSize * Math.cos(angle - 0.4), endY - arrowSize * Math.sin(angle - 0.4));
    ctx.lineTo(endX - arrowSize * Math.cos(angle + 0.4), endY - arrowSize * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();

    // Power Arc Indicator
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(penPos.x, penPos.y, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * powerFrac);
    ctx.stroke();

    ctx.restore();
  };

  // Mouse / Touch Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPaused || gameOver || turnPhase !== 'HUMAN_AIMING') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const human = pensRef.current.find(p => p.id === 'HUMAN');
    if (!human) return;

    if (human.containsPoint(new Vector2D(mouseX, mouseY))) {
      isAimingRef.current = true;
      dragStartRef.current = { x: mouseX, y: mouseY };
      dragCurrentRef.current = { x: mouseX, y: mouseY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isAimingRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragCurrentRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAimingRef.current && dragCurrentRef.current) {
      const human = pensRef.current.find(p => p.id === 'HUMAN');
      if (human) {
        const dx = human.position.x - dragCurrentRef.current.x;
        const dy = human.position.y - dragCurrentRef.current.y;
        const dragLen = Math.sqrt(dx * dx + dy * dy);

        if (dragLen > 10) {
          const maxPower = 840;
          const power = Math.min(dragLen * 3.4, maxPower);
          const dir = new Vector2D(dx, dy).normalize();
          const impulse = dir.scale(power);

          human.applyDirectImpulse(impulse);
          sounds.playFlick(power / maxPower);
          setTurnPhase('HUMAN_RESOLVING');
        }
      }
    }

    isAimingRef.current = false;
    dragStartRef.current = null;
    dragCurrentRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }
  };

  // Keyboard shortcut: Escape to Pause
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPaused(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sounds.muted = next;
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-stone-950 select-none overflow-hidden font-sans">
      {/* Top Header / Low-occlusion HUD */}
      <div className="absolute top-0 inset-x-0 z-20 pointer-events-none p-4 flex items-center justify-between">
        {/* Left: Brand wordmark & Pen profile */}
        <div className="flex items-center gap-4 pointer-events-auto bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-xl px-4 py-2">
          <span className="font-display font-bold tracking-tight text-amber-200 text-lg">
            KOLOM KOLOM
          </span>
          <span className="text-xs text-stone-400">·</span>
          <button
            onClick={onOpenPenSelect}
            className="text-xs font-medium text-stone-300 hover:text-white transition-colors cursor-pointer"
            title="Switch your school pen"
          >
            {PEN_TYPES[selectedPen].name}
          </button>
          <span className="text-xs text-stone-400">·</span>
          <button
            onClick={onOpenDifficultySelect}
            className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            title="Adjust AI bot difficulty"
          >
            AI: {AI_DIFFICULTIES[difficulty].name}
          </button>
        </div>

        {/* Center: Scoreboard Cluster (Low occlusion) */}
        <div className="pointer-events-auto bg-stone-900/90 border border-amber-900/40 rounded-xl px-6 py-2.5 flex items-center gap-8 shadow-xl">
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold text-blue-400 tracking-wider">YOU</span>
            <span className="font-mono text-2xl font-extrabold text-white tabular-nums">
              {String(humanScore).padStart(2, '0')}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] text-amber-200/70 tracking-widest uppercase">
              First to {targetScore}
            </span>
            <div className="mt-0.5 px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-stone-800/90 text-stone-200">
              {turnPhase === 'HUMAN_AIMING' && <span className="text-emerald-400">YOUR TURN · DRAG PEN</span>}
              {turnPhase === 'HUMAN_RESOLVING' && <span className="text-sky-300">SLIDING...</span>}
              {turnPhase === 'COMPUTER_THINKING' && <span className="text-amber-400">OPPONENT AIMING...</span>}
              {turnPhase === 'COMPUTER_RESOLVING' && <span className="text-orange-400">OPPONENT SHOT...</span>}
              {turnPhase === 'ROUND_RESOLVED' && <span className="text-yellow-300">PEN KNOCKED OFF!</span>}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold text-red-400 tracking-wider">BOT</span>
            <span className="font-mono text-2xl font-extrabold text-white tabular-nums">
              {String(botScore).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 pointer-events-auto bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-xl p-1.5">
          <button
            onClick={() => setIsPaused(p => !p)}
            className="p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            title="Pause Match (Esc)"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={startNewMatch}
            className="p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            title="Restart Match"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            title="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowHelp(h => !h)}
            className="p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            title="Rules & How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenCodeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors ml-1 cursor-pointer"
            title="View Java Desktop Source & Download Maven Project"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Java Source & Build</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div className="relative flex-1 w-full h-full cursor-crosshair">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute inset-0 block w-full h-full touch-none"
        />
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-3 inset-x-0 pointer-events-none text-center">
        <span className="text-xs text-stone-400/80 bg-stone-950/60 backdrop-blur-sm px-3 py-1 rounded-full border border-stone-800/50">
          Click & Drag Your Blue Pen backwards to aim · Esc to Pause · Knock the Red Pen off the wooden bench!
        </span>
      </div>

      {/* Pause Modal */}
      {isPaused && (
        <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <h2 className="font-display text-2xl font-bold text-white mb-2">Match Paused</h2>
            <p className="text-sm text-stone-400 mb-6">Take a breath or tweak match options.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                Resume Match
              </button>
              <button
                onClick={startNewMatch}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
              >
                Restart Match
              </button>
              <button
                onClick={onOpenCodeModal}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
              >
                Inspect Java Desktop Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over / Victory Modal */}
      {gameOver && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Award className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className={`font-display text-3xl font-extrabold mb-1 ${gameOver.winner === 'HUMAN' ? 'text-emerald-400' : 'text-red-400'}`}>
              {gameOver.winner === 'HUMAN' ? 'VICTORY!' : 'DEFEAT!'}
            </h2>
            <p className="text-sm text-stone-400 mb-4">
              {gameOver.winner === 'HUMAN'
                ? 'You knocked the computer opponent off the bench and claimed the desk crown!'
                : 'The computer opponent outplayed your angles and pushed you off the edge.'}
            </p>

            <div className="flex items-center justify-center gap-6 py-4 my-4 bg-stone-950/60 rounded-xl border border-stone-800/80">
              <div className="text-center">
                <div className="text-xs text-stone-400">YOU</div>
                <div className="font-mono text-3xl font-bold text-white tabular-nums">{gameOver.finalHuman}</div>
              </div>
              <div className="text-stone-600 font-bold text-lg">—</div>
              <div className="text-center">
                <div className="text-xs text-stone-400">BOT</div>
                <div className="font-mono text-3xl font-bold text-white tabular-nums">{gameOver.finalBot}</div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={startNewMatch}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-lg"
              >
                Play Another Match
              </button>
              <button
                onClick={onOpenCodeModal}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
              >
                View Java Desktop Project & Instructions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules & Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-display text-xl font-bold text-amber-200 mb-3">Traditional Kolom Kolom Rules</h3>
            <div className="text-xs text-stone-300 space-y-2.5 leading-relaxed">
              <p>
                <strong>The Game:</strong> A beloved classroom schoolyard duel played with ballpoint pens on a wooden school desk.
              </p>
              <p>
                <strong>How to Aim:</strong> Click and drag your blue pen backwards to stretch an aiming vector. Release to flick!
              </p>
              <p>
                <strong>Scoring:</strong> Knock your opponent’s pen over the wooden desk edge to score 1 point. If you accidentally knock your own pen off, the opponent scores!
              </p>
              <p>
                <strong>Target:</strong> First to reach {targetScore} points wins the match.
              </p>
              <p>
                <strong>Pen Types:</strong> Choose between Balanced (Crystal), Heavy (Metal barrel with punch), and Rubber Grip (high braking control).
              </p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-white transition-colors"
            >
              Got It, Let's Play!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
