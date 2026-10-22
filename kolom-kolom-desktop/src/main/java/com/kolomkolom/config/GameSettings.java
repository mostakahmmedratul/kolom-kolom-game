package com.kolomkolom.config;

import com.kolomkolom.ai.AIDifficulty;
import com.kolomkolom.model.PenType;

import java.util.prefs.Preferences;

/**
 * Handles persistent offline user settings using Java Preferences API.
 */
public class GameSettings {
    private static final String PREF_NODE = "com.kolomkolom.settings";
    private static final String KEY_DIFFICULTY = "difficulty";
    private static final String KEY_PEN_TYPE = "pen_type";
    private static final String KEY_TARGET_SCORE = "target_score";
    private static final String KEY_VOLUME = "volume";
    private static final String KEY_MUTED = "muted";

    private final Preferences prefs;

    private AIDifficulty difficulty;
    private PenType selectedPenType;
    private int targetScore;
    private double volume;
    private boolean muted;

    public GameSettings() {
        Preferences p = null;
        try {
            p = Preferences.userRoot().node(PREF_NODE);
        } catch (Exception ignored) {
            // Fallback for sandboxed environments
        }
        this.prefs = p;
        load();
    }

    public void load() {
        if (prefs != null) {
            String diffName = prefs.get(KEY_DIFFICULTY, AIDifficulty.MEDIUM.name());
            try {
                this.difficulty = AIDifficulty.valueOf(diffName);
            } catch (Exception e) {
                this.difficulty = AIDifficulty.MEDIUM;
            }

            String penName = prefs.get(KEY_PEN_TYPE, PenType.BALANCED.name());
            try {
                this.selectedPenType = PenType.valueOf(penName);
            } catch (Exception e) {
                this.selectedPenType = PenType.BALANCED;
            }

            this.targetScore = prefs.getInt(KEY_TARGET_SCORE, 10);
            this.volume = prefs.getDouble(KEY_VOLUME, 0.85);
            this.muted = prefs.getBoolean(KEY_MUTED, false);
        } else {
            this.difficulty = AIDifficulty.MEDIUM;
            this.selectedPenType = PenType.BALANCED;
            this.targetScore = 10;
            this.volume = 0.85;
            this.muted = false;
        }
    }

    public void save() {
        if (prefs != null) {
            try {
                prefs.put(KEY_DIFFICULTY, difficulty.name());
                prefs.put(KEY_PEN_TYPE, selectedPenType.name());
                prefs.putInt(KEY_TARGET_SCORE, targetScore);
                prefs.putDouble(KEY_VOLUME, volume);
                prefs.putBoolean(KEY_MUTED, muted);
                prefs.flush();
            } catch (Exception ignored) {
            }
        }
    }

    public AIDifficulty getDifficulty() { return difficulty; }
    public void setDifficulty(AIDifficulty difficulty) { this.difficulty = difficulty; save(); }

    public PenType getSelectedPenType() { return selectedPenType; }
    public void setSelectedPenType(PenType selectedPenType) { this.selectedPenType = selectedPenType; save(); }

    public int getTargetScore() { return targetScore; }
    public void setTargetScore(int targetScore) { this.targetScore = targetScore; save(); }

    public double getVolume() { return volume; }
    public void setVolume(double volume) { this.volume = Math.clamp(volume, 0.0, 1.0); save(); }

    public boolean isMuted() { return muted; }
    public void setMuted(boolean muted) { this.muted = muted; save(); }
}
