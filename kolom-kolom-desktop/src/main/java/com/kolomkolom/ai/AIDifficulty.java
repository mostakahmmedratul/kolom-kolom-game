package com.kolomkolom.ai;

/**
 * Difficulty levels for the schoolyard AI opponent.
 */
public enum AIDifficulty {
    EASY("School Novice", "Makes occasional aiming mistakes and shoots with relaxed power.", 0.28, 480.0),
    MEDIUM("Desk Champion", "Aims reliably towards nearest table edges with controlled power.", 0.12, 650.0),
    HARD("Classroom Legend", "Simulates multiple angles, targets critical leverage points, and avoids self-inflicted falls.", 0.03, 800.0);

    private final String title;
    private final String description;
    private final double aimErrorVariance; // In radians
    private final double maxSpeed;

    AIDifficulty(String title, String description, double aimErrorVariance, double maxSpeed) {
        this.title = title;
        this.description = description;
        this.aimErrorVariance = aimErrorVariance;
        this.maxSpeed = maxSpeed;
    }

    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public double getAimErrorVariance() { return aimErrorVariance; }
    public double getMaxSpeed() { return maxSpeed; }
}
