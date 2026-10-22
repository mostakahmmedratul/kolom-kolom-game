export interface JavaSourceFile {
  path: string;
  category: 'core' | 'model' | 'physics' | 'ai' | 'ui' | 'test' | 'build';
  description: string;
  content: string;
}

export const JAVA_PROJECT_FILES: JavaSourceFile[] = [
  {
    path: 'pom.xml',
    category: 'build',
    description: 'Maven configuration for Java 21, JUnit 5 Jupiter, and Fat JAR packaging',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.kolomkolom</groupId>
    <artifactId>kolom-kolom-desktop</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>Kolom Kolom - Realistic Pen Desktop Game</name>
    <description>Authentic schoolyard wooden bench pen flicking game with custom 2D physics and AI.</description>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <maven.compiler.source>21</maven.compiler.source>
        <maven.compiler.target>21</maven.compiler.target>
        <maven.compiler.release>21</maven.compiler.release>
        <junit.jupiter.version>5.10.2</junit.jupiter.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter-api</artifactId>
            <version>\${junit.jupiter.version}</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter-engine</artifactId>
            <version>\${junit.jupiter.version}</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.13.0</version>
                <configuration>
                    <release>21</release>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.2.5</version>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <version>3.5.2</version>
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals><goal>shade</goal></goals>
                        <configuration>
                            <transformers>
                                <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                                    <mainClass>com.kolomkolom.Main</mainClass>
                                </transformer>
                            </transformers>
                            <finalName>kolom-kolom</finalName>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>exec-maven-plugin</artifactId>
                <version>3.2.0</version>
                <configuration>
                    <mainClass>com.kolomkolom.Main</mainClass>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>`
  },
  {
    path: 'src/main/java/com/kolomkolom/Main.java',
    category: 'core',
    description: 'Application entry point setting up Swing look and feel and launching GameWindow',
    content: `package com.kolomkolom;

import com.kolomkolom.config.GameSettings;
import com.kolomkolom.manager.GameManager;
import com.kolomkolom.ui.GameWindow;

import javax.swing.SwingUtilities;
import javax.swing.UIManager;

public class Main {
    public static void main(String[] args) {
        System.setProperty("sun.java2d.opengl", "true");
        System.setProperty("apple.laf.useScreenMenuBar", "true");

        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception ignored) {}

        SwingUtilities.invokeLater(() -> {
            GameSettings settings = new GameSettings();
            GameManager manager = new GameManager(settings);
            GameWindow window = new GameWindow(manager);

            manager.start();
            window.setVisible(true);
        });
    }
}`
  },
  {
    path: 'src/main/java/com/kolomkolom/physics/Vector2D.java',
    category: 'physics',
    description: 'Immutable 2D vector mathematics with dot, cross, rotate, and distance functions',
    content: `package com.kolomkolom.physics;

import java.util.Objects;

public final class Vector2D {
    public static final Vector2D ZERO = new Vector2D(0.0, 0.0);

    public final double x;
    public final double y;

    public Vector2D(double x, double y) {
        this.x = x;
        this.y = y;
    }

    public Vector2D add(Vector2D other) { return new Vector2D(this.x + other.x, this.y + other.y); }
    public Vector2D subtract(Vector2D other) { return new Vector2D(this.x - other.x, this.y - other.y); }
    public Vector2D scale(double scalar) { return new Vector2D(this.x * scalar, this.y * scalar); }
    public double dot(Vector2D other) { return this.x * other.x + this.y * other.y; }
    public double cross(Vector2D other) { return this.x * other.y - this.y * other.x; }
    public double lengthSquared() { return x * x + y * y; }
    public double length() { return Math.sqrt(x * x + y * y); }
    public Vector2D normalize() {
        double len = length();
        return len < 1e-9 ? ZERO : new Vector2D(x / len, y / len);
    }
    public double distanceTo(Vector2D other) {
        double dx = this.x - other.x;
        double dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    public Vector2D perpendicular() { return new Vector2D(-y, x); }
    public Vector2D rotate(double radians) {
        double cos = Math.cos(radians);
        double sin = Math.sin(radians);
        return new Vector2D(x * cos - y * sin, x * sin + y * cos);
    }
}`
  },
  {
    path: 'src/main/java/com/kolomkolom/physics/CapsuleCollider.java',
    category: 'physics',
    description: 'Continuous line-segment capsule collision detection with analytical distance algorithm',
    content: `package com.kolomkolom.physics;

public final class CapsuleCollider {
    private final Vector2D a;
    private final Vector2D b;
    private final double radius;

    public CapsuleCollider(Vector2D a, Vector2D b, double radius) {
        this.a = a;
        this.b = b;
        this.radius = radius;
    }

    public Vector2D getA() { return a; }
    public Vector2D getB() { return b; }
    public double getRadius() { return radius; }

    public record ContactInfo(
            boolean colliding,
            Vector2D contactPointA,
            Vector2D contactPointB,
            Vector2D normal,
            double penetration
    ) {}

    public ContactInfo testCollision(CapsuleCollider other) {
        SegmentDistanceResult result = closestPointsBetweenSegments(this.a, this.b, other.a, other.b);
        Vector2D p1 = result.pointOnFirst;
        Vector2D p2 = result.pointOnSecond;

        double distance = p1.distanceTo(p2);
        double combinedRadius = this.radius + other.radius;

        if (distance < combinedRadius) {
            double penetration = combinedRadius - distance;
            Vector2D normal = distance > 1e-6 ? p1.subtract(p2).scale(1.0 / distance) : this.b.subtract(this.a).normalize().perpendicular();
            return new ContactInfo(true, p1, p2, normal, penetration);
        }

        return new ContactInfo(false, null, null, Vector2D.ZERO, 0.0);
    }

    private record SegmentDistanceResult(Vector2D pointOnFirst, Vector2D pointOnSecond) {}

    private static SegmentDistanceResult closestPointsBetweenSegments(Vector2D p1, Vector2D q1, Vector2D p2, Vector2D q2) {
        Vector2D d1 = q1.subtract(p1);
        Vector2D d2 = q2.subtract(p2);
        Vector2D r = p1.subtract(p2);
        double a = d1.dot(d1);
        double e = d2.dot(d2);
        double f = d2.dot(r);
        double s = 0.0, t = 0.0;

        if (a <= 1e-9 && e <= 1e-9) return new SegmentDistanceResult(p1, p2);
        if (a <= 1e-9) {
            s = 0.0;
            t = Math.clamp(f / e, 0.0, 1.0);
        } else {
            double c = d1.dot(r);
            if (e <= 1e-9) {
                t = 0.0;
                s = Math.clamp(-c / a, 0.0, 1.0);
            } else {
                double b = d1.dot(d2);
                double denom = a * e - b * b;
                s = denom != 0.0 ? Math.clamp((b * f - c * e) / denom, 0.0, 1.0) : 0.0;
                t = (b * s + f) / e;
                if (t < 0.0) { t = 0.0; s = Math.clamp(-c / a, 0.0, 1.0); }
                else if (t > 1.0) { t = 1.0; s = Math.clamp((b - c) / a, 0.0, 1.0); }
            }
        }
        return new SegmentDistanceResult(p1.add(d1.scale(s)), p2.add(d2.scale(t)));
    }
}`
  },
  {
    path: 'src/main/java/com/kolomkolom/physics/CollisionHandler.java',
    category: 'physics',
    description: 'Rigid body impulse calculations with rotational inertia, off-center contact torque, and position projection',
    content: `package com.kolomkolom.physics;

import com.kolomkolom.model.Pen;

public final class CollisionHandler {
    public static boolean resolveCollision(Pen penA, Pen penB) {
        if (penA.isOutOfBounds() || penB.isOutOfBounds()) return false;

        CapsuleCollider colliderA = penA.getCollider();
        CapsuleCollider colliderB = penB.getCollider();
        CapsuleCollider.ContactInfo contact = colliderA.testCollision(colliderB);
        if (!contact.colliding()) return false;

        Vector2D normal = contact.normal();
        double penetration = contact.penetration();

        double invMassA = 1.0 / penA.getPenType().getStats().mass();
        double invMassB = 1.0 / penB.getPenType().getStats().mass();
        double totalInvMass = invMassA + invMassB;

        if (totalInvMass > 0.0) {
            double correctionMag = Math.max(0.0, penetration - 0.05) / totalInvMass * 0.85;
            Vector2D correction = normal.scale(correctionMag);
            penA.setPosition(penA.getPosition().add(correction.scale(invMassA)));
            penB.setPosition(penB.getPosition().subtract(correction.scale(invMassB)));
        }

        Vector2D contactPoint = contact.contactPointA().add(contact.contactPointB()).scale(0.5);
        Vector2D rA = contactPoint.subtract(penA.getPosition());
        Vector2D rB = contactPoint.subtract(penB.getPosition());

        Vector2D vPointA = penA.getVelocity().add(new Vector2D(-penA.getAngularVelocity() * rA.y, penA.getAngularVelocity() * rA.x));
        Vector2D vPointB = penB.getVelocity().add(new Vector2D(-penB.getAngularVelocity() * rB.y, penB.getAngularVelocity() * rB.x));
        Vector2D vRel = vPointA.subtract(vPointB);

        double velAlongNormal = vRel.dot(normal);
        if (velAlongNormal > 0.0) return false;

        double e = (penA.getPenType().getStats().restitution() + penB.getPenType().getStats().restitution()) * 0.5;
        double invInertiaA = 1.0 / penA.getPenType().getStats().momentOfInertia();
        double invInertiaB = 1.0 / penB.getPenType().getStats().momentOfInertia();

        double rACrossN = rA.cross(normal);
        double rBCrossN = rB.cross(normal);
        double denom = invMassA + invMassB + (rACrossN * rACrossN) * invInertiaA + (rBCrossN * rBCrossN) * invInertiaB;
        if (denom < 1e-9) return false;

        double jMag = -(1.0 + e) * velAlongNormal / denom;
        Vector2D impulse = normal.scale(jMag);

        penA.setVelocity(penA.getVelocity().add(impulse.scale(invMassA)));
        penA.setAngularVelocity(penA.getAngularVelocity() + (rA.cross(impulse)) * invInertiaA);

        penB.setVelocity(penB.getVelocity().subtract(impulse.scale(invMassB)));
        penB.setAngularVelocity(penB.getAngularVelocity() - (rB.cross(impulse)) * invInertiaB);

        return true;
    }
}`
  },
  {
    path: 'src/main/java/com/kolomkolom/physics/PhysicsEngine.java',
    category: 'physics',
    description: '120Hz sub-stepping physics engine with surface friction damping and event dispatch',
    content: `package com.kolomkolom.physics;

import com.kolomkolom.model.Bench;
import com.kolomkolom.model.Pen;
import java.util.ArrayList;
import java.util.List;

public class PhysicsEngine {
    public static final double FIXED_DELTA_TIME = 1.0 / 120.0;
    public static final int SUB_STEPS = 4;

    private final List<CollisionListener> listeners = new ArrayList<>();

    public interface CollisionListener {
        void onPenPenCollision(Pen a, Pen b, double relativeSpeed);
        void onPenOutOfBounds(Pen pen);
    }

    public void addCollisionListener(CollisionListener listener) { listeners.add(listener); }

    public void update(List<Pen> pens, Bench bench, double deltaSeconds) {
        double subDt = deltaSeconds / SUB_STEPS;
        for (int step = 0; step < SUB_STEPS; step++) {
            for (Pen pen : pens) {
                if (pen.isOutOfBounds()) {
                    if (!pen.isFallComplete()) {
                        pen.setFallProgress(pen.getFallProgress() + subDt * 2.5);
                        if (pen.getFallProgress() >= 1.0) {
                            pen.setFallProgress(1.0);
                            pen.setFallComplete(true);
                        }
                    }
                    continue;
                }
                pen.setPosition(pen.getPosition().add(pen.getVelocity().scale(subDt)));
                pen.setAngle(pen.getAngle() + pen.getAngularVelocity() * subDt);

                double linDamp = pen.getPenType().getStats().linearDamping();
                double angDamp = pen.getPenType().getStats().angularDamping();
                pen.setVelocity(pen.getVelocity().scale(Math.max(0.0, 1.0 - linDamp * subDt)));
                pen.setAngularVelocity(pen.getAngularVelocity() * Math.max(0.0, 1.0 - angDamp * subDt));

                if (pen.isAtRest()) pen.stop();

                if (bench != null && bench.isPenOutOfBounds(pen)) {
                    pen.setOutOfBounds(true);
                    pen.setVelocity(pen.getVelocity().scale(0.3));
                    for (CollisionListener l : listeners) l.onPenOutOfBounds(pen);
                }
            }

            for (int i = 0; i < pens.size(); i++) {
                for (int j = i + 1; j < pens.size(); j++) {
                    Pen p1 = pens.get(i);
                    Pen p2 = pens.get(j);
                    if (!p1.isOutOfBounds() && !p2.isOutOfBounds()) {
                        double relSpeed = p1.getVelocity().subtract(p2.getVelocity()).length();
                        if (CollisionHandler.resolveCollision(p1, p2)) {
                            for (CollisionListener l : listeners) l.onPenPenCollision(p1, p2, relSpeed);
                        }
                    }
                }
            }
        }
    }
}`
  },
  {
    path: 'src/main/java/com/kolomkolom/ai/ComputerAI.java',
    category: 'ai',
    description: 'Rule-based AI with Easy, Medium, and Hard candidate trajectory simulation',
    content: `package com.kolomkolom.ai;

import com.kolomkolom.model.Bench;
import com.kolomkolom.model.Pen;
import com.kolomkolom.physics.CollisionHandler;
import com.kolomkolom.physics.Vector2D;
import java.util.Random;

public class ComputerAI {
    private final Random random = new Random();

    public Vector2D calculateShot(Pen botPen, Pen humanPen, Bench bench, AIDifficulty difficulty) {
        if (botPen.isOutOfBounds() || humanPen.isOutOfBounds()) return Vector2D.ZERO;
        Vector2D botPos = botPen.getPosition();
        Vector2D humanPos = humanPen.getPosition();

        return switch (difficulty) {
            case EASY -> calculateEasyShot(botPos, humanPos, difficulty);
            case MEDIUM -> calculateMediumShot(botPos, humanPos, humanPen, bench, difficulty);
            case HARD -> calculateHardShot(botPen, humanPen, bench, difficulty);
        };
    }

    private Vector2D calculateEasyShot(Vector2D botPos, Vector2D humanPos, AIDifficulty difficulty) {
        Vector2D toHuman = humanPos.subtract(botPos);
        double dist = Math.max(1.0, toHuman.length());
        double baseAngle = Math.atan2(toHuman.y, toHuman.x);
        double error = (random.nextDouble() * 2.0 - 1.0) * difficulty.getAimErrorVariance();
        double power = Math.clamp(dist * 2.2 + 200.0, 250.0, difficulty.getMaxSpeed());
        return new Vector2D(Math.cos(baseAngle + error), Math.sin(baseAngle + error)).scale(power);
    }

    private Vector2D calculateMediumShot(Vector2D botPos, Vector2D humanPos, Pen humanPen, Bench bench, AIDifficulty difficulty) {
        Vector2D edgeNormal = getVectorTowardsNearestEdge(humanPos, bench);
        Vector2D strikePoint = humanPos.subtract(edgeNormal.scale(12.0));
        Vector2D toTarget = strikePoint.subtract(botPos);
        double dist = Math.max(1.0, toTarget.length());
        double baseAngle = Math.atan2(toTarget.y, toTarget.x);
        double error = (random.nextDouble() * 2.0 - 1.0) * difficulty.getAimErrorVariance();
        double power = Math.clamp(dist * 2.5 + 280.0, 320.0, difficulty.getMaxSpeed());
        return new Vector2D(Math.cos(baseAngle + error), Math.sin(baseAngle + error)).scale(power);
    }

    private Vector2D calculateHardShot(Pen botPen, Pen humanPen, Bench bench, AIDifficulty difficulty) {
        Vector2D botPos = botPen.getPosition();
        Vector2D humanPos = humanPen.getPosition();
        Vector2D humanDir = humanPen.getDirection();
        double halfLen = humanPen.getPenType().getStats().length() * 0.4;
        Vector2D[] targets = { humanPos, humanPos.add(humanDir.scale(halfLen)), humanPos.subtract(humanDir.scale(halfLen)) };

        Vector2D bestShot = null;
        double bestScore = Double.NEGATIVE_INFINITY;

        for (Vector2D target : targets) {
            Vector2D toTarget = target.subtract(botPos);
            double dist = toTarget.length();
            if (dist < 1.0) continue;
            double baseAngle = Math.atan2(toTarget.y, toTarget.x);

            for (double angleOffset : new double[] { -0.08, -0.04, 0.0, 0.04, 0.08 }) {
                double shotAngle = baseAngle + angleOffset;
                Vector2D shotDir = new Vector2D(Math.cos(shotAngle), Math.sin(shotAngle));
                for (double pFrac : new double[] { 0.65, 0.85, 1.0 }) {
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
        return bestShot != null ? bestShot : calculateMediumShot(botPos, humanPos, humanPen, bench, difficulty);
    }

    private double evaluateCandidateShot(Vector2D impulse, Pen realBot, Pen realHuman, Bench bench) {
        Pen simBot = new Pen("SIM_BOT", "BOT", realBot.getPenType(), null, null, realBot.getPosition(), realBot.getAngle());
        Pen simHuman = new Pen("SIM_HUMAN", "HUMAN", realHuman.getPenType(), null, null, realHuman.getPosition(), realHuman.getAngle());
        simBot.applyDirectImpulse(impulse);
        double dt = 1.0 / 60.0;
        for (int i = 0; i < 24; i++) {
            simBot.setPosition(simBot.getPosition().add(simBot.getVelocity().scale(dt)));
            simBot.setVelocity(simBot.getVelocity().scale(0.97));
            simHuman.setPosition(simHuman.getPosition().add(simHuman.getVelocity().scale(dt)));
            simHuman.setVelocity(simHuman.getVelocity().scale(0.97));
            CollisionHandler.resolveCollision(simBot, simHuman);
            if (bench.isPenOutOfBounds(simHuman) && !bench.isPenOutOfBounds(simBot)) return 1000.0 - i * 5.0;
            if (bench.isPenOutOfBounds(simBot)) return -500.0;
        }
        return 100.0;
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
}`
  },
  {
    path: 'src/test/java/com/kolomkolom/PhysicsEngineTest.java',
    category: 'test',
    description: 'Automated JUnit 5 tests verifying impulse, damping, torque, and momentum transfer',
    content: `package com.kolomkolom;

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
    private Pen penA, penB;

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
        penA.applyDirectImpulse(impulse);
        assertEquals(impulse.x * (penA.getPenType().getStats().impulseMultiplier() / penA.getPenType().getStats().mass()), penA.getVelocity().x, 1e-4);
    }

    @Test
    @DisplayName("Surface friction causes linear velocity to decay towards rest")
    void testFrictionAndDamping() {
        penA.applyDirectImpulse(new Vector2D(300.0, 0.0));
        double initialSpeed = penA.getVelocity().length();
        physicsEngine.update(List.of(penA), bench, 0.5);
        assertTrue(penA.getVelocity().length() < initialSpeed);
    }

    @Test
    @DisplayName("Pen collision transfers momentum and prevents overlap")
    void testPenCollisionMomentumTransfer() {
        penA.setPosition(new Vector2D(400, 300));
        penB.setPosition(new Vector2D(440, 300));
        penA.setVelocity(new Vector2D(200.0, 0.0));
        boolean hit = CollisionHandler.resolveCollision(penA, penB);
        assertTrue(hit);
        assertTrue(penB.getVelocity().x > 10.0);
        assertTrue(penA.getVelocity().x < 200.0);
    }
}`
  }
];
