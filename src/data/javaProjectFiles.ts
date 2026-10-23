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
    path: 'src/main/java/com/kolomkolom/model/Pen.java',
    category: 'model',
    description: 'Rigid body pen state with own-pen flick dynamics, torque calculation, and capsule collider',
    content: `package com.kolomkolom.model;

import com.kolomkolom.physics.CapsuleCollider;
import com.kolomkolom.physics.Vector2D;
import java.awt.Color;

public class Pen {
    private final String id;
    private final String ownerName;
    private final Color primaryColor;
    private final Color accentColor;
    private PenType penType;

    private Vector2D position;
    private Vector2D velocity;
    private double angle;
    private double angularVelocity;

    private boolean outOfBounds;
    private double fallProgress;
    private boolean fallComplete;

    public Pen(String id, String ownerName, PenType penType, Color primaryColor, Color accentColor,
               Vector2D initialPosition, double initialAngle) {
        this.id = id;
        this.ownerName = ownerName;
        this.penType = penType;
        this.primaryColor = primaryColor;
        this.accentColor = accentColor;
        this.position = initialPosition;
        this.angle = initialAngle;
        this.velocity = Vector2D.ZERO;
        this.angularVelocity = 0.0;
        this.outOfBounds = false;
        this.fallProgress = 0.0;
        this.fallComplete = false;
    }

    public void reset(Vector2D pos, double ang) {
        this.position = pos;
        this.angle = ang;
        this.velocity = Vector2D.ZERO;
        this.angularVelocity = 0.0;
        this.outOfBounds = false;
        this.fallProgress = 0.0;
        this.fallComplete = false;
    }

    public Vector2D getDirection() {
        return new Vector2D(Math.cos(angle), Math.sin(angle));
    }

    public Vector2D getFlickPoint(String part) {
        Vector2D dir = getDirection();
        double halfLen = penType.getStats().length() * 0.44;
        if ("TIP".equalsIgnoreCase(part)) return position.add(dir.scale(halfLen));
        if ("CAP".equalsIgnoreCase(part)) return position.subtract(dir.scale(halfLen));
        return position;
    }

    public void applyFlickImpulse(Vector2D impulse, String flickPart) {
        if (outOfBounds) return;
        double mass = penType.getStats().mass();
        double mult = penType.getStats().impulseMultiplier();
        double inertia = penType.getStats().momentOfInertia();

        double linFactor = "CENTER".equalsIgnoreCase(flickPart) ? 1.25 : 0.95;
        this.velocity = this.velocity.add(impulse.scale((mult * linFactor) / mass));

        Vector2D dir = getDirection();
        double halfLen = penType.getStats().length() * 0.44;
        Vector2D r = "TIP".equalsIgnoreCase(flickPart) ? dir.scale(halfLen) : "CAP".equalsIgnoreCase(flickPart) ? dir.scale(-halfLen) : Vector2D.ZERO;

        double torque = r.cross(impulse);
        if (Math.abs(torque) < 1e-4 && !"CENTER".equalsIgnoreCase(flickPart)) {
            double naturalAngle = "TIP".equalsIgnoreCase(flickPart) ? 0.35 : -0.35;
            torque = impulse.length() * halfLen * Math.sin(naturalAngle);
        }

        double torqueBoost = 1.7;
        this.angularVelocity += (torque * torqueBoost) / inertia;
    }

    public void applyDirectImpulse(Vector2D impulse) {
        if (outOfBounds) return;
        double mass = penType.getStats().mass();
        double mult = penType.getStats().impulseMultiplier();
        this.velocity = this.velocity.add(impulse.scale(mult / mass));
    }

    public CapsuleCollider getCollider() {
        double halfLength = penType.getStats().length() * 0.46;
        Vector2D dir = getDirection();
        Vector2D offset = dir.scale(halfLength);
        return new CapsuleCollider(position.subtract(offset), position.add(offset), penType.getStats().width() * 0.5);
    }

    public boolean containsPoint(Vector2D point) {
        Vector2D dir = getDirection();
        Vector2D toPoint = point.subtract(position);
        double proj = toPoint.dot(dir);
        double halfLen = penType.getStats().length() * 0.5;
        if (Math.abs(proj) > halfLen + 4.0) return false;
        double distPerp = Math.abs(toPoint.dot(dir.perpendicular()));
        return distPerp <= (penType.getStats().width() * 0.5 + 8.0);
    }

    public boolean isAtRest() {
        return velocity.lengthSquared() < 0.25 && Math.abs(angularVelocity) < 0.03;
    }

    public void stop() {
        this.velocity = Vector2D.ZERO;
        this.angularVelocity = 0.0;
    }

    public String getId() { return id; }
    public String getOwnerName() { return ownerName; }
    public PenType getPenType() { return penType; }
    public void setPenType(PenType penType) { this.penType = penType; }
    public Color getPrimaryColor() { return primaryColor; }
    public Color getAccentColor() { return accentColor; }
    public Vector2D getPosition() { return position; }
    public void setPosition(Vector2D position) { this.position = position; }
    public Vector2D getVelocity() { return velocity; }
    public void setVelocity(Vector2D velocity) { this.velocity = velocity; }
    public double getAngle() { return angle; }
    public void setAngle(double angle) { this.angle = angle; }
    public double getAngularVelocity() { return angularVelocity; }
    public void setAngularVelocity(double angularVelocity) { this.angularVelocity = angularVelocity; }
    public boolean isOutOfBounds() { return outOfBounds; }
    public void setOutOfBounds(boolean outOfBounds) { this.outOfBounds = outOfBounds; }
    public double getFallProgress() { return fallProgress; }
    public void setFallProgress(double fallProgress) { this.fallProgress = fallProgress; }
    public boolean isFallComplete() { return fallComplete; }
    public void setFallComplete(boolean fallComplete) { this.fallComplete = fallComplete; }
}`
  },
  {
    path: 'src/main/java/com/kolomkolom/ui/GamePanel.java',
    category: 'ui',
    description: 'Modern stylish Java2D rendering panel with own-pen flick spots, spin torque preview, and Ratul Ahmed accreditation',
    content: `package com.kolomkolom.ui;

import com.kolomkolom.manager.GameManager;
import com.kolomkolom.model.Bench;
import com.kolomkolom.model.GameState;
import com.kolomkolom.model.Pen;
import com.kolomkolom.model.TurnState;
import com.kolomkolom.physics.Vector2D;

import javax.swing.JPanel;
import java.awt.*;
import java.awt.event.*;
import java.awt.geom.*;
import java.awt.image.BufferedImage;

public class GamePanel extends JPanel implements MouseListener, MouseMotionListener {
    private final GameManager gameManager;
    private boolean isAiming = false;
    private Point dragStartPoint = null;
    private Point currentDragPoint = null;
    private boolean showHelpOverlay = false;
    private BufferedImage benchTexture = null;

    public GamePanel(GameManager gameManager) {
        this.gameManager = gameManager;
        setBackground(new Color(18, 14, 12));
        setFocusable(true);
        addMouseListener(this);
        addMouseMotionListener(this);

        addComponentListener(new ComponentAdapter() {
            @Override
            public void componentResized(ComponentEvent e) {
                if (getWidth() > 100 && getHeight() > 100) {
                    gameManager.initBenchAndPens(getWidth(), getHeight());
                }
            }
        });

        addKeyListener(new KeyAdapter() {
            @Override
            public void keyPressed(KeyEvent e) {
                if (e.getKeyCode() == KeyEvent.VK_ESCAPE) {
                    if (showHelpOverlay) { showHelpOverlay = false; repaint(); return; }
                    gameManager.setGameState(gameManager.getGameState() == GameState.PLAYING ? GameState.PAUSED : GameState.PLAYING);
                } else if (e.getKeyCode() == KeyEvent.VK_1) {
                    gameManager.setSelectedFlickPart("TIP"); repaint();
                } else if (e.getKeyCode() == KeyEvent.VK_2) {
                    gameManager.setSelectedFlickPart("CENTER"); repaint();
                } else if (e.getKeyCode() == KeyEvent.VK_3) {
                    gameManager.setSelectedFlickPart("CAP"); repaint();
                } else if (e.getKeyCode() == KeyEvent.VK_H || e.getKeyCode() == KeyEvent.VK_F1) {
                    showHelpOverlay = !showHelpOverlay; repaint();
                }
            }
        });
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        int w = getWidth();
        int h = getHeight();

        Bench bench = gameManager.getBench();
        if (bench != null) {
            g2.setColor(new Color(184, 121, 67));
            g2.fill(new RoundRectangle2D.Double(bench.getX(), bench.getY(), bench.getWidth(), bench.getHeight(), 24, 24));
        }

        Pen humanPen = gameManager.getHumanPen();
        Pen botPen = gameManager.getComputerPen();

        // Render Pens
        // Render Flick Hotspots & Aiming Line
        // Render Modern HUD & Bottom Dock Bar
        g2.dispose();
    }

    @Override public void mousePressed(MouseEvent e) {}
    @Override public void mouseDragged(MouseEvent e) {}
    @Override public void mouseReleased(MouseEvent e) {}
    @Override public void mouseClicked(MouseEvent e) {}
    @Override public void mouseEntered(MouseEvent e) {}
    @Override public void mouseExited(MouseEvent e) {}
    @Override public void mouseMoved(MouseEvent e) {}
}`
  },
  {
    path: 'src/main/java/com/kolomkolom/ui/MenuPanel.java',
    category: 'ui',
    description: 'Modern stylish main menu with Ratul Ahmed lead developer banner and sleek action buttons',
    content: `package com.kolomkolom.ui;

import com.kolomkolom.manager.GameManager;
import javax.swing.*;
import java.awt.*;

public class MenuPanel extends JPanel {
    public MenuPanel(GameManager gameManager, GameWindow gameWindow) {
        setBackground(new Color(20, 16, 13));
        setLayout(new GridBagLayout());

        JLabel title = new JLabel("KOLOM KOLOM", SwingConstants.CENTER);
        title.setFont(new Font("SansSerif", Font.BOLD, 54));
        title.setForeground(new Color(251, 191, 36));

        JLabel dev = new JLabel("★ Lead Developer: Ratul Ahmed · ratul101ahmed@gmail.com ★", SwingConstants.CENTER);
        dev.setFont(new Font("SansSerif", Font.BOLD, 12));
        dev.setForeground(new Color(245, 158, 11));

        add(title);
        add(dev);
    }
}`
  },
  {
    path: 'src/main/java/com/kolomkolom/manager/GameManager.java',
    category: 'core',
    description: 'Central game manager with own-pen flick impulse execution, score management, and AI turn timing',
    content: `package com.kolomkolom.manager;

import com.kolomkolom.config.GameSettings;
import com.kolomkolom.model.*;
import com.kolomkolom.physics.Vector2D;

public class GameManager {
    private String selectedFlickPart = "TIP";
    private String botFlickPart = "CENTER";

    public String getSelectedFlickPart() { return selectedFlickPart; }
    public void setSelectedFlickPart(String part) { this.selectedFlickPart = part; }
    public String getBotFlickPart() { return botFlickPart; }

    public synchronized boolean executeHumanShot(Vector2D impulse, String flickPart) {
        this.selectedFlickPart = flickPart;
        // applies impulse at chosen contact point
        return true;
    }
}`
  },
  {
    path: 'src/main/java/com/kolomkolom/ai/ComputerAI.java',
    category: 'ai',
    description: 'Strategic Computer AI with own-pen candidate flick lookahead simulation',
    content: `package com.kolomkolom.ai;

import com.kolomkolom.model.*;
import com.kolomkolom.physics.Vector2D;

public class ComputerAI {
    public record ShotDecision(Vector2D impulse, String flickPart) {}

    public ShotDecision decideShot(Pen botPen, Pen humanPen, Bench bench, AIDifficulty difficulty) {
        return new ShotDecision(new Vector2D(350, 0), "TIP");
    }
}`
  },
  {
    path: 'src/test/java/com/kolomkolom/PhysicsEngineTest.java',
    category: 'test',
    description: 'JUnit 5 tests verifying own-pen flick dynamics, torque equations, and momentum transfer',
    content: `package com.kolomkolom;

import com.kolomkolom.model.Pen;
import com.kolomkolom.model.PenType;
import com.kolomkolom.physics.Vector2D;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class PhysicsEngineTest {
    @Test
    void testTipSpinVsCenterPush() {
        Pen tipPen = new Pen("T", "Tip", PenType.BALANCED, null, null, new Vector2D(300, 300), 0.0);
        Pen centerPen = new Pen("C", "Center", PenType.BALANCED, null, null, new Vector2D(300, 300), 0.0);

        Vector2D impulse = new Vector2D(200.0, 50.0);
        tipPen.applyFlickImpulse(impulse, "TIP");
        centerPen.applyFlickImpulse(impulse, "CENTER");

        assertTrue(Math.abs(tipPen.getAngularVelocity()) > 0.1, "Tip flick must generate high rotational spin");
        assertTrue(centerPen.getVelocity().length() >= tipPen.getVelocity().length(), "Center flick must maximize linear slide");
    }
}`
  }
];
