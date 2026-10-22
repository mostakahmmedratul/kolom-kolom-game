package com.kolomkolom.ui;

import com.kolomkolom.manager.GameManager;
import com.kolomkolom.model.GameState;
import com.kolomkolom.model.TurnState;

import javax.swing.*;
import java.awt.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;

/**
 * Top-level application window managing screen transitions and Swing EDT lifecycle.
 */
public class GameWindow extends JFrame implements GameManager.GameListener {
    private final GameManager gameManager;
    private final CardLayout cardLayout;
    private final JPanel rootCardPanel;

    private final GamePanel gamePanel;
    private final MenuPanel menuPanel;
    private final PenSelectionPanel penSelectionPanel;
    private final ResultPanel resultPanel;

    public GameWindow(GameManager gameManager) {
        super("Kolom Kolom — Realistic Pen Desktop Game");
        this.gameManager = gameManager;

        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1280, 720);
        setMinimumSize(new Dimension(960, 540));
        setLocationRelativeTo(null);

        cardLayout = new CardLayout();
        rootCardPanel = new JPanel(cardLayout);

        gamePanel = new GamePanel(gameManager);
        menuPanel = new MenuPanel(gameManager, this);
        penSelectionPanel = new PenSelectionPanel(gameManager, this);
        resultPanel = new ResultPanel(gameManager, this);

        rootCardPanel.add(menuPanel, "MENU");
        rootCardPanel.add(gamePanel, "GAME");
        rootCardPanel.add(penSelectionPanel, "PEN_SELECT");
        rootCardPanel.add(resultPanel, "RESULT");

        setContentPane(rootCardPanel);

        gameManager.setGameListener(this);

        addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                gameManager.stop();
                gameManager.getAudioManager().shutdown();
            }
        });

        showCard("MENU");
    }

    public void showCard(String cardName) {
        cardLayout.show(rootCardPanel, cardName);
        if ("GAME".equals(cardName)) {
            gamePanel.requestFocusInWindow();
        }
    }

    public void refreshPenSelection() {
        showCard("PEN_SELECT");
    }

    @Override
    public void onStateChanged(GameState state) {
        SwingUtilities.invokeLater(() -> {
            switch (state) {
                case MENU -> showCard("MENU");
                case PLAYING, PAUSED -> showCard("GAME");
                case GAME_OVER -> {
                    resultPanel.updateResults();
                    showCard("RESULT");
                }
                case PEN_SELECTION -> showCard("PEN_SELECT");
                default -> {}
            }
        });
    }

    @Override
    public void onTurnChanged(TurnState turn) {
        SwingUtilities.invokeLater(gamePanel::repaint);
    }

    @Override
    public void onScoreUpdated(int humanScore, int computerScore) {
        SwingUtilities.invokeLater(gamePanel::repaint);
    }

    @Override
    public void onRepaintRequested() {
        gamePanel.repaint();
    }
}
