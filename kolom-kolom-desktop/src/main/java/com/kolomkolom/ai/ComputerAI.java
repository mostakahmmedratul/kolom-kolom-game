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

    /**
     * Calculates the impulse vector the computer should apply to its pen.
     */
    public Vector2D calculateShot(Pen botPen, Pen humanPen, Bench bench, AIDifficulty difficulty) {
        if (botPen.isOutOfBounds() || humanPen.isOutOfBounds()) {
            return Vector2D.ZERO;
        }

        Vector2D botPos = botPen.getPosition();
        Vector2D humanPos = humanPen.getPosition();

        return switch (difficulty) {
            case EASY -> calculateEasyShot(botPos, humanPos, difficulty);
            case MEDIUM -> calculateMediumShot(botPos, humanPos, humanPen, bench, difficulty);
            case HARD -> calculateHardShot(botPen, humanPen, bench, difficulty);
        };
    }

    private Vector2D calculateEasyShot(Vector2D botPos, Vector2D humanPos, AIDifficulty difficulty) {
        // Simple direct line with notable human-like angle inaccuracy
        Vector2D toHuman = humanPos.subtract(botPos);
        double dist = toHuman.length();
        if (dist < 1.0) dist = 1.0;

        double baseAngle = Math.atan2(toHuman.y, toHuman.x);
        double error = (random.nextDouble() * 2.0 - 1.0) * difficulty.getAimErrorVariance();
        double finalAngle = baseAngle + error;

        // Moderate power scaled with distance
        double power = Math.clamp(dist * 2.2 + 200.0, 250.0, difficulty.getMaxSpeed());
        return new Vector2D(Math.cos(finalAngle), Math.sin(finalAngle)).scale(power);
    }

    private Vector2D calculateMediumShot(Vector2D botPos, Vector2D humanPos, Pen humanPen, Bench bench, AIDifficulty difficulty) {
        // Find closest edge for opponent
        Vector2D closestEdgeNormal = getVectorTowardsNearestEdge(humanPos, bench);

        // Aim slightly behind the human pen to knock them in the direction of the closest edge
        Vector2D idealStrikePoint = humanPos.subtract(closestEdgeNormal.scale(12.0));
        Vector2D toTarget = idealStrikePoint.subtract(botPos);
        double dist = toTarget.length();

        double baseAngle = Math.atan2(toTarget.y, toTarget.x);
        double error = (random.nextDouble() * 2.0 - 1.0) * difficulty.getAimErrorVariance();
        double finalAngle = baseAngle + error;

        double power = Math.clamp(dist * 2.5 + 280.0, 320.0, difficulty.getMaxSpeed());
        return new Vector2D(Math.cos(finalAngle), Math.sin(finalAngle)).scale(power);
    }

    private Vector2D calculateHardShot(Pen botPen, Pen humanPen, Bench bench, AIDifficulty difficulty) {
        // Multi-candidate trajectory simulation
        Vector2D botPos = botPen.getPosition();
        Vector2D humanPos = humanPen.getPosition();

        // 3 target points on human pen: Center, Tip, Base
        Vector2D humanDir = humanPen.getDirection();
        double halfLen = humanPen.getPenType().getStats().length() * 0.4;
        Vector2D[] targets = new Vector2D[] {
                humanPos,
                humanPos.add(humanDir.scale(halfLen)),
                humanPos.subtract(humanDir.scale(halfLen))
        };

        Vector2D bestShot = null;
        double bestScore = Double.NEGATIVE_INFINITY;

        double[] powerFractions = { 0.65, 0.85, 1.0 };

        for (Vector2D target : targets) {
            Vector2D toTarget = target.subtract(botPos);
            double dist = toTarget.length();
            if (dist < 1.0) continue;
            Vector2D dir = toTarget.normalize();
            double baseAngle = Math.atan2(dir.y, dir.x);

            // Sweep small angle offsets around line of sight
            for (double angleOffset : new double[] { -0.08, -0.04, 0.0, 0.04, 0.08 }) {
                double shotAngle = baseAngle + angleOffset;
                Vector2D shotDir = new Vector2D(Math.cos(shotAngle), Math.sin(shotAngle));

                for (double pFrac : powerFractions) {
                    double speed = Math.clamp(dist * 2.8 + 260.0, 350.0, difficulty.getMaxSpeed()) * pFrac;
                    Vector2D candidateImpulse = shotDir.scale(speed);

                    double score = evaluateCandidateShot(candidateImpulse, botPen, humanPen, bench);
                    if (score > bestScore) {
                        bestScore = score;
                        bestShot = candidateImpulse;
                    }
                }
            }
        }

        if (bestShot == null) {
            return calculateMediumShot(botPos, humanPos, humanPen, bench, difficulty);
        }

        // Tiny realistic jitter even on hard
        double tinyJitter = (random.nextDouble() * 2.0 - 1.0) * difficulty.getAimErrorVariance();
        return bestShot.rotate(tinyJitter);
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
