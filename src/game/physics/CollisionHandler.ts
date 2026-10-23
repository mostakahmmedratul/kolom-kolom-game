import { Pen } from '../model/Pen';
import { getMomentOfInertia } from '../model/PenStats';
import { Vector2D } from './Vector2D';

export interface CollisionResult {
  occurred: boolean;
  contactPoint: Vector2D | null;
  hitZoneOnA: 'TIP' | 'CENTER' | 'CAP';
  hitZoneOnB: 'TIP' | 'CENTER' | 'CAP';
  relativeSpeed: number;
}

export class CollisionHandler {
  static resolveCollision(penA: Pen, penB: Pen): CollisionResult {
    const noCollision: CollisionResult = {
      occurred: false,
      contactPoint: null,
      hitZoneOnA: 'CENTER',
      hitZoneOnB: 'CENTER',
      relativeSpeed: 0,
    };

    if (penA.outOfBounds || penB.outOfBounds) return noCollision;

    const contact = penA.getCollider().testCollision(penB.getCollider());
    if (!contact.colliding || !contact.contactPointA || !contact.contactPointB) {
      return noCollision;
    }

    const normal = contact.normal;
    const penetration = contact.penetration;

    // Positional projection to resolve overlapping
    const invMassA = 1 / penA.stats.mass;
    const invMassB = 1 / penB.stats.mass;
    const totalInvMass = invMassA + invMassB;

    if (totalInvMass > 0) {
      const slop = 0.05;
      const correctionMag = (Math.max(0, penetration - slop) / totalInvMass) * 0.85;
      const correction = normal.scale(correctionMag);

      penA.position = penA.position.add(correction.scale(invMassA));
      penB.position = penB.position.subtract(correction.scale(invMassB));
    }

    const contactPoint = contact.contactPointA.add(contact.contactPointB).scale(0.5);
    const rA = contactPoint.subtract(penA.position);
    const rB = contactPoint.subtract(penB.position);

    // Identify which physical zone was struck on each pen
    const dirA = penA.getDirection();
    const projA = rA.dot(dirA);
    const halfLenA = penA.stats.length * 0.5;
    const hitZoneA = projA > halfLenA * 0.28 ? 'TIP' : projA < -halfLenA * 0.28 ? 'CAP' : 'CENTER';

    const dirB = penB.getDirection();
    const projB = rB.dot(dirB);
    const halfLenB = penB.stats.length * 0.5;
    const hitZoneB = projB > halfLenB * 0.28 ? 'TIP' : projB < -halfLenB * 0.28 ? 'CAP' : 'CENTER';

    // Velocities at contact point
    const vPointA = penA.velocity.add(new Vector2D(-penA.angularVelocity * rA.y, penA.angularVelocity * rA.x));
    const vPointB = penB.velocity.add(new Vector2D(-penB.angularVelocity * rB.y, penB.angularVelocity * rB.x));

    const vRel = vPointA.subtract(vPointB);
    const velAlongNormal = vRel.dot(normal);

    if (velAlongNormal > 0) {
      return noCollision; // separating
    }

    // Material restitution based on struck zone (metal tip has higher elastic bounce)
    let restitutionBonus = 0;
    if (hitZoneA === 'TIP' || hitZoneB === 'TIP') restitutionBonus += 0.12;
    if (hitZoneA === 'CAP' || hitZoneB === 'CAP') restitutionBonus += 0.06;

    const baseE = (penA.stats.restitution + penB.stats.restitution) * 0.5;
    const e = Math.min(0.88, baseE + restitutionBonus);

    const invInertiaA = 1 / getMomentOfInertia(penA.stats);
    const invInertiaB = 1 / getMomentOfInertia(penB.stats);

    const rACrossN = rA.cross(normal);
    const rBCrossN = rB.cross(normal);

    const denom = invMassA + invMassB + rACrossN * rACrossN * invInertiaA + rBCrossN * rBCrossN * invInertiaB;
    if (denom < 1e-9) return noCollision;

    const jMag = (-(1 + e) * velAlongNormal) / denom;
    const impulse = normal.scale(jMag);

    // Apply linear & angular impulse
    penA.velocity = penA.velocity.add(impulse.scale(invMassA));
    penA.angularVelocity += rA.cross(impulse) * invInertiaA;

    penB.velocity = penB.velocity.subtract(impulse.scale(invMassB));
    penB.angularVelocity -= rB.cross(impulse) * invInertiaB;

    // Tangential friction impulse
    const tangent = normal.perpendicular();
    const velAlongTangent = vRel.dot(tangent);
    const rACrossT = rA.cross(tangent);
    const rBCrossT = rB.cross(tangent);
    const denomT = invMassA + invMassB + rACrossT * rACrossT * invInertiaA + rBCrossT * rBCrossT * invInertiaB;

    if (denomT > 1e-9) {
      let jtMag = -velAlongTangent / denomT;
      const frictionCoeff = hitZoneB === 'CENTER' ? 0.28 : 0.18; // rubber grip barrel has more bite
      const maxJt = frictionCoeff * jMag;
      jtMag = Math.max(-maxJt, Math.min(maxJt, jtMag));
      const frictionImpulse = tangent.scale(jtMag);

      penA.velocity = penA.velocity.add(frictionImpulse.scale(invMassA));
      penA.angularVelocity += rA.cross(frictionImpulse) * invInertiaA;

      penB.velocity = penB.velocity.subtract(frictionImpulse.scale(invMassB));
      penB.angularVelocity -= rB.cross(frictionImpulse) * invInertiaB;
    }

    return {
      occurred: true,
      contactPoint,
      hitZoneOnA: hitZoneA,
      hitZoneOnB: hitZoneB,
      relativeSpeed: vRel.length(),
    };
  }
}
