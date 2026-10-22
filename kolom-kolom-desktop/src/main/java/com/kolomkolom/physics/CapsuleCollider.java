package com.kolomkolom.physics;

/**
 * Represents an oriented 2D capsule collider for elongated objects like pens.
 * The capsule is defined by a central line segment between point A and point B,
 * plus a radius around that segment.
 */
public final class CapsuleCollider {
    private final Vector2D a;
    private final Vector2D b;
    private final double radius;

    public CapsuleCollider(Vector2D a, Vector2D b, double radius) {
        this.a = a;
        this.b = b;
        this.radius = radius;
    }

    public Vector2D getA() {
        return a;
    }

    public Vector2D getB() {
        return b;
    }

    public double getRadius() {
        return radius;
    }

    /**
     * Collision result containing contact points, normal, and penetration depth.
     */
    public record ContactInfo(
            boolean colliding,
            Vector2D contactPointA,
            Vector2D contactPointB,
            Vector2D normal, // points from B to A
            double penetration
    ) {}

    /**
     * Computes the collision contact information between this capsule and another capsule.
     */
    public ContactInfo testCollision(CapsuleCollider other) {
        // Find closest points between segment A1-B1 and segment A2-B2
        SegmentDistanceResult result = closestPointsBetweenSegments(this.a, this.b, other.a, other.b);
        Vector2D p1 = result.pointOnFirst;
        Vector2D p2 = result.pointOnSecond;

        double distance = p1.distanceTo(p2);
        double combinedRadius = this.radius + other.radius;

        if (distance < combinedRadius) {
            double penetration = combinedRadius - distance;
            Vector2D normal;
            if (distance > 1e-6) {
                normal = p1.subtract(p2).scale(1.0 / distance);
            } else {
                // Degenerate case: segments intersect or centers coincide
                Vector2D segDir = this.b.subtract(this.a).normalize();
                normal = segDir.perpendicular();
            }
            return new ContactInfo(true, p1, p2, normal, penetration);
        }

        return new ContactInfo(false, null, null, Vector2D.ZERO, 0.0);
    }

    private record SegmentDistanceResult(Vector2D pointOnFirst, Vector2D pointOnSecond) {}

    /**
     * Analytical closest point computation between two line segments S1(s) = P1 + s*D1 and S2(t) = P2 + t*D2
     * for s, t in [0, 1].
     */
    private static SegmentDistanceResult closestPointsBetweenSegments(
            Vector2D p1, Vector2D q1,
            Vector2D p2, Vector2D q2
    ) {
        Vector2D d1 = q1.subtract(p1);
        Vector2D d2 = q2.subtract(p2);
        Vector2D r = p1.subtract(p2);

        double a = d1.dot(d1); // squared length of S1
        double e = d2.dot(d2); // squared length of S2
        double f = d2.dot(r);

        double s;
        double t;

        // Check if both segments degenerate into points
        if (a <= 1e-9 && e <= 1e-9) {
            return new SegmentDistanceResult(p1, p2);
        }

        if (a <= 1e-9) {
            // First segment is a point
            s = 0.0;
            t = Math.clamp(f / e, 0.0, 1.0);
        } else {
            double c = d1.dot(r);
            if (e <= 1e-9) {
                // Second segment is a point
                t = 0.0;
                s = Math.clamp(-c / a, 0.0, 1.0);
            } else {
                // General non-degenerate case
                double b = d1.dot(d2);
                double denom = a * e - b * b;

                if (denom != 0.0) {
                    s = Math.clamp((b * f - c * e) / denom, 0.0, 1.0);
                } else {
                    s = 0.0; // parallel segments
                }

                t = (b * s + f) / e;

                if (t < 0.0) {
                    t = 0.0;
                    s = Math.clamp(-c / a, 0.0, 1.0);
                } else if (t > 1.0) {
                    t = 1.0;
                    s = Math.clamp((b - c) / a, 0.0, 1.0);
                }
            }
        }

        Vector2D c1 = p1.add(d1.scale(s));
        Vector2D c2 = p2.add(d2.scale(t));
        return new SegmentDistanceResult(c1, c2);
    }
}
