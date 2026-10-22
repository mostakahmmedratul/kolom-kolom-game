package com.kolomkolom.model;

import com.kolomkolom.physics.Vector2D;

/**
 * Defines the school bench dimensions, playable boundaries, and table-edge detection rules.
 */
public class Bench {
    private final double x;
    private final double y;
    private final double width;
    private final double height;
    private final double bevelMargin;

    public Bench(double x, double y, double width, double height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.bevelMargin = 24.0;
    }

    public double getX() { return x; }
    public double getY() { return y; }
    public double getWidth() { return width; }
    public double getHeight() { return height; }
    public double getBevelMargin() { return bevelMargin; }

    public double getPlayableLeft() { return x + bevelMargin; }
    public double getPlayableRight() { return x + width - bevelMargin; }
    public double getPlayableTop() { return y + bevelMargin; }
    public double getPlayableBottom() { return y + height - bevelMargin; }

    /**
     * Checks if a pen's center of mass or either endpoint has tipped past the table edge.
     * In traditional Kolom Kolom, if the center of gravity crosses the edge of the school desk,
     * the pen loses balance and tumbles to the classroom floor.
     */
    public boolean isPenOutOfBounds(Pen pen) {
        Vector2D pos = pen.getPosition();
        double pLeft = getPlayableLeft();
        double pRight = getPlayableRight();
        double pTop = getPlayableTop();
        double pBottom = getPlayableBottom();

        // If center of mass exceeds table edge, pen falls off
        if (pos.x < pLeft || pos.x > pRight || pos.y < pTop || pos.y > pBottom) {
            return true;
        }

        // Also check if both endpoints have tipped over any single edge
        var collider = pen.getCollider();
        Vector2D a = collider.getA();
        Vector2D b = collider.getB();

        // If more than 50% of the body hangs over an edge
        boolean tipLeft = (a.x < pLeft && b.x < pLeft);
        boolean tipRight = (a.x > pRight && b.x > pRight);
        boolean tipTop = (a.y < pTop && b.y < pTop);
        boolean tipBottom = (a.y > pBottom && b.y > pBottom);

        return tipLeft || tipRight || tipTop || tipBottom;
    }
}
