package com.kolomkolom.model;

import com.kolomkolom.physics.CapsuleCollider;
import com.kolomkolom.physics.Vector2D;

import java.awt.Color;

/**
 * Represents an individual ballpoint pen on the school bench with full rigid-body state.
 */
public class Pen {
    private final String id;
    private final String ownerName;
    private Color primaryColor;
    private Color accentColor;
    private Color clipColor;
    private PenType penType;

    // Rigid body state
    private Vector2D position;
    private Vector2D velocity;
    private double angle; // in radians
    private double angularVelocity; // rad/s

    // Game lifecycle state
    private boolean outOfBounds;
    private double fallProgress; // 0.0 to 1.0 animation for falling off table
    private boolean fallComplete;

    public Pen(String id, String ownerName, PenType penType, Color primaryColor, Color accentColor,
               Vector2D initialPosition, double initialAngle) {
        this(id, ownerName, penType, primaryColor, accentColor, null, initialPosition, initialAngle);
    }

    public Pen(String id, String ownerName, PenType penType, Color primaryColor, Color accentColor,
               Color clipColor, Vector2D initialPosition, double initialAngle) {
        this.id = id;
        this.ownerName = ownerName;
        this.penType = penType;
        this.primaryColor = primaryColor;
        this.accentColor = accentColor;
        this.clipColor = clipColor != null ? clipColor : (penType != null ? penType.getClipColor() : accentColor);
        this.position = initialPosition;
        this.angle = initialAngle;
        this.velocity = Vector2D.ZERO;
        this.angularVelocity = 0.0;
        this.outOfBounds = false;
        this.fallProgress = 0.0;
        this.fallComplete = false;
    }

    /**
     * Resets this pen to a given position and angle with zero velocity.
     */
    public void reset(Vector2D pos, double ang) {
        this.position = pos;
        this.angle = ang;
        this.velocity = Vector2D.ZERO;
        this.angularVelocity = 0.0;
        this.outOfBounds = false;
        this.fallProgress = 0.0;
        this.fallComplete = false;
    }

    /**
     * Applies an impulse force at a specific world-space contact point.
     * Computes linear acceleration and angular torque impulse:
     * Delta V = J / M
     * Delta Omega = (r x J) / I
     */
    public void applyImpulse(Vector2D impulse, Vector2D contactPoint) {
        if (outOfBounds) return;

        double mass = penType.getStats().mass();
        double inertia = penType.getStats().momentOfInertia();

        // Linear velocity change
        this.velocity = this.velocity.add(impulse.scale(1.0 / mass));

        // Off-center lever arm r from center of mass to contact point
        Vector2D r = contactPoint.subtract(this.position);
        // 2D torque: rx * Jy - ry * Jx
        double torque = r.cross(impulse);
        this.angularVelocity += torque / inertia;
    }

    /**
     * Applies a direct impulse at the center of mass (pure linear impulse with slight natural flick torque).
     */
    public void applyDirectImpulse(Vector2D impulse) {
        if (outOfBounds) return;
        double mass = penType.getStats().mass();
        double mult = penType.getStats().impulseMultiplier();
        this.velocity = this.velocity.add(impulse.scale(mult / mass));
    }

    /**
     * Returns the unit direction vector along the pen's longitudinal axis.
     */
    public Vector2D getDirection() {
        return new Vector2D(Math.cos(angle), Math.sin(angle));
    }

    /**
     * Computes world coordinate for a designated strike zone (TIP, CENTER, CAP).
     */
    public Vector2D getStrikePoint(String zone) {
        Vector2D dir = getDirection();
        double halfLen = penType.getStats().length() * 0.5;
        if ("TIP".equalsIgnoreCase(zone)) {
            return position.add(dir.scale(halfLen * 0.88));
        } else if ("CAP".equalsIgnoreCase(zone)) {
            return position.subtract(dir.scale(halfLen * 0.82));
        }
        return position;
    }

    /**
     * Computes the world coordinate for the flick contact point on this pen's body.
     */
    public Vector2D getFlickPoint(String part) {
        Vector2D dir = getDirection();
        double halfLen = penType.getStats().length() * 0.44;
        if ("TIP".equalsIgnoreCase(part)) {
            return position.add(dir.scale(halfLen));
        } else if ("CAP".equalsIgnoreCase(part)) {
            return position.subtract(dir.scale(halfLen));
        }
        return position;
    }

