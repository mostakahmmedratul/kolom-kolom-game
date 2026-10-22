export class Vector2D {
  static readonly ZERO = new Vector2D(0, 0);

  constructor(public readonly x: number, public readonly y: number) {}

  add(other: Vector2D): Vector2D {
    return new Vector2D(this.x + other.x, this.y + other.y);
  }

  subtract(other: Vector2D): Vector2D {
    return new Vector2D(this.x - other.x, this.y - other.y);
  }

  scale(s: number): Vector2D {
    return new Vector2D(this.x * s, this.y * s);
  }

  dot(other: Vector2D): number {
    return this.x * other.x + this.y * other.y;
  }

  cross(other: Vector2D): number {
    return this.x * other.y - this.y * other.x;
  }

  lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): Vector2D {
    const len = this.length();
    return len < 1e-9 ? Vector2D.ZERO : new Vector2D(this.x / len, this.y / len);
  }

  distanceTo(other: Vector2D): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  perpendicular(): Vector2D {
    return new Vector2D(-this.y, this.x);
  }

  rotate(radians: number): Vector2D {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return new Vector2D(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
  }
}
