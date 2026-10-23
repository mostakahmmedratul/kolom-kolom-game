import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Pen } from '../game/model/Pen';
import { PenTypeId, PEN_TYPES } from '../game/model/PenStats';
import { AIDifficultyLevel, AI_DIFFICULTIES, ComputerAI } from '../game/ai/ComputerAI';
import { BenchBounds, PhysicsEngine } from '../game/physics/PhysicsEngine';
import { Vector2D } from '../game/physics/Vector2D';
import { sounds } from '../game/audio/SoundSynthesizer';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  HelpCircle,
  Award,
  Zap,
  Flame,
  RotateCw,
  User,
  Mail,
  Sparkles,
  FileCode,
  Download,
} from 'lucide-react';
import { FlickPart, FLICK_PARTS, getPenFlickPoint } from '../game/model/StrikeZone';

export type GameScreen = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
export type TurnPhase =
  | 'HUMAN_AIMING'
  | 'HUMAN_RESOLVING'
  | 'COMPUTER_THINKING'
  | 'COMPUTER_RESOLVING'
  | 'ROUND_RESOLVED';

interface Props {
  selectedPen: PenTypeId;
  difficulty: AIDifficultyLevel;
  targetScore: number;
  onOpenPenSelect: () => void;
  onOpenDifficultySelect: () => void;
  onOpenJavaProject?: () => void;
}

