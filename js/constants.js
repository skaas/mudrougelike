export const GAME_SETTINGS = {
    ANIMATION_DELAY: 800,
    MIN_MISTAKE_CHANCE: 0.03,
    CRITICAL_HIT_CHANCE: 0.1,
    CRITICAL_DAMAGE_MULTIPLIER: 2.2,
    LUCK_CRITICAL_BONUS: 0.015,
    BASE_COUNTER_CHANCE: 0.05,
    LUCK_COUNTER_BONUS: 0.02,
    BASE_RARE_LOOT_CHANCE: 0.1,
    LUCK_LOOT_BONUS: 0.05
};

export const MESSAGE_DELAYS = {
    DEFAULT: 300,
    DAMAGE: 300,
    VICTORY: 500,
    REWARD: 700,
    STATUS: 200
};

export const MESSAGE_TYPES = {
    NARRATIVE: 'narrative',
    BATTLE: 'battle',
    ENEMY_EMPHASIS: 'enemy-emphasis',
    ENEMY: 'enemy',
    PLAYER: 'player',
    SYSTEM: 'system',
    STATUS: 'status',
    BUTTON: 'button',
    ERROR: 'error'
};

export const INITIAL_STATS = {
    PLAYER: {
        HP: 476,
        MAX_HP: 476,
        NAME: 'Crimson Knight',
        ATTACK: 20,
        DEFENSE: 10,
        ARMOR: 0,
        CRIT_RATE: 0.05,
        CRIT_DAMAGE: 1.5,
        LIFE_STEAL_RATE: 0.02,
        THORNS_COEFF: 0,
        FREEZE_RATE: 0.05,
        LUCK: 5,
        TURN_HEAL_CAP_RATIO: 0.25
    },
    ENEMY: {
        HP: 150,
        MAX_HP: 150,
        NAME: 'Fanatic Priest',
        ATTACK: 15,
        DEFENSE: 5,
        ARMOR: 0,
        LUCK: 3,
        EXP: 25
    }
};

export const ENEMY_GROWTH = {
    BASE_HP: 50,
    BASE_ATK: 10,
    BASE_DEF: 5,
    HP_INCREASE: 0.2,
    ATTACK_INCREASE: 0.15,
    DEFENSE_INCREASE: 0.1
};

export const LUCK_FACTORS = {
    MIN_MISTAKE_CHANCE: 0.03,
    LUCK_REDUCTION_RATE: 0.05,
    LUCK_CRITICAL_BONUS: 0.025,
    STAT_VARIATION: 0.2,
    LUCK_INFLUENCE: 0.03
};

export const ACTION_TYPES = {
    ATTACK: 'attack',
    HEAVY_ATTACK: 'heavy_attack',
    DEFEND: 'defend',
    MULTI_HIT: 'multi_hit',
    SHIELD_BREAK: 'shield_break',
    DESPERATE_ATTACK: 'desperate_attack',
    MISTAKE: 'mistake',
    CRITICAL: 'critical',
    ULTIMATE: 'ultimate',
    MULTI_ATTACK: 'multi_attack',
    HEAL: 'heal',
    POWER_ATTACK: 'power_attack'
};

export const EFFECT_TYPES = {
    DAMAGE: 'damage',
    HEAL: 'heal',
    ARMOR: 'armor',
    STUN: 'stun',
    BUFF: 'buff',
    DEBUFF: 'debuff'
};

export const ENEMY_BEHAVIOR = {
    CONDITIONS: {
        ALWAYS: () => true,
        LOW_HP: (enemy) => enemy.hp < enemy.maxHp * 0.3,
        MEDIUM_HP: (enemy) => enemy.hp < enemy.maxHp * 0.7,
        HIGH_HP: (enemy) => enemy.hp > enemy.maxHp * 0.7,
        HAS_ARMOR: (_enemy, player) => player.armor > 0,
        AFTER_COMBO: (enemy) => enemy.lastPlayerUsedCombo
    },
    WEIGHT_MODIFIERS: {
        LOW_HP: (enemy) => enemy.hp < enemy.maxHp * 0.3 ? 2 : 1,
        SHIELD_BREAK: (_enemy, player) => player.armor > 0 ? 2 : 1,
        DESPERATE: (enemy) => enemy.hp < enemy.maxHp * 0.3 ? 3 : 1
    }
};

export const BUTTON_TYPES = {
    SINGLE: 'single',
    CHOICE: 'choice'
};

