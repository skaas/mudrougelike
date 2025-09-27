import { BattleContext } from '../../domain/battle/BattleContext.js';

export class LegacyBattleContextAdapter extends BattleContext {
    constructor({ battleManager, playerManager, enemyManager }) {
        super({
            player: playerManager?.getPlayer?.() ?? null,
            enemy: enemyManager?.getEnemy?.() ?? null,
            rules: null,
            rng: null,
            calculators: null
        });
        this.battleManager = battleManager;
        this.playerManager = playerManager;
        this.enemyManager = enemyManager;
    }

    #refreshSnapshot() {
        this.player = this.playerManager?.getPlayer?.() ?? null;
        this.enemy = this.enemyManager?.getEnemy?.() ?? null;
    }

    #ensureManagers() {
        if (typeof this.battleManager?.ensureManagers === 'function') {
            try {
                this.battleManager.ensureManagers();
            } catch (error) {
                console.warn('[LegacyBattleContextAdapter] ensureManagers failed:', error);
            }
        } else {
            if (!this.battleManager.playerManager && this.playerManager) {
                this.battleManager.playerManager = this.playerManager;
            }
            if (!this.battleManager.enemyManager && this.enemyManager) {
                this.battleManager.enemyManager = this.enemyManager;
            }
        }

        if (!this.battleManager.gameState && this.playerManager?.gameState) {
            this.battleManager.gameState = this.playerManager.gameState;
        }
    }

    beginRound() {
        this.#ensureManagers();
        if (typeof this.battleManager?.beginRound === 'function') {
            this.battleManager.beginRound();
        }
        const snapshot = super.beginRound();
        this.#refreshSnapshot();
        return { ...snapshot, player: this.player, enemy: this.enemy };
    }

    async resolvePlayerAction(action, context = {}) {
        this.#ensureManagers();
        let selectedAction = action;
        if (!selectedAction && typeof this.battleManager?.selectPlayerAction === 'function') {
            selectedAction = this.battleManager.selectPlayerAction(this.playerManager?.getPlayer?.());
        }

        const result = await this.battleManager.performPlayerAttack({
            actionOverride: selectedAction,
            context
        });

        this.turn += 1;
        this.#refreshSnapshot();
        return {
            action: selectedAction,
            result,
            snapshot: this.snapshot(),
            enemyDefeated: result?.enemyDefeated,
            playerDefeated: result?.playerDefeated
        };
    }

    async resolveEnemyTurn(strategy, context = {}) {
        this.#ensureManagers();
        const options = typeof strategy === 'function' ? strategy(this.snapshot()) : strategy;
        const result = await this.battleManager.performEnemyAttack(options ?? context);

        this.turn += 1;
        this.#refreshSnapshot();
        return {
            result,
            snapshot: this.snapshot(),
            enemyDefeated: result?.enemyDefeated,
            playerDefeated: result?.playerDefeated
        };
    }
}