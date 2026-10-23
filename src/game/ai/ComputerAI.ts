import { Pen } from '../model/Pen';
import { BenchBounds, isPenOutOfBounds } from '../physics/PhysicsEngine';
import { CollisionHandler } from '../physics/CollisionHandler';
import { Vector2D } from '../physics/Vector2D';

export type AIDifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface AIDifficultyConfig {
  id: AIDifficultyLevel;
  name: string;
  tagline: string;
  aimVariance: number;
  maxSpeed: number;
}

export const AI_DIFFICULTIES: Record<AIDifficultyLevel, AIDifficultyConfig> = {
  EASY: {
    id: 'EASY',
    name: 'School Novice',
    tagline: 'Casual flicks with occasional slip-ups',
    aimVariance: 0.26,
    maxSpeed: 480,
  },
  MEDIUM: {
    id: 'MEDIUM',
    name: 'Desk Champion',
    tagline: 'Calculated edge pushes and balanced power',
    aimVariance: 0.12,
    maxSpeed: 640,
  },
  HARD: {
    id: 'HARD',
    name: 'Classroom Legend',
    tagline: 'Trajectory prediction and ruthless knock-offs',
    aimVariance: 0.03,
    maxSpeed: 780,
  },
};

export interface AIShotResult {
  shot: Vector2D;
  flickPart: 'TIP' | 'CENTER' | 'CAP';
}

export class ComputerAI {
  static calculateShot(
    botPen: Pen,
    humanPen: Pen,
    bench: BenchBounds,
    difficulty: AIDifficultyLevel
  ): AIShotResult {
    if (botPen.outOfBounds || humanPen.outOfBounds) {
      return { shot: Vector2D.ZERO, flickPart: 'CENTER' };
    }

    const botPos = botPen.position;
    const humanPos = humanPen.position;
    const config = AI_DIFFICULTIES[difficulty];

    if (difficulty === 'EASY') {
      const flickPart: 'TIP' | 'CENTER' | 'CAP' = Math.random() > 0.5 ? 'TIP' : 'CENTER';
      const toHuman = humanPos.subtract(botPos);
      const dist = Math.max(1, toHuman.length());
      const baseAngle = Math.atan2(toHuman.y, toHuman.x);
      const error = (Math.random() * 2 - 1) * config.aimVariance;
      const finalAngle = baseAngle + error;
      const speed = Math.max(260, Math.min(config.maxSpeed, dist * 2.2 + 200));
      return {
        shot: new Vector2D(Math.cos(finalAngle), Math.sin(finalAngle)).scale(speed),
        flickPart,
      };
    }

    if (difficulty === 'MEDIUM') {
      const edgeNormal = this.getVectorTowardsNearestEdge(humanPos, bench);
      const distToHuman = humanPos.distanceTo(botPos);

      // Bot chooses whether to use Tip Spin or Center Push
      let flickPart: 'TIP' | 'CENTER' | 'CAP' = 'CENTER';
      if (distToHuman < 220) {
        flickPart = Math.random() > 0.4 ? 'TIP' : 'CENTER';
      }

      const strikePoint = humanPos.subtract(edgeNormal.scale(12));
      const toTarget = strikePoint.subtract(botPos);
      const dist = Math.max(1, toTarget.length());
      const baseAngle = Math.atan2(toTarget.y, toTarget.x);
      const error = (Math.random() * 2 - 1) * config.aimVariance;
      const finalAngle = baseAngle + error;
      const speed = Math.max(300, Math.min(config.maxSpeed, dist * 2.5 + 280));

      return {
        shot: new Vector2D(Math.cos(finalAngle), Math.sin(finalAngle)).scale(speed),
        flickPart,
      };
    }

    // HARD: Evaluates candidate shots across all 3 flick parts of its own pen
    const candidateParts: Array<'TIP' | 'CENTER' | 'CAP'> = ['CENTER', 'TIP', 'CAP'];
    const toOpponent = humanPos.subtract(botPos);
    const baseAngle = Math.atan2(toOpponent.y, toOpponent.x);
    const dist = toOpponent.length();

    let bestShot: Vector2D | null = null;
    let bestPart: 'TIP' | 'CENTER' | 'CAP' = 'CENTER';
    let bestScore = -Infinity;

    for (const fPart of candidateParts) {
      for (const angleOffset of [-0.08, -0.04, 0, 0.04, 0.08]) {
        const shotAngle = baseAngle + angleOffset;
        const dir = new Vector2D(Math.cos(shotAngle), Math.sin(shotAngle));

        for (const powerFrac of [0.75, 0.9, 1.0]) {
          const speed = Math.max(340, Math.min(config.maxSpeed, dist * 2.8 + 260)) * powerFrac;
          const candidate = dir.scale(speed);
          const score = this.evaluateCandidateShot(candidate, fPart, botPen, humanPen, bench);

          if (score > bestScore) {
            bestScore = score;
            bestShot = candidate;
            bestPart = fPart;
          }
        }
      }
    }

    if (!bestShot) {
      return this.calculateShot(botPen, humanPen, bench, 'MEDIUM');
    }

    const microError = (Math.random() * 2 - 1) * config.aimVariance;
    return {
      shot: bestShot.rotate(microError),
      flickPart: bestPart,
    };
  }

