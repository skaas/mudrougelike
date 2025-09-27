export class BattleController {
    constructor({ battleContext, view, eventBus }) {
        this.battleContext = battleContext;
        this.view = view;
        this.eventBus = eventBus;
    }

    async startBattle({ playerActionProvider, enemyStrategyProvider } = {}) {
        let continueBattle = true;
        let outcome = 'undecided';
        let snapshot = this.battleContext.beginRound();
        this.view.onBattleRoundStart?.(snapshot);

        while (continueBattle) {
            const playerAction = playerActionProvider
                ? await playerActionProvider(snapshot)
                : null;

            const playerResult = await this.battleContext.resolvePlayerAction(playerAction);
            snapshot = playerResult.snapshot;
            this.view.onPlayerActionResolved?.(playerResult);

            if (playerResult.enemyDefeated) {
                outcome = 'victory';
                break;
            }

            const enemyStrategy = enemyStrategyProvider
                ? await enemyStrategyProvider(snapshot)
                : undefined;
            const enemyResult = await this.battleContext.resolveEnemyTurn(enemyStrategy);
            snapshot = enemyResult.snapshot;
            this.view.onEnemyActionResolved?.(enemyResult);

            if (enemyResult.playerDefeated) {
                outcome = 'defeat';
                break;
            }

            snapshot = this.battleContext.beginRound();
            this.view.onBattleRoundStart?.(snapshot);
        }

        this.view.onBattleComplete?.({ outcome, snapshot });
        return { outcome, snapshot };
    }
}