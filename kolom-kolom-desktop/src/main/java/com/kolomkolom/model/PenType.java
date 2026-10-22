package com.kolomkolom.model;

/**
 * Three distinct pen types offering calibrated trade-offs between mass, control, and friction.
 */
public enum PenType {
    BALANCED(
            "Classic Crystal",
            "Reliable hexagonal barrel with balanced mass and smooth flick responsiveness.",
            1.0,   // mass
            140.0, // length in px
            16.0,  // width in px
            1.8,   // linear damping (friction)
            2.4,   // angular damping
            0.62,  // restitution (bounciness)
            1.00   // impulse multiplier
    ),
    HEAVY(
            "Executive Metal",
            "Solid metallic build delivering bone-shattering collision momentum but slower acceleration.",
            1.55,  // mass
            145.0, // length
            18.0,  // width
            1.4,   // linear damping (glides further)
            1.9,   // angular damping
            0.55,  // restitution
            0.88   // impulse multiplier (needs firm flick)
    ),
    RUBBER_GRIP(
            "Pro Grip Gel",
            "Ergonomic rubberized grip with sharp directional control and high stopping friction.",
            0.88,  // mass
            135.0, // length
            17.0,  // width
            2.5,   // linear damping (stops quickly)
            3.2,   // angular damping
            0.70,  // restitution
            1.15   // impulse multiplier (snappy flick)
    );

    private final String displayName;
    private final String description;
    private final PenStats stats;

    PenType(String displayName, String description, double mass, double length, double width,
            double linearDamping, double angularDamping, double restitution, double impulseMultiplier) {
        this.displayName = displayName;
        this.description = description;
        this.stats = new PenStats(mass, length, width, linearDamping, angularDamping, restitution, impulseMultiplier);
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public PenStats getStats() {
        return stats;
    }
}
