package com.kolomkolom.physics;

import java.util.Objects;

/**
 * Immutable 2D mathematical vector providing standard geometric and physics operations.
 */
public final class Vector2D {
    public static final Vector2D ZERO = new Vector2D(0.0, 0.0);

    public final double x;
    public final double y;

    public Vector2D(double x, double y) {
        this.x = x;
        this.y = y;
    }

    public Vector2D add(Vector2D other) {
        return new Vector2D(this.x + other.x, this.y + other.y);
    }

    public Vector2D add(double dx, double dy) {
        return new Vector2D(this.x + dx, this.y + dy);
    }

    public Vector2D subtract(Vector2D other) {
        return new Vector2D(this.x - other.x, this.y - other.y);
    }

    public Vector2D scale(double scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    public double dot(Vector2D other) {
        return this.x * other.x + this.y * other.y;
    }

    public double cross(Vector2D other) {
        return this.x * other.y - this.y * other.x;
    }

    public double lengthSquared() {
        return x * x + y * y;
    }

    public double length() {
        return Math.sqrt(x * x + y * y);
    }

    public Vector2D normalize() {
        double len = length();
        if (len < 1e-9) {
            return ZERO;
        }
        return new Vector2D(x / len, y / len);
    }

    public double distanceTo(Vector2D other) {
        double dx = this.x - other.x;
        double dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public Vector2D perpendicular() {
        return new Vector2D(-y, x);
    }

    public Vector2D rotate(double radians) {
        double cos = Math.cos(radians);
        double sin = Math.sin(radians);
        return new Vector2D(x * cos - y * sin, x * sin + y * cos);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Vector2D vector2D)) return false;
        return Double.compare(vector2D.x, x) == 0 && Double.compare(vector2D.y, y) == 0;
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y);
    }

    @Override
    public String toString() {
        return String.format("Vector2D(%.2f, %.2f)", x, y);
    }
}
