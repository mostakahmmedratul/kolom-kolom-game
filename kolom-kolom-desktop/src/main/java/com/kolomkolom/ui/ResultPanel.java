package com.kolomkolom.ui;

import com.kolomkolom.manager.GameManager;

import javax.swing.*;
import java.awt.*;
import java.awt.geom.RoundRectangle2D;

/**
 * Modern, stylish match result screen displaying victory or defeat with animated styling.
 */
public class ResultPanel extends JPanel {
    private final GameManager gameManager;
    private final GameWindow gameWindow;

    private JLabel resultTitle;
    private JLabel scoreSummary;
    private JLabel winnerSubtext;

    public ResultPanel(GameManager gameManager, GameWindow gameWindow) {
        this.gameManager = gameManager;
        this.gameWindow = gameWindow;
        setLayout(new GridBagLayout());
        setBackground(new Color(18, 14, 12));

        buildUI();
    }

    private void buildUI() {
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(10, 12, 10, 12);
        gbc.gridx = 0;
        gbc.fill = GridBagConstraints.HORIZONTAL;

        resultTitle = new JLabel("MATCH RESULT", SwingConstants.CENTER);
        resultTitle.setFont(new Font("SansSerif", Font.BOLD, 48));
        resultTitle.setForeground(new Color(251, 191, 36));
        gbc.gridy = 0;
        gbc.insets = new Insets(20, 12, 6, 12);
        add(resultTitle, gbc);

        winnerSubtext = new JLabel("Desk Duel Concluded", SwingConstants.CENTER);
        winnerSubtext.setFont(new Font("SansSerif", Font.PLAIN, 15));
        winnerSubtext.setForeground(new Color(200, 180, 160));
        gbc.gridy = 1;
        gbc.insets = new Insets(0, 12, 24, 12);
        add(winnerSubtext, gbc);

        // Modern scoreboard box
        JPanel scoreBox = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(new Color(28, 22, 18));
                g2.fill(new RoundRectangle2D.Double(0, 0, getWidth(), getHeight(), 16, 16));
                g2.setColor(new Color(65, 52, 42));
                g2.setStroke(new BasicStroke(1.5f));
                g2.draw(new RoundRectangle2D.Double(0, 0, getWidth() - 1, getHeight() - 1, 16, 16));
                g2.dispose();
                super.paintComponent(g);
            }
        };
        scoreBox.setOpaque(false);
        scoreBox.setLayout(new BorderLayout());
        scoreBox.setBorder(BorderFactory.createEmptyBorder(16, 32, 16, 32));

        scoreSummary = new JLabel("YOU: 00  ·  BOT: 00", SwingConstants.CENTER);
        scoreSummary.setFont(new Font("Monospaced", Font.BOLD, 32));
        scoreSummary.setForeground(Color.WHITE);
        scoreBox.add(scoreSummary, BorderLayout.CENTER);

        gbc.gridy = 2;
        gbc.insets = new Insets(0, 12, 32, 12);
        add(scoreBox, gbc);

        JButton replayBtn = createModernButton("⚡ PLAY ANOTHER MATCH", new Color(16, 185, 129));
        replayBtn.addActionListener(e -> {
            gameManager.startNewMatch();
            gameWindow.showCard("GAME");
        });
        gbc.gridy = 3;
        gbc.insets = new Insets(6, 12, 6, 12);
        add(replayBtn, gbc);

        JButton menuBtn = createModernButton("↩ RETURN TO MAIN MENU", new Color(55, 65, 81));
        menuBtn.addActionListener(e -> gameWindow.showCard("MENU"));
        gbc.gridy = 4;
        add(menuBtn, gbc);
    }

    private JButton createModernButton(String text, Color baseColor) {
        JButton btn = new JButton(text) {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(baseColor);
                g2.fill(new RoundRectangle2D.Double(0, 0, getWidth(), getHeight(), 12, 12));
                g2.setColor(Color.WHITE);
                g2.setFont(getFont());
                FontMetrics fm = g2.getFontMetrics();
                int x = (getWidth() - fm.stringWidth(getText())) / 2;
                int y = (getHeight() + fm.getAscent() - fm.getDescent()) / 2;
                g2.drawString(getText(), x, y);
                g2.dispose();
            }
        };
        btn.setFont(new Font("SansSerif", Font.BOLD, 14));
        btn.setForeground(Color.WHITE);
        btn.setPreferredSize(new Dimension(320, 44));
        btn.setContentAreaFilled(false);
        btn.setBorderPainted(false);
        btn.setFocusPainted(false);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        return btn;
    }

    public void updateResults() {
        boolean won = gameManager.getScoreManager().isHumanWinner();
        resultTitle.setText(won ? "VICTORY! DESK CHAMPION" : "DEFEAT! KNOCKED OFF");
        resultTitle.setForeground(won ? new Color(52, 211, 153) : new Color(239, 68, 68));
        winnerSubtext.setText(won
                ? "You knocked the computer opponent off the wooden bench!"
                : "The computer outplayed your angles and pushed you off the edge.");

        scoreSummary.setText(String.format("YOU: %02d  ·  BOT: %02d",
                gameManager.getScoreManager().getHumanScore(),
                gameManager.getScoreManager().getComputerScore()));
    }
}
