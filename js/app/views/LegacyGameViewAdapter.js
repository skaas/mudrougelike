export class LegacyGameViewAdapter {
    constructor({ uiManager, eventEmitter, rewardContext, onRewardSelected }) {
        this.ui = uiManager;
        this.eventEmitter = eventEmitter;
        this.rewardContext = rewardContext;
        this.onRewardSelected = onRewardSelected;
    }

    onGameInitialized(snapshot) {
        if (typeof this.ui.updateAll === 'function') {
            this.ui.updateAll();
        }
        this.eventEmitter?.emit?.('state:update', snapshot);
    }

    onPhaseChanged({ previous, next }) {
        this.eventEmitter?.emit?.('game:phase-change', { oldPhase: previous, newPhase: next });
    }

    onBattleRoundStart(snapshot) {
        this.eventEmitter?.emit?.('battle:round-start', snapshot);
    }

    onPlayerActionResolved(payload) {
        this.eventEmitter?.emit?.('battle:action', {
            actor: 'player',
            actionType: payload?.action?.type,
            result: payload?.result,
            snapshot: payload?.snapshot
        });
    }

    onEnemyActionResolved(payload) {
        this.eventEmitter?.emit?.('battle:action', {
            actor: 'enemy',
            result: payload?.result,
            snapshot: payload?.snapshot
        });
    }

    onBattleComplete({ outcome, snapshot }) {
        this.eventEmitter?.emit?.('battle:end', {
            victory: outcome === 'victory',
            outcome,
            snapshot
        });
    }

    showRewards(rewards) {
        const deliver = Array.isArray(rewards) ? rewards : [];

        if (!this.ui?.showRewards) {
            this.eventEmitter?.emit?.('ui:show-rewards', deliver);
            return;
        }

        const decorated = deliver.map((reward) => {
            const apply = typeof reward.apply === 'function'
                ? reward.apply
                : () => ({ message: reward?.description || '' });
            return {
                ...reward,
                effect: () => {
                    const result = apply();
                    const message = typeof result?.message === 'string' ? result.message : '';
                    if (typeof this.onRewardSelected === 'function') {
                        Promise.resolve().then(() => this.onRewardSelected({
                            reward,
                            result,
                            message,
                            key: reward.key ?? reward.type ?? reward.name ?? null
                        }));
                    }
                    return message;
                }
            };
        });

        this.ui.showRewards(decorated);
    }
}