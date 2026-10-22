package com.kolomkolom;

import com.kolomkolom.config.GameSettings;
import com.kolomkolom.manager.GameManager;
import com.kolomkolom.ui.GameWindow;

import javax.swing.SwingUtilities;
import javax.swing.UIManager;

/**
 * Main application entry point for the Kolom Kolom desktop game.
 */
public class Main {
    public static void main(String[] args) {
        // Optimize Java2D graphics pipeline on modern macOS (Metal) and Windows (Direct3D)
        System.setProperty("sun.java2d.opengl", "true");
        System.setProperty("apple.laf.useScreenMenuBar", "true");

        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception ignored) {
            // Keep default cross-platform look and feel if system theme unavailable
        }

        SwingUtilities.invokeLater(() -> {
            GameSettings settings = new GameSettings();
            GameManager manager = new GameManager(settings);
            GameWindow window = new GameWindow(manager);

            manager.start();
            window.setVisible(true);
        });
    }
}
