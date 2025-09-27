import { GAME_PHASES } from '../../constants.js';

export class GameLifecycle {
    constructor({ state, battleController, rewardContext, view, hooks = {} }) {
        this.state = state;
        this.battleController = battleController;
        this.rewardContext = rewardContext;
        this.view = view;
        this.hooks = hooks;
        this.phase = this.state?.getPhase?.() ?? GAME_PHASES.EXPLORE;
    }

    async initialize(context = {}) {
        if (typeof this.hooks.beforeInitialize === 'function') {
            await this.hooks.beforeInitialize(context);
        }

        const snapshot = await this.state.initialize(context);
        this.view.onGameInitialized?.(snapshot);

        if (typeof this.hooks.afterInitialize === 'function') {
            await this.hooks.afterInitialize(context);
        }

        const initialPhase = this.state.getPhase?.() ?? GAME_PHASES.EXPLORE;
        this.phase = initialPhase;
        await this.transitionTo(initialPhase, context);
    }

    async transitionTo(nextPhase, context = {}) {
        if (this.phase === nextPhase && nextPhase !== GAME_PHASES.REWARD) {
            return null;
        }

        const previous = this.phase;
        if (typeof this.hooks.beforePhaseChange === 'function') {
            await this.hooks.beforePhaseChange({ previous, next: nextPhase, context });
        }

        this.phase = nextPhase;
        this.state.setPhase?.(nextPhase);
        this.view.onPhaseChanged?.({ previous, next: nextPhase });

        let result = null;

        switch (nextPhase) {
            case GAME_PHASES.EXPLORE: {
                if (typeof this.hooks.enterExplore === 'function') {
                    await this.hooks.enterExplore(context);
                }
                result = { phase: GAME_PHASES.EXPLORE };
                break;
            }
            case GAME_PHASES.BATTLE: {
                if (typeof this.hooks.prepareBattle === 'function') {
                    await this.hooks.prepareBattle(context);
                }
                result = await this.battleController.startBattle(context);
                if (typeof this.hooks.afterBattle === 'function') {
                    await this.hooks.afterBattle({ ...context, outcome: result });
                }
                break;
            }
            case GAME_PHASES.REWARD: {
                if (typeof this.hooks.enterReward === 'function') {
                    await this.hooks.enterReward(context);
                }
                const rewards = this.rewardContext?.generate?.(context) ?? [];
                this.view.showRewards?.(rewards);
                result = { rewards };
                if (typeof this.hooks.afterReward === 'function') {
                    await this.hooks.afterReward({ ...context, result });
                }
                break;
            }
            case GAME_PHASES.GAME_OVER: {
                if (typeof this.hooks.enterGameOver === 'function') {
                    await this.hooks.enterGameOver(context);
                }
                result = { phase: GAME_PHASES.GAME_OVER };
                break;
            }
            default:
                break;
        }

        if (typeof this.hooks.afterPhaseChange === 'function') {
            await this.hooks.afterPhaseChange({ previous, next: nextPhase, context, result });
        }

        return result;
    }
}