export class BattleContext {
    constructor({ player, enemy, rules, rng, calculators }) {
        this.player = player;
        this.enemy = enemy;
        this.rules = rules;
        this.rng = rng;
        this.calculators = calculators;
        this.turn = 0;
        this.round = 0;
        this.history = [];
    }

    beginRound() {
        this.round += 1;
        this.turn = 0;
        return this.snapshot();
    }

    resolvePlayerAction(action, context = {}) {
        throw new Error('resolvePlayerAction must be implemented.');
    }

    resolveEnemyTurn(strategy, context = {}) {
        throw new Error('resolveEnemyTurn must be implemented.');
    }

    snapshot() {
        return {
            round: this.round,
            turn: this.turn,
            player: this.player,
            enemy: this.enemy
        };
    }
}