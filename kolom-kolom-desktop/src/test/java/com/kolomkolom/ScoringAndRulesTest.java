package com.kolomkolom;

import com.kolomkolom.manager.ScoreManager;
import com.kolomkolom.model.Bench;
import com.kolomkolom.model.Pen;
import com.kolomkolom.model.PenType;
import com.kolomkolom.physics.Vector2D;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class ScoringAndRulesTest {
    private Bench bench;
    private ScoreManager scoreManager;

    @BeforeEach
    void setUp() {
        bench = new Bench(100, 100, 800, 500);
        scoreManager = new ScoreManager(10);
    }

    @Test
    @DisplayName("Pen positioned inside bench boundaries is marked in-bounds")
    void testInBoundsDetection() {
        Pen pen = new Pen("PEN", "Player", PenType.BALANCED, null, null, new Vector2D(500, 350), 0.0);
        assertFalse(bench.isPenOutOfBounds(pen), "Pen within playable bounds must not be out of bounds");
    }

    @Test
    @DisplayName("Pen whose center crosses past bench edge is detected out-of-bounds")
    void testOutOfBoundsDetection() {
        // Bench playable right edge is 100 + 800 - 24 = 876
        Pen penOutside = new Pen("PEN_OUT", "Player", PenType.BALANCED, null, null, new Vector2D(920, 350), 0.0);
        assertTrue(bench.isPenOutOfBounds(penOutside), "Pen crossing outside desk edge must be marked out of bounds");
    }

    @Test
    @DisplayName("Knocking opponent pen off desk awards one point to human")
    void testHumanScoresPoint() {
        boolean pointAwarded = scoreManager.evaluateRound(false, true);

        assertTrue(pointAwarded);
        assertEquals(1, scoreManager.getHumanScore());
        assertEquals(0, scoreManager.getComputerScore());
    }

    @Test
    @DisplayName("Human pen falling off desk awards one point to computer")
    void testComputerScoresPoint() {
        boolean pointAwarded = scoreManager.evaluateRound(true, false);

        assertTrue(pointAwarded);
        assertEquals(0, scoreManager.getHumanScore());
        assertEquals(1, scoreManager.getComputerScore());
    }

    @Test
    @DisplayName("Duplicate scoring in the same turn/round is strictly prevented")
    void testDuplicateScorePrevention() {
        scoreManager.evaluateRound(false, true);
        assertEquals(1, scoreManager.getHumanScore());

        // Repeated evaluate call in same round must return false and not increment score
        boolean duplicateAwarded = scoreManager.evaluateRound(false, true);
        assertFalse(duplicateAwarded, "Subsequent calls in the same round must not award duplicate points");
        assertEquals(1, scoreManager.getHumanScore());
    }

    @Test
    @DisplayName("Match victory triggered when target score is achieved")
    void testMatchVictoryCondition() {
        scoreManager.startNewMatch(3);

        for (int i = 0; i < 3; i++) {
            scoreManager.startNewRound();
            scoreManager.evaluateRound(false, true);
        }

        assertTrue(scoreManager.isMatchOver());
        assertTrue(scoreManager.isHumanWinner());
        assertFalse(scoreManager.isComputerWinner());
    }
}
