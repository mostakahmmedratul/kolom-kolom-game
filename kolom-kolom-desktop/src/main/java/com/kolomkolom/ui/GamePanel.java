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
import java.awt.image.BufferedImage;

/**
 * Modern, high-performance Java2D rendering panel for Kolom Kolom.
 * Features realistic procedural wooden desk graphics, ballpoint pen models,
 * interactive own-pen flick contact spots (Tip Spin, Center Push, Cap Whip),
 * dynamic spin torque trajectory preview, and modern HUD with developer profile.
 */
public class GamePanel extends JPanel implements MouseListener, MouseMotionListener {
    private final GameManager gameManager;

    // Mouse drag aiming state
    private boolean isAiming = false;
    private Point dragStartPoint = null;
    private Point currentDragPoint = null;

    // In-game Developer & Rules overlay state
    private boolean showHelpOverlay = false;

    // Bench procedural texture cache
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
                    generateBenchTexture(getWidth(), getHeight());
                }
            }
        });

        // Key bindings: ESC (pause), 1-3 (flick spots), H (Developer info & rules)
        addKeyListener(new KeyAdapter() {
            @Override
            public void keyPressed(KeyEvent e) {
                if (e.getKeyCode() == KeyEvent.VK_ESCAPE) {
                    if (showHelpOverlay) {
                        showHelpOverlay = false;
                        repaint();
                        return;
                    }
                    if (gameManager.getGameState() == GameState.PLAYING) {
                        gameManager.setGameState(GameState.PAUSED);
                    } else if (gameManager.getGameState() == GameState.PAUSED) {
                        gameManager.setGameState(GameState.PLAYING);
                    }
                } else if (e.getKeyCode() == KeyEvent.VK_1) {
                    gameManager.setSelectedFlickPart("TIP");
                    repaint();
                } else if (e.getKeyCode() == KeyEvent.VK_2) {
                    gameManager.setSelectedFlickPart("CENTER");
                    repaint();
                } else if (e.getKeyCode() == KeyEvent.VK_3) {
                    gameManager.setSelectedFlickPart("CAP");
                    repaint();
                } else if (e.getKeyCode() == KeyEvent.VK_H || e.getKeyCode() == KeyEvent.VK_F1) {
                    showHelpOverlay = !showHelpOverlay;
                    repaint();
                }
            }
        });
    }

    private void generateBenchTexture(int w, int h) {
        benchTexture = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2 = benchTexture.createGraphics();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        Bench bench = gameManager.getBench();
        double bx = bench.getX();
        double by = bench.getY();
        double bw = bench.getWidth();
        double bh = bench.getHeight();

        // Surrounding room ambient floor
        GradientPaint floorGrad = new GradientPaint(
                0, 0, new Color(28, 22, 17),
                w, h, new Color(14, 11, 8)
        );
        g2.setPaint(floorGrad);
        g2.fillRect(0, 0, w, h);

        // Desk drop shadow
        g2.setColor(new Color(0, 0, 0, 160));
        g2.fill(new RoundRectangle2D.Double(bx + 14, by + 18, bw, bh, 28, 28));

        // Wooden bench base surface
        RoundRectangle2D deskRect = new RoundRectangle2D.Double(bx, by, bw, bh, 24, 24);
        GradientPaint woodBase = new GradientPaint(
                (float) bx, (float) by, new Color(184, 121, 67),
                (float) (bx + bw), (float) (by + bh), new Color(142, 82, 41)
        );
        g2.setPaint(woodBase);
        g2.fill(deskRect);

        // Wood grain lines and natural variations
        g2.setClip(deskRect);
        g2.setColor(new Color(92, 50, 22, 45));
        for (int y = (int) by; y < by + bh; y += 4) {
            double wave = Math.sin(y * 0.04) * 10.0 + Math.cos(y * 0.015) * 6.0;
            g2.drawLine((int) bx, y, (int) (bx + bw), (int) (y + wave));
        }

        // Distinct desk plank seams
        g2.setColor(new Color(65, 33, 14, 90));
        g2.setStroke(new BasicStroke(2.0f));
        double plankHeight = bh / 3.0;
        g2.draw(new Line2D.Double(bx, by + plankHeight, bx + bw, by + plankHeight));
        g2.draw(new Line2D.Double(bx, by + plankHeight * 2, bx + bw, by + plankHeight * 2));

        // Nostalgic classroom desk carvings / school doodles
        g2.setColor(new Color(75, 40, 18, 65));
        g2.setStroke(new BasicStroke(1.0f));
        g2.draw(new Line2D.Double(bx + 140, by + 100, bx + 180, by + 95));
        g2.draw(new Line2D.Double(bx + 180, by + 95, bx + 175, by + 120));
        g2.draw(new Line2D.Double(bx + bw - 220, by + bh - 140, bx + bw - 160, by + bh - 130));

        // Desk border bevel highlight
        g2.setClip(null);
        g2.setColor(new Color(240, 190, 140, 100));
        g2.setStroke(new BasicStroke(3.0f));
        g2.draw(deskRect);

        // Inner playable boundary guide
        g2.setColor(new Color(70, 35, 15, 90));
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
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);

        int w = getWidth();
        int h = getHeight();

        // 1. Draw Bench Texture
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

        // 3. Render Flick Hotspots on Player's OWN Blue Pen
        if (humanPen != null && !humanPen.isOutOfBounds() && gameManager.getTurnState() == TurnState.HUMAN_AIMING) {
            renderPlayerFlickHotspots(g2, humanPen, gameManager.getSelectedFlickPart());
        }

        // 4. Draw Aiming Line and Power Indicator originating from selected flick point
        if (isAiming && currentDragPoint != null && gameManager.getTurnState() == TurnState.HUMAN_AIMING && humanPen != null) {
            renderAimingGuide(g2, humanPen, gameManager.getSelectedFlickPart());
        }

        // 5. Draw Modern HUD (Scores, Target, Turn Status)
        renderHUD(g2, w, h);

        // 6. Draw Bottom Modern Dock Bar with Flick Spots & Developer button
        renderBottomDock(g2, w, h);

        // 7. Draw Pause Overlay if paused
        if (gameManager.getGameState() == GameState.PAUSED) {
            renderPauseOverlay(g2, w, h);
        }

        // 8. Draw Developer Profile & Rules Dialog if active
        if (showHelpOverlay) {
            renderHelpOverlay(g2, w, h);
        }

        g2.dispose();
    }

    private void renderPlayerFlickHotspots(Graphics2D g2, Pen human, String activePart) {
        String[] parts = new String[] { "TIP", "CENTER", "CAP" };
        Color[] colors = new Color[] { new Color(245, 158, 11), new Color(56, 189, 248), new Color(192, 132, 252) };
        String[] labels = new String[] { "TIP (SPIN)", "CENTER (PUSH)", "CAP (WHIP)" };

        for (int i = 0; i < parts.length; i++) {
            String p = parts[i];
            Vector2D pt = human.getFlickPoint(p);
            boolean isSelected = p.equalsIgnoreCase(activePart);
            double radius = isSelected ? 12.0 : 8.5;
            Color col = colors[i];

            // Outer glow ring
            g2.setColor(isSelected ? col : new Color(col.getRed(), col.getGreen(), col.getBlue(), 120));
            g2.setStroke(new BasicStroke(isSelected ? 2.5f : 1.2f));
            g2.draw(new Ellipse2D.Double(pt.x - radius - (isSelected ? 4 : 2), pt.y - radius - (isSelected ? 4 : 2),
                    (radius + (isSelected ? 4 : 2)) * 2, (radius + (isSelected ? 4 : 2)) * 2));

            // Target fill
            g2.setColor(isSelected ? new Color(col.getRed(), col.getGreen(), col.getBlue(), 90) : new Color(25, 20, 18, 190));
            g2.fill(new Ellipse2D.Double(pt.x - radius, pt.y - radius, radius * 2, radius * 2));

            // Center dot
            g2.setColor(col);
            g2.fill(new Ellipse2D.Double(pt.x - 3.5, pt.y - 3.5, 7.0, 7.0));

            // Top label
            g2.setFont(new Font("SansSerif", Font.BOLD, 9));
            int lw = g2.getFontMetrics().stringWidth(labels[i]);
            g2.setColor(isSelected ? Color.WHITE : new Color(180, 175, 170));
            g2.drawString(labels[i], (float) (pt.x - lw / 2.0), (float) (pt.y - radius - 5));
        }
    }

    private void renderPen(Graphics2D g2, Pen pen) {
        Vector2D pos = pen.getPosition();
        double angle = pen.getAngle();
        double len = pen.getPenType().getStats().length();
        double width = pen.getPenType().getStats().width();

        Graphics2D pG = (Graphics2D) g2.create();
        pG.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        pG.translate(pos.x, pos.y);

        if (pen.isOutOfBounds()) {
            double prog = pen.getFallProgress();
            float alpha = (float) Math.max(0.0, 1.0 - prog * 0.9);
            pG.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, alpha));
            double scale = 1.0 - prog * 0.35;
            pG.scale(scale, scale);
            pG.translate(0, prog * 45.0);
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

        // 4. Chrome/Brass Conical Nib
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

        // 5. Back Cap and Pocket Clip
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

    private void renderAimingGuide(Graphics2D g2, Pen human, String flickPart) {
        Vector2D flickOrigin = human.getFlickPoint(flickPart);
        double dx = flickOrigin.x - currentDragPoint.x;
        double dy = flickOrigin.y - currentDragPoint.y;
        double dragLen = Math.sqrt(dx * dx + dy * dy);
        if (dragLen < 6.0) return;

        double maxDrag = 250.0;
        double powerFrac = Math.clamp(dragLen / maxDrag, 0.0, 1.0);
        double angle = Math.atan2(dy, dx);

        Color aimColor = "TIP".equalsIgnoreCase(flickPart)
                ? new Color(245, 158, 11)
                : "CENTER".equalsIgnoreCase(flickPart)
                ? new Color(56, 189, 248)
                : new Color(192, 132, 252);

        // Slingshot pull line from finger to flick origin
        g2.setColor(new Color(255, 255, 255, 90));
        g2.setStroke(new BasicStroke(2.0f, BasicStroke.CAP_BUTT, BasicStroke.JOIN_MITER, 10.0f, new float[]{4.0f, 4.0f}, 0.0f));
        g2.draw(new Line2D.Double(currentDragPoint.x, currentDragPoint.y, flickOrigin.x, flickOrigin.y));

        // Dotted forward trajectory
        g2.setStroke(new BasicStroke(3.5f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND, 10.0f, new float[]{8.0f, 6.0f}, 0.0f));
        g2.setColor(aimColor);

        double lineLen = Math.min(dragLen * 1.8, 380.0);
        double endX = flickOrigin.x + Math.cos(angle) * lineLen;
        double endY = flickOrigin.y + Math.sin(angle) * lineLen;
        g2.draw(new Line2D.Double(flickOrigin.x, flickOrigin.y, endX, endY));

        // Trajectory arrowhead
        double arrowSize = 14.0;
        Polygon arrow = new Polygon();
        arrow.addPoint((int) endX, (int) endY);
        arrow.addPoint((int) (endX - arrowSize * Math.cos(angle - 0.4)), (int) (endY - arrowSize * Math.sin(angle - 0.4)));
        arrow.addPoint((int) (endX - arrowSize * Math.cos(angle + 0.4)), (int) (endY - arrowSize * Math.sin(angle + 0.4)));
        g2.fill(arrow);

        // Power arc around the flick contact spot
        g2.setStroke(new BasicStroke(4.5f));
        g2.setColor(aimColor);
        g2.draw(new Arc2D.Double(flickOrigin.x - 28, flickOrigin.y - 28, 56, 56, 90, -(int) (360 * powerFrac), Arc2D.OPEN));

        // Predicted spin badge
        String spinText = switch (flickPart.toUpperCase()) {
            case "TIP" -> String.format("⚡ TIP FLICK · %d%% POWER · 🌀 WHIRLWIND SPIN", (int) (powerFrac * 100));
            case "CENTER" -> String.format("💥 CENTER FLICK · %d%% POWER · ⚡ STRAIGHT BULLET SLIDE", (int) (powerFrac * 100));
            default -> String.format("🔄 CAP FLICK · %d%% POWER · ↩ REVERSE WHIP SWEEP", (int) (powerFrac * 100));
        };

        g2.setFont(new Font("SansSerif", Font.BOLD, 10));
        int textW = g2.getFontMetrics().stringWidth(spinText);
        int badgeX = (int) (flickOrigin.x - textW / 2.0 - 10);
        int badgeY = (int) (flickOrigin.y - 45);

        g2.setColor(new Color(15, 12, 10, 220));
        g2.fill(new RoundRectangle2D.Double(badgeX, badgeY, textW + 20, 22, 8, 8));
        g2.setColor(aimColor);
        g2.setStroke(new BasicStroke(1.5f));
        g2.draw(new RoundRectangle2D.Double(badgeX, badgeY, textW + 20, 22, 8, 8));

        g2.setColor(Color.WHITE);
        g2.drawString(spinText, badgeX + 10, badgeY + 15);
    }

    private void renderHUD(Graphics2D g2, int w, int h) {
        var scoreMgr = gameManager.getScoreManager();

        int barW = 580;
        int barH = 56;
        int barX = (w - barW) / 2;
        int barY = 16;

        // Modern Glassmorphism panel
        g2.setColor(new Color(24, 19, 16, 235));
        g2.fill(new RoundRectangle2D.Double(barX, barY, barW, barH, 18, 18));
        g2.setColor(new Color(210, 160, 110, 80));
        g2.setStroke(new BasicStroke(1.5f));
        g2.draw(new RoundRectangle2D.Double(barX, barY, barW, barH, 18, 18));

        // Player Score Badge (Left)
        g2.setColor(new Color(59, 130, 246));
        g2.setFont(new Font("SansSerif", Font.BOLD, 12));
        g2.drawString("YOU", barX + 24, barY + 23);
        g2.setFont(new Font("Monospaced", Font.BOLD, 22));
        g2.setColor(Color.WHITE);
        g2.drawString(String.format("%02d", scoreMgr.getHumanScore()), barX + 24, barY + 47);

        // Center Status & Target
        g2.setColor(new Color(220, 195, 160, 180));
        g2.setFont(new Font("SansSerif", Font.BOLD, 10));
        String targetText = "FIRST TO " + scoreMgr.getTargetScore();
        int tw = g2.getFontMetrics().stringWidth(targetText);
        g2.drawString(targetText, w / 2 - tw / 2, barY + 20);

        String statusText = switch (gameManager.getTurnState()) {
            case HUMAN_AIMING -> "YOUR TURN · FLICKING: " + gameManager.getSelectedFlickPart();
            case HUMAN_RESOLVING -> "PEN GLIDING & SPINNING...";
            case COMPUTER_THINKING -> "OPPONENT FLICKING: " + gameManager.getBotFlickPart();
            case COMPUTER_RESOLVING -> "OPPONENT PEN SHOT...";
            case ROUND_RESOLVED -> scoreMgr.isRoundScored() ? "PEN KNOCKED OFF!" : "RESOLVING...";
            case ROUND_RESET -> "RESETTING PENS...";
        };
        g2.setFont(new Font("SansSerif", Font.BOLD, 12));
        g2.setColor(gameManager.getTurnState() == TurnState.HUMAN_AIMING ? new Color(52, 211, 153) : new Color(251, 191, 36));
        int sw = g2.getFontMetrics().stringWidth(statusText);
        g2.drawString(statusText, w / 2 - sw / 2, barY + 43);

        // Opponent Score Badge (Right)
        g2.setColor(new Color(239, 68, 68));
        g2.setFont(new Font("SansSerif", Font.BOLD, 12));
        g2.drawString("BOT", barX + barW - 65, barY + 23);
        g2.setFont(new Font("Monospaced", Font.BOLD, 22));
        g2.setColor(Color.WHITE);
        g2.drawString(String.format("%02d", scoreMgr.getComputerScore()), barX + barW - 65, barY + 47);
    }

    private void renderBottomDock(Graphics2D g2, int w, int h) {
        int dockW = 680;
        int dockH = 46;
        int dockX = (w - dockW) / 2;
        int dockY = h - 68;

        // Modern floating dock
        g2.setColor(new Color(22, 17, 14, 230));
        g2.fill(new RoundRectangle2D.Double(dockX, dockY, dockW, dockH, 16, 16));
        g2.setColor(new Color(60, 48, 38, 150));
        g2.setStroke(new BasicStroke(1.2f));
        g2.draw(new RoundRectangle2D.Double(dockX, dockY, dockW, dockH, 16, 16));

        // Dock buttons
        String current = gameManager.getSelectedFlickPart();

        drawDockPill(g2, dockX + 16, dockY + 8, "⚡ Tip (Spin) [1]", "TIP".equalsIgnoreCase(current), new Color(245, 158, 11));
        drawDockPill(g2, dockX + 155, dockY + 8, "💥 Center (Push) [2]", "CENTER".equalsIgnoreCase(current), new Color(56, 189, 248));
        drawDockPill(g2, dockX + 310, dockY + 8, "🔄 Cap (Whip) [3]", "CAP".equalsIgnoreCase(current), new Color(192, 132, 252));
        drawDockPill(g2, dockX + 460, dockY + 8, "ℹ Ratul Ahmed / Rules [H]", showHelpOverlay, new Color(251, 191, 36));

        // Bottom micro tip
        g2.setFont(new Font("SansSerif", Font.PLAIN, 11));
        g2.setColor(new Color(180, 165, 150, 140));
        String tip = "Click Tip/Center/Cap on your blue pen to pick flick spot · Drag to aim · [1-3] Keys · [H] Developer Info";
        int tipW = g2.getFontMetrics().stringWidth(tip);
        g2.drawString(tip, w / 2 - tipW / 2, h - 10);
    }

    private void drawDockPill(Graphics2D g2, int x, int y, String label, boolean active, Color accent) {
        int pw = 135;
        if (label.contains("Ratul")) pw = 205;
        int ph = 30;

        g2.setColor(active ? new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), 60) : new Color(35, 28, 24, 180));
        g2.fill(new RoundRectangle2D.Double(x, y, pw, ph, 10, 10));
        g2.setColor(active ? accent : new Color(75, 60, 50));
        g2.setStroke(new BasicStroke(active ? 1.8f : 1.0f));
        g2.draw(new RoundRectangle2D.Double(x, y, pw, ph, 10, 10));

        g2.setFont(new Font("SansSerif", Font.BOLD, 11));
        g2.setColor(active ? Color.WHITE : new Color(190, 180, 170));
        int lw = g2.getFontMetrics().stringWidth(label);
        g2.drawString(label, x + (pw - lw) / 2, y + 19);
    }

    private void renderHelpOverlay(Graphics2D g2, int w, int h) {
        g2.setColor(new Color(0, 0, 0, 200));
        g2.fillRect(0, 0, w, h);

        int modalW = 560;
        int modalH = 430;
        int modalX = (w - modalW) / 2;
        int modalY = (h - modalH) / 2;

        // Dialog background
        g2.setColor(new Color(28, 22, 18));
        g2.fill(new RoundRectangle2D.Double(modalX, modalY, modalW, modalH, 20, 20));
        g2.setColor(new Color(245, 158, 11, 140));
        g2.setStroke(new BasicStroke(2.0f));
        g2.draw(new RoundRectangle2D.Double(modalX, modalY, modalW, modalH, 20, 20));

        // Developer Card Box
        int cardX = modalX + 24;
        int cardY = modalY + 24;
        int cardW = modalW - 48;
        int cardH = 75;

        g2.setColor(new Color(42, 30, 20));
        g2.fill(new RoundRectangle2D.Double(cardX, cardY, cardW, cardH, 12, 12));
        g2.setColor(new Color(245, 158, 11, 180));
        g2.setStroke(new BasicStroke(1.2f));
        g2.draw(new RoundRectangle2D.Double(cardX, cardY, cardW, cardH, 12, 12));

        g2.setColor(new Color(251, 191, 36));
        g2.setFont(new Font("SansSerif", Font.BOLD, 10));
        g2.drawString("LEAD GAME DEVELOPER & 2D PHYSICS ARCHITECT", cardX + 16, cardY + 22);

        g2.setColor(Color.WHITE);
        g2.setFont(new Font("SansSerif", Font.BOLD, 18));
        g2.drawString("Ratul Ahmed", cardX + 16, cardY + 46);

        g2.setColor(new Color(210, 200, 190));
        g2.setFont(new Font("SansSerif", Font.PLAIN, 12));
        g2.drawString("Email: ratul101ahmed@gmail.com", cardX + 16, cardY + 64);

        // Physics & Rules Content
        int textY = cardY + cardH + 28;
        g2.setColor(new Color(251, 191, 36));
        g2.setFont(new Font("SansSerif", Font.BOLD, 16));
        g2.drawString("Pen Contact & Spin Physics Mechanics", cardX, textY);

        g2.setColor(new Color(220, 210, 200));
        g2.setFont(new Font("SansSerif", Font.PLAIN, 12));
        String[] lines = new String[] {
                "• In Kolom Kolom, you choose which part of your OWN pen to flick:",
                "  ⚡ Tip (Nib): High off-center lever arm (r = +0.44 L) creates whirlwind propeller spin (tau = r x J)!",
                "  💥 Center (Body): Hits the center of mass for pure bullet linear slide across the desk.",
                "  🔄 Cap (Clip): Strikes the rear end to deliver a wide reverse-whip sweeping arc.",
                "",
                "• Knocking the opponent's pen off the wooden bench scores 1 point.",
                "• Avoid flying off the bench yourself! First player to reach the target score wins.",
                "",
                "Shortcuts: [1] Tip · [2] Center · [3] Cap · [H] Close Help · [Esc] Pause"
        };

        textY += 22;
        for (String line : lines) {
            g2.drawString(line, cardX, textY);
            textY += 18;
        }

        // Close Button
        int btnW = 180;
        int btnH = 34;
        int btnX = modalX + (modalW - btnW) / 2;
        int btnY = modalY + modalH - 52;

        g2.setColor(new Color(217, 119, 6));
        g2.fill(new RoundRectangle2D.Double(btnX, btnY, btnW, btnH, 10, 10));
        g2.setColor(Color.WHITE);
        g2.setFont(new Font("SansSerif", Font.BOLD, 13));
        int clw = g2.getFontMetrics().stringWidth("CLOSE & RETURN (H)");
        g2.drawString("CLOSE & RETURN (H)", btnX + (btnW - clw) / 2, btnY + 22);
    }

    private void renderPauseOverlay(Graphics2D g2, int w, int h) {
        g2.setColor(new Color(0, 0, 0, 180));
        g2.fillRect(0, 0, w, h);

        g2.setColor(Color.WHITE);
        g2.setFont(new Font("SansSerif", Font.BOLD, 36));
        String paused = "GAME PAUSED";
        int pw = g2.getFontMetrics().stringWidth(paused);
        g2.drawString(paused, w / 2 - pw / 2, h / 2 - 20);

        g2.setFont(new Font("SansSerif", Font.PLAIN, 15));
        g2.setColor(new Color(220, 210, 200));
        String hint = "Press ESC to Resume or [H] for Developer & Rules";
        int hw = g2.getFontMetrics().stringWidth(hint);
        g2.drawString(hint, w / 2 - hw / 2, h / 2 + 25);
    }

    // Mouse Controls
    @Override
    public void mousePressed(MouseEvent e) {
        if (showHelpOverlay) {
            showHelpOverlay = false;
            repaint();
            return;
        }

        int w = getWidth();
        int h = getHeight();

        // Check clicks on bottom dock buttons
        int dockW = 680;
        int dockH = 46;
        int dockX = (w - dockW) / 2;
        int dockY = h - 68;

        if (e.getX() >= dockX && e.getX() <= dockX + dockW && e.getY() >= dockY && e.getY() <= dockY + dockH) {
            int relX = e.getX() - dockX;
            if (relX >= 16 && relX < 150) {
                gameManager.setSelectedFlickPart("TIP");
            } else if (relX >= 155 && relX < 305) {
                gameManager.setSelectedFlickPart("CENTER");
            } else if (relX >= 310 && relX < 455) {
                gameManager.setSelectedFlickPart("CAP");
            } else if (relX >= 460 && relX < 665) {
                showHelpOverlay = true;
            }
            repaint();
            return;
        }

        if (gameManager.getGameState() != GameState.PLAYING) return;
        if (gameManager.getTurnState() != TurnState.HUMAN_AIMING) return;

        Pen humanPen = gameManager.getHumanPen();
        if (humanPen == null || humanPen.isOutOfBounds()) return;

        Vector2D clickPos = new Vector2D(e.getX(), e.getY());

        // 1. Check if user clicked directly on one of the 3 flick contact spots on their own pen
        Vector2D tipPt = humanPen.getFlickPoint("TIP");
        Vector2D centerPt = humanPen.getFlickPoint("CENTER");
        Vector2D capPt = humanPen.getFlickPoint("CAP");

        if (clickPos.distanceTo(tipPt) < 22.0) {
            gameManager.setSelectedFlickPart("TIP");
            isAiming = true;
            dragStartPoint = e.getPoint();
            currentDragPoint = e.getPoint();
            repaint();
            return;
        }

        if (clickPos.distanceTo(centerPt) < 22.0) {
            gameManager.setSelectedFlickPart("CENTER");
            isAiming = true;
            dragStartPoint = e.getPoint();
            currentDragPoint = e.getPoint();
            repaint();
            return;
        }

        if (clickPos.distanceTo(capPt) < 22.0) {
            gameManager.setSelectedFlickPart("CAP");
            isAiming = true;
            dragStartPoint = e.getPoint();
            currentDragPoint = e.getPoint();
            repaint();
            return;
        }

        // 2. Or click on pen body
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
        if (isAiming && currentDragPoint != null) {
            Pen humanPen = gameManager.getHumanPen();
            if (humanPen != null && !humanPen.isOutOfBounds()) {
                Vector2D flickOrigin = humanPen.getFlickPoint(gameManager.getSelectedFlickPart());
                double dx = flickOrigin.x - currentDragPoint.x;
                double dy = flickOrigin.y - currentDragPoint.y;
                Vector2D impulse = new Vector2D(dx * 3.4, dy * 3.4);

                isAiming = false;
                dragStartPoint = null;
                currentDragPoint = null;

                gameManager.executeHumanShot(impulse, gameManager.getSelectedFlickPart());
                repaint();
                return;
            }
        }
        isAiming = false;
        dragStartPoint = null;
        currentDragPoint = null;
    }

    @Override public void mouseClicked(MouseEvent e) {}
    @Override public void mouseEntered(MouseEvent e) {}
    @Override public void mouseExited(MouseEvent e) {}
    @Override public void mouseMoved(MouseEvent e) {}
}
