export interface PenStats {
  mass: number;
  length: number;
  width: number;
  linearDamping: number;
  angularDamping: number;
  restitution: number;
  impulseMultiplier: number;
}

export type PenTypeId = 'BALANCED' | 'HEAVY' | 'RUBBER_GRIP';

export interface PenColors {
  primary: string;
  accent: string;
  clip: string;
  grip: string;
  badge: string;
}

export interface PenTypeData {
  id: PenTypeId;
  name: string;
  tagline: string;
  description: string;
  stats: PenStats;
  colorName: string;
  colors: PenColors;
}

export const PEN_TYPES: Record<PenTypeId, PenTypeData> = {
  BALANCED: {
    id: 'BALANCED',
    name: 'Classic Crystal',
    tagline: 'Balanced All-Rounder',
    description: 'Iconic hexagonal clear body with balanced mass and responsive glide.',
    stats: {
      mass: 1.0,
      length: 135,
      width: 16,
      linearDamping: 1.8,
      angularDamping: 2.4,
      restitution: 0.62,
      impulseMultiplier: 1.0,
    },
    colorName: 'Royal Blue',
    colors: {
      primary: '#2563eb',
      accent: '#1d4ed8',
      clip: '#93c5fd',
      grip: '#1e3a8a',
      badge: '#3b82f6',
    },
  },
  HEAVY: {
    id: 'HEAVY',
    name: 'Executive Metal',
    tagline: 'High Momentum Battering Ram',
    description: 'Heavy brushed metallic pen delivering devastating impact force with low friction glide.',
    stats: {
      mass: 1.55,
      length: 140,
      width: 18,
      linearDamping: 1.4,
      angularDamping: 1.9,
      restitution: 0.55,
      impulseMultiplier: 0.88,
    },
    colorName: 'Gunmetal Cobalt & Gold',
    colors: {
      primary: '#334155',
      accent: '#0f172a',
      clip: '#f59e0b',
      grip: '#475569',
      badge: '#eab308',
    },
  },
  RUBBER_GRIP: {
    id: 'RUBBER_GRIP',
    name: 'Pro Grip Gel',
    tagline: 'Agile Precision & High Braking',
    description: 'Lightweight ergonomic rubberized pen with pinpoint flick control and rapid braking.',
    stats: {
      mass: 0.88,
      length: 130,
      width: 17,
      linearDamping: 2.5,
      angularDamping: 3.2,
      restitution: 0.7,
      impulseMultiplier: 1.15,
    },
    colorName: 'Cyan Electric',
    colors: {
      primary: '#06b6d4',
      accent: '#0891b2',
      clip: '#67e8f9',
      grip: '#164e63',
      badge: '#06b6d4',
    },
  },
};

export function getMomentOfInertia(stats: PenStats): number {
  return (1 / 12) * stats.mass * (stats.length * stats.length + stats.width * stats.width);
}
