import { Vector2D } from '../physics/Vector2D';
import { Pen } from './Pen';

export type FlickPart = 'TIP' | 'CENTER' | 'CAP';

export interface FlickPartConfig {
  id: FlickPart;
  name: string;
  label: string;
  tagline: string;
  description: string;
  torqueFactor: number;
  linearFactor: number;
  color: string;
  badgeBg: string;
}

export const FLICK_PARTS: Record<FlickPart, FlickPartConfig> = {
  TIP: {
    id: 'TIP',
    name: 'Tip (Front Nib)',
    label: 'Tip · High Spin',
    tagline: 'Whirlwind Propeller Spin',
    description: 'Flicking the front tip applies strong off-center torque. The pen spins rapidly as it glides across the desk!',
    torqueFactor: 1.8,
    linearFactor: 0.9,
    color: '#f59e0b',
    badgeBg: 'border-amber-500/50 bg-amber-950/50 text-amber-300 ring-1 ring-amber-400/40',
  },
  CENTER: {
    id: 'CENTER',
    name: 'Center (Body)',
    label: 'Center · Straight Push',
    tagline: 'Pure Forward Velocity',
    description: 'Flicking the center of mass delivers pure linear momentum. The pen slides straight forward like a bullet with minimal spin.',
    torqueFactor: 0.08,
    linearFactor: 1.25,
    color: '#38bdf8',
    badgeBg: 'border-sky-500/50 bg-sky-950/50 text-sky-300 ring-1 ring-sky-400/40',
  },
  CAP: {
    id: 'CAP',
    name: 'Cap (Back Clip)',
    label: 'Cap · Whip Spin',
    tagline: 'Reverse Whip Spin',
    description: 'Flicking the back cap pivots the pen from the rear. Launches with reverse spin, sweeping in a curving lateral arc.',
    torqueFactor: -1.7,
    linearFactor: 0.92,
    color: '#c084fc',
    badgeBg: 'border-purple-500/50 bg-purple-950/50 text-purple-300 ring-1 ring-purple-400/40',
  },
};

/**
 * Calculates world coordinate for the selected flick contact point on a pen.
 */
export function getPenFlickPoint(pen: Pen, part: FlickPart): Vector2D {
  const dir = pen.getDirection();
  const halfLen = pen.stats.length * 0.44;

  switch (part) {
    case 'TIP':
      return pen.position.add(dir.scale(halfLen));
    case 'CAP':
      return pen.position.subtract(dir.scale(halfLen));
    case 'CENTER':
    default:
      return pen.position;
  }
}
