package com.kolomkolom.ai;

import com.kolomkolom.model.Bench;
import com.kolomkolom.model.Pen;
import com.kolomkolom.physics.CollisionHandler;
import com.kolomkolom.physics.Vector2D;

import java.util.Random;

/**
 * Intelligent rule-based Computer Opponent AI that calculates strategic shots
 * based on geometric line-of-sight, edge leverage, and lightweight trajectory evaluation.
 */
public class ComputerAI {
    private final Random random = new Random();

    public record ShotDecision(Vector2D impulse, String flickPart) {}

    /**
     * Calculates the impulse vector the computer should apply to its pen.
     */
    public Vector2D calculateShot(Pen botPen, Pen humanPen, Bench bench, AIDifficulty difficulty) {
        return decideShot(botPen, humanPen, bench, difficulty).impulse();
    }

    /**
     * Calculates the strategic impulse vector AND the contact flick part on its own pen.
     */
    public ShotDecision decideShot(Pen botPen, Pen humanPen, Bench bench, AIDifficulty difficulty) {
        if (botPen.isOutOfBounds() || humanPen.isOutOfBounds()) {
            return new ShotDecision(Vector2D.ZERO, "CENTER");
        }

        Vector2D botPos = botPen.getPosition();
        Vector2D humanPos = humanPen.getPosition();

        return switch (difficulty) {
            case EASY -> calculateEasyDecision(botPos, humanPos, difficulty);
            case MEDIUM -> calculateMediumDecision(botPos, humanPos, humanPen, bench, difficulty);
            case HARD -> calculateHardDecision(botPen, humanPen, bench, difficulty);
        };
    }

    private ShotDecision calculateEasyDecision(Vector2D botPos, Vector2D humanPos, AIDifficulty difficulty) {
        String flickPart = random.nextBoolean() ? "TIP" : "CENTER";
        Vector2D toHuman = humanPos.subtract(botPos);
        double dist = toHuman.length();
        if (dist < 1.0) dist = 1.0;

        double baseAngle = Math.atan2(toHuman.y, toHuman.x);
        double error = (random.nextDouble() * 2.0 - 1.0) * difficulty.getAimErrorVariance();
        double finalAngle = baseAngle + error;

        double power = Math.clamp(dist * 2.2 + 200.0, 250.0, difficulty.getMaxSpeed());
        return new ShotDecision(new Vector2D(Math.cos(finalAngle), Math.sin(finalAngle)).scale(power), flickPart);
    }

    private ShotDecision calculateMediumDecision(Vector2D botPos, Vector2D humanPos, Pen humanPen, Bench bench, AIDifficulty difficulty) {
        Vector2D closestEdgeNormal = getVectorTowardsNearestEdge(humanPos, bench);
        double distToHuman = humanPos.distanceTo(botPos);

        String flickPart = "CENTER";
        if (distToHuman < 220.0) {
            flickPart = random.nextDouble() > 0.4 ? "TIP" : "CENTER";
        }

        Vector2D idealStrikePoint = humanPos.subtract(closestEdgeNormal.scale(12.0));
        Vector2D toTarget = idealStrikePoint.subtract(botPos);
        double dist = toTarget.length();

        double baseAngle = Math.atan2(toTarget.y, toTarget.x);
        double error = (random.nextDouble() * 2.0 - 1.0) * difficulty.getAimErrorVariance();
        double finalAngle = baseAngle + error;

        double power = Math.clamp(dist * 2.5 + 280.0, 320.0, difficulty.getMaxSpeed());
        return new ShotDecision(new Vector2D(Math.cos(finalAngle), Math.sin(finalAngle)).scale(power), flickPart);
    }

    private ShotDecision calculateHardDecision(Pen botPen, Pen humanPen, Bench bench, AIDifficulty difficulty) {
        Vector2D botPos = botPen.getPosition();
        Vector2D humanPos = humanPen.getPosition();
        Vector2D toOpponent = humanPos.subtract(botPos);
        double dist = toOpponent.length();
        double baseAngle = Math.atan2(toOpponent.y, toOpponent.x);

        String[] candidateParts = new String[] { "CENTER", "TIP", "CAP" };
        Vector2D bestShot = null;
        String bestPart = "CENTER";
        double bestScore = Double.NEGATIVE_INFINITY;

        double[] powerFractions = { 0.75, 0.9, 1.0 };

        for (String fPart : candidateParts) {
            for (double angleOffset : new double[] { -0.08, -0.04, 0.0, 0.04, 0.08 }) {
                double shotAngle = baseAngle + angleOffset;
                Vector2D shotDir = new Vector2D(Math.cos(shotAngle), Math.sin(shotAngle));

                for (double pFrac : powerFractions) {
                    double speed = Math.clamp(dist * 2.8 + 260.0, 350.0, difficulty.getMaxSpeed()) * pFrac;
                    Vector2D candidateImpulse = shotDir.scale(speed);

                    double score = evaluateCandidateShot(candidateImpulse, fPart, botPen, humanPen, bench);
                    if (score > bestScore) {
                        bestScore = score;
                        bestShot = candidateImpulse;
                        bestPart = fPart;
                    }
                }
            }
        }

        if (bestShot == null) {
            return calculateMediumDecision(botPos, humanPos, humanPen, bench, difficulty);
        }

        double tinyJitter = (random.nextDouble() * 2.0 - 1.0) * difficulty.getAimErrorVariance();
        return new ShotDecision(bestShot.rotate(tinyJitter), bestPart);
    }

