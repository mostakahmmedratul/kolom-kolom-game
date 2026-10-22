package com.kolomkolom.physics;

import com.kolomkolom.model.Bench;
import com.kolomkolom.model.Pen;

import java.util.ArrayList;
import java.util.List;

/**
 * High-precision 2D physics simulation engine using fixed timesteps and sub-stepping
 * for robust collision detection and realistic surface friction.
 */
public class PhysicsEngine {
    public static final double FIXED_DELTA_TIME = 1.0 / 120.0; // 120 Hz fixed sub-step
    public static final int SUB_STEPS = 4; // 4 sub-steps per frame (total 480 Hz CCD)

    private final List<CollisionListener> listeners = new ArrayList<>();

    public interface CollisionListener {
        void onPenPenCollision(Pen a, Pen b, double relativeSpeed);
        void onPenOutOfBounds(Pen pen);
    }

    public void addCollisionListener(CollisionListener listener) {
        listeners.add(listener);
    }

    /**
     * Steps the simulation forward by deltaSeconds using sub-stepping.
     */
    public void update(List<Pen> pens, Bench bench, double deltaSeconds) {
        double subDt = deltaSeconds / SUB_STEPS;

        for (int step = 0; step < SUB_STEPS; step++) {
            // 1. Integrate motion for each active pen
            for (Pen pen : pens) {
                if (pen.isOutOfBounds()) {
                    // Update fall animation if pen has tipped off
                    if (!pen.isFallComplete()) {
                        pen.setFallProgress(pen.getFallProgress() + subDt * 2.5);
                        if (pen.getFallProgress() >= 1.0) {
                            pen.setFallProgress(1.0);
                            pen.setFallComplete(true);
                        }
                    }
                    continue;
                }

                // Linear motion
                Vector2D pos = pen.getPosition();
                Vector2D vel = pen.getVelocity();
                pen.setPosition(pos.add(vel.scale(subDt)));

                // Angular motion
                double angle = pen.getAngle();
                double angVel = pen.getAngularVelocity();
                pen.setAngle(angle + angVel * subDt);

                // Damping / Friction against wooden bench surface
                double linDamp = pen.getPenType().getStats().linearDamping();
                double angDamp = pen.getPenType().getStats().angularDamping();

                double linFactor = Math.max(0.0, 1.0 - linDamp * subDt);
                double angFactor = Math.max(0.0, 1.0 - angDamp * subDt);

                pen.setVelocity(vel.scale(linFactor));
                pen.setAngularVelocity(angVel * angFactor);

                // Zero out micro-velocities to prevent endless jitter
                if (pen.isAtRest()) {
                    pen.stop();
                }

                // Check out-of-bounds against bench edge
                if (bench != null && bench.isPenOutOfBounds(pen)) {
                    pen.setOutOfBounds(true);
                    pen.setVelocity(pen.getVelocity().scale(0.3)); // slow down as it tumbles off
                    notifyOutOfBounds(pen);
                }
            }

            // 2. Inter-pen collision detection and response
            for (int i = 0; i < pens.size(); i++) {
                for (int j = i + 1; j < pens.size(); j++) {
                    Pen p1 = pens.get(i);
                    Pen p2 = pens.get(j);

                    if (!p1.isOutOfBounds() && !p2.isOutOfBounds()) {
                        double relSpeed = p1.getVelocity().subtract(p2.getVelocity()).length();
                        boolean hit = CollisionHandler.resolveCollision(p1, p2);
                        if (hit) {
                            notifyCollision(p1, p2, relSpeed);
                        }
                    }
                }
            }
        }
    }

    private void notifyCollision(Pen a, Pen b, double speed) {
        for (CollisionListener l : listeners) {
            l.onPenPenCollision(a, b, speed);
        }
    }

    private void notifyOutOfBounds(Pen pen) {
        for (CollisionListener l : listeners) {
            l.onPenOutOfBounds(pen);
        }
    }
}
