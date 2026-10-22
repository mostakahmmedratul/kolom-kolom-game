import { CapsuleCollider } from '../physics/CapsuleCollider';
import { Vector2D } from '../physics/Vector2D';
import { getMomentOfInertia, PenStats, PenTypeId, PEN_TYPES } from './PenStats';

export class Pen {
  public position: Vector2D;
  public velocity: Vector2D;
  public angle: number;
  public angularVelocity: number;
  public outOfBounds: boolean;
  public fallProgress: number;
  public fallComplete: boolean;

  constructor(
    public readonly id: 'HUMAN' | 'BOT',
    public readonly name: string,
    public penType: PenTypeId,
    public readonly primaryColor: string,
    public readonly accentColor: string,
    initialPos: Vector2D,
    initialAngle: number
  ) {
    this.position = initialPos;
    this.velocity = Vector2D.ZERO;
    this.angle = initialAngle;
    this.angularVelocity = 0;
    this.outOfBounds = false;
    this.fallProgress = 0;
    this.fallComplete = false;
  }

  get stats(): PenStats {
    return PEN_TYPES[this.penType].stats;
  }

  reset(pos: Vector2D, angle: number): void {
    this.position = pos;
    this.velocity = Vector2D.ZERO;
    this.angle = angle;
    this.angularVelocity = 0;
    this.outOfBounds = false;
    this.fallProgress = 0;
    this.fallComplete = false;
  }

  applyDirectImpulse(impulse: Vector2D): void {
    if (this.outOfBounds) return;
    const { mass, impulseMultiplier } = this.stats;
    this.velocity = this.velocity.add(impulse.scale(impulseMultiplier / mass));
  }

  applyImpulseAtPoint(impulse: Vector2D, contactPoint: Vector2D): void {
    if (this.outOfBounds) return;
    const { mass } = this.stats;
    const inertia = getMomentOfInertia(this.stats);

    this.velocity = this.velocity.add(impulse.scale(1 / mass));

    const r = contactPoint.subtract(this.position);
    const torque = r.cross(impulse);
    this.angularVelocity += torque / inertia;
  }

  getDirection(): Vector2D {
    return new Vector2D(Math.cos(this.angle), Math.sin(this.angle));
  }

  getCollider(): CapsuleCollider {
    const halfLen = this.stats.length * 0.46;
    const dir = this.getDirection();
    const offset = dir.scale(halfLen);
    const a = this.position.subtract(offset);
    const b = this.position.add(offset);
    return new CapsuleCollider(a, b, this.stats.width * 0.5);
  }

  containsPoint(point: Vector2D): boolean {
    const dir = this.getDirection();
    const toPoint = point.subtract(this.position);
    const proj = toPoint.dot(dir);
    const halfLen = this.stats.length * 0.5;
    if (Math.abs(proj) > halfLen + 8) return false;

    const perp = dir.perpendicular();
    const distPerp = Math.abs(toPoint.dot(perp));
    return distPerp <= this.stats.width * 0.5 + 10;
  }

  isAtRest(): boolean {
    return this.velocity.lengthSquared() < 0.25 && Math.abs(this.angularVelocity) < 0.03;
  }

  stop(): void {
    this.velocity = Vector2D.ZERO;
    this.angularVelocity = 0;
  }
}
