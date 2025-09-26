import { INITIAL_STATS } from '../../constants.js';

const ENEMY_NAME_POOL = [
    'Ashen Zealot',
    'Gloom Stalker',
    'Duskblade Marauder',
    'Hollow Warden',
    'Gravewind Reaver',
    'Emberbound Sniper',
    'Tombshade Acolyte'
];

const BOSS_NAME_POOL = [
    'Cinderborn Sovereign',
    'Umbral High Priest',
    'Ironfang Colossus',
    'Vermillion Monarch'
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const pickFromPool = (pool, index) => pool[index % pool.length];

export function createEnemyTemplate({ stage = 1, encounterIndex = 1, isBoss = false }) {
    const base = INITIAL_STATS.ENEMY;
    const safeStage = Math.max(1, stage);
    const safeEncounter = Math.max(1, encounterIndex);
    const progress = (safeStage - 1) + (safeEncounter - 1);

    const hpMultiplier = 1 + progress * 0.35;
    const attackMultiplier = 1 + progress * 0.28;
    const expMultiplier = 1 + progress * 0.6;

    const bossHpBoost = isBoss ? 1.6 : 1;
    const bossAttackBoost = isBoss ? 1.35 : 1;
    const bossExpBoost = isBoss ? 2.5 : 1.1;

    const maxHp = Math.max(1, Math.floor(base.MAX_HP * hpMultiplier * bossHpBoost));
    const attack = Math.max(1, Math.floor(base.ATTACK * attackMultiplier * bossAttackBoost));
    const armor = clamp(Math.floor((base.ARMOR ?? 0) + progress * 0.3), 0, 60);
    const luck = clamp(base.LUCK + Math.floor(progress / 2) + (isBoss ? 2 : 0), 0, 30);
    const exp = Math.max(1, Math.floor((base.EXP * expMultiplier) * bossExpBoost));

    const name = isBoss
        ? `${safeStage}F ${pickFromPool(BOSS_NAME_POOL, safeStage - 1)}`
        : pickFromPool(ENEMY_NAME_POOL, safeStage + safeEncounter - 2);

    return {
        id: `${safeStage}-${safeEncounter}-${isBoss ? 'boss' : 'mob'}`,
        name,
        hp: maxHp,
        maxHp,
        attack,
        armor,
        luck,
        exp,
        isBoss,
        stage: safeStage,
        level: safeStage + safeEncounter - 1
    };
}

