import { Pen } from '../model/Pen';
import { CollisionHandler } from './CollisionHandler';
import { Vector2D } from './Vector2D';

export interface BenchBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  bevelMargin: number;
}

export function isPenOutOfBounds(pen: Pen, bench: BenchBounds): boolean {
  const pLeft = bench.x + bench.bevelMargin;
  const pRight = bench.x + bench.width - bench.bevelMargin;
  const pTop = bench.y + bench.bevelMargin;
  const pBottom = bench.y + bench.height - bench.bevelMargin;

  const pos = pen.position;
  if (pos.x < pLeft || pos.x > pRight || pos.y < pTop || pos.y > pBottom) {
    return true;
  }

  const collider = pen.getCollider();
  const a = collider.a;
  const b = collider.b;

  const tipLeft = a.x < pLeft && b.x < pLeft;
  const tipRight = a.x > pRight && b.x > pRight;
  const tipTop = a.y < pTop && b.y < pTop;
  const tipBottom = a.y > pBottom && b.y > pBottom;

  return tipLeft || tipRight || tipTop || tipBottom;
}

export class PhysicsEngine {
  public static readonly SUB_STEPS = 4;

  constructor(
    public onCollision?: (
      penA: Pen,
      penB: Pen,
      relSpeed: number,
      hitZoneB: 'TIP' | 'CENTER' | 'CAP',
      contactPoint: Vector2D | null
    ) => void,
    public onOutOfBounds?: (pen: Pen) => void
  ) {}

  update(pens: Pen[], bench: BenchBounds, dt: number): void {
    const subDt = dt / PhysicsEngine.SUB_STEPS;

    for (let step = 0; step < PhysicsEngine.SUB_STEPS; step++) {
      for (const pen of pens) {
        if (pen.outOfBounds) {
          if (!pen.fallComplete) {
            pen.fallProgress += subDt * 2.5;
            if (pen.fallProgress >= 1.0) {
              pen.fallProgress = 1.0;
              pen.fallComplete = true;
            }
          }
          continue;
        }

        // Linear step
        pen.position = pen.position.add(pen.velocity.scale(subDt));

        // Angular step
        pen.angle += pen.angularVelocity * subDt;

        // Friction damping
        const linFactor = Math.max(0, 1 - pen.stats.linearDamping * subDt);
        const angFactor = Math.max(0, 1 - pen.stats.angularDamping * subDt);

        pen.velocity = pen.velocity.scale(linFactor);
        pen.angularVelocity *= angFactor;

        if (pen.isAtRest()) {
          pen.stop();
        }

        // Out of bounds
        if (isPenOutOfBounds(pen, bench)) {
          pen.outOfBounds = true;
          pen.velocity = pen.velocity.scale(0.35);
          this.onOutOfBounds?.(pen);
        }
      }

      // Check collision
      for (let i = 0; i < pens.length; i++) {
        for (let j = i + 1; j < pens.length; j++) {
          const p1 = pens[i];
          const p2 = pens[j];
          if (!p1.outOfBounds && !p2.outOfBounds) {
            const result = CollisionHandler.resolveCollision(p1, p2);
            if (result.occurred) {
              this.onCollision?.(p1, p2, result.relativeSpeed, result.hitZoneOnB, result.contactPoint);
            }
          }
        }
      }
    }
  }
}
