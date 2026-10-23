package com.kolomkolom.ui;

import com.kolomkolom.ai.AIDifficulty;
import com.kolomkolom.manager.GameManager;

import javax.swing.*;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.geom.RoundRectangle2D;

/**
 * Modern, stylish main menu screen for the Kolom Kolom desktop game.
 * Features dark carbon aesthetics, warm gold branding, interactive buttons,
 * and developer accreditation for Ratul Ahmed.
 */
public class MenuPanel extends JPanel {
    private final GameManager gameManager;
    private final GameWindow gameWindow;

    public MenuPanel(GameManager gameManager, GameWindow gameWindow) {
        this.gameManager = gameManager;
        this.gameWindow = gameWindow;
        setLayout(new GridBagLayout());
        setBackground(new Color(20, 16, 13));

        buildUI();
    }

    private void buildUI() {
        removeAll();
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(8, 12, 8, 12);
        gbc.gridx = 0;
        gbc.fill = GridBagConstraints.HORIZONTAL;

        // Title Lockup with Gold/Amber Glow
        JLabel titleLabel = new JLabel("KOLOM KOLOM", SwingConstants.CENTER);
        titleLabel.setFont(new Font("SansSerif", Font.BOLD, 54));
        titleLabel.setForeground(new Color(251, 191, 36));
        gbc.gridy = 0;
        gbc.insets = new Insets(16, 12, 2, 12);
        add(titleLabel, gbc);

        JLabel subtitleLabel = new JLabel("Authentic Schoolyard Wooden Desk Pen Duel", SwingConstants.CENTER);
        subtitleLabel.setFont(new Font("SansSerif", Font.PLAIN, 15));
        subtitleLabel.setForeground(new Color(210, 185, 160));
        gbc.gridy = 1;
        gbc.insets = new Insets(0, 12, 12, 12);
        add(subtitleLabel, gbc);

        // Developer Tag Banner
        JPanel devBanner = new JPanel();
        devBanner.setOpaque(false);
        JLabel devLabel = new JLabel("★ Lead Developer: Ratul Ahmed · ratul101ahmed@gmail.com ★", SwingConstants.CENTER);
        devLabel.setFont(new Font("SansSerif", Font.BOLD, 12));
        devLabel.setForeground(new Color(245, 158, 11));
        devBanner.add(devLabel);
        gbc.gridy = 2;
        gbc.insets = new Insets(0, 12, 22, 12);
        add(devBanner, gbc);

        // Main Menu Action Buttons
        gbc.insets = new Insets(6, 12, 6, 12);

        JButton playBtn = createModernButton("⚡ PLAY MATCH", new Color(16, 185, 129), new Color(5, 150, 105));
        playBtn.addActionListener(e -> {
            gameManager.startNewMatch();
            gameWindow.showCard("GAME");
        });
        gbc.gridy = 3;
        add(playBtn, gbc);

        JButton penBtn = createModernButton("✒ PEN SELECTION (" + gameManager.getSettings().getSelectedPenType().getDisplayName() + ")", new Color(37, 99, 235), new Color(29, 78, 216));
        penBtn.addActionListener(e -> gameWindow.showCard("PEN_SELECT"));
        gbc.gridy = 4;
        add(penBtn, gbc);

        JButton diffBtn = createModernButton("🎯 AI DIFFICULTY: " + gameManager.getSettings().getDifficulty().name(), new Color(147, 51, 234), new Color(126, 34, 206));
        diffBtn.addActionListener(e -> {
            AIDifficulty next = switch (gameManager.getSettings().getDifficulty()) {
                case EASY -> AIDifficulty.MEDIUM;
                case MEDIUM -> AIDifficulty.HARD;
                case HARD -> AIDifficulty.EASY;
            };
            gameManager.getSettings().setDifficulty(next);
            diffBtn.setText("🎯 AI DIFFICULTY: " + next.name() + " (" + next.getTitle() + ")");
        });
        gbc.gridy = 5;
        add(diffBtn, gbc);

        JButton targetBtn = createModernButton("🏆 TARGET SCORE: " + gameManager.getSettings().getTargetScore() + " POINTS", new Color(217, 119, 6), new Color(180, 83, 9));
        targetBtn.addActionListener(e -> {
            int next = gameManager.getSettings().getTargetScore() == 10 ? 15 : 10;
            gameManager.getSettings().setTargetScore(next);
            targetBtn.setText("🏆 TARGET SCORE: " + next + " POINTS");
        });
        gbc.gridy = 6;
        add(targetBtn, gbc);

        JButton guideBtn = createModernButton("ℹ DEVELOPER INFO & PHYSICS GUIDE", new Color(75, 85, 99), new Color(55, 65, 81));
        guideBtn.addActionListener(e -> showDeveloperDialog());
        gbc.gridy = 7;
        add(guideBtn, gbc);

        JButton quitBtn = createModernButton("✕ EXIT TO DESKTOP", new Color(153, 27, 27), new Color(127, 29, 29));
        quitBtn.addActionListener(e -> System.exit(0));
        gbc.gridy = 8;
        add(quitBtn, gbc);
    }

    private void showDeveloperDialog() {
        JOptionPane.showMessageDialog(this,
                "★ KOLOM KOLOM — REALISTIC PEN DESKTOP GAME ★\n\n" +
                "Lead Game Developer: Ratul Ahmed\n" +
                "Contact: ratul101ahmed@gmail.com\n\n" +
                "Physics Dynamics & Own-Pen Flicking:\n" +
                "• Choose which part of your own pen to flick:\n" +
                "  - Tip (Front Nib): Produces off-center lever torque, causing rapid whirlwind spin.\n" +
                "  - Center (Body): Delivers pure linear force for laser-straight slides.\n" +
                "  - Cap (Back Clip): Launches with reverse whip spin.\n\n" +
                "• Knock the computer opponent off the wooden bench to score 1 point!\n" +
                "• First to reach the target score wins the match.",
                "Developer Accreditation & Game Guide",
                JOptionPane.INFORMATION_MESSAGE);
    }

    private JButton createModernButton(String text, Color baseColor, Color hoverColor) {
        JButton btn = new JButton(text) {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                boolean isHover = getModel().isRollover();

                g2.setColor(isHover ? hoverColor : baseColor);
                g2.fill(new RoundRectangle2D.Double(0, 0, getWidth(), getHeight(), 14, 14));

                g2.setColor(new Color(255, 255, 255, isHover ? 60 : 30));
                g2.setStroke(new BasicStroke(1.2f));
                g2.draw(new RoundRectangle2D.Double(0, 0, getWidth() - 1, getHeight() - 1, 14, 14));

                FontMetrics fm = g2.getFontMetrics();
                int x = (getWidth() - fm.stringWidth(getText())) / 2;
                int y = (getHeight() + fm.getAscent() - fm.getDescent()) / 2;
                g2.setColor(Color.WHITE);
                g2.setFont(getFont());
                g2.drawString(getText(), x, y);

                g2.dispose();
            }
        };

        btn.setFont(new Font("SansSerif", Font.BOLD, 14));
        btn.setForeground(Color.WHITE);
        btn.setPreferredSize(new Dimension(380, 44));
        btn.setContentAreaFilled(false);
        btn.setBorderPainted(false);
        btn.setFocusPainted(false);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));

        btn.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseEntered(MouseEvent e) { btn.repaint(); }
            @Override
            public void mouseExited(MouseEvent e) { btn.repaint(); }
        });

        return btn;
    }
}
