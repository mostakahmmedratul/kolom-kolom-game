package com.kolomkolom.model;

/**
 * Immutable physical parameters governing the pen's mass, dimensions, damping, and restitution.
 */
public record PenStats(
        double mass,
        double length,
        double width,
        double linearDamping,
        double angularDamping,
        double restitution,
        double impulseMultiplier
) {
    /**
     * Moment of inertia of a 2D rod/cylinder rotating about its center: I = (1/12) * M * (L^2 + W^2).
     */
    public double momentOfInertia() {
        return (1.0 / 12.0) * mass * (length * length + width * width);
    }
}
