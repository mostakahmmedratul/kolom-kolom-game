import { Vector2D } from './Vector2D';

export interface ContactInfo {
  colliding: boolean;
  contactPointA: Vector2D | null;
  contactPointB: Vector2D | null;
  normal: Vector2D;
  penetration: number;
}

export class CapsuleCollider {
  constructor(
    public readonly a: Vector2D,
    public readonly b: Vector2D,
    public readonly radius: number
  ) {}

  testCollision(other: CapsuleCollider): ContactInfo {
    const { pointOnFirst, pointOnSecond } = closestPointsBetweenSegments(
      this.a,
      this.b,
      other.a,
      other.b
    );

    const distance = pointOnFirst.distanceTo(pointOnSecond);
    const combinedRadius = this.radius + other.radius;

    if (distance < combinedRadius) {
      const penetration = combinedRadius - distance;
      let normal: Vector2D;

      if (distance > 1e-6) {
        normal = pointOnFirst.subtract(pointOnSecond).scale(1 / distance);
      } else {
        const segDir = this.b.subtract(this.a).normalize();
        normal = segDir.perpendicular();
      }

      return {
        colliding: true,
        contactPointA: pointOnFirst,
        contactPointB: pointOnSecond,
        normal,
        penetration,
      };
    }

    return {
      colliding: false,
      contactPointA: null,
      contactPointB: null,
      normal: Vector2D.ZERO,
      penetration: 0,
    };
  }
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function closestPointsBetweenSegments(
  p1: Vector2D,
  q1: Vector2D,
  p2: Vector2D,
  q2: Vector2D
): { pointOnFirst: Vector2D; pointOnSecond: Vector2D } {
  const d1 = q1.subtract(p1);
  const d2 = q2.subtract(p2);
  const r = p1.subtract(p2);

  const a = d1.dot(d1);
  const e = d2.dot(d2);
  const f = d2.dot(r);

  let s = 0;
  let t = 0;

  if (a <= 1e-9 && e <= 1e-9) {
    return { pointOnFirst: p1, pointOnSecond: p2 };
  }

  if (a <= 1e-9) {
    s = 0;
    t = clamp(f / e, 0, 1);
  } else {
    const c = d1.dot(r);
    if (e <= 1e-9) {
      t = 0;
      s = clamp(-c / a, 0, 1);
    } else {
      const b = d1.dot(d2);
      const denom = a * e - b * b;

      if (denom !== 0) {
        s = clamp((b * f - c * e) / denom, 0, 1);
      } else {
        s = 0;
      }

      t = (b * s + f) / e;

      if (t < 0) {
        t = 0;
        s = clamp(-c / a, 0, 1);
      } else if (t > 1) {
        t = 1;
        s = clamp((b - c) / a, 0, 1);
      }
    }
  }

  return {
    pointOnFirst: p1.add(d1.scale(s)),
    pointOnSecond: p2.add(d2.scale(t)),
  };
}
