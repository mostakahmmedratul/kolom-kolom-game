package com.kolomkolom.manager;

/**
 * Manages match score, target score thresholds, round scoring rules,
 * and duplicate score prevention.
 */
public class ScoreManager {
    private int humanScore;
    private int computerScore;
    private int targetScore;
    private boolean roundScored;

    public ScoreManager(int targetScore) {
        this.targetScore = targetScore;
        this.humanScore = 0;
        this.computerScore = 0;
        this.roundScored = false;
    }

    public void startNewMatch(int targetScore) {
        this.targetScore = targetScore;
        this.humanScore = 0;
        this.computerScore = 0;
        this.roundScored = false;
    }

    public void startNewRound() {
        this.roundScored = false;
    }

    /**
     * Evaluates round outcome when movement settles.
     * Returns true if a point was awarded.
     */
    public boolean evaluateRound(boolean humanOut, boolean computerOut) {
        if (roundScored) {
            return false; // prevent duplicate scoring in the same turn/round
        }

        if (humanOut && computerOut) {
            // Both fell off: the one that fell first or mutual scratch.
            // In school rules, mutual fall is a draw/scratch or both pens reset with no score awarded.
            roundScored = true;
            return false;
        } else if (computerOut) {
            humanScore++;
            roundScored = true;
            return true;
        } else if (humanOut) {
            computerScore++;
            roundScored = true;
            return true;
        }

        return false;
    }

    public boolean isMatchOver() {
        return humanScore >= targetScore || computerScore >= targetScore;
    }

    public boolean isHumanWinner() {
        return humanScore >= targetScore && humanScore > computerScore;
    }

    public boolean isComputerWinner() {
        return computerScore >= targetScore && computerScore > humanScore;
    }

    public int getHumanScore() { return humanScore; }
    public int getComputerScore() { return computerScore; }
    public int getTargetScore() { return targetScore; }
    public void setTargetScore(int targetScore) { this.targetScore = targetScore; }
    public boolean isRoundScored() { return roundScored; }
}