export const PLAYER_STATS = {
    BASE: {
        HP: 100,
        ATTACK: 15,
        DEFENSE: 10,
        ARMOR: 0,
        CRIT_RATE: 0.05,
        CRIT_DAMAGE: 1.5,
        LIFE_STEAL_RATE: 0.02,
        THORNS_COEFF: 0,
        FREEZE_RATE: 0.05,
        LUCK: 5,
        TURN_HEAL_CAP_RATIO: 0.25
    },
    MULTI_HIT: {
        BASE: 2,
        MAX: 5
    },
    CLASSES: {
        WARRIOR: {
            NAME: 'Warrior',
            HP_MULTIPLIER: 1.2,
            ATTACK_MULTIPLIER: 1.0,
            DEFENSE_MULTIPLIER: 1.1,
            SPECIAL_SKILLS: [],
            STARTING_EQUIPMENT: {}
        },
        MAGE: {
            NAME: 'Mage',
            HP_MULTIPLIER: 0.8,
            ATTACK_MULTIPLIER: 1.3,
            DEFENSE_MULTIPLIER: 0.7,
            SPECIAL_SKILLS: [],
            STARTING_EQUIPMENT: {}
        }
    }
};

export const PLAYER_STAT_LIMITS = {
    CRIT_RATE: 0.6,
    CRIT_DAMAGE: 2.2,
    LIFE_STEAL_RATE: 0.3,
    TURN_HEAL_CAP_RATIO: 0.35,
    THORNS_COEFF: 999,
    FREEZE_RATE: 0.9,
    LUCK: 0.5
};

export const PLAYER_LEVEL_GROWTH = {
    LIFE_STEAL_RATE: 0.005,
    THORNS_COEFF: 0,
    FREEZE_RATE: 0.003,
    LUCK: 1,
    TURN_HEAL_CAP_RATIO: 0
};

export const PLAYER_TURN_LIMITS = {
    THORNS_DAMAGE_MULTIPLIER: 2
};

export const CHARACTER_SETTINGS = {
    SHIELD: {
        MAX_SHIELD_RATIO: 0.5
    }
};

export const CRITICAL_SETTINGS = {
    BASE: {
        CHANCE: 0.1,
        DAMAGE_MULTIPLIER: 2.2
    },
    CLASS_MODIFIERS: {
        ROGUE: 1.5
    },
    LUCK: {
        BONUS_PER_POINT: 0.015
    }
};

export const LUCK_SETTINGS = {
    BASE: {
        MIN_VALUE: 1,
        DEFAULT_VALUE: 5
    },
    EFFECTS: {
        MISTAKE_REDUCTION: 0.05,
        CRITICAL_BONUS: 0.025,
        STAT_INFLUENCE: 0.03,
        TREASURE_CHANCE: 0.01
    }
};

export const BOSS_SETTINGS = {
    SPAWN: {
        INTERVAL: 8,
        MIN_LEVEL: 1
    },
    MULTIPLIERS: {
        HP: 2.5,
        ATTACK: 1.8,
        DEFENSE: 1.5,
        EXP: 2.5
    },
    REWARDS: {
        EXP_BONUS: 2.5,
        TREASURE_CHANCE: 1
    }
};

export const STAGE_SETTINGS = {
    BOSS_INTERVAL: 8,
    STAGES_PER_BOSS: 8,
    BOSS_MULTIPLIER: {
        HP: 2.5,
        ATTACK: 1.8,
        DEFENSE: 1.5
    },
    BOSS_HP_MULTIPLIER: 2.5,
    BOSS_ATTACK_MULTIPLIER: 1.8,
    BOSS_DEFENSE_MULTIPLIER: 1.5,
    LUCKY_CHEST_BASE_CHANCE: 0.1,
    LUCK_BONUS_CHANCE: 0.05
};

export const GAME_PHASES = {
    EXPLORE: 'explore',
    BATTLE: 'battle',
    REWARD: 'reward',
    GAME_OVER: 'game_over'
};

export const MESSAGES = {
    STATUS: {
        LEVEL_UP: 'Level up!'
    }
};

export const LUCK_MESSAGES = {
    DEFAULT: [
        'You feel fortune gathering around you.',
        'An unseen hand tilts the odds in your favor.'
    ]
};

export const UI_EVENTS = {
    ACTION_SELECTED: 'ui:action-selected',
    MESSAGE_PUSH: 'ui:message-push'
};

export const LOG_STYLES = {
    DEFAULT: 'log-default',
    EMPHASIS: 'log-emphasis',
    WARNING: 'log-warning',
    ERROR: 'log-error'
};







export const SPEED_SETTINGS = {
    EXTRA_STRIKE_STEP: 5,
    MAX_EXTRA_STRIKES: 5
};

export const FREEZE_SETTINGS = {
    BASE_IMMUNITY_TURNS: 1,
    DEFAULT_RESIST: 0,
    BOSS_RESIST: 0.5
};