  private static evaluateCandidateShot(
    impulse: Vector2D,
    flickPart: 'TIP' | 'CENTER' | 'CAP',
    realBot: Pen,
    realHuman: Pen,
    bench: BenchBounds
  ): number {
    const simBot = new Pen('BOT', 'BOT', realBot.penType, '', '', realBot.position, realBot.angle);
    const simHuman = new Pen('HUMAN', 'HUMAN', realHuman.penType, '', '', realHuman.position, realHuman.angle);

    simBot.applyFlickImpulse(impulse, flickPart);
    const dt = 1 / 60;
    const steps = 24;

    for (let i = 0; i < steps; i++) {
      simBot.position = simBot.position.add(simBot.velocity.scale(dt));
      simBot.velocity = simBot.velocity.scale(0.97);

      simHuman.position = simHuman.position.add(simHuman.velocity.scale(dt));
      simHuman.velocity = simHuman.velocity.scale(0.97);

      CollisionHandler.resolveCollision(simBot, simHuman);

      if (isPenOutOfBounds(simHuman, bench)) {
        if (!isPenOutOfBounds(simBot, bench)) {
          return 1000 - i * 5;
        }
      }

      if (isPenOutOfBounds(simBot, bench)) {
        return -500;
      }
    }

    const humanDist = this.getDistanceToNearestEdge(simHuman.position, bench);
    const botDist = this.getDistanceToNearestEdge(simBot.position, bench);
    return (220 - humanDist) * 1.5 + botDist * 0.5;
  }

  private static getVectorTowardsNearestEdge(pos: Vector2D, bench: BenchBounds): Vector2D {
    const pLeft = bench.x + bench.bevelMargin;
    const pRight = bench.x + bench.width - bench.bevelMargin;
    const pTop = bench.y + bench.bevelMargin;
    const pBottom = bench.y + bench.height - bench.bevelMargin;

    const dLeft = Math.abs(pos.x - pLeft);
    const dRight = Math.abs(pRight - pos.x);
    const dTop = Math.abs(pos.y - pTop);
    const dBottom = Math.abs(pBottom - pos.y);

    const min = Math.min(dLeft, dRight, dTop, dBottom);
    if (min === dLeft) return new Vector2D(-1, 0);
    if (min === dRight) return new Vector2D(1, 0);
    if (min === dTop) return new Vector2D(0, -1);
    return new Vector2D(0, 1);
  }

  private static getDistanceToNearestEdge(pos: Vector2D, bench: BenchBounds): number {
    const pLeft = bench.x + bench.bevelMargin;
    const pRight = bench.x + bench.width - bench.bevelMargin;
    const pTop = bench.y + bench.bevelMargin;
    const pBottom = bench.y + bench.height - bench.bevelMargin;

    const dLeft = Math.abs(pos.x - pLeft);
    const dRight = Math.abs(pRight - pos.x);
    const dTop = Math.abs(pos.y - pTop);
    const dBottom = Math.abs(pBottom - pos.y);
    return Math.min(dLeft, dRight, dTop, dBottom);
  }
}
