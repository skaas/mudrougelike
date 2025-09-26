import { PLAYER_STAT_LIMITS } from '../../constants.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const statLimitMap = {
    critRate: 'CRIT_RATE',
    critDamage: 'CRIT_DAMAGE',
    lifeStealRate: 'LIFE_STEAL_RATE',
    turnHealingCapRatio: 'TURN_HEAL_CAP_RATIO',
    thornsCoeff: 'THORNS_COEFF',
    freezeRate: 'FREEZE_RATE',
    luck: 'LUCK',
    speed: 'SPEED'
};

const getLimit = (statKey, fallback = Number.MAX_SAFE_INTEGER) => {
    const limitKey = statLimitMap[statKey];
    if (!limitKey) {
        return fallback;
    }
    return PLAYER_STAT_LIMITS?.[limitKey] ?? fallback;
};

export const CardEffects = {
    increaseFlat(player, statKey, amount) {
        if (!player || typeof player[statKey] !== 'number') {
            return player;
        }
        const limit = getLimit(statKey, Number.MAX_SAFE_INTEGER);
        player[statKey] = clamp(player[statKey] + amount, 0, limit);
        return player;
    },

    increasePercent(player, statKey, percent) {
        if (!player || typeof player[statKey] !== 'number') {
            return player;
        }
        const limit = getLimit(statKey, Number.MAX_SAFE_INTEGER);
        const nextValue = player[statKey] * (1 + percent);
        player[statKey] = clamp(nextValue, 0, limit);
        return player;
    },

    addGuaranteedCrit(player, count = 1) {
        if (player?.grantGuaranteedCrits) {
            player.grantGuaranteedCrits(count);
        }
    },

    addBonusStrike(player, count = 1) {
        if (player?.addBonusStrikes) {
            player.addBonusStrikes(count);
        }
    },

    addSpeedBonus(player, amount = 1) {
        if (player?.addSpeedBonus) {
            player.addSpeedBonus(amount);
        }
    }
};
