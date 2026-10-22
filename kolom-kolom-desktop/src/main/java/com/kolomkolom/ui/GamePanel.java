package com.kolomkolom.ui;

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

/**
 * High-performance Java2D rendering panel for Kolom Kolom.
 * Renders procedural wooden desk texture, realistic ballpoint pens with cylindrical
 * specular highlights, ink cartridges, metal clips, drop shadows, and mouse-drag aiming guides.
 */
public class GamePanel extends JPanel implements MouseListener, MouseMotionListener {
    private final GameManager gameManager;

    // Mouse drag aiming state
    private boolean isAiming = false;
    private Point dragStartPoint = null;
    private Point currentDragPoint = null;

    // Bench procedural texture cache
    private BufferedImage benchTexture = null;

    public GamePanel(GameManager gameManager) {
        this.gameManager = gameManager;
        setBackground(new Color(25, 20, 15));
        setFocusable(true);

        addMouseListener(this);
        addMouseMotionListener(this);

        addComponentListener(new ComponentAdapter() {
            @Override
            public void componentResized(ComponentEvent e) {
                if (getWidth() > 100 && getHeight() > 100) {
                    gameManager.initBenchAndPens(getWidth(), getHeight());
                    generateBenchTexture(getWidth(), getHeight());
                }
            }
        });

        // Key bindings: ESC to pause
        addKeyListener(new KeyAdapter() {
            @Override
            public void keyPressed(KeyEvent e) {
                if (e.getKeyCode() == KeyEvent.VK_ESCAPE) {
                    if (gameManager.getGameState() == GameState.PLAYING) {
                        gameManager.setGameState(GameState.PAUSED);
                    } else if (gameManager.getGameState() == GameState.PAUSED) {
                        gameManager.setGameState(GameState.PLAYING);
                    }
                }
            }
        });
    }

    private void generateBenchTexture(int w, int h) {
        benchTexture = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2 = benchTexture.createGraphics();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Warm classroom bench background
        Bench bench = gameManager.getBench();
        double bx = bench.getX();
        double by = bench.getY();
        double bw = bench.getWidth();
        double bh = bench.getHeight();

        // Surrounding classroom floor/background
        GradientPaint floorGrad = new GradientPaint(
                0, 0, new Color(38, 30, 24),
                w, h, new Color(22, 18, 14)
        );
        g2.setPaint(floorGrad);
        g2.fillRect(0, 0, w, h);

        // Desk drop shadow
        g2.setColor(new Color(0, 0, 0, 160));
        g2.fill(new RoundRectangle2D.Double(bx + 14, by + 18, bw, bh, 28, 28));

        // Wooden bench base
        RoundRectangle2D deskRect = new RoundRectangle2D.Double(bx, by, bw, bh, 24, 24);
        GradientPaint woodBase = new GradientPaint(
                (float) bx, (float) by, new Color(188, 126, 75),
                (float) (bx + bw), (float) (by + bh), new Color(145, 92, 52)
        );
        g2.setPaint(woodBase);
        g2.fill(deskRect);

        // Wood grain lines and plank textures
        g2.setClip(deskRect);
        g2.setColor(new Color(110, 68, 36, 45));
        for (int y = (int) by; y < by + bh; y += 4) {
            double wave = Math.sin(y * 0.05) * 12.0 + Math.cos(y * 0.02) * 6.0;
            g2.drawLine((int) bx, y, (int) (bx + bw), (int) (y + wave));
        }

        // Distinct wood planks
        g2.setColor(new Color(85, 48, 22, 90));
        g2.setStroke(new BasicStroke(2.0f));
        double plankHeight = bh / 3.0;
        g2.draw(new Line2D.Double(bx, by + plankHeight, bx + bw, by + plankHeight));
        g2.draw(new Line2D.Double(bx, by + plankHeight * 2, bx + bw, by + plankHeight * 2));

        // Nostalgic classroom desk carvings / subtle scratches
        g2.setColor(new Color(90, 50, 25, 60));
        g2.setStroke(new BasicStroke(1.0f));
        g2.draw(new Line2D.Double(bx + 120, by + 90, bx + 180, by + 86));
        g2.draw(new Line2D.Double(bx + 175, by + 86, bx + 170, by + 110));
        g2.draw(new Line2D.Double(bx + bw - 220, by + bh - 140, bx + bw - 160, by + bh - 130));

        // Desk border bevel highlight and rim
        g2.setClip(null);
        g2.setColor(new Color(235, 185, 140, 110));
        g2.setStroke(new BasicStroke(3.0f));
        g2.draw(deskRect);

        // Inner playable boundary line
        g2.setColor(new Color(70, 40, 20, 120));
        g2.setStroke(new BasicStroke(1.5f, BasicStroke.CAP_BUTT, BasicStroke.JOIN_MITER, 10.0f, new float[]{8.0f, 6.0f}, 0.0f));
        g2.draw(new Rectangle2D.Double(
                bench.getPlayableLeft(), bench.getPlayableTop(),
                bench.getPlayableRight() - bench.getPlayableLeft(),
                bench.getPlayableBottom() - bench.getPlayableTop()
        ));

        g2.dispose();
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);

