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

  public primaryColor: string;
  public accentColor: string;
  public clipColor: string;

  constructor(
    public readonly id: 'HUMAN' | 'BOT',
    public readonly name: string,
    public penType: PenTypeId,
    primaryColor: string,
    accentColor: string,
    initialPos: Vector2D,
    initialAngle: number,
    clipColor: string = '#cbd5e1'
  ) {
    this.primaryColor = primaryColor;
    this.accentColor = accentColor;
    this.clipColor = clipColor;
    this.position = initialPos;
    this.velocity = Vector2D.ZERO;
    this.angle = initialAngle;
    this.angularVelocity = 0;
    this.outOfBounds = false;
    this.fallProgress = 0;
    this.fallComplete = false;
  }

  setPenType(type: PenTypeId, colors?: { primary: string; accent: string; clip?: string }): void {
    this.penType = type;
    if (colors) {
      this.primaryColor = colors.primary;
      this.accentColor = colors.accent;
      if (colors.clip) this.clipColor = colors.clip;
    } else {
      const typeData = PEN_TYPES[type];
      if (typeData && typeData.colors) {
        this.primaryColor = typeData.colors.primary;
        this.accentColor = typeData.colors.accent;
        this.clipColor = typeData.colors.clip;
      }
    }
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

  applyFlickImpulse(impulse: Vector2D, flickPart: 'TIP' | 'CENTER' | 'CAP'): void {
    if (this.outOfBounds) return;
    const { mass, impulseMultiplier } = this.stats;
    const inertia = getMomentOfInertia(this.stats);

    // Linear propulsion
    const linFactor = flickPart === 'CENTER' ? 1.25 : 0.95;
    this.velocity = this.velocity.add(impulse.scale((impulseMultiplier * linFactor) / mass));

    // Off-center lever arm r along pen axis
    const dir = this.getDirection();
    const halfLen = this.stats.length * 0.44;

    let r = Vector2D.ZERO;
    if (flickPart === 'TIP') {
      r = dir.scale(halfLen);
    } else if (flickPart === 'CAP') {
      r = dir.scale(-halfLen);
    }

    // Rotational torque: r x impulse
    let torque = r.cross(impulse);

    // If flicking exactly in-line, apply natural schoolyard finger flick spin
    if (Math.abs(torque) < 1e-4 && flickPart !== 'CENTER') {
      const naturalAngle = flickPart === 'TIP' ? 0.35 : -0.35;
      torque = impulse.length() * halfLen * Math.sin(naturalAngle);
    }

    // Apply angular velocity proportional to flick power and torque
    const torqueBoost = 1.7;
    this.angularVelocity += (torque * torqueBoost) / inertia;
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
