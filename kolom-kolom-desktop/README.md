# Kolom Kolom — Realistic Java Desktop Game

An authentic 2D schoolyard pen-flicking game inspired by the traditional bench battle played across classrooms worldwide. Built with **Java 21**, **Java Swing**, **Java2D**, and a **custom, dependency-free 2D rigid-body capsule physics engine**.

---

## Architecture Overview

```
com.kolomkolom/
├── Main.java                        # System look & feel setup, Swing EDT launch
├── model/
│   ├── Pen.java                     # Rigid-body pen state (pos, angle, velocities, out-of-bounds)
│   ├── PenType.java                 # Balanced, Heavy, Rubber Grip enum
│   ├── PenStats.java                # Mass, dimensions, damping, restitution, moment of inertia
│   ├── Bench.java                   # Wooden desk playfield & table-edge detection
│   ├── GameState.java               # Screen lifecycle (MENU, PLAYING, PAUSED, GAME_OVER)
│   └── TurnState.java               # Turn orchestration (AIMING, RESOLVING, BOT_THINKING)
├── physics/
│   ├── Vector2D.java                # Immutable 2D mathematical vector
│   ├── CapsuleCollider.java         # Oriented segment-to-segment capsule collision geometry
│   ├── CollisionHandler.java        # Momentum transfer, restitution, and off-center impact torque
│   └── PhysicsEngine.java           # 120Hz sub-stepped integrator with friction & damping
├── ai/
│   ├── ComputerAI.java              # Rule-based AI (Easy, Medium, Hard with trajectory evaluation)
│   └── AIDifficulty.java            # Difficulty profiles and aim variance parameters
├── manager/
│   ├── GameManager.java             # Dedicated physics thread, turn coordination, audio events
│   └── ScoreManager.java            # Scoring evaluation (10 or 15 pts) & duplicate prevention
├── config/
│   └── GameSettings.java            # Offline persistent settings (Preferences API)
├── audio/
│   └── AudioManager.java            # Procedural PCM audio synthesizer (clacks, slides, falls, chimes)
└── ui/
    ├── GameWindow.java              # Top-level JFrame with CardLayout
    ├── GamePanel.java               # Java2D Graphics2D rendering of wood grain, pens & HUD
    ├── MenuPanel.java               # Main menu screen
    ├── PenSelectionPanel.java       # Visual pen chooser with stat meters
    └── ResultPanel.java             # Match victory/defeat & replay screen
```

---

## Prerequisites

- **Java Development Kit (JDK) 21 or later**
  - macOS: `brew install openjdk@21`
  - Windows: Download from Oracle or Eclipse Adoptium (Temurin 21)
- **Apache Maven 3.8+**

---

## Build & Run Commands

### 1. Compile the Project
```bash
mvn clean compile
```

### 2. Run All Automated JUnit 5 Tests
```bash
mvn test
```

### 3. Run the Game Directly
```bash
mvn exec:java
```

### 4. Build Executable Fat JAR
```bash
mvn clean package
java -jar target/kolom-kolom.jar
```

---

## Native Desktop Packaging (`jpackage`)

JDK 21 includes `jpackage` to produce standalone native installers that bundle the Java runtime.

### macOS (Apple Silicon M1/M2/M3/M4 & Intel)
Make `package-mac.sh` executable and run:
```bash
chmod +x package-mac.sh
./package-mac.sh
```
This produces a native `.dmg` and `KolomKolom.app` in `dist/`.

### Windows (Windows 10 / 11)
Run `package-win.bat` in Command Prompt or PowerShell:
```cmd
package-win.bat
```
This produces a standalone `.msi` installer or portable `.exe` in `dist/`.