    /**
     * Applies a flick impulse to this pen at the chosen contact point (TIP, CENTER, CAP).
     * Creates linear propulsion plus rotational spin torque proportional to off-center lever arm.
     */
    public void applyFlickImpulse(Vector2D impulse, String flickPart) {
        if (outOfBounds) return;
        double mass = penType.getStats().mass();
        double mult = penType.getStats().impulseMultiplier();
        double inertia = penType.getStats().momentOfInertia();

        // Linear propulsion
        double linFactor = "CENTER".equalsIgnoreCase(flickPart) ? 1.25 : 0.95;
        this.velocity = this.velocity.add(impulse.scale((mult * linFactor) / mass));

        // Off-center lever arm r along pen axis
        Vector2D dir = getDirection();
        double halfLen = penType.getStats().length() * 0.44;

        Vector2D r = Vector2D.ZERO;
        if ("TIP".equalsIgnoreCase(flickPart)) {
            r = dir.scale(halfLen);
        } else if ("CAP".equalsIgnoreCase(flickPart)) {
            r = dir.scale(-halfLen);
        }

        // 2D torque: r x impulse
        double torque = r.cross(impulse);

        // If flicked exactly inline, apply natural schoolyard finger snap spin
        if (Math.abs(torque) < 1e-4 && !"CENTER".equalsIgnoreCase(flickPart)) {
            double naturalAngle = "TIP".equalsIgnoreCase(flickPart) ? 0.35 : -0.35;
            torque = impulse.length() * halfLen * Math.sin(naturalAngle);
        }

        double torqueBoost = 1.7;
        this.angularVelocity += (torque * torqueBoost) / inertia;
    }

    /**
     * Constructs the oriented CapsuleCollider matching this pen's current position and rotation.
     */
    public CapsuleCollider getCollider() {
        double halfLength = penType.getStats().length() * 0.46; // tip and cap inset
        Vector2D dir = getDirection();
        Vector2D offset = dir.scale(halfLength);
        Vector2D a = position.subtract(offset);
        Vector2D b = position.add(offset);
        double radius = penType.getStats().width() * 0.5;
        return new CapsuleCollider(a, b, radius);
    }

    /**
     * Tests if a world-space coordinate (e.g. mouse click) lies within this pen's clickable area.
     */
    public boolean containsPoint(Vector2D point) {
        Vector2D dir = getDirection();
        Vector2D toPoint = point.subtract(position);
        double proj = toPoint.dot(dir);
        double halfLen = penType.getStats().length() * 0.5;
        if (Math.abs(proj) > halfLen + 4.0) return false;

        Vector2D perp = dir.perpendicular();
        double distPerp = Math.abs(toPoint.dot(perp));
        return distPerp <= (penType.getStats().width() * 0.5 + 8.0); // generous click target
    }

    /**
     * Returns true if linear and angular speeds are below sleep threshold.
     */
    public boolean isAtRest() {
        return velocity.lengthSquared() < 0.25 && Math.abs(angularVelocity) < 0.03;
    }

    public void stop() {
        this.velocity = Vector2D.ZERO;
        this.angularVelocity = 0.0;
    }

    // Getters and Setters
    public String getId() { return id; }
    public String getOwnerName() { return ownerName; }
    public PenType getPenType() { return penType; }
    public void setPenType(PenType penType) {
        this.penType = penType;
        if (penType != null) {
            this.primaryColor = penType.getPrimaryColor();
            this.accentColor = penType.getAccentColor();
            this.clipColor = penType.getClipColor();
        }
    }
    public Color getPrimaryColor() { return primaryColor; }
    public Color getAccentColor() { return accentColor; }
    public Color getClipColor() { return clipColor != null ? clipColor : accentColor; }
    public Vector2D getPosition() { return position; }
    public void setPosition(Vector2D position) { this.position = position; }
    public Vector2D getVelocity() { return velocity; }
    public void setVelocity(Vector2D velocity) { this.velocity = velocity; }
    public double getAngle() { return angle; }
    public void setAngle(double angle) { this.angle = angle; }
    public double getAngularVelocity() { return angularVelocity; }
    public void setAngularVelocity(double angularVelocity) { this.angularVelocity = angularVelocity; }
    public boolean isOutOfBounds() { return outOfBounds; }
    public void setOutOfBounds(boolean outOfBounds) { this.outOfBounds = outOfBounds; }
    public double getFallProgress() { return fallProgress; }
    public void setFallProgress(double fallProgress) { this.fallProgress = fallProgress; }
    public boolean isFallComplete() { return fallComplete; }
    public void setFallComplete(boolean fallComplete) { this.fallComplete = fallComplete; }
}
