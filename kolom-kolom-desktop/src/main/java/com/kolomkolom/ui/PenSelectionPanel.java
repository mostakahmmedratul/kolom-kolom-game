package com.kolomkolom.ui;

import com.kolomkolom.manager.GameManager;
import com.kolomkolom.model.PenType;

import javax.swing.*;
import java.awt.*;

/**
 * Screen displaying the three distinct school pens with physical stat bars.
 */
public class PenSelectionPanel extends JPanel {
    private final GameManager gameManager;
    private final GameWindow gameWindow;

    public PenSelectionPanel(GameManager gameManager, GameWindow gameWindow) {
        this.gameManager = gameManager;
        this.gameWindow = gameWindow;
        setLayout(new BorderLayout());
        setBackground(new Color(24, 20, 16));

        // Header
        JLabel headerLabel = new JLabel("SELECT YOUR WEAPON", SwingConstants.CENTER);
        headerLabel.setFont(new Font("SansSerif", Font.BOLD, 32));
        headerLabel.setForeground(new Color(240, 195, 130));
        headerLabel.setBorder(BorderFactory.createEmptyBorder(28, 10, 15, 10));
        add(headerLabel, BorderLayout.NORTH);

        // Center: Cards for each pen
        JPanel cardsPanel = new JPanel(new GridLayout(1, 3, 20, 20));
        cardsPanel.setBackground(new Color(24, 20, 16));
        cardsPanel.setBorder(BorderFactory.createEmptyBorder(15, 30, 25, 30));

        for (PenType type : PenType.values()) {
            cardsPanel.add(createPenCard(type));
        }
        add(cardsPanel, BorderLayout.CENTER);

        // Bottom: Back button
        JPanel bottomPanel = new JPanel();
        bottomPanel.setBackground(new Color(24, 20, 16));
        JButton backBtn = new JButton("RETURN TO MENU");
        backBtn.setFont(new Font("SansSerif", Font.BOLD, 15));
        backBtn.setForeground(Color.WHITE);
        backBtn.setBackground(new Color(60, 65, 75));
        backBtn.setBorder(BorderFactory.createEmptyBorder(10, 24, 10, 24));
        backBtn.addActionListener(e -> gameWindow.showCard("MENU"));
        bottomPanel.add(backBtn);
        add(bottomPanel, BorderLayout.SOUTH);
    }

    private JPanel createPenCard(PenType type) {
        JPanel card = new JPanel();
        card.setLayout(new BoxLayout(card, BoxLayout.Y_AXIS));
        boolean isSelected = gameManager.getSettings().getSelectedPenType() == type;
        card.setBackground(isSelected ? new Color(42, 34, 26) : new Color(32, 26, 21));
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(isSelected ? new Color(245, 195, 120) : new Color(60, 50, 42), isSelected ? 2 : 1),
                BorderFactory.createEmptyBorder(18, 18, 18, 18)
        ));

        JLabel title = new JLabel(type.getDisplayName());
        title.setFont(new Font("SansSerif", Font.BOLD, 20));
        title.setForeground(Color.WHITE);
        title.setAlignmentX(Component.CENTER_ALIGNMENT);
        card.add(title);

        card.add(Box.createRigidArea(new Dimension(0, 10)));

        JTextArea desc = new JTextArea(type.getDescription());
        desc.setFont(new Font("SansSerif", Font.PLAIN, 13));
        desc.setForeground(new Color(200, 185, 170));
        desc.setWrapStyleWord(true);
        desc.setLineWrap(true);
        desc.setOpaque(false);
        desc.setEditable(false);
        desc.setFocusable(false);
        desc.setAlignmentX(Component.CENTER_ALIGNMENT);
        card.add(desc);

        card.add(Box.createRigidArea(new Dimension(0, 16)));

        // Stats
        card.add(createStatBar("Mass (Weight)", type.getStats().mass() / 1.6));
        card.add(Box.createRigidArea(new Dimension(0, 8)));
        card.add(createStatBar("Glide / Low Friction", (3.0 - type.getStats().linearDamping()) / 2.0));
        card.add(Box.createRigidArea(new Dimension(0, 8)));
        card.add(createStatBar("Impulse Power", type.getStats().impulseMultiplier() / 1.2));

        card.add(Box.createVerticalGlue());

        JButton selectBtn = new JButton(isSelected ? "EQUIPPED" : "SELECT PEN");
        selectBtn.setFont(new Font("SansSerif", Font.BOLD, 14));
        selectBtn.setForeground(Color.WHITE);
        selectBtn.setBackground(isSelected ? new Color(35, 130, 65) : new Color(45, 95, 180));
        selectBtn.setAlignmentX(Component.CENTER_ALIGNMENT);
        selectBtn.addActionListener(e -> {
            gameManager.getSettings().setSelectedPenType(type);
            gameWindow.refreshPenSelection();
        });
        card.add(selectBtn);

        return card;
    }

    private JPanel createStatBar(String name, double fraction) {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);
        JLabel lbl = new JLabel(name);
        lbl.setFont(new Font("SansSerif", Font.PLAIN, 12));
        lbl.setForeground(new Color(180, 170, 160));
        panel.add(lbl, BorderLayout.NORTH);

        JProgressBar bar = new JProgressBar(0, 100);
        bar.setValue((int) (Math.clamp(fraction, 0.0, 1.0) * 100));
        bar.setForeground(new Color(235, 175, 95));
        bar.setBackground(new Color(45, 38, 32));
        bar.setBorderPainted(false);
        bar.setPreferredSize(new Dimension(150, 10));
        panel.add(bar, BorderLayout.SOUTH);
        return panel;
    }
}
