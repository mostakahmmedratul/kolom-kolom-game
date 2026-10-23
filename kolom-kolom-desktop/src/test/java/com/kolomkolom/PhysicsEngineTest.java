package com.kolomkolom;

import com.kolomkolom.model.Bench;
import com.kolomkolom.model.Pen;
import com.kolomkolom.model.PenType;
import com.kolomkolom.physics.CollisionHandler;
import com.kolomkolom.physics.PhysicsEngine;
import com.kolomkolom.physics.Vector2D;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class PhysicsEngineTest {
    private PhysicsEngine physicsEngine;
    private Bench bench;
    private Pen penA;
    private Pen penB;

    @BeforeEach
    void setUp() {
        physicsEngine = new PhysicsEngine();
        bench = new Bench(50, 50, 900, 500);
        penA = new Pen("PEN_A", "Player 1", PenType.BALANCED, null, null, new Vector2D(300, 300), 0.0);
        penB = new Pen("PEN_B", "Player 2", PenType.BALANCED, null, null, new Vector2D(450, 300), Math.PI);
    }

    @Test
    @DisplayName("Applying impulse changes velocity according to mass")
    void testImpulseApplication() {
        Vector2D impulse = new Vector2D(100.0, 0.0);
        double mass = penA.getPenType().getStats().mass();
        double mult = penA.getPenType().getStats().impulseMultiplier();

        penA.applyDirectImpulse(impulse);

        assertEquals(impulse.x * (mult / mass), penA.getVelocity().x, 1e-4);
        assertEquals(0.0, penA.getVelocity().y, 1e-4);
    }

    @Test
    @DisplayName("Surface friction causes linear velocity to decay towards rest")
    void testFrictionAndDamping() {
        penA.applyDirectImpulse(new Vector2D(300.0, 0.0));
        double initialSpeed = penA.getVelocity().length();

        // Step simulation forward by 0.5 seconds
        physicsEngine.update(List.of(penA), bench, 0.5);

        double decayedSpeed = penA.getVelocity().length();
        assertTrue(decayedSpeed < initialSpeed, "Velocity must decrease due to friction damping");
        assertFalse(Double.isNaN(decayedSpeed));
    }

    @Test
    @DisplayName("Off-center contact generates rotational angular velocity")
    void testOffCenterImpulseTorque() {
        Vector2D impulse = new Vector2D(0.0, 50.0);
        // Contact point at tip (offset by half length along x axis)
        Vector2D contactPoint = penA.getPosition().add(new Vector2D(50.0, 0.0));

        penA.applyImpulse(impulse, contactPoint);

        assertTrue(Math.abs(penA.getAngularVelocity()) > 0.01, "Off-center impact must produce angular rotation");
    }

    @Test
    @DisplayName("Tip strike generates significantly higher spin torque than center strike")
    void testTipVersusCenterStrikeTorque() {
        Pen centerHitPen = new Pen("C", "Center", PenType.BALANCED, null, null, new Vector2D(300, 300), 0.0);
        Pen tipHitPen = new Pen("T", "Tip", PenType.BALANCED, null, null, new Vector2D(300, 300), 0.0);

        Vector2D impulse = new Vector2D(0.0, 40.0);
        centerHitPen.applyImpulse(impulse, centerHitPen.getStrikePoint("CENTER"));
        tipHitPen.applyImpulse(impulse, tipHitPen.getStrikePoint("TIP"));

        assertEquals(0.0, centerHitPen.getAngularVelocity(), 1e-4, "Direct center strike produces zero torque");
        assertTrue(Math.abs(tipHitPen.getAngularVelocity()) > 0.1, "Tip strike produces substantial angular spin");
    }

    @Test
    @DisplayName("Pen collision transfers momentum and prevents overlap")
    void testPenCollisionMomentumTransfer() {
        // Place pen A moving right directly into stationary pen B
        penA.setPosition(new Vector2D(400, 300));
        penB.setPosition(new Vector2D(440, 300));
        penA.setVelocity(new Vector2D(200.0, 0.0));
        penB.setVelocity(Vector2D.ZERO);

        boolean collisionResolved = CollisionHandler.resolveCollision(penA, penB);

        assertTrue(collisionResolved, "Collision should be detected and resolved between overlapping pens");
        assertTrue(penB.getVelocity().x > 10.0, "Stationary pen B must gain forward velocity after being struck");
        assertTrue(penA.getVelocity().x < 200.0, "Striking pen A must lose forward velocity after impact");
    }

    @Test
    @DisplayName("Heavy pen transfers more momentum than lighter pen")
    void testPenMassImpactComparison() {
        Pen heavyPen = new Pen("HEAVY", "Heavy", PenType.HEAVY, null, null, new Vector2D(400, 300), 0.0);
        Pen target1 = new Pen("T1", "Target 1", PenType.BALANCED, null, null, new Vector2D(440, 300), 0.0);

        Pen lightPen = new Pen("LIGHT", "Light", PenType.RUBBER_GRIP, null, null, new Vector2D(400, 300), 0.0);
        Pen target2 = new Pen("T2", "Target 2", PenType.BALANCED, null, null, new Vector2D(440, 300), 0.0);

        heavyPen.setVelocity(new Vector2D(150.0, 0.0));
        lightPen.setVelocity(new Vector2D(150.0, 0.0));

        CollisionHandler.resolveCollision(heavyPen, target1);
        CollisionHandler.resolveCollision(lightPen, target2);

        assertTrue(target1.getVelocity().x > target2.getVelocity().x,
                "Target struck by heavy pen should receive higher momentum than target struck by light pen");
    }

    @Test
    @DisplayName("Own-pen flick on TIP generates whirlwind spin, while CENTER provides pure forward slide")
    void testOwnPenFlickImpulseMechanics() {
        Pen tipPen = new Pen("TIP_PEN", "P1", PenType.BALANCED, null, null, new Vector2D(300, 300), 0.0);
        Pen centerPen = new Pen("CENTER_PEN", "P1", PenType.BALANCED, null, null, new Vector2D(300, 300), 0.0);
        Pen capPen = new Pen("CAP_PEN", "P1", PenType.BALANCED, null, null, new Vector2D(300, 300), 0.0);

        Vector2D impulse = new Vector2D(200.0, 50.0);

        tipPen.applyFlickImpulse(impulse, "TIP");
        centerPen.applyFlickImpulse(impulse, "CENTER");
        capPen.applyFlickImpulse(impulse, "CAP");

        // Tip generates strong positive angular torque
        assertTrue(Math.abs(tipPen.getAngularVelocity()) > 0.1, "Tip flick must induce high angular spin");

        // Cap generates reverse angular torque
        assertTrue(Math.signum(tipPen.getAngularVelocity()) != Math.signum(capPen.getAngularVelocity()) || Math.abs(capPen.getAngularVelocity()) > 0.1,
                "Cap flick must apply counter-lever torque");

        // Center generates pure linear momentum with higher linear velocity than tip
        assertTrue(centerPen.getVelocity().length() >= tipPen.getVelocity().length(),
                "Center flick must transfer maximum linear propulsion");
    }
}
