package com.kolomkolom.model;

/**
 * Discrete phases of gameplay during an active round.
 */
public enum TurnState {
    HUMAN_AIMING,       // Player dragging aiming line
    HUMAN_RESOLVING,    // Player shot in motion; physics active
    COMPUTER_THINKING,  // Bot AI calculating optimal shot vector
    COMPUTER_RESOLVING, // Bot shot in motion; physics active
    ROUND_RESOLVED,     // Movement settled; checking score and falling pens
    ROUND_RESET         // Repositioning pens for next round
}