        int w = getWidth();
        int h = getHeight();

        // 1. Draw Bench
        if (benchTexture != null && benchTexture.getWidth() == w && benchTexture.getHeight() == h) {
            g2.drawImage(benchTexture, 0, 0, null);
        } else {
            generateBenchTexture(w, h);
            if (benchTexture != null) g2.drawImage(benchTexture, 0, 0, null);
        }

        // 2. Draw Pens
        Pen humanPen = gameManager.getHumanPen();
        Pen botPen = gameManager.getComputerPen();

        if (botPen != null) renderPen(g2, botPen);
        if (humanPen != null) renderPen(g2, humanPen);

        // 3. Draw Aiming Line and Power Indicator
        if (isAiming && dragStartPoint != null && currentDragPoint != null && gameManager.getTurnState() == TurnState.HUMAN_AIMING) {
            renderAimingGuide(g2);
        }

        // 4. Draw HUD: Scores, Target, Turn Status
        renderHUD(g2, w, h);

        // 5. Draw Pause Overlay if paused
        if (gameManager.getGameState() == GameState.PAUSED) {
            renderPauseOverlay(g2, w, h);
        }

        g2.dispose();
    }

    private void renderPen(Graphics2D g2, Pen pen) {
        Vector2D pos = pen.getPosition();
        double angle = pen.getAngle();
        double len = pen.getPenType().getStats().length();
        double width = pen.getPenType().getStats().width();

        Graphics2D pG = (Graphics2D) g2.create();
        pG.translate(pos.x, pos.y);

        // Falling animation scale & alpha
        if (pen.isOutOfBounds()) {
            double prog = pen.getFallProgress();
            float alpha = (float) Math.max(0.0, 1.0 - prog * 0.9);
            pG.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, alpha));
            double scale = 1.0 - prog * 0.35;
            pG.scale(scale, scale);
            pG.translate(0, prog * 45.0); // drop downward
        }

        pG.rotate(angle);

        // 1. Soft Realistic Drop Shadow
        if (!pen.isOutOfBounds()) {
            Graphics2D sG = (Graphics2D) g2.create();
            sG.translate(pos.x + 8.0, pos.y + 10.0);
            sG.rotate(angle);
            sG.setColor(new Color(0, 0, 0, 75));
            sG.fill(new RoundRectangle2D.Double(-len * 0.5, -width * 0.55, len, width * 1.1, 10, 10));
            sG.dispose();
        }

        double halfL = len * 0.5;
        double halfW = width * 0.5;

        // 2. Pen Barrel (Body)
        Color primary = pen.getPrimaryColor();
        Color accent = pen.getAccentColor();

        // Main cylindrical barrel gradient
        GradientPaint barrelGrad = new GradientPaint(
                0, (float) -halfW, primary.brighter(),
                0, (float) halfW, accent.darker()
        );
        pG.setPaint(barrelGrad);
        pG.fill(new RoundRectangle2D.Double(-halfL + 25.0, -halfW, len - 55.0, width, 6, 6));

        // Specular highlight along top cylinder ridge
        pG.setColor(new Color(255, 255, 255, 110));
        pG.fill(new Rectangle2D.Double(-halfL + 27.0, -halfW + 1.5, len - 59.0, width * 0.28));

        // Internal ink reservoir visible in barrel
        pG.setColor(new Color(15, 15, 20, 180));
        pG.fill(new Rectangle2D.Double(-halfL + 35.0, -halfW * 0.2, len - 75.0, width * 0.4));

        // 3. Ergonomic Grip Rings (front section)
        pG.setColor(new Color(30, 30, 35));
        pG.fill(new RoundRectangle2D.Double(halfL - 42.0, -halfW * 0.95, 22.0, width * 0.9, 4, 4));
        pG.setColor(new Color(255, 255, 255, 40));
        for (double gx = halfL - 40.0; gx <= halfL - 24.0; gx += 4.5) {
            pG.draw(new Line2D.Double(gx, -halfW * 0.9, gx, halfW * 0.9));
        }

        // 4. Chrome/Brass Conical Nib and Tip (pointing to right in local coords)
        Polygon nib = new Polygon();
        nib.addPoint((int) (halfL - 20.0), (int) (-halfW * 0.8));
        nib.addPoint((int) (halfL - 20.0), (int) (halfW * 0.8));
        nib.addPoint((int) (halfL - 3.0), (int) (halfW * 0.25));
        nib.addPoint((int) (halfL - 3.0), (int) (-halfW * 0.25));
        pG.setPaint(new GradientPaint(
                (float) (halfL - 20.0), (float) -halfW, new Color(230, 230, 235),
                (float) (halfL - 3.0), (float) halfW, new Color(130, 130, 135)
        ));
        pG.fill(nib);

        // Tungsten carbide ballpoint tip
        pG.setColor(new Color(50, 50, 55));
        pG.fill(new Ellipse2D.Double(halfL - 3.0, -2.0, 4.0, 4.0));

        // 5. Back Cap and Pocket Clip (left in local coords)
        pG.setColor(accent);
        pG.fill(new RoundRectangle2D.Double(-halfL, -halfW * 0.95, 25.0, width * 0.9, 8, 8));

        // Metal pocket clip
        pG.setColor(new Color(210, 215, 220));
        pG.fill(new RoundRectangle2D.Double(-halfL + 6.0, -halfW - 3.5, 36.0, 3.5, 2, 2));
        pG.setColor(new Color(110, 115, 120));
        pG.draw(new RoundRectangle2D.Double(-halfL + 6.0, -halfW - 3.5, 36.0, 3.5, 2, 2));

        // Owner label ring indicator
        pG.setColor(Color.WHITE);
        pG.setFont(new Font("SansSerif", Font.BOLD, 9));
        pG.drawString(pen.getId().equals("HUMAN") ? "YOU" : "BOT", (float) (-halfL + 30.0), 3.5f);

        pG.dispose();
    }

    private void renderAimingGuide(Graphics2D g2) {
        Vector2D penPos = gameManager.getHumanPen().getPosition();
        double dx = penPos.x - currentDragPoint.x;
        double dy = penPos.y - currentDragPoint.y;
        double dragLen = Math.sqrt(dx * dx + dy * dy);
        if (dragLen < 6.0) return;

        double maxDrag = 280.0;
        double powerFrac = Math.clamp(dragLen / maxDrag, 0.0, 1.0);
        double angle = Math.atan2(dy, dx);

        // Draw dotted slingshot aiming trajectory
        g2.setStroke(new BasicStroke(3.0f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND, 10.0f, new float[]{8.0f, 6.0f}, 0.0f));
        Color aimColor = powerFrac > 0.75 ? new Color(245, 100, 60, 220) : new Color(60, 180, 250, 220);
        g2.setColor(aimColor);

        double lineLen = Math.min(dragLen * 1.5, 380.0);
        double endX = penPos.x + Math.cos(angle) * lineLen;
        double endY = penPos.y + Math.sin(angle) * lineLen;
        g2.draw(new Line2D.Double(penPos.x, penPos.y, endX, endY));

        // Trajectory arrowhead
        double arrowSize = 14.0;
        Polygon arrow = new Polygon();
        arrow.addPoint((int) endX, (int) endY);
        arrow.addPoint((int) (endX - arrowSize * Math.cos(angle - 0.4)), (int) (endY - arrowSize * Math.sin(angle - 0.4)));
        arrow.addPoint((int) (endX - arrowSize * Math.cos(angle + 0.4)), (int) (endY - arrowSize * Math.sin(angle + 0.4)));
        g2.fill(arrow);

        // Power arc around pen
        g2.setStroke(new BasicStroke(5.0f));
        g2.setColor(new Color(255, 255, 255, 180));
        g2.draw(new Arc2D.Double(penPos.x - 36, penPos.y - 36, 72, 72, 0, (int) (360 * powerFrac), Arc2D.OPEN));
    }

    private void renderHUD(Graphics2D g2, int w, int h) {
        var scoreMgr = gameManager.getScoreManager();

        // Top Status Bar (Low-occlusion, world-matched)
        int barW = 540;
        int barH = 54;
        int barX = (w - barW) / 2;
        int barY = 16;

        g2.setColor(new Color(20, 15, 12, 210));
        g2.fill(new RoundRectangle2D.Double(barX, barY, barW, barH, 16, 16));
        g2.setColor(new Color(210, 160, 110, 90));
        g2.setStroke(new BasicStroke(1.5f));
        g2.draw(new RoundRectangle2D.Double(barX, barY, barW, barH, 16, 16));

        // Player Score
        g2.setColor(new Color(90, 175, 255));
        g2.setFont(new Font("SansSerif", Font.BOLD, 14));
        g2.drawString("YOU", barX + 24, barY + 24);
        g2.setFont(new Font("Monospaced", Font.BOLD, 22));
        g2.drawString(String.format("%02d", scoreMgr.getHumanScore()), barX + 24, barY + 46);

        // Target Score Center Badge
        g2.setColor(new Color(220, 195, 160));
        g2.setFont(new Font("SansSerif", Font.PLAIN, 12));
        String targetText = "FIRST TO " + scoreMgr.getTargetScore();
        int tw = g2.getFontMetrics().stringWidth(targetText);
        g2.drawString(targetText, w / 2 - tw / 2, barY + 22);

        // Turn Status
        String statusText = switch (gameManager.getTurnState()) {
            case HUMAN_AIMING -> "YOUR TURN · DRAG PEN TO SHOOT";
            case HUMAN_RESOLVING -> "SLIDING...";
            case COMPUTER_THINKING -> "OPPONENT AIMING...";
            case COMPUTER_RESOLVING -> "OPPONENT SHOT...";
            case ROUND_RESOLVED -> scoreMgr.isRoundScored() ? "PEN KNOCKED OFF!" : "RESOLVING...";
            case ROUND_RESET -> "RESETTING PENS...";
        };
        g2.setFont(new Font("SansSerif", Font.BOLD, 13));
        g2.setColor(gameManager.getTurnState() == TurnState.HUMAN_AIMING ? new Color(100, 220, 130) : new Color(245, 180, 80));
        int sw = g2.getFontMetrics().stringWidth(statusText);
        g2.drawString(statusText, w / 2 - sw / 2, barY + 42);

        // Computer Score
        g2.setColor(new Color(255, 110, 110));
        g2.setFont(new Font("SansSerif", Font.BOLD, 14));
        g2.drawString("BOT", barX + barW - 68, barY + 24);
        g2.setFont(new Font("Monospaced", Font.BOLD, 22));
        g2.drawString(String.format("%02d", scoreMgr.getComputerScore()), barX + barW - 68, barY + 46);

        // Bottom instruction tip
        g2.setFont(new Font("SansSerif", Font.PLAIN, 12));
        g2.setColor(new Color(220, 200, 180, 140));
        String tip = "Click & Drag Your Blue Pen · Esc to Pause · Knock the Opponent Pen Off the Desk!";
        int tipW = g2.getFontMetrics().stringWidth(tip);
        g2.drawString(tip, w / 2 - tipW / 2, h - 22);
    }

    private void renderPauseOverlay(Graphics2D g2, int w, int h) {
        g2.setColor(new Color(0, 0, 0, 180));
        g2.fillRect(0, 0, w, h);

        g2.setColor(Color.WHITE);
        g2.setFont(new Font("SansSerif", Font.BOLD, 36));
        String paused = "GAME PAUSED";
        int pw = g2.getFontMetrics().stringWidth(paused);
        g2.drawString(paused, w / 2 - pw / 2, h / 2 - 20);

        g2.setFont(new Font("SansSerif", Font.PLAIN, 16));
        g2.setColor(new Color(220, 220, 220));
        String hint = "Press ESC to Resume or use Menu Options";
        int hw = g2.getFontMetrics().stringWidth(hint);
        g2.drawString(hint, w / 2 - hw / 2, h / 2 + 25);
    }

    // Mouse Controls
    @Override
    public void mousePressed(MouseEvent e) {
        if (gameManager.getGameState() != GameState.PLAYING) return;
        if (gameManager.getTurnState() != TurnState.HUMAN_AIMING) return;

        Pen humanPen = gameManager.getHumanPen();
        Vector2D clickPos = new Vector2D(e.getX(), e.getY());

        if (humanPen.containsPoint(clickPos)) {
            isAiming = true;
            dragStartPoint = e.getPoint();
            currentDragPoint = e.getPoint();
            repaint();
        }
    }

    @Override
    public void mouseDragged(MouseEvent e) {
        if (isAiming) {
            currentDragPoint = e.getPoint();
            repaint();
        }
    }

    @Override
    public void mouseReleased(MouseEvent e) {
        if (isAiming && dragStartPoint != null && currentDragPoint != null) {
            Vector2D penPos = gameManager.getHumanPen().getPosition();
            // Slingshot pull vector: dragging backward shoots forward!
            double dx = penPos.x - currentDragPoint.x;
            double dy = penPos.y - currentDragPoint.y;
            Vector2D impulse = new Vector2D(dx * 3.4, dy * 3.4);

            isAiming = false;
            dragStartPoint = null;
            currentDragPoint = null;

            gameManager.executeHumanShot(impulse);
            repaint();
        }
    }

    @Override public void mouseClicked(MouseEvent e) {}
    @Override public void mouseEntered(MouseEvent e) {}
    @Override public void mouseExited(MouseEvent e) {}
    @Override public void mouseMoved(MouseEvent e) {}
}
