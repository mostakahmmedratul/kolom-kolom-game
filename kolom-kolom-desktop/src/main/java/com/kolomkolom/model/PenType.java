package com.kolomkolom.model;

import java.awt.Color;

/**
 * Three distinct pen types offering calibrated trade-offs between mass, control, friction, and visual theme.
 */
public enum PenType {
    BALANCED(
            "Classic Crystal",
            "Reliable hexagonal barrel with balanced mass and smooth flick responsiveness.",
            "Royal Blue",
            new Color(0x25, 0x63, 0xeb),
            new Color(0x1d, 0x4e, 0xd8),
            new Color(0x93, 0xc5, 0xfd),
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
            "Gunmetal & Gold",
            new Color(0x33, 0x41, 0x55),
            new Color(0x0f, 0x17, 0x2a),
            new Color(0xf5, 0x9e, 0x0b),
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
            "Cyan Electric",
            new Color(0x06, 0xb6, 0xd4),
            new Color(0x08, 0x91, 0xb2),
            new Color(0x67, 0xe8, 0xf9),
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
    private final String colorName;
    private final Color primaryColor;
    private final Color accentColor;
    private final Color clipColor;
    private final PenStats stats;

    PenType(String displayName, String description, String colorName,
            Color primaryColor, Color accentColor, Color clipColor,
            double mass, double length, double width,
            double linearDamping, double angularDamping, double restitution, double impulseMultiplier) {
        this.displayName = displayName;
        this.description = description;
        this.colorName = colorName;
        this.primaryColor = primaryColor;
        this.accentColor = accentColor;
        this.clipColor = clipColor;
        this.stats = new PenStats(mass, length, width, linearDamping, angularDamping, restitution, impulseMultiplier);
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public String getColorName() {
        return colorName;
    }

    public Color getPrimaryColor() {
        return primaryColor;
    }

    public Color getAccentColor() {
        return accentColor;
    }

    public Color getClipColor() {
        return clipColor;
    }

    public PenStats getStats() {
        return stats;
    }
}
