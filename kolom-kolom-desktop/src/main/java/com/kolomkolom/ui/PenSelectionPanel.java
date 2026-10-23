package com.kolomkolom.ui;

import com.kolomkolom.manager.GameManager;
import com.kolomkolom.model.PenType;

import javax.swing.*;
import java.awt.*;
import java.awt.geom.RoundRectangle2D;

/**
 * Modern, stylish pen selection screen displaying the school pens with real physical attributes.
 */
public class PenSelectionPanel extends JPanel {
    private final GameManager gameManager;
    private final GameWindow gameWindow;

    public PenSelectionPanel(GameManager gameManager, GameWindow gameWindow) {
        this.gameManager = gameManager;
        this.gameWindow = gameWindow;
        setLayout(new BorderLayout());
        setBackground(new Color(20, 16, 13));

        // Header
        JPanel headerPanel = new JPanel();
        headerPanel.setOpaque(false);
        headerPanel.setLayout(new BoxLayout(headerPanel, BoxLayout.Y_AXIS));
        headerPanel.setBorder(BorderFactory.createEmptyBorder(24, 10, 12, 10));

        JLabel headerLabel = new JLabel("PEN ARMORY", SwingConstants.CENTER);
        headerLabel.setFont(new Font("SansSerif", Font.BOLD, 36));
        headerLabel.setForeground(new Color(251, 191, 36));
        headerLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        headerPanel.add(headerLabel);

        JLabel subLabel = new JLabel("Choose your ballpoint pen weapon for the desk duel", SwingConstants.CENTER);
        subLabel.setFont(new Font("SansSerif", Font.PLAIN, 14));
        subLabel.setForeground(new Color(200, 180, 160));
        subLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        headerPanel.add(subLabel);

        add(headerPanel, BorderLayout.NORTH);

        // Center: Cards for each pen
        JPanel cardsPanel = new JPanel(new GridLayout(1, 3, 24, 24));
        cardsPanel.setOpaque(false);
        cardsPanel.setBorder(BorderFactory.createEmptyBorder(15, 36, 25, 36));

        for (PenType type : PenType.values()) {
            cardsPanel.add(createPenCard(type));
        }
        add(cardsPanel, BorderLayout.CENTER);

        // Bottom: Back button
        JPanel bottomPanel = new JPanel();
        bottomPanel.setOpaque(false);
        bottomPanel.setBorder(BorderFactory.createEmptyBorder(10, 10, 20, 10));

        JButton backBtn = new JButton("RETURN TO MENU") {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(new Color(55, 65, 81));
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
        backBtn.setFont(new Font("SansSerif", Font.BOLD, 14));
        backBtn.setForeground(Color.WHITE);
        backBtn.setPreferredSize(new Dimension(200, 40));
        backBtn.setContentAreaFilled(false);
        backBtn.setBorderPainted(false);
        backBtn.setFocusPainted(false);
        backBtn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        backBtn.addActionListener(e -> gameWindow.showCard("MENU"));
        bottomPanel.add(backBtn);
        add(bottomPanel, BorderLayout.SOUTH);
    }

    private JPanel createPenCard(PenType type) {
        boolean isSelected = gameManager.getSettings().getSelectedPenType() == type;

        JPanel card = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

                g2.setColor(isSelected ? new Color(38, 28, 20) : new Color(28, 22, 18));
                g2.fill(new RoundRectangle2D.Double(0, 0, getWidth(), getHeight(), 16, 16));

                g2.setColor(isSelected ? new Color(245, 158, 11) : new Color(65, 52, 42));
                g2.setStroke(new BasicStroke(isSelected ? 2.5f : 1.2f));
                g2.draw(new RoundRectangle2D.Double(0, 0, getWidth() - 1, getHeight() - 1, 16, 16));

                g2.dispose();
                super.paintComponent(g);
            }
        };
        card.setOpaque(false);
        card.setLayout(new BoxLayout(card, BoxLayout.Y_AXIS));
        card.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));

        JLabel title = new JLabel(type.getDisplayName());
        title.setFont(new Font("SansSerif", Font.BOLD, 22));
        title.setForeground(isSelected ? new Color(251, 191, 36) : Color.WHITE);
        title.setAlignmentX(Component.CENTER_ALIGNMENT);
        card.add(title);

        card.add(Box.createRigidArea(new Dimension(0, 8)));

        JTextArea desc = new JTextArea(type.getDescription());
        desc.setFont(new Font("SansSerif", Font.PLAIN, 12));
        desc.setForeground(new Color(200, 190, 180));
        desc.setWrapStyleWord(true);
        desc.setLineWrap(true);
        desc.setOpaque(false);
        desc.setEditable(false);
        desc.setFocusable(false);
        desc.setAlignmentX(Component.CENTER_ALIGNMENT);
        card.add(desc);

        card.add(Box.createRigidArea(new Dimension(0, 16)));

        // Stats with custom progress bars
        card.add(createStatBar("Mass (Weight)", type.getStats().mass() / 1.6, new Color(245, 158, 11)));
        card.add(Box.createRigidArea(new Dimension(0, 8)));
        card.add(createStatBar("Glide / Low Friction", (3.0 - type.getStats().linearDamping()) / 2.0, new Color(56, 189, 248)));
        card.add(Box.createRigidArea(new Dimension(0, 8)));
        card.add(createStatBar("Impulse Power", type.getStats().impulseMultiplier() / 1.2, new Color(239, 68, 68)));

        card.add(Box.createVerticalGlue());

        JButton selectBtn = new JButton(isSelected ? "✓ EQUIPPED" : "SELECT PEN") {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(isSelected ? new Color(16, 185, 129) : new Color(37, 99, 235));
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
        selectBtn.setFont(new Font("SansSerif", Font.BOLD, 14));
        selectBtn.setForeground(Color.WHITE);
        selectBtn.setPreferredSize(new Dimension(180, 38));
        selectBtn.setMaximumSize(new Dimension(300, 38));
        selectBtn.setContentAreaFilled(false);
        selectBtn.setBorderPainted(false);
        selectBtn.setFocusPainted(false);
        selectBtn.setAlignmentX(Component.CENTER_ALIGNMENT);
        selectBtn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        selectBtn.addActionListener(e -> {
            gameManager.getSettings().setSelectedPenType(type);
            gameWindow.refreshPenSelection();
        });
        card.add(selectBtn);

        return card;
    }

    private JPanel createStatBar(String labelText, double fraction, Color barColor) {
        JPanel panel = new JPanel();
        panel.setOpaque(false);
        panel.setLayout(new BorderLayout(5, 4));

        JLabel label = new JLabel(labelText);
        label.setFont(new Font("SansSerif", Font.BOLD, 11));
        label.setForeground(new Color(180, 170, 160));
        panel.add(label, BorderLayout.NORTH);

        JProgressBar bar = new JProgressBar(0, 100);
        bar.setValue((int) (Math.clamp(fraction, 0.0, 1.0) * 100));
        bar.setPreferredSize(new Dimension(100, 8));
        bar.setForeground(barColor);
        bar.setBackground(new Color(40, 32, 26));
        bar.setBorderPainted(false);
        panel.add(bar, BorderLayout.CENTER);

        return panel;
    }
}
