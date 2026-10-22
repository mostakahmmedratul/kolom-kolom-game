package com.kolomkolom.ui;

import com.kolomkolom.manager.GameManager;

import javax.swing.*;
import java.awt.*;

/**
 * Screen displayed at match conclusion showing victory/defeat and replay options.
 */
public class ResultPanel extends JPanel {
    private final GameManager gameManager;
    private final GameWindow gameWindow;

    private JLabel resultTitle;
    private JLabel scoreSummary;

    public ResultPanel(GameManager gameManager, GameWindow gameWindow) {
        this.gameManager = gameManager;
        this.gameWindow = gameWindow;
        setLayout(new GridBagLayout());
        setBackground(new Color(22, 18, 15));

        buildUI();
    }

    private void buildUI() {
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(12, 12, 12, 12);
        gbc.gridx = 0;
        gbc.fill = GridBagConstraints.HORIZONTAL;

        resultTitle = new JLabel("MATCH RESULT", SwingConstants.CENTER);
        resultTitle.setFont(new Font("SansSerif", Font.BOLD, 46));
        resultTitle.setForeground(new Color(245, 195, 120));
        gbc.gridy = 0;
        add(resultTitle, gbc);

        scoreSummary = new JLabel("YOU: 0 · BOT: 0", SwingConstants.CENTER);
        scoreSummary.setFont(new Font("Monospaced", Font.BOLD, 28));
        scoreSummary.setForeground(Color.WHITE);
        gbc.gridy = 1;
        gbc.insets = new Insets(6, 12, 30, 12);
        add(scoreSummary, gbc);

        JButton replayBtn = new JButton("PLAY AGAIN");
        replayBtn.setFont(new Font("SansSerif", Font.BOLD, 16));
        replayBtn.setForeground(Color.WHITE);
        replayBtn.setBackground(new Color(38, 135, 68));
        replayBtn.setBorder(BorderFactory.createEmptyBorder(12, 32, 12, 32));
        replayBtn.addActionListener(e -> {
            gameManager.startNewMatch();
            gameWindow.showCard("GAME");
        });
        gbc.gridy = 2;
        gbc.insets = new Insets(8, 12, 8, 12);
        add(replayBtn, gbc);

        JButton menuBtn = new JButton("MAIN MENU");
        menuBtn.setFont(new Font("SansSerif", Font.BOLD, 15));
        menuBtn.setForeground(Color.WHITE);
        menuBtn.setBackground(new Color(60, 65, 75));
        menuBtn.setBorder(BorderFactory.createEmptyBorder(12, 32, 12, 32));
        menuBtn.addActionListener(e -> gameWindow.showCard("MENU"));
        gbc.gridy = 3;
        add(menuBtn, gbc);
    }

    public void updateResults() {
        boolean won = gameManager.getScoreManager().isHumanWinner();
        resultTitle.setText(won ? "VICTORY! BENCH CHAMPION" : "DEFEAT! KNOCKED OFF");
        resultTitle.setForeground(won ? new Color(100, 225, 130) : new Color(245, 90, 80));

        scoreSummary.setText(String.format("YOU: %02d  ·  BOT: %02d",
                gameManager.getScoreManager().getHumanScore(),
                gameManager.getScoreManager().getComputerScore()));
    }
}
