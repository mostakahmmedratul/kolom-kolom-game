package com.kolomkolom.audio;

import com.kolomkolom.config.GameSettings;

import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.SourceDataLine;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Robust audio system providing synthesized procedural sound effects
 * for pen clicks, wooden collisions, sliding friction, scoring chimes, and victory fanfares.
 * Does not depend on external assets or internet access.
 */
public class AudioManager {
    private final GameSettings settings;
    private final ExecutorService audioPool = Executors.newFixedThreadPool(2, r -> {
        Thread t = new Thread(r, "KolomKolom-Audio");
        t.setDaemon(true);
        return t;
    });

    public AudioManager(GameSettings settings) {
        this.settings = settings;
    }

    /**
     * Pen flick impulse sound: snappy pop with decaying resonance.
     */
    public void playFlick(double powerFraction) {
        if (settings.isMuted()) return;
        audioPool.submit(() -> {
            try {
                int sampleRate = 44100;
                double duration = 0.08;
                int numSamples = (int) (duration * sampleRate);
                byte[] buffer = new byte[numSamples];

                double baseFreq = 420.0 + powerFraction * 200.0;
                double masterVol = settings.getVolume() * 0.7;

                for (int i = 0; i < numSamples; i++) {
                    double t = (double) i / sampleRate;
                    double env = Math.exp(-t * 55.0); // fast decay
                    double freq = baseFreq * (1.0 - t * 4.0);
                    double sample = Math.sin(2.0 * Math.PI * freq * t) * env * masterVol;
                    buffer[i] = (byte) (sample * 127.0);
                }
                playPcmBuffer(buffer, sampleRate);
            } catch (Exception ignored) {
            }
        });
    }

    /**
     * Pen-to-pen impact: sharp wooden/plastic clack.
     */
    public void playImpact(double relativeSpeed) {
        if (settings.isMuted()) return;
        audioPool.submit(() -> {
            try {
                int sampleRate = 44100;
                double duration = 0.06;
                int numSamples = (int) (duration * sampleRate);
                byte[] buffer = new byte[numSamples];

                double speedNorm = Math.clamp(relativeSpeed / 500.0, 0.2, 1.0);
                double masterVol = settings.getVolume() * speedNorm * 0.8;

                for (int i = 0; i < numSamples; i++) {
                    double t = (double) i / sampleRate;
                    double env = Math.exp(-t * 80.0);
                    // Blend resonant frequency with subtle white noise for plastic snap
                    double wave = Math.sin(2.0 * Math.PI * 850.0 * t);
                    double noise = (Math.random() * 2.0 - 1.0) * 0.4;
                    double sample = (wave * 0.6 + noise) * env * masterVol;
                    buffer[i] = (byte) (sample * 127.0);
                }
                playPcmBuffer(buffer, sampleRate);
            } catch (Exception ignored) {
            }
        });
    }

    /**
     * Pen falling off bench: low tumbling thud.
     */
    public void playFallOff() {
        if (settings.isMuted()) return;
        audioPool.submit(() -> {
            try {
                int sampleRate = 44100;
                double duration = 0.25;
                int numSamples = (int) (duration * sampleRate);
                byte[] buffer = new byte[numSamples];
                double masterVol = settings.getVolume() * 0.75;

                for (int i = 0; i < numSamples; i++) {
                    double t = (double) i / sampleRate;
                    double env = (1.0 - t / duration) * Math.sin(Math.PI * t / duration);
                    double freq = 220.0 * Math.exp(-t * 6.0);
                    double sample = Math.sin(2.0 * Math.PI * freq * t) * env * masterVol;
                    buffer[i] = (byte) (sample * 127.0);
                }
                playPcmBuffer(buffer, sampleRate);
            } catch (Exception ignored) {
            }
        });
    }

    /**
     * Round point scored: bright upward major third chime.
     */
    public void playPointScored(boolean humanScored) {
        if (settings.isMuted()) return;
        audioPool.submit(() -> {
            try {
                int sampleRate = 44100;
                double duration = 0.35;
                int numSamples = (int) (duration * sampleRate);
                byte[] buffer = new byte[numSamples];
                double masterVol = settings.getVolume() * 0.8;

                double f1 = humanScored ? 523.25 : 392.0; // C5 or G4
                double f2 = humanScored ? 659.25 : 329.6; // E5 or E4

                for (int i = 0; i < numSamples; i++) {
                    double t = (double) i / sampleRate;
                    double currentFreq = (t < 0.15) ? f1 : f2;
                    double noteT = (t < 0.15) ? t : (t - 0.15);
                    double env = Math.exp(-noteT * 12.0);
                    double sample = Math.sin(2.0 * Math.PI * currentFreq * t) * env * masterVol;
                    buffer[i] = (byte) (sample * 127.0);
                }
                playPcmBuffer(buffer, sampleRate);
            } catch (Exception ignored) {
            }
        });
    }

    /**
     * Match victory fanfare.
     */
    public void playVictory() {
        if (settings.isMuted()) return;
        audioPool.submit(() -> {
            try {
                int sampleRate = 44100;
                double duration = 0.8;
                int numSamples = (int) (duration * sampleRate);
                byte[] buffer = new byte[numSamples];
                double masterVol = settings.getVolume() * 0.85;

                double[] chord = { 523.25, 659.25, 783.99, 1046.50 }; // C Major arpeggio
                double noteDur = 0.18;

                for (int i = 0; i < numSamples; i++) {
                    double t = (double) i / sampleRate;
                    int noteIndex = Math.min((int) (t / noteDur), chord.length - 1);
                    double freq = chord[noteIndex];
                    double noteT = t - noteIndex * noteDur;
                    double env = Math.exp(-noteT * 8.0);
                    double sample = Math.sin(2.0 * Math.PI * freq * t) * env * masterVol;
                    buffer[i] = (byte) (sample * 127.0);
                }
                playPcmBuffer(buffer, sampleRate);
            } catch (Exception ignored) {
            }
        });
    }

    private void playPcmBuffer(byte[] buffer, int sampleRate) {
        try {
            AudioFormat format = new AudioFormat(sampleRate, 8, 1, true, true);
            SourceDataLine line = AudioSystem.getSourceDataLine(format);
            line.open(format, buffer.length);
            line.start();
            line.write(buffer, 0, buffer.length);
            line.drain();
            line.close();
        } catch (Exception ignored) {
        }
    }

    public void shutdown() {
        audioPool.shutdownNow();
    }
}
