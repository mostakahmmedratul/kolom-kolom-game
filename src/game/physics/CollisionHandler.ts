import { Pen } from '../model/Pen';
import { getMomentOfInertia } from '../model/PenStats';
import { Vector2D } from './Vector2D';

export class CollisionHandler {
  static resolveCollision(penA: Pen, penB: Pen): boolean {
    if (penA.outOfBounds || penB.outOfBounds) return false;

    const contact = penA.getCollider().testCollision(penB.getCollider());
    if (!contact.colliding || !contact.contactPointA || !contact.contactPointB) {
      return false;
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

    // Velocities at contact point
    const vPointA = penA.velocity.add(new Vector2D(-penA.angularVelocity * rA.y, penA.angularVelocity * rA.x));
    const vPointB = penB.velocity.add(new Vector2D(-penB.angularVelocity * rB.y, penB.angularVelocity * rB.x));

    const vRel = vPointA.subtract(vPointB);
    const velAlongNormal = vRel.dot(normal);

    if (velAlongNormal > 0) {
      return false; // separating
    }

    const e = (penA.stats.restitution + penB.stats.restitution) * 0.5;
    const invInertiaA = 1 / getMomentOfInertia(penA.stats);
    const invInertiaB = 1 / getMomentOfInertia(penB.stats);

    const rACrossN = rA.cross(normal);
    const rBCrossN = rB.cross(normal);

    const denom = invMassA + invMassB + rACrossN * rACrossN * invInertiaA + rBCrossN * rBCrossN * invInertiaB;
    if (denom < 1e-9) return false;

    const jMag = (-(1 + e) * velAlongNormal) / denom;
    const impulse = normal.scale(jMag);

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
      const maxJt = 0.22 * jMag;
      jtMag = Math.max(-maxJt, Math.min(maxJt, jtMag));
      const frictionImpulse = tangent.scale(jtMag);

      penA.velocity = penA.velocity.add(frictionImpulse.scale(invMassA));
      penA.angularVelocity += rA.cross(frictionImpulse) * invInertiaA;

      penB.velocity = penB.velocity.subtract(frictionImpulse.scale(invMassB));
      penB.angularVelocity -= rB.cross(frictionImpulse) * invInertiaB;
    }

    return true;
  }
}
