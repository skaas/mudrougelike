import { ACTION_TYPES, EFFECT_TYPES } from '../../constants.js';

export const SKILL_TEMPLATES = {
    [ACTION_TYPES.ATTACK]: {
        type: ACTION_TYPES.ATTACK,
        defaultName: 'Attack',
        effects: [{ type: EFFECT_TYPES.DAMAGE, value: [0.8, 1.2] }]
    },
    [ACTION_TYPES.DEFEND]: {
        type: ACTION_TYPES.DEFEND,
        defaultName: 'Guard',
        effects: [{ type: EFFECT_TYPES.ARMOR, value: [1.0, 1.0] }]
    },
    [ACTION_TYPES.POWER_ATTACK]: {
        type: ACTION_TYPES.POWER_ATTACK,
        defaultName: 'Power Attack',
        effects: [{ type: EFFECT_TYPES.DAMAGE, value: [1.3, 1.6] }]
    },
    [ACTION_TYPES.MULTI_HIT]: {
        type: ACTION_TYPES.MULTI_HIT,
        defaultName: 'Flurry',
        effects: [{ type: EFFECT_TYPES.DAMAGE, value: [0.6, 0.6], hits: 2 }]
    },
    [ACTION_TYPES.SHIELD_BREAK]: {
        type: ACTION_TYPES.SHIELD_BREAK,
        defaultName: 'Shield Break',
        effects: [{ type: EFFECT_TYPES.DAMAGE, value: [1.1, 1.3] }]
    },
    [ACTION_TYPES.DESPERATE_ATTACK]: {
        type: ACTION_TYPES.DESPERATE_ATTACK,
        defaultName: 'Desperate Strike',
        effects: [{ type: EFFECT_TYPES.DAMAGE, value: [1.4, 1.8] }]
    },
    [ACTION_TYPES.ULTIMATE]: {
        type: ACTION_TYPES.ULTIMATE,
        defaultName: 'Ultimate',
        effects: [{ type: EFFECT_TYPES.DAMAGE, value: [1.8, 2.2] }]
    },
    [ACTION_TYPES.MULTI_ATTACK]: {
        type: ACTION_TYPES.MULTI_ATTACK,
        defaultName: 'Whirlwind',
        effects: [{ type: EFFECT_TYPES.DAMAGE, value: [0.5, 0.7], hits: 3 }]
    },
    [ACTION_TYPES.HEAL]: {
        type: ACTION_TYPES.HEAL,
        defaultName: 'Recover',
        effects: [{ type: EFFECT_TYPES.HEAL, value: [0.08, 0.12] }]
    },
    [ACTION_TYPES.MISTAKE]: {
        type: ACTION_TYPES.MISTAKE,
        defaultName: 'Fumble',
        effects: [{ type: EFFECT_TYPES.DAMAGE, value: [0.2, 0.3] }]
    }
};

export const SKILL_VARIANTS = [
    {
        key: 'player.attack.basic',
        type: ACTION_TYPES.ATTACK,
        owner: 'player',
        name: 'Attack',
        weight: 100,
        requirements: { minLevel: 1 }
    },
    {
        key: 'player.defend.guard',
        type: ACTION_TYPES.DEFEND,
        owner: 'player',
        name: 'Guard',
        weight: 80,
        requirements: { minLevel: 1 }
    },
    {
        key: 'player.attack.power',
        type: ACTION_TYPES.POWER_ATTACK,
        owner: 'player',
        name: 'Power Attack',
        weight: 70,
        requirements: { minLevel: 3 }
    },
    {
        key: 'player.attack.flurry',
        type: ACTION_TYPES.MULTI_HIT,
        owner: 'player',
        name: 'Flurry',
        weight: 60,
        requirements: { minLevel: 5 }
    },
    {
        key: 'player.heal.recover',
        type: ACTION_TYPES.HEAL,
        owner: 'player',
        name: 'Recover',
        weight: 40,
        requirements: { minLevel: 4 }
    },
    {
        key: 'enemy.attack.strike',
        type: ACTION_TYPES.ATTACK,
        owner: 'enemy',
        name: 'Strike',
        weight: 60
    },
    {
        key: 'enemy.defend.guard',
        type: ACTION_TYPES.DEFEND,
        owner: 'enemy',
        name: 'Guard',
        weight: 25
    },
    {
        key: 'enemy.attack.shield_break',
        type: ACTION_TYPES.SHIELD_BREAK,
        owner: 'enemy',
        name: 'Piercing Blow',
        weight: 10,
        condition: (actor, target) => Boolean(target && target.armor > 0)
    },
    {
        key: 'enemy.attack.desperate',
        type: ACTION_TYPES.DESPERATE_ATTACK,
        owner: 'enemy',
        name: 'Last Stand',
        weight: 5,
        condition: (actor) => Boolean(actor && actor.hp < actor.maxHp * 0.4)
    },
    {
        key: 'enemy.attack.multi',
        type: ACTION_TYPES.MULTI_ATTACK,
        owner: 'enemy',
        name: 'Ravage',
        weight: 8
    },
    {
        key: 'enemy.attack.mistake',
        type: ACTION_TYPES.MISTAKE,
        owner: 'enemy',
        name: 'Stumble',
        weight: 4
    },
    {
        key: 'enemy.boss.attack',
        type: ACTION_TYPES.ATTACK,
        owner: 'enemy',
        name: 'Heavy Strike',
        weight: 50,
        availability: { bossOnly: true }
    },
    {
        key: 'enemy.boss.multi',
        type: ACTION_TYPES.MULTI_ATTACK,
        owner: 'enemy',
        name: 'Blade Storm',
        weight: 25,
        availability: { bossOnly: true }
    },
    {
        key: 'enemy.boss.ultimate',
        type: ACTION_TYPES.ULTIMATE,
        owner: 'enemy',
        name: 'Judgement',
        weight: 25,
        availability: { bossOnly: true },
        condition: () => true
    }
];

export const ENEMY_PRESETS = {
    default: [
        { key: 'enemy.attack.strike' },
        { key: 'enemy.defend.guard' },
        { key: 'enemy.attack.shield_break' },
        { key: 'enemy.attack.desperate' },
        { key: 'enemy.attack.multi' },
        { key: 'enemy.attack.mistake' }
    ],
    normal: [
        { key: 'enemy.attack.strike', weight: 70 },
        { key: 'enemy.defend.guard', weight: 30 }
    ],
    boss: [
        { key: 'enemy.boss.attack' },
        { key: 'enemy.boss.multi' },
        { key: 'enemy.boss.ultimate' }
    ]
};
