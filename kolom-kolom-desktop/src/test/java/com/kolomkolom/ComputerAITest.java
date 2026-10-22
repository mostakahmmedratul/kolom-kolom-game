package com.kolomkolom;

import com.kolomkolom.ai.AIDifficulty;
import com.kolomkolom.ai.ComputerAI;
import com.kolomkolom.model.Bench;
import com.kolomkolom.model.Pen;
import com.kolomkolom.model.PenType;
import com.kolomkolom.physics.Vector2D;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class ComputerAITest {
    private ComputerAI ai;
    private Bench bench;
    private Pen botPen;
    private Pen humanPen;

    @BeforeEach
    void setUp() {
        ai = new ComputerAI();
        bench = new Bench(80, 70, 1120, 580);
        botPen = new Pen("BOT", "Computer", PenType.BALANCED, null, null, new Vector2D(800, 360), Math.PI);
        humanPen = new Pen("HUMAN", "Player", PenType.BALANCED, null, null, new Vector2D(400, 360), 0.0);
    }

    @Test
    @DisplayName("AI produces non-zero, finite shot vector on all difficulties")
    void testAIGeneratesValidVector() {
        for (AIDifficulty diff : AIDifficulty.values()) {
            Vector2D shot = ai.calculateShot(botPen, humanPen, bench, diff);

            assertNotNull(shot);
            assertFalse(Double.isNaN(shot.x));
            assertFalse(Double.isNaN(shot.y));
            assertFalse(Double.isInfinite(shot.x));
            assertFalse(Double.isInfinite(shot.y));

            assertTrue(shot.length() > 50.0, "AI shot should have meaningful power");
            assertTrue(shot.length() <= diff.getMaxSpeed() * 1.05, "AI shot must respect maximum speed limit");
        }
    }

    @Test
    @DisplayName("AI aims generally towards human opponent pen")
    void testAIAimsTowardsOpponent() {
        Vector2D shot = ai.calculateShot(botPen, humanPen, bench, AIDifficulty.MEDIUM);
        // Human is to the left of bot (x: 400 vs 800), so shot.x should be negative
        assertTrue(shot.x < 0.0, "Shot vector must aim leftwards towards opponent");
    }

    @Test
    @DisplayName("AI returns zero vector if either pen is already out of bounds")
    void testAINoShotWhenOutOfBounds() {
        botPen.setOutOfBounds(true);
        Vector2D shot = ai.calculateShot(botPen, humanPen, bench, AIDifficulty.HARD);
        assertEquals(0.0, shot.length(), 1e-4);
    }
}
