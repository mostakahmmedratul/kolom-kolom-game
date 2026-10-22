package com.kolomkolom.manager;

import com.kolomkolom.ai.ComputerAI;
import com.kolomkolom.audio.AudioManager;
import com.kolomkolom.config.GameSettings;
import com.kolomkolom.model.*;
import com.kolomkolom.physics.PhysicsEngine;
import com.kolomkolom.physics.Vector2D;

import javax.swing.SwingUtilities;
import java.awt.Color;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Authoritative game orchestrator managing physics loop, turn sequencing,
 * AI execution, scoring evaluation, and round resets.
 */
public class GameManager implements Runnable, PhysicsEngine.CollisionListener {
    private final GameSettings settings;
    private final ScoreManager scoreManager;
    private final PhysicsEngine physicsEngine;
    private final ComputerAI computerAI;
    private final AudioManager audioManager;

    private Bench bench;
    private Pen humanPen;
    private Pen computerPen;

    private GameState gameState;
    private TurnState turnState;

    private final AtomicBoolean running = new AtomicBoolean(false);
    private Thread gameThread;

    // Turn timing state
    private double botThinkTimer = 0.0;
    private double roundResetTimer = 0.0;
    private boolean waitingForReset = false;

    // Viewport dimensions for positioning
    private double viewWidth = 1280.0;
    private double viewHeight = 720.0;

    public interface GameListener {
        void onStateChanged(GameState state);
        void onTurnChanged(TurnState turn);
        void onScoreUpdated(int humanScore, int computerScore);
        void onRepaintRequested();
    }

    private GameListener listener;

    public GameManager(GameSettings settings) {
        this.settings = settings;
        this.scoreManager = new ScoreManager(settings.getTargetScore());
        this.physicsEngine = new PhysicsEngine();
        this.computerAI = new ComputerAI();
        this.audioManager = new AudioManager(settings);

        this.physicsEngine.addCollisionListener(this);
        this.gameState = GameState.MENU;
        this.turnState = TurnState.HUMAN_AIMING;

        initBenchAndPens(viewWidth, viewHeight);
    }

    public void setGameListener(GameListener listener) {
        this.listener = listener;
    }

    public void initBenchAndPens(double w, double h) {
        this.viewWidth = w;
        this.viewHeight = h;

        double benchMarginX = 80.0;
        double benchMarginY = 70.0;
        this.bench = new Bench(benchMarginX, benchMarginY, w - benchMarginX * 2.0, h - benchMarginY * 2.0);

        // Standard school pen placement: left and right of center line
        double centerY = h * 0.5;
        double leftX = bench.getPlayableLeft() + bench.getWidth() * 0.28;
        double rightX = bench.getPlayableLeft() + bench.getWidth() * 0.72;

        PenType playerType = settings.getSelectedPenType();
        PenType botType = PenType.BALANCED;

        this.humanPen = new Pen(
                "HUMAN", "Player (You)", playerType,
                new Color(30, 100, 220), new Color(15, 60, 160),
                new Vector2D(leftX, centerY), 0.0
        );

        this.computerPen = new Pen(
                "BOT", "Opponent", botType,
                new Color(225, 45, 45), new Color(160, 20, 20),
                new Vector2D(rightX, centerY), Math.PI
        );
    }

    public synchronized void startNewMatch() {
        scoreManager.startNewMatch(settings.getTargetScore());
        resetPensToStartingPositions();
        setGameState(GameState.PLAYING);
        setTurnState(TurnState.HUMAN_AIMING);
        if (listener != null) {
            listener.onScoreUpdated(0, 0);
        }
    }

    public synchronized void resetPensToStartingPositions() {
        double centerY = viewHeight * 0.5;
        double leftX = bench.getPlayableLeft() + bench.getWidth() * 0.28;
        double rightX = bench.getPlayableLeft() + bench.getWidth() * 0.72;

        humanPen.setPenType(settings.getSelectedPenType());
        humanPen.reset(new Vector2D(leftX, centerY), 0.0);
        computerPen.reset(new Vector2D(rightX, centerY), Math.PI);

        scoreManager.startNewRound();
        waitingForReset = false;
        roundResetTimer = 0.0;
    }

    public void start() {
        if (running.compareAndSet(false, true)) {
            gameThread = new Thread(this, "KolomKolom-GameLoop");
            gameThread.setDaemon(true);
            gameThread.start();
        }
    }

    public void stop() {
        running.set(false);
        if (gameThread != null) {
            try {
                gameThread.join(500);
            } catch (InterruptedException ignored) {
            }
        }
    }

    @Override
    public void run() {
        long lastTime = System.nanoTime();
        double accumulator = 0.0;
        final double dt = PhysicsEngine.FIXED_DELTA_TIME;

        while (running.get()) {
            long now = System.nanoTime();
            double frameTime = (now - lastTime) / 1_000_000_000.0;
            lastTime = now;

            // Clamp frameTime to avoid spiral of death on lag spike
            if (frameTime > 0.05) frameTime = 0.05;
            accumulator += frameTime;

            while (accumulator >= dt) {
                updatePhysicsAndLogic(dt);
                accumulator -= dt;
            }

            // Request render on Swing EDT
            if (listener != null) {
                SwingUtilities.invokeLater(listener::onRepaintRequested);
            }

            try {
                Thread.sleep(8); // ~120 Hz loop pace
            } catch (InterruptedException e) {
                break;
            }
        }
    }

