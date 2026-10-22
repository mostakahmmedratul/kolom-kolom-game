package com.kolomkolom.ui;

import com.kolomkolom.ai.AIDifficulty;
import com.kolomkolom.manager.GameManager;
import com.kolomkolom.model.GameState;

import javax.swing.*;
import java.awt.*;

/**
 * Main menu screen presenting game start, pen customization,
 * difficulty toggle, target score setting, and exit options.
 */
public class MenuPanel extends JPanel {
    private final GameManager gameManager;
    private final GameWindow gameWindow;

    public MenuPanel(GameManager gameManager, GameWindow gameWindow) {
        this.gameManager = gameManager;
        this.gameWindow = gameWindow;
        setLayout(new GridBagLayout());
        setBackground(new Color(28, 22, 18));

        buildUI();
    }

    private void buildUI() {
        removeAll();
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(10, 10, 10, 10);
        gbc.gridx = 0;
        gbc.fill = GridBagConstraints.HORIZONTAL;

        // Title Lockup
        JLabel titleLabel = new JLabel("KOLOM KOLOM", SwingConstants.CENTER);
        titleLabel.setFont(new Font("SansSerif", Font.BOLD, 52));
        titleLabel.setForeground(new Color(245, 195, 130));
        gbc.gridy = 0;
        gbc.insets = new Insets(20, 10, 4, 10);
        add(titleLabel, gbc);

        JLabel subtitleLabel = new JLabel("Authentic Schoolyard Desk Pen Flicking Game", SwingConstants.CENTER);
        subtitleLabel.setFont(new Font("SansSerif", Font.PLAIN, 16));
        subtitleLabel.setForeground(new Color(190, 165, 140));
        gbc.gridy = 1;
        gbc.insets = new Insets(0, 10, 30, 10);
        add(subtitleLabel, gbc);

        // Buttons
        gbc.insets = new Insets(8, 10, 8, 10);

        JButton playBtn = createStyledButton("PLAY MATCH", new Color(40, 140, 70));
        playBtn.addActionListener(e -> {
            gameManager.startNewMatch();
            gameWindow.showCard("GAME");
        });
        gbc.gridy = 2;
        add(playBtn, gbc);

        JButton penBtn = createStyledButton("PEN SELECTION (" + gameManager.getSettings().getSelectedPenType().getDisplayName() + ")", new Color(45, 95, 180));
        penBtn.addActionListener(e -> gameWindow.showCard("PEN_SELECT"));
        gbc.gridy = 3;
        add(penBtn, gbc);

        JButton diffBtn = createStyledButton("DIFFICULTY: " + gameManager.getSettings().getDifficulty().name(), new Color(130, 75, 180));
        diffBtn.addActionListener(e -> {
            AIDifficulty next = switch (gameManager.getSettings().getDifficulty()) {
                case EASY -> AIDifficulty.MEDIUM;
                case MEDIUM -> AIDifficulty.HARD;
                case HARD -> AIDifficulty.EASY;
            };
            gameManager.getSettings().setDifficulty(next);
            diffBtn.setText("DIFFICULTY: " + next.name() + " (" + next.getTitle() + ")");
        });
        gbc.gridy = 4;
        add(diffBtn, gbc);

        JButton targetBtn = createStyledButton("TARGET SCORE: " + gameManager.getSettings().getTargetScore() + " POINTS", new Color(175, 105, 35));
        targetBtn.addActionListener(e -> {
            int next = gameManager.getSettings().getTargetScore() == 10 ? 15 : 10;
            gameManager.getSettings().setTargetScore(next);
            targetBtn.setText("TARGET SCORE: " + next + " POINTS");
        });
        gbc.gridy = 5;
        add(targetBtn, gbc);

        JButton muteBtn = createStyledButton("SOUND: " + (gameManager.getSettings().isMuted() ? "MUTED" : "ON"), new Color(90, 95, 105));
        muteBtn.addActionListener(e -> {
            boolean muted = !gameManager.getSettings().isMuted();
            gameManager.getSettings().setMuted(muted);
            muteBtn.setText("SOUND: " + (muted ? "MUTED" : "ON"));
        });
        gbc.gridy = 6;
        add(muteBtn, gbc);

        JButton quitBtn = createStyledButton("QUIT GAME", new Color(75, 30, 30));
        quitBtn.addActionListener(e -> System.exit(0));
        gbc.gridy = 7;
        add(quitBtn, gbc);
    }

    private JButton createStyledButton(String text, Color bg) {
        JButton btn = new JButton(text);
        btn.setFont(new Font("SansSerif", Font.BOLD, 15));
        btn.setForeground(Color.WHITE);
        btn.setBackground(bg);
        btn.setFocusPainted(false);
        btn.setBorder(BorderFactory.createEmptyBorder(12, 28, 12, 28));
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        return btn;
    }
}
