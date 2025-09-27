export class GameStateFacade {
    constructor(gameState) {
        this.gameState = gameState;
    }

    async initialize() {
        this.gameState.initialize();
        return this.snapshot();
    }

    snapshot() {
        const gamePhase = this.gameState.getGamePhase?.() ?? null;
        return {
            player: this.gameState.getPlayer?.() ?? null,
            enemy: this.gameState.getEnemy?.() ?? null,
            stage: this.gameState.getCurrentStage?.() ?? 0,
            level: this.gameState.getCurrentLevel?.() ?? 0,
            phase: gamePhase,
            gamePhase,
            isBossBattle: this.gameState.isBossStage?.() ?? false
        };
    }

    setPhase(phase) {
        if (typeof this.gameState.setGamePhase === 'function') {
            this.gameState.setGamePhase(phase);
        }
    }

    getPhase() {
        return this.gameState.getGamePhase?.() ?? null;
    }
}