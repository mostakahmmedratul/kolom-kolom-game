package com.kolomkolom.physics;

import com.kolomkolom.model.Pen;

/**
 * Handles 2D rigid-body collision detection and impulse response between pens,
 * incorporating rotational inertia, off-center contact torque, and position projection.
 */
public final class CollisionHandler {

    private CollisionHandler() {}

    /**
     * Resolves collision between two pens if they intersect.
     * Returns true if a collision occurred and impulses were applied.
     */
    public static boolean resolveCollision(Pen penA, Pen penB) {
        if (penA.isOutOfBounds() || penB.isOutOfBounds()) {
            return false;
        }

        CapsuleCollider colliderA = penA.getCollider();
        CapsuleCollider colliderB = penB.getCollider();

        CapsuleCollider.ContactInfo contact = colliderA.testCollision(colliderB);
        if (!contact.colliding()) {
            return false;
        }

        Vector2D normal = contact.normal(); // points from B to A
        double penetration = contact.penetration();

        // 1. Positional correction (Projection) to prevent sticking and penetration
        double invMassA = 1.0 / penA.getPenType().getStats().mass();
        double invMassB = 1.0 / penB.getPenType().getStats().mass();
        double totalInvMass = invMassA + invMassB;

        if (totalInvMass > 0.0) {
            double percent = 0.85; // penetration percentage to resolve
            double slop = 0.05;
            double correctionMagnitude = Math.max(0.0, penetration - slop) / totalInvMass * percent;
            Vector2D correction = normal.scale(correctionMagnitude);

            penA.setPosition(penA.getPosition().add(correction.scale(invMassA)));
            penB.setPosition(penB.getPosition().subtract(correction.scale(invMassB)));
        }

        // 2. Compute contact points on both bodies
        Vector2D contactPoint = contact.contactPointA().add(contact.contactPointB()).scale(0.5);
        Vector2D rA = contactPoint.subtract(penA.getPosition());
        Vector2D rB = contactPoint.subtract(penB.getPosition());

        // 3. Velocities at contact point including angular velocity
        // v_point = v + omega x r -> in 2D: (-omega * ry, omega * rx)
        Vector2D vPointA = penA.getVelocity().add(new Vector2D(-penA.getAngularVelocity() * rA.y, penA.getAngularVelocity() * rA.x));
        Vector2D vPointB = penB.getVelocity().add(new Vector2D(-penB.getAngularVelocity() * rB.y, penB.getAngularVelocity() * rB.x));

        // Relative velocity
        Vector2D vRel = vPointA.subtract(vPointB);
        double velAlongNormal = vRel.dot(normal);

        // Do not resolve if velocities are separating
        if (velAlongNormal > 0.0) {
            return false;
        }

        // Restitution (coefficient of bounciness) with zone-specific material modifiers
        double restA = penA.getPenType().getStats().restitution();
        double restB = penB.getPenType().getStats().restitution();
        double baseE = (restA + restB) * 0.5;

        double projB = rB.dot(penB.getDirection());
        double halfLenB = penB.getPenType().getStats().length() * 0.5;
        double zoneBonus = 0.0;
        if (projB > halfLenB * 0.28) {
            zoneBonus = 0.12; // metal nib has higher elastic bounce
        } else if (projB < -halfLenB * 0.28) {
            zoneBonus = 0.06; // cap has spring clip bounce
        }
        double e = Math.min(0.88, baseE + zoneBonus);

        // Inertias
        double invInertiaA = 1.0 / penA.getPenType().getStats().momentOfInertia();
        double invInertiaB = 1.0 / penB.getPenType().getStats().momentOfInertia();

        // 2D cross product scalar (r x n)
        double rACrossN = rA.cross(normal);
        double rBCrossN = rB.cross(normal);

        double denom = invMassA + invMassB + (rACrossN * rACrossN) * invInertiaA + (rBCrossN * rBCrossN) * invInertiaB;
        if (denom < 1e-9) {
            return false;
        }

        // Normal impulse magnitude J
        double jMag = -(1.0 + e) * velAlongNormal / denom;
        Vector2D impulse = normal.scale(jMag);

        // Apply linear and angular impulse to pen A
        penA.setVelocity(penA.getVelocity().add(impulse.scale(invMassA)));
        penA.setAngularVelocity(penA.getAngularVelocity() + (rA.cross(impulse)) * invInertiaA);

        // Apply linear and angular impulse to pen B (equal and opposite)
        penB.setVelocity(penB.getVelocity().subtract(impulse.scale(invMassB)));
        penB.setAngularVelocity(penB.getAngularVelocity() - (rB.cross(impulse)) * invInertiaB);

        // Optional slight surface friction impulse along tangent
        Vector2D tangent = normal.perpendicular();
        double velAlongTangent = vRel.dot(tangent);
        double rACrossT = rA.cross(tangent);
        double rBCrossT = rB.cross(tangent);
        double denomTangent = invMassA + invMassB + (rACrossT * rACrossT) * invInertiaA + (rBCrossT * rBCrossT) * invInertiaB;

        if (denomTangent > 1e-9) {
            double frictionCoeff = 0.22;
            double jtMag = -velAlongTangent / denomTangent;
            // Coulomb's law clamp: |jt| <= mu * j
            double maxJt = frictionCoeff * jMag;
            jtMag = Math.clamp(jtMag, -maxJt, maxJt);
            Vector2D frictionImpulse = tangent.scale(jtMag);

            penA.setVelocity(penA.getVelocity().add(frictionImpulse.scale(invMassA)));
            penA.setAngularVelocity(penA.getAngularVelocity() + (rA.cross(frictionImpulse)) * invInertiaA);

            penB.setVelocity(penB.getVelocity().subtract(frictionImpulse.scale(invMassB)));
            penB.setAngularVelocity(penB.getAngularVelocity() - (rB.cross(frictionImpulse)) * invInertiaB);
        }

        return true;
    }
}
