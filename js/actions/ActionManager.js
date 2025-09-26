import { ACTION_TYPES, GAME_SETTINGS } from '../constants.js';
import { skillRegistry } from '../app/skills/index.js';

export class ActionManager {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }

    getPlayerActions(player) {
        const actions = skillRegistry.getPlayerSkills({ player });
        return actions.map(action => ({ ...action }));
    }

    selectPlayerAction(player) {
        const actions = this.getPlayerActions(player);
        if (!actions.length) {
            return null;
        }

        const mistakeChance = this.calculateMistakeChance(player);
        if (Math.random() < mistakeChance) {
            const randomIndex = Math.floor(Math.random() * actions.length);
            return actions[randomIndex];
        }

        return this.selectWeightedRandom(actions);
    }

    calculateMistakeChance(player) {
        const baseChance = GAME_SETTINGS.MIN_MISTAKE_CHANCE;
        const luckFactor = player?.luck ? player.luck * 0.005 : 0;
        return Math.max(baseChance - luckFactor, 0.01);
    }

    selectWeightedRandom(items) {
        const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
        let randomValue = Math.random() * totalWeight;

        for (const item of items) {
            randomValue -= (item.weight || 1);
            if (randomValue <= 0) {
                return item;
            }
        }

        return items[items.length - 1];
    }
}