    private double evaluateCandidateShot(Vector2D impulse, String flickPart, Pen realBot, Pen realHuman, Bench bench) {
        Pen simBot = new Pen("BOT", "BOT", realBot.getPenType(), null, null, realBot.getPosition(), realBot.getAngle());
        Pen simHuman = new Pen("HUMAN", "HUMAN", realHuman.getPenType(), null, null, realHuman.getPosition(), realHuman.getAngle());

        simBot.applyFlickImpulse(impulse, flickPart);
        double dt = 1.0 / 60.0;
        int steps = 24;

        for (int i = 0; i < steps; i++) {
            simBot.setPosition(simBot.getPosition().add(simBot.getVelocity().scale(dt)));
            simBot.setVelocity(simBot.getVelocity().scale(0.97));

            simHuman.setPosition(simHuman.getPosition().add(simHuman.getVelocity().scale(dt)));
            simHuman.setVelocity(simHuman.getVelocity().scale(0.97));

            CollisionHandler.resolveCollision(simBot, simHuman);

            if (bench.isPenOutOfBounds(simHuman)) {
                if (!bench.isPenOutOfBounds(simBot)) {
                    return 1000.0 - i * 5.0;
                }
            }

            if (bench.isPenOutOfBounds(simBot)) {
                return -500.0;
            }
        }

        double humanDist = getDistanceToNearestEdge(simHuman.getPosition(), bench);
        double botDist = getDistanceToNearestEdge(simBot.getPosition(), bench);
        return (220.0 - humanDist) * 1.5 + botDist * 0.5;
    }

    /**
     * Fast forward simulation of candidate shot to evaluate impact outcome.
     */
    private double evaluateCandidateShot(Vector2D impulse, Pen realBot, Pen realHuman, Bench bench) {
        // Clone state
        Pen simBot = new Pen("SIM_BOT", "BOT", realBot.getPenType(), null, null, realBot.getPosition(), realBot.getAngle());
        Pen simHuman = new Pen("SIM_HUMAN", "HUMAN", realHuman.getPenType(), null, null, realHuman.getPosition(), realHuman.getAngle());

        simBot.applyDirectImpulse(impulse);

        double dt = 1.0 / 60.0;
        int steps = 24; // evaluate first ~0.4s of trajectory

        for (int i = 0; i < steps; i++) {
            // Step bot
            simBot.setPosition(simBot.getPosition().add(simBot.getVelocity().scale(dt)));
            simBot.setVelocity(simBot.getVelocity().scale(0.97));

            // Step human
            simHuman.setPosition(simHuman.getPosition().add(simHuman.getVelocity().scale(dt)));
            simHuman.setVelocity(simHuman.getVelocity().scale(0.97));

            // Collision check
            CollisionHandler.resolveCollision(simBot, simHuman);

            if (bench.isPenOutOfBounds(simHuman)) {
                // If this shot knocks opponent off table without bot falling, enormous bonus!
                if (!bench.isPenOutOfBounds(simBot)) {
                    return 1000.0 - i * 5.0; // earlier knock-off is cleaner
                }
            }

            if (bench.isPenOutOfBounds(simBot)) {
                // Self-inflicted fall off bench is penalized severely
                return -500.0;
            }
        }

        // Scoring heuristic:
        // Reward bringing opponent closer to bench edge
        double humanDistToEdge = getDistanceToNearestEdge(simHuman.getPosition(), bench);
        double botDistToEdge = getDistanceToNearestEdge(simBot.getPosition(), bench);

        // Lower opponent distance to edge = better (+), higher bot safety = better (+)
        return (200.0 - humanDistToEdge) * 1.5 + botDistToEdge * 0.5;
    }

    private Vector2D getVectorTowardsNearestEdge(Vector2D pos, Bench bench) {
        double dLeft = Math.abs(pos.x - bench.getPlayableLeft());
        double dRight = Math.abs(bench.getPlayableRight() - pos.x);
        double dTop = Math.abs(pos.y - bench.getPlayableTop());
        double dBottom = Math.abs(bench.getPlayableBottom() - pos.y);

        double min = Math.min(Math.min(dLeft, dRight), Math.min(dTop, dBottom));
        if (min == dLeft) return new Vector2D(-1.0, 0.0);
        if (min == dRight) return new Vector2D(1.0, 0.0);
        if (min == dTop) return new Vector2D(0.0, -1.0);
        return new Vector2D(0.0, 1.0);
    }

    private double getDistanceToNearestEdge(Vector2D pos, Bench bench) {
        double dLeft = Math.abs(pos.x - bench.getPlayableLeft());
        double dRight = Math.abs(bench.getPlayableRight() - pos.x);
        double dTop = Math.abs(pos.y - bench.getPlayableTop());
        double dBottom = Math.abs(bench.getPlayableBottom() - pos.y);
        return Math.min(Math.min(dLeft, dRight), Math.min(dTop, dBottom));
    }
}