export const KolomKolomGame: React.FC<Props> = ({
  selectedPen,
  difficulty,
  targetScore,
  onOpenPenSelect,
  onOpenDifficultySelect,
  onOpenJavaProject,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [humanScore, setHumanScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('HUMAN_AIMING');
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState<null | {
    winner: 'HUMAN' | 'BOT';
    finalHuman: number;
    finalBot: number;
  }>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Selected Flick Part on shooter's OWN pen (Tip = high spin, Center = straight push, Cap = reverse whip)
  const [selectedFlickPart, setSelectedFlickPart] = useState<FlickPart>('TIP');
  const [botFlickPart, setBotFlickPart] = useState<FlickPart | null>(null);
  const selectedFlickPartRef = useRef<FlickPart>('TIP');
  const impactCalloutRef = useRef<{ text: string; pos: Vector2D; timer: number; color: string } | null>(null);

  // Drag aiming state
  const isAimingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragCurrentRef = useRef<{ x: number; y: number } | null>(null);

  // Simulation references (isolated from React state for pristine 60fps)
  const pensRef = useRef<Pen[]>([]);
  const benchRef = useRef<BenchBounds>({ x: 80, y: 70, width: 1120, height: 580, bevelMargin: 24 });
  const turnPhaseRef = useRef<TurnPhase>('HUMAN_AIMING');
  const roundScoredRef = useRef(false);
  const botTimerRef = useRef(0);
  const resetTimerRef = useRef(0);
  const isResettingRef = useRef(false);
  const isPausedRef = useRef(false);
  const gameOverRef = useRef(false);

  // Scores tracked via refs to eliminate React stale closure in 60fps loop
  const humanScoreRef = useRef(0);
  const botScoreRef = useRef(0);
  const targetScoreRef = useRef(targetScore);

  // Keep refs synchronized
  useEffect(() => {
    turnPhaseRef.current = turnPhase;
  }, [turnPhase]);

  useEffect(() => {
    selectedFlickPartRef.current = selectedFlickPart;
  }, [selectedFlickPart]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    targetScoreRef.current = targetScore;
  }, [targetScore]);

  // Real-time pen type & color update whenever selectedPen prop changes
  useEffect(() => {
    const human = pensRef.current.find(p => p.id === 'HUMAN');
    if (human) {
      const penData = PEN_TYPES[selectedPen];
      human.setPenType(selectedPen, penData.colors);
    }
  }, [selectedPen]);

  // Setup Bench & Pens in arena
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

    const penData = PEN_TYPES[selectedPen];
    const human = new Pen(
      'HUMAN',
      'You',
      selectedPen,
      penData.colors.primary,
      penData.colors.accent,
      new Vector2D(leftX, centerY),
      0,
      penData.colors.clip
    );

    const bot = new Pen(
      'BOT',
      'Opponent',
      'BALANCED',
      '#dc2626',
      '#991b1b',
      new Vector2D(rightX, centerY),
      Math.PI,
      '#fca5a5'
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
      const penData = PEN_TYPES[selectedPen];
      human.setPenType(selectedPen, penData.colors);
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
    humanScoreRef.current = 0;
    botScoreRef.current = 0;
    setHumanScore(0);
    setBotScore(0);
    setGameOver(null);
    gameOverRef.current = false;
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

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      initGameWorld(w, h);
    };

    resize();
    window.addEventListener('resize', resize);

    const physics = new PhysicsEngine();
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.scale(dpr, dpr);

        const w = canvas.width / dpr;
        const h = canvas.height / dpr;

        // Update Physics & Turn Rules
        if (!isPausedRef.current && !gameOverRef.current) {
          physics.update(pensRef.current, benchRef.current, dt);

          if (impactCalloutRef.current) {
            impactCalloutRef.current.timer -= dt;
            if (impactCalloutRef.current.timer <= 0) {
              impactCalloutRef.current = null;
            }
          }

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
                if (botTimerRef.current >= 0.75) {
                  botTimerRef.current = 0;
                  const result = ComputerAI.calculateShot(bot, human, benchRef.current, difficulty);
                  setBotFlickPart(result.flickPart);
                  bot.applyFlickImpulse(result.shot, result.flickPart);
                  sounds.playFlick(result.shot.length() / 750);
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
  }, [initGameWorld, difficulty, resetRound]);

  // Turn Outcome Evaluation
  const evaluateRoundEnd = (human: Pen, bot: Pen, wasHumanTurn: boolean) => {
    if (human.outOfBounds || bot.outOfBounds) {
      if (!roundScoredRef.current) {
        roundScoredRef.current = true;
        let newH = humanScoreRef.current;
        let newB = botScoreRef.current;

        if (human.outOfBounds && bot.outOfBounds) {
          // Double knockout!
          if (wasHumanTurn) {
            newB += 1;
            botScoreRef.current = newB;
            setBotScore(newB);
            sounds.playPoint(false);
            impactCalloutRef.current = {
              text: 'FOUL! Your pen flew off with opponent! Bot gets point',
              pos: new Vector2D(benchRef.current.x + benchRef.current.width * 0.5, benchRef.current.y + 110),
              timer: 2.2,
              color: '#ef4444',
            };
          } else {
            newH += 1;
            humanScoreRef.current = newH;
            setHumanScore(newH);
            sounds.playPoint(true);
            impactCalloutRef.current = {
              text: 'FOUL! Bot knocked itself off with you! You get point!',
              pos: new Vector2D(benchRef.current.x + benchRef.current.width * 0.5, benchRef.current.y + 110),
              timer: 2.2,
              color: '#22c55e',
            };
          }
        } else if (bot.outOfBounds) {
          newH += 1;
          humanScoreRef.current = newH;
          setHumanScore(newH);
          sounds.playPoint(true);
          impactCalloutRef.current = {
            text: 'POINT! Opponent knocked off the bench!',
            pos: new Vector2D(benchRef.current.x + benchRef.current.width * 0.65, benchRef.current.y + 110),
            timer: 2.0,
            color: '#22c55e',
          };
        } else if (human.outOfBounds) {
          newB += 1;
          botScoreRef.current = newB;
          setBotScore(newB);
          sounds.playPoint(false);
          impactCalloutRef.current = {
            text: 'OUT! Your pen fell off the bench!',
            pos: new Vector2D(benchRef.current.x + benchRef.current.width * 0.35, benchRef.current.y + 110),
            timer: 2.0,
            color: '#ef4444',
          };
        }

        const currentTarget = targetScoreRef.current;
        if (newH >= currentTarget || newB >= currentTarget) {
          gameOverRef.current = true;
          setGameOver({
            winner: newH >= currentTarget ? 'HUMAN' : 'BOT',
            finalHuman: newH,
            finalBot: newB,
          });
          if (newH >= currentTarget) {
            sounds.playVictory();
            confetti({ particleCount: 110, spread: 80, origin: { y: 0.55 } });
          }
        } else {
          isResettingRef.current = true;
          resetTimerRef.current = 0;
          setTurnPhase('ROUND_RESOLVED');
        }
      }
    } else {
      // Neither pen fell off, switch turn
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

    // 5. Render Flick Hotspots on Player's OWN Blue Pen (Tip, Center, Cap) during player's turn
    const human = pensRef.current.find(p => p.id === 'HUMAN');
    if (human && !human.outOfBounds && turnPhaseRef.current === 'HUMAN_AIMING') {
      renderPlayerFlickHotspots(ctx, human, selectedFlickPartRef.current);
    }

    // 6. Render Aiming Slingshot & Predicted Spin Indicator
    if (isAimingRef.current && dragCurrentRef.current && turnPhaseRef.current === 'HUMAN_AIMING') {
      if (human) {
        renderAiming(ctx, human, dragCurrentRef.current, selectedFlickPartRef.current);
      }
    }

    // 7. Render Floating Impact Callout
    if (impactCalloutRef.current) {
      const callout = impactCalloutRef.current;
      ctx.save();
      ctx.font = 'bold 12px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      const floatY = (1.1 - callout.timer) * 30;
      const alpha = Math.min(1, callout.timer * 1.5);
      ctx.globalAlpha = alpha;

      const textW = ctx.measureText(callout.text).width;
      ctx.fillStyle = 'rgba(12, 10, 8, 0.9)';
      ctx.beginPath();
      ctx.roundRect(callout.pos.x - textW / 2 - 8, callout.pos.y - 28 - floatY, textW + 16, 22, 6);
      ctx.fill();
      ctx.strokeStyle = callout.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = callout.color;
      ctx.fillText(callout.text, callout.pos.x, callout.pos.y - 13 - floatY);
      ctx.restore();
    }
  };

  /**
   * Renders the 3 interactive flick contact hotspots directly on the shooter's OWN pen.
   */
  const renderPlayerFlickHotspots = (
    ctx: CanvasRenderingContext2D,
    human: Pen,
    currentPart: FlickPart
  ) => {
    const parts: Array<{ id: FlickPart; label: string; icon: string; color: string }> = [
      { id: 'TIP', label: 'TIP (SPIN)', icon: '⚡', color: '#f59e0b' },
      { id: 'CENTER', label: 'CENTER (PUSH)', icon: '💥', color: '#38bdf8' },
      { id: 'CAP', label: 'CAP (WHIP)', icon: '🔄', color: '#c084fc' },
    ];

    ctx.save();
    for (const p of parts) {
      const pt = getPenFlickPoint(human, p.id);
      const isSelected = currentPart === p.id;
      const radius = isSelected ? 12 : 8.5;

      // Outer glow ring
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius + (isSelected ? 5 : 2), 0, Math.PI * 2);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = isSelected ? 2.5 : 1.2;
      ctx.stroke();

      // Filled contact target
      ctx.fillStyle = isSelected ? `${p.color}55` : 'rgba(25, 20, 18, 0.75)';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Center dot
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Top floating label
      ctx.font = 'bold 9px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = isSelected ? '#ffffff' : '#a8a29e';
      ctx.fillText(p.label, pt.x, pt.y - radius - 5);
    }
    ctx.restore();
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
    const isHeavy = pen.penType === 'HEAVY';
    const isRubber = pen.penType === 'RUBBER_GRIP';
    const gripBase = isHeavy ? '#1e293b' : isRubber ? '#0e7490' : pen.id === 'BOT' ? '#7f1d1d' : '#1e3a8a';
    const ribColor = isHeavy ? 'rgba(245, 158, 11, 0.45)' : isRubber ? 'rgba(103, 232, 249, 0.7)' : 'rgba(255, 255, 255, 0.35)';

    ctx.fillStyle = gripBase;
    ctx.beginPath();
    ctx.roundRect(halfL - 42, -halfW * 0.95, 22, width * 0.9, 4);
    ctx.fill();
    ctx.strokeStyle = ribColor;
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
    if (isHeavy) {
      nibGrad.addColorStop(0, '#fde68a');
      nibGrad.addColorStop(1, '#b45309');
    } else {
      nibGrad.addColorStop(0, '#e2e8f0');
      nibGrad.addColorStop(1, '#94a3b8');
    }
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

    // Metal / Color Clip
    const clipC = pen.clipColor || '#cbd5e1';
    ctx.fillStyle = clipC;
    ctx.fillRect(-halfL + 6, -halfW - 3.5, 34, 3.5);
    ctx.strokeStyle = isHeavy ? '#b45309' : 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-halfL + 6, -halfW - 3.5, 34, 3.5);

    // Label Indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(pen.id === 'HUMAN' ? `YOU · ${pen.penType}` : 'BOT', -halfL + 30, 3.5);

    ctx.restore();
  };

  const renderAiming = (
    ctx: CanvasRenderingContext2D,
    human: Pen,
    mousePos: { x: number; y: number },
    flickPart: FlickPart
  ) => {
    // The flick impulse is applied directly to the selected flick contact point on human's pen
    const flickOrigin = getPenFlickPoint(human, flickPart);
    const dx = flickOrigin.x - mousePos.x;
    const dy = flickOrigin.y - mousePos.y;
    const dragLen = Math.sqrt(dx * dx + dy * dy);
    if (dragLen < 6) return;

    const maxDrag = 250;
    const powerFrac = Math.min(1, dragLen / maxDrag);
    const angle = Math.atan2(dy, dx);

    const partConfig = FLICK_PARTS[flickPart];
    const aimColor = partConfig.color;

    ctx.save();

    // Slingshot pull line from finger to flick origin
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(mousePos.x, mousePos.y);
    ctx.lineTo(flickOrigin.x, flickOrigin.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Forward Trajectory Direction
    const lineLen = Math.min(dragLen * 1.8, 380);
    const endX = flickOrigin.x + Math.cos(angle) * lineLen;
    const endY = flickOrigin.y + Math.sin(angle) * lineLen;

    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = aimColor;
    ctx.beginPath();
    ctx.moveTo(flickOrigin.x, flickOrigin.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Arrowhead
    ctx.setLineDash([]);
    ctx.fillStyle = aimColor;
    const arrowSize = 14;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - arrowSize * Math.cos(angle - 0.4), endY - arrowSize * Math.sin(angle - 0.4));
    ctx.lineTo(endX - arrowSize * Math.cos(angle + 0.4), endY - arrowSize * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();

    // Power Arc Indicator around the flick contact point
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = aimColor;
    ctx.beginPath();
    ctx.arc(flickOrigin.x, flickOrigin.y, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * powerFrac);
    ctx.stroke();

    // Predicted Spin & Flight Badge floating near flick point
    ctx.save();
    ctx.translate(flickOrigin.x, flickOrigin.y - 36);
    ctx.fillStyle = 'rgba(15, 12, 10, 0.9)';
    ctx.strokeStyle = aimColor;
    ctx.lineWidth = 1.5;

    let spinText = '';
    if (flickPart === 'TIP') {
      spinText = `⚡ TIP FLICK · ${(powerFrac * 100).toFixed(0)}% POWER · 🌀 WHIRLWIND SPIN`;
    } else if (flickPart === 'CENTER') {
      spinText = `💥 CENTER FLICK · ${(powerFrac * 100).toFixed(0)}% POWER · ⚡ STRAIGHT BULLET SLIDE`;
    } else {
      spinText = `🔄 CAP FLICK · ${(powerFrac * 100).toFixed(0)}% POWER · ↩ REVERSE WHIP SWEEP`;
    }

    ctx.font = 'bold 10px "Outfit", sans-serif';
    const textW = ctx.measureText(spinText).width;
    ctx.beginPath();
    ctx.roundRect(-textW / 2 - 8, -12, textW + 16, 22, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(spinText, 0, 0);
    ctx.restore();

    ctx.restore();
  };

  // Mouse / Touch Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPaused || gameOver || turnPhase !== 'HUMAN_AIMING') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const clickVec = new Vector2D(mouseX, mouseY);

    const human = pensRef.current.find(p => p.id === 'HUMAN');
    if (!human || human.outOfBounds) return;

    // 1. Check if user clicked directly on one of the 3 flick contact points on their own pen
    const tipPt = getPenFlickPoint(human, 'TIP');
    const centerPt = getPenFlickPoint(human, 'CENTER');
    const capPt = getPenFlickPoint(human, 'CAP');

    if (clickVec.distanceTo(tipPt) < 22) {
      setSelectedFlickPart('TIP');
      sounds.playFlick(0.25);
      isAimingRef.current = true;
      dragStartRef.current = { x: mouseX, y: mouseY };
      dragCurrentRef.current = { x: mouseX, y: mouseY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (clickVec.distanceTo(centerPt) < 22) {
      setSelectedFlickPart('CENTER');
      sounds.playFlick(0.25);
      isAimingRef.current = true;
      dragStartRef.current = { x: mouseX, y: mouseY };
      dragCurrentRef.current = { x: mouseX, y: mouseY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (clickVec.distanceTo(capPt) < 22) {
      setSelectedFlickPart('CAP');
      sounds.playFlick(0.25);
      isAimingRef.current = true;
      dragStartRef.current = { x: mouseX, y: mouseY };
      dragCurrentRef.current = { x: mouseX, y: mouseY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    // 2. Or if player clicked anywhere on their pen body, begin aiming with the currently active flick part
    if (human.containsPoint(clickVec)) {
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

      if (human && !human.outOfBounds) {
        const flickOrigin = getPenFlickPoint(human, selectedFlickPartRef.current);
        const dx = flickOrigin.x - dragCurrentRef.current.x;
        const dy = flickOrigin.y - dragCurrentRef.current.y;
        const dragLen = Math.sqrt(dx * dx + dy * dy);

        if (dragLen > 10) {
          const maxPower = 840;
          const power = Math.min(dragLen * 3.4, maxPower);

          // Impulse direction is opposite to the drag direction
          const dir = new Vector2D(dx, dy).normalize();
          const impulse = dir.scale(power);

          // Apply flick impulse to the selected part of player's pen (causing linear glide + spin torque)
          human.applyFlickImpulse(impulse, selectedFlickPartRef.current);
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

  // Keyboard shortcuts: Escape to Pause, 1-3 for flick parts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPaused(prev => !prev);
      } else if (e.key === '1') {
        setSelectedFlickPart('TIP');
        sounds.playFlick(0.25);
      } else if (e.key === '2') {
        setSelectedFlickPart('CENTER');
        sounds.playFlick(0.25);
      } else if (e.key === '3') {
        setSelectedFlickPart('CAP');
        sounds.playFlick(0.25);
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
            className="flex items-center gap-2 text-xs font-semibold text-stone-200 hover:text-white transition-colors cursor-pointer group"
            title="Switch your school pen and colors"
          >
            <div
              className="w-2.5 h-2.5 rounded-full ring-1 ring-white/30 shrink-0 shadow-xs"
              style={{ background: PEN_TYPES[selectedPen].colors.primary }}
            />
            <span className="group-hover:text-amber-300 transition-colors">{PEN_TYPES[selectedPen].name}</span>
            <span className="text-[10px] text-amber-400/90 font-mono hidden md:inline">({PEN_TYPES[selectedPen].colorName})</span>
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
              {turnPhase === 'HUMAN_AIMING' && (
                <span className="text-emerald-400">
                  YOUR TURN · FLICKING: {FLICK_PARTS[selectedFlickPart].name.toUpperCase()}
                </span>
              )}
              {turnPhase === 'HUMAN_RESOLVING' && <span className="text-sky-300">PEN GLIDING & SPINNING...</span>}
              {turnPhase === 'COMPUTER_THINKING' && (
                <span className="text-amber-400">
                  OPPONENT {botFlickPart ? `FLICKING ${FLICK_PARTS[botFlickPart].name.toUpperCase()}!` : 'AIMING...'}
                </span>
              )}
              {turnPhase === 'COMPUTER_RESOLVING' && <span className="text-orange-400">OPPONENT PEN SHOT...</span>}
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
          {onOpenJavaProject && (
            <button
              onClick={onOpenJavaProject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all cursor-pointer shadow-xs"
              title="Download Real Java 21 Desktop Application (.ZIP, Maven & Packaging Scripts)"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Java Desktop App</span>
            </button>
          )}
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
            className="p-2 rounded-lg text-amber-300 hover:text-amber-200 hover:bg-stone-800 transition-colors"
            title="Game Info & Developer Details"
          >
            <HelpCircle className="w-4 h-4" />
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

      {/* Interactive Own-Pen Flick Part Selector Bar */}
      <div className="absolute bottom-11 inset-x-0 z-20 flex flex-col items-center pointer-events-none px-4">
        <div className="pointer-events-auto bg-stone-900/95 backdrop-blur-md border border-stone-800 rounded-2xl p-1.5 flex items-center gap-1.5 shadow-2xl">
          <span className="px-2.5 text-[11px] font-bold text-stone-400 uppercase tracking-widest hidden sm:inline">
            Flick Part on Your Pen:
          </span>

          {(['TIP', 'CENTER', 'CAP'] as FlickPart[]).map((partKey, idx) => {
            const p = FLICK_PARTS[partKey];
            const isSelected = selectedFlickPart === partKey;

            return (
              <button
                key={partKey}
                onClick={() => {
                  setSelectedFlickPart(partKey);
                  sounds.playFlick(0.25);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? `${p.badgeBg} border shadow-md ring-1 ring-white/10`
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 border border-transparent'
                }`}
                title={`[${idx + 1}] ${p.name}: ${p.description}`}
              >
                {partKey === 'TIP' && <Zap className="w-3.5 h-3.5 text-amber-400" />}
                {partKey === 'CENTER' && <Flame className="w-3.5 h-3.5 text-sky-400" />}
                {partKey === 'CAP' && <RotateCw className="w-3.5 h-3.5 text-purple-400" />}
                <span>{p.label}</span>
                <span className="text-[10px] text-stone-500 font-mono hidden md:inline ml-0.5">[{idx + 1}]</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-2.5 inset-x-0 pointer-events-none text-center">
        <span className="text-[11px] text-stone-400/80 bg-stone-950/60 backdrop-blur-sm px-3 py-1 rounded-full border border-stone-800/50">
          Click Tip / Center / Cap on your pen ({PEN_TYPES[selectedPen].colorName}) to pick flick spot · Drag to aim &amp; power · Keys [1-3]
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
            <h2
              className={`font-display text-3xl font-extrabold mb-1 ${
                gameOver.winner === 'HUMAN' ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
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
            </div>
          </div>
        </div>
      )}

      {/* Rules & Help Modal with Developer Credits */}
      {showHelp && (
        <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Developer Card Banner */}
            <div className="bg-linear-to-r from-amber-950/60 via-stone-900 to-amber-950/40 border border-amber-500/40 rounded-xl p-4 mb-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                    Lead Game Developer
                  </span>
                </div>
                <h4 className="text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <User className="w-4 h-4 text-amber-400" />
                  Ratul Ahmed
                </h4>
                <p className="text-xs text-stone-300 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  <a
                    href="mailto:ratul101ahmed@gmail.com"
                    className="hover:text-amber-300 underline underline-offset-2 transition-colors"
                  >
                    ratul101ahmed@gmail.com
                  </a>
                </p>
              </div>
            </div>

            <h3 className="font-display text-xl font-bold text-amber-200 mb-2">Kolom Kolom Game Guide &amp; Physics</h3>

            <div className="text-xs text-stone-300 space-y-3 leading-relaxed">
              <p>
                <strong>The Nostalgic School Game:</strong> Recreated from the beloved traditional classroom game played with ballpoint pens on a wooden school bench.
              </p>

              <div className="bg-stone-950/80 rounded-xl p-3 border border-stone-800">
                <h5 className="font-bold text-amber-300 mb-1.5 text-xs">Pen Contact &amp; Spin Physics Mechanics:</h5>
                <p className="text-[11px] text-stone-300 mb-2">
                  You decide <strong>which part of your OWN pen</strong> to flick. The physics engine computes realistic torque and moment of inertia (<span className="font-mono text-amber-200">τ = r × J</span>) based on the contact location:
                </p>
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                    <div>
                      <strong className="text-amber-400">Tip (Front Nib):</strong> Hitting off-center near the tip generates high rotational torque. The pen accelerates forward while <strong>spinning rapidly like a whirlwind propeller</strong> across the desk to sweep the opponent pen off the edge!
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400 mt-1 shrink-0" />
                    <div>
                      <strong className="text-sky-400">Center (Body):</strong> Applying impulse directly through the center of mass delivers pure linear momentum. The pen slides <strong>straight forward like a bullet</strong> with minimal rotation.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400 mt-1 shrink-0" />
                    <div>
                      <strong className="text-purple-400">Cap (Back End):</strong> Striking the back cap pivots the pen from the rear, launching it into a <strong>reverse whip spin</strong> that cuts a wide sweeping arc.
                    </div>
                  </div>
                </div>
              </div>

              <p>
                <strong>How to Shoot:</strong> Click any of the 3 glowing contact points on your blue pen (or use keys [1-3]), drag backwards to stretch the power slingshot, and release to flick!
              </p>

              <p>
                <strong>Scoring:</strong> Knock your opponent’s pen completely over the wooden bench edge to score 1 point. Be careful not to fly off the edge yourself! First to {targetScore} points wins the match.
              </p>

              {/* Java Desktop Card */}
              <div className="bg-stone-950/90 rounded-xl p-3 border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                    <FileCode className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-200">Native Java 21 Desktop App</div>
                    <div className="text-[11px] text-stone-400">Complete Java Swing &amp; Java2D build with macOS &amp; Windows packages</div>
                  </div>
                </div>
                {onOpenJavaProject && (
                  <button
                    onClick={() => {
                      setShowHelp(false);
                      onOpenJavaProject();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shrink-0 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .ZIP</span>
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer shadow-lg"
            >
              Close &amp; Play!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