    private synchronized void updatePhysicsAndLogic(double dt) {
        if (gameState != GameState.PLAYING) {
            return;
        }

        List<Pen> pens = List.of(humanPen, computerPen);
        physicsEngine.update(pens, bench, dt);

        if (waitingForReset) {
            roundResetTimer += dt;
            if (roundResetTimer >= 1.4) {
                if (scoreManager.isMatchOver()) {
                    setGameState(GameState.GAME_OVER);
                    if (scoreManager.isHumanWinner()) {
                        audioManager.playVictory();
                    }
                } else {
                    resetPensToStartingPositions();
                    setTurnState(TurnState.HUMAN_AIMING);
                }
            }
            return;
        }

        switch (turnState) {
            case HUMAN_AIMING -> {
                // Waiting for human player to drag and release
            }
            case HUMAN_RESOLVING -> {
                if (arePensAtRestOrOut()) {
                    evaluateShotOutcome(true);
                }
            }
            case COMPUTER_THINKING -> {
                botThinkTimer += dt;
                if (botThinkTimer >= 0.75) {
                    botThinkTimer = 0.0;
                    executeBotShot();
                }
            }
            case COMPUTER_RESOLVING -> {
                if (arePensAtRestOrOut()) {
                    evaluateShotOutcome(false);
                }
            }
            case ROUND_RESET, ROUND_RESOLVED -> {}
        }
    }

    private boolean arePensAtRestOrOut() {
        boolean humanDone = humanPen.isOutOfBounds() ? humanPen.isFallComplete() : humanPen.isAtRest();
        boolean botDone = computerPen.isOutOfBounds() ? computerPen.isFallComplete() : computerPen.isAtRest();
        return humanDone && botDone;
    }

    private void evaluateShotOutcome(boolean wasHumanTurn) {
        boolean humanOut = humanPen.isOutOfBounds();
        boolean botOut = computerPen.isOutOfBounds();

        if (humanOut || botOut) {
            // A pen was knocked off!
            boolean scored = scoreManager.evaluateRound(humanOut, botOut);
            if (scored) {
                audioManager.playPointScored(botOut); // human scored if bot is out
                if (listener != null) {
                    listener.onScoreUpdated(scoreManager.getHumanScore(), scoreManager.getComputerScore());
                }
            }
            waitingForReset = true;
            roundResetTimer = 0.0;
            setTurnState(TurnState.ROUND_RESOLVED);
        } else {
            // Neither pen fell off; pass the turn to the opponent
            if (wasHumanTurn) {
                setTurnState(TurnState.COMPUTER_THINKING);
                botThinkTimer = 0.0;
            } else {
                setTurnState(TurnState.HUMAN_AIMING);
            }
        }
    }

    /**
     * Executes the human player's shot with an impulse vector derived from mouse drag.
     */
    public synchronized boolean executeHumanShot(Vector2D impulse) {
        if (gameState != GameState.PLAYING || turnState != TurnState.HUMAN_AIMING) {
            return false;
        }

        double maxPower = 850.0;
        double power = impulse.length();
        if (power < 15.0) {
            return false; // too weak, ignore accidental tap
        }

        Vector2D clampedImpulse = impulse;
        if (power > maxPower) {
            clampedImpulse = impulse.normalize().scale(maxPower);
        }

        humanPen.applyDirectImpulse(clampedImpulse);
        audioManager.playFlick(Math.min(power / maxPower, 1.0));
        setTurnState(TurnState.HUMAN_RESOLVING);
        return true;
    }

    private void executeBotShot() {
        Vector2D shot = computerAI.calculateShot(computerPen, humanPen, bench, settings.getDifficulty());
        computerPen.applyDirectImpulse(shot);
        audioManager.playFlick(Math.min(shot.length() / 800.0, 1.0));
        setTurnState(TurnState.COMPUTER_RESOLVING);
    }

    @Override
    public void onPenPenCollision(Pen a, Pen b, double relativeSpeed) {
        audioManager.playImpact(relativeSpeed);
    }

    @Override
    public void onPenOutOfBounds(Pen pen) {
        audioManager.playFallOff();
    }

    // State Transitions
    public void setGameState(GameState state) {
        this.gameState = state;
        if (listener != null) {
            listener.onStateChanged(state);
        }
    }

    public void setTurnState(TurnState turn) {
        this.turnState = turn;
        if (listener != null) {
            listener.onTurnChanged(turn);
        }
    }

    // Getters
    public GameState getGameState() { return gameState; }
    public TurnState getTurnState() { return turnState; }
    public Bench getBench() { return bench; }
    public Pen getHumanPen() { return humanPen; }
    public Pen getComputerPen() { return computerPen; }
    public ScoreManager getScoreManager() { return scoreManager; }
    public GameSettings getSettings() { return settings; }
    public AudioManager getAudioManager() { return audioManager; }
}
